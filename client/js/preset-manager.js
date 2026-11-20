/* =============================================================================
   TIME RULER — client/js/preset-manager.js
   Preset management engine: built-in templates (v1.0 schema), user presets
   stored in localStorage, JSON import/export, and loading into panel state.
   Plain JavaScript (ES2017 max). Follows TIME_RULER_GEMINI_BUILD_SPEC §10.
   ========================================================================== */

var TIME_RULER_PRESETS = (function () {
    'use strict';

    var STORAGE_KEY = 'TIME_RULER_USER_PRESETS_V1';

    /* ------------------------------------------------------------------ */
    /* Built-in Presets (Read-only, cannot be deleted or overwritten)      */
    /* ------------------------------------------------------------------ */

    var BUILTIN_PRESETS = [
        {
            schemaVersion: '1.0',
            product: 'TIME_RULER',
            preset: {
                id: 'historical-2000-2030',
                name: 'Historical Circular 2000–2030',
                description: '31 years spread over a full circle with a 6-degree seam gap. Bounded timeline: first and last years never overlap.',
                builtin: true
            },
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
                major: { enabled: true, length: 24, width: 3, offset: 0, color: '#2878D0', opacity: 100 },
                minor: { enabled: true, length: 12, width: 2, offset: 0, color: '#75A9E8', opacity: 85 },
                micro: { enabled: false, length: 6, width: 1, offset: 0, color: '#A9C7EA', opacity: 70 }
            },
            baseline: { enabled: true, width: 2, color: '#2878D0' },
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
        },
        {
            schemaVersion: '1.0',
            product: 'TIME_RULER',
            preset: {
                id: 'clock-12-months',
                name: '12 Months Clock',
                description: 'Cyclic yearly clock, January to December. End-exclusive distribution: January never repeats at the closure point.',
                builtin: true
            },
            geometry: {
                type: 'circular',
                centerMode: 'compositionCenter',
                center: [960, 540],
                radius: 0,
                startAngle: -90,
                sweepAngle: 360,
                direction: 'clockwise',
                distributionMode: 'cyclic',
                seamGapDegrees: 0,
                orientation: 'radial',
                linearOrientation: 'horizontal',
                startX: 0,
                startY: 0,
                length: 800,
                linearDirection: 'forward',
                tickSide: 'both',
                labelOffset: 20
            },
            time: {
                mode: 'calendar',
                start: 2000,
                end: 2030,
                majorStep: 1,
                minorDivisions: 3,
                microDivisions: 0,
                includeEndPoint: false,
                precision: 0,
                prefix: '',
                suffix: '',
                timeZone: 'UTC',
                startDate: '2026-01-01',
                endDate: '2027-01-01',
                calendarUnit: 'months',
                dateFormat: '',
                frameRateMode: 'comp',
                customFps: 25,
                dropFrame: false
            },
            graduations: {
                major: { enabled: true, length: 20, width: 3, offset: 0, color: '#E8E8E8', opacity: 100 },
                minor: { enabled: true, length: 9, width: 2, offset: 0, color: '#9AA0A6', opacity: 80 },
                micro: { enabled: false, length: 5, width: 1, offset: 0, color: '#6E7681', opacity: 60 }
            },
            baseline: { enabled: true, width: 2, color: '#E8E8E8' },
            typography: {
                enabled: true,
                fontName: 'Arial',
                fontSize: 34,
                tracking: 0,
                color: '#E8E8E8',
                orientation: 'radial',
                radiusOffset: 55,
                precision: 0,
                collisionMode: 'allow_overlap',
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
                color: '#E8E8E8',
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
        },
        {
            schemaVersion: '1.0',
            product: 'TIME_RULER',
            preset: {
                id: 'clean-timeline',
                name: 'Clean Linear Timeline',
                description: 'Horizontal timeline with years above the baseline and minor graduations below. Clean broadcast lower-third style.',
                builtin: true
            },
            geometry: {
                type: 'linear',
                centerMode: 'compositionCenter',
                center: [960, 540],
                radius: 0,
                startAngle: -90,
                sweepAngle: 360,
                direction: 'clockwise',
                distributionMode: 'bounded',
                seamGapDegrees: 6,
                orientation: 'radial',
                linearOrientation: 'horizontal',
                startX: 160,
                startY: 540,
                length: 960,
                linearDirection: 'forward',
                tickSide: 'negative',
                labelOffset: 34
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
                major: { enabled: true, length: 18, width: 2, offset: 0, color: '#2878D0', opacity: 100 },
                minor: { enabled: true, length: 8, width: 1, offset: 0, color: '#75A9E8', opacity: 80 },
                micro: { enabled: false, length: 4, width: 1, offset: 0, color: '#A9C7EA', opacity: 60 }
            },
            baseline: { enabled: true, width: 2, color: '#2878D0' },
            typography: {
                enabled: true,
                fontName: 'Arial',
                fontSize: 20,
                tracking: 0,
                color: '#2878D0',
                orientation: 'horizontal',
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
        },
        {
            schemaVersion: '1.0',
            product: 'TIME_RULER',
            preset: {
                id: 'instrument-dial',
                name: 'Mechanical Instrument Dial',
                description: 'Instrument dial 0-100 with dense minor/micro graduations and 120 mechanical teeth around the outer edge.',
                builtin: true
            },
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
                start: 0,
                end: 100,
                majorStep: 10,
                minorDivisions: 10,
                microDivisions: 2,
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
                major: { enabled: true, length: 22, width: 3, offset: 0, color: '#E8E8E8', opacity: 100 },
                minor: { enabled: true, length: 10, width: 2, offset: 0, color: '#9AA0A6', opacity: 85 },
                micro: { enabled: true, length: 5, width: 1, offset: 0, color: '#6E7681', opacity: 60 }
            },
            baseline: { enabled: true, width: 2, color: '#E8E8E8' },
            typography: {
                enabled: true,
                fontName: 'Arial',
                fontSize: 26,
                tracking: 0,
                color: '#E8E8E8',
                orientation: 'radial',
                radiusOffset: 48,
                precision: 0,
                collisionMode: 'allow_overlap',
                labelEvery: 1
            },
            teeth: {
                enabled: true,
                count: 120,
                shape: 'rectangle',
                width: 3,
                height: 8,
                alignment: 'outer',
                rotationOffset: 0,
                color: '#F2A33C',
                opacity: 100
            },
            indicators: {
                marker: true,
                progress: false,
                highlight: false,
                markerColor: '#F2A33C',
                markerSize: 12,
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
        }
    ];

    /* ------------------------------------------------------------------ */
    /* LocalStorage persistence for user presets (with memory fallback)    */
    /* ------------------------------------------------------------------ */

    var inMemoryFallback = [];

    function readUserPresets() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                var raw = window.localStorage.getItem(STORAGE_KEY);
                if (!raw) { return []; }
                var parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            }
            return inMemoryFallback.slice();
        } catch (e) {
            return inMemoryFallback.slice();
        }
    }

    function writeUserPresets(presets) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
                return true;
            }
            inMemoryFallback = presets.slice();
            return true;
        } catch (e) {
            inMemoryFallback = presets.slice();
            return false;
        }
    }

    /* ------------------------------------------------------------------ */
    /* Preset queries & operations                                         */
    /* ------------------------------------------------------------------ */

    function getAll() {
        var user = readUserPresets();
        var all = [];
        var i;
        for (i = 0; i < BUILTIN_PRESETS.length; i++) {
            all.push(JSON.parse(JSON.stringify(BUILTIN_PRESETS[i])));
        }
        for (i = 0; i < user.length; i++) {
            all.push(JSON.parse(JSON.stringify(user[i])));
        }
        return all;
    }

    function getById(id) {
        if (!id) { return null; }
        var all = getAll();
        for (var i = 0; i < all.length; i++) {
            var p = all[i];
            if (p.preset && p.preset.id === id) {
                return p;
            }
        }
        return null;
    }

    function isBuiltin(id) {
        for (var i = 0; i < BUILTIN_PRESETS.length; i++) {
            if (BUILTIN_PRESETS[i].preset && BUILTIN_PRESETS[i].preset.id === id) {
                return true;
            }
        }
        return false;
    }

    function generateUserPresetId(name) {
        var base = String(name || 'preset')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (!base) { base = 'user-preset'; }
        var id = 'user-' + base;
        var existing = getById(id);
        if (!existing) { return id; }
        var counter = 2;
        while (getById(id + '-' + counter)) {
            counter++;
        }
        return id + '-' + counter;
    }

    /**
     * Saves or updates a user preset. Built-in presets are protected from being overwritten.
     */
    function saveUserPreset(name, configData, existingId) {
        if (!name || typeof name !== 'string' || !name.trim()) {
            throw new Error('Preset name cannot be empty.');
        }
        name = name.trim();

        if (existingId && isBuiltin(existingId)) {
            throw new Error('Cannot overwrite built-in preset "' + existingId + '". Use duplicate or choose a new name.');
        }

        var clone = JSON.parse(JSON.stringify(configData));
        var targetId = existingId || generateUserPresetId(name);

        clone.schemaVersion = '1.0';
        clone.product = 'TIME_RULER';
        clone.preset = {
            id: targetId,
            name: name,
            description: (clone.preset && clone.preset.description) ? clone.preset.description : ('User preset: ' + name),
            builtin: false,
            modifiedAt: new Date().toISOString()
        };

        var userList = readUserPresets();
        var index = -1;
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].preset && userList[i].preset.id === targetId) {
                index = i;
                break;
            }
        }

        if (index >= 0) {
            userList[index] = clone;
        } else {
            userList.push(clone);
        }

        writeUserPresets(userList);
        return clone;
    }

    /**
     * Duplicates any preset (built-in or user) as a new user preset.
     */
    function duplicatePreset(sourceId, newName) {
        var source = getById(sourceId);
        if (!source) {
            throw new Error('Preset not found: ' + sourceId);
        }
        var name = (newName && typeof newName === 'string' && newName.trim())
            ? newName.trim()
            : ((source.preset ? source.preset.name : sourceId) + ' (Copy)');
        return saveUserPreset(name, source, null);
    }

    /**
     * Deletes a user preset. Throws if attempting to delete a built-in preset.
     */
    function deleteUserPreset(id) {
        if (isBuiltin(id)) {
            throw new Error('Cannot delete built-in preset "' + id + '".');
        }
        var userList = readUserPresets();
        var filtered = [];
        var found = false;
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].preset && userList[i].preset.id === id) {
                found = true;
            } else {
                filtered.push(userList[i]);
            }
        }
        if (!found) {
            throw new Error('User preset not found: ' + id);
        }
        writeUserPresets(filtered);
        return true;
    }

    /**
     * Loads a preset's configuration into TIME_RULER_STATE and updates the UI form.
     */
    function loadPresetIntoState(id) {
        var preset = getById(id);
        if (!preset) {
            throw new Error('Preset not found: ' + id);
        }
        if (typeof TIME_RULER_STATE !== 'undefined' && typeof TIME_RULER_STATE.loadConfig === 'function') {
            TIME_RULER_STATE.loadConfig(preset);
        } else if (typeof TIME_RULER_STATE !== 'undefined') {
            // Fallback
            var known = ['schemaVersion', 'product', 'geometry', 'time', 'graduations',
                         'baseline', 'typography', 'teeth', 'indicators', 'output', 'animation'];
            TIME_RULER_STATE.loadDefaultConfig();
            for (var i = 0; i < known.length; i++) {
                var k = known[i];
                if (preset[k] !== undefined) {
                    TIME_RULER_STATE.setPath(k, preset[k]);
                }
            }
        }
        if (typeof TIME_RULER_FORM !== 'undefined' && typeof TIME_RULER_FORM.syncFormFromState === 'function') {
            TIME_RULER_FORM.syncFormFromState();
        } else if (typeof TIME_RULER_FORM !== 'undefined' && typeof TIME_RULER_FORM.bindForm === 'function') {
            TIME_RULER_FORM.bindForm(TIME_RULER_STATE.getConfig());
        }
        return preset;
    }

    /* Public API ------------------------------------------------------- */
    return {
        BUILTIN_PRESETS: BUILTIN_PRESETS,
        getAll: getAll,
        getById: getById,
        isBuiltin: isBuiltin,
        saveUserPreset: saveUserPreset,
        duplicatePreset: duplicatePreset,
        deleteUserPreset: deleteUserPreset,
        loadPresetIntoState: loadPresetIntoState
    };
})();
