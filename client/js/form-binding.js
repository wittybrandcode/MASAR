/* =============================================================================
   TIME RULER — client/js/form-binding.js
   Binds every [data-bind] input to the configuration object by dot path.
   - one-way in:  config -> inputs (checkbox -> checked, number -> value,
     select/text -> value, radio -> checked by value match)
   - one-way out: inputs -> setPath with coercion (number -> parseFloat
     with NaN fallback to 0, checkbox -> bool, radio -> its value)
   - same-path sync: several inputs may bind the same path (e.g. radius in
     the Circular and Arc groups, Style tab color duplicates).
   - data-show-when / data-disable-when: declarative conditional visibility.
     Format: "path=value" for one condition, several ANDed with ";".
   Plain JavaScript (ES2017 max).
   ========================================================================== */

var TIME_RULER_FORM = (function () {
    'use strict';

    var tabsWired = false;

    function $(id) { return document.getElementById(id); }

    /* ------------------------------------------------------------------ */
    /* Conditional visibility engine                                       */
    /* ------------------------------------------------------------------ */

    function evalCondition(expr) {
        /* "a.b=x;c.d=y" -> true only if every condition matches. */
        var parts = String(expr).split(';');
        for (var i = 0; i < parts.length; i++) {
            var cond = parts[i];
            var eq = cond.indexOf('=');
            if (eq === -1) { return false; }
            var path = cond.slice(0, eq).trim();
            var expected = cond.slice(eq + 1).trim();
            var actual = TIME_RULER_STATE.getPath(path);
            if (String(actual) !== expected) { return false; }
        }
        return true;
    }

    function refreshVisibility() {
        var els = document.querySelectorAll('[data-show-when], [data-disable-when]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var showWhen = el.getAttribute('data-show-when');
            var disableWhen = el.getAttribute('data-disable-when');
            if (showWhen !== null) {
                el.style.display = evalCondition(showWhen) ? '' : 'none';
            }
            if (disableWhen !== null) {
                el.disabled = evalCondition(disableWhen);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Value write/read per input type                                     */
    /* ------------------------------------------------------------------ */

    function readInputValue(el) {
        var t = el.type;
        if (t === 'checkbox') { return el.checked === true; }
        if (t === 'radio') {
            /* The event target is the radio that just became checked. */
            return el.checked ? el.value : null;
        }
        if (t === 'number' || t === 'range') {
            var v = parseFloat(el.value);
            return isFinite(v) ? v : 0;
        }
        return el.value;
    }

    function writeInputValue(el, value) {
        var t = el.type;
        if (t === 'checkbox') {
            el.checked = value === true;
        } else if (t === 'radio') {
            el.checked = (String(value) === String(el.value));
        } else if (t === 'number' || t === 'range') {
            el.value = (value === null || value === undefined) ? '' : String(value);
        } else {
            el.value = (value === null || value === undefined) ? '' : String(value);
        }
    }

    /* Keep every other input bound to the same path in step. */
    function syncSamePath(path, sourceEl) {
        var all = document.querySelectorAll('[data-bind="' + cssEscape(path) + '"]');
        for (var i = 0; i < all.length; i++) {
            if (all[i] !== sourceEl) {
                writeInputValue(all[i], TIME_RULER_STATE.getPath(path));
            }
        }
    }

    function cssEscape(sel) {
        /* Attribute selectors with dots are safe as-is; only quotes need care. */
        return String(sel).replace(/"/g, '\\"');
    }

    /* ------------------------------------------------------------------ */
    /* Binding                                                             */
    /* ------------------------------------------------------------------ */

    function bindInput(el) {
        var path = el.getAttribute('data-bind');
        if (!path) { return; }

        writeInputValue(el, TIME_RULER_STATE.getPath(path));

        if (el._trBound) { return; }
        el._trBound = true;

        var onChange = function () {
            if (el.type === 'radio' && !el.checked) { return; } /* only the newly-checked radio writes */
            var value = readInputValue(el);
            if (el.type === 'radio' && value === null) { return; }
            TIME_RULER_STATE.setPath(path, value);
            syncSamePath(path, el);
            refreshVisibility();
        };

        el.addEventListener('change', onChange);
        /* input covers typing in text/number/range; change covers select/checkbox/radio/color. */
        el.addEventListener('input', onChange);
    }

    function syncFormFromState() {
        var els = document.querySelectorAll('[data-bind]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var path = el.getAttribute('data-bind');
            if (path) {
                writeInputValue(el, TIME_RULER_STATE.getPath(path));
            }
        }
        clearFieldErrors();
        refreshVisibility();
    }

    function bindForm(config) {
        /* state.js already holds the live config; `config` is accepted for
           API clarity (it must be the same live object from getConfig()). */
        if (config && config !== TIME_RULER_STATE.getConfig()) {
            if (typeof TIME_RULER_STATE.loadConfig === 'function') {
                TIME_RULER_STATE.loadConfig(config);
            } else {
                for (var k in config) {
                    if (Object.prototype.hasOwnProperty.call(config, k)) {
                        TIME_RULER_STATE.setPath(k, config[k]);
                    }
                }
            }
        }

        var els = document.querySelectorAll('[data-bind]');
        for (var i = 0; i < els.length; i++) {
            bindInput(els[i]);
        }

        wireTabs();
        refreshVisibility();
    }

    /* ------------------------------------------------------------------ */
    /* Tabs                                                                */
    /* ------------------------------------------------------------------ */

    function showTab(panelId) {
        var btns = document.querySelectorAll('.tab-btn');
        var panels = document.querySelectorAll('.tab-panel');
        for (var i = 0; i < btns.length; i++) {
            var active = btns[i].getAttribute('data-tab') === panelId;
            btns[i].classList.toggle('active', active);
        }
        for (var j = 0; j < panels.length; j++) {
            panels[j].classList.toggle('active', panels[j].id === panelId);
        }
    }

    function wireTabs() {
        if (tabsWired) { return; }
        tabsWired = true;
        var btns = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < btns.length; i++) {
            (function (btn) {
                btn.addEventListener('click', function () {
                    showTab(btn.getAttribute('data-tab'));
                });
            })(btns[i]);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Validation feedback on fields                                       */
    /* ------------------------------------------------------------------ */

    function clearFieldErrors() {
        var bad = document.querySelectorAll('.field-error');
        for (var i = 0; i < bad.length; i++) {
            bad[i].classList.remove('field-error');
            bad[i].removeAttribute('title');
        }
    }

    function markFieldErrors(errors) {
        clearFieldErrors();
        if (!Array.isArray(errors)) { return; }

        var byField = {};
        for (var i = 0; i < errors.length; i++) {
            var e = errors[i];
            var field = e && e.field ? String(e.field) : '';
            if (!field) { continue; }
            if (!byField[field]) { byField[field] = []; }
            byField[field].push(e.message || e.code || 'Invalid value.');
        }

        var unmatched = [];
        for (var path in byField) {
            if (!Object.prototype.hasOwnProperty.call(byField, path)) { continue; }
            var msg = byField[path].join('  ');
            var els = document.querySelectorAll('[data-bind="' + cssEscape(path) + '"]');
            if (els.length === 0) {
                unmatched.push(path + ': ' + msg);
                continue;
            }
            for (var j = 0; j < els.length; j++) {
                els[j].classList.add('field-error');
                els[j].setAttribute('title', msg);
            }
        }

        if (unmatched.length) {
            TIME_RULER_UI.appendLog('validation (no matching field): ' + unmatched.join(' | '));
        }
    }

    /* Public API ------------------------------------------------------- */
    return {
        bindForm: bindForm,
        syncFormFromState: syncFormFromState,
        showTab: showTab,
        refreshVisibility: refreshVisibility,
        markFieldErrors: markFieldErrors,
        clearFieldErrors: clearFieldErrors
    };
})();
