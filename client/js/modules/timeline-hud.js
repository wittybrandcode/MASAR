/**
 * TIME RULER PRO — client/js/modules/timeline-hud.js
 * Dual-Axis Precision Interactive Timeline HUD Canvas Engine & Scrubbing
 */

var TIME_RULER_TIMELINE_HUD = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var hudHorizontalHits = [];
    var hudVerticalHits = [];

    function updateCornerButton(state) {
        var btn = $('btn-hud-corner');
        if (!btn) return;
        var isVert = (state.orientation === 'vertical');
        btn.innerHTML = '<i class="fa-solid ' + (isVert ? 'fa-arrows-up-down' : 'fa-arrows-left-right') + '"></i><span class="hud-corner-dot"></span>';
        btn.title = isVert 
            ? 'المسار الحالي: عمودي ↕ (انقر للتبديل الفوري إلى أفقي ↔)' 
            : 'المسار الحالي: أفقي ↔ (انقر للتبديل الفوري إلى عمودي ↕)';
    }

    function selectNode(index, state, onSelect) {
        if (!state.nodes || index < 0 || index >= state.nodes.length) return;
        state.selectedNodeIndex = index;

        if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
            TIME_RULER_STATE_STORE.saveState(state);
        }

        renderHorizontalHUD(state);
        renderVerticalHUD(state);

        var cards = document.querySelectorAll('.node-card');
        for (var c = 0; c < cards.length; c++) {
            if (c === index) {
                cards[c].classList.add('node-card--selected');
            } else {
                cards[c].classList.remove('node-card--selected');
            }
        }

        if (typeof onSelect === 'function') onSelect(index);
    }

    function renderHorizontalHUD(state) {
        var canvas = $('timeline-hud-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var dpr = window.devicePixelRatio || 1;
        if (dpr < 1) dpr = 1;

        var parentW = canvas.parentElement ? canvas.parentElement.clientWidth : 400;
        var cssW = parentW;
        var cssH = 38;

        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        if (ctx.resetTransform) ctx.resetTransform();
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, cssW, cssH);
        hudHorizontalHits = [];

        var isH = (state.orientation === 'horizontal');
        var pad = 52;
        var lineY = 19;

        if (isH) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = (state.lineCap === 'round') ? 'round' : 'butt';

            if (state.lineStyle === 'dashed') {
                ctx.setLineDash([7, 4]);
            } else if (state.lineStyle === 'dotted') {
                ctx.setLineDash([2, 4]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            ctx.moveTo(pad, lineY);
            ctx.lineTo(cssW - pad, lineY);
            ctx.stroke();
            ctx.setLineDash([]);

            if (state.startTerminal === 'dot') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(pad - 12, lineY, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.startTerminal === 'arrow') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(pad - 16, lineY);
                ctx.lineTo(pad - 8, lineY - 5);
                ctx.lineTo(pad - 8, lineY + 5);
                ctx.closePath();
                ctx.fill();
            }

            if (state.endTerminal === 'dot') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(cssW - pad + 12, lineY, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.endTerminal === 'arrow') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(cssW - pad + 16, lineY);
                ctx.lineTo(cssW - pad + 8, lineY - 5);
                ctx.lineTo(cssW - pad + 8, lineY + 5);
                ctx.closePath();
                ctx.fill();
            }

            var count = state.nodes.length;
            var span = (cssW - (2 * pad));
            var step = (count > 1) ? (span / (count - 1)) : 0;
            var nodeSize = 24;
            var half = 12;

            for (var i = 0; i < count; i++) {
                var node = state.nodes[i];
                var x = (count === 1) ? (cssW / 2) : (pad + (i * step));
                var y = lineY;
                var isSel = (i === (state.selectedNodeIndex || 0));

                ctx.save();
                var nNum = String(i + 1);

                if (isSel) {
                    var selColor = (node.customColor && node.customColor !== 'inherit') ? node.customColor : '#10b981';
                    var selSize = 26;
                    var selHalf = 13;

                    ctx.fillStyle = selColor;
                    ctx.fillRect(x - selHalf, y - selHalf, selSize, selSize);

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x - selHalf + 0.75, y - selHalf + 0.75, selSize - 1.5, selSize - 1.5);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 13px "Cairo", "Segoe UI", "Consolas", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);

                    hudHorizontalHits.push({ index: i, x: x, y: y, r: selHalf + 2, node: node });
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - half, y - half, nodeSize, nodeSize);

                    ctx.fillStyle = '#000000';
                    ctx.font = '800 13px "Cairo", "Segoe UI", "Consolas", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);

                    hudHorizontalHits.push({ index: i, x: x, y: y, r: half + 2, node: node });
                }
                ctx.restore();
            }

            ctx.save();
            ctx.font = '8px "Cairo", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText((state.length || 1800) + 'px', 4, lineY);
            ctx.restore();

        } else {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(pad, lineY);
            ctx.lineTo(cssW - pad, lineY);
            ctx.stroke();
            ctx.font = '8.5px "Cairo", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('المسار النشط: عمودي ↕ (انظر المسار الجانبي الأيمن)', cssW / 2, lineY);
            ctx.restore();
        }
    }

    function renderVerticalHUD(state) {
        var canvas = $('timeline-hud-vertical-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var dpr = window.devicePixelRatio || 1;
        if (dpr < 1) dpr = 1;

        var parentH = canvas.parentElement ? canvas.parentElement.clientHeight : 350;
        if (parentH < 80) parentH = 350;
        var cssW = 44;
        var cssH = parentH;

        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        if (ctx.resetTransform) ctx.resetTransform();
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, cssW, cssH);
        hudVerticalHits = [];

        var isV = (state.orientation === 'vertical');
        var padY = 32;
        var lineX = 22;

        if (isV) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = (state.lineCap === 'round') ? 'round' : 'butt';

            if (state.lineStyle === 'dashed') {
                ctx.setLineDash([7, 4]);
            } else if (state.lineStyle === 'dotted') {
                ctx.setLineDash([2, 4]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.beginPath();
            ctx.moveTo(lineX, padY);
            ctx.lineTo(lineX, cssH - padY);
            ctx.stroke();
            ctx.setLineDash([]);

            if (state.startTerminal === 'dot') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(lineX, padY - 12, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.startTerminal === 'arrow') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(lineX, padY - 16);
                ctx.lineTo(lineX - 5, padY - 8);
                ctx.lineTo(lineX + 5, padY - 8);
                ctx.closePath();
                ctx.fill();
            }

            if (state.endTerminal === 'dot') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(lineX, cssH - padY + 12, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.endTerminal === 'arrow') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(lineX, cssH - padY + 16);
                ctx.lineTo(lineX - 5, cssH - padY + 8);
                ctx.lineTo(lineX + 5, cssH - padY + 8);
                ctx.closePath();
                ctx.fill();
            }

            var count = state.nodes.length;
            var span = (cssH - (2 * padY));
            var step = (count > 1) ? (span / (count - 1)) : 0;
            var nodeSize = 24;
            var half = 12;

            for (var i = 0; i < count; i++) {
                var node = state.nodes[i];
                var y = (count === 1) ? (cssH / 2) : (padY + (i * step));
                var x = lineX;
                var isSel = (i === (state.selectedNodeIndex || 0));

                ctx.save();
                var nNum = String(i + 1);

                if (isSel) {
                    var selColor = (node.customColor && node.customColor !== 'inherit') ? node.customColor : '#10b981';
                    var selSize = 26;
                    var selHalf = 13;

                    ctx.fillStyle = selColor;
                    ctx.fillRect(x - selHalf, y - selHalf, selSize, selSize);

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x - selHalf + 0.75, y - selHalf + 0.75, selSize - 1.5, selSize - 1.5);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 13px "Cairo", "Segoe UI", "Consolas", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);

                    hudVerticalHits.push({ index: i, x: x, y: y, r: selHalf + 2, node: node });
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x - half, y - half, nodeSize, nodeSize);

                    ctx.fillStyle = '#000000';
                    ctx.font = '800 13px "Cairo", "Segoe UI", "Consolas", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);

                    hudVerticalHits.push({ index: i, x: x, y: y, r: half + 2, node: node });
                }
                ctx.restore();
            }

            ctx.save();
            ctx.font = '8px "Cairo", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText((state.length || 1800) + 'p', lineX, cssH - 2);
            ctx.restore();

        } else {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            for (var ty = padY; ty < cssH - padY; ty += 20) {
                ctx.beginPath();
                ctx.moveTo(lineX - 4, ty);
                ctx.lineTo(lineX + 4, ty);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function renderTimelineHUD(state) {
        updateCornerButton(state);
        renderHorizontalHUD(state);
        renderVerticalHUD(state);
    }

    function initHUDInteractions(state, onOrientationChange, onSelectNode) {
        var canvasH = $('timeline-hud-canvas');
        var canvasV = $('timeline-hud-vertical-canvas');
        var tooltip = $('hud-tooltip');
        var cornerBtn = $('btn-hud-corner');

        if (tooltip) {
            tooltip.className = 'canvas-hud-tooltip u-hidden';
        }

        if (cornerBtn) {
            cornerBtn.addEventListener('click', function () {
                var newOri = (state.orientation === 'horizontal') ? 'vertical' : 'horizontal';
                state.orientation = newOri;

                if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
                    TIME_RULER_STATE_STORE.saveState(state);
                }

                var segOri = $('seg-orientation');
                if (segOri) {
                    segOri.querySelectorAll('button[data-orientation]').forEach(function (btn) {
                        btn.classList.toggle('active', btn.dataset.orientation === newOri);
                    });
                }

                updateCornerButton(state);
                renderTimelineHUD(state);

                if (typeof onOrientationChange === 'function') {
                    onOrientationChange(newOri);
                }
            });
        }

        function setupCanvasInteractive(canvas, hitsGetter) {
            if (!canvas) return;

            canvas.addEventListener('pointermove', function (e) {
                var rect = canvas.getBoundingClientRect();
                var mx = e.clientX - rect.left;
                var my = e.clientY - rect.top;
                var hits = hitsGetter();
                var hovered = null;

                for (var i = 0; i < hits.length; i++) {
                    var h = hits[i];
                    var dx = mx - h.x;
                    var dy = my - h.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= (h.r + 3)) {
                        hovered = h;
                        break;
                    }
                }

                if (hovered && tooltip) {
                    canvas.className = 'canvas-cursor-pointer';
                    var nTitle = hovered.node.title || 'عقدة زمنية';
                    var rawN = hovered.node.number ? String(hovered.node.number).trim() : String(hovered.index + 1);
                    var nNum = rawN.replace(/^0+/, '') || String(hovered.index + 1);
                    tooltip.innerHTML = '<span class="tooltip-accent">#' + nNum + '</span> ' + nTitle;
                    tooltip.classList.remove('u-hidden');
                    tooltip.style.left = (e.clientX + 10) + 'px';
                    tooltip.style.top = (e.clientY - 26) + 'px';
                } else {
                    canvas.className = 'canvas-cursor-default';
                    if (tooltip) tooltip.classList.add('u-hidden');
                }
            });

            canvas.addEventListener('pointerleave', function () {
                canvas.className = 'canvas-cursor-default';
                if (tooltip) tooltip.classList.add('u-hidden');
            });

            canvas.addEventListener('click', function (e) {
                var rect = canvas.getBoundingClientRect();
                var mx = e.clientX - rect.left;
                var my = e.clientY - rect.top;
                var hits = hitsGetter();

                for (var i = 0; i < hits.length; i++) {
                    var h = hits[i];
                    var dx = mx - h.x;
                    var dy = my - h.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= (h.r + 4)) {
                        var tabNodes = document.querySelector('.tab[data-tab="nodes"]');
                        if (tabNodes && !tabNodes.classList.contains('active')) {
                            tabNodes.click();
                        }

                        selectNode(h.index, state, onSelectNode);

                        var cards = document.querySelectorAll('.node-card');
                        if (cards[h.index]) {
                            cards[h.index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                        break;
                    }
                }
            });
        }

        setupCanvasInteractive(canvasH, function () { return hudHorizontalHits; });
        setupCanvasInteractive(canvasV, function () { return hudVerticalHits; });
    }

    function makeScrubbable(labelEl, rangeId, numId, propKey, isFloat, state, onScrub, onEnd) {
        if (!labelEl) return;
        labelEl.classList.add('scrubbable');
        labelEl.title = 'انقر واسحب أفقياً لتعديل القيمة بسرعة (Shift للتسريع، Ctrl للدقة)';

        labelEl.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            var startX = e.clientX;
            var startVal = isFloat ? parseFloat(state[propKey]) : parseInt(state[propKey], 10);
            if (isNaN(startVal)) startVal = 0;

            document.body.classList.add('is-scrubbing');
            if (typeof TIME_RULER_BRIDGE !== 'undefined') {
                TIME_RULER_BRIDGE.callHost('startUndoSession', 'Scrub ' + propKey);
            }

            function onMove(me) {
                var dx = me.clientX - startX;
                var step = isFloat ? 0.2 : 1;
                if (me.shiftKey) step *= 5;
                if (me.ctrlKey || me.metaKey) step *= 0.1;

                var newVal = startVal + (dx * step);
                if (!isFloat) newVal = Math.round(newVal);
                if (newVal < 0 && (propKey !== 'topOffset' && propKey !== 'bottomOffset')) newVal = 0;

                state[propKey] = newVal;
                var rng = $(rangeId); if (rng) rng.value = newVal;
                var num = $(numId); if (num) num.value = newVal;

                renderTimelineHUD(state);
                if (typeof onScrub === 'function') onScrub(propKey, newVal);
            }

            function onUp() {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                document.body.classList.remove('is-scrubbing');
                if (typeof TIME_RULER_BRIDGE !== 'undefined') {
                    TIME_RULER_BRIDGE.callHost('endUndoSession');
                }
                if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
                    TIME_RULER_STATE_STORE.saveState(state);
                }
                if (typeof onEnd === 'function') onEnd(propKey);
            }

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        });
    }

    function initScrubbing(state, onScrub, onEnd) {
        var scrubConfigs = [
            { cell: 'cell-length', rng: 'rng-length', num: 'inp-length', prop: 'length', float: false },
            { cell: 'cell-gap', rng: 'rng-gap', num: 'inp-gap', prop: 'spacingGap', float: false },
            { cell: 'cell-line-w', rng: 'rng-line-w', num: 'inp-line-w', prop: 'lineWidth', float: false },
            { cell: 'cell-dash-size', rng: 'rng-dash-size', num: 'inp-dash-size', prop: 'dashSize', float: false },
            { cell: 'cell-dash-gap', rng: 'rng-dash-gap', num: 'inp-dash-gap', prop: 'dashGap', float: false },
            { cell: 'cell-circ-r', rng: 'rng-circ-r', num: 'inp-circ-r', prop: 'circleRadius', float: false },
            { cell: 'cell-circ-sw', rng: 'rng-circ-sw', num: 'inp-circ-sw', prop: 'circleStrokeWidth', float: false },
            { cell: 'cell-tick-h', rng: 'rng-tick-h', num: 'inp-tick-h', prop: 'tickHeight', float: false },
            { cell: 'cell-tick-w', rng: 'rng-tick-w', num: 'inp-tick-w', prop: 'tickWidth', float: false },
            { cell: 'cell-title-size', rng: 'rng-title-size', num: 'inp-title-size', prop: 'titleFontSize', float: false },
            { cell: 'cell-desc-size', rng: 'rng-desc-size', num: 'inp-desc-size', prop: 'descFontSize', float: true },
            { cell: 'cell-num-size', rng: 'rng-num-size', num: 'inp-num-size', prop: 'numberFontSize', float: false },
            { cell: 'cell-top-offset', rng: 'rng-top-offset', num: 'inp-top-offset', prop: 'topOffset', float: false },
            { cell: 'cell-bot-offset', rng: 'rng-bot-offset', num: 'inp-bot-offset', prop: 'bottomOffset', float: false }
        ];

        scrubConfigs.forEach(function (cfg) {
            var rngEl = $(cfg.rng);
            if (!rngEl) return;
            var cEl = $(cfg.cell) || rngEl.closest('.field-cell');
            if (!cEl) return;
            var lbl = cEl.querySelector('.field-label');
            if (lbl) makeScrubbable(lbl, cfg.rng, cfg.num, cfg.prop, cfg.float, state, onScrub, onEnd);
        });
    }

    return {
        updateCornerButton: updateCornerButton,
        renderHorizontalHUD: renderHorizontalHUD,
        renderVerticalHUD: renderVerticalHUD,
        renderTimelineHUD: renderTimelineHUD,
        selectNode: selectNode,
        initHUDInteractions: initHUDInteractions,
        initScrubbing: initScrubbing,
        makeScrubbable: makeScrubbable
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_TIMELINE_HUD;
}

