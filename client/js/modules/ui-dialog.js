/**
 * MASAR PRO — client/js/modules/ui-dialog.js
 * Internal Non-Blocking Modal Dialog System (Replaces native window.alert & window.confirm in CEP)
 */

var TIME_RULER_UI_DIALOG = (function () {
    'use strict';

    function $(id) { return document.getElementById(id); }

    var _activeConfirmCb = null;
    var _activeCancelCb = null;
    var _isConfirmMode = false;
    var _bound = false;

    function closeDialog(confirmed) {
        var modal = $('modal-system-dialog');
        if (modal) modal.style.display = 'none';
        var onConfirm = _activeConfirmCb;
        var onCancel = _activeCancelCb;
        _activeConfirmCb = null;
        _activeCancelCb = null;
        if (confirmed && typeof onConfirm === 'function') {
            onConfirm();
        } else if (!confirmed && typeof onCancel === 'function') {
            onCancel();
        }
    }

    function bindOnce() {
        if (_bound || typeof document === 'undefined') return;
        _bound = true;

        var modal = $('modal-system-dialog');
        var btnOk = $('dlg-sys-ok');
        var btnCancel = $('dlg-sys-cancel');
        var btnClose = $('btn-close-sys-dialog');

        if (btnOk) {
            btnOk.addEventListener('click', function () { closeDialog(true); });
        }
        if (btnCancel) {
            btnCancel.addEventListener('click', function () { closeDialog(false); });
        }
        if (btnClose) {
            btnClose.addEventListener('click', function () { closeDialog(false); });
        }
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeDialog(false);
            });
        }
        document.addEventListener('keydown', function (e) {
            var m = $('modal-system-dialog');
            if (!m || m.style.display !== 'flex') return;
            if (e.key === 'Escape' || e.keyCode === 27) {
                e.preventDefault();
                closeDialog(false);
            } else if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                closeDialog(true);
            }
        });
    }

    function openDialog(opts) {
        bindOnce();
        var modal = $('modal-system-dialog');
        var titleEl = $('dlg-sys-title');
        var msgEl = $('dlg-sys-message');
        var iconEl = $('dlg-sys-icon');
        var btnOk = $('dlg-sys-ok');
        var btnCancel = $('dlg-sys-cancel');

        var kind = opts.kind || 'info';
        _isConfirmMode = !!opts.isConfirm;
        _activeConfirmCb = opts.onConfirm || null;
        _activeCancelCb = opts.onCancel || null;

        if (titleEl) titleEl.textContent = String(opts.title || 'تنبيه');
        if (msgEl) msgEl.textContent = String(opts.message || '');

        if (iconEl) {
            var iconCls = 'fa-circle-info';
            var color = '#10b981';
            if (kind === 'warn') { iconCls = 'fa-circle-info'; color = '#f59e0b'; }
            else if (kind === 'error' || kind === 'danger') { iconCls = 'fa-ban'; color = '#ef4444'; }
            else if (kind === 'confirm') { iconCls = 'fa-circle-info'; color = '#f59e0b'; }
            iconEl.className = 'sys-dlg-icon fa-solid ' + iconCls;
            iconEl.style.color = color;
            if (iconEl.dataset) delete iconEl.dataset.msIcoDone;
            if (typeof TIME_RULER_ICONS !== 'undefined' && typeof TIME_RULER_ICONS.hydrateElement === 'function') {
                TIME_RULER_ICONS.hydrateElement(iconEl);
            }
        }

        if (btnCancel) {
            btnCancel.classList.toggle('u-hidden', !_isConfirmMode);
        }
        if (btnOk) {
            btnOk.textContent = _isConfirmMode ? (opts.confirmLabel || 'تأكيد') : (opts.okLabel || 'حسناً');
            btnOk.classList.toggle('btn-danger-solid', kind === 'danger' || _isConfirmMode);
        }

        if (modal) {
            modal.style.display = 'flex';
            if (btnOk && typeof btnOk.focus === 'function') {
                setTimeout(function () { try { btnOk.focus(); } catch (eF) {} }, 20);
            }
        }
    }

    function showAlert(title, message, kind, onOk) {
        openDialog({
            title: title || 'تنبيه',
            message: message || '',
            kind: kind || 'info',
            isConfirm: false,
            onConfirm: onOk || null
        });
    }

    function showConfirm(title, message, onConfirm, onCancel) {
        openDialog({
            title: title || 'تأكيد الإجراء',
            message: message || '',
            kind: 'confirm',
            isConfirm: true,
            confirmLabel: 'تأكيد الحذف',
            onConfirm: onConfirm || null,
            onCancel: onCancel || null
        });
    }

    return {
        showAlert: showAlert,
        showConfirm: showConfirm,
        closeDialog: closeDialog
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TIME_RULER_UI_DIALOG;
}
