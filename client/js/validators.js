/* =============================================================================
   TIME RULER — client/js/validators.js
   Client-side configuration validation mirroring build spec §7.1 + §11.1.
   Enum values are IDENTICAL to client/js/state.js (shared host contract).
   Returns { ok, errors:[{field,code,message}], warnings:[{field,code,message}] }.
   `field` uses dot paths that match data-bind attributes, so form-binding.js
   can mark invalid inputs (.field-error + title tooltip).
   Plain JavaScript (ES2017 max).
   ========================================================================== */

var TIME_RULER_VALIDATORS = (function () {
    'use strict';

    var HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
    var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;

    /* Same enum sets as state.js defaults / host contract. */
    var ENUMS = {
        'geometry.type': ['circular', 'linear', 'arc'],
        'geometry.direction': ['clockwise', 'counter_clockwise'],
        'geometry.distributionMode': ['bounded', 'cyclic'],
        'geometry.linearOrientation': ['horizontal', 'vertical'],
        'geometry.linearDirection': ['forward', 'reverse'],
        'geometry.tickSide': ['positive', 'negative', 'both'],
        'geometry.orientation': ['horizontal', 'radial', 'tangential', 'auto_upright'],
        'time.mode': ['numeric', 'calendar', 'timecode'],
        'time.calendarUnit': ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
        'time.timeZone': ['UTC', 'LOCAL'],
        'time.frameRateMode': ['comp', 'custom'],
        'typography.orientation': ['horizontal', 'radial', 'tangential', 'auto_upright'],
        'typography.collisionMode': ['allow_overlap', 'hide', 'alternate', 'every_nth'],
        'teeth.shape': ['rectangle', 'square', 'trapezoid', 'triangle'],
        'teeth.alignment': ['inner', 'outer', 'center'],
        'output.mode': ['generator', 'rig'],
        'output.granularity': ['grouped', 'individual']
    };

    var COLOR_PATHS = [
        'graduations.major.color',
        'graduations.minor.color',
        'graduations.micro.color',
        'baseline.color',
        'typography.color',
        'teeth.color',
        'indicators.markerColor',
        'indicators.highlightColor'
    ];

    var BOOL_PATHS = [
        'time.includeEndPoint',
        'time.dropFrame',
        'graduations.major.enabled',
        'graduations.minor.enabled',
        'graduations.micro.enabled',
        'baseline.enabled',
        'typography.enabled',
        'teeth.enabled',
        'indicators.marker',
        'indicators.progress',
        'indicators.highlight',
        'output.editableTextLayers',
        'output.createMasterController'
    ];

    /* radius / lengths / widths must never be negative (spec §7.1).
       Offsets (graduations offset, labelOffset, radiusOffset, startAngle)
       may legitimately be negative. */
    var NON_NEGATIVE_PATHS = [
        'geometry.radius',
        'geometry.length',
        'geometry.seamGapDegrees',
        'graduations.major.length',
        'graduations.major.width',
        'graduations.minor.length',
        'graduations.minor.width',
        'graduations.micro.length',
        'graduations.micro.width',
        'baseline.width',
        'teeth.width',
        'teeth.height',
        'teeth.count',
        'indicators.markerSize'
    ];

    var OPACITY_PATHS = [
        'graduations.major.opacity',
        'graduations.minor.opacity',
        'graduations.micro.opacity',
        'teeth.opacity'
    ];

    var PRECISION_PATHS = ['time.precision', 'typography.precision'];

    function err(field, code, message) {
        return { field: field, code: code, message: message };
    }

    /* Recursively reject NaN / Infinity anywhere in the config (spec §7.1). */
    function walkNumbers(node, path, errors) {
        var k;
        if (typeof node === 'number') {
            if (!isFinite(node)) {
                errors.push(err(path, 'NON_FINITE_NUMBER',
                    'Value must be a finite number (NaN/Infinity are not allowed).'));
            }
            return;
        }
        if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                walkNumbers(node[i], path + '.' + i, errors);
            }
            return;
        }
        if (node && typeof node === 'object') {
            for (k in node) {
                if (Object.prototype.hasOwnProperty.call(node, k)) {
                    walkNumbers(node[k], path ? path + '.' + k : k, errors);
                }
            }
        }
    }

    function num(getPath, path) {
        var v = getPath(path);
        return (typeof v === 'number') ? v : NaN;
    }

    function validateConfig(cfg, limits) {
        limits = limits || { MAJOR_TICKS_MAX: 500, MINOR_MICRO_TOTAL_MAX: 2000, LABELS_WARN: 200, LABELS_MAX: 400, TEETH_MAX: 1000 };
        var errors = [];
        var warnings = [];
        var path, i, v;

        var getPath = function (p) {
            var keys = String(p).split('.');
            var obj = cfg;
            for (var j = 0; j < keys.length; j++) {
                if (obj === null || obj === undefined) { return undefined; }
                obj = obj[keys[j]];
            }
            return obj;
        };

        /* ---- structural sanity ------------------------------------- */
        if (!cfg || typeof cfg !== 'object') {
            return {
                ok: false,
                errors: [err('config', 'CONFIG_NOT_OBJECT', 'Configuration must be an object.')],
                warnings: warnings
            };
        }

        /* ---- generic: no NaN / Infinity anywhere --------------------- */
        walkNumbers(cfg, '', errors);

        /* ---- enums ---------------------------------------------------- */
        for (path in ENUMS) {
            if (Object.prototype.hasOwnProperty.call(ENUMS, path)) {
                v = getPath(path);
                if (ENUMS[path].indexOf(v) === -1) {
                    errors.push(err(path, 'ENUM_VALUE',
                        'Value "' + String(v) + '" is not allowed. Expected one of: ' + ENUMS[path].join(', ') + '.'));
                }
            }
        }

        /* ---- booleans -------------------------------------------------- */
        for (i = 0; i < BOOL_PATHS.length; i++) {
            v = getPath(BOOL_PATHS[i]);
            if (typeof v !== 'boolean') {
                errors.push(err(BOOL_PATHS[i], 'TYPE_MISMATCH',
                    'Value must be true or false (got "' + String(v) + '").'));
            }
        }

        /* ---- non-negative numerics ------------------------------------ */
        for (i = 0; i < NON_NEGATIVE_PATHS.length; i++) {
            v = num(getPath, NON_NEGATIVE_PATHS[i]);
            if (isFinite(v) && v < 0) {
                errors.push(err(NON_NEGATIVE_PATHS[i], 'NEGATIVE_VALUE',
                    'Value cannot be negative (got ' + v + ').'));
            }
        }

        /* ---- opacity 0..100 -------------------------------------------- */
        for (i = 0; i < OPACITY_PATHS.length; i++) {
            v = num(getPath, OPACITY_PATHS[i]);
            if (isFinite(v) && (v < 0 || v > 100)) {
                errors.push(err(OPACITY_PATHS[i], 'OPACITY_RANGE',
                    'Opacity must be between 0 and 100 (got ' + v + ').'));
            }
        }

        /* ---- precision 0..6, integer ------------------------------------ */
        for (i = 0; i < PRECISION_PATHS.length; i++) {
            v = num(getPath, PRECISION_PATHS[i]);
            if (isFinite(v) && (v < 0 || v > 6 || Math.floor(v) !== v)) {
                errors.push(err(PRECISION_PATHS[i], 'PRECISION_RANGE',
                    'Precision must be an integer between 0 and 6 (got ' + v + ').'));
            }
        }

        /* ---- font size --------------------------------------------------- */
        v = num(getPath, 'typography.fontSize');
        if (isFinite(v) && v <= 0) {
            errors.push(err('typography.fontSize', 'RANGE',
                'Font size must be greater than 0 px (got ' + v + ').'));
        }

        /* ---- center ------------------------------------------------------ */
        var center = getPath('geometry.center');
        if (!Array.isArray(center) || center.length !== 2 ||
            !isFinite(center[0]) || !isFinite(center[1])) {
            errors.push(err('geometry.center', 'CENTER_INVALID',
                'Center must be a pair of finite numbers [x, y].'));
        }

        /* ---- hex colors ---------------------------------------------------- */
        for (i = 0; i < COLOR_PATHS.length; i++) {
            v = getPath(COLOR_PATHS[i]);
            if (typeof v !== 'string' || !HEX_COLOR_RE.test(v)) {
                errors.push(err(COLOR_PATHS[i], 'COLOR_FORMAT',
                    'Color must be a 6-digit hex value like #2878D0 (got "' + String(v) + '").'));
            }
        }

        /* ---- geometry type rules ------------------------------------------- */
        var gType = getPath('geometry.type');
        var sweep = num(getPath, 'geometry.sweepAngle');

        if (gType === 'circular') {
            if (isFinite(sweep) && (sweep < 1 || sweep > 360)) {
                errors.push(err('geometry.sweepAngle', 'SWEEP_RANGE',
                    'Circular sweep must be between 1 and 360 degrees (got ' + sweep + ').'));
            }
            if (getPath('geometry.distributionMode') === 'cyclic' &&
                isFinite(sweep) && sweep !== 360) {
                errors.push(err('geometry.sweepAngle', 'CYCLIC_SWEEP',
                    'Cyclic distribution requires a full 360 degree sweep (got ' + sweep + ').'));
            }
            if (getPath('geometry.distributionMode') === 'bounded' &&
                isFinite(sweep) && sweep === 360) {
                var seam = num(getPath, 'geometry.seamGapDegrees');
                if (!(isFinite(seam) && seam > 0)) {
                    warnings.push(err('geometry.seamGapDegrees', 'SEAM_GAP_OVERLAP',
                        'Bounded 360 degree rulers need a seam gap greater than 0, otherwise the first and last ticks overlap at the seam.'));
                }
            }
        } else if (gType === 'arc') {
            if (isFinite(sweep) && (sweep < 1 || sweep > 360)) {
                errors.push(err('geometry.sweepAngle', 'SWEEP_RANGE',
                    'Arc sweep must be between 1 and 360 degrees (got ' + sweep + ').'));
            } else if (isFinite(sweep) && sweep === 360) {
                warnings.push(err('geometry.sweepAngle', 'ARC_FULL_SWEEP',
                    'A 360 degree arc is a full circle — consider the Circular type instead.'));
            }
        } else if (gType === 'linear') {
            var length = num(getPath, 'geometry.length');
            if (isFinite(length) && length <= 0) {
                errors.push(err('geometry.length', 'LINEAR_LENGTH',
                    'Linear length must be greater than 0 px (got ' + length + ').'));
            }
        }

        /* ---- time mode rules ----------------------------------------------- */
        var tMode = getPath('time.mode');
        var start = num(getPath, 'time.start');
        var end = num(getPath, 'time.end');
        var majorStep = num(getPath, 'time.majorStep');

        if (isFinite(majorStep) && majorStep <= 0) {
            errors.push(err('time.majorStep', 'ZERO_MAJOR_STEP',
                'Major step must be greater than 0 (got ' + majorStep + ').'));
        }
        if (isFinite(start) && isFinite(end)) {
            if (start === end) {
                errors.push(err('time.end', 'EQUAL_RANGE',
                    'End must be different from start.'));
            } else if (end < start) {
                warnings.push(err('time.end', 'NEGATIVE_RANGE',
                    'End is smaller than start — the ruler will count downwards.'));
            }
        }

        if (tMode === 'calendar') {
            var sd = getPath('time.startDate');
            var ed = getPath('time.endDate');
            var sdOk = false;
            var edOk = false;
            if (typeof sd !== 'string' || sd.length === 0) {
                errors.push(err('time.startDate', 'DATE_REQUIRED',
                    'Calendar mode requires a start date (ISO 8601, e.g. 2024-01-01).'));
            } else if (!ISO_DATE_RE.test(sd)) {
                errors.push(err('time.startDate', 'DATE_FORMAT',
                    'Start date must be ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM(:SS).'));
            } else {
                sdOk = true;
            }
            if (typeof ed !== 'string' || ed.length === 0) {
                errors.push(err('time.endDate', 'DATE_REQUIRED',
                    'Calendar mode requires an end date (ISO 8601, e.g. 2024-12-31).'));
            } else if (!ISO_DATE_RE.test(ed)) {
                errors.push(err('time.endDate', 'DATE_FORMAT',
                    'End date must be ISO 8601: YYYY-MM-DD or YYYY-MM-DDTHH:MM(:SS).'));
            } else {
                edOk = true;
            }
            if (sdOk && edOk && String(sd) > String(ed)) {
                warnings.push(err('time.endDate', 'DATE_ORDER',
                    'End date is earlier than start date.'));
            }
        }

        if (tMode === 'timecode') {
            var fpsMode = getPath('time.frameRateMode');
            var fps = num(getPath, 'time.customFps');
            var dropFrame = getPath('time.dropFrame') === true;
            if (fpsMode === 'custom' && isFinite(fps) && fps <= 0) {
                errors.push(err('time.customFps', 'ZERO_FPS',
                    'Custom frame rate must be greater than 0 fps (got ' + fps + ').'));
            }
            if (fpsMode === 'custom' && dropFrame && isFinite(fps) &&
                Math.abs(fps - 29.97) > 0.01 && Math.abs(fps - 59.94) > 0.01) {
                warnings.push(err('time.customFps', 'DROP_FRAME_FPS',
                    'Drop-frame timecode is only meaningful for the 29.97 / 59.94 families (got ' + fps + ' fps).'));
            }
        }

        /* ---- projected element counts (§11.1), numeric mode ---------------- */
        var majorCount = 0;
        var tickTotal = 0;
        var labelCount = 0;

        if (tMode === 'numeric' && isFinite(start) && isFinite(end) && isFinite(majorStep) && majorStep > 0) {
            var range = Math.abs(end - start);
            majorCount = Math.floor(range / majorStep) + (getPath('time.includeEndPoint') === false ? 0 : 1);

            if (majorCount > limits.MAJOR_TICKS_MAX) {
                errors.push(err('time.majorStep', 'COUNT_LIMIT_MAJOR',
                    'Projected major ticks (' + majorCount + ') exceed the limit of ' + limits.MAJOR_TICKS_MAX + '. Increase the major step.'));
            }

            var minorDiv = num(getPath, 'time.minorDivisions');
            var microDiv = num(getPath, 'time.microDivisions');
            var minorTotal = (getPath('graduations.minor.enabled') && isFinite(minorDiv) && minorDiv > 0)
                ? majorCount * minorDiv : 0;
            var microTotal = (getPath('graduations.micro.enabled') && isFinite(microDiv) && microDiv > 0)
                ? majorCount * microDiv : 0;
            var minorMicroTotal = minorTotal + microTotal;

            if (minorMicroTotal > limits.MINOR_MICRO_TOTAL_MAX) {
                errors.push(err('time.minorDivisions', 'COUNT_LIMIT_MINOR_MICRO',
                    'Projected minor + micro ticks (' + minorMicroTotal + ') exceed the limit of ' + limits.MINOR_MICRO_TOTAL_MAX + '. Reduce divisions or the range.'));
            }

            tickTotal = (getPath('graduations.major.enabled') ? majorCount : 0) +
                        minorTotal + microTotal;

            labelCount = getPath('typography.enabled') ? majorCount : 0;
            if (labelCount > limits.LABELS_MAX) {
                errors.push(err('typography.labelEvery', 'COUNT_LIMIT_LABELS',
                    'Projected labels (' + labelCount + ') exceed the limit of ' + limits.LABELS_MAX + '. Raise "Label every".'));
            } else if (labelCount > limits.LABELS_WARN) {
                warnings.push(err('typography.labelEvery', 'COUNT_WARN_LABELS',
                    'Projected labels (' + labelCount + ') are above the density warning threshold (' + limits.LABELS_WARN + '). Text layers may be slow.'));
            }
        }

        /* ---- teeth (count limit is unconditional, per §11.1) ------------------ */
        var teethCount = num(getPath, 'teeth.count');
        if (isFinite(teethCount) && teethCount > limits.TEETH_MAX) {
            errors.push(err('teeth.count', 'COUNT_LIMIT_TEETH',
                'Teeth count (' + teethCount + ') exceeds the limit of ' + limits.TEETH_MAX + '.'));
        }
        if (getPath('teeth.enabled')) {
            tickTotal += (isFinite(teethCount) && teethCount > 0) ? teethCount : 0;
        }
        if (getPath('baseline.enabled')) { tickTotal += 1; }
        if (getPath('indicators.marker') || getPath('indicators.progress') || getPath('indicators.highlight')) {
            tickTotal += 1;
        }

        /* ---- individual output layer caution (§11.1) -------------------------- */
        if (getPath('output.granularity') === 'individual' && tickTotal > 300) {
            warnings.push(err('output.granularity', 'INDIVIDUAL_LAYERS',
                'Individual output projects roughly ' + tickTotal + ' layers (caution threshold: 300). Use grouped output for dense rulers.'));
        }

        /* ---- animation ranges -------------------------------------------------- */
        var animPaths = ['animation.progress', 'animation.reveal', 'animation.highlightStart', 'animation.highlightEnd'];
        for (i = 0; i < animPaths.length; i++) {
            v = num(getPath, animPaths[i]);
            if (isFinite(v) && (v < 0 || v > 100)) {
                errors.push(err(animPaths[i], 'RANGE',
                    'Value must be between 0 and 100 percent (got ' + v + ').'));
            }
        }
        var hs = num(getPath, 'animation.highlightStart');
        var he = num(getPath, 'animation.highlightEnd');
        if (isFinite(hs) && isFinite(he) && he < hs) {
            warnings.push(err('animation.highlightEnd', 'RANGE_ORDER',
                'Highlight end is smaller than highlight start.'));
        }

        return {
            ok: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /* Public API ------------------------------------------------------- */
    return {
        validateConfig: validateConfig
    };
})();
