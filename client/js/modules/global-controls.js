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

    function bindSliderAndNumber(rangeId, numId, prop, isFloat, debounceMs, state, onUpdate, scope) {
        var rng = $(rangeId);
        var num = $(numId);
        if (!rng || !num) return;

        rng.addEventListener('input', function () {
            var val = isFloat ? parseFloat(rng.value) : parseInt(rng.value, 10);
            num.value = rng.value;
            state[prop] = val;
            if (typeof onUpdate === 'function') onUpdate(debounceMs || 80, false, scope);
        });

        num.addEventListener('input', function () {
            var val = isFloat ? parseFloat(num.value) : parseInt(num.value, 10);
            rng.value = num.value;
            state[prop] = isNaN(val) ? 0 : val;
            if (typeof onUpdate === 'function') onUpdate(debounceMs || 150, false, scope);
        });
    }

    function bindColorPicker(inpId, prop, state, onUpdate, scope) {
        var el = $(inpId);
        if (!el) return;
        function updateParentSwatch(val) {
            var wrap = el.parentElement;
            if (wrap && (wrap.classList.contains('micro-color-swatch') || wrap.classList.contains('ci-wrap'))) {
                wrap.style.background = val;
            }
        }
        updateParentSwatch(el.value);
        el.addEventListener('input', function () {
            state[prop] = el.value;
            updateParentSwatch(el.value);
            if (typeof onUpdate === 'function') onUpdate(60, false, scope);
        });
        el.addEventListener('change', function () {
            state[prop] = el.value;
            updateParentSwatch(el.value);
            if (typeof onUpdate === 'function') onUpdate(0, false, scope);
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
            dashRow.style.display = (state.lineStyle === 'dashed' || state.lineStyle === 'dotted') ? 'flex' : 'none';
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

        var s = state.nodeShape || 'circle';
        var shapeMeta = (typeof TR_SVG_SHAPES !== 'undefined') ? TR_SVG_SHAPES.getShapeById(s) : null;

        if (s === 'tick') {
            if (circGrp) circGrp.style.display = 'none';
            if (tickGrp) tickGrp.style.display = 'flex';
        } else {
            if (tickGrp) tickGrp.style.display = 'none';
            if (circGrp) circGrp.style.display = 'flex';

            var fillWrap = $('wrap-circ-fill');
            if (fillWrap) {
                fillWrap.style.display = (shapeMeta && shapeMeta.isHollow) ? 'none' : 'inline-flex';
            }
        }
    }

    function normalizeSideForOrientation(side, orientation) {
        if (!side || side === 'inherit') return (orientation === 'vertical') ? 'left' : 'top';
        if (side === 'alternate') return 'alternate';
        if (orientation === 'horizontal') {
            if (side === 'left' || side === 'top') return 'left'; // UI data-side="left" represents Top in horizontal mode
            if (side === 'right' || side === 'bottom') return 'right'; // UI data-side="right" represents Bottom in horizontal mode
        } else {
            if (side === 'top' || side === 'left') return 'left';
            if (side === 'bottom' || side === 'right') return 'right';
        }
        return side;
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

        function syncColorPickerVal(inpId, val) {
            var inp = $(inpId);
            if (!inp) return;
            inp.value = val;
            var wrap = inp.parentElement;
            if (wrap && (wrap.classList.contains('micro-color-swatch') || wrap.classList.contains('ci-wrap'))) {
                wrap.style.background = val;
            }
        }

        syncColorPickerVal('inp-line-color', state.lineColor);
        syncColorPickerVal('inp-circ-fill', state.circleFill);
        syncColorPickerVal('inp-circ-stroke', state.circleStroke);
        syncColorPickerVal('inp-tick-color', state.tickColor);
        syncColorPickerVal('inp-title-color', state.titleColor);
        syncColorPickerVal('inp-desc-color', state.descColor);
        syncColorPickerVal('inp-num-color', state.numberColor || '#059669');

        setSegmentActive('seg-orientation', 'data-orientation', state.orientation);
        setSegmentActive('seg-spacing', 'data-spacing', state.spacingMode);
        setSegmentActive('seg-line-style', 'data-style', state.lineStyle || 'solid');
        setSegmentActive('seg-line-cap', 'data-cap', state.lineCap || 'round');
        var uiSide = normalizeSideForOrientation(state.contentSide, state.orientation);
        setSegmentActive('seg-content-side', 'data-side', uiSide);
        setSegmentActive('seg-text-align', 'data-align', state.textAlign || 'auto');

        setSegmentActive('seg-box-mode', 'data-box-mode', state.boxMode || (state.boxEnabled ? 'solid' : 'off'));

        setPairVal('rng-title-box-radius', 'inp-title-box-radius', (state.titleBoxRadius !== undefined) ? state.titleBoxRadius : (state.boxRadius || 6));
        setPairVal('rng-title-box-fill-op', 'inp-title-box-fill-op', (state.titleBoxFillOpacity !== undefined) ? state.titleBoxFillOpacity : (state.boxFillOpacity || 85));
        syncColorPickerVal('inp-title-box-fill-color', state.titleBoxFillColor || state.boxFillColor || '#0b1120');
        syncColorPickerVal('inp-title-box-stroke-color', state.titleBoxStrokeColor || state.boxStrokeColor || '#10b981');

        setPairVal('rng-desc-box-radius', 'inp-desc-box-radius', (state.descBoxRadius !== undefined) ? state.descBoxRadius : (state.boxRadius || 6));
        setPairVal('rng-desc-box-fill-op', 'inp-desc-box-fill-op', (state.descBoxFillOpacity !== undefined) ? state.descBoxFillOpacity : (state.boxFillOpacity || 85));
        syncColorPickerVal('inp-desc-box-fill-color', state.descBoxFillColor || state.boxFillColor || '#0b1120');
        syncColorPickerVal('inp-desc-box-stroke-color', state.descBoxStrokeColor || '#64748b');

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

        // Update Content Side buttons dynamically for Horizontal (Top/Bottom) vs Vertical (Left/Right)
        var segSide = $('seg-content-side');
        if (segSide) {
            var btnS1 = segSide.querySelector('button[data-side="left"]');
            var btnS2 = segSide.querySelector('button[data-side="right"]');
            if (state.orientation === 'horizontal') {
                if (btnS1) {
                    btnS1.title = 'المحتوى أعلى المسار';
                    var ic1 = btnS1.querySelector('i');
                    if (ic1) ic1.className = 'ph-bold ph-arrow-up';
                }
                if (btnS2) {
                    btnS2.title = 'المحتوى أسفل المسار';
                    var ic2 = btnS2.querySelector('i');
                    if (ic2) ic2.className = 'ph-bold ph-arrow-down';
                }
            } else {
                if (btnS1) {
                    btnS1.title = 'المحتوى يسار المسار';
                    var ic1b = btnS1.querySelector('i');
                    if (ic1b) ic1b.className = 'ph-bold ph-arrow-left';
                }
                if (btnS2) {
                    btnS2.title = 'المحتوى يمين المسار';
                    var ic2b = btnS2.querySelector('i');
                    if (ic2b) ic2b.className = 'ph-bold ph-arrow-right';
                }
            }
        }

        var hudOriLbl = $('hud-orient-label');
        if (hudOriLbl) {
            hudOriLbl.textContent = (state.orientation === 'horizontal') ? 'المسار: أفقي ↔' : 'المسار: عمودي ↕';
        }

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
        if (typeof window.initPropValSpinners === 'function') {
            window.initPropValSpinners();
        }
    }

    function bindAllGlobalControls(state, callbacks) {
        var onLive = function (d, rerender, scope) {
            if (callbacks && typeof callbacks.onUpdate === 'function') callbacks.onUpdate(d, rerender, scope);
        };

        bindSliderAndNumber('rng-length', 'inp-length', 'length', false, 80, state, onLive);
        bindSliderAndNumber('rng-gap', 'inp-gap', 'spacingGap', false, 80, state, onLive);
        bindSliderAndNumber('rng-end-margin', 'inp-end-margin', 'endMargin', false, 80, state, onLive);
        bindSliderAndNumber('rng-line-w', 'inp-line-w', 'lineWidth', false, 80, state, onLive, 'ctrl');

        bindSliderAndNumber('rng-terminal-size', 'inp-terminal-size', 'terminalSize', false, 80, state, onLive);
        bindColorPicker('inp-terminal-color', 'terminalColor', state, onLive);
        var wrapTerm = $('wrap-terminal-color');
        if (wrapTerm) {
            wrapTerm.title = 'لون أطراف المسار (انقر مرتين للاستعادة إلى لون المسار)';
            wrapTerm.addEventListener('dblclick', function (e) {
                e.preventDefault();
                state.terminalColor = '';
                syncFormValues(state);
                onLive(0, false);
            });
        }

        bindSliderAndNumber('rng-dash-size', 'inp-dash-size', 'dashSize', false, 80, state, onLive);
        bindSliderAndNumber('rng-dash-gap', 'inp-dash-gap', 'dashGap', false, 80, state, onLive);

        bindSliderAndNumber('rng-circ-r', 'inp-circ-r', 'circleRadius', false, 80, state, onLive);
        bindSliderAndNumber('rng-circ-sw', 'inp-circ-sw', 'circleStrokeWidth', false, 80, state, onLive);
        bindSliderAndNumber('rng-tick-h', 'inp-tick-h', 'tickHeight', false, 80, state, onLive);
        bindSliderAndNumber('rng-tick-w', 'inp-tick-w', 'tickWidth', false, 80, state, onLive);

        bindSliderAndNumber('rng-title-size', 'inp-title-size', 'titleFontSize', false, 80, state, onLive, 'text');
        bindSliderAndNumber('rng-desc-size', 'inp-desc-size', 'descFontSize', true, 80, state, onLive, 'text');
        bindSliderAndNumber('rng-num-size', 'inp-num-size', 'numberFontSize', false, 80, state, onLive, 'text');

        bindSliderAndNumber('rng-top-offset', 'inp-top-offset', 'topOffset', false, 80, state, onLive, 'ctrl');
        bindSliderAndNumber('rng-bot-offset', 'inp-bot-offset', 'bottomOffset', false, 80, state, onLive, 'ctrl');

        bindColorPicker('inp-line-color', 'lineColor', state, onLive, 'baseline');
        bindColorPicker('inp-circ-fill', 'circleFill', state, onLive, 'full');
        bindColorPicker('inp-circ-stroke', 'circleStroke', state, onLive, 'full');
        bindColorPicker('inp-tick-color', 'tickColor', state, onLive, 'full');
        bindColorPicker('inp-title-color', 'titleColor', state, onLive, 'text');
        bindColorPicker('inp-desc-color', 'descColor', state, onLive, 'text');
        bindColorPicker('inp-num-color', 'numberColor', state, function (d, r, s) {
            var numInputs = document.querySelectorAll('#nodes-container .node-input-num');
            for (var ni = 0; ni < numInputs.length; ni++) {
                if (!numInputs[ni].classList.contains('node-input-badge')) {
                    numInputs[ni].style.color = state.numberColor;
                }
            }
            onLive(d, false, s);
        }, 'text');

        bindSliderAndNumber('rng-title-box-radius', 'inp-title-box-radius', 'titleBoxRadius', false, 80, state, onLive, 'boxes');
        bindSliderAndNumber('rng-title-box-fill-op', 'inp-title-box-fill-op', 'titleBoxFillOpacity', false, 80, state, onLive, 'boxes');
        bindColorPicker('inp-title-box-fill-color', 'titleBoxFillColor', state, onLive, 'boxes');
        bindColorPicker('inp-title-box-stroke-color', 'titleBoxStrokeColor', state, onLive, 'boxes');

        bindSliderAndNumber('rng-desc-box-radius', 'inp-desc-box-radius', 'descBoxRadius', false, 80, state, onLive, 'boxes');
        bindSliderAndNumber('rng-desc-box-fill-op', 'inp-desc-box-fill-op', 'descBoxFillOpacity', false, 80, state, onLive, 'boxes');
        bindColorPicker('inp-desc-box-fill-color', 'descBoxFillColor', state, onLive, 'boxes');
        bindColorPicker('inp-desc-box-stroke-color', 'descBoxStrokeColor', state, onLive, 'boxes');

        bindSliderAndNumber('rng-box-pad-h', 'inp-box-pad-h', 'boxPaddingH', false, 80, state, onLive, 'ctrl');
        bindSliderAndNumber('rng-box-pad-v', 'inp-box-pad-v', 'boxPaddingV', false, 80, state, onLive, 'ctrl');
        (function () {
            var rngSW = $('rng-box-stroke-w');
            var inpSW = $('inp-box-stroke-w');
            function applyGlobalStrokeW(val) {
                var w = isNaN(val) ? 1.5 : Math.max(0, val);
                state.boxStrokeWidth = w;
                state.titleBoxStrokeWidth = w;
                state.descBoxStrokeWidth = w;
                state.behindBoxStrokeWidth = w;
                onLive(80, false, 'boxes');
            }
            if (rngSW && inpSW) {
                rngSW.addEventListener('input', function () {
                    inpSW.value = rngSW.value;
                    applyGlobalStrokeW(parseFloat(rngSW.value));
                });
                inpSW.addEventListener('input', function () {
                    rngSW.value = inpSW.value;
                    applyGlobalStrokeW(parseFloat(inpSW.value));
                });
            }
        })();

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
                if (typeof window.initPropValSpinners === 'function') {
                    window.initPropValSpinners();
                }
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
                if (typeof window.initPropValSpinners === 'function') {
                    window.initPropValSpinners();
                }
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
                var rawSide = btn.getAttribute('data-side');
                if (!rawSide) return;
                if (state.orientation === 'horizontal') {
                    state.contentSide = (rawSide === 'left') ? 'top' : ((rawSide === 'right') ? 'bottom' : 'alternate');
                } else {
                    state.contentSide = rawSide;
                }
                setSegmentActive('seg-content-side', 'data-side', rawSide);
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
                    state.titleBoxFillOpacity = 25;
                    state.descBoxFillOpacity = 25;
                    state.behindBoxFillOpacity = 25;
                    state.boxStrokeWidth = 1.0;
                    state.titleBoxStrokeWidth = 1.0;
                    state.descBoxStrokeWidth = 1.0;
                    state.behindBoxStrokeWidth = 1.0;
                    state.boxRadius = 6;
                    state.titleBoxRadius = 6;
                    state.descBoxRadius = 6;
                    state.behindBoxRadius = 6;
                } else if (mode === 'solid') {
                    state.boxFillOpacity = 85;
                    state.titleBoxFillOpacity = 85;
                    state.descBoxFillOpacity = 85;
                    state.behindBoxFillOpacity = 85;
                    state.boxStrokeWidth = 1.5;
                    state.titleBoxStrokeWidth = 1.5;
                    state.descBoxStrokeWidth = 1.5;
                    state.behindBoxStrokeWidth = 1.5;
                    state.boxRadius = 6;
                    state.titleBoxRadius = 6;
                    state.descBoxRadius = 6;
                    state.behindBoxRadius = 6;
                }
                setSegmentActive('seg-box-mode', 'data-box-mode', mode);
                syncFormValues(state);
                onLive(0, true, 'boxes');
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
        if (typeof window.initPropValSpinners === 'function') {
            window.initPropValSpinners();
        }
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
        if (typeof window.initPropValSpinners === 'function') {
            window.initPropValSpinners();
        }
                onLive(0, false);
            });
        }

        var selStart = $('sel-start-terminal');
        if (selStart) {
            selStart.addEventListener('change', function () {
                state.startTerminal = this.value;
                setSegmentActive('seg-start-terminal', 'data-term', state.startTerminal);
                updateConditionalVisibility(state);
                onLive(0, false);
            });
        }

        var selEnd = $('sel-end-terminal');
        if (selEnd) {
            selEnd.addEventListener('change', function () {
                state.endTerminal = this.value;
                setSegmentActive('seg-end-terminal', 'data-term', state.endTerminal);
                updateConditionalVisibility(state);
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

