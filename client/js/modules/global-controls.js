/**
 * TIME RULER PRO — client/js/modules/global-controls.js
 * Tab 2 Unified Global Controls, Segmented Buttons & Two-Way Parameter Bindings
 */

var TIME_RULER_GLOBAL_CONTROLS = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    function setPairVal(rngId, inpId, val) {
        var r = $(rngId);
        var i = $(inpId);
        if (r) r.value = val;
        if (i) i.value = val;
    }

    function setSegmentActive(containerId, attr, value) {
        var seg = $(containerId);
        if (!seg) return;
        seg.querySelectorAll('.segment-btn, .tb, button[' + attr + ']').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute(attr) === value);
        });
    }

    function bindSliderAndNumber(rangeId, numId, prop, isFloat, debounceMs, state, onUpdate) {
        var rng = $(rangeId);
        var num = $(numId);
        if (!rng || !num) return;

        rng.addEventListener('input', function () {
            var val = isFloat ? parseFloat(rng.value) : parseInt(rng.value, 10);
            num.value = rng.value;
            state[prop] = val;
            if (typeof onUpdate === 'function') onUpdate(debounceMs || 80);
        });

        num.addEventListener('input', function () {
            var val = isFloat ? parseFloat(num.value) : parseInt(num.value, 10);
            rng.value = num.value;
            state[prop] = isNaN(val) ? 0 : val;
            if (typeof onUpdate === 'function') onUpdate(debounceMs || 150);
        });
    }

    function bindColorPicker(inpId, prop, state, onUpdate) {
        var el = $(inpId);
        if (!el) return;
        el.addEventListener('input', function () {
            state[prop] = el.value;
            if (typeof onUpdate === 'function') onUpdate(60);
        });
        el.addEventListener('change', function () {
            state[prop] = el.value;
            if (typeof onUpdate === 'function') onUpdate(0);
        });
    }

    function updateConditionalVisibility(state) {
        var cellLen = $('cell-length');
        var cellGap = $('cell-gap');
        if (state.spacingMode === 'fixed') {
            if (cellLen) cellLen.style.display = 'none';
            if (cellGap) cellGap.style.display = 'flex';
        } else {
            if (cellLen) cellLen.style.display = 'flex';
            if (cellGap) cellGap.style.display = 'none';
        }

        var dashRow = $('row-dash-settings');
        if (dashRow) {
            dashRow.style.display = (state.lineStyle === 'dashed' || state.lineStyle === 'dotted') ? 'grid' : 'none';
        }
        var cellDashSize = $('cell-dash-size');
        if (cellDashSize) {
            cellDashSize.style.display = (state.lineStyle === 'dotted') ? 'none' : 'flex';
        }

        var rowTermCustom = $('row-terminal-custom');
        if (rowTermCustom) {
            var hasTerm = (state.startTerminal && state.startTerminal !== 'none') || (state.endTerminal && state.endTerminal !== 'none');
            rowTermCustom.style.display = hasTerm ? 'flex' : 'none';
        }

        var circGrp = $('circle-settings');
        var tickGrp = $('tick-settings');
        var subHead = $('txt-shape-subhead');
        var lblSize = $('lbl-shape-size');
        var lblFill = $('lbl-shape-fill');
        var lblStroke = $('lbl-shape-stroke');

        var s = state.nodeShape || 'circle';
        var shapeMeta = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(s) : null;
        var sName = shapeMeta ? shapeMeta.name : 'الشكل';

        if (s === 'tick') {
            if (circGrp) circGrp.style.display = 'none';
            if (tickGrp) tickGrp.style.display = 'grid';
        } else {
            if (tickGrp) tickGrp.style.display = 'none';
            if (circGrp) circGrp.style.display = 'grid';

            if (subHead) {
                var thumb = shapeMeta ? TR_SVG_SHAPES.getSvgMarkup(shapeMeta.id, 'currentColor', 14) : '';
                subHead.innerHTML = '<span class="pill-thumb">' + thumb + '</span> <span>تخصيص ' + sName + '</span>';
            }
            if (lblSize) lblSize.innerHTML = '<i class="ph-bold ph-corners-out"></i> الحجم';
            if (lblFill) lblFill.innerHTML = '<i class="ph-bold ph-drop"></i> التعبئة';
            if (lblStroke) lblStroke.innerHTML = '<i class="ph-bold ph-circle"></i> الإطار';

            var fillWrap = $('wrap-circ-fill');
            if (fillWrap) {
                fillWrap.style.display = (shapeMeta && shapeMeta.isHollow) ? 'none' : 'inline-flex';
            }
        }
    }

    function syncFormValues(state) {
        setPairVal('rng-length', 'inp-length', state.length);
        setPairVal('rng-gap', 'inp-gap', state.spacingGap);
        setPairVal('rng-end-margin', 'inp-end-margin', (state.endMargin !== undefined) ? state.endMargin : 60);
        setPairVal('rng-line-w', 'inp-line-w', state.lineWidth);

        setPairVal('rng-dash-size', 'inp-dash-size', state.dashSize || 16);
        setPairVal('rng-dash-gap', 'inp-dash-gap', state.dashGap || 12);

        setPairVal('rng-terminal-size', 'inp-terminal-size', (state.terminalSize !== undefined) ? state.terminalSize : 14);
        var inpTermCol = $('inp-terminal-color'); if (inpTermCol) inpTermCol.value = state.terminalColor || state.lineColor || '#ffffff';
        var wrapTermCol = $('wrap-terminal-color'); if (wrapTermCol) wrapTermCol.style.background = state.terminalColor || state.lineColor || '#ffffff';

        setPairVal('rng-circ-r', 'inp-circ-r', state.circleRadius);
        setPairVal('rng-circ-sw', 'inp-circ-sw', state.circleStrokeWidth);
        setPairVal('rng-tick-h', 'inp-tick-h', state.tickHeight);
        setPairVal('rng-tick-w', 'inp-tick-w', state.tickWidth);

        setPairVal('rng-title-size', 'inp-title-size', state.titleFontSize);
        setPairVal('rng-desc-size', 'inp-desc-size', state.descFontSize);
        setPairVal('rng-num-size', 'inp-num-size', state.numberFontSize);

        setPairVal('rng-top-offset', 'inp-top-offset', state.topOffset);
        setPairVal('rng-bot-offset', 'inp-bot-offset', state.bottomOffset);

        var inpLineCol = $('inp-line-color'); if (inpLineCol) inpLineCol.value = state.lineColor;
        var inpCircFill = $('inp-circ-fill'); if (inpCircFill) inpCircFill.value = state.circleFill;
        var inpCircStr = $('inp-circ-stroke'); if (inpCircStr) inpCircStr.value = state.circleStroke;
        var inpTickCol = $('inp-tick-color'); if (inpTickCol) inpTickCol.value = state.tickColor;
        var inpTitleCol = $('inp-title-color'); if (inpTitleCol) inpTitleCol.value = state.titleColor;
        var inpDescCol = $('inp-desc-color'); if (inpDescCol) inpDescCol.value = state.descColor;
        var inpNumCol = $('inp-num-color'); if (inpNumCol) inpNumCol.value = state.numberColor;

        setSegmentActive('seg-orientation', 'data-orientation', state.orientation);
        setSegmentActive('seg-spacing', 'data-spacing', state.spacingMode);
        setSegmentActive('seg-line-style', 'data-style', state.lineStyle || 'solid');
        setSegmentActive('seg-line-cap', 'data-cap', state.lineCap || 'round');
        setSegmentActive('seg-content-side', 'data-side', state.contentSide || (state.orientation === 'vertical' ? 'left' : 'top'));
        setSegmentActive('seg-text-align', 'data-align', state.textAlign || 'auto');

        setSegmentActive('seg-box-mode', 'data-box-mode', state.boxMode || (state.boxEnabled ? 'solid' : 'off'));

        setPairVal('rng-title-box-radius', 'inp-title-box-radius', (state.titleBoxRadius !== undefined) ? state.titleBoxRadius : (state.boxRadius || 6));
        setPairVal('rng-title-box-fill-op', 'inp-title-box-fill-op', (state.titleBoxFillOpacity !== undefined) ? state.titleBoxFillOpacity : (state.boxFillOpacity || 85));
        var inpTBoxFill = $('inp-title-box-fill-color'); if (inpTBoxFill) inpTBoxFill.value = state.titleBoxFillColor || state.frontBoxFillColor || state.boxFillColor || '#0b1120';
        var inpTBoxStrk = $('inp-title-box-stroke-color'); if (inpTBoxStrk) inpTBoxStrk.value = state.titleBoxStrokeColor || state.frontBoxStrokeColor || state.boxStrokeColor || '#10b981';

        setPairVal('rng-desc-box-radius', 'inp-desc-box-radius', (state.descBoxRadius !== undefined) ? state.descBoxRadius : (state.boxRadius || 6));
        setPairVal('rng-desc-box-fill-op', 'inp-desc-box-fill-op', (state.descBoxFillOpacity !== undefined) ? state.descBoxFillOpacity : (state.boxFillOpacity || 85));
        var inpDBoxFill = $('inp-desc-box-fill-color'); if (inpDBoxFill) inpDBoxFill.value = state.descBoxFillColor || state.frontBoxFillColor || state.boxFillColor || '#0b1120';
        var inpDBoxStrk = $('inp-desc-box-stroke-color'); if (inpDBoxStrk) inpDBoxStrk.value = state.descBoxStrokeColor || '#64748b';

        setPairVal('rng-box-pad-h', 'inp-box-pad-h', (state.boxPaddingH !== undefined) ? state.boxPaddingH : 14);
        setPairVal('rng-box-pad-v', 'inp-box-pad-v', (state.boxPaddingV !== undefined) ? state.boxPaddingV : 6);
        setPairVal('rng-box-stroke-w', 'inp-box-stroke-w', (state.boxStrokeWidth !== undefined) ? state.boxStrokeWidth : 1.5);

        setSegmentActive('seg-start-terminal', 'data-term', state.startTerminal || 'none');
        setSegmentActive('seg-end-terminal', 'data-term', state.endTerminal || 'none');

        var hintBoxMode = $('hint-box-mode');
        if (hintBoxMode) {
            if (state.boxMode === 'glass') {
                hintBoxMode.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <span>النمط العام: «صناديق زجاجية» مفعلة لكافة المحطات (شفافية 25% مع إطار دقيق).</span>';
            } else if (state.boxMode === 'solid') {
                hintBoxMode.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <span>النمط العام: «صناديق صلبة» مفعلة لكافة المحطات (بطاقات مصمتة واضحة).</span>';
            } else {
                hintBoxMode.innerHTML = '<i class="fa-solid fa-circle-info"></i> <span>النمط العام: «بدون صناديق». تخصيص الخصائص أدناه يسري تلقائياً عند تفعيل الصناديق هنا أو بشكل فردي لكل محطة في تبويب «صناديق المنابع».</span>';
            }
        }
        var rowBoxStyling = $('row-box-styling');
        if (rowBoxStyling) {
            rowBoxStyling.style.display = 'flex';
            rowBoxStyling.style.flexDirection = 'column';
            rowBoxStyling.style.gap = '8px';
            rowBoxStyling.style.width = '100%';
        }

        var lblSide1 = $('lbl-side-1');
        var lblSide2 = $('lbl-side-2');
        if (lblSide1 && lblSide2) {
            if (state.orientation === 'horizontal') {
                lblSide1.textContent = 'أعلى';
                lblSide2.textContent = 'أسفل';
            } else {
                lblSide1.textContent = 'يسار';
                lblSide2.textContent = 'يمين';
            }
        }

        setSegmentActive('seg-start-terminal', 'data-term', state.startTerminal || 'none');
        setSegmentActive('seg-end-terminal', 'data-term', state.endTerminal || 'none');

        var selStart = $('sel-start-terminal');
        if (selStart) selStart.value = state.startTerminal || 'none';
        var selEnd = $('sel-end-terminal');
        if (selEnd) selEnd.value = state.endTerminal || 'none';

        if (typeof TR_SVG_SHAPES !== 'undefined') {
            var gObj = TR_SVG_SHAPES.getShapeById(state.nodeShape);
            var gThumb = $('thumb-global-shape');
            if (gThumb) gThumb.innerHTML = TR_SVG_SHAPES.getSvgMarkup(gObj.id, 'currentColor', 18);
            var gName = $('txt-global-shape-name');
            if (gName) gName.textContent = gObj.name;
        }

        var btnLive = $('btn-live-sync');
        if (btnLive) {
            btnLive.classList.toggle('active', state.liveSync);
        }

        updateConditionalVisibility(state);
    }

    function bindAllGlobalControls(state, callbacks) {
        var onLive = function (d) {
            if (callbacks && typeof callbacks.onUpdate === 'function') callbacks.onUpdate(d);
        };

        bindSliderAndNumber('rng-length', 'inp-length', 'length', false, 80, state, onLive);
        bindSliderAndNumber('rng-gap', 'inp-gap', 'spacingGap', false, 80, state, onLive);
        bindSliderAndNumber('rng-end-margin', 'inp-end-margin', 'endMargin', false, 80, state, onLive);
        bindSliderAndNumber('rng-line-w', 'inp-line-w', 'lineWidth', false, 80, state, onLive);

        bindSliderAndNumber('rng-terminal-size', 'inp-terminal-size', 'terminalSize', false, 80, state, onLive);
        bindColorPicker('inp-terminal-color', 'terminalColor', state, onLive);

        bindSliderAndNumber('rng-dash-size', 'inp-dash-size', 'dashSize', false, 80, state, onLive);
        bindSliderAndNumber('rng-dash-gap', 'inp-dash-gap', 'dashGap', false, 80, state, onLive);

        bindSliderAndNumber('rng-circ-r', 'inp-circ-r', 'circleRadius', false, 80, state, onLive);
        bindSliderAndNumber('rng-circ-sw', 'inp-circ-sw', 'circleStrokeWidth', false, 80, state, onLive);
        bindSliderAndNumber('rng-tick-h', 'inp-tick-h', 'tickHeight', false, 80, state, onLive);
        bindSliderAndNumber('rng-tick-w', 'inp-tick-w', 'tickWidth', false, 80, state, onLive);

        bindSliderAndNumber('rng-title-size', 'inp-title-size', 'titleFontSize', false, 80, state, onLive);
        bindSliderAndNumber('rng-desc-size', 'inp-desc-size', 'descFontSize', true, 80, state, onLive);
        bindSliderAndNumber('rng-num-size', 'inp-num-size', 'numberFontSize', false, 80, state, onLive);

        bindSliderAndNumber('rng-top-offset', 'inp-top-offset', 'topOffset', false, 80, state, onLive);
        bindSliderAndNumber('rng-bot-offset', 'inp-bot-offset', 'bottomOffset', false, 80, state, onLive);

        bindColorPicker('inp-line-color', 'lineColor', state, onLive);
        bindColorPicker('inp-circ-fill', 'circleFill', state, onLive);
        bindColorPicker('inp-circ-stroke', 'circleStroke', state, onLive);
        bindColorPicker('inp-tick-color', 'tickColor', state, onLive);
        bindColorPicker('inp-title-color', 'titleColor', state, onLive);
        bindColorPicker('inp-desc-color', 'descColor', state, onLive);
        bindColorPicker('inp-num-color', 'numberColor', state, onLive);

        bindSliderAndNumber('rng-title-box-radius', 'inp-title-box-radius', 'titleBoxRadius', false, 80, state, onLive);
        bindSliderAndNumber('rng-title-box-fill-op', 'inp-title-box-fill-op', 'titleBoxFillOpacity', false, 80, state, onLive);
        bindColorPicker('inp-title-box-fill-color', 'titleBoxFillColor', state, onLive);
        bindColorPicker('inp-title-box-stroke-color', 'titleBoxStrokeColor', state, onLive);

        bindSliderAndNumber('rng-desc-box-radius', 'inp-desc-box-radius', 'descBoxRadius', false, 80, state, onLive);
        bindSliderAndNumber('rng-desc-box-fill-op', 'inp-desc-box-fill-op', 'descBoxFillOpacity', false, 80, state, onLive);
        bindColorPicker('inp-desc-box-fill-color', 'descBoxFillColor', state, onLive);
        bindColorPicker('inp-desc-box-stroke-color', 'descBoxStrokeColor', state, onLive);

        bindSliderAndNumber('rng-behind-box-radius', 'inp-behind-box-radius', 'behindBoxRadius', false, 80, state, onLive);
        bindSliderAndNumber('rng-behind-box-fill-op', 'inp-behind-box-fill-op', 'behindBoxFillOpacity', false, 80, state, onLive);
        bindColorPicker('inp-behind-box-fill-color', 'behindBoxFillColor', state, onLive);
        bindColorPicker('inp-behind-box-stroke-color', 'behindBoxStrokeColor', state, onLive);

        bindSliderAndNumber('rng-box-padding-h', 'inp-box-padding-h', 'boxPaddingH', false, 80, state, onLive);
        bindSliderAndNumber('rng-box-padding-v', 'inp-box-padding-v', 'boxPaddingV', false, 80, state, onLive);
        bindSliderAndNumber('rng-box-pad-h', 'inp-box-pad-h', 'boxPaddingH', false, 80, state, onLive);
        bindSliderAndNumber('rng-box-pad-v', 'inp-box-pad-v', 'boxPaddingV', false, 80, state, onLive);
        bindSliderAndNumber('rng-box-stroke-w', 'inp-box-stroke-w', 'boxStrokeWidth', true, 80, state, onLive);

        // Segmented Control Buttons (Tab 2)
        var segOri = $('seg-orientation');
        if (segOri) {
            segOri.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-orientation]');
                if (!btn || !btn.dataset.orientation) return;
                state.orientation = btn.dataset.orientation;
                setSegmentActive('seg-orientation', 'data-orientation', state.orientation);
                syncFormValues(state);
                onLive(0, true);
            });
        }

        var segSpace = $('seg-spacing');
        if (segSpace) {
            segSpace.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-spacing]');
                if (!btn || !btn.dataset.spacing) return;
                state.spacingMode = btn.dataset.spacing;
                setSegmentActive('seg-spacing', 'data-spacing', state.spacingMode);
                updateConditionalVisibility(state);
                onLive(0, true);
            });
        }

        var segLineStyle = $('seg-line-style');
        if (segLineStyle) {
            segLineStyle.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-style]');
                if (!btn || !btn.dataset.style) return;
                state.lineStyle = btn.dataset.style;
                setSegmentActive('seg-line-style', 'data-style', state.lineStyle);
                updateConditionalVisibility(state);
                onLive(0, false);
            });
        }

        var segLineCap = $('seg-line-cap');
        if (segLineCap) {
            segLineCap.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-cap]');
                if (!btn || !btn.dataset.cap) return;
                state.lineCap = btn.dataset.cap;
                setSegmentActive('seg-line-cap', 'data-cap', state.lineCap);
                onLive(0, false);
            });
        }

        var segSide = $('seg-content-side');
        if (segSide) {
            segSide.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-side]');
                if (!btn) return;
                var side = btn.getAttribute('data-side');
                if (!side) return;
                state.contentSide = side;
                setSegmentActive('seg-content-side', 'data-side', state.contentSide);
                onLive(0, true);
            });
        }

        var segAlign = $('seg-text-align');
        if (segAlign) {
            segAlign.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-align]');
                if (!btn) return;
                var align = btn.getAttribute('data-align');
                if (!align) return;
                state.textAlign = align;
                setSegmentActive('seg-text-align', 'data-align', state.textAlign);
                onLive(0, true);
            });
        }

        var segBoxMode = $('seg-box-mode');
        if (segBoxMode) {
            segBoxMode.addEventListener('click', function (e) {
                var btn = e.target.closest('.segment-btn, .tb, button[data-box-mode]');
                if (!btn) return;
                var mode = btn.getAttribute('data-box-mode');
                if (!mode) return;
                state.boxMode = mode;
                state.boxEnabled = (mode === 'glass' || mode === 'solid');
                if (mode === 'glass') {
                    state.boxFillOpacity = 25;
                    state.boxStrokeWidth = 1.0;
                    state.boxRadius = 6;
                } else if (mode === 'solid') {
                    state.boxFillOpacity = 85;
                    state.boxStrokeWidth = 1.5;
                    state.boxRadius = 6;
                }
                setSegmentActive('seg-box-mode', 'data-box-mode', mode);
                syncFormValues(state);
                onLive(0, true);
            });
        }

        var segStart = $('seg-start-terminal');
        if (segStart) {
            segStart.addEventListener('click', function (e) {
                var btn = e.target.closest('.icon-seg-btn, .tb, button[data-term]');
                if (!btn || !btn.dataset.term) return;
                state.startTerminal = btn.dataset.term;
                setSegmentActive('seg-start-terminal', 'data-term', state.startTerminal);
                var sel = $('sel-start-terminal'); if (sel) sel.value = state.startTerminal;
                updateConditionalVisibility(state);
                onLive(0, false);
            });
        }

        var segEnd = $('seg-end-terminal');
        if (segEnd) {
            segEnd.addEventListener('click', function (e) {
                var btn = e.target.closest('.icon-seg-btn, .tb, button[data-term]');
                if (!btn || !btn.dataset.term) return;
                state.endTerminal = btn.dataset.term;
                setSegmentActive('seg-end-terminal', 'data-term', state.endTerminal);
                var sel = $('sel-end-terminal'); if (sel) sel.value = state.endTerminal;
                updateConditionalVisibility(state);
                onLive(0, false);
            });
        }

        var selStart = $('sel-start-terminal');
        if (selStart) {
            selStart.addEventListener('change', function () {
                state.startTerminal = this.value;
                onLive(0, false);
            });
        }

        var selEnd = $('sel-end-terminal');
        if (selEnd) {
            selEnd.addEventListener('change', function () {
                state.endTerminal = this.value;
                onLive(0, false);
            });
        }

        syncFormValues(state);
    }

    return {
        setPairVal: setPairVal,
        setSegmentActive: setSegmentActive,
        updateConditionalVisibility: updateConditionalVisibility,
        syncFormValues: syncFormValues,
        bindSliderAndNumber: bindSliderAndNumber,
        bindColorPicker: bindColorPicker,
        bindAllGlobalControls: bindAllGlobalControls
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_GLOBAL_CONTROLS;
}

