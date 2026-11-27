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
            TIME_RULER_STATE_STORE.saveState(state, false, { skipHistory: true });
        }

        renderHorizontalHUD(state);
        renderVerticalHUD(state);

        var cards = document.querySelectorAll('.node-card');
        for (var c = 0; c < cards.length; c++) {
            if (c === index) {
                cards[c].classList.add('node-card--selected', 'selected');
            } else {
                cards[c].classList.remove('node-card--selected', 'selected');
            }
        }

        if (typeof onSelect === 'function') onSelect(index);
    }

    function computeHudEffectiveLength(state, count) {
        if (state.spacingMode === 'fixed') {
            var em = (typeof state.endMargin === 'number') ? state.endMargin : 60;
            var gap = (typeof state.spacingGap === 'number' && state.spacingGap > 0) ? state.spacingGap : 250;
            return Math.max(100, (2 * em) + Math.max(0, count - 1) * gap);
        }
        return Math.max(1, (typeof state.length === 'number' && state.length > 0) ? state.length : 1500);
    }

    function resolveHudLabel(node, index) {
        if (node && node.sources && node.sources.center) {
            var cs = node.sources.center;
            if (cs.type === 'none') return '·';
            if ((cs.type === 'icon' || cs.type === 'shape_icon') && (cs.icon || cs.value)) {
                return String(cs.icon || cs.value).slice(0, 2);
            }
            if (cs.value !== undefined && cs.value !== null && String(cs.value).trim() !== '') {
                var raw = String(cs.value).trim();
                return raw.length > 4 ? raw.slice(0, 4) : raw;
            }
        }
        if (node && node.number !== undefined && node.number !== null && String(node.number).trim() !== '') {
            return String(node.number).trim().slice(0, 4);
        }
        return String(index + 1);
    }

    function renderHorizontalHUD(state) {
        var isH = (state.orientation === 'horizontal');
        var strip = $('hud-horizontal-strip');
        if (strip && strip.classList) {
            strip.classList.toggle('is-vertical', !isH);
        }

        var canvas = $('timeline-hud-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!isH) {
            hudHorizontalHits = [];
            return;
        }

        var dpr = window.devicePixelRatio || 1;
        if (dpr < 1) dpr = 1;

        var parentW = canvas.parentElement ? canvas.parentElement.clientWidth : 400;
        var cssW = Math.max(120, parentW);
        var cssH = 38;

        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        if (ctx.resetTransform) ctx.resetTransform();
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, cssW, cssH);
        hudHorizontalHits = [];

        var pad = 52;
        var lineY = 19;

        if (isH) {
            ctx.strokeStyle = state.lineColor || '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = (state.lineCap === 'round') ? 'round' : ((state.lineCap === 'projecting') ? 'square' : 'butt');

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

            var termCol = state.terminalColor || state.lineColor || '#ffffff';
            if (state.startTerminal === 'dot') {
                ctx.fillStyle = termCol;
                ctx.beginPath();
                ctx.arc(pad - 12, lineY, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.startTerminal === 'arrow') {
                ctx.fillStyle = termCol;
                ctx.beginPath();
                ctx.moveTo(pad - 16, lineY);
                ctx.lineTo(pad - 8, lineY - 5);
                ctx.lineTo(pad - 8, lineY + 5);
                ctx.closePath();
                ctx.fill();
            } else if (state.startTerminal === 'bar') {
                ctx.strokeStyle = termCol;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(pad - 6, lineY - 6);
                ctx.lineTo(pad - 6, lineY + 6);
                ctx.stroke();
            }

            if (state.endTerminal === 'dot') {
                ctx.fillStyle = termCol;
                ctx.beginPath();
                ctx.arc(cssW - pad + 12, lineY, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.endTerminal === 'arrow') {
                ctx.fillStyle = termCol;
                ctx.beginPath();
                ctx.moveTo(cssW - pad + 16, lineY);
                ctx.lineTo(cssW - pad + 8, lineY - 5);
                ctx.lineTo(cssW - pad + 8, lineY + 5);
                ctx.closePath();
                ctx.fill();
            } else if (state.endTerminal === 'bar') {
                ctx.strokeStyle = termCol;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(cssW - pad + 6, lineY - 6);
                ctx.lineTo(cssW - pad + 6, lineY + 6);
                ctx.stroke();
            }

            var count = state.nodes.length;
            var effLen = computeHudEffectiveLength(state, count);
            var hudMargin = (typeof state.endMargin === 'number') ? Math.min((cssW - 2 * pad) * 0.4, Math.round((state.endMargin / effLen) * (cssW - 2 * pad))) : 0;
            var startX = pad + hudMargin;
            var endX = cssW - pad - hudMargin;
            var span = Math.max(0, endX - startX);
            var step = (count > 1) ? (span / (count - 1)) : 0;
            var nodeSize = 24;
            var half = 12;

            for (var i = 0; i < count; i++) {
                var node = state.nodes[i];
                var x = (count === 1) ? (cssW / 2) : (startX + (i * step));
                var y = lineY;
                var isSel = (i === (state.selectedNodeIndex || 0));

                ctx.save();
                var nNum = resolveHudLabel(node, i);

                if (isSel) {
                    var selColor = (node.customColor && node.customColor !== 'inherit') ? node.customColor : (state.circleFill || '#10b981');
                    var selSize = 26;
                    var selHalf = 13;

                    ctx.fillStyle = selColor;
                    ctx.fillRect(x - selHalf, y - selHalf, selSize, selSize);

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x - selHalf + 0.75, y - selHalf + 0.75, selSize - 1.5, selSize - 1.5);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 12px "Cairo", "Segoe UI", "Consolas", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);

                    hudHorizontalHits.push({ index: i, x: x, y: y, r: selHalf + 2, node: node });
                } else {
                    ctx.fillStyle = (node.customColor && node.customColor !== 'inherit') ? node.customColor : '#ffffff';
                    ctx.fillRect(x - half, y - half, nodeSize, nodeSize);

                    ctx.fillStyle = '#000000';
                    ctx.font = '800 12px "Cairo", "Segoe UI", "Consolas", sans-serif';
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
            ctx.fillText(Math.round(effLen) + 'px', 4, lineY);
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
            ctx.strokeStyle = state.lineColor || '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = (state.lineCap === 'round') ? 'round' : ((state.lineCap === 'projecting') ? 'square' : 'butt');

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

            var termColY = state.terminalColor || state.lineColor || '#ffffff';
            if (state.startTerminal === 'dot') {
                ctx.fillStyle = termColY;
                ctx.beginPath();
                ctx.arc(lineX, padY - 12, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.startTerminal === 'arrow') {
                ctx.fillStyle = termColY;
                ctx.beginPath();
                ctx.moveTo(lineX, padY - 16);
                ctx.lineTo(lineX - 5, padY - 8);
                ctx.lineTo(lineX + 5, padY - 8);
                ctx.closePath();
                ctx.fill();
            } else if (state.startTerminal === 'bar') {
                ctx.strokeStyle = termColY;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(lineX - 6, padY - 6);
                ctx.lineTo(lineX + 6, padY - 6);
                ctx.stroke();
            }

            if (state.endTerminal === 'dot') {
                ctx.fillStyle = termColY;
                ctx.beginPath();
                ctx.arc(lineX, cssH - padY + 12, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (state.endTerminal === 'arrow') {
                ctx.fillStyle = termColY;
                ctx.beginPath();
                ctx.moveTo(lineX, cssH - padY + 16);
                ctx.lineTo(lineX - 5, cssH - padY + 8);
                ctx.lineTo(lineX + 5, cssH - padY + 8);
                ctx.closePath();
                ctx.fill();
            } else if (state.endTerminal === 'bar') {
                ctx.strokeStyle = termColY;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(lineX - 6, cssH - padY + 6);
                ctx.lineTo(lineX + 6, cssH - padY + 6);
                ctx.stroke();
            }

            var count = state.nodes.length;
            var effLenY = computeHudEffectiveLength(state, count);
            var hudMarginY = (typeof state.endMargin === 'number') ? Math.min((cssH - 2 * padY) * 0.4, Math.round((state.endMargin / effLenY) * (cssH - 2 * padY))) : 0;
            var startY = padY + hudMarginY;
            var endY = cssH - padY - hudMarginY;
            var span = Math.max(0, endY - startY);
            var step = (count > 1) ? (span / (count - 1)) : 0;
            var nodeSize = 24;
            var half = 12;

            for (var i = 0; i < count; i++) {
                var node = state.nodes[i];
                var y = (count === 1) ? (cssH / 2) : (startY + (i * step));
                var x = lineX;
                var isSel = (i === (state.selectedNodeIndex || 0));

                ctx.save();
                var nNum = resolveHudLabel(node, i);

                if (isSel) {
                    var selColor = (node.customColor && node.customColor !== 'inherit') ? node.customColor : (state.circleFill || '#10b981');
                    var selSize = 26;
                    var selHalf = 13;

                    ctx.fillStyle = selColor;
                    ctx.fillRect(x - selHalf, y - selHalf, selSize, selSize);

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x - selHalf + 0.75, y - selHalf + 0.75, selSize - 1.5, selSize - 1.5);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 12px "Cairo", "Segoe UI", "Consolas", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(nNum, x, y + 0.5);

                    hudVerticalHits.push({ index: i, x: x, y: y, r: selHalf + 2, node: node });
                } else {
                    ctx.fillStyle = (node.customColor && node.customColor !== 'inherit') ? node.customColor : '#ffffff';
                    ctx.fillRect(x - half, y - half, nodeSize, nodeSize);

                    ctx.fillStyle = '#000000';
                    ctx.font = '800 12px "Cairo", "Segoe UI", "Consolas", sans-serif';
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
            ctx.fillText(Math.round(effLenY) + 'p', lineX, cssH - 2);
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
                if (newOri === 'horizontal' && (state.contentSide === 'left' || state.contentSide === 'right')) {
                    state.contentSide = (state.contentSide === 'left') ? 'top' : 'bottom';
                } else if (newOri === 'vertical' && (state.contentSide === 'top' || state.contentSide === 'bottom')) {
                    state.contentSide = (state.contentSide === 'top') ? 'left' : 'right';
                }

                if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
                    TIME_RULER_STATE_STORE.saveState(state, false, { label: 'تغيير اتجاه المسار', coalesceMs: 0 });
                }

                if (typeof TIME_RULER_GLOBAL_CONTROLS !== 'undefined' && TIME_RULER_GLOBAL_CONTROLS.syncFormValues) {
                    TIME_RULER_GLOBAL_CONTROLS.syncFormValues(state);
                } else {
                    var segOri = $('seg-orientation');
                    if (segOri) {
                        segOri.querySelectorAll('button[data-orientation]').forEach(function (btn) {
                            btn.classList.toggle('active', btn.dataset.orientation === newOri);
                        });
                    }
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
                    var nTitle = (hovered.node.sources && hovered.node.sources.front && hovered.node.sources.front.title)
                        || hovered.node.title || 'عقدة زمنية';
                    var rawN = resolveHudLabel(hovered.node, hovered.index);
                    var nNum = rawN.replace(/^0+/, '') || String(hovered.index + 1);
                    tooltip.textContent = '';
                    var accSpan = document.createElement('span');
                    accSpan.className = 'tooltip-accent';
                    accSpan.textContent = '#' + nNum;
                    tooltip.appendChild(accSpan);
                    tooltip.appendChild(document.createTextNode(' ' + nTitle));
                    tooltip.classList.remove('u-hidden');
                    tooltip.style.display = 'block';
                    var tipW = tooltip.offsetWidth || 120;
                    var tipH = tooltip.offsetHeight || 24;
                    var winW = window.innerWidth || 400;
                    var winH = window.innerHeight || 600;
                    var leftPos = Math.max(8, Math.min(winW - tipW - 8, e.clientX - tipW - 10 >= 8 && canvas === canvasV ? (e.clientX - tipW - 10) : (e.clientX + 10)));
                    var topPos = Math.max(8, Math.min(winH - tipH - 8, e.clientY - 26));
                    tooltip.style.left = leftPos + 'px';
                    tooltip.style.top = topPos + 'px';
                } else {
                    canvas.className = 'canvas-cursor-default';
                    if (tooltip) {
                        tooltip.classList.add('u-hidden');
                        tooltip.style.display = 'none';
                    }
                }
            });

            canvas.addEventListener('pointerleave', function () {
                canvas.className = 'canvas-cursor-default';
                if (tooltip) {
                    tooltip.classList.add('u-hidden');
                    tooltip.style.display = 'none';
                }
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

        if (typeof ResizeObserver !== 'undefined') {
            var ro = new ResizeObserver(function () {
                renderTimelineHUD(state);
            });
            if (canvasH && canvasH.parentElement) ro.observe(canvasH.parentElement);
            if (canvasV && canvasV.parentElement) ro.observe(canvasV.parentElement);
        }
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { renderTimelineHUD(state); });
        }
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

            var numEl = $(numId);
            var rngEl = $(rangeId);
            var rawMin = (numEl && numEl.min !== '') ? parseFloat(numEl.min) : ((rngEl && rngEl.min !== '') ? parseFloat(rngEl.min) : -Infinity);
            var rawMax = (numEl && numEl.max !== '') ? parseFloat(numEl.max) : ((rngEl && rngEl.max !== '') ? parseFloat(rngEl.max) : Infinity);
            var minLimit = (!isNaN(rawMin)) ? rawMin : ((propKey === 'topOffset' || propKey === 'bottomOffset') ? -150 : 0);
            var maxLimit = (!isNaN(rawMax)) ? rawMax : Infinity;

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
                else newVal = Math.round(newVal * 10) / 10;

                if (newVal < minLimit) newVal = minLimit;
                if (newVal > maxLimit) newVal = maxLimit;

                state[propKey] = newVal;
                if (rngEl) rngEl.value = newVal;
                if (numEl) numEl.value = newVal;

                renderTimelineHUD(state);
                if (typeof onScrub === 'function') onScrub(propKey, newVal);
            }

            function onUp() {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                window.removeEventListener('pointercancel', onUp);
                window.removeEventListener('blur', onUp);
                document.body.classList.remove('is-scrubbing');
                if (typeof TIME_RULER_BRIDGE !== 'undefined') {
                    TIME_RULER_BRIDGE.callHost('endUndoSession');
                }
                if (typeof TIME_RULER_STATE_STORE !== 'undefined') {
                    TIME_RULER_STATE_STORE.saveState(state, false, { label: 'تحريك ' + propKey, coalesceMs: 0 });
                }
                if (typeof onEnd === 'function') onEnd(propKey);
            }

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
            window.addEventListener('blur', onUp);
        });
    }

    function initScrubbing(state, onScrub, onEnd) {
        var scrubConfigs = [
            { cell: 'cell-length', rng: 'rng-length', num: 'inp-length', prop: 'length', float: false },
            { cell: 'cell-gap', rng: 'rng-gap', num: 'inp-gap', prop: 'spacingGap', float: false },
            { cell: 'cell-end-margin', rng: 'rng-end-margin', num: 'inp-end-margin', prop: 'endMargin', float: false },
            { cell: 'cell-line-w', rng: 'rng-line-w', num: 'inp-line-w', prop: 'lineWidth', float: false },
            { cell: 'cell-dash-size', rng: 'rng-dash-size', num: 'inp-dash-size', prop: 'dashSize', float: false },
            { cell: 'cell-dash-gap', rng: 'rng-dash-gap', num: 'inp-dash-gap', prop: 'dashGap', float: false },
            { cell: 'cell-terminal-size', rng: 'rng-terminal-size', num: 'inp-terminal-size', prop: 'terminalSize', float: false },
            { cell: 'cell-circ-r', rng: 'rng-circ-r', num: 'inp-circ-r', prop: 'circleRadius', float: false },
            { cell: 'cell-circ-sw', rng: 'rng-circ-sw', num: 'inp-circ-sw', prop: 'circleStrokeWidth', float: false },
            { cell: 'cell-tick-h', rng: 'rng-tick-h', num: 'inp-tick-h', prop: 'tickHeight', float: false },
            { cell: 'cell-tick-w', rng: 'rng-tick-w', num: 'inp-tick-w', prop: 'tickWidth', float: false },
            { cell: 'cell-title-size', rng: 'rng-title-size', num: 'inp-title-size', prop: 'titleFontSize', float: false },
            { cell: 'cell-desc-size', rng: 'rng-desc-size', num: 'inp-desc-size', prop: 'descFontSize', float: true },
            { cell: 'cell-num-size', rng: 'rng-num-size', num: 'inp-num-size', prop: 'numberFontSize', float: false },
            { cell: 'cell-top-offset', rng: 'rng-top-offset', num: 'inp-top-offset', prop: 'topOffset', float: false },
            { cell: 'cell-bot-offset', rng: 'rng-bot-offset', num: 'inp-bot-offset', prop: 'bottomOffset', float: false },
            { cell: 'cell-box-pad-h', rng: 'rng-box-pad-h', num: 'inp-box-pad-h', prop: 'boxPaddingH', float: false },
            { cell: 'cell-box-pad-v', rng: 'rng-box-pad-v', num: 'inp-box-pad-v', prop: 'boxPaddingV', float: false }
        ];

        scrubConfigs.forEach(function (cfg) {
            var rngEl = $(cfg.rng);
            if (!rngEl) return;
            var cEl = $(cfg.cell) || rngEl.closest('.prop-row, .field-cell');
            if (!cEl) return;
            var lbl = cEl.querySelector('.prop-lbl, .field-label');
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

