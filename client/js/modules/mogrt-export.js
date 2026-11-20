/**
 * TIME RULER PRO — client/js/modules/mogrt-export.js
 * Essential Graphics & One-Click MOGRT Exporter (Phase 3)
 */

var TIME_RULER_MOGRT_EXPORTER = (function () {
    'use strict';

    function setupEssentialGraphics(onComplete) {
        if (typeof TIME_RULER_BRIDGE === 'undefined') return;
        var btnSetup = document.getElementById('btn-setup-eg');
        if (btnSetup) {
            btnSetup.disabled = true;
            btnSetup.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الربط...';
        }

        TIME_RULER_BRIDGE.callHost('setupEssentialGraphics', {}, function (res) {
            if (btnSetup) {
                btnSetup.disabled = false;
                btnSetup.innerHTML = '<i class="fa-solid fa-sliders"></i> ربط Essential Graphics';
            }
            if (res && res.ok) {
                var count = (res.data && res.data.addedCount) ? res.data.addedCount : 0;
                if (typeof showToast === 'function') {
                    showToast('تم ربط ' + count + ' خاصية بلوحة Essential Graphics بنجاح!');
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast('تنبيه: ' + (res ? res.message : 'تعذر ربط اللوحة'));
                }
            }
            if (typeof onComplete === 'function') onComplete(res);
        });
    }

    function exportMogrtPackage(onComplete) {
        if (typeof TIME_RULER_BRIDGE === 'undefined') return;
        var btnExport = document.getElementById('btn-export-mogrt');
        if (btnExport) {
            btnExport.disabled = true;
            btnExport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التصدير...';
        }

        TIME_RULER_BRIDGE.callHost('exportMOGRT', {}, function (res) {
            if (btnExport) {
                btnExport.disabled = false;
                btnExport.innerHTML = '<i class="fa-solid fa-file-export"></i> تصدير MOGRT لـ Premiere';
            }
            if (res && res.ok) {
                var path = (res.data && res.data.path) ? res.data.path : 'المجلد الافتراضي';
                if (typeof showToast === 'function') {
                    showToast('تم تصدير قالب MOGRT بنجاح! المسار: ' + path);
                }
            } else {
                var errMsg = res ? res.message : 'خطأ غير معروف';
                if (typeof showToast === 'function') {
                    showToast('فشل التصدير: ' + errMsg);
                }
            }
            if (typeof onComplete === 'function') onComplete(res);
        });
    }

    function init() {
        var btnSetup = document.getElementById('btn-setup-eg');
        if (btnSetup) {
            btnSetup.addEventListener('click', function () {
                setupEssentialGraphics();
            });
        }

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

