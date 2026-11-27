/**
 * MASAR PRO — client/js/modules/card-stream-controls.js
 * Reusable Inline Stream Controls: Styling Bar, Box Drawer, Symbol Picker & Badge Presets
 */

var TIME_RULER_CARD_STREAM_CONTROLS = (function () {
    'use strict';

    var styleOpenMap = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

    function isStylePanelOpen(streamObj, prefix) {
        if (!styleOpenMap || !streamObj || typeof streamObj !== 'object') return false;
        var rec = styleOpenMap.get(streamObj);
        return Boolean(rec && rec[prefix || 'main']);
    }

    function setStylePanelOpen(streamObj, prefix, open) {
        if (!styleOpenMap || !streamObj || typeof streamObj !== 'object') return;
        var rec = styleOpenMap.get(streamObj) || {};
        rec[prefix || 'main'] = Boolean(open);
        styleOpenMap.set(streamObj, rec);
    }

    function defaultEscapeHtml(str) {
        if (typeof TIME_RULER_STATE_STORE !== 'undefined' && typeof TIME_RULER_STATE_STORE.escapeHtml === 'function') {
            return TIME_RULER_STATE_STORE.escapeHtml(str);
        }
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createStreamStylingBar(streamLabel, streamTagClass, streamObj, propPrefix, defaults, onUpdate) {
        var cluster = document.createElement('div');
        cluster.className = 'inline-tools-cluster';

        var defs = defaults || {};
        var sizeKey = defs.sizeKey ? defs.sizeKey : (propPrefix ? propPrefix + 'FontSize' : 'fontSize');
        var colorKey = defs.colorKey ? defs.colorKey : (propPrefix ? propPrefix + 'Color' : 'color');
        var boxKey = propPrefix ? propPrefix + 'Box' : 'box';
        var hideBox = Boolean(defs.noBox);
        var curBox = hideBox ? 'inherit' : (streamObj[boxKey] || 'inherit');

        var hasCustom = Boolean(
            (typeof streamObj[sizeKey] === 'number' && streamObj[sizeKey] > 0) ||
            (streamObj[colorKey] && streamObj[colorKey] !== '') ||
            (!hideBox && curBox !== 'inherit')
        );
        var isOpen = Boolean(isStylePanelOpen(streamObj, propPrefix) || hasCustom);

        var btnReveal = document.createElement('button');
        btnReveal.type = 'button';
        btnReveal.className = 'btn-style-reveal' + (isOpen ? ' active' : '') + (hasCustom ? ' has-custom' : '');
        btnReveal.title = 'تنسيق ' + streamLabel + ' (الحجم، اللون، الصندوق)';
        btnReveal.innerHTML = '<i class="fa-solid fa-sliders"></i>' + (hasCustom ? '<span class="style-custom-dot"></span>' : '');

        var toolsGroup = document.createElement('div');
        toolsGroup.className = 'inline-tools-group' + (isOpen ? '' : ' u-hidden');

        btnReveal.addEventListener('click', function (e) {
            e.stopPropagation();
            var nextOpen = toolsGroup.classList.contains('u-hidden');
            setStylePanelOpen(streamObj, propPrefix, nextOpen);
            toolsGroup.classList.toggle('u-hidden', !nextOpen);
            btnReveal.classList.toggle('active', nextOpen);
        });
        cluster.appendChild(btnReveal);

        // 1. Font Size Box (e.g. 22 pt)
        var sizeBox = document.createElement('div');
        sizeBox.className = 'micro-size-box';
        sizeBox.title = 'حجم خط ' + streamLabel + ' (بالنقاط)';
        var inpSize = document.createElement('input');
        inpSize.type = 'number';
        inpSize.min = 8;
        inpSize.max = 120;
        inpSize.value = (typeof streamObj[sizeKey] === 'number' && streamObj[sizeKey] > 0) ? streamObj[sizeKey] : (defaults.fontSize || 22);
        inpSize.addEventListener('change', function (e) {
            var v = parseInt(e.target.value, 10);
            streamObj[sizeKey] = (isNaN(v) || v <= 0) ? undefined : v;
            onUpdate(300, false, 'text');
        });
        sizeBox.appendChild(inpSize);
        var szUnit = document.createElement('span');
        szUnit.className = 'unit';
        szUnit.textContent = 'pt';
        sizeBox.appendChild(szUnit);
        toolsGroup.appendChild(sizeBox);

        // 2. Color Swatch
        var swatch = document.createElement('div');
        swatch.className = 'micro-color-swatch';
        var curColor = streamObj[colorKey] || defaults.color || '#ffffff';
        swatch.style.background = curColor;
        swatch.title = 'لون خط ' + streamLabel;
        var inpColor = document.createElement('input');
        inpColor.type = 'color';
        inpColor.value = curColor;
        inpColor.addEventListener('input', function (e) {
            swatch.style.background = e.target.value;
            streamObj[colorKey] = e.target.value;
            onUpdate(300, false, 'text');
        });
        swatch.appendChild(inpColor);
        toolsGroup.appendChild(swatch);

        // 3. 3-State Icon Box Toggle (skipped when field controls text-only element)
        if (!hideBox) {
            var btnBox = document.createElement('button');
            btnBox.type = 'button';
            btnBox.className = 'btn-box-toggle' + (curBox === 'on' ? ' active' : (curBox === 'off' ? ' disabled' : ''));
            var boxIcon = (curBox === 'on') ? 'fa-solid fa-square' : ((curBox === 'off') ? 'fa-solid fa-ban' : 'fa-regular fa-square');
            var boxTitle = (curBox === 'on')
                ? 'صندوق مخصص ومفعل (انقر للتعطيل)'
                : ((curBox === 'off') ? 'الصندوق معطل تماماً (انقر للعودة لاتباع العام)' : 'صندوق النص: يتبع النمط العام (انقر للتخصيص)');
            btnBox.innerHTML = '<i class="' + boxIcon + '"></i>';
            btnBox.title = boxTitle;
            btnBox.addEventListener('click', function (e) {
                e.stopPropagation();
                var next = (curBox === 'inherit') ? 'on' : ((curBox === 'on') ? 'off' : 'inherit');
                streamObj[boxKey] = next;
                if (next === 'inherit') setStylePanelOpen(streamObj, propPrefix, true);
                onUpdate(0, true, 'boxes');
            });
            toolsGroup.appendChild(btnBox);
        }

        cluster.appendChild(toolsGroup);
        return cluster;
    }

    function createStreamBoxDrawer(streamLabel, streamObj, propPrefix, defaults, onUpdate, escapeFn) {
        var boxKey = propPrefix ? propPrefix + 'Box' : 'box';
        if (streamObj[boxKey] !== 'on') return null;
        var esc = (typeof escapeFn === 'function') ? escapeFn : defaultEscapeHtml;

        var drawer = document.createElement('div');
        drawer.className = 'inline-box-drawer';

        var boxFillKey = propPrefix ? propPrefix + 'BoxColor' : 'boxFillColor';
        var boxStrokeKey = propPrefix ? propPrefix + 'BoxStroke' : 'boxStrokeColor';
        var boxRadKey = propPrefix ? propPrefix + 'BoxRadius' : 'boxRadius';

        var curFill = streamObj[boxFillKey] || defaults.boxFillColor || '#0b1120';
        var curStroke = streamObj[boxStrokeKey] || defaults.boxStrokeColor || '#10b981';
        var curRad = (typeof streamObj[boxRadKey] === 'number') ? streamObj[boxRadKey] : (defaults.boxRadius || 6);

        drawer.innerHTML = '<span class="stream-box-drawer-title"><i class="fa-solid fa-turn-up stream-box-drawer-icon"></i> تخصيص صندوق ' + esc(streamLabel) + ':</span>' +
            '<span class="stream-box-drawer-label">تعبئة:</span>' +
            '<div class="micro-color-swatch sw-fill" style="background: ' + esc(curFill) + ';"><input type="color" class="inp-drw-fill" value="' + esc(curFill) + '"></div>' +
            '<span class="stream-box-drawer-label-spaced">إطار:</span>' +
            '<div class="micro-color-swatch sw-stroke" style="background: ' + esc(curStroke) + ';"><input type="color" class="inp-drw-stroke" value="' + esc(curStroke) + '"></div>' +
            '<span class="stream-box-drawer-label-spaced">زوايا:</span>' +
            '<div class="micro-size-box"><input type="number" class="inp-drw-rad" min="0" max="40" value="' + esc(String(curRad)) + '"><span class="unit">px</span></div>';

        drawer.querySelector('.inp-drw-fill').addEventListener('input', function (e) {
            drawer.querySelector('.sw-fill').style.background = e.target.value;
            streamObj[boxFillKey] = e.target.value;
            onUpdate(300, false, 'boxes');
        });
        drawer.querySelector('.inp-drw-stroke').addEventListener('input', function (e) {
            drawer.querySelector('.sw-stroke').style.background = e.target.value;
            streamObj[boxStrokeKey] = e.target.value;
            onUpdate(300, false, 'boxes');
        });
        drawer.querySelector('.inp-drw-rad').addEventListener('input', function (e) {
            var v = parseInt(e.target.value, 10);
            streamObj[boxRadKey] = isNaN(v) ? 0 : Math.max(0, v);
            onUpdate(300, false, 'boxes');
        });

        return drawer;
    }

    function createSymbolPickerRow(onSelect, onOpenShapes) {
        var row = document.createElement('div');
        row.className = 'symbol-picker-row';
        var lbl = document.createElement('span');
        lbl.className = 'symbol-picker-label';
        lbl.title = 'رموز نصية متوافقة مع التلوين في After Effects';
        lbl.innerHTML = '<i class="fa-solid fa-star"></i>';
        row.appendChild(lbl);
        var symbols = ['★', '✦', '✓', '◆', '●', '▲', '■', '➜', '✚', '⚡', '◎', '◈'];
        symbols.forEach(function (sym) {
            var btnChip = document.createElement('button');
            btnChip.type = 'button';
            btnChip.className = 'btn-symbol-chip';
            btnChip.textContent = sym;
            btnChip.title = 'اختيار رمز: ' + sym;
            btnChip.addEventListener('click', function (e) {
                e.stopPropagation();
                onSelect(sym);
            });
            row.appendChild(btnChip);
        });
        if (typeof onOpenShapes === 'function') {
            var btnVec = document.createElement('button');
            btnVec.type = 'button';
            btnVec.className = 'btn-symbol-vector-hint';
            btnVec.title = 'تغيير الشكل المتجه للعقدة أو استيراد SVG';
            btnVec.innerHTML = '<i class="fa-solid fa-shapes"></i>';
            btnVec.addEventListener('click', function (e) {
                e.stopPropagation();
                onOpenShapes();
            });
            row.appendChild(btnVec);
        }
        return row;
    }

    function createBadgePresetsRow(presets, onSelect) {
        var row = document.createElement('div');
        row.className = 'badge-presets-row';
        var lbl = document.createElement('span');
        lbl.className = 'badge-presets-label';
        lbl.title = 'نماذج شارات جاهزة بنقرة واحدة';
        lbl.innerHTML = '<i class="fa-solid fa-tags"></i>';
        row.appendChild(lbl);
        presets.forEach(function (p) {
            var btnChip = document.createElement('button');
            btnChip.type = 'button';
            btnChip.className = 'btn-badge-chip';
            btnChip.textContent = p;
            btnChip.title = 'تطبيق وسم: ' + p;
            btnChip.addEventListener('click', function (e) {
                e.stopPropagation();
                onSelect(p);
            });
            row.appendChild(btnChip);
        });
        return row;
    }

    return {
        createStreamStylingBar: createStreamStylingBar,
        createStreamBoxDrawer: createStreamBoxDrawer,
        createSymbolPickerRow: createSymbolPickerRow,
        createBadgePresetsRow: createBadgePresetsRow
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_CARD_STREAM_CONTROLS;
}

