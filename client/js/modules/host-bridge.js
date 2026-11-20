/**
 * TIME RULER PRO — client/js/modules/host-bridge.js
 * After Effects CSInterface Bridge, Debounced Live Sync & Layer Generation
 */

var TIME_RULER_HOST_BRIDGE = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var hasRulerInComp = false;
    var liveSyncDebounceTimer = null;
    var lastStatusCheckTime = 0;

    function setStatus(kind, text) {
        var pill = $('status-pill');
        if (!pill) return;
        pill.className = 'telemetry-box ' + kind;
        var nameSpan = $('telemetry-name');
        if (nameSpan) {
            nameSpan.textContent = text;
        } else {
            pill.textContent = text;
        }
    }

    function setFeedback(text, kind) {
        var fb = $('feedback-line');
        if (!fb) return;
        var cleanText = text;
        if (typeof cleanText === 'string') {
            if (cleanText.indexOf('CSInterface') !== -1 || cleanText.indexOf('not running inside After Effects') !== -1) {
                cleanText = 'غير متصل بـ After Effects';
            }
        }
        fb.className = 'feedback' + (kind ? ' feedback--' + kind : '');
        fb.textContent = cleanText;
    }

    function updateButtonLabel() {
        var txt = $('txt-gen-btn');
        if (!txt) return;
        if (hasRulerInComp) {
            txt.textContent = 'تحديث المسار في AFTER EFFECTS';
        } else {
            txt.textContent = 'بناء المسار في AFTER EFFECTS';
        }
    }

    function updateCompStatus(callback) {
        if (typeof TIME_RULER_BRIDGE === 'undefined' || !TIME_RULER_BRIDGE.isAvailable()) {
            setStatus('nohost', 'غير متصل بالبرنامج');
            if (typeof callback === 'function') callback(false);
            return;
        }
        TIME_RULER_BRIDGE.callHost('getActiveCompInfo', {}, function (env) {
            if (env && env.ok && env.data) {
                var cName = env.data.name || env.data.compName || 'Comp 1';
                setStatus('connected', 'متصل · ' + cName);
                hasRulerInComp = (env.data.hasRuler === true);
                updateButtonLabel();
                if (typeof callback === 'function') callback(true);
            } else if (env && env.code === 'NO_ACTIVE_COMP') {
                setStatus('nocomp', 'لا توجد كومبوزيشن مفتوحة');
                hasRulerInComp = false;
                updateButtonLabel();
                if (typeof callback === 'function') callback(false);
            } else {
                setStatus('nohost', 'فحص الاتصال…');
                if (typeof callback === 'function') callback(false);
            }
        });
    }

    function safeUpdateCompStatus(force, callback) {
        var now = Date.now();
        if (!force && (now - lastStatusCheckTime < 3500)) {
            if (typeof callback === 'function') callback();
            return;
        }
        var activeEl = document.activeElement;
        if (!force && activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            if (typeof callback === 'function') callback();
            return;
        }
        lastStatusCheckTime = now;
        updateCompStatus(callback);
    }

    function executeHostGenerate(state, isLiveUpdate, forceRebuild, onDone) {
        if (typeof forceRebuild === 'function') {
            onDone = forceRebuild;
            forceRebuild = false;
        }

        if (typeof TIME_RULER_CARD_BUILDER !== 'undefined' && typeof TIME_RULER_CARD_BUILDER.syncStateFromDOM === 'function') {
            try { TIME_RULER_CARD_BUILDER.syncStateFromDOM(); } catch (eSync) {}
        }

        var store = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE : null;

        var enrichedNodes = (state.nodes || []).map(function (n, idx) {
            if (store) store.normalizeNodeSources(n, idx);
            var clone = {};
            for (var k in n) {
                if (n.hasOwnProperty(k)) clone[k] = n[k];
            }
            if (n.contentSide) clone.contentSide = n.contentSide;
            var effShape = (clone.customShape && clone.customShape !== 'inherit') ? clone.customShape : state.nodeShape;
            var effRadius = (clone.customSize && parseFloat(clone.customSize) > 0) ? parseFloat(clone.customSize) : state.circleRadius;
            var shapeMeta = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(effShape) : null;
            var effAnchor = clone.customAnchor || (shapeMeta ? shapeMeta.defaultAnchor : 'center') || 'center';
            if (typeof TR_SVG_SHAPES !== 'undefined') {
                clone.vectorData = TR_SVG_SHAPES.computeAeVector(effShape, effRadius, effAnchor);
            }
            clone.sources = JSON.parse(JSON.stringify(n.sources || {}));
            return clone;
        });

        var payload = {
            forceRebuild: (forceRebuild === true),
            orientation: state.orientation,
            contentSide: state.contentSide || (state.orientation === 'vertical' ? 'left' : 'top'),
            textAlign: state.textAlign || 'auto',
            spacingMode: state.spacingMode,
            length: state.length,
            spacingGap: state.spacingGap,
            lineWidth: state.lineWidth,
            lineColor: state.lineColor,

            lineStyle: state.lineStyle || 'solid',
            lineCap: state.lineCap || 'round',
            dashSize: state.dashSize || 16,
            dashGap: state.dashGap || 12,
            startTerminal: state.startTerminal || 'none',
            endTerminal: state.endTerminal || 'none',
            terminalSize: Math.max(10, (state.lineWidth || 4) * 2.5),

            nodeShape: state.nodeShape,
            circleRadius: state.circleRadius,
            circleFill: state.circleFill,
            circleStroke: state.circleStroke,
            circleStrokeWidth: state.circleStrokeWidth,

            tickHeight: state.tickHeight,
            tickWidth: state.tickWidth,
            tickColor: state.tickColor,

            titleFontSize: state.titleFontSize,
            titleColor: state.titleColor,
            topOffset: state.topOffset,

            descFontSize: state.descFontSize,
            descColor: state.descColor,

            numberFontSize: state.numberFontSize,
            numberColor: state.numberColor,
            bottomOffset: state.bottomOffset,

            boxEnabled: (state.boxEnabled === true || state.boxMode === 'glass' || state.boxMode === 'solid'),
            boxMode: state.boxMode || 'off',

            titleBoxEnabled: (state.titleBoxEnabled !== false),
            titleBoxFillColor: state.titleBoxFillColor || state.frontBoxFillColor || state.boxFillColor || '#0b1120',
            titleBoxFillOpacity: (state.titleBoxFillOpacity !== undefined) ? state.titleBoxFillOpacity : (state.boxFillOpacity || 85),
            titleBoxStrokeColor: state.titleBoxStrokeColor || state.frontBoxStrokeColor || state.boxStrokeColor || '#10b981',
            titleBoxStrokeWidth: (state.titleBoxStrokeWidth !== undefined) ? state.titleBoxStrokeWidth : (state.boxStrokeWidth || 1.5),
            titleBoxRadius: (state.titleBoxRadius !== undefined) ? state.titleBoxRadius : (state.boxRadius || 6),

            descBoxEnabled: (state.descBoxEnabled !== false),
            descBoxFillColor: state.descBoxFillColor || state.frontBoxFillColor || state.boxFillColor || '#0b1120',
            descBoxFillOpacity: (state.descBoxFillOpacity !== undefined) ? state.descBoxFillOpacity : (state.boxFillOpacity || 85),
            descBoxStrokeColor: state.descBoxStrokeColor || '#64748b',
            descBoxStrokeWidth: (state.descBoxStrokeWidth !== undefined) ? state.descBoxStrokeWidth : (state.boxStrokeWidth || 1.5),
            descBoxRadius: (state.descBoxRadius !== undefined) ? state.descBoxRadius : (state.boxRadius || 6),

            behindBoxEnabled: (state.behindBoxEnabled !== false),
            behindBoxFillColor: state.behindBoxFillColor || '#1a1408',
            behindBoxFillOpacity: (state.behindBoxFillOpacity !== undefined) ? state.behindBoxFillOpacity : (state.boxFillOpacity || 85),
            behindBoxStrokeColor: state.behindBoxStrokeColor || '#f59e0b',
            behindBoxStrokeWidth: (state.behindBoxStrokeWidth !== undefined) ? state.behindBoxStrokeWidth : (state.boxStrokeWidth || 1.5),
            behindBoxRadius: (state.behindBoxRadius !== undefined) ? state.behindBoxRadius : (state.boxRadius || 6),

            frontBoxEnabled: (state.frontBoxEnabled !== false),
            frontBoxFillColor: state.frontBoxFillColor || state.boxFillColor || '#0b1120',
            frontBoxFillOpacity: (state.frontBoxFillOpacity !== undefined) ? state.frontBoxFillOpacity : (state.boxFillOpacity || 85),
            frontBoxStrokeColor: state.frontBoxStrokeColor || state.boxStrokeColor || '#10b981',
            frontBoxStrokeWidth: (state.frontBoxStrokeWidth !== undefined) ? state.frontBoxStrokeWidth : (state.boxStrokeWidth || 1.5),
            frontBoxRadius: (state.frontBoxRadius !== undefined) ? state.frontBoxRadius : (state.boxRadius || 6),

            boxFillColor: state.boxFillColor || '#0b1120',
            boxFillOpacity: (state.boxFillOpacity !== undefined) ? state.boxFillOpacity : 85,
            boxStrokeColor: state.boxStrokeColor || '#10b981',
            boxStrokeWidth: (state.boxStrokeWidth !== undefined) ? state.boxStrokeWidth : 1.5,
            boxStrokeOpacity: (state.boxStrokeOpacity !== undefined) ? state.boxStrokeOpacity : 90,
            boxRadius: (state.boxRadius !== undefined) ? state.boxRadius : 6,
            boxPaddingH: (state.boxPaddingH !== undefined) ? state.boxPaddingH : 14,
            boxPaddingV: (state.boxPaddingV !== undefined) ? state.boxPaddingV : 6,

            nodes: enrichedNodes
        };

        if (!isLiveUpdate) {
            setFeedback(forceRebuild ? 'جاري إعادة بناء وتوسيط مسار الخط الزمني…' : 'جاري تطبيق التعديل الموضعي في After Effects…', '');
        }

        if (typeof TIME_RULER_BRIDGE === 'undefined') {
            if (typeof onDone === 'function') onDone(false);
            return;
        }

        TIME_RULER_BRIDGE.callHost('generate', payload, function (env) {
            if (env && env.ok) {
                hasRulerInComp = true;
                updateButtonLabel();
                var msg = isLiveUpdate
                    ? '● مزامنة حية نشطة (' + state.nodes.length + ' عقد)'
                    : '✓ تم تطبيق وتحديث مسار الخط الزمني بنجاح (' + state.nodes.length + ' عقد)!';
                setFeedback(msg, 'ok');
            } else {
                var err = (env && env.message) ? env.message : 'تعذر تنفيذ التحديث.';
                setFeedback('✕ ' + err, 'err');
            }
            if (typeof onDone === 'function') onDone(env && env.ok);
        });
    }

    function requestLiveSync(stateArg, debounceMs) {
        var state = stateArg;
        var delay = debounceMs;
        if (typeof stateArg === 'number') {
            delay = stateArg;
            state = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE.getState() : null;
        } else if (!state) {
            state = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE.getState() : null;
        }
        if (!state || !state.liveSync) return;
        if (typeof TIME_RULER_CARD_BUILDER !== 'undefined' && typeof TIME_RULER_CARD_BUILDER.syncStateFromDOM === 'function') {
            try { TIME_RULER_CARD_BUILDER.syncStateFromDOM(); } catch (eSync) {}
        }
        if (!hasRulerInComp) return;

        if (liveSyncDebounceTimer) {
            clearTimeout(liveSyncDebounceTimer);
        }

        var effDelay = (typeof delay === 'number') ? delay : 250;

        liveSyncDebounceTimer = setTimeout(function () {
            executeHostGenerate(state, true);
        }, effDelay);
    }

    return {
        setStatus: setStatus,
        setFeedback: setFeedback,
        updateCompStatus: updateCompStatus,
        safeUpdateCompStatus: safeUpdateCompStatus,
        updateButtonLabel: updateButtonLabel,
        executeHostGenerate: executeHostGenerate,
        requestLiveSync: requestLiveSync,
        hasRulerInComp: function () { return hasRulerInComp; },
        setHasRulerInComp: function (val) { hasRulerInComp = !!val; updateButtonLabel(); }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_HOST_BRIDGE;
}

