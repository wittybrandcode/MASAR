/**
 * TIME RULER PRO — client/js/modules/mogrt-export.js
 * Essential Graphics & One-Click MOGRT Exporter (Phase 3)
 */

var TIME_RULER_MOGRT_EXPORTER = (function () {
    'use strict';

    function notify(msg, type) {
        if (typeof TIME_RULER_HOST_BRIDGE !== 'undefined' && TIME_RULER_HOST_BRIDGE.setFeedback) {
            TIME_RULER_HOST_BRIDGE.setFeedback(msg, type || '');
        }
    }

    function readExportOptions() {
        var c = document.getElementById('chk-mogrt-colors');
        var t = document.getElementById('chk-mogrt-typography');
        var l = document.getElementById('chk-mogrt-layout');
        var b = document.getElementById('chk-mogrt-boxes');
        return {
            colors: c ? Boolean(c.checked) : true,
            typography: t ? Boolean(t.checked) : true,
            layout: l ? Boolean(l.checked) : true,
            boxes: b ? Boolean(b.checked) : true
        };
    }

    function setupEssentialGraphics(onComplete) {
        if (typeof TIME_RULER_BRIDGE === 'undefined') return;
        TIME_RULER_BRIDGE.callHost('setupEssentialGraphics', readExportOptions(), function (res) {
            if (res && res.ok) {
                var count = (res.data && res.data.addedCount) ? res.data.addedCount : 0;
                notify('✓ تم ربط ' + count + ' خاصية بلوحة Essential Graphics بنجاح!', 'ok');
            } else {
                notify('⚠️ ' + (res ? res.message : 'تعذر ربط اللوحة'), 'warn');
            }
            if (typeof onComplete === 'function') onComplete(res);
        });
    }

    function exportMogrtPackage(onComplete) {
        if (typeof TIME_RULER_BRIDGE === 'undefined') return;
        var btnExport = document.getElementById('btn-export-mogrt');
        if (btnExport) {
            btnExport.disabled = true;
            btnExport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التصدير…';
        }

        TIME_RULER_BRIDGE.callHost('exportMOGRT', readExportOptions(), function (res) {
            if (btnExport) {
                btnExport.disabled = false;
                btnExport.innerHTML = '<i class="fa-solid fa-file-export"></i> تصدير حزمة MOGRT كاملة';
            }
            if (res && res.ok && (!res.data || res.data.exported !== false)) {
                var path = (res.data && res.data.path) ? res.data.path : 'المجلد الافتراضي';
                notify('✓ تم تصدير قالب MOGRT بنجاح! المسار: ' + path, 'ok');
            } else {
                var errMsg = (res && res.message) ? res.message : 'تعذر التصدير من After Effects';
                notify('✕ فشل التصدير: ' + errMsg, 'err');
            }
            if (typeof onComplete === 'function') onComplete(res);
        });
    }

    function init() {
        var btnExport = document.getElementById('btn-export-mogrt');
        if (btnExport) {
            btnExport.addEventListener('click', function () {
                exportMogrtPackage();
            });
        }
    }

    return {
        init: init,
        setupEssentialGraphics: setupEssentialGraphics,
        exportMogrtPackage: exportMogrtPackage
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_MOGRT_EXPORTER;
}

