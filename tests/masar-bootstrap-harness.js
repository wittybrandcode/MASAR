'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bootstrapPath = path.resolve(__dirname, '../host/bootstrap.jsx');
const bootstrapSrc = fs.readFileSync(bootstrapPath, 'utf8');

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

/**
 * Create a strict Non-English After Effects ExtendScript ES3 Sandbox:
 * - global JSON is undefined (must use embedded TR.JSON)
 * - English display names on layer/property lookups ("Source Text", "Position",
 *   "Anchor Point", "Contents", "Fill Color", etc.) THROW or return null,
 *   requiring canonical Adobe Match Names.
 */
function createStrictAeSandbox(options) {
    options = options || {};
    let strictLocale = (options.strictLocale !== false);
    const logs = {
        englishNameHits: [],
        egAdded: [],
        undoStarts: 0,
        undoEnds: 0,
        exportCalled: false,
        exportReturnVal: (options.exportReturnVal !== undefined) ? options.exportReturnVal : true,
        layersRemoved: []
    };

    const ENGLISH_DISPLAY_NAMES = new Set([
        'Contents',
        'Source Text',
        'Position',
        'Anchor Point',
        'Opacity',
        'Scale',
        'Rotation',
        'Text Document',
        'Fill',
        'Stroke',
        'Color',
        'Fill Color',
        'Stroke Color',
        'Stroke Width',
        'Stroke Opacity',
        'Size',
        'Roundness',
        'Points',
        'Inner Radius',
        'Outer Radius',
        'Effects',
        'Slider',
        'Angle',
        'Checkbox',
        'Path'
    ]);

    // Reverse lookup check helpers
    const MATCH_ALLOWED = new Set([
        'ADBE Root Vectors Group',
        'ADBE Vectors Group',
        'ADBE Vector Group',
        'ADBE Vector Shape - Group',
        'ADBE Vector Shape',
        'ADBE Vector Shape - Ellipse',
        'ADBE Vector Ellipse Size',
        'ADBE Vector Ellipse Position',
        'ADBE Vector Shape - Rect',
        'ADBE Vector Rect Size',
        'ADBE Vector Rect Position',
        'ADBE Vector Rect Roundness',
        'ADBE Vector Shape - Star',
        'ADBE Vector Star Type',
        'ADBE Vector Star Points',
        'ADBE Vector Star Position',
        'ADBE Vector Star Inner Radius',
        'ADBE Vector Star Outer Radius',
        'ADBE Vector Star Inner Roundness',
        'ADBE Vector Star Outer Roundness',
        'ADBE Vector Star Rotation',
        'ADBE Vector Graphic - Fill',
        'ADBE Vector Fill Color',
        'ADBE Vector Fill Opacity',
        'ADBE Vector Graphic - Stroke',
        'ADBE Vector Stroke Color',
        'ADBE Vector Stroke Width',
        'ADBE Vector Stroke Opacity',
        'ADBE Vector Stroke Line Cap',
        'ADBE Vector Stroke Line Join',
        'ADBE Vector Stroke Dashes',
        'ADBE Vector Stroke Dash 1',
        'ADBE Vector Stroke Gap 1',
        'ADBE Text Properties',
        'ADBE Text Document',
        'ADBE Transform Group',
        'ADBE Position',
        'ADBE Anchor Point',
        'ADBE Opacity',
        'ADBE Scale',
        'ADBE Effect Parade',
        'ADBE Color Control',
        'ADBE Color Control-0001',
        'ADBE Slider Control',
        'ADBE Slider Control-0001',
        'ADBE Checkbox Control',
        'ADBE Checkbox Control-0001',
        'Color', 'Slider', 'Checkbox'
    ]);

    function createProp(matchName, initValue, ownerLayer) {
        let _val = initValue;
        const _children = [];
        const prop = {
            matchName: matchName,
            name: matchName,
            expression: '',
            canSetExpression: true,
            value: _val,
            get numProperties() { return _children.length; },
            get value() { return _val; },
            set value(v) { _val = v; },
            setValue: function (v) { _val = v; },
            property: function (key) {
                if (typeof key === 'number') {
                    return _children[key - 1] || null;
                }
                if (strictLocale && ENGLISH_DISPLAY_NAMES.has(key)) {
                    const isEffectChild = (matchName.indexOf('ADBE ') === 0 && (matchName.indexOf('Control') !== -1 || matchName.indexOf('ADBE Color') !== -1 || matchName.indexOf('ADBE Slider') !== -1));
                    const isCustomEffectOnParade = (matchName === 'ADBE Effect Parade') &&
                        (key === 'Fill Color' || key === 'Fill Opacity' || key === 'Stroke Color' || key === 'Stroke Width' || key === 'Stroke Opacity');
                    const isUserGroup = (matchName === 'ADBE Vector Group' || matchName === 'ADBE Vectors Group') &&
                        (key === 'Line' || key.indexOf('Node_') === 0 || key === 'LinePath' || key === 'GuideTick' || key === 'StartTerminal' || key === 'EndTerminal' || key === 'BoxRect' || key === 'DotPath' || key === 'ArrowPath' || key === 'BarPath');
                    if (!isEffectChild && !isCustomEffectOnParade && !isUserGroup) {
                        logs.englishNameHits.push({ owner: ownerLayer ? ownerLayer.name : '?', matchName, queriedKey: key });
                        return null;
                    }
                }
                // Known alias map for matchNames onto child slots
                for (let i = 0; i < _children.length; i++) {
                    if (_children[i].matchName === key || _children[i].name === key) {
                        return _children[i];
                    }
                }
                // Auto-provision transform/vector sub-properties when matchName is canonical
                if (key === 'ADBE Position' || key === 'ADBE Anchor Point' || key === 'ADBE Opacity' || key === 'ADBE Scale') {
                    const p = createProp(key, [0, 0, 0], ownerLayer);
                    _children.push(p);
                    return p;
                }
                if (key === 'ADBE Text Document') {
                    const td = {
                        text: '',
                        fontSize: 22,
                        fillColor: [1, 1, 1],
                        applyFill: true,
                        applyStroke: false,
                        justification: 0
                    };
                    const p = createProp(key, td, ownerLayer);
                    _children.push(p);
                    return p;
                }
                if (key === 'ADBE Vector Shape' || key === 'ADBE Vector Fill Color' || key === 'ADBE Vector Fill Opacity' ||
                    key === 'ADBE Vector Stroke Color' || key === 'ADBE Vector Stroke Width' || key === 'ADBE Vector Stroke Opacity' ||
                    key === 'ADBE Vector Stroke Line Cap' || key === 'ADBE Vector Stroke Line Join' ||
                    key === 'ADBE Vector Ellipse Size' || key === 'ADBE Vector Ellipse Position' ||
                    key === 'ADBE Vector Rect Size' || key === 'ADBE Vector Rect Position' || key === 'ADBE Vector Rect Roundness' ||
                    key === 'ADBE Vector Star Type' || key === 'ADBE Vector Star Points' || key === 'ADBE Vector Star Position' ||
                    key === 'ADBE Vector Star Inner Radius' || key === 'ADBE Vector Star Outer Radius' ||
                    key === 'ADBE Vector Star Inner Roundness' || key === 'ADBE Vector Star Outer Roundness' ||
                    key === 'ADBE Vector Star Rotation' || key === 'ADBE Vector Stroke Dashes' ||
                    key === 'ADBE Vector Stroke Dash 1' || key === 'ADBE Vector Stroke Gap 1') {
                    const p = createProp(key, null, ownerLayer);
                    _children.push(p);
                    return p;
                }
                return null;
            },
            addProperty: function (subMatchName) {
                const sub = createProp(subMatchName, null, ownerLayer);
                if (subMatchName === 'ADBE Vector Group') {
                    const contents = createProp('ADBE Vectors Group', null, ownerLayer);
                    sub._pushChild(contents);
                }
                if (subMatchName === 'ADBE Color Control' || subMatchName === 'ADBE Slider Control' || subMatchName === 'ADBE Checkbox Control') {
                    const paramName = (subMatchName === 'ADBE Color Control') ? 'Color' : ((subMatchName === 'ADBE Slider Control') ? 'Slider' : 'Checkbox');
                    const inner = createProp(paramName, 0, ownerLayer);
                    sub._pushChild(inner);
                }
                _children.push(sub);
                return sub;
            },
            remove: function () {
                this._removed = true;
                const pArr = prop._parentChildren;
                if (pArr) {
                    const ix = pArr.indexOf(prop);
                    if (ix !== -1) pArr.splice(ix, 1);
                }
            },
            canAddToMotionGraphicsTemplate: function () { return true; },
            addToMotionGraphicsTemplateAs: function (compObj, label) {
                logs.egAdded.push(label);
                return true;
            },
            addToMotionGraphicsTemplate: function (compObj) {
                logs.egAdded.push(prop.name);
                return true;
            },
            _pushChild: function (ch) {
                ch._parentChildren = _children;
                _children.push(ch);
            },
            _children: _children
        };
        return prop;
    }

    function createLayer(name, kind) {
        const layer = {
            name: name,
            comment: '',
            _kind: kind,
            enabled: true,
            parent: null,
            label: 0,
            selected: false,
            _props: {},
            property: function (key) {
                if (strictLocale && ENGLISH_DISPLAY_NAMES.has(key)) {
                    logs.englishNameHits.push({ owner: layer.name, matchName: 'Layer', queriedKey: key });
                    return null;
                }
                if (!layer._props[key]) {
                    if (key === 'ADBE Root Vectors Group') {
                        layer._props[key] = createProp('ADBE Root Vectors Group', null, layer);
                    } else if (key === 'ADBE Text Properties') {
                        const tp = createProp('ADBE Text Properties', null, layer);
                        layer._props[key] = tp;
                    } else if (key === 'ADBE Effect Parade') {
                        layer._props[key] = createProp('ADBE Effect Parade', null, layer);
                    } else if (key === 'ADBE Transform Group') {
                        layer._props[key] = createProp('ADBE Transform Group', null, layer);
                    } else if (key === 'ADBE Position' || key === 'ADBE Anchor Point' || key === 'ADBE Opacity' || key === 'ADBE Scale') {
                        layer._props[key] = createProp(key, [0, 0, 0], layer);
                    } else if (key === 'ADBE Marker') {
                        const mProp = createProp('ADBE Marker', null, layer);
                        mProp._keys = [];
                        mProp.numKeys = 0;
                        mProp.setValueAtTime = function (t, v) {
                            mProp._keys.push({ time: t, value: v });
                            mProp.numKeys = mProp._keys.length;
                        };
                        mProp.keyTime = function (i) { return mProp._keys[i - 1].time; };
                        mProp.keyValue = function (i) { return mProp._keys[i - 1].value; };
                        layer._props[key] = mProp;
                    } else {
                        return null;
                    }
                }
                return layer._props[key];
            },
            effect: function (effName) {
                const parade = layer.property('ADBE Effect Parade');
                for (let i = 0; i < parade._children.length; i++) {
                    if (parade._children[i].name === effName) return parade._children[i];
                }
                return null;
            },
            sourceRectAtTime: function () {
                return { left: -40, top: -18, width: 140, height: 32 };
            },
            moveBefore: function (other) {
                const arr = comp._layers;
                const idxMe = arr.indexOf(layer);
                const idxOther = arr.indexOf(other);
                if (idxMe === -1 || idxOther === -1 || idxMe < idxOther) return;
                arr.splice(idxMe, 1);
                const newOther = arr.indexOf(other);
                arr.splice(newOther, 0, layer);
            },
            moveAfter: function (other) {
                const arr = comp._layers;
                const idxMe = arr.indexOf(layer);
                const idxOther = arr.indexOf(other);
                if (idxMe === -1 || idxOther === -1 || idxMe > idxOther) return;
                arr.splice(idxMe, 1);
                const newOther = arr.indexOf(other);
                arr.splice(newOther + 1, 0, layer);
            },
            remove: function () {
                logs.layersRemoved.push(layer.name);
                const idx = comp._layers.indexOf(layer);
                if (idx !== -1) comp._layers.splice(idx, 1);
            }
        };
        return layer;
    }

    const comp = {
        name: 'Test_Comp',
        typeName: 'Komposition', // Non-English AE German/localized comp typeName!
        width: 1920,
        height: 1080,
        duration: 15,
        parentFolder: { name: 'Root' },
        _layers: [],
        get numLayers() { return comp._layers.length; },
        layer: function (key) {
            if (typeof key === 'number') return comp._layers[key - 1] || null;
            for (let i = 0; i < comp._layers.length; i++) {
                if (comp._layers[i].name === key) return comp._layers[i];
            }
            return null;
        },
        layers: {
            addNull: function () { const l = createLayer('Null', 'null'); comp._layers.unshift(l); return l; },
            addShape: function () { const l = createLayer('Shape', 'shape'); comp._layers.unshift(l); return l; },
            addText: function (txt) {
                const l = createLayer('Text', 'text');
                const td = l.property('ADBE Text Properties').property('ADBE Text Document');
                td.value.text = txt || '';
                comp._layers.unshift(l);
                return l;
            }
        },
        exportAsMotionGraphicsTemplate: function (overwrite, outPath) {
            logs.exportCalled = true;
            return logs.exportReturnVal;
        },
        markerProperty: createProp('ADBE Marker', null, null)
    };
    comp.markerProperty._keys = [];
    comp.markerProperty.numKeys = 0;
    comp.markerProperty.setValueAtTime = function (t, v) {
        comp.markerProperty._keys.push({ time: t, value: v });
        comp.markerProperty.numKeys = comp.markerProperty._keys.length;
    };
    comp.markerProperty.keyTime = function (i) { return comp.markerProperty._keys[i - 1].time; };
    comp.markerProperty.keyValue = function (i) { return comp.markerProperty._keys[i - 1].value; };

    function Shape() {
        this.vertices = [];
        this.inTangents = [];
        this.outTangents = [];
        this.closed = true;
    }
    function TextDocument(txt) {
        this.text = txt || '';
        this.fontSize = 22;
        this.fillColor = [1, 1, 1];
        this.applyFill = true;
        this.applyStroke = false;
        this.justification = 0;
    }
    function MarkerValue(comment) {
        this.comment = comment;
        this.duration = 0;
        this.protectedRegion = false;
    }
    function File(p) {
        this.fsName = p;
        this.exists = true;
        this.saveDlg = function () { return { fsName: p }; };
    }
    function Folder(p) {
        this.fsName = p;
        this.exists = true;
        this.create = function () { return true; };
    }
    Folder.desktop = { fsName: 'C:/Desktop' };
    Folder.myDocuments = { fsName: 'C:/Docs' };
    function CompItem() {}

    const sandbox = {
        Shape,
        TextDocument,
        MarkerValue,
        File,
        Folder,
        CompItem,
        ParagraphJustification: { LEFT_JUSTIFY: 1, RIGHT_JUSTIFY: 2, CENTER_JUSTIFY: 3 },
        ViewerType: { VIEWER_COMPOSITION: 1, VIEWER_LAYER: 2 },
        app: {
            version: '24.0',
            activeViewer: { type: 1, activeComp: comp },
            project: {
                activeItem: comp,
                selection: [],
                numItems: 1,
                item: function (i) { return i === 1 ? comp : null; }
            },
            beginUndoGroup: function () { logs.undoStarts++; },
            endUndoGroup: function () { logs.undoEnds++; }
        },
        $: { global: {} },
        // Explicit absence of native JSON to prove embedded ES3 TR.JSON works
        JSON: undefined,
        console
    };

    const ctx = vm.createContext(sandbox);
    vm.runInContext(bootstrapSrc, ctx, { filename: 'bootstrap.jsx' });
    return { ctx, comp, logs, setStrictLocale: (v) => { strictLocale = v; } };
}

console.log('--- RUNNING MASAR BOOTSTRAP (ES3 & NON-ENGLISH LOCALE) SUITE ---');

test('bootstrap boots without global JSON and leaves zero enumerable prototype keys', () => {
    const { ctx } = createStrictAeSandbox();
    assert.strictEqual(ctx.TR.boot(), true);
    const enumKeys = vm.runInContext(`
        (function() {
            var kA = [], kS = [], kO = [];
            for (var ka in []) kA.push(ka);
            for (var ks in "") kS.push(ks);
            for (var ko in {}) kO.push(ko);
            return kA.concat(kS).concat(kO);
        })();
    `, ctx);
    assert.strictEqual(enumKeys.length, 0, 'Must never add enumerable keys to Array/String/Object prototypes: ' + enumKeys.join(','));
});

test('TR.JSON parses and stringifies Arabic UTF-8, quotes, newlines and zeros cleanly', () => {
    const { ctx } = createStrictAeSandbox();
    const obj = {
        title: 'مسار "الاختبار"\nالسطر الثاني',
        zeroVal: 0,
        flag: false,
        neg: -12.5,
        arr: [1, true, 'x', null]
    };
    const serialized = ctx.TR.JSON.stringify(obj);
    const parsed = ctx.TR.JSON.parse(serialized);
    assert.strictEqual(parsed.title, obj.title);
    assert.strictEqual(parsed.zeroVal, 0);
    assert.strictEqual(parsed.flag, false);
    assert.strictEqual(parsed.neg, -12.5);
    assert.deepStrictEqual(Array.from(parsed.arr), [1, true, 'x', null]);
});

test('Full horizontal generation passes under strict Non-English AE Locale mock without any English property query', () => {
    const { ctx, comp, logs } = createStrictAeSandbox();
    const payload = {
        forceRebuild: true,
        orientation: 'horizontal',
        contentSide: 'top',
        spacingMode: 'auto',
        length: 1500,
        endMargin: 0,
        circleStrokeWidth: 0,
        topOffset: 0,
        bottomOffset: 0,
        numberColor: '#10b981',
        boxEnabled: true,
        boxMode: 'glass',
        titleBoxEnabled: true,
        titleBoxFillOpacity: 25,
        nodes: [
            {
                number: '01',
                customShape: 'hud_bracket',
                isHollow: false,
                vectorData: {
                    shapeId: 'hud_bracket',
                    bounds: { minX: -20, maxX: 20, minY: -20, maxY: 20 },
                    centerOffset: [0, 0],
                    subPaths: [
                        { vertices: [[-10, -15], [-20, -15], [-20, 15], [-10, 15]], inTangents: [[0,0],[0,0],[0,0],[0,0]], outTangents: [[0,0],[0,0],[0,0],[0,0]], closed: false },
                        { vertices: [[10, -15], [20, -15], [20, 15], [10, 15]], inTangents: [[0,0],[0,0],[0,0],[0,0]], outTangents: [[0,0],[0,0],[0,0],[0,0]], closed: false },
                        { vertices: [[-4, -4], [4, -4], [4, 4], [-4, 4]], inTangents: [[0,0],[0,0],[0,0],[0,0]], outTangents: [[0,0],[0,0],[0,0],[0,0]], closed: true }
                    ]
                },
                sources: {
                    center: { type: 'shape_number', value: '01', visible: true },
                    front: {
                        type: 'title_text', showTitle: true, showDesc: true, showBadge: true,
                        title: 'العنوان الأول', text: 'شرح تفصيلي', badge: 'Q1', visible: true
                    },
                    behind: {
                        type: 'title_list', showTitle: true, showList: true,
                        title: 'مقابل', items: ['بند 1', 'بند 2'],
                        titleFontSize: 18, titleColor: '#f59e0b', visible: true
                    }
                }
            },
            {
                number: '02',
                customShape: 'tick',
                customAnchor: 'top-center',
                sources: {
                    center: { type: 'shape_number', value: '02', visible: false },
                    front: { type: 'icon_title', showIcon: true, showTitle: true, icon: '★', title: 'محطة', visible: true },
                    behind: { type: 'none', visible: false }
                }
            }
        ]
    };

    const res = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify(payload)));
    assert.strictEqual(res.ok, true, res.message);
    assert.strictEqual(logs.englishNameHits.length, 0, 'Forbidden English display property lookup found: ' + JSON.stringify(logs.englishNameHits));
    assert.strictEqual(logs.undoStarts, logs.undoEnds, 'Undo group open/close mismatch');

    // Badge + Badge_Box created separately
    const badgeLayer = comp.layer('MS_Node_1_Badge');
    const badgeBox = comp.layer('MS_Node_1_Badge_Box');
    assert.ok(badgeLayer && badgeLayer.enabled, 'Badge layer must be created and enabled');
    assert.ok(badgeBox && badgeBox.enabled, 'Badge_Box layer must be created when boxes active');

    // Center visible === false hides MS_Node_2_Num
    const num2 = comp.layer('MS_Node_2_Num');
    assert.ok(!num2 || num2.enabled === false, 'Center hidden must hide _Num layer');

    // Check Anchor Point expression on Front text layers includes + r.height (regression guard for Bug 2005)
    const titleApExpr = comp.layer('MS_Node_1_Title').property('ADBE Anchor Point').expression;
    const badgeApExpr = badgeLayer.property('ADBE Anchor Point').expression;
    assert.ok(titleApExpr.indexOf('+ r.height') !== -1 || titleApExpr.indexOf('r.top + r.height') !== -1, 'Title Anchor Point expression must sum r.top + r.height');
    assert.ok(badgeApExpr.indexOf('+ r.height') !== -1 || badgeApExpr.indexOf('r.top + r.height') !== -1, 'Badge Anchor Point expression must sum r.top + r.height');

    // Check hud_bracket open subPaths split cleanly from closed center square
    const nodesLayer = comp.layer('MS_Nodes');
    const n1Grp = nodesLayer.property('ADBE Root Vectors Group').property('Node_1');
    const n1Contents = n1Grp.property('ADBE Vectors Group');
    const customGrp = n1Contents._children[0];
    const customSubGroups = customGrp.property('ADBE Vectors Group')._children;
    assert.strictEqual(customSubGroups.length >= 2, true, 'hud_bracket must split ClosedFillPaths and OpenStrokePaths into separate groups');
    assert.strictEqual(customSubGroups[0].name, 'ClosedFillPaths');
    assert.strictEqual(customSubGroups[1].name, 'OpenStrokePaths');

    // Z-Order: MS_Baseline below MS_Nodes, MS_Node_1_Num above MS_Nodes
    const idxNodes = comp._layers.indexOf(nodesLayer);
    const idxBase = comp._layers.indexOf(comp.layer('MS_Baseline'));
    const idxNum1 = comp._layers.indexOf(comp.layer('MS_Node_1_Num'));
    assert.ok(idxNodes < idxBase, 'MS_Nodes must sit above MS_Baseline');
    assert.ok(idxNum1 < idxNodes, 'MS_Node_1_Num must sit above MS_Nodes');
});

test('length < 2 * endMargin clamps usableSpan >= 0 without inversion', () => {
    const { ctx, comp } = createStrictAeSandbox();
    const res = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify({
        forceRebuild: true,
        orientation: 'horizontal',
        spacingMode: 'auto',
        length: 80,
        endMargin: 100,
        nodes: [
            { number: '1', sources: { center: { type: 'shape_number', value: '1' }, front: { type: 'title', title: 'A', visible: true }, behind: { type: 'none', visible: false } } },
            { number: '2', sources: { center: { type: 'shape_number', value: '2' }, front: { type: 'title', title: 'B', visible: true }, behind: { type: 'none', visible: false } } }
        ]
    })));
    assert.strictEqual(res.ok, true);
    const pos1 = comp.layer('MS_Node_1_Num').property('ADBE Position').value[0];
    const pos2 = comp.layer('MS_Node_2_Num').property('ADBE Position').value[0];
    assert.ok(pos1 <= pos2, 'Node 1 X must never invert past Node 2 X when length < 2*endMargin');
});

test('dirtyScope="text" skips rebuilding Baseline and Nodes vector groups in place', () => {
    const { ctx, comp } = createStrictAeSandbox();
    const baseCfg = {
        forceRebuild: true,
        orientation: 'vertical',
        spacingMode: 'auto',
        length: 1200,
        nodes: [
            { number: '01', sources: { center: { type: 'shape_number', value: '01' }, front: { type: 'title', title: 'Before', visible: true }, behind: { type: 'none', visible: false } } },
            { number: '02', sources: { center: { type: 'shape_number', value: '02' }, front: { type: 'title', title: 'B2', visible: true }, behind: { type: 'none', visible: false } } }
        ]
    };
    ctx.TR.dispatch('generate', ctx.TR.JSON.stringify(baseCfg));

    // Sentinel marker on baseline group and node 1 group
    const baseGrp = comp.layer('MS_Baseline').property('ADBE Root Vectors Group').property('Line');
    baseGrp._untouchedSentinel = 'keep-baseline';
    const node1Grp = comp.layer('MS_Nodes').property('ADBE Root Vectors Group').property('Node_1');
    node1Grp._untouchedSentinel = 'keep-node1';

    baseCfg.forceRebuild = false;
    baseCfg.dirtyScope = 'text';
    baseCfg.nodes[0].sources.front.title = 'After';
    const res2 = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify(baseCfg)));
    assert.strictEqual(res2.ok, true);
    assert.strictEqual(baseGrp._untouchedSentinel, 'keep-baseline');
    assert.strictEqual(node1Grp._untouchedSentinel, 'keep-node1');
    assert.strictEqual(comp.layer('MS_Node_1_Title').property('ADBE Text Properties').property('ADBE Text Document').value.text, 'After');
});

test('setupEssentialGraphics supports > 50 nodes and exportMOGRT catches exported===false', () => {
    const { ctx, logs } = createStrictAeSandbox({ exportReturnVal: false });
    const manyNodes = [];
    for (let i = 1; i <= 55; i++) {
        manyNodes.push({
            number: String(i),
            sources: {
                center: { type: 'shape_number', value: String(i), visible: true },
                front: { type: 'title', title: 'Item ' + i, visible: true },
                behind: { type: 'none', visible: false }
            }
        });
    }
    const gRes = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify({
        forceRebuild: true,
        orientation: 'horizontal',
        nodes: manyNodes
    })));
    assert.strictEqual(gRes.ok, true);

    const egRes = JSON.parse(ctx.TR.dispatch('setupEssentialGraphics', ctx.TR.JSON.stringify({
        colors: true, typography: true, layout: true, boxes: false
    })));
    assert.strictEqual(egRes.ok, true);
    assert.ok(logs.egAdded.some(lbl => lbl.indexOf('55') !== -1), 'Essential Graphics must bind nodes beyond index 50');

    const expRes = JSON.parse(ctx.TR.dispatch('exportMOGRT', ctx.TR.JSON.stringify({ colors: true })));
    assert.strictEqual(logs.exportCalled, true, 'exportMOGRT must invoke host exportAsMotionGraphicsTemplate');
    assert.strictEqual(expRes.ok, false, 'exportMOGRT must return ok:false when host export returns false');
    assert.strictEqual(logs.undoStarts, logs.undoEnds, 'Undo groups must stay balanced after MOGRT export');
});

test('getActiveComp ignores deleted stale cache and non-comp viewer', () => {
    const { ctx, comp } = createStrictAeSandbox();
    const alive = JSON.parse(ctx.TR.dispatch('getActiveCompInfo', ''));
    assert.strictEqual(alive.ok, true);
    // Simulate deleted comp & layer viewer active
    comp.parentFolder = null;
    ctx.app.activeViewer.type = 2; // VIEWER_LAYER
    ctx.app.activeViewer.activeComp = null;
    ctx.app.project.activeItem = null;
    ctx.app.project.numItems = 0;

    const inspect = JSON.parse(ctx.TR.dispatch('getActiveCompInfo', ''));
    assert.strictEqual(inspect.ok, false);
    assert.strictEqual(inspect.code, 'NO_ACTIVE_COMP');
});

test('E2 lint-es3-host catches ES6+ syntax and forbidden English .property() calls while passing host/bootstrap.jsx', () => {
    const linter = require(path.resolve(__dirname, '../scripts/lint-es3-host.js'));

    // 1. Real production bootstrap.jsx must pass cleanly
    const hostRes = linter.lintSource(bootstrapSrc, 'host/bootstrap.jsx');
    assert.strictEqual(hostRes.ok, true, 'host/bootstrap.jsx must pass ES3 linter cleanly: ' + JSON.stringify(hostRes.errors));

    // 2. Negative ES6 samples (const, let, arrow function, template literal, trailing comma) with exact line tracking
    const es6Sample = [
        'var ok = 1;',
        'const badConst = 2;',
        'let badLet = (a) => a + 1;',
        'var tpl = `hello`;',
        'var arr = [1, 2, ];'
    ].join('\n');
    const es6Res = linter.lintSource(es6Sample, 'bad-es6.jsx');
    assert.strictEqual(es6Res.ok, false, 'ES6 sample must fail linter');
    assert.ok(es6Res.errors.some(e => e.rule === 'ES3_NO_CONST' && e.line === 2), 'Must catch const at line 2');
    assert.ok(es6Res.errors.some(e => e.rule === 'ES3_NO_LET' && e.line === 3), 'Must catch let at line 3');
    assert.ok(es6Res.errors.some(e => e.rule === 'ES3_NO_ARROW' && e.line === 3), 'Must catch arrow function at line 3');
    assert.ok(es6Res.errors.some(e => e.rule === 'ES3_NO_TEMPLATE' && e.line === 4), 'Must catch backtick template at line 4');
    assert.ok(es6Res.errors.some(e => e.rule === 'ES3_NO_TRAILING_COMMA' && e.line === 5), 'Must catch trailing comma at line 5');

    // 3. Negative AE English .property() calls outside authorized helpers
    const localeBadSample = [
        'function buildBad(layer, txt, stroke) {',
        '    var c = layer.property("Contents");',
        '    var t = txt.property("Source Text");',
        '    var w = stroke.property("Stroke Width");',
        '    return [c, t, w];',
        '}'
    ].join('\n');
    const localeRes = linter.lintSource(localeBadSample, 'bad-locale.jsx');
    assert.strictEqual(localeRes.ok, false, 'Unprotected English .property() lookups must fail');
    assert.ok(localeRes.errors.some(e => e.rule === 'AE_LOCALE_ENGLISH_PROPERTY' && e.line === 2), 'Must catch layer.property("Contents") at line 2');
    assert.ok(localeRes.errors.some(e => e.rule === 'AE_LOCALE_ENGLISH_PROPERTY' && e.line === 3), 'Must catch txt.property("Source Text") at line 3');
    assert.ok(localeRes.errors.some(e => e.rule === 'AE_LOCALE_ENGLISH_PROPERTY' && e.line === 4), 'Must catch stroke.property("Stroke Width") at line 4');

    // 4. Comments and string literals must NOT trigger false positives
    const safeSample = [
        '// const comment = () => {}; layer.property("Contents");',
        '/* let blockComment = `ok`; */',
        'var exprStr = "var p = layer.property(\'Source Text\');";',
        'var re = /"const"=>/;',
        'var safe = getProp(layer, "ADBE Position", "Position");'
    ].join('\n');
    const safeRes = linter.lintSource(safeSample, 'safe-comments.jsx');
    assert.strictEqual(safeRes.ok, true, 'Comments, strings, regexes, and getProp must not trigger false positives: ' + JSON.stringify(safeRes.errors));
});

test('E4 Comp State Hydration: round-trip 4 nodes via MASAR_CTRL.comment and fallback layer inference', () => {
    const { ctx, comp } = createStrictAeSandbox();
    const cfg = {
        schemaVersion: 2,
        forceRebuild: true,
        orientation: 'vertical',
        nodeShape: 'hexagon',
        lineColor: '#10b981',
        length: 1200,
        nodes: [
            {
                id: 'n1', number: '01', customShape: 'inherit',
                vectorData: { subPaths: [[[0, 0], [10, 10]]] },
                sources: {
                    center: { type: 'shape_number', value: '01', shape: 'inherit', visible: true },
                    front: { type: 'title_text', title: 'البداية', text: 'شرح أول', visible: true },
                    behind: { type: 'text', text: '2024', visible: true }
                }
            },
            {
                id: 'n2', number: '02', customShape: 'star',
                vectorData: { subPaths: [[[1, 1], [2, 2]]] },
                sources: {
                    center: { type: 'shape_number', value: '02', shape: 'star', visible: true },
                    front: { type: 'title_text', title: 'التنفيذ', text: 'مرحلة وسطى', visible: true },
                    behind: { type: 'none', visible: false }
                }
            },
            {
                id: 'n3', number: '03', customShape: 'inherit',
                sources: {
                    center: { type: 'shape_number', value: '03', shape: 'inherit', visible: true },
                    front: { type: 'title', title: 'المراجعة', visible: true },
                    behind: { type: 'none', visible: false }
                }
            },
            {
                id: 'n4', number: '04', customShape: 'diamond',
                sources: {
                    center: { type: 'shape_number', value: '04', shape: 'diamond', visible: true },
                    front: { type: 'title_text', title: 'الإطلاق', text: 'الختام', visible: true },
                    behind: { type: 'text', text: '2026', visible: true }
                }
            }
        ]
    };

    const gRes = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify(cfg)));
    assert.strictEqual(gRes.ok, true);
    assert.ok(gRes.data.stateHash, 'generate must return stateHash');
    assert.strictEqual(gRes.data.statePersisted, true, 'State must persist to MASAR_CTRL.comment');

    const ctrl = comp.layer('MASAR_CTRL');
    assert.strictEqual(ctrl.comment.indexOf('MASAR_STATE_V2:'), 0, 'MASAR_CTRL.comment must store MASAR_STATE_V2 prefix');
    assert.strictEqual(ctrl.comment.indexOf('subPaths'), -1, 'Compact comment state must exclude derived vectorData.subPaths');

    const info = JSON.parse(ctx.TR.dispatch('getActiveCompInfo', ''));
    assert.strictEqual(info.ok, true);
    assert.strictEqual(info.data.hasSavedState, true);
    assert.strictEqual(info.data.stateHash, gRes.data.stateHash);

    const hydrated = JSON.parse(ctx.TR.dispatch('readCompState', ''));
    assert.strictEqual(hydrated.ok, true);
    assert.strictEqual(hydrated.data.source, 'comment');
    assert.strictEqual(hydrated.data.state.schemaVersion, 2);
    assert.strictEqual(hydrated.data.state.orientation, 'vertical');
    assert.strictEqual(hydrated.data.state.nodeShape, 'hexagon');
    assert.strictEqual(hydrated.data.state.nodes.length, 4);
    assert.strictEqual(hydrated.data.state.nodes[0].sources.front.title, 'البداية');
    assert.strictEqual(hydrated.data.state.nodes[3].customShape, 'diamond');
    assert.strictEqual(hydrated.data.state.nodes[3].sources.behind.text, '2026');

    // Fallback inference when ctrl.comment is cleared (simulating legacy .aep)
    ctrl.comment = '';
    const legacyInfo = JSON.parse(ctx.TR.dispatch('getActiveCompInfo', ''));
    assert.strictEqual(legacyInfo.data.hasRuler, true);
    assert.strictEqual(legacyInfo.data.hasSavedState, false);

    const inferred = JSON.parse(ctx.TR.dispatch('readCompState', ''));
    assert.strictEqual(inferred.ok, true);
    assert.strictEqual(inferred.data.source, 'inferred');
    assert.strictEqual(inferred.data.state.schemaVersion, 2);
    assert.strictEqual(inferred.data.state.orientation, 'vertical');
    assert.strictEqual(inferred.data.state.nodes.length, 4);
    assert.strictEqual(inferred.data.state.nodes[0].sources.front.title, 'البداية');
    assert.strictEqual(inferred.data.state.nodes[0].sources.behind.text, '2024');
});

test('E5 MASAR_CTRL slider rig, procedural expressions, Essential Graphics safety, and O(1) dirtyScope="ctrl" fast path', () => {
    const { ctx, comp, logs } = createStrictAeSandbox();
    const cfg = {
        forceRebuild: true,
        orientation: 'horizontal',
        contentSide: 'top',
        topOffset: 30,
        bottomOffset: 24,
        lineWidth: 5,
        lineOpacity: 80,
        boxEnabled: true,
        boxMode: 'solid',
        boxPaddingH: 16,
        boxPaddingV: 8,
        nodes: [
            {
                number: '01',
                sources: {
                    center: { type: 'shape_number', value: '01', visible: true },
                    front: { type: 'title', title: 'Alpha', visible: true },
                    behind: { type: 'text', text: 'B1', visible: true }
                }
            },
            {
                number: '02',
                sources: {
                    center: { type: 'shape_number', value: '02', visible: true },
                    front: { type: 'title', title: 'Beta', visible: true },
                    behind: { type: 'none', visible: false }
                }
            }
        ]
    };

    const res1 = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify(cfg)));
    assert.strictEqual(res1.ok, true);
    assert.deepStrictEqual(logs.englishNameHits, [], 'Strict Non-English AE mock must have 0 English display queries');

    const ctrl = comp.layer('MASAR_CTRL');
    assert.strictEqual(ctrl.effect('MS Global Top Offset').property(1).value, 30);
    assert.strictEqual(ctrl.effect('MS Global Bottom Offset').property(1).value, 24);
    assert.strictEqual(ctrl.effect('MS Line Width').property(1).value, 5);
    assert.strictEqual(ctrl.effect('MS Line Opacity').property(1).value, 80);
    assert.strictEqual(ctrl.effect('MS Global Padding H').property(1).value, 16);
    assert.strictEqual(ctrl.effect('MS Global Padding V').property(1).value, 8);

    // Check procedural expression wiring on Baseline, Title, Behind, and Text Box
    const baseStroke = comp.layer('MS_Baseline').property('ADBE Root Vectors Group').property('Line').property('ADBE Vectors Group').property('ADBE Vector Graphic - Stroke');
    assert.ok(baseStroke.property('ADBE Vector Stroke Width').expression.indexOf('MS Line Width') !== -1);
    assert.ok(baseStroke.property('ADBE Vector Stroke Opacity').expression.indexOf('MS Line Opacity') !== -1);

    const tPosExpr = comp.layer('MS_Node_1_Title').property('ADBE Position').expression;
    assert.ok(tPosExpr.indexOf('MS Global Top Offset') !== -1, 'Front title position expression must read MS Global Top Offset');
    const bPosExpr = comp.layer('MS_Node_1_Behind').property('ADBE Position').expression;
    assert.ok(bPosExpr.indexOf('MS Global Bottom Offset') !== -1, 'Behind position expression must read MS Global Bottom Offset');

    const boxRect = comp.layer('MS_Node_1_Title_Box').property('ADBE Root Vectors Group').property('Box').property('ADBE Vectors Group').property('BoxRect');
    const boxSizeExpr = boxRect.property('ADBE Vector Rect Size').expression;
    assert.ok(boxSizeExpr.indexOf('MS Global Padding H') !== -1 && boxSizeExpr.indexOf('MS Global Padding V') !== -1);

    // Put sentinel guards on text & vector layers to prove dirtyScope='ctrl' skips rebuilding layers
    const baseLineGrp = comp.layer('MS_Baseline').property('ADBE Root Vectors Group').property('Line');
    baseLineGrp._sentinel = 'untouched';
    const titleLayerDoc = comp.layer('MS_Node_1_Title').property('ADBE Text Properties').property('ADBE Text Document');
    titleLayerDoc._docSentinel = 'untouched';

    const fastRes = JSON.parse(ctx.TR.dispatch('generate', ctx.TR.JSON.stringify({
        forceRebuild: false,
        dirtyScope: 'ctrl',
        patchValues: { topOffset: 55, lineWidth: 12, boxPaddingH: 28 }
    })));
    assert.strictEqual(fastRes.ok, true);
    assert.strictEqual(fastRes.data.fastPath, true);
    assert.deepStrictEqual(logs.englishNameHits, [], 'Fast path must not query English display names');
    assert.strictEqual(ctrl.effect('MS Global Top Offset').property(1).value, 55);
    assert.strictEqual(ctrl.effect('MS Line Width').property(1).value, 12);
    assert.strictEqual(ctrl.effect('MS Global Padding H').property(1).value, 28);
    assert.strictEqual(ctrl.effect('MS Global Bottom Offset').property(1).value, 24, 'Unpatched slider must remain intact');
    assert.strictEqual(baseLineGrp._sentinel, 'untouched', 'O(1) ctrl fast path must not touch MS_Baseline');
    assert.strictEqual(titleLayerDoc._docSentinel, 'untouched', 'O(1) ctrl fast path must not iterate 1..N text layers');

    // Verify Essential Graphics setup continues working smoothly alongside MASAR_CTRL sliders
    const egRes = JSON.parse(ctx.TR.dispatch('setupEssentialGraphics', ctx.TR.JSON.stringify({ colors: true, typography: true, layout: true, boxes: true })));
    assert.strictEqual(egRes.ok, true);

    // Verify legacy pre-E5 comp without MS Global sliders returns CTRL_RIG_MISSING cleanly
    const legacySandbox = createStrictAeSandbox();
    const legacyCtrl = legacySandbox.comp.layers.addNull();
    legacyCtrl.name = 'MASAR_CTRL';
    const missRes = JSON.parse(legacySandbox.ctx.TR.dispatch('generate', legacySandbox.ctx.TR.JSON.stringify({
        dirtyScope: 'ctrl',
        patchValues: { topOffset: 10 }
    })));
    assert.strictEqual(missRes.ok, false);
    assert.strictEqual(missRes.code, 'CTRL_RIG_MISSING');
});

console.log('SUMMARY: Passed ' + passCount + ' MASAR bootstrap tests.');
