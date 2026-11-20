#!/usr/bin/env node
// ============================================================================
// TIME RULER — Node 22 mock AE DOM harness (Milestone 3 generation adapter)
// ============================================================================
// Executes the FULL generate/listInstances flow (api.jsxinc + host/ae/*)
// against a mock After Effects DOM, loading the ES3 modules in EXACTLY the
// bootstrap.jsx order:
//
//   lib/json2.jsxinc -> core/config -> core/validation -> core/geometry ->
//   core/numeric-time -> ae/composition -> ae/metadata -> ae/shape-builder ->
//   ae/text-builder -> ae/controller-builder -> ae/layer-manager -> api.jsxinc
//
// The mock DOM records every setValue / parenting / removal so the assertions
// can inspect shapes, TextDocuments, comments and undo-group bookkeeping.
// Exit code 1 on any failure; prints [PASS]/[FAIL] lines + SUMMARY.
//
// NOTE: this file is Node 22 tooling (NOT host code) — modern JS allowed here;
// the ES3 constraint applies to the host modules themselves.
// ============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ------------------------------------------------------------------ */
/* ExtendScript-ish global shim                                        */
/* ------------------------------------------------------------------ */

global.$ = {
  global: {},
  os: 'Windows',
  fileName: path.join(ROOT, 'host', 'bootstrap.jsx'),
  writeln: function () {}
};

/* AE global constructors/enums consumed by the host modules. */
global.Shape = function Shape() {
  this.vertices = null;
  this.inTangents = null;
  this.outTangents = null;
  this.closed = false;
};
global.ParagraphJustification = {
  LEFT_JUSTIFY: 1,
  RIGHT_JUSTIFY: 2,
  CENTER_JUSTIFY: 3,
  FULL_JUSTIFY_LASTLINE_LEFT: 4,
  FULL_JUSTIFY_LASTLINE_RIGHT: 5,
  FULL_JUSTIFY_LASTLINE_CENTER: 6,
  FULL_JUSTIFY_LASTLINE_FULL: 7,
  MULTIPLE_JUSTIFICATIONS: 8
};
global.KeyframeInterpolationType = {
  HOLD: 6614,
  LINEAR: 6612,
  BEZIER: 6613
};

/* ------------------------------------------------------------------ */
/* Mock AE DOM                                                         */
/* ------------------------------------------------------------------ */

const VALUE_TYPE_BY_MATCHNAME = {
  'ADBE Vector Stroke Color': 'COLOR',
  'ADBE Vector Fill Color': 'COLOR',
  'ADBE Vector Stroke Width': 'OneD',
  'ADBE Vector Stroke Opacity': 'OneD',
  'ADBE Vector Fill Opacity': 'OneD',
  'ADBE Vector Ellipse Size': 'TwoD',
  'ADBE Vector Ellipse Position': 'TwoD_SPATIAL',
  'ADBE Vector Rect Size': 'TwoD',
  'ADBE Vector Rect Position': 'TwoD_SPATIAL',
  'ADBE Anchor Point': 'ThreeD_SPATIAL',
  'ADBE Position': 'ThreeD_SPATIAL',
  'ADBE Rotate Z': 'OneD',
  'ADBE Vector Shape': 'SHAPE',
  'ADBE Text Document': 'TEXT_DOCUMENT',
  'ADBE Slider Control-0001': 'OneD',
  'ADBE Color Control-0001': 'COLOR',
  'ADBE Angle Control-0001': 'OneD',
  'ADBE Vector Filter - Trim': 'CUSTOM',
  'ADBE Vector Trim Start': 'OneD',
  'ADBE Vector Trim End': 'OneD',
  'ADBE Vector Trim Offset': 'OneD',
  'ADBE Vector Transform Group': 'CUSTOM',
  'ADBE Vector Group Opacity': 'OneD',
  'ADBE Effect Parade': 'CUSTOM',
  'ADBE Slider Control': 'CUSTOM',
  'ADBE Color Control': 'CUSTOM',
  'ADBE Angle Control': 'CUSTOM'
};

const DISPLAY_NAME_BY_MATCHNAME = {
  'ADBE Root Vectors Group': 'Contents',
  'ADBE Vector Group': 'Group',
  'ADBE Vector Shape - Group': 'Path',
  'ADBE Vector Shape': 'Path',
  'ADBE Vector Shape - Ellipse': 'Ellipse Path',
  'ADBE Vector Ellipse Size': 'Size',
  'ADBE Vector Ellipse Position': 'Position',
  'ADBE Vector Shape - Rect': 'Rectangle Path',
  'ADBE Vector Rect Size': 'Size',
  'ADBE Vector Rect Position': 'Position',
  'ADBE Vector Graphic - Stroke': 'Stroke',
  'ADBE Vector Stroke Color': 'Color',
  'ADBE Vector Stroke Width': 'Stroke Width',
  'ADBE Vector Stroke Opacity': 'Opacity',
  'ADBE Vector Stroke Line Cap': 'Line Cap',
  'ADBE Vector Stroke Line Join': 'Line Join',
  'ADBE Vector Graphic - Fill': 'Fill',
  'ADBE Vector Fill Color': 'Color',
  'ADBE Vector Fill Opacity': 'Opacity',
  'ADBE Transform Group': 'Transform',
  'ADBE Anchor Point': 'Anchor Point',
  'ADBE Position': 'Position',
  'ADBE Rotate Z': 'Rotation',
  'ADBE Text Properties': 'Text',
  'ADBE Text Document': 'Source Text',
  'ADBE Effect Parade': 'Effects',
  'ADBE Slider Control': 'Slider Control',
  'ADBE Slider Control-0001': 'Slider',
  'ADBE Color Control': 'Color Control',
  'ADBE Color Control-0001': 'Color',
  'ADBE Angle Control': 'Angle Control',
  'ADBE Angle Control-0001': 'Angle',
  'ADBE Vector Filter - Trim': 'Trim Paths',
  'ADBE Vector Trim Start': 'Start',
  'ADBE Vector Trim End': 'End',
  'ADBE Vector Trim Offset': 'Offset',
  'ADBE Vector Transform Group': 'Transform',
  'ADBE Vector Group Opacity': 'Opacity'
};

function cloneValue(v) {
  if (v === null || typeof v !== 'object') { return v; }
  if (Array.isArray(v)) { return v.map(cloneValue); }
  const out = {};
  for (const k of Object.keys(v)) { out[k] = cloneValue(v[k]); }
  return out;
}

class MockProp {
  constructor(matchName) {
    this.matchName = matchName;
    this.name = DISPLAY_NAME_BY_MATCHNAME[matchName] || matchName;
    this.valueType = VALUE_TYPE_BY_MATCHNAME[matchName] || 'CUSTOM';
    this.value = null;
    this.expression = '';
    this.setValues = [];
    this.keyframes = [];
    this.children = [];
    this.enabled = true;
    this.seedDefaults();
  }
  get numProperties() {
    return this.children.length;
  }
  seedDefaults() {
    switch (this.matchName) {
      case 'ADBE Vector Group': {
        const pathGroup = new MockProp('ADBE Vector Shape - Group');
        pathGroup.children.push(new MockProp('ADBE Vector Shape'));
        const tg = new MockProp('ADBE Vector Transform Group');
        const gOp = new MockProp('ADBE Vector Group Opacity');
        gOp.setValue(100);
        tg.children.push(gOp);
        this.children.push(pathGroup, new MockProp('ADBE Vector Graphic - Fill'),
          new MockProp('ADBE Vector Graphic - Stroke'), tg);
        break;
      }
      case 'ADBE Vector Shape - Ellipse':
        this.children.push(new MockProp('ADBE Vector Ellipse Size'),
          new MockProp('ADBE Vector Ellipse Position'));
        break;
      case 'ADBE Vector Shape - Rect':
        this.children.push(new MockProp('ADBE Vector Rect Size'),
          new MockProp('ADBE Vector Rect Position'));
        break;
      case 'ADBE Vector Graphic - Fill':
        this.children.push(new MockProp('ADBE Vector Fill Color'),
          new MockProp('ADBE Vector Fill Opacity'));
        break;
      case 'ADBE Vector Graphic - Stroke':
        this.children.push(new MockProp('ADBE Vector Stroke Color'),
          new MockProp('ADBE Vector Stroke Width'),
          new MockProp('ADBE Vector Stroke Opacity'),
          new MockProp('ADBE Vector Stroke Line Cap'),
          new MockProp('ADBE Vector Stroke Line Join'));
        break;
      case 'ADBE Slider Control': {
        const p = new MockProp('ADBE Slider Control-0001');
        p.setValue(0);
        this.children.push(p);
        break;
      }
      case 'ADBE Color Control': {
        const p = new MockProp('ADBE Color Control-0001');
        p.setValue([1, 1, 1, 1]);
        this.children.push(p);
        break;
      }
      case 'ADBE Angle Control': {
        const p = new MockProp('ADBE Angle Control-0001');
        p.setValue(0);
        this.children.push(p);
        break;
      }
      case 'ADBE Vector Filter - Trim': {
        const s = new MockProp('ADBE Vector Trim Start');
        s.setValue(0);
        const e = new MockProp('ADBE Vector Trim End');
        e.setValue(100);
        const o = new MockProp('ADBE Vector Trim Offset');
        o.setValue(0);
        this.children.push(s, e, o);
        break;
      }
      default:
        break;
    }
  }
  property(key) {
    if (typeof key === 'number') {
      const c = this.children[key - 1];
      if (!c) { throw new Error('property(' + key + ') not found on ' + this.matchName); }
      return c;
    }
    for (const c of this.children) {
      if (c.matchName === key || c.name === key) { return c; }
    }
    throw new Error('property("' + key + '") not found on ' + this.matchName);
  }
  addProperty(matchName) {
    if (typeof matchName !== 'string' || matchName.length === 0) {
      throw new Error('addProperty: matchName required');
    }
    const child = new MockProp(matchName);
    this.children.push(child);
    return child;
  }
  setValue(v) {
    this.setValues.push(cloneValue(v));
    this.value = cloneValue(v);
    return this;
  }
  setValueAtTime(time, v) {
    this.keyframes.push({ time: time, value: cloneValue(v) });
    this.value = cloneValue(v);
    return this;
  }
  setInterpolationTypeAtTime(time, inType, outType) {
    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].time === time) {
        this.keyframes[i].inType = inType;
        this.keyframes[i].outType = outType;
      }
    }
    return this;
  }
}

class MockTextDocument {
  constructor(text) {
    this.text = String(text || '');
    this.font = '';
    this.fontSize = 0;
    this.fillColor = null;
    this.applyFill = false;
    this.applyStroke = false;
    this.tracking = 0;
    this.justification = null;
  }
}

class MockLayer {
  constructor(comp, kind) {
    this.compRef = comp;
    this.kind = kind; // 'shape' | 'text' | 'null'
    this.name = kind === 'null' ? 'Null 1' : (kind === 'text' ? 'Text 1' : 'Shape 1');
    this.comment = '';
    this.removed = false;
    this.parentValue = null;
    this.parentSetLog = [];
    this.inPoint = 0;
    this.outPoint = comp ? comp.duration : 10;
    this.startTime = 0;
    this.stretch = 100;
    this.label = 0;
    this.locked = false;
    this.shy = false;
    this.solo = false;
    this.enabled = true;
    this.nullLayer = (kind === 'null');

    const transform = new MockProp('ADBE Transform Group');
    this.anchorProp = new MockProp('ADBE Anchor Point');
    this.positionProp = new MockProp('ADBE Position');
    this.rotationProp = new MockProp('ADBE Rotate Z');
    const scale = new MockProp('ADBE Scale');
    this.opacityProp = new MockProp('ADBE Opacity');
    transform.children.push(this.anchorProp, this.positionProp, scale,
      this.rotationProp, this.opacityProp);
    this.children = [transform];

    this.anchorPoint = this.anchorProp;
    this.position = this.positionProp;
    this.rotation = this.rotationProp;
    this.opacity = this.opacityProp;

    this.effectsProp = new MockProp('ADBE Effect Parade');
    this.children.push(this.effectsProp);

    if (kind === 'shape') {
      this.contentsProp = new MockProp('ADBE Root Vectors Group');
      this.children.push(this.contentsProp);
    } else {
      const textProps = new MockProp('ADBE Text Properties');
      this.sourceTextProp = new MockProp('ADBE Text Document');
      this.sourceTextProp.setValue(new MockTextDocument(''));
      textProps.children.push(this.sourceTextProp);
      this.children.push(textProps);
      this.text = textProps; /* layer.text.sourceText access path */
    }
  }
  addProperty(matchName) {
    if (typeof matchName !== 'string' || matchName.length === 0) {
      throw new Error('layer.addProperty: matchName required');
    }
    const child = new MockProp(matchName);
    this.children.push(child);
    return child;
  }
  effect(key) {
    return this.effectsProp.property(key);
  }
  get parent() { return this.parentValue; }
  set parent(l) { this.parentSetLog.push(l); this.parentValue = l; }
  get numLayers() { return 0; } /* layers have no child layers */
  property(key) {
    if (typeof key === 'number') {
      const c = this.children[key - 1];
      if (!c) { throw new Error('layer.property(' + key + ') not found'); }
      return c;
    }
    for (const c of this.children) {
      if (c.matchName === key || c.name === key) { return c; }
    }
    /* one nested level (ADBE Text Document lives under ADBE Text Properties) */
    for (const c of this.children) {
      try { return c.property(key); } catch (e) { /* keep searching */ }
    }
    throw new Error('layer.property("' + key + '") not found');
  }
  get doc() {
    return this.kind === 'text' ? this.sourceTextProp.value : null;
  }
  sourceRectAtTime(timeT, extents) {
    if (this.kind === 'text') {
      const doc = this.sourceTextProp.value;
      const len = doc ? String(doc.text || '').length : 0;
      const size = (doc && doc.fontSize) ? doc.fontSize : 30;
      return { left: 0, top: 0, width: size * 0.6 * len, height: size };
    }
    return { left: -50, top: -50, width: 100, height: 100 };
  }
  remove() {
    if (this.removed) { throw new Error('layer.remove() on removed layer'); }
    this.removed = true;
    const arr = this.compRef ? this.compRef.layersArr : null;
    if (arr) {
      const i = arr.indexOf(this);
      if (i >= 0) { arr.splice(i, 1); }
    }
    this.compRef = null;
  }
}

class MockLayerCollection {
  constructor(comp) { this.comp = comp; }
  addShape() {
    const comp = this.comp;
    if (comp.failNextAddShape === true) {
      comp.failNextAddShape = false;
      throw new Error('Mock: addShape forced failure');
    }
    const layer = new MockLayer(comp, 'shape');
    comp.layersArr.unshift(layer); /* AE adds new layers at the TOP */
    return layer;
  }
  addText(textString) {
    const comp = this.comp;
    const layer = new MockLayer(comp, 'text');
    layer.sourceTextProp.setValue(new MockTextDocument(String(textString === undefined ? '' : textString)));
    comp.layersArr.unshift(layer);
    return layer;
  }
  addNull() {
    const comp = this.comp;
    const layer = new MockLayer(comp, 'null');
    comp.layersArr.unshift(layer);
    return layer;
  }
  layer(key) {
    if (typeof key === 'number') {
      const l = this.comp.layersArr[key - 1];
      if (!l) { throw new Error('layers.layer(' + key + ') out of range'); }
      return l;
    }
    const byName = this.comp.layersArr.find((l) => l.name === key);
    if (!byName) { throw new Error('layers.layer("' + key + '") not found'); }
    return byName;
  }
}

class MockComp {
  constructor(name, width, height, frameRate) {
    this.typeName = 'CompItem';
    this.name = name;
    this.width = width;
    this.height = height;
    this.frameRate = frameRate;
    this.duration = 10;
    this.pixelAspect = 1;
    this.workAreaStart = 0;
    this.workAreaDuration = 10;
    this.selectedLayers = [];
    this.layersArr = [];
    this.failNextAddShape = false;
    this.layers = new MockLayerCollection(this);
  }
  get numLayers() { return this.layersArr.length; }
  layer(key) { return this.layers.layer(key); }
}

/* ------------------------------------------------------------------ */
/* Loader (replicates bootstrap.jsx order)                             */
/* ------------------------------------------------------------------ */

const LOAD_ORDER = [
  'host/lib/json2.jsxinc',
  'host/core/config.jsxinc',
  'host/core/validation.jsxinc',
  'host/core/geometry.jsxinc',
  'host/core/numeric-time.jsxinc',
  'host/core/calendar-time.jsxinc',
  'host/core/timecode.jsxinc',
  'host/ae/composition.jsxinc',
  'host/ae/metadata.jsxinc',
  'host/ae/shape-builder.jsxinc',
  'host/ae/text-builder.jsxinc',
  'host/ae/controller-builder.jsxinc',
  'host/ae/layer-manager.jsxinc',
  'host/ae/expression-builder.jsxinc',
  'host/rig/progress.jsxinc',
  'host/rig/marker.jsxinc',
  'host/rig/highlight.jsxinc',
  'host/rig/reveal.jsxinc',
  'host/rig/counter.jsxinc',
  'host/api.jsxinc'
];

function loadRel(rel) {
  const full = path.join(ROOT, rel);
  const code = fs.readFileSync(full, 'utf8');
  (0, eval)(code); // indirect eval -> global scope, sloppy mode (ES3 semantics)
}

for (const rel of LOAD_ORDER) {
  try {
    loadRel(rel);
  } catch (errLoad) {
    console.error('[harness] FAILED to load ' + rel + ' -> ' + (errLoad && errLoad.stack ? errLoad.stack : errLoad));
    process.exit(2);
  }
}

const TR = global.$.global.TIME_RULER;
if (!TR || !TR.API || typeof TR.API.generate !== 'function' || !TR.ae || !TR.ae.shapeBuilder) {
  console.error('[harness] TIME RULER namespace incomplete after module load');
  process.exit(2);
}

/* ------------------------------------------------------------------ */
/* Mock app wiring                                                     */
/* ------------------------------------------------------------------ */

const undoLog = [];
const mockProject = { activeItem: null, item: () => null };
global.app = {
  version: '24.1.0 (mock)',
  project: mockProject,
  beginUndoGroup: (n) => { undoLog.push({ op: 'begin', name: n }); },
  endUndoGroup: () => { undoLog.push({ op: 'end', name: null }); }
};

/* ------------------------------------------------------------------ */
/* Assertion framework                                                 */
/* ------------------------------------------------------------------ */

const results = [];
function check(id, cond, detail) {
  const ok = !!cond;
  results.push({ id, ok });
  console.log((ok ? '[PASS] ' : '[FAIL] ') + id + (detail ? ' — ' + detail : ''));
}
function approx(a, b, tol) {
  return Math.abs(a - b) <= (tol === undefined ? 1e-6 : tol);
}
function seqOk(arr, from, to, prefix) {
  if (!Array.isArray(arr) || arr.length !== to - from + 1) { return false; }
  const p = prefix === undefined ? '' : prefix;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== p + String(from + i).padStart(4, '0')) { return false; }
  }
  return true;
}

/* inspection helpers */
function findLayer(comp, name) {
  return comp.layersArr.find((l) => l.name === name) || null;
}
function layersWithPrefix(comp, prefix) {
  return comp.layersArr.filter((l) => typeof l.comment === 'string' && l.comment.indexOf(prefix) === 0);
}
function groupsOf(layer) {
  const contents = layer.property('ADBE Root Vectors Group');
  return contents.children.map((c) => c.name);
}
function groupByName(layer, name) {
  const contents = layer.property('ADBE Root Vectors Group');
  return contents.children.find((c) => c.name === name) || null;
}
function pathVerticesOf(group) {
  const pathGroup = group.property('ADBE Vector Shape - Group');
  const shape = pathGroup.property('ADBE Vector Shape').value;
  return shape ? shape.vertices : null;
}
function childPropValue(group, groupMatchName, propMatchName) {
  try {
    const sub = group.property(groupMatchName);
    return sub.property(propMatchName).value;
  } catch (e) {
    return undefined;
  }
}
function parseEnvelope(jsonString) {
  const env = JSON.parse(jsonString);
  return env;
}

/* ------------------------------------------------------------------ */
/* Shared fixtures                                                     */
/* ------------------------------------------------------------------ */

function newComp(name) {
  const comp = new MockComp(name, 1920, 1080, 25);
  mockProject.activeItem = comp;
  return comp;
}
function defaultsConfig(extra) {
  const cfg = Object.assign({}, extra || {});
  return cfg; /* parsePayload/normalize fills all defaults */
}

/* ================================================================== */
/* TESTS                                                               */
/* ================================================================== */

/* --- 0. namespace sanity ------------------------------------------ */
check('boot-api-present', typeof TR.API.generate === 'function' && typeof TR.API.listInstances === 'function');
check('boot-ae-modules', !!(TR.ae.composition && TR.ae.metadata && TR.ae.shapeBuilder &&
  TR.ae.textBuilder && TR.ae.controllerBuilder && TR.ae.layerManager));

/* --- 1. empty comp listInstances ----------------------------------- */
const compEmpty = newComp('EmptyComp');
{
  const env = parseEnvelope(TR.API.listInstances());
  check('list-empty-ok', env.ok === true && env.data && Array.isArray(env.data.instances) &&
    env.data.instances.length === 0, JSON.stringify(env.data ? env.data.instances : null));
  check('list-empty-comp-info', env.data && env.data.comp && env.data.comp.name === 'EmptyComp' &&
    env.data.comp.width === 1920 && env.data.comp.height === 1080 && env.data.comp.frameRate === 25);
}

/* --- 2. defaults generate ------------------------------------------ */
const compMain = newComp('Main');
const gen1 = parseEnvelope(TR.API.generate(JSON.stringify(defaultsConfig())));
check('gen-defaults-ok', gen1.ok === true && gen1.code === 'OK', JSON.stringify(gen1.message || ''));
check('gen-defaults-instance-id', gen1.data && gen1.data.instanceId === '0001');
check('gen-defaults-counts',
  gen1.data && gen1.data.counts &&
  gen1.data.counts.major === 31 && gen1.data.counts.minor === 90 &&
  gen1.data.counts.micro === 0 && gen1.data.counts.teeth === 0,
  JSON.stringify(gen1.data ? gen1.data.counts : null));
/* defaults carry collisionMode "alternate" (client + config lane default):
 * 31 majors -> every 2nd kept -> 16 label layers. The 31-label variant is
 * asserted in the allow_overlap generate below. */
check('gen-defaults-labels-alternate-16', gen1.data && gen1.data.counts.labels === 16,
  'labels=' + (gen1.data ? gen1.data.counts.labels : 'n/a'));

const ctrl = findLayer(compMain, 'TR_0001_CTRL_MAIN');
const baseRing = findLayer(compMain, 'TR_0001_BASE_RING');
const majorL = findLayer(compMain, 'TR_0001_MAJOR_TICKS');
const minorL = findLayer(compMain, 'TR_0001_MINOR_TICKS');
const microL = findLayer(compMain, 'TR_0001_MICRO_TICKS');
const markerL = findLayer(compMain, 'TR_0001_MARKER');

check('gen-ctrl-exists', !!ctrl && ctrl.kind === 'null' && ctrl.parentValue === null,
  ctrl ? ctrl.name : 'missing');
check('gen-base-ring-exists', !!baseRing, baseRing ? 'kind=' + baseRing.kind : 'missing');
check('gen-major-layer-exists', !!majorL && majorL.kind === 'shape');
check('gen-minor-layer-exists', !!minorL && minorL.kind === 'shape');
check('gen-micro-layer-absent', microL === null, 'micro disabled by defaults');
check('gen-marker-exists', !!markerL && markerL.kind === 'shape');

/* ring ellipse size [2r, 2r] with r = round(1080*0.4) = 432 */
{
  const ring = baseRing ? groupByName(baseRing, 'RING') : null;
  const size = ring ? childPropValue(ring, 'ADBE Vector Shape - Ellipse', 'ADBE Vector Ellipse Size') : undefined;
  const pos = ring ? childPropValue(ring, 'ADBE Vector Shape - Ellipse', 'ADBE Vector Ellipse Position') : undefined;
  check('gen-ring-group', !!ring);
  check('gen-ring-ellipse-size', Array.isArray(size) && approx(size[0], 864) && approx(size[1], 864),
    JSON.stringify(size));
  check('gen-ring-ellipse-pos', Array.isArray(pos) && approx(pos[0], 0) && approx(pos[1], 0));
  const strokeW = ring ? childPropValue(ring, 'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Width') : undefined;
  const fillOn = ring ? ring.property('ADBE Vector Graphic - Fill').enabled : undefined;
  check('gen-ring-stroke-width', strokeW === 2, 'w=' + strokeW);
  check('gen-ring-fill-off', fillOn === false, 'fill.enabled=' + fillOn);
}

/* tick groups: names + counts + first path + stroke */
{
  const majorGroups = majorL ? groupsOf(majorL) : [];
  const minorGroups = minorL ? groupsOf(minorL) : [];
  check('gen-major-group-count-31', majorGroups.length === 31, 'n=' + majorGroups.length);
  check('gen-major-group-names', seqOk(majorGroups, 1, 31, 'MAJOR_'), majorGroups.slice(0, 3).join(',') + '...');
  check('gen-minor-group-count-90', minorGroups.length === 90, 'n=' + minorGroups.length);
  check('gen-minor-group-names', seqOk(minorGroups, 1, 90, 'MINOR_'), minorGroups.slice(0, 3).join(',') + '...');

  const g1 = majorL ? groupByName(majorL, 'MAJOR_0001') : null;
  const verts = g1 ? pathVerticesOf(g1) : null;
  /* anchor (960,108) -> local (0,-432); tip +22 outward along u=(0,-1) -> (0,-454) */
  check('gen-major-tick-path', Array.isArray(verts) && verts.length === 2 &&
    approx(verts[0][0], 0) && approx(verts[0][1], -432) &&
    approx(verts[1][0], 0) && approx(verts[1][1], -454),
    JSON.stringify(verts));
  const cap = g1 ? childPropValue(g1, 'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Line Cap') : undefined;
  const width = g1 ? childPropValue(g1, 'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Width') : undefined;
  check('gen-major-tick-stroke', width === 3 && cap === 1, 'w=' + width + ' cap=' + cap);
}

/* marker dot */
{
  const markerGroup = markerL ? groupByName(markerL, 'MARKER') : null;
  const size = markerGroup ? childPropValue(markerGroup, 'ADBE Vector Shape - Ellipse', 'ADBE Vector Ellipse Size') : undefined;
  const fillOpacity = markerGroup ? childPropValue(markerGroup, 'ADBE Vector Graphic - Fill', 'ADBE Vector Fill Opacity') : undefined;
  const strokeOn = markerGroup ? markerGroup.property('ADBE Vector Graphic - Stroke').enabled : undefined;
  check('gen-marker-dot', Array.isArray(size) && approx(size[0], 10) && approx(size[1], 10), JSON.stringify(size));
  check('gen-marker-fill', fillOpacity === 100 && strokeOn === false, 'opacity=' + fillOpacity);
  /* t=0 -> angle -90 -> world (960, 540-432) = (960, 108) */
  const pos = markerL ? markerL.positionProp.value : null;
  check('gen-marker-position', Array.isArray(pos) && approx(pos[0], 960) && approx(pos[1], 108),
    JSON.stringify(pos));
}

/* labels: text layers, TextDocument recipe, anchor centering.
 * NOTE: MockLayerCollection.unshift() puts new layers at the TOP, so
 * layersArr is in REVERSE creation order — sort by name to walk the labels
 * in creation order (TR_0001_LABEL_0001 .. _0016). */
{
  const labelLayers = compMain.layersArr.filter((l) => l.kind === 'text' &&
    l.name.indexOf('TR_0001_LABEL_') === 0).sort((a, b) => (a.name < b.name ? -1 : 1));
  check('gen-label-layer-count', labelLayers.length === 16, 'n=' + labelLayers.length);
  const namesOk = labelLayers.every((l, i) => l.name === 'TR_0001_LABEL_' + String(i + 1).padStart(4, '0'));
  check('gen-label-names-sequential', namesOk, labelLayers.slice(0, 2).map((l) => l.name).join(',') + '...');

  const first = labelLayers[0];
  const doc = first ? first.sourceTextProp.value : null;
  check('gen-label-textdoc', !!doc && doc.text === '2000' && doc.font === 'Arial' &&
    doc.fontSize === 30 && doc.applyFill === true && doc.applyStroke === false &&
    doc.justification === global.ParagraphJustification.CENTER_JUSTIFY,
    doc ? ('text=' + doc.text + ' font=' + doc.font + ' size=' + doc.fontSize) : 'no doc');
  const anchor = first ? first.anchorProp.value : null;
  const pos = first ? first.positionProp.value : null;
  /* rect: w = 30*0.6*4 = 72 -> anchor (36, 15) */
  check('gen-label-anchor-centered', Array.isArray(anchor) && approx(anchor[0], 36) && approx(anchor[1], 15),
    JSON.stringify(anchor));
  /* radial orientation: first label angle = -90 -> label point on radius 432+52=484 */
  check('gen-label-position', Array.isArray(pos) && approx(pos[0], 960) && approx(pos[1], 56),
    JSON.stringify(pos));
  const rot = first ? first.rotationProp.value : null;
  check('gen-label-rotation-radial', rot === -90, 'rot=' + rot);
}

/* names + metadata + controller CFG snapshot */
{
  const created = compMain.layersArr.filter((l) => /^TR_\d{4}_/.test(l.name));
  check('gen-created-name-pattern', created.length ===
    compMain.numLayers, 'created=' + created.length + ' total=' + compMain.numLayers);
  const commentsOk = created.every((l) => typeof l.comment === 'string' &&
    l.comment.indexOf('TIME_RULER|1.0|0001|') === 0);
  check('gen-comment-prefix', commentsOk, created.length + ' layers checked');
  const ctrlComment = ctrl ? ctrl.comment : '';
  check('gen-ctrl-cfg-snapshot', ctrlComment.indexOf('|CFG:') !== -1 &&
    ctrlComment.indexOf('TIME_RULER|1.0|0001|CTRL_MAIN|CONTROLLER|CFG:') === 0 &&
    ctrlComment.length <= 2000 + 64, 'len=' + ctrlComment.length);
  const majorComment = majorL ? majorL.comment : '';
  check('gen-major-comment-element', majorComment.indexOf('TIME_RULER|1.0|0001|MAJOR_TICKS|TICKS') === 0,
    majorComment.split('|').slice(0, 5).join('|'));
}

/* parenting: everything except the controller is parented to it */
{
  const children = compMain.layersArr.filter((l) => l !== ctrl);
  const parented = children.every((l) => l.parentValue === ctrl);
  check('gen-parenting', parented && ctrl.parentValue === null,
    'children=' + children.length);
}

/* undo group bookkeeping */
{
  const begins = undoLog.filter((e) => e.op === 'begin' && e.name === 'TIME RULER: Generate');
  const ends = undoLog.filter((e) => e.op === 'end');
  check('gen-undo-group', begins.length === 1 && ends.length >= 1 && begins.length <= ends.length,
    'begins=' + begins.length + ' ends=' + ends.length);
}

/* --- 3. second generate (allow_overlap -> 31 labels) ---------------- */
const inst1CountBefore = layersWithPrefix(compMain, 'TIME_RULER|1.0|0001|').length;
const inst1NamesBefore = layersWithPrefix(compMain, 'TIME_RULER|1.0|0001|').map((l) => l.name).join(',');
{
  const gen2 = parseEnvelope(TR.API.generate(JSON.stringify({
    typography: { collisionMode: 'allow_overlap' }
  })));
  check('gen2-ok', gen2.ok === true && gen2.data && gen2.data.instanceId === '0002',
    'id=' + (gen2.data ? gen2.data.instanceId : 'n/a'));
  check('gen2-allow-overlap-31-labels', gen2.data && gen2.data.counts.labels === 31,
    'labels=' + (gen2.data ? gen2.data.counts.labels : 'n/a'));
  const label2 = findLayer(compMain, 'TR_0002_LABEL_0031');
  check('gen2-label-31-exists', !!label2 && label2.kind === 'text', label2 ? label2.name : 'missing');
}
const inst1CountAfter = layersWithPrefix(compMain, 'TIME_RULER|1.0|0001|').length;
const inst1NamesAfter = layersWithPrefix(compMain, 'TIME_RULER|1.0|0001|').map((l) => l.name).join(',');
check('gen2-first-instance-untouched',
  inst1CountBefore === inst1CountAfter && inst1NamesBefore === inst1NamesAfter,
  'before=' + inst1CountBefore + ' after=' + inst1CountAfter);

/* --- 4. listInstances with two instances ---------------------------- */
{
  const env = parseEnvelope(TR.API.listInstances());
  const insts = env.data ? env.data.instances : [];
  check('list-two-instances', env.ok === true && insts.length === 2, 'n=' + insts.length);
  const i1 = insts.find((s) => s.instanceId === '0001');
  const i2 = insts.find((s) => s.instanceId === '0002');
  check('list-instance1-controller', !!i1 && i1.controllerName === 'TR_0001_CTRL_MAIN');
  check('list-instance1-counts', !!i1 && i1.elementCounts.CONTROLLER === 1 &&
    i1.elementCounts.BASE === 1 && i1.elementCounts.TICKS === 2 &&
    i1.elementCounts.MARKER === 1 && i1.elementCounts.LABEL === 16,
    JSON.stringify(i1 ? i1.elementCounts : null));
  check('list-instance2-labels', !!i2 && i2.elementCounts.LABEL === 31,
    JSON.stringify(i2 ? i2.elementCounts : null));
}

/* --- 5. teeth (instrument-dial preset values) ----------------------- */
{
  const compTeeth = newComp('TeethComp');
  const preset = JSON.parse(fs.readFileSync(path.join(ROOT, 'presets', 'mechanical', 'instrument-dial.json'), 'utf8'));
  const env = parseEnvelope(TR.API.generate(JSON.stringify(preset)));
  check('gen-teeth-ok', env.ok === true && env.data && env.data.instanceId === '0001',
    JSON.stringify(env.message || ''));
  check('gen-teeth-count', env.data && env.data.counts.teeth === 120 &&
    env.data.counts.major === 11 && env.data.counts.minor === 90 && env.data.counts.micro === 100 &&
    env.data.counts.labels === 11, JSON.stringify(env.data ? env.data.counts : null));

  const teethLayer = findLayer(compTeeth, 'TR_0001_TEETH');
  check('gen-teeth-layer', !!teethLayer && teethLayer.kind === 'shape', teethLayer ? teethLayer.name : 'missing');
  const groups = teethLayer ? groupsOf(teethLayer) : [];
  check('gen-teeth-groups-120', groups.length === 120 && seqOk(groups, 1, 120, 'TOOTH_'),
    groups.slice(0, 3).join(',') + '...');

  /* first tooth: t=0 -> angle -90, anchor (960,108), u=(0,-1), tan=(1,0)
   * rect w=3 h=8 outer: base corners (+-1.5, -432 local), tip (+-1.5, -440) */
  const g1 = teethLayer ? groupByName(teethLayer, 'TOOTH_0001') : null;
  const verts = g1 ? pathVerticesOf(g1) : null;
  const closed = g1 ? g1.property('ADBE Vector Shape - Group').property('ADBE Vector Shape').value.closed : null;
  const fillOpacity = g1 ? childPropValue(g1, 'ADBE Vector Graphic - Fill', 'ADBE Vector Fill Opacity') : undefined;
  const strokeOn = g1 ? g1.property('ADBE Vector Graphic - Stroke').enabled : undefined;
  check('gen-teeth-first-shape', Array.isArray(verts) && verts.length === 4 &&
    approx(verts[0][0], -1.5) && approx(verts[0][1], -432) &&
    approx(verts[2][0], 1.5) && approx(verts[2][1], -440) && closed === true,
    JSON.stringify(verts));
  check('gen-teeth-fill-stroke', fillOpacity === 100 && strokeOn === false, 'opacity=' + fillOpacity);
}

/* --- 6. progress preview --------------------------------------------- */
{
  const compProg = newComp('ProgressComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    indicators: { progress: true },
    animation: { progress: 40 }
  })));
  check('gen-progress-ok', env.ok === true, JSON.stringify(env.message || ''));
  const progLayer = findLayer(compProg, 'TR_0001_PROGRESS');
  check('gen-progress-layer', !!progLayer && progLayer.kind === 'shape', progLayer ? progLayer.name : 'missing');
  const group = progLayer ? groupByName(progLayer, 'PROGRESS') : null;
  const verts = group ? pathVerticesOf(group) : null;
  /* n = ceil(0.4 * 240) = 96 sampled points */
  check('gen-progress-sampling', Array.isArray(verts) && verts.length === 96, 'n=' + (verts ? verts.length : 'n/a'));
  const width = group ? childPropValue(group, 'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Width') : undefined;
  const cap = group ? childPropValue(group, 'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Line Cap') : undefined;
  const join = group ? childPropValue(group, 'ADBE Vector Graphic - Stroke', 'ADBE Vector Stroke Line Join') : undefined;
  check('gen-progress-stroke', width === 4 && cap === 2 && join === 2, 'w=' + width + ' cap=' + cap + ' join=' + join);
}

/* --- 7. invalid config ----------------------------------------------- */
{
  const compInv = newComp('InvalidComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({ geometry: { sweepAngle: 400 } })));
  check('invalid-sweep-ok-false', env.ok === false && env.code === 'INVALID_CONFIG',
    JSON.stringify(env.code));
  check('invalid-sweep-errors', !!env.data && Array.isArray(env.data.errors) && env.data.errors.length > 0 &&
    env.data.errors.some((e) => e.code === 'RANGE_SWEEP'),
    JSON.stringify(env.data ? env.data.errors.map((e) => e.code) : null));
  check('invalid-sweep-no-layers', compInv.numLayers === 0, 'layers=' + compInv.numLayers);
}

/* --- 8. no active comp ------------------------------------------------ */
{
  mockProject.activeItem = null;
  const envGen = parseEnvelope(TR.API.generate(JSON.stringify(defaultsConfig())));
  const envList = parseEnvelope(TR.API.listInstances());
  check('no-comp-generate', envGen.ok === false && envGen.code === 'NO_ACTIVE_COMP', JSON.stringify(envGen.code));
  check('no-comp-listInstances', envList.ok === false && envList.code === 'NO_ACTIVE_COMP', JSON.stringify(envList.code));
}

/* --- 9. calendar generation (Milestone 4 / E2) ----------------------- */
{
  const compCal = newComp('CalendarComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    time: { mode: 'calendar', startDate: '2020-01-01', endDate: '2030-01-01', calendarUnit: 'years' }
  })));
  check('calendar-generate-ok', env.ok === true && env.code === 'OK', JSON.stringify(env.message || ''));
  check('calendar-layers-present', compCal.numLayers > 0, 'layers=' + compCal.numLayers);
  const l1 = findLayer(compCal, 'TR_0001_LABEL_0001');
  const doc = l1 ? l1.sourceTextProp.value : null;
  check('calendar-first-label-2020', doc && doc.text === '2020', 'text=' + (doc ? doc.text : 'n/a'));
}

/* --- 10. failure cleanup removes OWN layers --------------------------- */
{
  const compFail = newComp('FailComp');
  compFail.failNextAddShape = true; /* BASE_RING creation throws */
  const before = undoLog.filter((e) => e.op === 'begin').length;
  const env = parseEnvelope(TR.API.generate(JSON.stringify(defaultsConfig())));
  const after = undoLog.filter((e) => e.op === 'begin').length;
  check('cleanup-fails-honestly', env.ok === false && env.code === 'HOST_EXCEPTION',
    JSON.stringify(env.code + ': ' + env.message));
  check('cleanup-comp-empty', compFail.numLayers === 0, 'layers=' + compFail.numLayers);
  check('cleanup-undo-closed', after === before + 1 && undoLog[undoLog.length - 1].op === 'end',
    'undo entries after=' + undoLog.length);
}

/* ================================================================== */
/* MILESTONE 5: ANIMATION RIG + EXPRESSIONS                           */
/* ================================================================== */

/* --- 11. Rig Mode - circular defaults with highlight & counter ----- */
{
  const compRig = newComp('RigComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    output: { mode: 'rig', createMasterController: true },
    indicators: { marker: true, progress: true, highlight: true },
    animation: { progress: 35, reveal: 80, highlightStart: 10, highlightEnd: 90, rotationOffset: 15 }
  })));

  check('rig-generate-ok', env.ok === true && env.code === 'OK', JSON.stringify(env.message || ''));
  check('rig-data-present', !!env.data && !!env.data.rig, 'rig data present');
  check('rig-controllers-count', env.data && env.data.rig && env.data.rig.controllers.length === 11,
    'controllers=' + (env.data && env.data.rig ? env.data.rig.controllers.length : 'n/a'));
  check('rig-expressions-applied', env.data && env.data.rig && env.data.rig.expressionsApplied > 0,
    'expressions=' + (env.data && env.data.rig ? env.data.rig.expressionsApplied : 'n/a'));

  const ctrl = findLayer(compRig, 'TR_0001_CTRL_MAIN');
  check('rig-ctrl-exists', !!ctrl && ctrl.kind === 'null');

  /* Effects check */
  const effects = ctrl.property('ADBE Effect Parade');
  const effectNames = effects ? effects.children.map((c) => c.name) : [];
  check('rig-effects-11-names', effectNames.length === 11 &&
    ['Progress', 'Reveal', 'Highlight Start', 'Highlight End', 'Rotation Offset',
     'Major Color', 'Minor Color', 'Micro Color', 'Label Color', 'Highlight Color', 'Marker Color']
    .every((nm) => effectNames.indexOf(nm) !== -1),
    effectNames.join(','));

  /* Effect initial values */
  const pFx = effects.property('Progress');
  const pVal = pFx ? pFx.property('ADBE Slider Control-0001').value : null;
  check('rig-slider-progress-val', pVal === 35, 'val=' + pVal);

  const rFx = effects.property('Reveal');
  const rVal = rFx ? rFx.property('ADBE Slider Control-0001').value : null;
  check('rig-slider-reveal-val', rVal === 80, 'val=' + rVal);

  const rotFx = effects.property('Rotation Offset');
  const rotVal = rotFx ? rotFx.property('ADBE Angle Control-0001').value : null;
  check('rig-angle-rot-val', rotVal === 15, 'val=' + rotVal);

  /* Controller rotation expression */
  const rotProp = ctrl.property('ADBE Transform Group').property('ADBE Rotate Z');
  check('rig-ctrl-rotation-expr', rotProp && typeof rotProp.expression === 'string' &&
    rotProp.expression.indexOf('Rotation Offset') !== -1, 'expr=' + (rotProp ? rotProp.expression.split('\n')[0] : ''));

  /* Marker position & color expressions */
  const marker = findLayer(compRig, 'TR_0001_MARKER');
  check('rig-marker-layer-exists', !!marker);
  const mPos = marker ? marker.property('ADBE Transform Group').property('ADBE Position') : null;
  check('rig-marker-pos-expr', mPos && typeof mPos.expression === 'string' &&
    mPos.expression.indexOf('ctrl.effect("Progress")("Slider")') !== -1 &&
    mPos.expression.indexOf('Math.cos(rad)') !== -1,
    'expr=' + (mPos ? mPos.expression.split('\n').slice(0, 3).join(' ') : ''));
  const mFill = marker ? marker.property('ADBE Root Vectors Group').property('MARKER').property('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color') : null;
  check('rig-marker-color-expr', mFill && typeof mFill.expression === 'string' &&
    mFill.expression.indexOf('Marker Color') !== -1);

  /* Progress layer trim & stroke expressions */
  const prog = findLayer(compRig, 'TR_0001_PROGRESS');
  check('rig-progress-layer-exists', !!prog);
  const progGroup = prog ? prog.property('ADBE Root Vectors Group').property('PROGRESS') : null;
  const progTrim = progGroup ? progGroup.property('ADBE Vector Filter - Trim') : null;
  check('rig-progress-trim-exists', !!progTrim);
  const progTrimEnd = progTrim ? progTrim.property('ADBE Vector Trim End') : null;
  check('rig-progress-trim-end-expr', progTrimEnd && typeof progTrimEnd.expression === 'string' &&
    progTrimEnd.expression.indexOf('effect("Progress")("Slider")') !== -1);
  const progStroke = progGroup ? progGroup.property('ADBE Vector Graphic - Stroke').property('ADBE Vector Stroke Color') : null;
  check('rig-progress-stroke-expr', progStroke && typeof progStroke.expression === 'string' &&
    progStroke.expression.indexOf('Highlight Color') !== -1);

  /* Full range polyline: in rig mode, progress has full sweep >= 96 points even at progress 35 */
  const progVerts = progGroup ? pathVerticesOf(progGroup) : null;
  check('rig-progress-full-polyline', Array.isArray(progVerts) && progVerts.length >= 96,
    'verts=' + (progVerts ? progVerts.length : 0));

  /* Highlight layer */
  const hl = findLayer(compRig, 'TR_0001_HIGHLIGHT');
  check('rig-highlight-layer-exists', !!hl && hl.kind === 'shape');
  const hlGroup = hl ? hl.property('ADBE Root Vectors Group').property('HIGHLIGHT') : null;
  const hlTrim = hlGroup ? hlGroup.property('ADBE Vector Filter - Trim') : null;
  check('rig-highlight-trim-exists', !!hlTrim);
  const hlTrimStart = hlTrim ? hlTrim.property('ADBE Vector Trim Start') : null;
  const hlTrimEnd = hlTrim ? hlTrim.property('ADBE Vector Trim End') : null;
  check('rig-highlight-trim-start-expr', hlTrimStart && typeof hlTrimStart.expression === 'string' &&
    hlTrimStart.expression.indexOf('Highlight Start') !== -1);
  check('rig-highlight-trim-end-expr', hlTrimEnd && typeof hlTrimEnd.expression === 'string' &&
    hlTrimEnd.expression.indexOf('Highlight End') !== -1);
  check('rig-highlight-parented-ctrl', hl && hl.parentValue === ctrl);

  /* Counter layer */
  const counter = findLayer(compRig, 'TR_0001_COUNTER');
  check('rig-counter-layer-exists', !!counter && counter.kind === 'text');
  check('rig-counter-parented-marker', counter && counter.parentValue === marker);
  const counterPos = counter ? counter.property('ADBE Transform Group').property('ADBE Position').value : null;
  check('rig-counter-pos-marker-space', Array.isArray(counterPos) && counterPos[0] === 0 && counterPos[1] === -40,
    'pos=' + JSON.stringify(counterPos));
  const counterSrc = counter ? counter.property('ADBE Text Properties').property('ADBE Text Document') : null;
  check('rig-counter-src-expr', counterSrc && typeof counterSrc.expression === 'string' &&
    counterSrc.expression.indexOf('toFixed(0)') !== -1 &&
    counterSrc.expression.indexOf('numeric counter') !== -1);

  /* Reveal staggered expressions on tick groups and labels */
  const majorLayer = findLayer(compRig, 'TR_0001_MAJOR_TICKS');
  const majorG1 = majorLayer ? groupByName(majorLayer, 'MAJOR_0001') : null;
  const majorG1Op = majorG1 ? majorG1.property('ADBE Vector Transform Group').property('ADBE Vector Group Opacity') : null;
  check('rig-major-reveal-expr', majorG1Op && typeof majorG1Op.expression === 'string' &&
    majorG1Op.expression.indexOf('reveal stagger') !== -1 &&
    majorG1Op.expression.indexOf('effect("Reveal")') !== -1);

  const label1 = findLayer(compRig, 'TR_0001_LABEL_0001');
  const label1Op = label1 ? label1.property('ADBE Transform Group').property('ADBE Opacity') : null;
  check('rig-label-reveal-expr', label1Op && typeof label1Op.expression === 'string' &&
    label1Op.expression.indexOf('reveal stagger') !== -1);

  /* Style color binds on ticks and labels */
  const majorG1Stroke = majorG1 ? majorG1.property('ADBE Vector Graphic - Stroke').property('ADBE Vector Stroke Color') : null;
  check('rig-major-stroke-color-bind', majorG1Stroke && typeof majorG1Stroke.expression === 'string' &&
    majorG1Stroke.expression.indexOf('Major Color') !== -1);

  const label1Src = label1 ? label1.property('ADBE Text Properties').property('ADBE Text Document') : null;
  check('rig-label-style-color-bind', label1Src && typeof label1Src.expression === 'string' &&
    label1Src.expression.indexOf('Label Color') !== -1 &&
    label1Src.expression.indexOf('setFillColor') !== -1);

  /* Scan instances check in listInstances */
  const listEnv = parseEnvelope(TR.API.listInstances());
  const inst = listEnv.data.instances.find((i) => i.instanceId === '0001');
  check('rig-scan-instances-counter', !!inst && inst.elementCounts.COUNTER === 1);
  check('rig-scan-instances-highlight', !!inst && inst.elementCounts.HIGHLIGHT === 1);
}

/* --- 12. Rig Mode - Linear ruler ------------------------------------- */
{
  const compLin = newComp('RigLinearComp');
  const linearPreset = JSON.parse(fs.readFileSync(path.join(ROOT, 'presets', 'linear', 'clean-timeline.json'), 'utf8'));
  linearPreset.output = { mode: 'rig', createMasterController: true };
  linearPreset.indicators = { marker: true, progress: true };
  const env = parseEnvelope(TR.API.generate(JSON.stringify(linearPreset)));
  check('rig-linear-ok', env.ok === true && env.code === 'OK', JSON.stringify(env.message || ''));
  const marker = findLayer(compLin, 'TR_0001_MARKER');
  const mPos = marker ? marker.property('ADBE Transform Group').property('ADBE Position') : null;
  check('rig-linear-marker-expr', mPos && typeof mPos.expression === 'string' &&
    mPos.expression.indexOf('k = prog / 100 - 0.5') !== -1 &&
    mPos.expression.indexOf('dx = 960') !== -1,
    'expr=' + (mPos ? mPos.expression.split('\n')[2] : ''));
}

/* --- 13. Rig Mode - Reveal density cap (> 600 items) ----------------- */
{
  const compDense = newComp('RigDenseComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    time: { start: 0, end: 200, majorStep: 1, minorDivisions: 4 },
    graduations: {
      minor: { enabled: true }
    },
    output: { mode: 'rig', createMasterController: true }
  })));
  check('rig-dense-ok', env.ok === true, JSON.stringify(env.message || ''));
  check('rig-dense-reveal-warning', env.warnings && env.warnings.some((w) => w.indexOf('Reveal simplified for dense ruler') !== -1),
    'warnings=' + JSON.stringify(env.warnings));
}

/* ================================================================== */
/* MILESTONE 4 / E2: TIMECODE GENERATION & KEYFRAMED COUNTERS         */
/* ================================================================== */

/* --- 14. Timecode generation (25fps) -------------------------------- */
{
  const compTC = newComp('TimecodeComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    time: { mode: 'timecode', start: 0, end: 5, majorStep: 1, frameRateMode: 'custom', customFps: 25 },
    output: { mode: 'generator' }
  })));
  check('tc-generate-ok', env.ok === true && env.code === 'OK', JSON.stringify(env.message || ''));
  const l1 = findLayer(compTC, 'TR_0001_LABEL_0001');
  const doc = l1 ? l1.sourceTextProp.value : null;
  check('tc-first-label-format', doc && doc.text === '00:00:00:00', 'text=' + (doc ? doc.text : 'n/a'));
}

/* --- 15. Calendar keyframed counter in rig mode --------------------- */
{
  const compCalRig = newComp('CalRigComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    time: { mode: 'calendar', startDate: '2020-01-01', endDate: '2025-01-01', calendarUnit: 'years' },
    output: { mode: 'rig', createMasterController: true }
  })));
  check('cal-rig-ok', env.ok === true && env.code === 'OK');
  check('cal-rig-keyframed-counter', env.data && env.data.rig && env.data.rig.keyframedCounter === true);
  const counter = findLayer(compCalRig, 'TR_0001_COUNTER');
  const srcProp = counter ? counter.property('ADBE Text Properties').property('ADBE Text Document') : null;
  check('cal-counter-has-keyframes', srcProp && Array.isArray(srcProp.keyframes) && srcProp.keyframes.length === 6,
    'kfs=' + (srcProp && srcProp.keyframes ? srcProp.keyframes.length : 0));
}

/* --- 16. Timecode keyframed counter in rig mode --------------------- */
{
  const compTCRig = newComp('TCRigComp');
  const env = parseEnvelope(TR.API.generate(JSON.stringify({
    time: { mode: 'timecode', start: 0, end: 4, majorStep: 1, frameRateMode: 'custom', customFps: 25 },
    output: { mode: 'rig', createMasterController: true }
  })));
  check('tc-rig-ok', env.ok === true && env.code === 'OK');
  check('tc-rig-keyframed-counter', env.data && env.data.rig && env.data.rig.keyframedCounter === true);
  const counter = findLayer(compTCRig, 'TR_0001_COUNTER');
  const srcProp = counter ? counter.property('ADBE Text Properties').property('ADBE Text Document') : null;
  check('tc-counter-has-keyframes', srcProp && Array.isArray(srcProp.keyframes) && srcProp.keyframes.length === 5,
    'kfs=' + (srcProp && srcProp.keyframes ? srcProp.keyframes.length : 0));
}

/* ================================================================== */
/* MILESTONE 6: INSTANCE MANAGEMENT (UPDATE / REGENERATE / DETACH)    */
/* ================================================================== */

/* --- 17. Update instance -------------------------------------------- */
{
  const compUpdate = newComp('UpdateComp');
  // First, generate instance 0001 in rig mode
  const genEnv = parseEnvelope(TR.API.generate(JSON.stringify({
    output: { mode: 'rig', createMasterController: true },
    animation: { progress: 20, reveal: 60 }
  })));
  check('update-setup-gen-ok', genEnv.ok === true && genEnv.code === 'OK');

  // Test missing instance id
  const errNoId = parseEnvelope(TR.API.update(JSON.stringify({})));
  check('update-missing-id', errNoId.ok === false && errNoId.code === 'MISSING_INSTANCE_ID');

  // Test non-existent instance id
  const errNotFound = parseEnvelope(TR.API.update(JSON.stringify({ instanceId: '9999' })));
  check('update-not-found', errNotFound.ok === false && errNotFound.code === 'INSTANCE_NOT_FOUND');

  // Test successful update of rig sliders
  const updEnv = parseEnvelope(TR.API.update(JSON.stringify({
    instanceId: '0001',
    config: {
      output: { mode: 'rig' },
      animation: { progress: 85, reveal: 95 }
    }
  })));
  check('update-success-ok', updEnv.ok === true && updEnv.code === 'OK');
  const ctrl = findLayer(compUpdate, 'TR_0001_CTRL_MAIN');
  const pFx = ctrl ? ctrl.property('ADBE Effect Parade').property('Progress') : null;
  const pVal = pFx ? pFx.property('ADBE Slider Control-0001').value : null;
  check('update-slider-progress-applied', pVal === 85, 'val=' + pVal);
  const rFx = ctrl ? ctrl.property('ADBE Effect Parade').property('Reveal') : null;
  const rVal = rFx ? rFx.property('ADBE Slider Control-0001').value : null;
  check('update-slider-reveal-applied', rVal === 95, 'val=' + rVal);
}

/* --- 18. Get instance config ---------------------------------------- */
{
  const envCfg = parseEnvelope(TR.API.getInstanceConfig(JSON.stringify({ instanceId: '0001' })));
  check('get-config-ok', envCfg.ok === true && envCfg.data && envCfg.data.instanceId === '0001');
  check('get-config-has-data', !!envCfg.data && !!envCfg.data.config && envCfg.data.config.product === 'TIME_RULER');
}

/* --- 19. Regenerate instance ---------------------------------------- */
{
  const compRegen = newComp('RegenComp');
  // Add an unmanaged user layer first (e.g. background solid / text)
  const userLayer = compRegen.layers.addShape();
  userLayer.name = 'User Artwork Background';
  userLayer.comment = 'Created by artist manually';

  // Generate instance 0001
  const genEnv = parseEnvelope(TR.API.generate(JSON.stringify({
    time: { start: 2000, end: 2010, majorStep: 1 },
    typography: { collisionMode: 'allow_overlap' }
  })));
  check('regen-setup-gen-ok', genEnv.ok === true);
  check('regen-initial-labels-count', genEnv.data.counts.labels === 11);

  // Missing confirmation
  const errNoConfirm = parseEnvelope(TR.API.regenerate(JSON.stringify({
    instanceId: '0001',
    config: { time: { start: 1990, end: 2000, majorStep: 1 } }
  })));
  check('regen-missing-confirm', errNoConfirm.ok === false && errNoConfirm.code === 'CONFIRMATION_REQUIRED');

  // Successful regenerate with new config: 1990..2020 (31 labels)
  const regenEnv = parseEnvelope(TR.API.regenerate(JSON.stringify({
    instanceId: '0001',
    confirmReplace: true,
    config: {
      time: { start: 1990, end: 2020, majorStep: 1 },
      typography: { collisionMode: 'allow_overlap' }
    }
  })));
  check('regen-success-ok', regenEnv.ok === true && regenEnv.code === 'OK');
  check('regen-same-instance-id', regenEnv.data && regenEnv.data.instanceId === '0001');
  check('regen-new-counts', regenEnv.data && regenEnv.data.counts.labels === 31,
    'labels=' + (regenEnv.data ? regenEnv.data.counts.labels : 'n/a'));

  // Verify user layer is completely untouched
  const stillUser = findLayer(compRegen, 'User Artwork Background');
  check('regen-user-layer-untouched', !!stillUser && stillUser.comment === 'Created by artist manually');

  // Verify new label 0001 text is 1990
  const l1 = findLayer(compRegen, 'TR_0001_LABEL_0001');
  const doc = l1 ? l1.sourceTextProp.value : null;
  check('regen-first-label-1990', doc && doc.text === '1990', 'text=' + (doc ? doc.text : 'n/a'));
}

/* --- 20. Detach instance -------------------------------------------- */
{
  const compDetach = newComp('DetachComp');
  const genEnv = parseEnvelope(TR.API.generate(JSON.stringify(defaultsConfig())));
  check('detach-setup-gen-ok', genEnv.ok === true);

  const detachEnv = parseEnvelope(TR.API.detach(JSON.stringify({ instanceId: '0001' })));
  check('detach-success-ok', detachEnv.ok === true && detachEnv.code === 'OK');
  check('detach-count-positive', detachEnv.data && detachEnv.data.detachedLayersCount > 0,
    'detached=' + (detachEnv.data ? detachEnv.data.detachedLayersCount : 0));

  // Verify comments cleared on all former layers
  const former = compDetach.layersArr.filter((l) => typeof l.comment === 'string' && l.comment.indexOf('TIME_RULER') !== -1);
  check('detach-no-comments-remain', former.length === 0, 'remaining=' + former.length);

  // Verify listInstances now returns empty for this comp
  const listEnv = parseEnvelope(TR.API.listInstances());
  check('detach-not-in-list-instances', listEnv.ok === true && listEnv.data.instances.length === 0);
}

/* ================================================================== */
/* MILESTONE 7: PRESETS ENGINE & FULL EXTENSION QA                    */
/* ================================================================== */

/* --- 21. Four Built-in Presets Generation in AE -------------------- */
{
  const presetsDir = path.join(ROOT, 'presets');
  const presetFiles = [
    { file: path.join(presetsDir, 'circular', 'historical-2000-2030.json'), id: 'historical-2000-2030', expectedLabels: 16 }, // alternate collision mode: 31 -> 16
    { file: path.join(presetsDir, 'circular', 'clock-12-months.json'), id: 'clock-12-months', expectedLabels: 12 },
    { file: path.join(presetsDir, 'linear', 'clean-timeline.json'), id: 'clean-timeline', expectedLabels: 16 }, // alternate collision mode: 31 -> 16
    { file: path.join(presetsDir, 'mechanical', 'instrument-dial.json'), id: 'instrument-dial', expectedTeeth: 120 }
  ];

  for (let pIdx = 0; pIdx < presetFiles.length; pIdx++) {
    const item = presetFiles[pIdx];
    const compPreset = newComp('PresetComp_' + item.id);
    const content = JSON.parse(fs.readFileSync(item.file, 'utf8'));

    // Validate for AE
    const valAE = TR.core.validation.validateForAE(content, { width: 1920, height: 1080, frameRate: 25 });
    check('preset-validate-' + item.id, valAE.valid === true, 'errors=' + (valAE.errors ? valAE.errors.map((e) => e.code).join(',') : ''));

    // Generate in comp
    const genEnv = parseEnvelope(TR.API.generate(JSON.stringify(content)));
    check('preset-gen-' + item.id, genEnv.ok === true && genEnv.code === 'OK', JSON.stringify(genEnv.message || ''));
    if (item.expectedLabels !== undefined) {
      check('preset-labels-' + item.id, genEnv.data && genEnv.data.counts.labels === item.expectedLabels,
        'labels=' + (genEnv.data ? genEnv.data.counts.labels : 'n/a'));
    }
    if (item.expectedTeeth !== undefined) {
      check('preset-teeth-' + item.id, genEnv.data && genEnv.data.counts.teeth === item.expectedTeeth,
        'teeth=' + (genEnv.data ? genEnv.data.counts.teeth : 'n/a'));
    }
  }
}

/* --- 22. Client Preset Manager Operations -------------------------- */
{
  // Load client modules into mock environment
  const stateCode = fs.readFileSync(path.join(ROOT, 'client', 'js', 'state.js'), 'utf8');
  const valCode = fs.readFileSync(path.join(ROOT, 'client', 'js', 'validators.js'), 'utf8');
  const presetMgrCode = fs.readFileSync(path.join(ROOT, 'client', 'js', 'preset-manager.js'), 'utf8');

  // Eval in global
  (0, eval)(stateCode);
  (0, eval)(valCode);
  (0, eval)(presetMgrCode);

  const pm = global.TIME_RULER_PRESETS;
  check('pm-loaded', !!pm && typeof pm.getAll === 'function');
  check('pm-builtin-count', pm.BUILTIN_PRESETS.length === 4);
  check('pm-initial-count', pm.getAll().length === 4);

  // Get built-in by ID
  const pCirc = pm.getById('historical-2000-2030');
  check('pm-get-builtin', !!pCirc && pCirc.preset.id === 'historical-2000-2030');

  // Builtin protection
  let caughtOverwrite = false;
  try {
    pm.saveUserPreset('Hack', {}, 'historical-2000-2030');
  } catch (eProt) {
    caughtOverwrite = true;
  }
  check('pm-builtin-protected-from-overwrite', caughtOverwrite);

  let caughtDelete = false;
  try {
    pm.deleteUserPreset('historical-2000-2030');
  } catch (eDel) {
    caughtDelete = true;
  }
  check('pm-builtin-protected-from-delete', caughtDelete);

  // Duplicate preset
  const dup = pm.duplicatePreset('clean-timeline', 'My Linear Timeline');
  check('pm-dup-ok', !!dup && dup.preset.name === 'My Linear Timeline');
  check('pm-dup-id-user', dup.preset.id.indexOf('user-') === 0);
  check('pm-dup-not-builtin', dup.preset.builtin === false);
  check('pm-count-after-dup', pm.getAll().length === 5);

  // Save new user preset
  const savedUser = pm.saveUserPreset('Custom Gauge', {
    geometry: { type: 'arc', sweepAngle: 180 },
    time: { mode: 'numeric', start: 0, end: 50, majorStep: 5 }
  });
  check('pm-save-user-ok', !!savedUser && savedUser.preset.name === 'Custom Gauge');
  check('pm-count-after-save', pm.getAll().length === 6);

  // Load preset into state
  pm.loadPresetIntoState(savedUser.preset.id);
  const curState = global.TIME_RULER_STATE.getConfig();
  check('pm-load-state-type', curState.geometry.type === 'arc');
  check('pm-load-state-sweep', curState.geometry.sweepAngle === 180);
  check('pm-load-state-time-end', curState.time.end === 50);

  // Delete user preset
  pm.deleteUserPreset(savedUser.preset.id);
  check('pm-delete-user-ok', pm.getById(savedUser.preset.id) === null);
  pm.deleteUserPreset(dup.preset.id);
  check('pm-count-restored', pm.getAll().length === 4);
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

const failed = results.filter((r) => !r.ok);
console.log('SUMMARY {passed:' + (results.length - failed.length) + ', failed:' + failed.length +
  ', total:' + results.length + '}');
if (failed.length > 0) {
  console.error('FAILED: ' + failed.map((r) => r.id).join(', '));
  process.exitCode = 1;
}
