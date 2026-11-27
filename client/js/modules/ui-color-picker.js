/**
 * MASAR PRO — client/js/modules/ui-color-picker.js
 * Studio HSV Color Picker Modal (Sharp 0px Spectrum Design, Live Sync & Recent Swatches)
 */

var TIME_RULER_COLOR_PICKER = (function () {
    'use strict';

    var RECENT_STORAGE_KEY = 'masar_recent_colors_v1';
    var MAX_RECENT = 8;
    var CURATED_SWATCHES = [
        '#10b981', '#34d399', '#059669', '#06b6d4', '#3b82f6', '#6366f1',
        '#8b5cf6', '#f43f5e', '#ef4444', '#f59e0b', '#eab308', '#ffffff',
        '#cbd5e1', '#64748b', '#1e293b', '#0b1120', '#000000'
    ];

    var state = {
        h: 160,
        s: 91,
        v: 73,
        initialHex: '#10b981',
        currentHex: '#10b981',
        targetInput: null,
        onInputCb: null,
        onConfirmCb: null,
        onCancelCb: null,
        isOpen: false,
        bound: false,
        draggingCanvas: false
    };

    function $(id) {
        return (typeof document !== 'undefined' && document.getElementById) ? document.getElementById(id) : null;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function normalizeHex(raw) {
        if (!raw) return null;
        var s = String(raw).trim().replace(/^#/, '');
        if (/^[0-9a-fA-F]{3}$/.test(s)) {
            s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
        }
        if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
        return '#' + s.toLowerCase();
    }

    function hexToRgb(hex) {
        var norm = normalizeHex(hex) || '#000000';
        var clean = norm.slice(1);
        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        function toH(n) {
            var h = clamp(Math.round(n), 0, 255).toString(16);
            return h.length === 1 ? '0' + h : h;
        }
        return '#' + toH(r) + toH(g) + toH(b);
    }

    function hsvToRgb(h, s, v) {
        var hue = ((h % 360) + 360) % 360;
        var sat = clamp(s, 0, 100) / 100;
        var val = clamp(v, 0, 100) / 100;
        var c = val * sat;
        var x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        var m = val - c;
        var r = 0, g = 0, b = 0;

        if (hue < 60) { r = c; g = x; b = 0; }
        else if (hue < 120) { r = x; g = c; b = 0; }
        else if (hue < 180) { r = 0; g = c; b = x; }
        else if (hue < 240) { r = 0; g = x; b = c; }
        else if (hue < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    function rgbToHsv(r, g, b) {
        var rn = clamp(r, 0, 255) / 255;
        var gn = clamp(g, 0, 255) / 255;
        var bn = clamp(b, 0, 255) / 255;
        var max = Math.max(rn, gn, bn);
        var min = Math.min(rn, gn, bn);
        var d = max - min;
        var h = 0;
        var s = max === 0 ? 0 : d / max;
        var v = max;

        if (max !== min) {
            if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
            else if (max === gn) h = (bn - rn) / d + 2;
            else h = (rn - gn) / d + 4;
            h /= 6;
        }
        return {
            h: h * 360,
            s: s * 100,
            v: v * 100
        };
    }

    function getRecentColors() {
        try {
            if (typeof localStorage === 'undefined') return [];
            var raw = localStorage.getItem(RECENT_STORAGE_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(arr)) return [];
            return arr.map(normalizeHex).filter(Boolean).slice(0, MAX_RECENT);
        } catch (e) {
            return [];
        }
    }

    function pushRecentColor(hex) {
        var norm = normalizeHex(hex);
        if (!norm) return;
        try {
            if (typeof localStorage === 'undefined') return;
            var list = getRecentColors().filter(function (c) { return c !== norm; });
            list.unshift(norm);
            localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
        } catch (e) {
            // ignore storage errors
        }
    }

    function drawSvCanvas() {
        var canvas = $('cp-sv-canvas');
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var w = canvas.width || 280;
        var h = canvas.height || 145;
        var pureRgb = hsvToRgb(state.h, 100, 100);
        var pureHex = rgbToHex(pureRgb.r, pureRgb.g, pureRgb.b);

        ctx.clearRect(0, 0, w, h);

        var gradH = ctx.createLinearGradient(0, 0, w, 0);
        gradH.addColorStop(0, '#ffffff');
        gradH.addColorStop(1, pureHex);
        ctx.fillStyle = gradH;
        ctx.fillRect(0, 0, w, h);

        var gradV = ctx.createLinearGradient(0, 0, 0, h);
        gradV.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradV.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = gradV;
        ctx.fillRect(0, 0, w, h);
    }

    function updateCursorPosition() {
        var cursor = $('cp-sv-cursor');
        if (!cursor) return;
        cursor.style.left = clamp(state.s, 0, 100) + '%';
        cursor.style.top = clamp(100 - state.v, 0, 100) + '%';
    }

    function dispatchInputToTarget(hex, eventName) {
        var inp = state.targetInput;
        if (!inp) return;
        inp.value = hex;
        if (inp.parentElement && (inp.parentElement.classList.contains('ci-wrap') || inp.parentElement.classList.contains('micro-color-swatch'))) {
            inp.parentElement.style.background = hex;
        }
        try {
            if (typeof Event === 'function' && inp.dispatchEvent) {
                inp.dispatchEvent(new Event(eventName, { bubbles: true }));
            }
        } catch (e) {
            // fallback for non-DOM test mocks
        }
    }

    function renderDisplays(emitLive) {
        var rgb = hsvToRgb(state.h, state.s, state.v);
        var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        state.currentHex = hex;

        var currSw = $('cp-curr-swatch');
        if (currSw) currSw.style.background = hex;

        var prevSw = $('cp-prev-swatch');
        if (prevSw) prevSw.style.background = state.initialHex;

        var inpHex = $('cp-inp-hex');
        if (inpHex && (typeof document === 'undefined' || document.activeElement !== inpHex)) {
            inpHex.value = hex.slice(1).toUpperCase();
        }

        var inpR = $('cp-inp-r');
        var inpG = $('cp-inp-g');
        var inpB = $('cp-inp-b');
        if (inpR) inpR.value = rgb.r;
        if (inpG) inpG.value = rgb.g;
        if (inpB) inpB.value = rgb.b;

        var hueSl = $('cp-hue-slider');
        if (hueSl) hueSl.value = Math.round(state.h);
        var hueDeg = $('cp-hue-deg');
        if (hueDeg) hueDeg.textContent = Math.round(state.h) + '°';

        updateCursorPosition();

        if (emitLive) {
            dispatchInputToTarget(hex, 'input');
            if (typeof state.onInputCb === 'function') {
                state.onInputCb(hex);
            }
        }
    }

    function setColorFromHex(hex, emitLive) {
        var norm = normalizeHex(hex);
        if (!norm) return false;
        var rgb = hexToRgb(norm);
        var hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        if (hsv.s > 0) state.h = hsv.h;
        state.s = hsv.s;
        state.v = hsv.v;
        drawSvCanvas();
        renderDisplays(Boolean(emitLive));
        return true;
    }

    function renderSwatchesRow(containerEl, list, activeHex) {
        if (!containerEl || typeof document === 'undefined') return;
        containerEl.innerHTML = '';
        list.forEach(function (col) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cp-swatch-tile' + (col === activeHex ? ' active' : '');
            btn.style.background = col;
            btn.title = col.toUpperCase();
            btn.addEventListener('click', function () {
                setColorFromHex(col, true);
                renderSwatchGroups();
            });
            containerEl.appendChild(btn);
        });
    }

    function renderSwatchGroups() {
        renderSwatchesRow($('cp-preset-swatches'), CURATED_SWATCHES, state.currentHex);
        var recent = getRecentColors();
        var recentWrap = $('cp-recent-wrap');
        if (recentWrap && recentWrap.classList) {
            recentWrap.classList.toggle('u-hidden', recent.length === 0);
        }
        if (recent.length > 0) {
            renderSwatchesRow($('cp-recent-swatches'), recent, state.currentHex);
        }
    }

    function handleCanvasPointer(clientX, clientY) {
        var canvas = $('cp-sv-canvas');
        if (!canvas || !canvas.getBoundingClientRect) return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = clamp((clientX - rect.left) / rect.width, 0, 1);
        var y = clamp((clientY - rect.top) / rect.height, 0, 1);
        state.s = x * 100;
        state.v = (1 - y) * 100;
        renderDisplays(true);
    }

    function closeModal(commit) {
        var modal = $('modal-color-picker');
        state.isOpen = false;
        state.draggingCanvas = false;
        if (modal) modal.style.display = 'none';

        if (commit) {
            pushRecentColor(state.currentHex);
            dispatchInputToTarget(state.currentHex, 'change');
            if (typeof state.onConfirmCb === 'function') state.onConfirmCb(state.currentHex);
        } else {
            dispatchInputToTarget(state.initialHex, 'input');
            if (typeof state.onCancelCb === 'function') state.onCancelCb(state.initialHex);
        }

        state.targetInput = null;
        state.onInputCb = null;
        state.onConfirmCb = null;
        state.onCancelCb = null;
    }

    function bindEventsOnce() {
        if (state.bound || typeof document === 'undefined') return;
        var modal = $('modal-color-picker');
        if (!modal) return;
        state.bound = true;

        if ($('btn-close-color-modal')) $('btn-close-color-modal').addEventListener('click', function () { closeModal(false); });
        if ($('cp-btn-cancel')) $('cp-btn-cancel').addEventListener('click', function () { closeModal(false); });
        if ($('cp-btn-ok')) $('cp-btn-ok').addEventListener('click', function () { closeModal(true); });
        if ($('cp-btn-reset')) {
            $('cp-btn-reset').addEventListener('click', function () {
                setColorFromHex(state.initialHex, true);
                renderSwatchGroups();
            });
        }
        if ($('cp-prev-swatch')) {
            $('cp-prev-swatch').addEventListener('click', function () {
                setColorFromHex(state.initialHex, true);
                renderSwatchGroups();
            });
        }

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal(false);
        });

        var canvas = $('cp-sv-canvas');
        if (canvas) {
            canvas.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                state.draggingCanvas = true;
                handleCanvasPointer(e.clientX, e.clientY);
            });
        }

        if (typeof window !== 'undefined' && window.addEventListener) {
            var stopDrag = function () { state.draggingCanvas = false; };
            window.addEventListener('pointermove', function (e) {
                if (!state.draggingCanvas) return;
                handleCanvasPointer(e.clientX, e.clientY);
            });
            window.addEventListener('pointerup', stopDrag);
            window.addEventListener('pointercancel', stopDrag);
            window.addEventListener('blur', stopDrag);
        }

        var hueSl = $('cp-hue-slider');
        if (hueSl) {
            hueSl.addEventListener('input', function (e) {
                state.h = clamp(parseInt(e.target.value, 10) || 0, 0, 360);
                drawSvCanvas();
                renderDisplays(true);
            });
        }

        var inpHex = $('cp-inp-hex');
        if (inpHex) {
            inpHex.addEventListener('input', function (e) {
                var norm = normalizeHex(e.target.value);
                if (norm) setColorFromHex(norm, true);
            });
            inpHex.addEventListener('blur', function () {
                inpHex.value = state.currentHex.slice(1).toUpperCase();
            });
            inpHex.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    closeModal(true);
                }
            });
        }

        function onRgbInput() {
            var r = clamp(parseInt(($('cp-inp-r') || {}).value, 10) || 0, 0, 255);
            var g = clamp(parseInt(($('cp-inp-g') || {}).value, 10) || 0, 0, 255);
            var b = clamp(parseInt(($('cp-inp-b') || {}).value, 10) || 0, 0, 255);
            var hex = rgbToHex(r, g, b);
            setColorFromHex(hex, true);
        }
        ['cp-inp-r', 'cp-inp-g', 'cp-inp-b'].forEach(function (id) {
            var el = $(id);
            if (!el) return;
            el.addEventListener('input', onRgbInput);
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    closeModal(true);
                }
            });
        });

        var btnCopy = $('cp-btn-copy');
        if (btnCopy) {
            btnCopy.addEventListener('click', function () {
                var hexText = state.currentHex.toUpperCase();
                try {
                    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(hexText);
                    } else if (inpHex) {
                        inpHex.select();
                        document.execCommand('copy');
                    }
                } catch (e) {
                    // ignore clipboard blocks
                }
                btnCopy.classList.add('copied');
                setTimeout(function () { btnCopy.classList.remove('copied'); }, 900);
            });
        }

        document.addEventListener('keydown', function (e) {
            if (!state.isOpen) return;
            if (e.key === 'Escape' || e.keyCode === 27) {
                if (e.preventDefault) e.preventDefault();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                else if (e.stopPropagation) e.stopPropagation();
                closeModal(false);
            }
        });
    }

    function openColorPicker(opts) {
        var o = opts || {};
        var modal = $('modal-color-picker');
        if (!modal) return false;

        bindEventsOnce();

        var initHex = normalizeHex(o.color) || '#10b981';
        state.initialHex = initHex;
        state.currentHex = initHex;
        state.targetInput = o.targetInput || null;
        state.onInputCb = o.onInput || null;
        state.onConfirmCb = o.onConfirm || null;
        state.onCancelCb = o.onCancel || null;

        var subEl = $('cp-modal-subtitle');
        if (subEl) subEl.textContent = o.title ? ('— ' + o.title) : '';

        setColorFromHex(initHex, false);
        renderSwatchGroups();

        state.isOpen = true;
        modal.style.display = 'flex';
        return true;
    }

    function bindGlobalNativeInterceptor() {
        if (typeof document === 'undefined' || !document.addEventListener) return;
        document.addEventListener('click', function (e) {
            var target = e.target;
            var colorInp = null;
            if (target && target.tagName === 'INPUT' && target.type === 'color') {
                colorInp = target;
            } else if (target && target.closest) {
                var wrap = target.closest('.ci-wrap, .micro-color-swatch');
                if (wrap) colorInp = wrap.querySelector('input[type="color"]');
            }
            if (!colorInp || colorInp.disabled) return;
            if (!$('modal-color-picker')) return;

            e.preventDefault();
            e.stopPropagation();

            var title = colorInp.title || (colorInp.parentElement && colorInp.parentElement.title) || 'تحديد اللون';
            openColorPicker({
                color: colorInp.value || '#10b981',
                title: title,
                targetInput: colorInp
            });
        }, true);
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindGlobalNativeInterceptor);
        } else {
            bindGlobalNativeInterceptor();
        }
    }

    return {
        openColorPicker: openColorPicker,
        closeColorPicker: closeModal,
        hsvToRgb: hsvToRgb,
        rgbToHsv: rgbToHsv,
        hexToRgb: hexToRgb,
        rgbToHex: rgbToHex,
        normalizeHex: normalizeHex,
        CURATED_SWATCHES: CURATED_SWATCHES
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_COLOR_PICKER;
}
