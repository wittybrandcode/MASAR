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
    var _lastSyncedStateHash = '';
    var _activeCompKey = '';
    var _pendingSyncMeta = null;

    function setCompSyncBanner(meta) {
        _pendingSyncMeta = meta || null;
        var btn = $('btn-sync-from-comp');
        if (!btn) return;
        if (meta) {
            btn.classList.remove('u-hidden');
            btn.title = meta.hasSavedState
                ? ('توجد حالة محفوظة في الكومبوزيشن "' + meta.compName + '" — انقر لاستيرادها')
                : ('توجد طبقات MASAR في "' + meta.compName + '" — انقر لاستنتاج الحالة واستيرادها');
        } else {
            btn.classList.add('u-hidden');
        }
    }

    function setStatus(kind, text) {
        var pill = $('status-pill');
        if (!pill) return;
        pill.className = 'comp-badge ' + (kind || 'nohost');
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
        fb.className = 'feedback' + (kind ? ' ' + kind : '');
        fb.textContent = cleanText;
    }

    function updateButtonLabel() {
        var btn = $('btn-generate');
        var txt = $('txt-gen-btn');
        var titleText = hasRulerInComp 
            ? 'تحديث وتطبيق المسار في After Effects' 
            : 'بناء وتطبيق المسار في After Effects';
        if (btn) btn.title = titleText;
        if (txt) txt.textContent = '';
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
                var compKey = String(cName) + '|' + String(env.data.width || '') + 'x' + String(env.data.height || '');
                var remoteHash = env.data.stateHash || '';
                var hasSaved = (env.data.hasSavedState === true);

                if (!hasRulerInComp) {
                    setCompSyncBanner(null);
                } else if (hasSaved && remoteHash && remoteHash !== _lastSyncedStateHash) {
                    setCompSyncBanner({ compName: cName, stateHash: remoteHash, hasSavedState: true });
                } else if (hasSaved && remoteHash && remoteHash === _lastSyncedStateHash) {
                    setCompSyncBanner(null);
                } else if (!hasSaved && compKey !== _activeCompKey && !_lastSyncedStateHash) {
                    setCompSyncBanner({ compName: cName, stateHash: '', hasSavedState: false });
                }
                _activeCompKey = compKey;

                updateButtonLabel();
                if (typeof callback === 'function') callback(true);
            } else if (env && env.code === 'NO_ACTIVE_COMP') {
                setStatus('nocomp', 'لا توجد كومبوزيشن مفتوحة');
                hasRulerInComp = false;
                setCompSyncBanner(null);
                updateButtonLabel();
                if (typeof callback === 'function') callback(false);
            } else {
                setStatus('nohost', 'فحص الاتصال…');
                setCompSyncBanner(null);
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

    var _pendingLiveScope = null;
    var _SCOPE_RANK = { ctrl: 1, text: 2, boxes: 3, baseline: 4, full: 5 };

    function _defNum(val, fallback) {
        return (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : fallback;
    }

    function _normalizeSide(rawSide, orientation) {
        var s = rawSide || '';
        if (orientation === 'horizontal') {
            if (s === 'left' || !s) return 'top';
            if (s === 'right') return 'bottom';
            return (s === 'top' || s === 'bottom' || s === 'alternate') ? s : 'top';
        }
        if (s === 'top' || !s) return 'left';
        if (s === 'bottom') return 'right';
        return (s === 'left' || s === 'right' || s === 'alternate') ? s : 'left';
    }

    function executeHostGenerate(state, isLiveUpdate, forceRebuildOrOpts, onDone) {
        var forceRebuild = false;
        var dirtyScope = null;

        if (typeof forceRebuildOrOpts === 'function') {
            onDone = forceRebuildOrOpts;
        } else if (typeof forceRebuildOrOpts === 'string') {
            if (forceRebuildOrOpts === 'rebuild') {
                forceRebuild = true;
                dirtyScope = 'full';
            } else {
                dirtyScope = forceRebuildOrOpts;
            }
        } else if (forceRebuildOrOpts && typeof forceRebuildOrOpts === 'object') {
            forceRebuild = !!forceRebuildOrOpts.forceRebuild;
            dirtyScope = forceRebuildOrOpts.dirtyScope || null;
        } else {
            forceRebuild = !!forceRebuildOrOpts;
        }

        if (typeof TIME_RULER_CARD_BUILDER !== 'undefined' && typeof TIME_RULER_CARD_BUILDER.syncStateFromDOM === 'function') {
            try { TIME_RULER_CARD_BUILDER.syncStateFromDOM(); } catch (eSync) {}
        }

        if (dirtyScope === 'ctrl' && !forceRebuild) {
            if (typeof TIME_RULER_BRIDGE === 'undefined') {
                if (typeof onDone === 'function') onDone(false);
                return;
            }
            var ctrlPayload = {
                forceRebuild: false,
                dirtyScope: 'ctrl',
                patchValues: {
                    topOffset: _defNum(state.topOffset, 0),
                    bottomOffset: _defNum(state.bottomOffset, 0),
                    lineWidth: _defNum(state.lineWidth, 4),
                    lineOpacity: _defNum(state.lineOpacity, 100),
                    boxPaddingH: _defNum(state.boxPaddingH, 14),
                    boxPaddingV: _defNum(state.boxPaddingV, 6)
                }
            };
            TIME_RULER_BRIDGE.callHost('generate', ctrlPayload, function (env) {
                if (env && env.ok) {
                    hasRulerInComp = true;
                    if (env.data && env.data.stateHash) {
                        _lastSyncedStateHash = String(env.data.stateHash);
                    }
                    setCompSyncBanner(null);
                    updateButtonLabel();
                    setFeedback('● تحديث فوري للمتحكمات العامة (' + (state.nodes ? state.nodes.length : 0) + ' عقد)', 'ok');
                    if (typeof onDone === 'function') onDone(true);
                    return;
                }
                if (env && env.code === 'CTRL_RIG_MISSING') {
                    executeHostGenerate(state, isLiveUpdate, 'full', onDone);
                    return;
                }
                var err = (env && env.message) ? env.message : 'تعذر تنفيذ التحديث.';
                setFeedback('✕ ' + err, 'err');
                if (typeof onDone === 'function') onDone(false);
            });
            return;
        }

        var store = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE : null;
        var effOrientation = state.orientation || 'vertical';

        var enrichedNodes = (state.nodes || []).map(function (n, idx) {
            if (store) store.normalizeNodeSources(n, idx);
            var clone = {};
            for (var k in n) {
                if (n.hasOwnProperty(k)) clone[k] = n[k];
            }
            if (n.contentSide && n.contentSide !== 'inherit') {
                clone.contentSide = _normalizeSide(n.contentSide, effOrientation);
            } else if (n.contentSide) {
                clone.contentSide = n.contentSide;
            }
            var effShape = (clone.customShape && clone.customShape !== 'inherit') ? clone.customShape : state.nodeShape;
            var effRadius = (clone.customSize !== null && clone.customSize !== undefined && parseFloat(clone.customSize) > 0) ? parseFloat(clone.customSize) : _defNum(state.circleRadius, 24);
            var shapeMeta = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(effShape) : null;
            var effAnchor = clone.customAnchor || (shapeMeta ? shapeMeta.defaultAnchor : 'center') || 'center';
            if (typeof TR_SVG_SHAPES !== 'undefined') {
                var skipSubPaths = (dirtyScope === 'text' || dirtyScope === 'boxes') ||
                    (effAnchor === 'center' && (effShape === 'circle' || effShape === 'ring' || effShape === 'tick'));
                var vData = TR_SVG_SHAPES.computeAeVector(effShape, effRadius, effAnchor);
                if (skipSubPaths && vData) {
                    vData = {
                        shapeId: vData.shapeId,
                        anchorId: vData.anchorId,
                        isHollow: vData.isHollow,
                        bounds: vData.bounds,
                        centerOffset: vData.centerOffset,
                        extent: vData.extent
                    };
                }
                clone.vectorData = vData;
                if (clone.isHollow === undefined && shapeMeta && shapeMeta.isHollow) {
                    clone.isHollow = true;
                }
            }
            clone.sources = JSON.parse(JSON.stringify(n.sources || {}));
            return clone;
        });

        var payload = {
            forceRebuild: forceRebuild,
            dirtyScope: forceRebuild ? 'full' : (dirtyScope || 'full'),
            orientation: effOrientation,
            contentSide: _normalizeSide(state.contentSide, effOrientation),
            textAlign: state.textAlign || 'auto',
            spacingMode: state.spacingMode,
            length: state.length,
            spacingGap: state.spacingGap,
            endMargin: _defNum(state.endMargin, 60),
            lineWidth: state.lineWidth,
            lineColor: state.lineColor,
            lineOpacity: _defNum(state.lineOpacity, 100),

            lineStyle: state.lineStyle || 'solid',
            lineCap: state.lineCap || 'round',
            dashSize: _defNum(state.dashSize, 16),
            dashGap: _defNum(state.dashGap, 12),
            startTerminal: state.startTerminal || 'none',
            endTerminal: state.endTerminal || 'none',
            terminalSize: _defNum(state.terminalSize, Math.max(10, _defNum(state.lineWidth, 4) * 2.5)),
            terminalColor: state.terminalColor || '',

            nodeShape: state.nodeShape,
            circleRadius: _defNum(state.circleRadius, 24),
            circleFill: state.circleFill,
            circleStroke: state.circleStroke,
            circleStrokeWidth: _defNum(state.circleStrokeWidth, 3),

            tickHeight: _defNum(state.tickHeight, 12),
            tickWidth: _defNum(state.tickWidth, 3),
            tickColor: state.tickColor,

            titleFontSize: _defNum(state.titleFontSize, 22),
            titleColor: state.titleColor,
            topOffset: _defNum(state.topOffset, 0),

            descFontSize: _defNum(state.descFontSize, 13),
            descColor: state.descColor,

            numberFontSize: _defNum(state.numberFontSize, 20),
            numberColor: state.numberColor,
            bottomOffset: _defNum(state.bottomOffset, 0),

            boxEnabled: (state.boxEnabled === true || state.boxMode === 'glass' || state.boxMode === 'solid'),
            boxMode: state.boxMode || 'off',

            titleBoxEnabled: (state.titleBoxEnabled !== false),
            titleBoxFillColor: state.titleBoxFillColor || state.boxFillColor || '#0b1120',
            titleBoxFillOpacity: _defNum(state.titleBoxFillOpacity, _defNum(state.boxFillOpacity, 85)),
            titleBoxStrokeColor: state.titleBoxStrokeColor || state.boxStrokeColor || '#10b981',
            titleBoxStrokeWidth: _defNum(state.titleBoxStrokeWidth, _defNum(state.boxStrokeWidth, 1.5)),
            titleBoxRadius: _defNum(state.titleBoxRadius, _defNum(state.boxRadius, 6)),

            descBoxEnabled: (state.descBoxEnabled !== false),
            descBoxFillColor: state.descBoxFillColor || state.boxFillColor || '#0b1120',
            descBoxFillOpacity: _defNum(state.descBoxFillOpacity, _defNum(state.boxFillOpacity, 85)),
            descBoxStrokeColor: state.descBoxStrokeColor || '#64748b',
            descBoxStrokeWidth: _defNum(state.descBoxStrokeWidth, _defNum(state.boxStrokeWidth, 1.5)),
            descBoxRadius: _defNum(state.descBoxRadius, _defNum(state.boxRadius, 6)),

            behindBoxEnabled: (state.behindBoxEnabled !== false),
            behindBoxFillColor: state.behindBoxFillColor || '#1a1408',
            behindBoxFillOpacity: _defNum(state.behindBoxFillOpacity, _defNum(state.boxFillOpacity, 85)),
            behindBoxStrokeColor: state.behindBoxStrokeColor || '#f59e0b',
            behindBoxStrokeWidth: _defNum(state.behindBoxStrokeWidth, _defNum(state.boxStrokeWidth, 1.5)),
            behindBoxRadius: _defNum(state.behindBoxRadius, _defNum(state.boxRadius, 6)),

            boxFillColor: state.boxFillColor || '#0b1120',
            boxFillOpacity: _defNum(state.boxFillOpacity, 85),
            boxStrokeColor: state.boxStrokeColor || '#10b981',
            boxStrokeWidth: _defNum(state.boxStrokeWidth, 1.5),
            boxStrokeOpacity: _defNum(state.boxStrokeOpacity, 90),
            boxRadius: _defNum(state.boxRadius, 6),
            boxPaddingH: _defNum(state.boxPaddingH, 14),
            boxPaddingV: _defNum(state.boxPaddingV, 6),

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
                if (env.data && env.data.stateHash) {
                    _lastSyncedStateHash = String(env.data.stateHash);
                }
                setCompSyncBanner(null);
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

    function requestLiveSync(stateArg, debounceMs, dirtyScope) {
        var state = stateArg;
        var delay = debounceMs;
        var scope = dirtyScope;
        if (typeof stateArg === 'number') {
            scope = debounceMs;
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

        var effScope = (typeof scope === 'string' && _SCOPE_RANK[scope]) ? scope : 'full';
        if (!_pendingLiveScope || _SCOPE_RANK[effScope] > _SCOPE_RANK[_pendingLiveScope]) {
            _pendingLiveScope = effScope;
        }

        if (liveSyncDebounceTimer) {
            clearTimeout(liveSyncDebounceTimer);
        }

        var effDelay = (typeof delay === 'number') ? delay : 250;

        liveSyncDebounceTimer = setTimeout(function () {
            var runScope = _pendingLiveScope || 'full';
            _pendingLiveScope = null;
            executeHostGenerate(state, true, { dirtyScope: runScope });
        }, effDelay);
    }

    function readCompState(callback) {
        if (typeof TIME_RULER_BRIDGE === 'undefined' || !TIME_RULER_BRIDGE.isAvailable()) {
            if (typeof callback === 'function') callback({ ok: false, code: 'NO_HOST', message: 'غير متصل بالبرنامج' });
            return;
        }
        TIME_RULER_BRIDGE.callHost('readCompState', {}, function (env) {
            if (typeof callback === 'function') callback(env);
        });
    }

    function applyCompStateToPanel(targetState, hydratedState, meta) {
        if (!targetState || !hydratedState || typeof hydratedState !== 'object') return false;
        var store = (typeof TIME_RULER_STATE_STORE !== 'undefined') ? TIME_RULER_STATE_STORE : null;
        var keepLiveSync = targetState.liveSync;
        var incoming = JSON.parse(JSON.stringify(hydratedState));
        if (store && typeof store.migrateState === 'function') {
            store.migrateState(incoming);
        }

        if (meta && meta.source === 'inferred') {
            if (incoming.orientation) targetState.orientation = incoming.orientation;
            if (Array.isArray(incoming.nodes) && incoming.nodes.length > 0) {
                targetState.nodes = incoming.nodes;
            }
        } else {
            var defs = (store && typeof store.getDefaultState === 'function') ? store.getDefaultState() : null;
            if (defs) {
                for (var dk in defs) {
                    if (defs.hasOwnProperty(dk) && dk !== 'nodes') {
                        targetState[dk] = defs[dk];
                    }
                }
            }
            for (var k in incoming) {
                if (incoming.hasOwnProperty(k)) {
                    targetState[k] = incoming[k];
                }
            }
        }

        targetState.liveSync = (keepLiveSync !== undefined) ? keepLiveSync : true;
        targetState.selectedNodeIndex = 0;
        if (store && typeof store.migrateState === 'function') {
            store.migrateState(targetState);
        }

        _lastSyncedStateHash = (meta && meta.stateHash) ? String(meta.stateHash) : '';
        setCompSyncBanner(null);

        if (store && typeof store.saveState === 'function') {
            store.saveState(targetState, true, { label: 'مزامنة من الكومبوزيشن', coalesceMs: 0 });
        }
        return true;
    }

    return {
        setStatus: setStatus,
        setFeedback: setFeedback,
        updateCompStatus: updateCompStatus,
        safeUpdateCompStatus: safeUpdateCompStatus,
        updateButtonLabel: updateButtonLabel,
        executeHostGenerate: executeHostGenerate,
        requestLiveSync: requestLiveSync,
        readCompState: readCompState,
        applyCompStateToPanel: applyCompStateToPanel,
        getPendingCompSync: function () { return _pendingSyncMeta; },
        getLastSyncedStateHash: function () { return _lastSyncedStateHash; },
        setLastSyncedStateHash: function (h) { _lastSyncedStateHash = String(h || ''); },
        hasRulerInComp: function () { return hasRulerInComp; },
        setHasRulerInComp: function (val) { hasRulerInComp = !!val; updateButtonLabel(); }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_HOST_BRIDGE;
}

