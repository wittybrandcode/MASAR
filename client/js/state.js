/* =============================================================================
   TIME RULER — client/js/state.js
   Default configuration (shared contract with host lanes, schema v1.0),
   dot-path accessors, serialization, and safety limits.
   Plain JavaScript (ES2017 max). No frameworks. CEP 11 Chromium.
   ========================================================================== */

var TIME_RULER_STATE = (function () {
    'use strict';

    /* Shared contract — field names and values must match the host lanes
       byte-for-byte. Do not rename or reorder semantics casually. */
    var DEFAULT_CONFIG = {
        schemaVersion: '1.0',
        product: 'TIME_RULER',
        geometry: {
            type: 'circular',
            centerMode: 'compositionCenter',
            center: [960, 540],
            radius: 0,
            startAngle: -90,
            sweepAngle: 360,
            direction: 'clockwise',
            distributionMode: 'bounded',
            seamGapDegrees: 6,
            orientation: 'radial',
            /* linear fields */
            linearOrientation: 'horizontal',
            startX: 0,
            startY: 0,
            length: 800,
            linearDirection: 'forward',
            tickSide: 'both',
            labelOffset: 20
        },
        time: {
            mode: 'numeric',
            start: 2000,
            end: 2030,
            majorStep: 1,
            minorDivisions: 4,
            microDivisions: 0,
            includeEndPoint: true,
            precision: 0,
            prefix: '',
            suffix: '',
            timeZone: 'UTC',
            startDate: '',
            endDate: '',
            calendarUnit: 'years',
            dateFormat: '',
            frameRateMode: 'comp',
            customFps: 25,
            dropFrame: false
        },
        graduations: {
            major: { enabled: true, length: 22, width: 3, offset: 0, color: '#2878D0', opacity: 100 },
            minor: { enabled: true, length: 12, width: 2, offset: 0, color: '#75A9E8', opacity: 85 },
            micro: { enabled: false, length: 6, width: 1, offset: 0, color: '#A9C7EA', opacity: 70 }
        },
        baseline: {
            enabled: true,
            width: 2,
            color: '#2878D0'
        },
        typography: {
            enabled: true,
            fontName: 'Arial',
            fontSize: 30,
            tracking: 0,
            color: '#2878D0',
            orientation: 'radial',
            radiusOffset: 52,
            precision: 0,
            collisionMode: 'alternate',
            labelEvery: 1
        },
        teeth: {
            enabled: false,
            count: 120,
            shape: 'rectangle',
            width: 3,
            height: 8,
            alignment: 'outer',
            rotationOffset: 0,
            color: '#2878D0',
            opacity: 100
        },
        indicators: {
            marker: true,
            progress: false,
            highlight: false,
            markerColor: '#FFFFFF',
            markerSize: 10,
            highlightColor: '#F2A33C'
        },
        output: {
            mode: 'generator',
            granularity: 'grouped',
            editableTextLayers: true,
            createMasterController: true
        },
        animation: {
            progress: 0,
            reveal: 100,
            rotationOffset: 0,
            highlightStart: 0,
            highlightEnd: 100
        }
    };

    /* Initial safety limits (spec §11.1) — conservative, adjustable after
       performance measurement. Shared with the client validator. */
    var LIMITS = {
        MAJOR_TICKS_MAX: 500,
        MINOR_MICRO_TOTAL_MAX: 2000,
        LABELS_WARN: 200,
        LABELS_MAX: 400,
        TEETH_MAX: 1000
    };

    /* The live config object held by the client. */
    var config = deepClone(DEFAULT_CONFIG);

    /* ------------------------------------------------------------------ */
    /* Helpers                                                             */
    /* ------------------------------------------------------------------ */

    function deepClone(obj) {
        /* Config is JSON-safe by contract, so a JSON round-trip is a
           complete deep clone here. */
        return JSON.parse(JSON.stringify(obj));
    }

    /* "geometry.center[0]" and "geometry.center.0" are both accepted. */
    function normalizePath(path) {
        return String(path).replace(/\[(\d+)\]/g, '.$1');
    }

    function getPath(path, root) {
        var keys = normalizePath(path).split('.');
        var obj = (root !== undefined) ? root : config;
        for (var i = 0; i < keys.length; i++) {
            if (obj === null || obj === undefined) { return undefined; }
            obj = obj[keys[i]];
        }
        return obj;
    }

    function setPath(path, value) {
        var keys = normalizePath(path).split('.');
        var obj = config;
        for (var i = 0; i < keys.length - 1; i++) {
            if (obj === null || obj === undefined || typeof obj !== 'object') {
                return false;
            }
            if (obj[keys[i]] === null || obj[keys[i]] === undefined) {
                return false; /* the config schema is complete; never auto-create */
            }
            obj = obj[keys[i]];
        }
        if (obj === null || obj === undefined || typeof obj !== 'object') {
            return false;
        }
        var last = keys[keys.length - 1];
        if (Array.isArray(obj)) {
            var idx = parseInt(last, 10);
            if (isNaN(idx)) { return false; }
            obj[idx] = value;
        } else {
            obj[last] = value;
        }
        return true;
    }

    function serializeConfig() {
        return JSON.stringify(config, null, 2);
    }

    function loadDefaultConfig() {
        config = deepClone(DEFAULT_CONFIG);
        return config;
    }

    function loadConfig(newConfig) {
        if (!newConfig || typeof newConfig !== 'object') {
            return config;
        }
        var base = deepClone(DEFAULT_CONFIG);
        var known = ['schemaVersion', 'product', 'geometry', 'time', 'graduations',
                     'baseline', 'typography', 'teeth', 'indicators', 'output', 'animation'];
        for (var i = 0; i < known.length; i++) {
            var k = known[i];
            if (newConfig[k] !== undefined && newConfig[k] !== null) {
                if (typeof newConfig[k] === 'object' && !Array.isArray(newConfig[k])) {
                    // Deep merge sub-object into defaults so missing properties keep default values
                    for (var sub in newConfig[k]) {
                        if (Object.prototype.hasOwnProperty.call(newConfig[k], sub)) {
                            base[k][sub] = deepClone(newConfig[k][sub]);
                        }
                    }
                } else {
                    base[k] = deepClone(newConfig[k]);
                }
            }
        }
        if (newConfig.preset !== undefined) {
            base.preset = deepClone(newConfig.preset);
        }
        config = base;
        return config;
    }

    /* Public API ------------------------------------------------------- */
    return {
        DEFAULT_CONFIG: DEFAULT_CONFIG,
        LIMITS: LIMITS,
        deepClone: deepClone,
        getConfig: function () { return config; },
        getPath: getPath,
        setPath: setPath,
        serializeConfig: serializeConfig,
        loadDefaultConfig: loadDefaultConfig,
        loadConfig: loadConfig
    };
})();
