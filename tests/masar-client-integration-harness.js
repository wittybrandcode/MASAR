'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passCount = 0;
function test(name, fn) {
    try {
        fn();
        passCount++;
        console.log('[PASS] ' + name);
    } catch (err) {
        console.error('[FAIL] ' + name + ': ' + (err && err.stack ? err.stack : err));
        process.exit(1);
    }
}

const CLIENT_DIR = path.resolve(__dirname, '../client');
const INDEX_HTML_PATH = path.join(CLIENT_DIR, 'index.html');
const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

console.log('--- RUNNING MASAR CLIENT INTEGRATION & CONTRACTS SUITE ---');

test('index.html has zero CDN links, zero dead node-manager script, and zero inline display:none on hud-tooltip', () => {
    assert.strictEqual(/fonts\.googleapis\.com/i.test(indexHtml), false, 'Must not reference Google Fonts CDN');
    assert.strictEqual(/node-manager\.js/i.test(indexHtml), false, 'Must not load dead node-manager.js');
    const tooltipLine = (indexHtml.match(/<div[^>]*id=["']hud-tooltip["'][^>]*>/i) || [''])[0];
    assert.ok(tooltipLine.length > 0, '#hud-tooltip must exist in index.html');
    assert.strictEqual(/display\s*:\s*none/i.test(tooltipLine), false, '#hud-tooltip must use .u-hidden instead of inline display:none');
    assert.strictEqual(tooltipLine.indexOf('u-hidden') !== -1, true, '#hud-tooltip must have u-hidden class initially');
});

test('All active CSS files have zero unmatched braces, intact :root tokens, and responsive @media rules', () => {
    const cssFiles = [
        'assets/fonts/cairo/cairo.css',
        'assets/fonts/phosphor/phosphor.css',
        'css/01-tokens.css',
        'css/02-base-layout.css',
        'css/03-cards.css',
        'css/04-controls-theme.css'
    ];
    cssFiles.forEach(rel => {
        const src = fs.readFileSync(path.join(CLIENT_DIR, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        let depth = 0;
        for (const ch of src) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
            assert.ok(depth >= 0, rel + ' has stray closing brace (depth < 0)');
        }
        assert.strictEqual(depth, 0, rel + ' has unclosed brace(s): depth=' + depth);
    });

    const baseCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/02-base-layout.css'), 'utf8');
    assert.ok(/user-select\s*:\s*text/.test(baseCss), 'Inputs/textareas must restore user-select: text');
    assert.strictEqual(/border-radius\s*:\s*0(px)?\s*!important/.test(baseCss), false, 'Global * reset must not force border-radius: 0 !important');

    const ctrlCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/04-controls-theme.css'), 'utf8');
    assert.ok(/@media\s*\(\s*max-width\s*:\s*360px\s*\)/.test(ctrlCss), 'Must support <=360px responsive media query (320px dock)');
    assert.ok(/@media\s*\(\s*min-width\s*:\s*600px\s*\)/.test(ctrlCss), 'Must support >=600px multi-column media query (1200px panel)');
});

test('All static DOM IDs referenced via $("...") in client modules exist in index.html', () => {
    const htmlIds = new Set();
    const idRe = /\bid=["']([^"']+)["']/g;
    let m;
    while ((m = idRe.exec(indexHtml)) !== null) {
        htmlIds.add(m[1]);
    }

    const jsDirs = [path.join(CLIENT_DIR, 'js'), path.join(CLIENT_DIR, 'js/modules')];
    const missingRefs = [];
    const lookupRe = /\$\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/g;
    const byIdRe = /getElementById\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/g;

    jsDirs.forEach(dir => {
        fs.readdirSync(dir).forEach(f => {
            if (!f.endsWith('.js')) return;
            const full = path.join(dir, f);
            const src = fs.readFileSync(full, 'utf8');
            let rm;
            while ((rm = lookupRe.exec(src)) !== null) {
                const targetId = rm[1];
                if (!htmlIds.has(targetId)) {
                    missingRefs.push(f + ': $(' + targetId + ')');
                }
            }
            while ((rm = byIdRe.exec(src)) !== null) {
                const targetId = rm[1];
                if (!htmlIds.has(targetId)) {
                    missingRefs.push(f + ': getElementById(' + targetId + ')');
                }
            }
        });
    });

    assert.strictEqual(missingRefs.length, 0, 'Missing DOM IDs referenced in JS: ' + missingRefs.join(', '));
});

test('svg-shapes: compact arc flags, polygon commas, scientific notation, Bézier bounds, ANCHORS Y-axis, and triangle alias', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));

    // 1. Triangle alias
    const tri = TR_SVG_SHAPES.getShapeById('triangle');
    assert.ok(tri && tri.id !== 'circle', 'triangle must not fall back to circle');

    // 2. Compact arc 0150
    const arcRes = TR_SVG_SHAPES.parseSvgString('<svg><path d="M 0 0 A 25 25 0 0150 50"/></svg>', { autoFit: false });
    assert.strictEqual(arcRes.ok, true, 'Compact arc A 25 25 0 0150 50 must parse');
    const arcPts = arcRes.subPaths[0].vertices;
    const lastPt = arcPts[arcPts.length - 1];
    assert.ok(Math.abs(lastPt[0] - 50) < 0.1 && Math.abs(lastPt[1] - 50) < 0.1, 'Arc endpoint must reach (50,50)');

    // 3. Polygon with comma-space pairs
    const polyRes = TR_SVG_SHAPES.parseSvgString('<svg><polygon points="10, 10 110, 10 60, 110"/></svg>', { autoFit: false });
    assert.strictEqual(polyRes.ok, true);
    assert.strictEqual(polyRes.subPaths[0].vertices.length, 3);

    // 4. Scientific notation 1e-5
    const sciRes = TR_SVG_SHAPES.parseSvgString('M 0 0 L 1e-5 100 L 100 100 Z', { autoFit: false });
    assert.strictEqual(sciRes.ok, true, 'Pure path with scientific notation must parse');

    // 5. Curve extrema in bounds (C 0 200, 100 200, 100 0)
    const curveRes = TR_SVG_SHAPES.parseSvgString('M 0 0 C 0 200 100 200 100 0', { autoFit: false });
    assert.strictEqual(curveRes.ok, true);
    assert.ok(curveRes.bounds.maxY > 100, 'Bézier bounds must capture curve excursion above y=100');

    // 6. Pin ANCHORS & centerOffset orientation
    assert.strictEqual(TR_SVG_SHAPES.ANCHORS['bottom-center'].y, 256, 'bottom-center anchor must be y=256');
    assert.strictEqual(TR_SVG_SHAPES.ANCHORS['top-center'].y, 0, 'top-center anchor must be y=0');
    const pinVec = TR_SVG_SHAPES.computeAeVector('pin', 24);
    assert.ok(pinVec.bounds.minY < -10, 'Pin anchored at bottom-center must rise into -Y above track');
    assert.ok(pinVec.centerOffset[1] < -5, 'Pin label centerOffset must sit inside bulb above track');

    // 7. Hollow SVG markup
    const hollowSvg = TR_SVG_SHAPES.getSvgMarkup('circle', '#10b981', 20, true);
    assert.ok(hollowSvg.indexOf('fill: none') !== -1 && hollowSvg.indexOf('stroke: currentColor') !== -1);
});

test('batch-importer: tech palette, 4-column mapping, and clean applyPreset reset', () => {
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();
    const batchSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/batch-importer.js'), 'utf8');
    const batchDoc = { getElementById: () => null, querySelectorAll: () => [] };
    const batch = new Function('TIME_RULER_STATE_STORE', 'document', batchSrc + '\nreturn TIME_RULER_BATCH_IMPORTER;')(store, batchDoc);

    assert.notStrictEqual(batch.MOTION_PALETTES.tech.lineColor, batch.MOTION_PALETTES.emerald.lineColor, 'Tech Blue must differ from Emerald');

    // Preset leak prevention: retro_neon has solid boxes + circleStroke '#ffe4e6', minimal_clean has boxMode 'off'
    const state = store.getDefaultState();
    state.lineStyle = 'dashed';
    state.terminalColor = '#ff00ff';
    batch.applyPreset('minimal_clean', state);
    assert.strictEqual(state.boxMode, 'off');
    assert.strictEqual(state.boxEnabled, false);
    assert.strictEqual(state.lineStyle, 'solid', 'Applying minimal_clean must clear leftover dashed lineStyle');
    assert.strictEqual(state.terminalColor, '', 'Applying minimal_clean must clear leftover terminalColor');
});

test('state-store: syncLegacyNodeFields non-destructive preservation and XSS escapeHtml', () => {
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();

    const escaped = store.escapeHtml('<img src=x onerror="alert(\'1\')">&');
    assert.strictEqual(escaped.indexOf('<'), -1);
    assert.strictEqual(escaped.indexOf('"'), -1);
    assert.strictEqual(escaped.indexOf("'"), -1);

    const node = {
        title: 'Title Kept',
        description: 'Desc Kept',
        sources: {
            center: { type: 'shape_number', value: '01', shape: 'inherit' },
            front: { type: 'text', title: 'Hidden Title', text: 'Visible Desc', items: ['Pt1', 'Pt2'], visible: true },
            behind: { type: 'none', visible: false }
        }
    };
    store.syncLegacyNodeFields(node, 0);
    assert.strictEqual(node.sources.front.title, 'Hidden Title', 'Switching to text must keep saved front.title');
    assert.deepStrictEqual(node.sources.front.items, ['Pt1', 'Pt2'], 'Switching to text must keep saved front.items');
});

test('host-bridge: zero-preserving payload, no dead frontBox* keys, horizontal side normalization, dirtyScope skipping', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();

    let capturedPayload = null;
    const bridgeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/host-bridge.js'), 'utf8');
    const mockDom = { getElementById: () => null, querySelector: () => null };
    const hostBridge = new Function('document', 'TIME_RULER_STATE_STORE', 'TR_SVG_SHAPES', 'TIME_RULER_BRIDGE',
        bridgeSrc + '\nreturn TIME_RULER_HOST_BRIDGE;'
    )(mockDom, store, TR_SVG_SHAPES, {
        callHost: function (fn, payload, cb) {
            capturedPayload = payload;
            if (cb) cb({ ok: true });
        }
    });

    const state = store.getDefaultState();
    state.orientation = 'horizontal';
    state.contentSide = 'left';
    state.circleStrokeWidth = 0;
    state.titleBoxRadius = 0;
    state.titleBoxFillOpacity = 0;
    state.boxStrokeWidth = 0;

    hostBridge.executeHostGenerate(state, true, { dirtyScope: 'text' });
    assert.strictEqual(capturedPayload.contentSide, 'top', 'Horizontal left must normalize to top');
    assert.strictEqual(capturedPayload.circleStrokeWidth, 0, 'Must preserve 0 stroke width');
    assert.strictEqual(capturedPayload.titleBoxRadius, 0, 'Must preserve 0 radius');
    assert.strictEqual(capturedPayload.titleBoxFillOpacity, 0, 'Must preserve 0 fill opacity');
    assert.strictEqual('frontBoxEnabled' in capturedPayload, false, 'Dead frontBoxEnabled must not be sent');
    assert.strictEqual(capturedPayload.dirtyScope, 'text');
    assert.strictEqual(capturedPayload.nodes[0].vectorData.subPaths, undefined, 'dirtyScope=text must omit heavy subPaths array');
});

test('bridge: settled flag prevents late timeout/callback double completion', () => {
    const callbacksFired = [];
    const timerQueue = [];
    const mockWindow = {
        cep: true,
        setTimeout: function (fn) { timerQueue.push(fn); return timerQueue.length; },
        clearTimeout: function () {}
    };
    const MockCS = function () {
        this.getSystemPath = function () { return 'C:/ext'; };
        this.evalScript = function (script, cb) { mockWindow._lastCb = cb; };
    };
    const bridgeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/bridge.js'), 'utf8');
    const bridge = new Function('window', 'CSInterface', 'SystemPath', 'document',
        bridgeSrc + '\nreturn TIME_RULER_BRIDGE;'
    )(mockWindow, MockCS, { EXTENSION: 'extension' }, { addEventListener: function () {} });

    bridge.init();
    bridge.callHost('generate', { test: 1 }, function (res) { callbacksFired.push(res); });
    // Fire timeout BEFORE late host callback arrives
    timerQueue.forEach(fn => fn());
    // Now simulate late host callback arriving after timeout
    if (mockWindow._lastCb) mockWindow._lastCb('{"ok":true,"code":"OK","message":"late"}');

    assert.strictEqual(callbacksFired.length, 1, 'Late callback must not invoke callback twice after timeout');
    assert.strictEqual(callbacksFired[0].code, 'TIMEOUT');
});

test('global-controls: seg-box-mode glass/solid, stroke width propagation, and num color live update', () => {
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();
    const gcSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/global-controls.js'), 'utf8');

    const listeners = {};
    const makeEl = (id, initVal) => ({
        id,
        value: initVal || '',
        style: {},
        dataset: {},
        classList: { contains: () => false, toggle: () => {}, add: () => {}, remove: () => {} },
        querySelectorAll: () => [],
        addEventListener: function (ev, fn) { listeners[id + ':' + ev] = fn; }
    });
    const els = {
        'rng-box-stroke-w': makeEl('rng-box-stroke-w', '2.5'),
        'inp-box-stroke-w': makeEl('inp-box-stroke-w', '2.5'),
        'seg-box-mode': makeEl('seg-box-mode', '')
    };
    const mockDoc = {
        getElementById: id => els[id] || null,
        querySelectorAll: () => []
    };
    const gc = new Function('document', 'window', gcSrc + '\nreturn TIME_RULER_GLOBAL_CONTROLS;')(mockDoc, {});
    const state = store.getDefaultState();
    gc.bindAllGlobalControls(state, { onUpdate: () => {} });

    // Trigger seg-box-mode 'glass'
    listeners['seg-box-mode:click']({
        target: { closest: () => ({ getAttribute: k => (k === 'data-box-mode' ? 'glass' : null) }) }
    });
    assert.strictEqual(state.boxMode, 'glass');
    assert.strictEqual(state.titleBoxFillOpacity, 25);
    assert.strictEqual(state.descBoxFillOpacity, 25);
    assert.strictEqual(state.behindBoxFillOpacity, 25);

    // Trigger global box stroke width
    els['rng-box-stroke-w'].value = '4';
    listeners['rng-box-stroke-w:input']();
    assert.strictEqual(state.titleBoxStrokeWidth, 4);
    assert.strictEqual(state.descBoxStrokeWidth, 4);
    assert.strictEqual(state.behindBoxStrokeWidth, 4);
});

test('timeline-hud: initScrubbing matches .prop-row/.prop-lbl, clamps bounds, and builds safe tooltip DOM', () => {
    const hudSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/timeline-hud.js'), 'utf8');
    let lastWinListeners = {};
    const lblEl = {
        classList: { add: function () {} },
        addEventListener: function (ev, fn) { lblEl['_on_' + ev] = fn; }
    };
    const rngLength = {
        min: '400', max: '4000', value: '1500',
        closest: sel => sel.indexOf('.prop-row') !== -1 ? { querySelector: s => s.indexOf('.prop-lbl') !== -1 ? lblEl : null } : null
    };
    const inpLength = { min: '200', max: '10000', value: '1500' };
    let bridgeCalls = [];
    const hud = new Function('document', 'window', 'TIME_RULER_BRIDGE', 'TIME_RULER_STATE_STORE',
        hudSrc + '\nreturn TIME_RULER_TIMELINE_HUD;'
    )(
        {
            getElementById: id => id === 'rng-length' ? rngLength : (id === 'inp-length' ? inpLength : null),
            querySelectorAll: () => [],
            body: { classList: { add: () => {}, remove: () => {} } }
        },
        {
            addEventListener: (ev, fn) => { lastWinListeners[ev] = fn; },
            removeEventListener: (ev) => { delete lastWinListeners[ev]; }
        },
        { callHost: (m, a) => bridgeCalls.push(m) },
        { saveState: () => {} }
    );

    const state = { length: 1500 };
    hud.initScrubbing(state);
    assert.ok(typeof lblEl._on_pointerdown === 'function', 'initScrubbing must bind to .prop-lbl inside .prop-row');

    lblEl._on_pointerdown({ preventDefault: () => {}, clientX: 100 });
    lastWinListeners.pointermove({ clientX: -99999 }); // massive negative drag -> clamp at minLimit (200)
    assert.strictEqual(state.length, 200, 'Scrubbing must clamp at input min=200');
    lastWinListeners.pointercancel();
    assert.deepStrictEqual(bridgeCalls, ['startUndoSession', 'endUndoSession'], 'pointercancel must cleanly close undo session');
});

function loadCardBuilderBundle(mockDoc, mockWin, TR_SVG_SHAPES, store) {
    const modDir = path.join(CLIENT_DIR, 'js/modules');
    const scSrc = fs.readFileSync(path.join(modDir, 'card-stream-controls.js'), 'utf8');
    const sdSrc = fs.readFileSync(path.join(modDir, 'card-shape-drawer.js'), 'utf8');
    const stSrc = fs.readFileSync(path.join(modDir, 'card-source-tabs.js'), 'utf8');
    const cbSrc = fs.readFileSync(path.join(modDir, 'card-builder.js'), 'utf8');

    const streamControls = new Function('document', 'window', 'TIME_RULER_STATE_STORE',
        scSrc + '\nreturn TIME_RULER_CARD_STREAM_CONTROLS;'
    )(mockDoc, mockWin, store);
    const shapeDrawer = new Function('document', 'window', 'TR_SVG_SHAPES',
        sdSrc + '\nreturn TIME_RULER_CARD_SHAPE_DRAWER;'
    )(mockDoc, mockWin, TR_SVG_SHAPES);
    const sourceTabs = new Function('document', 'window', 'TR_SVG_SHAPES',
        stSrc + '\nreturn TIME_RULER_CARD_SOURCE_TABS;'
    )(mockDoc, mockWin, TR_SVG_SHAPES);

    return new Function(
        'document', 'window', 'TR_SVG_SHAPES', 'TIME_RULER_STATE_STORE',
        'TIME_RULER_CARD_STREAM_CONTROLS', 'TIME_RULER_CARD_SHAPE_DRAWER', 'TIME_RULER_CARD_SOURCE_TABS',
        cbSrc + '\nreturn TIME_RULER_CARD_BUILDER;'
    )(mockDoc, mockWin, TR_SVG_SHAPES, store, streamControls, shapeDrawer, sourceTabs);
}

test('card-builder: incremental updateNodeCard, lazy drawer mount, Front/Center icon exclusivity, and deleteNode openDrawerIndex shift', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();

    // Minimal hierarchical DOM shim supporting Element creation, querySelector, dataset, classList, replaceChild
    function mkEl(tag) {
        const el = {
            tagName: tag.toUpperCase(),
            children: [],
            parentNode: null,
            parentElement: null,
            dataset: {},
            style: {},
            listeners: {},
            _className: '',
            _innerHTML: '',
            value: '',
            disabled: false,
            title: '',
            type: '',
            placeholder: '',
            textContent: '',
            selected: false,
            get className() { return el._className; },
            set className(v) { el._className = String(v || ''); },
            get innerHTML() { return el._innerHTML; },
            set innerHTML(v) { el._innerHTML = String(v || ''); if (v === '') el.children = []; },
            classList: {
                add: function () {
                    const set = new Set(el._className.split(/\s+/).filter(Boolean));
                    for (let i = 0; i < arguments.length; i++) set.add(arguments[i]);
                    el._className = Array.from(set).join(' ');
                },
                remove: function () {
                    const set = new Set(el._className.split(/\s+/).filter(Boolean));
                    for (let i = 0; i < arguments.length; i++) set.delete(arguments[i]);
                    el._className = Array.from(set).join(' ');
                },
                toggle: function (cls, force) {
                    const set = new Set(el._className.split(/\s+/).filter(Boolean));
                    if (force === true || (force === undefined && !set.has(cls))) set.add(cls);
                    else set.delete(cls);
                    el._className = Array.from(set).join(' ');
                },
                contains: function (cls) { return el._className.split(/\s+/).includes(cls); }
            },
            appendChild: function (child) {
                if (child.tagName === 'FRAGMENT') {
                    child.children.slice().forEach(c => el.appendChild(c));
                    return child;
                }
                child.parentNode = el;
                child.parentElement = el;
                el.children.push(child);
                return child;
            },
            replaceChild: function (newC, oldC) {
                const i = el.children.indexOf(oldC);
                if (i !== -1) {
                    newC.parentNode = el;
                    newC.parentElement = el;
                    el.children[i] = newC;
                }
                return oldC;
            },
            addEventListener: function (ev, fn) {
                if (!el.listeners[ev]) el.listeners[ev] = [];
                el.listeners[ev].push(fn);
            },
            querySelector: function (sel) {
                if (sel.indexOf('data-node-index=') !== -1) {
                    const m = /data-node-index=["']([^"']+)["']/.exec(sel);
                    if (m) return el.children.find(c => c.dataset.nodeIndex === m[1]) || null;
                }
                const clsMatch = /^\.([a-zA-Z0-9_-]+)/.exec(sel);
                if (clsMatch) {
                    const targetCls = clsMatch[1];
                    const stack = el.children.slice();
                    while (stack.length) {
                        const cur = stack.shift();
                        if (cur.classList && cur.classList.contains(targetCls)) return cur;
                        if (cur.children) stack.unshift.apply(stack, cur.children);
                    }
                }
                return null;
            },
            querySelectorAll: function (sel) {
                if (sel === '[data-stream][data-field]') {
                    const out = [];
                    const stack = el.children.slice();
                    while (stack.length) {
                        const cur = stack.shift();
                        if (cur.dataset && cur.dataset.stream !== undefined && cur.dataset.field !== undefined) out.push(cur);
                        if (cur.children) stack.unshift.apply(stack, cur.children);
                    }
                    return out;
                }
                const out = [];
                const cls = sel.replace(/^\./, '');
                const stack = el.children.slice();
                while (stack.length) {
                    const cur = stack.shift();
                    if (cur.classList && cur.classList.contains(cls)) out.push(cur);
                    if (cur.children) stack.unshift.apply(stack, cur.children);
                }
                return out;
            },
            closest: () => null
        };
        return el;
    }

    const container = mkEl('div');
    const tabCount = mkEl('span');
    const mockState = store.getDefaultState();
    mockState.nodes = [
        { number: '01', customShape: 'inherit', sources: { center: { type: 'shape_icon', icon: '★', shape: 'inherit', visible: true }, front: { type: 'title_text', title: 'T1', text: 'D1', showTitle: true, showDesc: true, visible: true }, behind: { type: 'none', visible: false } } },
        { number: '02', customShape: 'pin', sources: { center: { type: 'shape_number', value: '02', shape: 'pin', visible: true }, front: { type: 'title', title: 'T2', showTitle: true, visible: true }, behind: { type: 'none', visible: false } } },
        { number: '03', customShape: 'inherit', isCollapsed: true, sources: { center: { type: 'shape_number', value: '03', shape: 'inherit', visible: true }, front: { type: 'title', title: 'T3', showTitle: true, visible: true }, behind: { type: 'none', visible: false } } }
    ];

    const mockDoc = {
        getElementById: id => id === 'nodes-container' ? container : (id === 'txt-tab-count' ? tabCount : null),
        createElement: tag => mkEl(tag),
        createDocumentFragment: () => mkEl('fragment'),
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
    const mockWin = { TR_APP: { state: mockState }, state: mockState };

    const cb = loadCardBuilderBundle(mockDoc, mockWin, TR_SVG_SHAPES, store);

    cb.renderNodesList();
    assert.strictEqual(container.children.length, 3, 'Must render 3 node cards');

    // Collapsed node 2 must lazily skip building .node-source-tab-content
    assert.strictEqual(container.children[2].querySelector('.node-source-tab-content'), null, 'Collapsed card must not build tab content DOM');

    // Drawer closed by default -> lazy skipped
    assert.strictEqual(container.children[0].querySelector('.node-drawer'), null, 'Closed drawer must not be mounted');

    // Mutual exclusivity: Center shape_icon on node 0 must disable Front icon chip
    const chips0 = container.children[0].querySelectorAll('.btn-atomic-chip');
    const iconChip = chips0[chips0.length - 1];
    assert.strictEqual(iconChip.disabled, true, 'Front icon chip must be disabled when Center has icon');

    // Open drawer on node 2 (idx 2), then delete node 0 -> openDrawerIndex must decrement from 2 to 1!
    cb.setOpenDrawerIndex(2);
    cb.renderNodesList();
    assert.ok(container.children[2].querySelector('.node-drawer'), 'Opened drawer must mount on node 2');
    // Shape popover grid inside drawer must remain empty until clicked!
    const popGrid = container.children[2].querySelector('.shape-popover-grid');
    assert.strictEqual(popGrid.children.length, 0, 'Popover SVG grid must stay empty until dropdown trigger clicked');

    cb.deleteNode(0);
    assert.strictEqual(cb.getOpenDrawerIndex(), 1, 'Deleting node before openDrawerIndex must decrement openDrawerIndex');
});

test('state-store E1: schema v2 migration, user template migration, undo/redo history stack & coalescing', () => {
    const storageMem = {};
    const mockLS = {
        getItem: k => (storageMem.hasOwnProperty(k) ? storageMem[k] : null),
        setItem: (k, v) => { storageMem[k] = String(v); },
        removeItem: k => { delete storageMem[k]; }
    };
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function('localStorage', storeSrc + '\nreturn TIME_RULER_STATE_STORE;')(mockLS);

    // 1. Legacy v1 localStorage migration (frontBox* -> titleBox* / descBox*, no schemaVersion)
    mockLS.setItem(store.STORAGE_KEY, JSON.stringify({
        frontBoxColor: '#223344',
        frontBoxStrokeColor: '#ff5500',
        frontBoxRadius: 12,
        frontBoxEnabled: true,
        nodes: [{ title: 'Legacy Title', description: 'Legacy Desc' }]
    }));
    const loaded = store.getDefaultState();
    store.loadSavedState(loaded);
    assert.strictEqual(loaded.schemaVersion, 2, 'Loaded state must migrate to schemaVersion 2');
    assert.strictEqual(loaded.titleBoxFillColor, '#223344', 'frontBoxColor must migrate to titleBoxFillColor');
    assert.strictEqual(loaded.descBoxFillColor, '#223344', 'frontBoxColor must migrate to descBoxFillColor');
    assert.strictEqual(loaded.titleBoxStrokeColor, '#ff5500', 'frontBoxStrokeColor must migrate to titleBoxStrokeColor');
    assert.strictEqual(loaded.titleBoxRadius, 12, 'frontBoxRadius must migrate to titleBoxRadius');
    assert.strictEqual('frontBoxColor' in loaded, false, 'Migrated state must drop dead frontBoxColor');
    assert.strictEqual('frontBoxEnabled' in loaded, false, 'Migrated state must drop dead frontBoxEnabled');
    assert.ok(loaded.nodes[0].sources && loaded.nodes[0].sources.center && loaded.nodes[0].sources.front && loaded.nodes[0].sources.behind);

    // 2. Import legacy user template & apply via batch-importer
    const impRes = store.importUserTemplate({
        name: 'LegacyTpl',
        state: {
            frontBoxFillColor: '#112233',
            nodes: [{ title: 'T1', description: 'D1' }, { title: 'T2', description: 'D2' }]
        }
    });
    assert.strictEqual(impRes.ok, true);
    assert.strictEqual(impRes.template.state.schemaVersion, 2);
    assert.strictEqual(impRes.template.state.titleBoxFillColor, '#112233');
    assert.strictEqual('frontBoxFillColor' in impRes.template.state, false);

    // 3. History Stack: recordSnapshot, undoState, redoState, reference isolation, coalescing, max 30 cap
    const workState = store.getDefaultState();
    const originalRef = workState;
    store.resetHistory(workState, 'baseline');
    assert.strictEqual(store.canUndo(), false);
    assert.strictEqual(store.canRedo(), false);

    workState.nodes[0].sources.front.title = 'عنوان معدل 1';
    workState.titleBoxFillColor = '#abcdef';
    store.recordSnapshot(workState, 'تعديل عنوان', 0);
    assert.strictEqual(store.canUndo(), true);

    workState.nodes.pop();
    store.recordSnapshot(workState, 'حذف عقدة', 0);
    const countAfterPop = workState.nodes.length;

    const u1 = store.undoState(workState);
    assert.strictEqual(u1.ok, true);
    assert.strictEqual(workState, originalRef, 'undoState must preserve active state object identity');
    assert.strictEqual(workState.nodes.length, countAfterPop + 1, 'undoState must restore deleted node');
    assert.strictEqual(workState.nodes[0].sources.front.title, 'عنوان معدل 1');
    assert.strictEqual(workState.titleBoxFillColor, '#abcdef');
    assert.strictEqual(store.canRedo(), true);

    const r1 = store.redoState(workState);
    assert.strictEqual(r1.ok, true);
    assert.strictEqual(workState.nodes.length, countAfterPop, 'redoState must re-apply node deletion');
    assert.strictEqual(store.canRedo(), false);

    // Coalescing within 500ms should collapse consecutive edits with same label into one snapshot
    const pastBeforeCoalesce = store.getHistoryInfo().pastCount;
    workState.length = 1600;
    store.recordSnapshot(workState, 'تعديل', 500);
    workState.length = 1750;
    store.recordSnapshot(workState, 'تعديل', 500);
    assert.strictEqual(store.getHistoryInfo().pastCount, pastBeforeCoalesce + 1, 'Rapid edits with coalesceMs=500 must coalesce');

    // Max 30 history entries cap
    for (let i = 0; i < 35; i++) {
        workState.length = 2000 + i;
        store.recordSnapshot(workState, 'step_' + i, 0);
    }
    assert.strictEqual(store.getHistoryInfo().pastCount <= 30, true, 'History past stack must be capped at 30');
});

test('card-builder E1: explicit data-stream/data-field tags and harvestActiveInputs preserves front.text when showList active', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();
    const cbSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/card-builder.js'), 'utf8');
    const tabsSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/card-source-tabs.js'), 'utf8');
    assert.strictEqual(cbSrc.indexOf('input[title*="رمز"]'), -1, 'Fragile title selector must be removed from card-builder.js');
    assert.strictEqual(tabsSrc.indexOf('input[title*="رمز"]'), -1, 'Fragile title selector must be absent from card-source-tabs.js');

    function mkEl(tag) {
        const el = {
            tagName: tag.toUpperCase(),
            children: [],
            parentNode: null,
            parentElement: null,
            dataset: {},
            style: {},
            listeners: {},
            _className: '',
            _innerHTML: '',
            value: '',
            disabled: false,
            title: '',
            type: '',
            placeholder: '',
            textContent: '',
            selected: false,
            get className() { return el._className; },
            set className(v) { el._className = String(v || ''); },
            get innerHTML() { return el._innerHTML; },
            set innerHTML(v) { el._innerHTML = String(v || ''); if (v === '') el.children = []; },
            classList: {
                add: function () {
                    const set = new Set(el._className.split(/\s+/).filter(Boolean));
                    for (let i = 0; i < arguments.length; i++) set.add(arguments[i]);
                    el._className = Array.from(set).join(' ');
                },
                remove: function () {
                    const set = new Set(el._className.split(/\s+/).filter(Boolean));
                    for (let i = 0; i < arguments.length; i++) set.delete(arguments[i]);
                    el._className = Array.from(set).join(' ');
                },
                toggle: function (cls, force) {
                    const set = new Set(el._className.split(/\s+/).filter(Boolean));
                    if (force === true || (force === undefined && !set.has(cls))) set.add(cls);
                    else set.delete(cls);
                    el._className = Array.from(set).join(' ');
                },
                contains: function (cls) { return el._className.split(/\s+/).includes(cls); }
            },
            appendChild: function (child) {
                if (child.tagName === 'FRAGMENT') {
                    child.children.slice().forEach(c => el.appendChild(c));
                    return child;
                }
                child.parentNode = el;
                child.parentElement = el;
                el.children.push(child);
                return child;
            },
            addEventListener: function (ev, fn) {
                if (!el.listeners[ev]) el.listeners[ev] = [];
                el.listeners[ev].push(fn);
            },
            querySelector: function (sel) {
                const list = el.querySelectorAll(sel);
                return list.length ? list[0] : null;
            },
            querySelectorAll: function (sel) {
                const out = [];
                const stack = el.children.slice();
                while (stack.length) {
                    const cur = stack.shift();
                    if (sel === '[data-stream][data-field]') {
                        if (cur.dataset && cur.dataset.stream !== undefined && cur.dataset.field !== undefined) out.push(cur);
                    } else if (/^\./.test(sel)) {
                        const cls = sel.slice(1);
                        if (cur.classList && cur.classList.contains(cls)) out.push(cur);
                    }
                    if (cur.children) stack.unshift.apply(stack, cur.children);
                }
                return out;
            },
            closest: () => null
        };
        return el;
    }

    const container = mkEl('div');
    const mockState = store.getDefaultState();
    mockState.nodes = [
        {
            number: '01',
            customShape: 'inherit',
            activeSourceTab: 'front',
            sources: {
                center: { type: 'shape_number', value: '01', shape: 'inherit', visible: true },
                front: {
                    type: 'title_list',
                    title: 'عنوان أصلي',
                    text: 'وصف محفوظ',
                    items: ['قديم 1'],
                    icon: '★',
                    badge: '#01',
                    showTitle: true,
                    showDesc: false,
                    showList: true,
                    showIcon: true,
                    showBadge: true,
                    visible: true
                },
                behind: { type: 'none', visible: false }
            }
        }
    ];

    const mockDoc = {
        getElementById: id => id === 'nodes-container' ? container : null,
        createElement: tag => mkEl(tag),
        createDocumentFragment: () => mkEl('fragment'),
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
    const mockWin = { TR_APP: { state: mockState }, state: mockState };
    const cb = loadCardBuilderBundle(mockDoc, mockWin, TR_SVG_SHAPES, store);

    cb.renderNodesList();
    const tagged = container.querySelectorAll('[data-stream][data-field]');
    const fieldsMap = {};
    tagged.forEach(el => { fieldsMap[el.dataset.stream + ':' + el.dataset.field] = el; });

    assert.ok(fieldsMap['front:title'], 'Front title input must carry data-stream="front" data-field="title"');
    assert.ok(fieldsMap['front:list'], 'Front list textarea must carry data-stream="front" data-field="list"');
    assert.ok(fieldsMap['front:icon'], 'Front icon input must carry data-stream="front" data-field="icon"');
    assert.ok(fieldsMap['front:badge'], 'Front badge input must carry data-stream="front" data-field="badge"');

    // Simulate uncommitted edits before harvestActiveInputs()
    fieldsMap['front:title'].value = 'عنوان جديد';
    fieldsMap['front:list'].value = '• البند الأول\n• البند الثاني';
    fieldsMap['front:icon'].value = '⚡';

    cb.harvestActiveInputs();
    const front = mockState.nodes[0].sources.front;
    assert.strictEqual(front.title, 'عنوان جديد');
    assert.deepStrictEqual(front.items, ['البند الأول', 'البند الثاني']);
    assert.strictEqual(front.icon, '⚡');
    assert.strictEqual(front.text, 'وصف محفوظ', 'harvestActiveInputs must preserve front.text when list is active');
});

test('E1 integration: batch-importer legacy template migration and app.js Ctrl+Z/Ctrl+Y focus guards', () => {
    const storageMem = {};
    const mockLS = {
        getItem: k => (storageMem.hasOwnProperty(k) ? storageMem[k] : null),
        setItem: (k, v) => { storageMem[k] = String(v); },
        removeItem: k => { delete storageMem[k]; }
    };
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function('localStorage', storeSrc + '\nreturn TIME_RULER_STATE_STORE;')(mockLS);
    const batchSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/batch-importer.js'), 'utf8');
    const batchDoc = { getElementById: () => null, querySelectorAll: () => [] };
    const batch = new Function('TIME_RULER_STATE_STORE', 'document', batchSrc + '\nreturn TIME_RULER_BATCH_IMPORTER;')(store, batchDoc);

    // Legacy raw localStorage template written directly before E1 (unmigrated)
    mockLS.setItem('MASAR_USER_PRESETS_V1', JSON.stringify([{
        id: 'legacy_1',
        name: 'قالب قديم',
        state: {
            frontBoxColor: '#334455',
            nodes: [{ title: 'N1', description: 'D1' }, { title: 'N2', description: 'D2' }]
        }
    }]));
    const targetState = store.getDefaultState();
    let appliedTpl = null;
    batch.applyUserTemplate('legacy_1', targetState, tpl => { appliedTpl = tpl; });
    assert.ok(appliedTpl);
    assert.strictEqual(targetState.schemaVersion, 2);
    assert.strictEqual(targetState.titleBoxFillColor, '#334455');
    assert.strictEqual('frontBoxColor' in targetState, false);

    // App.js Ctrl+Z / Ctrl+Y shortcut behavior & #btn-undo / #btn-redo states
    const appSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/app.js'), 'utf8');
    const docListeners = {};
    const btnUndo = { disabled: true, title: '', addEventListener: (ev, fn) => { btnUndo['_on_' + ev] = fn; } };
    const btnRedo = { disabled: true, title: '', addEventListener: (ev, fn) => { btnRedo['_on_' + ev] = fn; } };
    const feedbackCalls = [];
    const syncCalls = [];
    const mockWin = { addEventListener: () => {} };
    const mockDoc = {
        readyState: 'loading',
        hidden: false,
        activeElement: null,
        getElementById: id => id === 'btn-undo' ? btnUndo : (id === 'btn-redo' ? btnRedo : null),
        querySelectorAll: () => [],
        addEventListener: (ev, fn) => {
            if (!docListeners[ev]) docListeners[ev] = [];
            docListeners[ev].push(fn);
        }
    };
    const noop = () => {};
    new Function(
        'document', 'window', 'localStorage', 'setInterval', 'clearInterval',
        'TIME_RULER_STATE_STORE', 'TIME_RULER_CARD_BUILDER', 'TIME_RULER_TIMELINE_HUD',
        'TIME_RULER_GLOBAL_CONTROLS', 'TIME_RULER_HOST_BRIDGE', 'TIME_RULER_SHAPES_ENGINE',
        'TIME_RULER_BATCH_IMPORTER',
        appSrc
    )(
        mockDoc, mockWin, mockLS, () => 1, noop,
        store,
        { renderNodesList: noop, updateReverseButtonUI: noop, addNode: noop, reverseNodesOrder: noop },
        { renderTimelineHUD: noop, initHUDInteractions: noop, initScrubbing: noop, selectNode: noop },
        { syncFormValues: noop, bindAllGlobalControls: noop },
        { requestLiveSync: (s, d) => syncCalls.push(d), setFeedback: (m, k) => feedbackCalls.push({ m, k }), safeUpdateCompStatus: noop },
        { initSvgImporterModal: noop, initGlobalShapeDropdown: noop },
        batch
    );

    // Trigger DOMContentLoaded to boot app.js
    docListeners['DOMContentLoaded'].forEach(fn => fn());
    assert.strictEqual(btnUndo.disabled, true, 'Undo button starts disabled at baseline');
    assert.strictEqual(btnRedo.disabled, true, 'Redo button starts disabled at baseline');

    // Simulate state change via TR_APP
    mockWin.TR_APP.state.nodes[0].sources.front.title = 'قبل التراجع';
    mockWin.TR_APP.saveState(false, { label: 'تعديل نص', coalesceMs: 0 });
    assert.strictEqual(btnUndo.disabled, false, 'Undo button must enable after change');

    // Text input focus: Ctrl+Z must be ignored so native text undo works
    let preventedInText = false;
    docListeners['keydown'].forEach(fn => fn({
        ctrlKey: true, metaKey: false, altKey: false, shiftKey: false, key: 'z', keyCode: 90,
        target: { tagName: 'INPUT', type: 'text' },
        preventDefault: () => { preventedInText = true; }
    }));
    assert.strictEqual(preventedInText, false, 'Ctrl+Z inside text input must NOT trigger panel undo');
    assert.strictEqual(mockWin.TR_APP.state.nodes[0].sources.front.title, 'قبل التراجع');

    // Range slider focus: Ctrl+Z MUST undo panel state and re-enable redo
    let preventedInRange = false;
    docListeners['keydown'].forEach(fn => fn({
        ctrlKey: true, metaKey: false, altKey: false, shiftKey: false, key: 'z', keyCode: 90,
        target: { tagName: 'INPUT', type: 'range' },
        preventDefault: () => { preventedInRange = true; }
    }));
    assert.strictEqual(preventedInRange, true, 'Ctrl+Z on range slider must trigger panel undo');
    assert.notStrictEqual(mockWin.TR_APP.state.nodes[0].sources.front.title, 'قبل التراجع');
    assert.strictEqual(btnRedo.disabled, false, 'Redo button must enable after undo');
    assert.strictEqual(syncCalls.length > 0, true, 'Undo must trigger requestLiveSync');

    // Redo via Ctrl+Shift+Z
    let preventedRedo = false;
    docListeners['keydown'].forEach(fn => fn({
        ctrlKey: true, metaKey: false, altKey: false, shiftKey: true, key: 'Z', keyCode: 90,
        target: { tagName: 'BODY' },
        preventDefault: () => { preventedRedo = true; }
    }));
    assert.strictEqual(preventedRedo, true);
    assert.strictEqual(mockWin.TR_APP.state.nodes[0].sources.front.title, 'قبل التراجع');
    assert.strictEqual(btnRedo.disabled, true);
});

test('E3 modularization: index.html script load order, card-* module exports, and host/src build sync', () => {
    // 1. Check index.html script order
    const order = [
        'js/modules/card-stream-controls.js',
        'js/modules/card-shape-drawer.js',
        'js/modules/card-source-tabs.js',
        'js/modules/card-builder.js',
        'js/app.js'
    ];
    let lastPos = -1;
    order.forEach(srcPath => {
        const idx = indexHtml.indexOf(srcPath);
        assert.ok(idx > lastPos, srcPath + ' must be included in index.html in strict dependency order');
        lastPos = idx;
    });

    // 2. Verify each extracted card-* module exports its expected API cleanly
    const modDir = path.join(CLIENT_DIR, 'js/modules');
    const scMod = require(path.join(modDir, 'card-stream-controls.js'));
    assert.strictEqual(typeof scMod.createStreamStylingBar, 'function');
    assert.strictEqual(typeof scMod.createStreamBoxDrawer, 'function');
    assert.strictEqual(typeof scMod.createSymbolPickerRow, 'function');
    assert.strictEqual(typeof scMod.createBadgePresetsRow, 'function');

    const sdMod = require(path.join(modDir, 'card-shape-drawer.js'));
    assert.strictEqual(typeof sdMod.bindGlobalShapePopoverDismiss, 'function');
    assert.strictEqual(typeof sdMod.buildCardShapeDrawer, 'function');

    const stMod = require(path.join(modDir, 'card-source-tabs.js'));
    assert.strictEqual(typeof stMod.buildCenterSourceTab, 'function');
    assert.strictEqual(typeof stMod.buildStreamSourceTab, 'function');
    assert.strictEqual(typeof stMod.harvestActiveInputs, 'function');

    // Check bloat reduction (< 750 lines per module vs previous 2,300+ lines)
    ['card-stream-controls.js', 'card-shape-drawer.js', 'card-source-tabs.js', 'card-builder.js'].forEach(f => {
        const lineCount = fs.readFileSync(path.join(modDir, f), 'utf8').split(/\r?\n/).length;
        assert.ok(lineCount < 750, f + ' should stay modular under 750 lines (got ' + lineCount + ')');
    });

    // 3. Verify host/src/*.jsx bundles cleanly via scripts/build-host.js and matches host/bootstrap.jsx
    const buildHostMod = require(path.resolve(__dirname, '../scripts/build-host.js'));
    const buildRes = buildHostMod.buildHost({ dryRun: true });
    assert.strictEqual(buildRes.ok, true);
    assert.strictEqual(buildRes.modules.length, 8, 'Expected 8 modular files in host/src/');
    const actualBootstrap = fs.readFileSync(buildHostMod.OUT_FILE, 'utf8').replace(/\r\n/g, '\n');
    assert.strictEqual(actualBootstrap, buildRes.content, 'host/bootstrap.jsx must stay strictly in sync with host/src/*.jsx');
});

test('E4 host-bridge: sync banner visibility on remote stateHash mismatch and applyCompStateToPanel hydration', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storageMem = {};
    const mockLS = {
        getItem: k => (storageMem.hasOwnProperty(k) ? storageMem[k] : null),
        setItem: (k, v) => { storageMem[k] = String(v); },
        removeItem: k => { delete storageMem[k]; }
    };
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function('localStorage', storeSrc + '\nreturn TIME_RULER_STATE_STORE;')(mockLS);

    const syncBtnClasses = new Set(['btn-comp-sync', 'u-hidden']);
    const syncBtn = {
        title: '',
        classList: {
            add: c => syncBtnClasses.add(c),
            remove: c => syncBtnClasses.delete(c),
            contains: c => syncBtnClasses.has(c)
        }
    };
    const mockDoc = {
        getElementById: id => id === 'btn-sync-from-comp' ? syncBtn : null,
        querySelector: () => null
    };
    const bridgeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/host-bridge.js'), 'utf8');

    let hostMethodResponses = {
        getActiveCompInfo: {
            ok: true,
            data: { name: 'Comp_B', width: 1920, height: 1080, hasRuler: true, hasSavedState: true, stateHash: 'deadbeef_99' }
        },
        readCompState: {
            ok: true,
            data: {
                source: 'comment',
                stateHash: 'deadbeef_99',
                state: {
                    orientation: 'vertical',
                    nodeShape: 'star',
                    nodes: [
                        { number: 'A', customShape: 'inherit', sources: { center: { type: 'shape_number', value: 'A' }, front: { type: 'title', title: 'محطة مستعادة' }, behind: { type: 'none' } } },
                        { number: 'B', customShape: 'inherit', sources: { center: { type: 'shape_number', value: 'B' }, front: { type: 'title', title: 'ثانية' }, behind: { type: 'none' } } }
                    ]
                }
            }
        }
    };

    const hostBridge = new Function('document', 'TIME_RULER_STATE_STORE', 'TR_SVG_SHAPES', 'TIME_RULER_BRIDGE',
        bridgeSrc + '\nreturn TIME_RULER_HOST_BRIDGE;'
    )(mockDoc, store, TR_SVG_SHAPES, {
        isAvailable: () => true,
        callHost: function (fn, arg, cb) {
            if (cb) cb(hostMethodResponses[fn] || { ok: false });
        }
    });

    // Polling finds remote comp with unknown stateHash -> reveals #btn-sync-from-comp without auto-clobbering state
    let compOk = false;
    hostBridge.updateCompStatus(ok => { compOk = ok; });
    assert.strictEqual(compOk, true);
    assert.strictEqual(syncBtnClasses.has('u-hidden'), false, 'Sync button must appear when comp stateHash differs');

    const localState = store.getState();
    assert.strictEqual(localState.nodes.length, 5, 'Polling must NOT auto-overwrite local panel state without user click');

    // User clicks Sync -> readCompState + applyCompStateToPanel hydrates state & hides banner & supports Ctrl+Z Undo
    let readEnv = null;
    hostBridge.readCompState(env => { readEnv = env; });
    assert.strictEqual(readEnv.ok, true);
    const applied = hostBridge.applyCompStateToPanel(localState, readEnv.data.state, readEnv.data);
    assert.strictEqual(applied, true);
    assert.strictEqual(localState.orientation, 'vertical');
    assert.strictEqual(localState.nodeShape, 'star');
    assert.strictEqual(localState.nodes.length, 2);
    assert.strictEqual(localState.nodes[0].sources.front.title, 'محطة مستعادة');
    assert.strictEqual(syncBtnClasses.has('u-hidden'), true, 'Sync button must hide once hydrated');
    assert.strictEqual(hostBridge.getLastSyncedStateHash(), 'deadbeef_99');
    assert.strictEqual(store.canUndo(), true, 'Hydration must record an undoable snapshot');
});

test('E5 global-controls & host-bridge: ctrl scope fast payload and automatic CTRL_RIG_MISSING upgrade fallback', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();
    const gcSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/global-controls.js'), 'utf8');

    const listeners = {};
    const scopes = [];
    const makeEl = (id, initVal) => ({
        id, value: initVal || '', style: {}, dataset: {},
        classList: { contains: () => false, toggle: () => {}, add: () => {}, remove: () => {} },
        querySelectorAll: () => [],
        addEventListener: function (ev, fn) { listeners[id + ':' + ev] = fn; }
    });
    const els = {
        'rng-line-w': makeEl('rng-line-w', '4'),
        'inp-line-w': makeEl('inp-line-w', '4'),
        'rng-top-offset': makeEl('rng-top-offset', '26'),
        'inp-top-offset': makeEl('inp-top-offset', '26'),
        'rng-box-pad-h': makeEl('rng-box-pad-h', '14'),
        'inp-box-pad-h': makeEl('inp-box-pad-h', '14')
    };
    const gc = new Function('document', 'window', gcSrc + '\nreturn TIME_RULER_GLOBAL_CONTROLS;')(
        { getElementById: id => els[id] || null, querySelectorAll: () => [] }, {}
    );
    const st = store.getDefaultState();
    gc.bindAllGlobalControls(st, { onUpdate: (d, r, sc) => scopes.push(sc) });
    els['rng-line-w'].value = '9'; listeners['rng-line-w:input']();
    els['rng-top-offset'].value = '44'; listeners['rng-top-offset:input']();
    els['rng-box-pad-h'].value = '20'; listeners['rng-box-pad-h:input']();
    assert.deepStrictEqual(scopes, ['ctrl', 'ctrl', 'ctrl'], 'Ctrl-bound sliders must emit dirtyScope="ctrl"');

    // host-bridge sends compact ctrl patchValues, and retries full once if CTRL_RIG_MISSING
    const calls = [];
    const bridgeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/host-bridge.js'), 'utf8');
    const hb = new Function('document', 'TIME_RULER_STATE_STORE', 'TR_SVG_SHAPES', 'TIME_RULER_BRIDGE',
        bridgeSrc + '\nreturn TIME_RULER_HOST_BRIDGE;'
    )({ getElementById: () => null, querySelector: () => null }, store, TR_SVG_SHAPES, {
        callHost: function (fn, payload, cb) {
            calls.push(payload);
            if (payload.dirtyScope === 'ctrl' && calls.length === 1) {
                cb({ ok: false, code: 'CTRL_RIG_MISSING' });
            } else {
                cb({ ok: true, data: { stateHash: 'h_new' } });
            }
        }
    });

    hb.executeHostGenerate(st, true, { dirtyScope: 'ctrl' });
    assert.strictEqual(calls.length, 2, 'CTRL_RIG_MISSING must trigger fallback full sync retry');
    assert.strictEqual(calls[0].dirtyScope, 'ctrl');
    assert.strictEqual(calls[0].nodes, undefined, 'ctrl fast payload must omit heavy nodes array');
    assert.strictEqual(calls[0].patchValues.topOffset, 44);
    assert.strictEqual(calls[1].dirtyScope, 'full');
    assert.ok(Array.isArray(calls[1].nodes) && calls[1].nodes.length > 0, 'Fallback full payload must include nodes');
});

test('E6 Chromium-88 CSS governance, internal modal dialogs, and lightweight SVG icon sprite', () => {
    // 1. Verify obsolete CSS & FontAwesome bundles are removed and 01..04 layers are loaded in index.html
    assert.strictEqual(fs.existsSync(path.join(CLIENT_DIR, 'css/fontawesome/all.min.css')), false, 'Legacy all.min.css must be removed');
    assert.strictEqual(fs.existsSync(path.join(CLIENT_DIR, 'css/webfonts')), false, 'Legacy webfonts directory must be removed');
    assert.strictEqual(fs.existsSync(path.join(CLIENT_DIR, 'css/textoro-spectrum.css')), false, 'Legacy textoro-spectrum.css must be removed');
    assert.strictEqual(fs.existsSync(path.join(CLIENT_DIR, 'css/flat-spectrum.css')), false, 'Legacy flat-spectrum.css must be removed');

    const cssOrder = ['css/01-tokens.css', 'css/02-base-layout.css', 'css/03-cards.css', 'css/04-controls-theme.css'];
    let lastCssIdx = -1;
    let totalImportant = 0;
    cssOrder.forEach(rel => {
        const idx = indexHtml.indexOf(rel);
        assert.ok(idx > lastCssIdx, rel + ' must be loaded in cascade order in index.html');
        lastCssIdx = idx;
        const src = fs.readFileSync(path.join(CLIENT_DIR, rel), 'utf8');
        const clean = src.replace(/\/\*[\s\S]*?\*\//g, '');
        assert.strictEqual(/@layer\b/i.test(clean), false, rel + ' must NOT use @layer (unsupported in Chromium 88 / CSXS 11)');
        assert.strictEqual(/:has\s*\(/.test(clean), false, rel + ' must NOT use :has() (unsupported in Chromium 88)');
        const impMatches = src.match(/!important/g);
        totalImportant += impMatches ? impMatches.length : 0;
    });
    assert.ok(totalImportant < 15, 'Total !important across all active CSS layers must be < 15 (got ' + totalImportant + ')');

    // Verify responsive overflow protection across 320px, 420px, and 1200px widths
    const baseCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/02-base-layout.css'), 'utf8');
    const ctrlCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/04-controls-theme.css'), 'utf8');
    assert.ok(/overflow-x\s*:\s*hidden/.test(baseCss), 'Body/container must prevent unwanted horizontal scroll across 320px..1200px');
    assert.ok(/@media\s*\(\s*max-width\s*:\s*360px\s*\)[\s\S]*grid-template-columns\s*:\s*1fr/.test(ctrlCss), '320px viewport must collapse drawer rows to 1 column');
    assert.ok(/@media\s*\(\s*min-width\s*:\s*600px\s*\)[\s\S]*grid-template-columns\s*:\s*repeat\(2/.test(ctrlCss), '1200px viewport must expand controls deck to 2 columns');

    // 2. Zero window.alert / window.confirm calls across client/js (excluding vendor/)
    const jsDirs = [path.join(CLIENT_DIR, 'js'), path.join(CLIENT_DIR, 'js/modules')];
    const dialogOffenders = [];
    const collectFiles = [INDEX_HTML_PATH];
    jsDirs.forEach(dir => {
        fs.readdirSync(dir).forEach(f => {
            if (!f.endsWith('.js')) return;
            const full = path.join(dir, f);
            collectFiles.push(full);
            const src = fs.readFileSync(full, 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\/\/[^\n]*/g, '')
                .replace(/(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/g, '""');
            if (/\b(?:window\s*\.\s*)?(?:alert|confirm)\s*\(/.test(src)) {
                dialogOffenders.push(f);
            }
        });
    });
    assert.deepStrictEqual(dialogOffenders, [], 'Zero native alert/confirm calls allowed in client/js: ' + dialogOffenders.join(', '));

    // 3. Test internal ui-dialog.js XSS safety & confirm/escape handling
    const dlgSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/ui-dialog.js'), 'utf8');
    const dlgEls = {
        'modal-system-dialog': { style: { display: 'none' }, listeners: {}, addEventListener: (e, f) => { dlgEls['modal-system-dialog'].listeners[e] = f; } },
        'dlg-sys-title': { textContent: '' },
        'dlg-sys-message': { textContent: '' },
        'dlg-sys-icon': { className: '', style: {}, dataset: {} },
        'dlg-sys-ok': { textContent: '', listeners: {}, focus: () => {}, classList: { toggle: () => {} }, addEventListener: (e, f) => { dlgEls['dlg-sys-ok'].listeners[e] = f; } },
        'dlg-sys-cancel': { hidden: true, listeners: {}, classList: { toggle: (c, f) => { dlgEls['dlg-sys-cancel'].hidden = f; } }, addEventListener: (e, f) => { dlgEls['dlg-sys-cancel'].listeners[e] = f; } },
        'btn-close-sys-dialog': { listeners: {}, addEventListener: (e, f) => { dlgEls['btn-close-sys-dialog'].listeners[e] = f; } }
    };
    const keyListeners = [];
    const dlg = new Function('document', 'TIME_RULER_ICONS', 'setTimeout', dlgSrc + '\nreturn TIME_RULER_UI_DIALOG;')(
        { getElementById: id => dlgEls[id] || null, addEventListener: (ev, fn) => { if (ev === 'keydown') keyListeners.push(fn); } },
        undefined,
        fn => fn()
    );
    let confirmedCount = 0;
    dlg.showConfirm('عنوان <script>', 'نص <img onerror=alert(1)>', () => { confirmedCount++; });
    assert.strictEqual(dlgEls['modal-system-dialog'].style.display, 'flex');
    assert.strictEqual(dlgEls['dlg-sys-title'].textContent, 'عنوان <script>');
    assert.strictEqual(dlgEls['dlg-sys-cancel'].hidden, false, 'Cancel button must be visible in confirm mode');
    dlgEls['dlg-sys-ok'].listeners.click();
    assert.strictEqual(confirmedCount, 1);
    assert.strictEqual(dlgEls['modal-system-dialog'].style.display, 'none');

    // Escape closes alert modal safely
    dlg.showAlert('تنبيه', 'رسالة', 'warn');
    assert.strictEqual(dlgEls['modal-system-dialog'].style.display, 'flex');
    keyListeners.forEach(fn => fn({ key: 'Escape', keyCode: 27, preventDefault: () => {} }));
    assert.strictEqual(dlgEls['modal-system-dialog'].style.display, 'none');

    // 4. Verify all fa-* icon classes across HTML & JS are covered in masar-icons.svg AND ui-icons.js
    const spritePath = path.join(CLIENT_DIR, 'assets/icons/masar-icons.svg');
    assert.strictEqual(fs.existsSync(spritePath), true, 'masar-icons.svg sprite file must exist');
    const spriteXml = fs.readFileSync(spritePath, 'utf8');
    const iconsMod = require(path.join(CLIENT_DIR, 'js/modules/ui-icons.js'));

    const usedIcons = new Set();
    const faRe = /(?:^|[\s"'`])(fa-[a-z0-9-]+)/g;
    collectFiles.forEach(f => {
        if (path.basename(f) === 'ui-icons.js') return;
        const s = fs.readFileSync(f, 'utf8');
        let m;
        while ((m = faRe.exec(s)) !== null) {
            const cls = m[1];
            if (cls !== 'fa-solid' && cls !== 'fa-regular' && cls !== 'fa-brands' && cls !== 'fa-spin' && cls !== 'fa-fw') {
                usedIcons.add(cls);
            }
        }
    });
    assert.ok(usedIcons.size >= 75, 'Expected >= 75 unique FA icons discovered');
    usedIcons.forEach(cls => {
        assert.ok(spriteXml.indexOf('id="ico-' + cls + '"') !== -1, 'Icon symbol missing from masar-icons.svg: ' + cls);
        assert.ok(iconsMod.ICONS[cls], 'Icon definition missing from ui-icons.js: ' + cls);
    });
    assert.ok(iconsMod.ICONS['fa-regular-square'], 'Regular square glyph must exist in ui-icons.js');

    // Verify hydrateElement populates inline SVG for both solid & regular icons
    const mockIcoSolid = {
        tagName: 'I', dataset: {}, innerHTML: '',
        classList: { contains: c => c === 'fa-solid', length: 2, 0: 'fa-solid', 1: 'fa-check' }
    };
    assert.strictEqual(iconsMod.hydrateElement(mockIcoSolid), true);
    assert.ok(mockIcoSolid.innerHTML.indexOf('<svg class="ms-fa-svg"') !== -1);
});

test('UI Decluttering: removed duplicate presets btn, adaptive HUD strip, and progressive disclosure', () => {
    // 1. No duplicate #btn-open-presets-subbar in index.html; #btn-header-presets remains
    assert.strictEqual(indexHtml.indexOf('btn-open-presets-subbar'), -1, 'Duplicate subbar presets button must be removed');
    assert.ok(indexHtml.indexOf('id="btn-header-presets"') !== -1, 'Main header presets button must remain');

    // 2. Adaptive horizontal HUD strip collapses when vertical
    const baseCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/02-base-layout.css'), 'utf8');
    assert.ok(/\.hud-horizontal-strip\.is-vertical/.test(baseCss), '02-base-layout.css must define .hud-horizontal-strip.is-vertical');
    const cardsCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/03-cards.css'), 'utf8');
    assert.ok(/\.btn-style-reveal/.test(cardsCss) && /\.btn-atomic-toggle/.test(cardsCss), '03-cards.css must style progressive disclosure toggles');

    // 3. card-stream-controls progressive disclosure: default inherited hides .inline-tools-group, customized expands
    const sc = require(path.join(CLIENT_DIR, 'js/modules/card-stream-controls.js'));
    const origDoc = global.document;
    function mkUiEl(tag) {
        const el = {
            tagName: tag.toUpperCase(),
            className: '',
            children: [],
            style: {},
            listeners: {},
            classList: {
                add: c => { el.className = (el.className ? el.className + ' ' : '') + c; },
                remove: c => { el.className = el.className.split(/\s+/).filter(x => x !== c).join(' '); },
                contains: c => el.className.split(/\s+/).indexOf(c) !== -1,
                toggle: (c, f) => {
                    const has = el.classList.contains(c);
                    const on = (typeof f === 'boolean') ? f : !has;
                    if (on && !has) el.classList.add(c);
                    if (!on && has) el.classList.remove(c);
                    return on;
                }
            },
            appendChild: c => {
                if (c.tagName === 'FRAGMENT') {
                    c.children.slice().forEach(x => el.appendChild(x));
                    return c;
                }
                el.children.push(c);
                return c;
            },
            addEventListener: (ev, fn) => { el.listeners[ev] = el.listeners[ev] || []; el.listeners[ev].push(fn); }
        };
        return el;
    }
    global.document = { createElement: mkUiEl };
    try {
        const defBar = sc.createStreamStylingBar('العنوان', '', {}, 'title', { fontSize: 22, color: '#ffffff' }, () => {});
        const grpDefault = defBar.children[1];
        assert.strictEqual(grpDefault.classList.contains('u-hidden'), true, 'Inherited inline tools must stay hidden behind reveal toggle');

        const customBar = sc.createStreamStylingBar('العنوان', '', { titleFontSize: 28 }, 'title', { fontSize: 22, color: '#ffffff' }, () => {});
        const grpCustom = customBar.children[1];
        assert.strictEqual(grpCustom.classList.contains('u-hidden'), false, 'Customized stream tools must auto-expand');
        assert.strictEqual(customBar.children[0].classList.contains('has-custom'), true, 'Customized toggle must display has-custom indicator');
    } finally {
        global.document = origDoc;
    }
});

test('Sharp 0px corners across UI & Node Customization Studio Modal', () => {
    // 1. All border-radius rules across tokens, stylesheets, HTML, and app.js must be 0px
    const checkFiles = [
        path.join(CLIENT_DIR, 'css/01-tokens.css'),
        path.join(CLIENT_DIR, 'css/02-base-layout.css'),
        path.join(CLIENT_DIR, 'css/03-cards.css'),
        path.join(CLIENT_DIR, 'css/04-controls-theme.css'),
        INDEX_HTML_PATH,
        path.join(CLIENT_DIR, 'js/app.js')
    ];
    checkFiles.forEach(f => {
        const src = fs.readFileSync(f, 'utf8');
        const re = /border-radius\s*:\s*([^;{}]+);/g;
        let m;
        while ((m = re.exec(src)) !== null) {
            const val = m[1].trim();
            assert.ok(val === '0px' || val === '0' || val.indexOf('var(--') === 0, path.basename(f) + ' has non-zero border-radius: ' + val);
        }
    });
    const tokensCss = fs.readFileSync(path.join(CLIENT_DIR, 'css/01-tokens.css'), 'utf8');
    assert.ok(/--radius-card\s*:\s*0px/.test(tokensCss) && /--radius-control\s*:\s*0px/.test(tokensCss), '01-tokens.css must set radius tokens to 0px');

    // 2. #modal-node-customize mounts studio groups & handles Prev/Next/Close/Esc cleanly
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();
    const mockState = store.getDefaultState();
    mockState.nodes = [
        { number: '01', customShape: 'inherit', sources: { center: { type: 'shape_number', value: '01', shape: 'inherit', visible: true }, front: { type: 'title', title: 'عقدة 1', showTitle: true, visible: true }, behind: { type: 'none', visible: false } } },
        { number: '02', customShape: 'pin', sources: { center: { type: 'shape_number', value: '02', shape: 'pin', visible: true }, front: { type: 'title', title: 'عقدة 2', showTitle: true, visible: true }, behind: { type: 'none', visible: false } } }
    ];

    function mkModalEl(tag) {
        const el = {
            tagName: (tag || 'div').toUpperCase(),
            className: '',
            innerHTML: '',
            textContent: '',
            children: [],
            style: {},
            dataset: {},
            listeners: {},
            disabled: false,
            classList: {
                add: c => { if (!el.classList.contains(c)) el.className = (el.className ? el.className + ' ' : '') + c; },
                remove: c => { el.className = el.className.split(/\s+/).filter(x => x !== c).join(' '); },
                contains: c => el.className.split(/\s+/).indexOf(c) !== -1,
                toggle: (c, f) => {
                    const has = el.classList.contains(c);
                    const on = (typeof f === 'boolean') ? f : !has;
                    if (on && !has) el.classList.add(c);
                    if (!on && has) el.classList.remove(c);
                    return on;
                }
            },
            appendChild: c => {
                if (c.tagName === 'FRAGMENT') {
                    c.children.slice().forEach(x => el.appendChild(x));
                    return c;
                }
                el.children.push(c);
                return c;
            },
            replaceChild: () => {},
            addEventListener: (ev, fn) => { el.listeners[ev] = el.listeners[ev] || []; el.listeners[ev].push(fn); },
            querySelectorAll: cls => {
                const out = [];
                const target = cls.replace(/^\./, '');
                const st = el.children.slice();
                while (st.length) {
                    const cur = st.shift();
                    if (cur.classList && cur.classList.contains(target)) out.push(cur);
                    if (cur.children) st.unshift.apply(st, cur.children);
                }
                return out;
            },
            querySelector: cls => el.querySelectorAll(cls)[0] || null
        };
        return el;
    }

    const modalEls = {};
    [
        'nodes-container', 'txt-tab-count', 'modal-node-customize', 'node-customize-modal-body',
        'nc-modal-badge', 'nc-modal-title', 'nc-modal-sub', 'nc-modal-btn-revert',
        'nc-modal-inherit-badge', 'btn-close-node-cust-modal', 'nc-modal-prev', 'nc-modal-next', 'nc-modal-done'
    ].forEach(id => { modalEls[id] = mkModalEl('div'); });

    const docKeyListeners = [];
    const mockDoc = {
        getElementById: id => modalEls[id] || null,
        createElement: tag => mkModalEl(tag),
        createDocumentFragment: () => mkModalEl('fragment'),
        querySelectorAll: () => [],
        addEventListener: (ev, fn) => { if (ev === 'keydown') docKeyListeners.push(fn); }
    };
    const mockWin = { TR_APP: { state: mockState }, state: mockState };

    const cb = loadCardBuilderBundle(mockDoc, mockWin, TR_SVG_SHAPES, store);
    cb.renderNodesList();

    // Opening node 0 opens modal with Prev disabled & Revert hidden
    cb.setOpenDrawerIndex(0);
    cb.syncNodeCustomizeModal();
    assert.strictEqual(modalEls['modal-node-customize'].style.display, 'flex');
    assert.strictEqual(modalEls['nc-modal-badge'].textContent, '01');
    assert.strictEqual(modalEls['nc-modal-prev'].disabled, true);
    assert.strictEqual(modalEls['nc-modal-next'].disabled, false);
    assert.strictEqual(modalEls['nc-modal-btn-revert'].classList.contains('u-hidden'), true);
    assert.ok(modalEls['node-customize-modal-body'].querySelector('.nc-hero-preview'), 'Studio hero preview must mount in modal');
    assert.strictEqual(modalEls['node-customize-modal-body'].querySelectorAll('.nc-studio-group').length, 2, 'Two organized studio groups must mount in modal');
    assert.ok(modalEls['node-customize-modal-body'].querySelector('.nc-prop-list'), 'Studio property rows container must mount');
    assert.ok(modalEls['node-customize-modal-body'].querySelector('.nc-anchor-studio-row'), 'Balanced anchor studio row must mount');
    assert.ok(modalEls['node-customize-modal-body'].querySelector('.nc-btn-change-shape'), 'Shape trigger must use clean action button');

    // Card header trigger is an icon button with zero dropdown caret
    const cardBtn0 = modalEls['nodes-container'].children[0].querySelector('.btn-node-cust-icon');
    assert.ok(cardBtn0, 'Card header must render .btn-node-cust-icon button');
    assert.strictEqual(cardBtn0.innerHTML.indexOf('pill-dropdown-caret'), -1, 'Card customize trigger must not contain dropdown caret');
    assert.ok(cardBtn0.innerHTML.indexOf('pill-edit-ico') !== -1, 'Card customize trigger must render edit icon');

    // Navigate to Next (node 1, customized 'pin') -> Revert becomes visible, Next disabled
    modalEls['nc-modal-next'].listeners['click'].forEach(fn => fn());
    assert.strictEqual(cb.getOpenDrawerIndex(), 1);
    assert.strictEqual(modalEls['nc-modal-badge'].textContent, '02');
    assert.strictEqual(modalEls['nc-modal-btn-revert'].classList.contains('u-hidden'), false);
    assert.strictEqual(modalEls['nc-modal-next'].disabled, true);

    // Escape closes modal cleanly
    docKeyListeners.forEach(fn => fn({ key: 'Escape', keyCode: 27 }));
    assert.strictEqual(modalEls['modal-node-customize'].style.display, 'none');
    assert.strictEqual(cb.getOpenDrawerIndex(), -1);
});

test('Studio Color Picker Modal (ui-color-picker.js): HSV conversions, live dispatch, confirm & cancel revert', () => {
    assert.ok(indexHtml.indexOf('id="modal-color-picker"') !== -1, '#modal-color-picker must exist in index.html');
    const pickerScriptPos = indexHtml.indexOf('js/modules/ui-color-picker.js');
    const appScriptPos = indexHtml.indexOf('js/app.js');
    assert.ok(pickerScriptPos !== -1 && pickerScriptPos < appScriptPos, 'ui-color-picker.js must load before app.js');

    const cpSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/ui-color-picker.js'), 'utf8');
    const cpIds = [
        'modal-color-picker', 'cp-modal-subtitle', 'btn-close-color-modal',
        'cp-sv-canvas', 'cp-sv-cursor', 'cp-hue-slider', 'cp-hue-deg',
        'cp-prev-swatch', 'cp-curr-swatch', 'cp-inp-hex', 'cp-btn-copy',
        'cp-inp-r', 'cp-inp-g', 'cp-inp-b', 'cp-preset-swatches',
        'cp-recent-wrap', 'cp-recent-swatches', 'cp-btn-reset', 'cp-btn-cancel', 'cp-btn-ok'
    ];
    const cpEls = {};
    function mkCpEl(tag) {
        const el = {
            tagName: (tag || 'div').toUpperCase(),
            className: '',
            value: '',
            innerHTML: '',
            textContent: '',
            children: [],
            style: {},
            listeners: {},
            classList: {
                add: c => { if (!el.classList.contains(c)) el.className = (el.className ? el.className + ' ' : '') + c; },
                remove: c => { el.className = el.className.split(/\s+/).filter(x => x !== c).join(' '); },
                contains: c => el.className.split(/\s+/).indexOf(c) !== -1,
                toggle: (c, f) => {
                    const has = el.classList.contains(c);
                    const on = (typeof f === 'boolean') ? f : !has;
                    if (on && !has) el.classList.add(c);
                    if (!on && has) el.classList.remove(c);
                    return on;
                }
            },
            appendChild: c => {
                if (c.tagName === 'FRAGMENT') {
                    c.children.slice().forEach(x => el.appendChild(x));
                    return c;
                }
                el.children.push(c);
                return c;
            },
            addEventListener: (ev, fn) => { el.listeners[ev] = el.listeners[ev] || []; el.listeners[ev].push(fn); }
        };
        return el;
    }
    cpIds.forEach(id => { cpEls[id] = mkCpEl('div'); });
    cpEls['cp-sv-canvas'].getContext = () => ({
        createLinearGradient: () => ({ addColorStop: () => {} }),
        clearRect: () => {},
        fillRect: () => {}
    });

    const cpDoc = {
        readyState: 'complete',
        getElementById: id => cpEls[id] || null,
        createElement: tag => mkCpEl(tag),
        addEventListener: () => {}
    };
    const cpWin = { addEventListener: () => {} };
    const cpLS = { _d: {}, getItem: k => cpLS._d[k] || null, setItem: (k, v) => { cpLS._d[k] = String(v); } };
    const cp = new Function('document', 'window', 'localStorage', cpSrc + '\nreturn TIME_RULER_COLOR_PICKER;')(cpDoc, cpWin, cpLS);

    // Math round-trip checks
    assert.strictEqual(cp.normalizeHex('#ABC'), '#aabbcc');
    const rgb = cp.hexToRgb('#10b981');
    assert.deepStrictEqual(rgb, { r: 16, g: 185, b: 129 });
    const hsv = cp.rgbToHsv(rgb.r, rgb.g, rgb.b);
    const back = cp.hsvToRgb(hsv.h, hsv.s, hsv.v);
    assert.ok(Math.abs(back.r - 16) <= 2 && Math.abs(back.g - 185) <= 2 && Math.abs(back.b - 129) <= 2);

    // Live edit + Cancel reverts back to initial color
    let liveVal = '#10b981';
    let confirmedVal = null;
    cp.openColorPicker({
        color: '#10b981',
        title: 'لون المسار',
        onInput: v => { liveVal = v; },
        onConfirm: v => { confirmedVal = v; }
    });
    assert.strictEqual(cpEls['modal-color-picker'].style.display, 'flex');
    assert.strictEqual(cpEls['cp-inp-hex'].value, '10B981');

    // Simulate entering '#3B82F6' then clicking Cancel -> reverts to #10b981
    cpEls['cp-inp-hex'].listeners['input'].forEach(fn => fn({ target: { value: '3B82F6' } }));
    assert.strictEqual(liveVal, '#3b82f6');
    cpEls['cp-btn-cancel'].listeners['click'].forEach(fn => fn());
    assert.strictEqual(cpEls['modal-color-picker'].style.display, 'none');
    assert.strictEqual(confirmedVal, null);

    // Re-open, pick curated swatch #f43f5e, confirm -> invokes onConfirm & stores recent color
    cp.openColorPicker({ color: '#ffffff', onInput: v => { liveVal = v; }, onConfirm: v => { confirmedVal = v; } });
    const swatchBtns = cpEls['cp-preset-swatches'].children;
    const roseBtn = swatchBtns.find(b => b.style.background === '#f43f5e');
    assert.ok(roseBtn, 'Curated rose swatch must exist');
    roseBtn.listeners['click'].forEach(fn => fn());
    assert.strictEqual(liveVal, '#f43f5e');
    cpEls['cp-btn-ok'].listeners['click'].forEach(fn => fn());
    assert.strictEqual(confirmedVal, '#f43f5e');
    assert.ok(cpLS.getItem('masar_recent_colors_v1').indexOf('#f43f5e') !== -1, 'Confirmed color must persist to recent swatches');
});

test('Node Model Unification: Center textColor/fontSize separation, Behind single-layer bar, & no-shape sync', () => {
    const TR_SVG_SHAPES = require(path.join(CLIENT_DIR, 'js/svg-shapes.js'));
    const storeSrc = fs.readFileSync(path.join(CLIENT_DIR, 'js/modules/state-store.js'), 'utf8');
    const store = new Function(storeSrc + '\nreturn TIME_RULER_STATE_STORE;')();
    const mockState = store.getDefaultState();
    mockState.nodes = [
        {
            number: '01',
            activeSourceTab: 'center',
            customShape: 'hexagon',
            customColor: '#ef4444',
            sources: {
                center: { type: 'number', value: '01', shape: 'hexagon', visible: true },
                front: { type: 'title', title: 'أساسي', showTitle: true, visible: true },
                behind: { type: 'title_text', title: '2026', text: 'سنة الإطلاق', showTitle: true, showDesc: true, visible: true }
            }
        },
        {
            number: '02',
            activeSourceTab: 'behind',
            customShape: 'inherit',
            sources: {
                center: { type: 'shape_icon', icon: '✦', shape: 'inherit', visible: true },
                front: { type: 'title', title: 'محطة', showTitle: true, visible: true },
                behind: { type: 'title_text', title: '2027', text: 'تفاصيل', showTitle: true, showDesc: true, visible: true }
            }
        }
    ];

    function mkEl(tag) {
        const el = {
            tagName: (tag || 'div').toUpperCase(),
            className: '',
            innerHTML: '',
            textContent: '',
            value: '',
            children: [],
            style: {},
            dataset: {},
            listeners: {},
            disabled: false,
            classList: {
                add: c => { if (!el.classList.contains(c)) el.className = (el.className ? el.className + ' ' : '') + c; },
                remove: c => { el.className = el.className.split(/\s+/).filter(x => x !== c).join(' '); },
                contains: c => el.className.split(/\s+/).indexOf(c) !== -1,
                toggle: (c, f) => {
                    const has = el.classList.contains(c);
                    const on = (typeof f === 'boolean') ? f : !has;
                    if (on && !has) el.classList.add(c);
                    if (!on && has) el.classList.remove(c);
                    return on;
                }
            },
            appendChild: c => {
                if (c.tagName === 'FRAGMENT') {
                    c.children.slice().forEach(x => el.appendChild(x));
                    return c;
                }
                el.children.push(c);
                return c;
            },
            replaceChild: () => {},
            addEventListener: (ev, fn) => { el.listeners[ev] = el.listeners[ev] || []; el.listeners[ev].push(fn); },
            querySelectorAll: sel => {
                const out = [];
                const target = sel.replace(/^\./, '');
                const st = el.children.slice();
                while (st.length) {
                    const cur = st.shift();
                    if (cur.classList && cur.classList.contains(target)) out.push(cur);
                    if (cur.children) st.unshift.apply(st, cur.children);
                }
                return out;
            },
            querySelector: sel => el.querySelectorAll(sel)[0] || null
        };
        return el;
    }

    const container = mkEl('div');
    const modalEls = {};
    ['modal-node-customize', 'node-customize-modal-body', 'nc-modal-badge', 'nc-modal-title', 'nc-modal-sub', 'nc-modal-btn-revert', 'nc-modal-inherit-badge', 'btn-close-node-cust-modal', 'nc-modal-prev', 'nc-modal-next', 'nc-modal-done']
        .forEach(id => { modalEls[id] = mkEl('div'); });
    const mockDoc = {
        getElementById: id => id === 'nodes-container' ? container : (modalEls[id] || null),
        createElement: tag => mkEl(tag),
        createDocumentFragment: () => mkEl('fragment'),
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
    const mockWin = { TR_APP: { state: mockState }, state: mockState };

    const cb = loadCardBuilderBundle(mockDoc, mockWin, TR_SVG_SHAPES, store);
    cb.renderNodesList();

    // 1. No-shape Center ('number') removes duplicate shape button & shows no-shape warning on card and header
    const card0 = container.children[0];
    assert.strictEqual(card0.querySelector('.btn-source-shape-edit'), null, 'Duplicate shape button inside Center tab must be removed');
    assert.ok(card0.querySelector('.center-noshape-banner'), 'No-shape Center mode must display clear inline banner');
    assert.ok(card0.querySelector('.node-shape-pill--no-shape'), 'Card customize trigger must indicate no-shape mode');
    assert.ok(card0.querySelector('.inline-tools-cluster'), 'Center value input must expose dedicated fontSize/textColor bar');

    // Modal for no-shape node shows one-click activate shape banner
    cb.setOpenDrawerIndex(0);
    cb.syncNodeCustomizeModal();
    assert.ok(modalEls['node-customize-modal-body'].querySelector('.nc-noshape-banner'), 'Modal must show no-shape warning when Center omits shape');

    // 2. Behind tab uses ONE unified styling bar instead of per-field bars
    const card1 = container.children[1];
    assert.ok(card1.querySelector('.behind-unified-style-row'), 'Behind tab must expose unified single-layer styling row');
    assert.strictEqual(card1.querySelectorAll('.inline-tools-cluster').length, 1, 'Behind tab must render exactly 1 styling cluster matching single AE layer');
});

test('Release v1.0.0 Hygiene: synchronized manifest/UI/host versions & clean installers', () => {
    const rootDir = path.resolve(CLIENT_DIR, '..');
    const manifestXml = fs.readFileSync(path.join(rootDir, 'CSXS/manifest.xml'), 'utf8');
    const hostInit = fs.readFileSync(path.join(rootDir, 'host/src/00-json-es3.jsx'), 'utf8');
    const winInst = fs.readFileSync(path.join(rootDir, 'scripts/install-dev-windows.ps1'), 'utf8');
    const macInst = fs.readFileSync(path.join(rootDir, 'scripts/install-dev-macos.sh'), 'utf8');

    assert.ok(/ExtensionBundleVersion="1\.0\.0"/.test(manifestXml), 'manifest.xml bundle version must be 1.0.0');
    assert.ok(/Version="1\.0\.0"/.test(manifestXml), 'manifest.xml extension version must be 1.0.0');
    assert.ok(/TR\.version\s*=\s*"1\.0\.0"/.test(hostInit), 'Host TR.version must be 1.0.0');
    assert.ok(indexHtml.indexOf('PRO v1.0') !== -1, 'index.html header badge must show PRO v1.0');
    assert.strictEqual(winInst.indexOf('extensions\\TIME_RULER'), -1, 'Windows installer must target MASAR, not TIME_RULER');
    assert.strictEqual(macInst.indexOf('extensions/TIME_RULER'), -1, 'macOS installer must target MASAR, not TIME_RULER');
});

console.log('SUMMARY: Passed ' + passCount + ' MASAR client integration tests.');
