/* =============================================================================
   TIME RULER — client/js/ui-feedback.js
   Header status pill, toasts, busy overlay, footer feedback line and the
   collapsible diagnostics log. Plain JavaScript (ES2017 max).
   ========================================================================== */

var TIME_RULER_UI = (function () {
    'use strict';

    var busyState = false;
    var toastCounter = 0;

    var PILL_TEXT = {
        connected: 'Connected',
        nocomp: 'No Composition',
        nohost: 'Not in AE',
        error: 'Error'
    };

    function $(id) { return document.getElementById(id); }

    function init() {
        var toggle = $('btn-log-toggle');
        var log = $('diagnostics');
        if (toggle && log && !toggle.dataset.wired) {
            toggle.dataset.wired = '1';
            toggle.addEventListener('click', function () {
                log.hidden = !log.hidden;
                toggle.classList.toggle('active', !log.hidden);
                if (!log.hidden) {
                    log.scrollTop = log.scrollHeight;
                }
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /* Header status pill: connected | nocomp | nohost | error             */
    /* ------------------------------------------------------------------ */

    function setStatus(state, msg) {
        var pill = $('status-pill');
        if (!pill) { return; }
        var cls = 'pill pill--' + state;
        if (PILL_TEXT[state]) {
            pill.className = cls;
            pill.textContent = msg || PILL_TEXT[state];
        } else {
            pill.className = 'pill pill--error';
            pill.textContent = msg || PILL_TEXT.error;
        }
    }

    /* ------------------------------------------------------------------ */
    /* Toasts                                                              */
    /* ------------------------------------------------------------------ */

    function toast(msg, kind, timeoutMs) {
        var container = $('toast-container');
        if (!container) { return; }
        kind = kind || 'info';
        timeoutMs = (typeof timeoutMs === 'number') ? timeoutMs : (kind === 'error' ? 7000 : 4000);

        while (container.children.length >= 3) {
            container.removeChild(container.firstChild);
        }

        var el = document.createElement('div');
        el.className = 'toast toast--' + kind;
        el.textContent = msg;
        el.dataset.toastId = String(++toastCounter);
        container.appendChild(el);

        window.setTimeout(function () {
            if (el.parentNode === container) {
                container.removeChild(el);
            }
        }, timeoutMs);
    }

    /* ------------------------------------------------------------------ */
    /* Footer feedback line                                                */
    /* ------------------------------------------------------------------ */

    function setFeedback(msg, kind) {
        var line = $('feedback-line');
        if (!line) { return; }
        line.textContent = msg;
        line.className = 'feedback' + (kind ? ' feedback--' + kind : '');
    }

    /* ------------------------------------------------------------------ */
    /* Busy overlay + primary button disabling                             */
    /* ------------------------------------------------------------------ */

    function busy(on) {
        busyState = !!on;
        var overlay = $('busy-overlay');
        if (overlay) { overlay.hidden = !busyState; }

        var targets = document.querySelectorAll('.btn-primary, [data-requires-host]');
        for (var i = 0; i < targets.length; i++) {
            targets[i].disabled = busyState;
            targets[i].classList.toggle('loading', busyState && targets[i].classList.contains('btn-primary'));
        }
    }

    function isBusy() { return busyState; }

    /* ------------------------------------------------------------------ */
    /* Diagnostics log (collapsible area at the footer)                    */
    /* ------------------------------------------------------------------ */

    function appendLog(line) {
        var log = $('diagnostics');
        if (!log) { return; }
        var now = new Date();
        var hh = ('0' + now.getHours()).slice(-2);
        var mm = ('0' + now.getMinutes()).slice(-2);
        var ss = ('0' + now.getSeconds()).slice(-2);
        var el = document.createElement('div');
        el.className = 'log-line';
        el.textContent = '[' + hh + ':' + mm + ':' + ss + '] ' + line;
        log.appendChild(el);
        while (log.children.length > 200) {
            log.removeChild(log.firstChild);
        }
        log.scrollTop = log.scrollHeight;
    }

    /* Public API ------------------------------------------------------- */
    return {
        init: init,
        setStatus: setStatus,
        toast: toast,
        setFeedback: setFeedback,
        busy: busy,
        isBusy: isBusy,
        appendLog: appendLog
    };
})();
