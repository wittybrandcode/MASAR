/**
 * MASAR PRO - host/bootstrap.jsx (Built from host/src/*.jsx)
 * Generated automatically by scripts/build-host.js — edit modules in host/src/.
 * Strictly ES3 + Canonical Adobe Match Names (no #include required).
 */

// ============================================================================
// MODULE: host/src/00-json-es3.jsx
// ============================================================================
var TR = $.global.MASAR || $.global.TIME_RULER;
if (typeof TR === "undefined") {
    TR = {};
    $.global.MASAR = TR;
    $.global.TIME_RULER = TR;
}
$.global.MASAR = TR;
$.global.TIME_RULER = TR;

TR.product = "MASAR";
TR.version = "1.0.0";
TR.ready = true;

// Install JSON support with pure ES3 embedded fallback (no external #include required)
if (typeof TR.JSON !== "object" || TR.JSON === null) {
    TR.JSON = (function () {
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var meta = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", "\"": "\\\"", "\\": "\\\\" };

        function es3Quote(string) {
            escapable.lastIndex = 0;
            return escapable.test(string)
                ? "\"" + string.replace(escapable, function (a) {
                    var c = meta[a];
                    return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                }) + "\""
                : "\"" + string + "\"";
        }

        function es3Stringify(val) {
            var i, k, v, partial;
            if (val === null || val === undefined) return "null";
            var t = typeof val;
            if (t === "string") return es3Quote(val);
            if (t === "number") return isFinite(val) ? String(val) : "null";
            if (t === "boolean") return String(val);
            if (t === "object") {
                if (Object.prototype.toString.apply(val) === "[object Array]") {
                    partial = [];
                    for (i = 0; i < val.length; i += 1) {
                        partial[i] = (val[i] === undefined || typeof val[i] === "function") ? "null" : es3Stringify(val[i]);
                    }
                    return "[" + partial.join(",") + "]";
                }
                partial = [];
                for (k in val) {
                    if (Object.prototype.hasOwnProperty.call(val, k)) {
                        if (val[k] !== undefined && typeof val[k] !== "function") {
                            v = es3Stringify(val[k]);
                            partial.push(es3Quote(k) + ":" + v);
                        }
                    }
                }
                return "{" + partial.join(",") + "}";
            }
            return "null";
        }

        function es3Parse(text) {
            var t = String(text);
            cx.lastIndex = 0;
            if (cx.test(t)) {
                t = t.replace(cx, function (a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/.test(t
                .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                return eval("(" + t + ")");
            }
            throw new SyntaxError("JSON.parse");
        }

        function getJson() {
            if (typeof JSON !== "undefined" && JSON !== null &&
                typeof JSON.parse === "function" && typeof JSON.stringify === "function") {
                return JSON;
            }
            return null;
        }
        return {
            parse: function (s) {
                if (typeof s !== "string" || s.length === 0) return null;
                try {
                    var j = getJson();
                    return j ? j.parse(s) : es3Parse(s);
                } catch (e) { return null; }
            },
            stringify: function (o) {
                try {
                    var j = getJson();
                    return j ? j.stringify(o) : es3Stringify(o);
                } catch (e) { return "{}"; }
            }
        };
    })();
}

// ============================================================================
// MODULE: host/src/10-ae-utils.jsx
// ============================================================================
// ------------------------------------------------------------------
// Localization & ExtendScript ES3 Helpers (No Prototype Pollution)
// ------------------------------------------------------------------
function getShapeLayerContents(layer) {
    if (!layer) return null;
    try {
        return layer.property("ADBE Root Vectors Group") || layer.property("Contents") || layer.property("ADBE Vectors Group");
    } catch (e) { return null; }
}

function getVectorGroupContents(group) {
    if (!group) return null;
    try {
        return group.property("ADBE Vectors Group") || group.property("Contents");
    } catch (e) { return null; }
}

function getProp(obj, matchName, fallbackName) {
    if (!obj) return null;
    try {
        var p = obj.property(matchName);
        if (p) return p;
    } catch (e1) {}
    if (fallbackName) {
        try {
            return obj.property(fallbackName);
        } catch (e2) {}
    }
    return null;
}

function getTextDocumentProp(layer) {
    if (!layer) return null;
    try {
        var tp = layer.property("ADBE Text Properties");
        if (tp) {
            var td = tp.property("ADBE Text Document");
            if (td) return td;
        }
    } catch (e1) {}
    return getProp(layer, "ADBE Text Document", "Source Text");
}

// ------------------------------------------------------------------
// Helper: isComp
// ------------------------------------------------------------------
function isComp(item) {
    if (!item || typeof item !== "object") { return false; }
    try {
        if (typeof CompItem !== "undefined" && item instanceof CompItem) {
            return true;
        }
    } catch (e1) {}
    try {
        if (item.layers && typeof item.numLayers === "number") {
            return true;
        }
    } catch (e2) {}
    try {
        if (item.typeName && (/Comp/i.test(item.typeName) || /Komposition/i.test(item.typeName))) {
            return true;
        }
    } catch (e3) {}
    return false;
}

// ------------------------------------------------------------------
// Helper: getActiveComp
// ------------------------------------------------------------------
function getActiveComp() {
    if (typeof app === "undefined" || !app.project) {
        return null;
    }
    var proj = app.project;
    var comp = null;

    // 1. Direct activeItem
    try {
        if (proj.activeItem && isComp(proj.activeItem)) {
            comp = proj.activeItem;
            TR._lastActiveComp = comp;
            return comp;
        }
    } catch (e1) {}

    // 2. Active composition viewer (reliable when CEP panel has focus)
    if (!comp && typeof app.activeViewer !== "undefined" && app.activeViewer !== null) {
        try {
            var isCompViewer = true;
            if (typeof ViewerType !== "undefined" && ViewerType.VIEWER_COMPOSITION !== undefined && app.activeViewer.type !== undefined) {
                isCompViewer = (app.activeViewer.type === ViewerType.VIEWER_COMPOSITION);
            }
            if (isCompViewer && app.activeViewer.activeComp && isComp(app.activeViewer.activeComp)) {
                comp = app.activeViewer.activeComp;
                TR._lastActiveComp = comp;
                return comp;
            }
        } catch (eVw) {}
    }

    // 3. Selection in Project panel
    if (!comp && proj.selection && proj.selection.length > 0) {
        try {
            for (var s = 0; s < proj.selection.length; s++) {
                if (proj.selection[s] && isComp(proj.selection[s])) {
                    comp = proj.selection[s];
                    TR._lastActiveComp = comp;
                    return comp;
                }
            }
        } catch (e3) {}
    }

    // 4. Non-intrusive cached comp check (preserves comp when CEP panel has focus)
    if (!comp && TR._lastActiveComp) {
        try {
            if (isComp(TR._lastActiveComp) && TR._lastActiveComp.numLayers !== undefined && TR._lastActiveComp.parentFolder !== null) {
                return TR._lastActiveComp;
            }
            TR._lastActiveComp = null;
        } catch (e2) {
            TR._lastActiveComp = null;
        }
    }

    // 5. Fallback: Search all items in project for MASAR_CTRL or TIME_RULER_CTRL
    if (!comp) {
        try {
            var totalItems = (typeof proj.numItems === "number") ? proj.numItems : 0;
            for (var i = 1; i <= totalItems; i++) {
                var it = null;
                try { it = proj.item(i); } catch (eIt) {}
                if (it && isComp(it)) {
                    var hasRuler = false;
                    try {
                        hasRuler = (it.layer("MASAR_CTRL") !== null) || (it.layer("TIME_RULER_CTRL") !== null);
                    } catch (eHR) {}
                    if (hasRuler) {
                        comp = it;
                        TR._lastActiveComp = comp;
                        return comp;
                    }
                }
            }
        } catch (e4) {}
    }

    if (comp) {
        TR._lastActiveComp = comp;
    } else {
        TR._lastActiveComp = null;
    }
    return comp;
}

function trimStr(s) {
    return String(s || "").replace(/^\s+|\s+$/g, "");
}

// ------------------------------------------------------------------
// Helper: toStandardDigits (Converts Eastern Arabic/Hindi/Persian numerals to standard 0-9)
// ------------------------------------------------------------------
function toStandardDigits(str) {
    if (str === null || str === undefined) return "";
    var s = String(str);
    var eastern = ["\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"];
    var persian = ["\u06F0", "\u06F1", "\u06F2", "\u06F3", "\u06F4", "\u06F5", "\u06F6", "\u06F7", "\u06F8", "\u06F9"];
    for (var d = 0; d < 10; d++) {
        s = s.split(eastern[d]).join(String(d));
        s = s.split(persian[d]).join(String(d));
    }
    return s;
}

// ------------------------------------------------------------------
// Helper: parseColor
// ------------------------------------------------------------------
function parseColor(val, defaultColor) {
    if (!defaultColor) defaultColor = [0.1, 0.1, 0.1];
    if (!val) return defaultColor;
    if (typeof val === "string") {
        var hex = trimStr(val.replace("#", ""));
        if (hex.length === 3) {
            hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
        }
        if (hex.length === 6) {
            var r = parseInt(hex.substring(0, 2), 16) / 255;
            var g = parseInt(hex.substring(2, 4), 16) / 255;
            var b = parseInt(hex.substring(4, 6), 16) / 255;
            return [r, g, b];
        }
    }
    if (val && typeof val.length === "number" && val.length >= 3) {
        var cr = Number(val[0]);
        var cg = Number(val[1]);
        var cb = Number(val[2]);
        if (cr > 1 || cg > 1 || cb > 1) {
            cr /= 255; cg /= 255; cb /= 255;
        }
        return [cr, cg, cb];
    }
    return defaultColor;
}

function numOr(v, def) {
    if (v === undefined || v === null || v === "") return def;
    var n = parseFloat(v);
    return (typeof n === "number" && isFinite(n)) ? n : def;
}

// ------------------------------------------------------------------
// Bidirectional Comp State Serialization Helpers (MASAR_STATE_V2)
// ------------------------------------------------------------------
var MASAR_STATE_PREFIX = "MASAR_STATE_V2:";

function computeStateHash(str) {
    var s = String(str || "");
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    var hex = (h >>> 0).toString(16);
    while (hex.length < 8) hex = "0" + hex;
    return hex + "_" + s.length;
}

function compactStateForComp(cfg) {
    var out = {};
    if (!cfg || typeof cfg !== "object") return out;

    for (var k in cfg) {
        if (!cfg.hasOwnProperty(k)) continue;
        if (k === "forceRebuild" || k === "dirtyScope" || k === "nodes" || k === "vectorData") continue;
        var val = cfg[k];
        if (typeof val === "function" || val === undefined) continue;
        out[k] = val;
    }

    if (!out.schemaVersion) out.schemaVersion = 2;

    if (cfg.nodes && typeof cfg.nodes.length === "number") {
        var cleanNodes = [];
        for (var i = 0; i < cfg.nodes.length; i++) {
            var n = cfg.nodes[i];
            if (!n || typeof n !== "object") continue;
            var cn = {};
            for (var nk in n) {
                if (!n.hasOwnProperty(nk) || nk === "vectorData") continue;
                var nv = n[nk];
                if (typeof nv === "function" || nv === undefined) continue;
                if (nk === "sources" && nv && typeof nv === "object") {
                    cn.sources = TR.JSON.parse(TR.JSON.stringify(nv)) || {};
                } else {
                    cn[nk] = nv;
                }
            }
            cleanNodes.push(cn);
        }
        out.nodes = cleanNodes;
    } else {
        out.nodes = [];
    }

    return out;
}

function writeCompStateToCtrl(ctrl, cfg) {
    if (!ctrl) return { persisted: false, hash: "" };
    var compact = compactStateForComp(cfg);
    var compactJson = TR.JSON.stringify(compact);
    var hash = computeStateHash(compactJson);
    var wrapped = MASAR_STATE_PREFIX + TR.JSON.stringify({ v: 2, hash: hash, state: compact });
    var persisted = false;
    try {
        ctrl.comment = wrapped;
        var readBack = String(ctrl.comment || "");
        if (readBack === wrapped) {
            persisted = true;
        } else {
            try { ctrl.comment = "MASAR_STATE_V2_TRUNCATED:" + hash; } catch (eClr) {}
        }
    } catch (eWrite) {}
    return { persisted: persisted, hash: hash };
}

function parseCompStateComment(ctrl) {
    if (!ctrl) return { hasSavedState: false, stateHash: "", state: null };
    var cmt = "";
    try { cmt = String(ctrl.comment || ""); } catch (eC) { cmt = ""; }
    if (!cmt) return { hasSavedState: false, stateHash: "", state: null };

    if (cmt.indexOf("MASAR_STATE_V2_TRUNCATED:") === 0) {
        return {
            hasSavedState: false,
            stateHash: cmt.substring("MASAR_STATE_V2_TRUNCATED:".length),
            state: null
        };
    }
    if (cmt.indexOf(MASAR_STATE_PREFIX) !== 0) {
        return { hasSavedState: false, stateHash: "", state: null };
    }

    var jsonPart = cmt.substring(MASAR_STATE_PREFIX.length);
    var wrapper = TR.JSON.parse(jsonPart);
    if (!wrapper || typeof wrapper !== "object" || !wrapper.state) {
        return { hasSavedState: false, stateHash: "", state: null };
    }

    var st = wrapper.state;
    if (!st.schemaVersion) st.schemaVersion = 2;
    var hash = wrapper.hash || computeStateHash(TR.JSON.stringify(st));
    return {
        hasSavedState: true,
        stateHash: String(hash),
        state: st
    };
}

function readLayerTextSafe(layer) {
    if (!layer) return "";
    try {
        var td = getTextDocumentProp(layer);
        if (td && td.value && td.value.text !== undefined) {
            return String(td.value.text);
        }
    } catch (eT) {}
    return "";
}

function inferStateFromComp(comp) {
    var orientation = "horizontal";
    try {
        var baseL = comp.layer("MS_Baseline") || comp.layer("TR_Baseline");
        var baseContents = baseL ? getShapeLayerContents(baseL) : null;
        var lineGrp = baseContents ? baseContents.property("Line") : null;
        var lineGrpContents = lineGrp ? getVectorGroupContents(lineGrp) : null;
        var pathGrp = lineGrpContents ? lineGrpContents.property("LinePath") : null;
        var pathProp = pathGrp ? getProp(pathGrp, "ADBE Vector Shape", "Path") : null;
        if (pathProp && pathProp.value && pathProp.value.vertices && pathProp.value.vertices.length >= 2) {
            var v0 = pathProp.value.vertices[0];
            var v1 = pathProp.value.vertices[1];
            orientation = (Math.abs(v1[0] - v0[0]) >= Math.abs(v1[1] - v0[1])) ? "horizontal" : "vertical";
        }
    } catch (eOri) {}

    var nodesL = null;
    var nodesContents = null;
    try {
        nodesL = comp.layer("MS_Nodes") || comp.layer("TR_Nodes");
        if (nodesL) nodesContents = getShapeLayerContents(nodesL);
    } catch (eNL) {}

    var inferredNodes = [];
    for (var i = 1; i <= 150; i++) {
        var numL = null, tL = null, dL = null, bL = null, bdgL = null, nGrp = null;
        try {
            numL = comp.layer("MS_Node_" + i + "_Num") || comp.layer("TR_Node_" + i + "_Num");
            tL = comp.layer("MS_Node_" + i + "_Title") || comp.layer("TR_Node_" + i + "_Title");
            dL = comp.layer("MS_Node_" + i + "_Desc") || comp.layer("TR_Node_" + i + "_Desc");
            bL = comp.layer("MS_Node_" + i + "_Behind") || comp.layer("TR_Node_" + i + "_Behind");
            bdgL = comp.layer("MS_Node_" + i + "_Badge") || comp.layer("TR_Node_" + i + "_Badge");
            if (nodesContents) nGrp = nodesContents.property("Node_" + i);
        } catch (eScan) {}

        if (!numL && !tL && !dL && !bL && !bdgL && !nGrp) {
            if (i > 1) break;
            continue;
        }

        var numText = readLayerTextSafe(numL);
        var titleText = readLayerTextSafe(tL);
        var descText = readLayerTextSafe(dL);
        var behindText = readLayerTextSafe(bL);
        var badgeText = readLayerTextSafe(bdgL);
        var frontVis = Boolean((tL && tL.enabled) || (dL && dL.enabled) || (bdgL && bdgL.enabled));
        var frontType = (badgeText && titleText) ? "number_title"
            : ((titleText && descText) ? "title_text"
            : (titleText ? "title" : (descText ? "text" : "title_text")));

        inferredNodes.push({
            id: "node_" + i,
            number: numText || ((i < 10 ? "0" : "") + i),
            title: titleText,
            description: descText,
            customShape: "inherit",
            sources: {
                center: {
                    type: (numL && numL.enabled && numText.length > 0) ? "shape_number" : "shape",
                    shape: "inherit",
                    value: numText,
                    visible: true
                },
                front: {
                    type: frontType,
                    title: titleText,
                    text: descText,
                    number: badgeText,
                    badge: badgeText,
                    items: [],
                    visible: frontVis
                },
                behind: {
                    type: (bL && bL.enabled && behindText.length > 0) ? "text" : "none",
                    title: "",
                    text: behindText,
                    items: [],
                    visible: Boolean(bL && bL.enabled && behindText.length > 0)
                }
            }
        });
    }

    return {
        schemaVersion: 2,
        orientation: orientation,
        nodes: inferredNodes
    };
}

// ------------------------------------------------------------------
// Central MASAR_CTRL Expression Slider Rig Helpers (E5)
// ------------------------------------------------------------------
var CTRL_SLIDER_DEFS = [
    { name: "MS Global Top Offset", key: "topOffset", def: 26, min: 0 },
    { name: "MS Global Bottom Offset", key: "bottomOffset", def: 26, min: 0 },
    { name: "MS Line Width", key: "lineWidth", def: 4, min: 0 },
    { name: "MS Line Opacity", key: "lineOpacity", def: 100, min: 0, max: 100 },
    { name: "MS Global Padding H", key: "boxPaddingH", def: 14, min: 0 },
    { name: "MS Global Padding V", key: "boxPaddingV", def: 6, min: 0 }
];

function hasCtrlMasterRig(ctrl) {
    if (!ctrl) return false;
    var fx = getProp(ctrl, "ADBE Effect Parade", "Effects");
    if (!fx) return false;
    try {
        return Boolean(
            fx.property("MS Global Top Offset") &&
            fx.property("MS Line Width") &&
            fx.property("MS Global Padding H")
        );
    } catch (eHas) {
        return false;
    }
}

function syncCtrlMasterEffects(ctrl, valuesObj, onlyPresentKeys) {
    if (!ctrl || !valuesObj) return false;
    var fx = getProp(ctrl, "ADBE Effect Parade", "Effects");
    if (!fx) return false;
    for (var i = 0; i < CTRL_SLIDER_DEFS.length; i++) {
        var def = CTRL_SLIDER_DEFS[i];
        if (onlyPresentKeys && valuesObj[def.key] === undefined) continue;
        var rawVal = onlyPresentKeys ? Number(valuesObj[def.key]) : numOr(valuesObj[def.key], def.def);
        if (!isFinite(rawVal)) rawVal = def.def;
        var val = (typeof def.max === "number")
            ? Math.max(def.min, Math.min(def.max, rawVal))
            : Math.max(def.min, rawVal);
        try {
            var s = fx.property(def.name);
            if (!s) {
                s = fx.addProperty("ADBE Slider Control");
                if (s) s.name = def.name;
            }
            var p = s ? (s.property("ADBE Slider Control-0001") || s.property(1)) : null;
            if (p) p.setValue(val);
        } catch (eSl) {}
    }
    return true;
}

function patchCompStateComment(ctrl, patchValues) {
    if (!ctrl || !patchValues) return "";
    var meta = parseCompStateComment(ctrl);
    if (!meta.hasSavedState || !meta.state) return meta.stateHash || "";
    for (var i = 0; i < CTRL_SLIDER_DEFS.length; i++) {
        var k = CTRL_SLIDER_DEFS[i].key;
        if (patchValues[k] !== undefined) {
            meta.state[k] = patchValues[k];
        }
    }
    var writeRes = writeCompStateToCtrl(ctrl, meta.state);
    return writeRes.hash || meta.stateHash || "";
}

function buildCtrlOffsetExpr(axis, sign, fixedOffset, sliderName) {
    var safeFixed = Math.round(Number(fixedOffset) * 100) / 100;
    if (!isFinite(safeFixed)) safeFixed = 0;
    if (axis === "y") {
        return 'var off = value[1]; try { off = (' + sign + ') * (' + safeFixed + ' + Math.max(0, thisComp.layer("MASAR_CTRL").effect("' + sliderName + '")(1))); } catch (e) {} [value[0], off, value[2] || 0];';
    }
    return 'var off = value[0]; try { off = (' + sign + ') * (' + safeFixed + ' + Math.max(0, thisComp.layer("MASAR_CTRL").effect("' + sliderName + '")(1))); } catch (e) {} [off, value[1], value[2] || 0];';
}

// ============================================================================
// MODULE: host/src/20-vector-primitives.jsx
// ============================================================================
function addShapePath(group, shapeObj, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var pg = contents.addProperty("ADBE Vector Shape - Group");
    if (!pg) return null;
    if (name) { pg.name = name; }
    var path = getProp(pg, "ADBE Vector Shape");
    if (path) {
        path.setValue(shapeObj);
    }
    return pg;
}

function addShapeStroke(group, color, width, capType, lineStyle, dashSize, dashGap, opacity, opts) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
    if (stroke) {
        try { getProp(stroke, "ADBE Vector Stroke Color").setValue(color); } catch (eC) {}
        try {
            var swProp = getProp(stroke, "ADBE Vector Stroke Width");
            if (swProp) {
                swProp.setValue(width);
                if (opts && opts.bindCtrl) {
                    try {
                        swProp.expression = 'try { Math.max(0, thisComp.layer("MASAR_CTRL").effect("MS Line Width")(1)); } catch (e) { value; }';
                    } catch (eSWE) {}
                }
            }
        } catch (eW) {}
        
        // Line Cap: 1 = Butt, 2 = Round, 3 = Projecting
        var capVal = 2; // Default round
        if (capType === "butt" || capType === 1) capVal = 1;
        else if (capType === "round" || capType === 2) capVal = 2;
        else if (capType === "projecting" || capType === 3) capVal = 3;
        try { getProp(stroke, "ADBE Vector Stroke Line Cap").setValue(capVal); } catch (eCap) {}

        if (typeof opacity === "number" && opacity >= 0 && opacity <= 100) {
            try {
                var soProp = getProp(stroke, "ADBE Vector Stroke Opacity");
                if (soProp) {
                    soProp.setValue(opacity);
                    if (opts && opts.bindCtrl) {
                        try {
                            soProp.expression = 'try { Math.max(0, Math.min(100, thisComp.layer("MASAR_CTRL").effect("MS Line Opacity")(1))); } catch (e) { value; }';
                        } catch (eSOE) {}
                    }
                }
            } catch (eOp) {}
        }

        // Dashed / Dotted handling
        if (lineStyle === "dotted") capVal = 2; // Always round for circular dots
        try { getProp(stroke, "ADBE Vector Stroke Line Cap").setValue(capVal); } catch (eCap2) {}

        if (lineStyle === "dashed" || lineStyle === "dotted") {
            try {
                var dashes = getProp(stroke, "ADBE Vector Stroke Dashes");
                if (dashes) {
                    var dVal = (lineStyle === "dotted") ? 0.1 : (parseFloat(dashSize) || 16);
                    var gVal = parseFloat(dashGap) || (lineStyle === "dotted" ? Math.max(width * 2.2, 10) : 10);
                    
                    var p1Set = false;
                    try {
                        dashes.property(1).setValue(dVal);
                        p1Set = true;
                    } catch (e1) {}
                    if (!p1Set) {
                        try {
                            var p1 = dashes.addProperty("ADBE Vector Stroke Dash 1");
                            if (p1) p1.setValue(dVal);
                        } catch (e1b) {}
                    }

                    var p2Set = false;
                    try {
                        dashes.property(2).setValue(gVal);
                        p2Set = true;
                    } catch (e2) {}
                    if (!p2Set) {
                        try {
                            var p2 = dashes.addProperty("ADBE Vector Stroke Gap 1");
                            if (p2) p2.setValue(gVal);
                        } catch (e2b) {}
                    }

                    if (lineStyle === "dotted") {
                        getProp(stroke, "ADBE Vector Stroke Line Cap").setValue(2); // Round cap produces round dots
                    }
                }
            } catch (eDash) {}
        }
    }
    return stroke;
}

function addShapeEllipse(group, radius, center, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var eg = contents.addProperty("ADBE Vector Shape - Ellipse");
    if (!eg) return null;
    if (name) { eg.name = name; }
    try {
        eg.property("ADBE Vector Ellipse Size").setValue([radius * 2, radius * 2]);
        eg.property("ADBE Vector Ellipse Position").setValue([center[0], center[1]]);
    } catch (eE) {}

    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            if (stroke) {
                stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            }
        } catch (eS) {}
    }
    return eg;
}

function addShapeRect(group, width, height, center, roundness, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var rg = contents.addProperty("ADBE Vector Shape - Rect");
    if (!rg) return null;
    if (name) { rg.name = name; }
    try {
        rg.property("ADBE Vector Rect Size").setValue([width, height]);
        rg.property("ADBE Vector Rect Position").setValue([center[0], center[1]]);
        if (typeof roundness === "number") {
            rg.property("ADBE Vector Rect Roundness").setValue(roundness);
        }
    } catch (eR) {}

    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            if (stroke) {
                stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            }
        } catch (eS) {}
    }
    return rg;
}

function addShapeDiamond(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var pg = contents.addProperty("ADBE Vector Shape - Group");
    if (!pg) return null;
    if (name) { pg.name = name; }
    var path = pg.property("ADBE Vector Shape");
    if (path) {
        var dShape = new Shape();
        var cx = center[0];
        var cy = center[1];
        var s = size;
        dShape.vertices = [[cx, cy - s], [cx + s, cy], [cx, cy + s], [cx - s, cy]];
        dShape.closed = true;
        path.setValue(dShape);
    }
    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            if (stroke) {
                stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
                stroke.property("ADBE Vector Stroke Line Join").setValue(2);
            }
        } catch (eS) {}
    }
    return pg;
}

function addShapeTriangle(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var pg = contents.addProperty("ADBE Vector Shape - Group");
    if (!pg) return null;
    if (name) { pg.name = name; }
    var path = pg.property("ADBE Vector Shape");
    if (path) {
        var tShape = new Shape();
        var cx = center[0];
        var cy = center[1];
        var s = size;
        tShape.vertices = [
            [cx, cy - s * 1.15],
            [cx + s, cy + s * 0.7],
            [cx - s, cy + s * 0.7]
        ];
        tShape.closed = true;
        path.setValue(tShape);
    }
    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            if (stroke) {
                stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
                stroke.property("ADBE Vector Stroke Line Join").setValue(2);
            }
        } catch (eS) {}
    }
    return pg;
}

function addShapeHexagon(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var pg = contents.addProperty("ADBE Vector Shape - Group");
    if (!pg) return null;
    if (name) { pg.name = name; }
    var path = pg.property("ADBE Vector Shape");
    if (path) {
        var hShape = new Shape();
        var cx = center[0];
        var cy = center[1];
        var s = size;
        var verts = [];
        for (var i = 0; i < 6; i++) {
            var ang = (i * 60 - 30) * Math.PI / 180;
            verts.push([cx + s * Math.cos(ang), cy + s * Math.sin(ang)]);
        }
        hShape.vertices = verts;
        hShape.closed = true;
        path.setValue(hShape);
    }
    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            if (stroke) {
                stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
                stroke.property("ADBE Vector Stroke Line Join").setValue(2);
            }
        } catch (eS) {}
    }
    return pg;
}

function addShapeStar(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var pg = contents.addProperty("ADBE Vector Shape - Group");
    if (!pg) return null;
    if (name) { pg.name = name; }
    var path = pg.property("ADBE Vector Shape");
    if (path) {
        var stShape = new Shape();
        var cx = center[0];
        var cy = center[1];
        var R = size * 1.25;
        var r = size * 0.42;
        stShape.vertices = [
            [cx, cy - R],
            [cx + r, cy - r],
            [cx + R, cy],
            [cx + r, cy + r],
            [cx, cy + R],
            [cx - r, cy + r],
            [cx - R, cy],
            [cx - r, cy - r]
        ];
        stShape.closed = true;
        path.setValue(stShape);
    }
    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            if (stroke) {
                stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
                stroke.property("ADBE Vector Stroke Line Join").setValue(2);
            }
        } catch (eS) {}
    }
    return pg;
}

function addShapeTick(group, posAlong, orientation, tickHalf, tickColor, tickWidth, name, perpOffset) {
    var parentContents = getVectorGroupContents(group);
    if (!parentContents) return null;
    var tg = parentContents.addProperty("ADBE Vector Group");
    if (!tg) return null;
    tg.name = name || "Tick";
    var po = (typeof perpOffset === "number" && isFinite(perpOffset)) ? perpOffset : 0;
    var tShape = new Shape();
    if (orientation === "horizontal") {
        tShape.vertices = [[posAlong, -tickHalf + po], [posAlong, tickHalf + po]];
    } else {
        tShape.vertices = [[-tickHalf + po, posAlong], [tickHalf + po, posAlong]];
    }
    tShape.closed = false;
    addShapePath(tg, tShape, "TickPath");
    addShapeStroke(tg, tickColor, tickWidth, 1, "solid");
    return tg;
}

function addShapeTerminal(group, type, pt, direction, orientation, color, size, name) {
    if (!type || type === "none") return null;
    var parentContents = getVectorGroupContents(group);
    if (!parentContents) return null;
    var termGroup = parentContents.addProperty("ADBE Vector Group");
    if (!termGroup) return null;
    var s = size || 10;
    var x = pt[0];
    var y = pt[1];

    if (type === "arrow") {
        termGroup.name = name || "ArrowTerminal";
        var aShape = new Shape();
        if (orientation === "horizontal") {
            if (direction > 0) {
                aShape.vertices = [[x - s * 1.2, y - s * 0.7], [x + s * 0.2, y], [x - s * 1.2, y + s * 0.7]];
            } else {
                aShape.vertices = [[x + s * 1.2, y - s * 0.7], [x - s * 0.2, y], [x + s * 1.2, y + s * 0.7]];
            }
        } else {
            if (direction > 0) {
                aShape.vertices = [[x - s * 0.7, y - s * 1.2], [x, y + s * 0.2], [x + s * 0.7, y - s * 1.2]];
            } else {
                aShape.vertices = [[x - s * 0.7, y + s * 1.2], [x, y - s * 0.2], [x + s * 0.7, y + s * 1.2]];
            }
        }
        aShape.closed = true;
        addShapePath(termGroup, aShape, "ArrowPath");
        var tContents = getVectorGroupContents(termGroup);
        if (tContents) {
            var fill = tContents.addProperty("ADBE Vector Graphic - Fill");
            try { if (fill) fill.property("ADBE Vector Fill Color").setValue(color); } catch (e) {}
        }
    } else if (type === "dot") {
        termGroup.name = name || "DotTerminal";
        addShapeEllipse(termGroup, s * 0.6, pt, color, null, 0, "DotPath");
    } else if (type === "bar") {
        termGroup.name = name || "BarTerminal";
        var bShape = new Shape();
        var bLen = s * 1.2;
        if (orientation === "horizontal") {
            bShape.vertices = [[x, y - bLen], [x, y + bLen]];
        } else {
            bShape.vertices = [[x - bLen, y], [x + bLen, y]];
        }
        bShape.closed = false;
        addShapePath(termGroup, bShape, "BarPath");
        addShapeStroke(termGroup, color, Math.max(3, s * 0.35), 1, "solid");
    }
    return termGroup;
}

function addShapeCustomVector(group, center, subPaths, fillCol, strokeCol, strokeW, name) {
    var contents = getVectorGroupContents(group);
    if (!contents) return null;
    var pg = contents.addProperty("ADBE Vector Group");
    if (!pg) return null;
    pg.name = name || "VectorShape";
    var pgContents = getVectorGroupContents(pg);
    if (!pgContents) return pg;

    var closedPaths = [];
    var openPaths = [];
    for (var sp = 0; sp < subPaths.length; sp++) {
        var sub = subPaths[sp];
        if (sub && sub.vertices && sub.vertices.length >= 2) {
            if (sub.closed === false) {
                openPaths.push(sub);
            } else {
                closedPaths.push(sub);
            }
        }
    }

    function appendSubPathsTo(targetContents, list, isOpen) {
        if (!targetContents || list.length === 0) return;
        for (var k = 0; k < list.length; k++) {
            var item = list[k];
            var sObj = new Shape();
            var verts = [];
            for (var v = 0; v < item.vertices.length; v++) {
                verts.push([
                    center[0] + item.vertices[v][0],
                    center[1] + item.vertices[v][1]
                ]);
            }
            sObj.vertices = verts;
            sObj.inTangents = (item.inTangents && item.inTangents.length === verts.length) ? item.inTangents : [];
            sObj.outTangents = (item.outTangents && item.outTangents.length === verts.length) ? item.outTangents : [];
            sObj.closed = !isOpen;

            var pathPropGroup = targetContents.addProperty("ADBE Vector Shape - Group");
            if (pathPropGroup) {
                pathPropGroup.name = "Path_" + (k + 1);
                var pathProp = getProp(pathPropGroup, "ADBE Vector Shape");
                if (pathProp) pathProp.setValue(sObj);
            }
        }
    }

    if (closedPaths.length > 0 && openPaths.length > 0) {
        var cGrp = pgContents.addProperty("ADBE Vector Group");
        cGrp.name = "ClosedFillPaths";
        var cContents = getVectorGroupContents(cGrp);
        appendSubPathsTo(cContents, closedPaths, false);
        if (cContents && fillCol) {
            var cFill = cContents.addProperty("ADBE Vector Graphic - Fill");
            try { if (cFill) cFill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
            try { if (cFill) cFill.property("ADBE Vector Fill Rule").setValue(2); } catch (eR) {}
        }
        if (cContents && strokeCol && strokeW > 0) {
            addShapeStroke(cGrp, strokeCol, strokeW, 2, "solid");
        }

        var oGrp = pgContents.addProperty("ADBE Vector Group");
        oGrp.name = "OpenStrokePaths";
        var oContents = getVectorGroupContents(oGrp);
        appendSubPathsTo(oContents, openPaths, true);
        var effOpenCol = strokeCol || fillCol || [1, 1, 1];
        var effOpenW = (strokeW > 0) ? strokeW : 2.5;
        addShapeStroke(oGrp, effOpenCol, effOpenW, 2, "solid");
    } else if (openPaths.length > 0) {
        appendSubPathsTo(pgContents, openPaths, true);
        var effOnlyOpenCol = strokeCol || fillCol || [1, 1, 1];
        var effOnlyOpenW = (strokeW > 0) ? strokeW : 2.5;
        addShapeStroke(pg, effOnlyOpenCol, effOnlyOpenW, 2, "solid");
    } else {
        appendSubPathsTo(pgContents, closedPaths, false);
        if (fillCol) {
            var fill = pgContents.addProperty("ADBE Vector Graphic - Fill");
            try { if (fill) fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF2) {}
            try { if (fill) fill.property("ADBE Vector Fill Rule").setValue(2); } catch (eR2) {}
        }
        if (strokeCol && strokeW > 0) {
            var stroke = pgContents.addProperty("ADBE Vector Graphic - Stroke");
            try {
                if (stroke) {
                    stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
                    stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
                    stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
                    stroke.property("ADBE Vector Stroke Line Join").setValue(2);
                }
            } catch (eS) {}
        }
    }

    return pg;
}

// ============================================================================
// MODULE: host/src/30-host-queries.jsx
// ============================================================================
TR.API = TR.API || {};

TR.API.ping = function () {
    return TR.JSON.stringify({ ok: true, code: "OK", message: "MASAR host ready.", data: { ready: true } });
};

TR.API.getHostInfo = function () {
    var v = "unknown";
    try { v = String(app.version); } catch (e) {}
    return TR.JSON.stringify({
        ok: true,
        code: "OK",
        message: "Host information",
        data: { aeVersion: v, version: TR.version }
    });
};

TR.API.getActiveCompInfo = function () {
    var comp = getActiveComp();
    if (!comp) {
        return TR.JSON.stringify({
            ok: false,
            code: "NO_ACTIVE_COMP",
            message: "No active composition. Open a comp first.",
            data: null
        });
    }
    var ctrl = null;
    try {
        ctrl = comp.layer("MASAR_CTRL") || comp.layer("TIME_RULER_CTRL") || null;
    } catch (eH) {}
    var hasRuler = (ctrl !== null);
    var meta = parseCompStateComment(ctrl);

    var info = {
        name: String(comp.name),
        compName: String(comp.name),
        width: Number(comp.width),
        height: Number(comp.height),
        duration: Number(comp.duration),
        frameRate: Number(comp.frameRate),
        hasRuler: hasRuler,
        hasSavedState: meta.hasSavedState,
        stateHash: meta.stateHash
    };
    return TR.JSON.stringify({
        ok: true,
        code: "OK",
        message: "Active composition found.",
        data: info
    });
};

TR.API.readCompState = function () {
    var comp = getActiveComp();
    if (!comp) {
        return TR.JSON.stringify({
            ok: false,
            code: "NO_ACTIVE_COMP",
            message: "No active composition. Open a comp first.",
            data: null
        });
    }
    var ctrl = null;
    try {
        ctrl = comp.layer("MASAR_CTRL") || comp.layer("TIME_RULER_CTRL") || null;
    } catch (eH) {}
    if (!ctrl) {
        return TR.JSON.stringify({
            ok: false,
            code: "NO_MASAR_RULER",
            message: "No MASAR ruler layer found in active composition.",
            data: null
        });
    }

    var meta = parseCompStateComment(ctrl);
    if (meta.hasSavedState && meta.state) {
        return TR.JSON.stringify({
            ok: true,
            code: "OK",
            message: "Composition state loaded from MASAR_CTRL.",
            data: {
                source: "comment",
                stateHash: meta.stateHash,
                state: meta.state
            }
        });
    }

    var inferred = inferStateFromComp(comp);
    return TR.JSON.stringify({
        ok: true,
        code: "OK",
        message: "Composition state inferred from layers.",
        data: {
            source: "inferred",
            stateHash: meta.stateHash || "",
            state: inferred
        }
    });
};

TR.API.inspectCompLayers = function () {
    var comp = getActiveComp();
    if (!comp) return TR.JSON.stringify({ ok: false, code: "NO_ACTIVE_COMP", message: "No active comp", data: null });
    var layers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = null;
        try { l = comp.layer(i); } catch (eL) { l = null; }
        if (l) {
            layers.push({ index: i, name: String(l.name), enabled: Boolean(l.enabled) });
        }
    }
    return TR.JSON.stringify({ ok: true, code: "OK", message: "Comp layers", data: layers });
};

TR.API.validateConfig = function (rawArg) {
    var cfg = {};
    try {
        if (typeof rawArg === "string" && rawArg.length > 0) cfg = TR.JSON.parse(rawArg) || {};
        else if (typeof rawArg === "object" && rawArg !== null) cfg = rawArg;
    } catch (eV) { cfg = null; }
    var errors = [];
    var warnings = [];
    if (!cfg || typeof cfg !== "object") {
        errors.push("Configuration payload must be a JSON object.");
    } else {
        if (!cfg.nodes || typeof cfg.nodes.length !== "number" || cfg.nodes.length === 0) {
            warnings.push("No nodes provided; fallback nodes will be generated.");
        } else if (cfg.nodes.length > 150) {
            warnings.push("Node count exceeds 150; cleanup or Essential Graphics bounds may clamp.");
        }
        if (cfg.length !== undefined && parseFloat(cfg.length) < 0) {
            errors.push("Track length cannot be negative.");
        }
        if (cfg.lineWidth !== undefined && parseFloat(cfg.lineWidth) < 0) {
            errors.push("Line width cannot be negative.");
        }
    }
    var valid = (errors.length === 0);
    return TR.JSON.stringify({
        ok: valid,
        code: valid ? "OK" : "INVALID_CONFIG",
        message: valid ? "Configuration valid." : errors.join(" "),
        data: { valid: valid, errors: errors, warnings: warnings }
    });
};

TR.API.startUndoSession = function (nameArg) {
    var name = (typeof nameArg === "string" && nameArg.length > 0) ? nameArg : "MASAR Edit";
    if (!TR._activeUndoSession) {
        app.beginUndoGroup(name);
        TR._activeUndoSession = name;
    }
    return TR.JSON.stringify({ ok: true, session: TR._activeUndoSession });
};

TR.API.endUndoSession = function () {
    if (TR._activeUndoSession) {
        try { app.endUndoGroup(); } catch (eEU) {}
        TR._activeUndoSession = null;
    }
    return TR.JSON.stringify({ ok: true });
};

// ============================================================================
// MODULE: host/src/40-mogrt-eg.jsx
// ============================================================================
TR.API = TR.API || {};

TR.API.setupEssentialGraphics = function (rawArg) {
    var comp = getActiveComp();
    if (!comp) {
        return TR.JSON.stringify({ ok: false, code: "NO_ACTIVE_COMP", message: "No active comp" });
    }
    var opts = {};
    try {
        if (typeof rawArg === "string" && rawArg.length > 0) opts = TR.JSON.parse(rawArg) || {};
        else if (typeof rawArg === "object" && rawArg !== null) opts = rawArg;
    } catch (eOpt) { opts = {}; }

    var includeColors = (opts.colors !== false);
    var includeTypography = (opts.typography !== false);
    var includeLayout = (opts.layout !== false);
    var includeBoxes = (opts.boxes !== false);

    var startedUndo = false;
    if (!TR._activeUndoSession) {
        app.beginUndoGroup("Setup Essential Graphics");
        startedUndo = true;
    }
    try {
        comp.motionGraphicsTemplateName = "MASAR - " + comp.name;
        try { comp.openInEssentialGraphics(); } catch (e) {}

        // Single-pass layer cache O(L)
        var egLayerMap = {};
        var hasAnyKeyframes = false;
        for (var li = 1; li <= comp.numLayers; li++) {
            var lyr = null;
            try { lyr = comp.layer(li); } catch (eLyr) { lyr = null; }
            if (lyr) {
                try {
                    var nm = String(lyr.name);
                    if (!egLayerMap[nm]) egLayerMap[nm] = lyr;
                } catch (eNm) {}
            }
        }

        var added = 0;
        function addEgProp(prop, label) {
            if (!prop) return;
            try {
                if (typeof prop.canAddToMotionGraphicsTemplate === "function" && prop.canAddToMotionGraphicsTemplate(comp)) {
                    if (typeof prop.addToMotionGraphicsTemplateAs === "function" && label) {
                        prop.addToMotionGraphicsTemplateAs(comp, label);
                    } else {
                        prop.addToMotionGraphicsTemplate(comp);
                    }
                    added++;
                }
            } catch (eAddEg) {}
        }

        // 1. Add node texts dynamically across all generated nodes (Num, Badge, Title, Desc, Behind)
        var suffixLabels = [
            { sfx: "Num", lbl: "Number" },
            { sfx: "Badge", lbl: "Badge" },
            { sfx: "Title", lbl: "Title" },
            { sfx: "Desc", lbl: "Description" },
            { sfx: "Behind", lbl: "Behind" }
        ];
        for (var i = 1; i <= 150; i++) {
            var foundAnyForIdx = false;
            for (var s = 0; s < suffixLabels.length; s++) {
                var item = suffixLabels[s];
                var txtL = egLayerMap["MS_Node_" + i + "_" + item.sfx] || egLayerMap["TR_Node_" + i + "_" + item.sfx] || null;
                if (txtL) {
                    foundAnyForIdx = true;
                    if (txtL.enabled && includeTypography) {
                        addEgProp(getTextDocumentProp(txtL), "Node " + i + " " + item.lbl);
                    }
                }
            }
            if (includeBoxes) {
                var boxTargets = ["Title_Box", "Desc_Box", "Badge_Box", "Behind_Box"];
                for (var b = 0; b < boxTargets.length; b++) {
                    var bLyr = egLayerMap["MS_Node_" + i + "_" + boxTargets[b]] || null;
                    if (bLyr && bLyr.enabled) {
                        foundAnyForIdx = true;
                        var bFx = getProp(bLyr, "ADBE Effect Parade", "Effects");
                        if (bFx) {
                            if (includeColors) {
                                var fc = bFx.property("Fill Color");
                                if (fc) addEgProp(fc.property("ADBE Color Control-0001") || fc.property(1), "Node " + i + " " + boxTargets[b] + " Fill");
                                var sc = bFx.property("Stroke Color");
                                if (sc) addEgProp(sc.property("ADBE Color Control-0001") || sc.property(1), "Node " + i + " " + boxTargets[b] + " Stroke");
                            }
                            var fo = bFx.property("Fill Opacity");
                            if (fo) addEgProp(fo.property("ADBE Slider Control-0001") || fo.property(1), "Node " + i + " " + boxTargets[b] + " Opacity");
                        }
                    }
                }
            }
            if (!foundAnyForIdx && i > 10) break;
        }

        // 2. Expose Master Timeline Position if layout option enabled, and protect keyframes
        try {
            var ctrlL = egLayerMap["MASAR_CTRL"] || egLayerMap["TIME_RULER_CTRL"];
            if (ctrlL) {
                var cp = getProp(ctrlL, "ADBE Position", "Position");
                if (includeLayout && cp) {
                    addEgProp(cp, "Timeline Position");
                }
                if (cp && cp.numKeys > 0) hasAnyKeyframes = true;
            }
            if (comp.markerProperty && (hasAnyKeyframes || opts.protectIntro === true)) {
                var mIntro = new MarkerValue("Intro Protected");
                mIntro.duration = 2.5;
                mIntro.protectedRegion = true;
                comp.markerProperty.setValueAtTime(0, mIntro);
            }
        } catch (eM) {}

        return TR.JSON.stringify({ ok: true, code: "OK", message: "Essential Graphics configured with " + added + " properties.", data: { addedCount: added } });
    } catch (err) {
        return TR.JSON.stringify({ ok: false, code: "EG_ERROR", message: err.toString() });
    } finally {
        if (startedUndo) {
            try { app.endUndoGroup(); } catch (eEndEG) {}
        }
    }
};

TR.API.exportMOGRT = function (rawArg) {
    var comp = getActiveComp();
    if (!comp) {
        return TR.JSON.stringify({ ok: false, code: "NO_ACTIVE_COMP", message: "No active comp" });
    }
    try {
        // Setup properties and markers
        TR.API.setupEssentialGraphics(rawArg);

        var destFolder = new Folder(Folder.myDocuments.fsName + "/Adobe/Common/Motion Graphics Templates");
        if (!destFolder.exists) {
            try { destFolder.create(); } catch (e) {}
        }
        if (!destFolder.exists) {
            destFolder = Folder.myDocuments;
        }

        var cleanName = comp.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "_");
        if (!cleanName || cleanName.length === 0) cleanName = "MASAR_Template";
        var mogrtFile = new File(destFolder.fsName + "/" + cleanName + ".mogrt");

        var exported = false;
        try {
            if (typeof app.beginSuppressDialogs === "function") app.beginSuppressDialogs();
            exported = Boolean(comp.exportAsMotionGraphicsTemplate(true, mogrtFile.fsName));
        } catch (eInner) {
            exported = false;
        } finally {
            if (typeof app.endSuppressDialogs === "function") app.endSuppressDialogs(false);
        }

        if (!exported) {
            return TR.JSON.stringify({
                ok: false,
                code: "MOGRT_EXPORT_FAILED",
                message: "After Effects failed to export MOGRT to: " + mogrtFile.fsName,
                data: { path: mogrtFile.fsName, exported: false }
            });
        }

        return TR.JSON.stringify({
            ok: true,
            code: "OK",
            message: "MOGRT exported successfully to: " + mogrtFile.fsName,
            data: { path: mogrtFile.fsName, exported: true }
        });
    } catch (eExp) {
        return TR.JSON.stringify({
            ok: false,
            code: "MOGRT_EXPORT_FAILED",
            message: "Export failed: " + String(eExp && eExp.message ? eExp.message : eExp)
        });
    }
};

// ============================================================================
// MODULE: host/src/50-text-boxes.jsx
// ============================================================================
function resolveTriState(obj, keys) {
    if (!obj) return "inherit";
    for (var ki = 0; ki < keys.length; ki++) {
        var val = obj[keys[ki]];
        if (val === true || val === "on") return true;
        if (val === false || val === "off") return false;
    }
    return "inherit";
}

function firstColor(obj, keys) {
    if (!obj) return null;
    for (var ki = 0; ki < keys.length; ki++) {
        var val = obj[keys[ki]];
        if (val && String(val).length > 0) return val;
    }
    return null;
}

function firstNum(obj, keys) {
    if (!obj) return null;
    for (var ki = 0; ki < keys.length; ki++) {
        var val = obj[keys[ki]];
        if (typeof val === "number" && isFinite(val)) return val;
    }
    return null;
}

function resolveBoxSettings(streamObj, nodeData, streamKind, ctx) {
    if (streamObj && streamObj.type === "icon") {
        return { enabled: false };
    }

    var isBehindStream = (streamKind === "behind");
    var kindKeys = (streamKind === "title")
        ? ["titleBox", "titleBoxEnabled", "box", "boxEnabled"]
        : ((streamKind === "desc")
            ? ["descBox", "descBoxEnabled", "box", "boxEnabled"]
            : ((streamKind === "badge")
                ? ["badgeBox", "badgeBoxEnabled", "box", "boxEnabled"]
                : ["behindBox", "behindBoxEnabled", "titleBox", "titleBoxEnabled", "descBox", "descBoxEnabled", "badgeBox", "badgeBoxEnabled", "box", "boxEnabled"]));

    var sBox = resolveTriState(streamObj, kindKeys);
    var nBox = resolveTriState(nodeData, kindKeys);

    var streamGlobalEnabled = (streamKind === "title")
        ? ctx.globalTitleBoxEnabled
        : ((streamKind === "desc")
            ? ctx.globalDescBoxEnabled
            : (isBehindStream ? ctx.globalBehindBoxEnabled : true));

    var baseFill = (streamKind === "title")
        ? ctx.globalTitleBoxFillColor
        : ((streamKind === "desc")
            ? ctx.globalDescBoxFillColor
            : (isBehindStream ? ctx.globalBehindBoxFillColor : ctx.globalBoxFillColor));
    var baseStroke = (streamKind === "title")
        ? ctx.globalTitleBoxStrokeColor
        : ((streamKind === "desc")
            ? ctx.globalDescBoxStrokeColor
            : (isBehindStream ? ctx.globalBehindBoxStrokeColor : ctx.globalBoxStrokeColor));
    var baseRadius = (streamKind === "title")
        ? ctx.globalTitleBoxRadius
        : ((streamKind === "desc")
            ? ctx.globalDescBoxRadius
            : (isBehindStream ? ctx.globalBehindBoxRadius : ctx.globalBoxRadius));
    var baseFillOp = (streamKind === "title")
        ? ctx.globalTitleBoxFillOpacity
        : ((streamKind === "desc")
            ? ctx.globalDescBoxFillOpacity
            : (isBehindStream ? ctx.globalBehindBoxFillOpacity : ctx.globalBoxFillOpacity));
    var baseStrokeW = (streamKind === "title")
        ? ctx.globalTitleBoxStrokeWidth
        : ((streamKind === "desc")
            ? ctx.globalDescBoxStrokeWidth
            : (isBehindStream ? ctx.globalBehindBoxStrokeWidth : ctx.globalBoxStrokeWidth));

    var isEnabled = false;
    if (sBox === true || sBox === false) isEnabled = sBox;
    else if (nBox === true || nBox === false) isEnabled = nBox;
    else isEnabled = ctx.globalBoxEnabled && streamGlobalEnabled;

    var fillKeys = (streamKind === "badge")
        ? ["badgeBoxColor", "badgeBoxFillColor", "boxFillColor", "boxColor"]
        : ((streamKind === "title")
            ? ["titleBoxColor", "titleBoxFillColor", "boxFillColor", "boxColor"]
            : ((streamKind === "desc")
                ? ["descBoxColor", "descBoxFillColor", "boxFillColor", "boxColor"]
                : ["behindBoxColor", "titleBoxColor", "descBoxColor", "badgeBoxColor", "boxFillColor", "boxColor"]));
    var strokeKeys = (streamKind === "badge")
        ? ["badgeBoxStroke", "badgeBoxStrokeColor", "boxStrokeColor", "boxStroke"]
        : ((streamKind === "title")
            ? ["titleBoxStroke", "titleBoxStrokeColor", "boxStrokeColor", "boxStroke"]
            : ((streamKind === "desc")
                ? ["descBoxStroke", "descBoxStrokeColor", "boxStrokeColor", "boxStroke"]
                : ["behindBoxStroke", "titleBoxStroke", "descBoxStroke", "badgeBoxStroke", "boxStrokeColor", "boxStroke"]));
    var radKeys = (streamKind === "badge")
        ? ["badgeBoxRadius", "boxRadius"]
        : ((streamKind === "title")
            ? ["titleBoxRadius", "boxRadius"]
            : ((streamKind === "desc")
                ? ["descBoxRadius", "boxRadius"]
                : ["behindBoxRadius", "titleBoxRadius", "descBoxRadius", "badgeBoxRadius", "boxRadius"]));
    var opKeys = (streamKind === "badge")
        ? ["badgeBoxFillOpacity", "boxFillOpacity"]
        : ((streamKind === "title")
            ? ["titleBoxFillOpacity", "boxFillOpacity"]
            : ((streamKind === "desc")
                ? ["descBoxFillOpacity", "boxFillOpacity"]
                : ["behindBoxFillOpacity", "titleBoxFillOpacity", "descBoxFillOpacity", "badgeBoxFillOpacity", "boxFillOpacity"]));

    var rawFill = firstColor(streamObj, fillKeys) || firstColor(nodeData, fillKeys.concat(["customBoxColor"]));
    var rawStroke = firstColor(streamObj, strokeKeys) || firstColor(nodeData, strokeKeys.concat(["customBoxStroke"]));
    var rawRad = firstNum(streamObj, radKeys);
    if (rawRad === null) rawRad = firstNum(nodeData, radKeys);
    var rawOp = firstNum(streamObj, opKeys);
    if (rawOp === null) rawOp = firstNum(nodeData, opKeys);
    var rawSW = firstNum(streamObj, ["boxStrokeWidth", streamKind + "BoxStrokeWidth"]);
    if (rawSW === null) rawSW = firstNum(nodeData, ["boxStrokeWidth", streamKind + "BoxStrokeWidth"]);
    var rawStrkOp = firstNum(streamObj, ["boxStrokeOpacity"]);
    if (rawStrkOp === null) rawStrkOp = firstNum(nodeData, ["boxStrokeOpacity"]);

    var effPaddingH = firstNum(streamObj, ["boxPaddingH"]);
    if (effPaddingH === null) effPaddingH = firstNum(nodeData, ["boxPaddingH"]);
    var useGlobalPadH = (effPaddingH === null);
    if (effPaddingH === null) effPaddingH = ctx.globalBoxPaddingH;

    var effPaddingV = firstNum(streamObj, ["boxPaddingV"]);
    if (effPaddingV === null) effPaddingV = firstNum(nodeData, ["boxPaddingV"]);
    var useGlobalPadV = (effPaddingV === null);
    if (effPaddingV === null) effPaddingV = ctx.globalBoxPaddingV;

    return {
        enabled: isEnabled,
        fillColor: rawFill ? parseColor(rawFill, baseFill) : baseFill,
        fillOpacity: (rawOp !== null) ? rawOp : baseFillOp,
        strokeColor: rawStroke ? parseColor(rawStroke, baseStroke) : baseStroke,
        strokeWidth: (rawSW !== null) ? rawSW : baseStrokeW,
        strokeOpacity: (rawStrkOp !== null) ? rawStrkOp : ctx.globalBoxStrokeOpacity,
        radius: (rawRad !== null) ? rawRad : baseRadius,
        paddingH: effPaddingH,
        paddingV: effPaddingV,
        useGlobalPadH: useGlobalPadH,
        useGlobalPadV: useGlobalPadV
    };
}

function createOrUpdateTextBox(comp, textLayer, boxLayerName, boxSettings, layerByName) {
    var bLayer = layerByName[boxLayerName] || null;
    if (!textLayer || !textLayer.enabled || !boxSettings || !boxSettings.enabled) {
        if (bLayer) {
            try { bLayer.enabled = false; } catch (e) {}
        }
        return null;
    }

    var isNewBox = false;
    if (!bLayer) {
        bLayer = comp.layers.addShape();
        bLayer.name = boxLayerName;
        layerByName[boxLayerName] = bLayer;
        isNewBox = true;
    }

    bLayer.parent = textLayer;
    var posProp = getProp(bLayer, "ADBE Position", "Position");
    var apProp = getProp(bLayer, "ADBE Anchor Point", "Anchor Point");
    try { if (posProp) posProp.setValue([0, 0, 0]); } catch (eP) {}
    try { if (apProp) apProp.setValue([0, 0, 0]); } catch (eA) {}

    var fx = getProp(bLayer, "ADBE Effect Parade", "Effects");
    if (fx) {
        var padH = (typeof boxSettings.paddingH === "number" && !isNaN(boxSettings.paddingH)) ? boxSettings.paddingH : 14;
        var padV = (typeof boxSettings.paddingV === "number" && !isNaN(boxSettings.paddingV)) ? boxSettings.paddingV : 6;
        var rad = (typeof boxSettings.radius === "number" && !isNaN(boxSettings.radius)) ? boxSettings.radius : 6;
        var fillCol = boxSettings.fillColor || [0.05, 0.07, 0.12];
        var fillOp = (typeof boxSettings.fillOpacity === "number" && !isNaN(boxSettings.fillOpacity)) ? boxSettings.fillOpacity : 85;
        var strkCol = boxSettings.strokeColor || [0.06, 0.72, 0.5];
        var strkW = (typeof boxSettings.strokeWidth === "number" && !isNaN(boxSettings.strokeWidth)) ? boxSettings.strokeWidth : 1.5;
        var strkOp = (typeof boxSettings.strokeOpacity === "number" && !isNaN(boxSettings.strokeOpacity)) ? boxSettings.strokeOpacity : 90;

        function safeSetSlider(fxGroup, name, val) {
            try {
                var s = fxGroup.property(name);
                if (!s) {
                    s = fxGroup.addProperty("ADBE Slider Control");
                    s.name = name;
                }
                var p = s.property("ADBE Slider Control-0001") || s.property("Slider") || s.property(1);
                if (p) p.setValue(val);
            } catch (eSl) {}
        }
        function safeSetColor(fxGroup, name, col) {
            try {
                var c = fxGroup.property(name);
                if (!c) {
                    c = fxGroup.addProperty("ADBE Color Control");
                    c.name = name;
                }
                var p = c.property("ADBE Color Control-0001") || c.property("Color") || c.property(1);
                if (p) p.setValue(col);
            } catch (eCl) {}
        }

        safeSetSlider(fx, "Padding H", padH);
        safeSetSlider(fx, "Padding V", padV);
        safeSetSlider(fx, "Corner Radius", rad);
        safeSetColor(fx, "Fill Color", fillCol);
        safeSetSlider(fx, "Fill Opacity", fillOp);
        safeSetColor(fx, "Stroke Color", strkCol);
        safeSetSlider(fx, "Stroke Width", strkW);
        safeSetSlider(fx, "Stroke Opacity", strkOp);
    }

    var contents = getShapeLayerContents(bLayer);
    if (contents) {
        var grp = null;
        try { grp = contents.property("Box"); } catch (e) {}
        var createdGrp = false;
        if (!grp) {
            grp = contents.addProperty("ADBE Vector Group");
            if (grp) grp.name = "Box";
            createdGrp = true;
        }
        var grpContents = getVectorGroupContents(grp);
        var desiredRectSizeExpr = [
            'var r = parent.sourceRectAtTime(time, false);',
            'var pH = effect("Padding H")(1);',
            'var pV = effect("Padding V")(1);',
            (boxSettings.useGlobalPadH !== false) ? 'try { pH = thisComp.layer("MASAR_CTRL").effect("MS Global Padding H")(1); } catch (eH) {}' : '',
            (boxSettings.useGlobalPadV !== false) ? 'try { pV = thisComp.layer("MASAR_CTRL").effect("MS Global Padding V")(1); } catch (eV) {}' : '',
            '[r.width + pH * 2, r.height + pV * 2];'
        ].join('\n');

        if (grpContents && (isNewBox || createdGrp || (!grpContents.property("BoxRect") && !grpContents.property("ADBE Vector Shape - Rect")))) {
            var rect = null;
            try { rect = grpContents.property("BoxRect") || grpContents.property("ADBE Vector Shape - Rect"); } catch (e) {}
            if (!rect) {
                rect = grpContents.addProperty("ADBE Vector Shape - Rect");
                if (rect) rect.name = "BoxRect";
            }
            if (rect) {
                try {
                    var rSize = getProp(rect, "ADBE Vector Rect Size", "Size") || rect.property(2);
                    if (rSize && (!rSize.expression || rSize.expression.indexOf('var r = parent.sourceRectAtTime') === 0)) {
                        rSize.expression = desiredRectSizeExpr;
                    }
                } catch (eRS) {}
                try {
                    var rPos = getProp(rect, "ADBE Vector Rect Position", "Position") || rect.property(3);
                    if (rPos && !rPos.expression) {
                        rPos.expression = [
                            'var r = parent.sourceRectAtTime(time, false);',
                            '[r.left + r.width / 2, r.top + r.height / 2];'
                        ].join('\n');
                    }
                } catch (eRP) {}
                try {
                    var rRnd = getProp(rect, "ADBE Vector Rect Roundness", "Roundness") || rect.property(4);
                    if (rRnd && !rRnd.expression) {
                        rRnd.expression = 'Math.max(0, effect("Corner Radius")(1));';
                    }
                } catch (eRR) {}
            }

            var fill = null;
            try { fill = grpContents.property("BoxFill") || grpContents.property("ADBE Vector Graphic - Fill"); } catch (e) {}
            if (!fill) {
                fill = grpContents.addProperty("ADBE Vector Graphic - Fill");
                if (fill) fill.name = "BoxFill";
            }
            if (fill) {
                try {
                    var fCol = getProp(fill, "ADBE Vector Fill Color", "Color") || fill.property(4);
                    if (fCol && !fCol.expression) fCol.expression = 'effect("Fill Color")(1);';
                } catch (eFC) {}
                try {
                    var fOp = getProp(fill, "ADBE Vector Fill Opacity", "Opacity") || fill.property(5);
                    if (fOp && !fOp.expression) {
                        fOp.expression = [
                            'var txt = parent.text.sourceText + "";',
                            'var clean = txt.replace(/\\s/g, "");',
                            '(clean.length > 0) ? effect("Fill Opacity")(1) : 0;'
                        ].join('\n');
                    }
                } catch (eFO) {}
            }

            var stroke = null;
            try { stroke = grpContents.property("BoxStroke") || grpContents.property("ADBE Vector Graphic - Stroke"); } catch (e) {}
            if (!stroke) {
                stroke = grpContents.addProperty("ADBE Vector Graphic - Stroke");
                if (stroke) stroke.name = "BoxStroke";
            }
            if (stroke) {
                try {
                    var sCol = getProp(stroke, "ADBE Vector Stroke Color", "Color") || stroke.property(3);
                    if (sCol && !sCol.expression) sCol.expression = 'effect("Stroke Color")(1);';
                } catch (eSC) {}
                try {
                    var sW = getProp(stroke, "ADBE Vector Stroke Width", "Stroke Width") || stroke.property(4);
                    if (sW && !sW.expression) sW.expression = 'Math.max(0, effect("Stroke Width")(1));';
                } catch (eSW) {}
                try {
                    var sOp = getProp(stroke, "ADBE Vector Stroke Opacity", "Opacity") || stroke.property(5);
                    if (sOp && !sOp.expression) {
                        sOp.expression = [
                            'var txt = parent.text.sourceText + "";',
                            'var clean = txt.replace(/\\s/g, "");',
                            '(clean.length > 0) ? effect("Stroke Opacity")(1) : 0;'
                        ].join('\n');
                    }
                } catch (eSO) {}
            }
        } else if (grpContents) {
            try {
                var existingRect = grpContents.property("BoxRect") || grpContents.property("ADBE Vector Shape - Rect");
                if (existingRect) {
                    var erSize = getProp(existingRect, "ADBE Vector Rect Size", "Size") || existingRect.property(2);
                    if (erSize && (!erSize.expression || erSize.expression.indexOf('var r = parent.sourceRectAtTime') === 0)) {
                        erSize.expression = desiredRectSizeExpr;
                    }
                }
            } catch (eUpdRect) {}
        }
    }

    bLayer.enabled = true;
    return bLayer;
}

// ============================================================================
// MODULE: host/src/60-generate-engine.jsx
// ============================================================================
TR.API = TR.API || {};

TR.API.generate = function (rawArg) {
var cfg = {};
try {
    if (typeof rawArg === "string" && rawArg.length > 0) {
        cfg = TR.JSON.parse(rawArg) || {};
    } else if (typeof rawArg === "object" && rawArg !== null) {
        cfg = rawArg;
    }
} catch (eP) { cfg = {}; }

var comp = getActiveComp();
if (!comp) {
    return TR.JSON.stringify({
        ok: false,
        code: "NO_ACTIVE_COMP",
        message: "No active composition found. Open a comp first.",
        data: null
    });
}

var startedGenUndo = false;
if (!TR._activeUndoSession) {
    app.beginUndoGroup("Generate MASAR Timeline");
    startedGenUndo = true;
}

try {
    var orientation = cfg.orientation || "horizontal";
    var dirtyScope = cfg.dirtyScope || "full";
    var forceRebuildTop = (cfg.forceRebuild === true);

    // E5 O(1) Fast Path: update MASAR_CTRL slider controls without iterating layers
    if (dirtyScope === "ctrl" && !forceRebuildTop) {
        var fastCtrl = null;
        try { fastCtrl = comp.layer("MASAR_CTRL") || comp.layer("TIME_RULER_CTRL") || null; } catch (eFastC) {}
        if (!fastCtrl || !hasCtrlMasterRig(fastCtrl)) {
            return TR.JSON.stringify({
                ok: false,
                code: "CTRL_RIG_MISSING",
                message: "MASAR_CTRL master slider rig not found on layer; full upgrade required.",
                data: null
            });
        }
        var patchSrc = (cfg.patchValues && typeof cfg.patchValues === "object") ? cfg.patchValues : cfg;
        syncCtrlMasterEffects(fastCtrl, patchSrc, true);
        var patchedHash = patchCompStateComment(fastCtrl, patchSrc);
        return TR.JSON.stringify({
            ok: true,
            code: "OK",
            message: "MASAR_CTRL updated in O(1).",
            data: {
                orientation: orientation,
                dirtyScope: "ctrl",
                fastPath: true,
                stateHash: patchedHash,
                statePersisted: true
            }
        });
    }

    var nodes = (cfg.nodes && typeof cfg.nodes.length === "number" && cfg.nodes.length > 0)
        ? cfg.nodes : [];

    // Fallback nodes if none provided
    if (nodes.length === 0) {
        var fallbackCount = parseInt(cfg.count, 10) || 5;
        for (var f = 0; f < fallbackCount; f++) {
            nodes.push({
                number: (f < 9 ? "0" : "") + (f + 1),
                title: "عنوان " + (f + 1),
                description: "شرح تفصيلي للعقدة " + (f + 1)
            });
        }
    }

    var count = nodes.length;
    var compW = comp.width;
    var compH = comp.height;

    // Spacing & Length calculation (guarding zero margin and negative span)
    var margin = Math.max(0, numOr(cfg.endMargin, 60));
    var spacingMode = cfg.spacingMode || "auto";
    var spacingGap = Math.max(10, numOr(cfg.spacingGap, 240));
    var length = 0;

    if (spacingMode === "fixed") {
        length = (Math.max(0, count - 1) * spacingGap) + (2 * margin);
    } else {
        var defaultLen = (orientation === "horizontal") ? Math.round(compW * 0.8) : Math.round(compH * 0.8);
        length = Math.max(0, numOr(cfg.length, defaultLen));
    }

    var halfLen = length / 2;
    var usableSpan = Math.max(0, length - (2 * margin));
    var step = (count > 1) ? (usableSpan / (count - 1)) : 0;

    // Styling params (zero-safe via numOr)
    var lineWidth = Math.max(0, numOr(cfg.lineWidth, 4));
    var lineColor = parseColor(cfg.lineColor, [0.95, 0.95, 0.95]);

    var lineStyle = cfg.lineStyle || "solid";
    var lineCap = cfg.lineCap || "round";
    var dashSize = Math.max(0.5, numOr(cfg.dashSize, 16));
    var dashGap = Math.max(1, numOr(cfg.dashGap, 10));
    var lineOpacity = Math.max(0, Math.min(100, numOr(cfg.lineOpacity, 100)));
    var startTerminal = cfg.startTerminal || "none";
    var endTerminal = cfg.endTerminal || "none";
    var terminalSize = Math.max(2, numOr(cfg.terminalSize, Math.max(12, lineWidth * 3)));
    var terminalColor = (cfg.terminalColor && String(cfg.terminalColor).length > 0) ? parseColor(cfg.terminalColor, lineColor) : lineColor;

    var nodeShape = cfg.nodeShape || "circle";
    var circleRadius = Math.max(1, numOr(cfg.circleRadius, 12));
    var circleFill = parseColor(cfg.circleFill, [0.05, 0.44, 0.92]);
    var circleStroke = parseColor(cfg.circleStroke, [1, 1, 1]);
    var circleStrokeWidth = Math.max(0, numOr(cfg.circleStrokeWidth, 3));

    var tickHeight = Math.max(1, numOr(cfg.tickHeight, 36));
    var tickWidth = Math.max(0, numOr(cfg.tickWidth, 4));
    var tickColor = parseColor(cfg.tickColor, [0.95, 0.95, 0.95]);
    var tickHalf = tickHeight / 2;

    var titleFontSize = Math.max(6, numOr(cfg.titleFontSize, 22));
    var titleColor = parseColor(cfg.titleColor, [1, 1, 1]);

    var descFontSize = Math.max(6, numOr(cfg.descFontSize, 14));
    var descColor = parseColor(cfg.descColor, [0.7, 0.7, 0.7]);
    var topOffset = Math.max(0, numOr(cfg.topOffset, 26));

    var numberFontSize = Math.max(6, numOr(cfg.numberFontSize, 20));
    var numberColor = (cfg.numberColor && String(cfg.numberColor).length > 0) ? parseColor(cfg.numberColor, [0.02, 0.59, 0.41]) : parseColor("#059669", [0.02, 0.59, 0.41]);
    var bottomOffset = Math.max(0, numOr(cfg.bottomOffset, 26));

    var compCenter = [compW / 2, compH / 2];

    var globalContentSide = cfg.contentSide || (orientation === "vertical" ? "left" : "top");
    var globalTextAlign = cfg.textAlign || "auto";

    // Box / Card Containers Configuration
    var globalBoxEnabled = (cfg.boxEnabled === true || cfg.boxMode === "glass" || cfg.boxMode === "solid");
    var globalBoxMode = cfg.boxMode || "off";
    var globalBoxFillColor = parseColor(cfg.boxFillColor, [0.06, 0.09, 0.16]);
    var globalBoxFillOpacity = (typeof cfg.boxFillOpacity === "number") ? cfg.boxFillOpacity : (globalBoxMode === "glass" ? 25 : 85);
    var globalBoxStrokeColor = parseColor(cfg.boxStrokeColor, [0.22, 0.65, 1.0]);
    var globalBoxStrokeWidth = (typeof cfg.boxStrokeWidth === "number") ? cfg.boxStrokeWidth : (globalBoxMode === "glass" ? 1.0 : 1.5);
    var globalBoxStrokeOpacity = (typeof cfg.boxStrokeOpacity === "number") ? cfg.boxStrokeOpacity : 90;
    var globalBoxRadius = (typeof cfg.boxRadius === "number") ? cfg.boxRadius : 6;
    var globalBoxPaddingH = (typeof cfg.boxPaddingH === "number") ? cfg.boxPaddingH : 14;
    var globalBoxPaddingV = (typeof cfg.boxPaddingV === "number") ? cfg.boxPaddingV : 6;

    // Source-Specific Global Box Settings (Title vs Desc vs Behind vs Badge)
    var globalTitleBoxEnabled = (typeof cfg.titleBoxEnabled === "boolean") ? cfg.titleBoxEnabled : true;
    var globalTitleBoxFillColor = parseColor(cfg.titleBoxFillColor, parseColor("#0b1120", globalBoxFillColor));
    var globalTitleBoxStrokeColor = parseColor(cfg.titleBoxStrokeColor, parseColor("#38bdf8", globalBoxStrokeColor));
    var globalTitleBoxRadius = (typeof cfg.titleBoxRadius === "number") ? cfg.titleBoxRadius : globalBoxRadius;
    var globalTitleBoxFillOpacity = (typeof cfg.titleBoxFillOpacity === "number") ? cfg.titleBoxFillOpacity : globalBoxFillOpacity;
    var globalTitleBoxStrokeWidth = (typeof cfg.titleBoxStrokeWidth === "number") ? cfg.titleBoxStrokeWidth : globalBoxStrokeWidth;

    var globalDescBoxEnabled = (typeof cfg.descBoxEnabled === "boolean") ? cfg.descBoxEnabled : true;
    var globalDescBoxFillColor = parseColor(cfg.descBoxFillColor, parseColor("#0b1120", globalBoxFillColor));
    var globalDescBoxStrokeColor = parseColor(cfg.descBoxStrokeColor, parseColor("#64748b", globalBoxStrokeColor));
    var globalDescBoxRadius = (typeof cfg.descBoxRadius === "number") ? cfg.descBoxRadius : globalBoxRadius;
    var globalDescBoxFillOpacity = (typeof cfg.descBoxFillOpacity === "number") ? cfg.descBoxFillOpacity : globalBoxFillOpacity;
    var globalDescBoxStrokeWidth = (typeof cfg.descBoxStrokeWidth === "number") ? cfg.descBoxStrokeWidth : globalBoxStrokeWidth;

    var globalBehindBoxEnabled = (typeof cfg.behindBoxEnabled === "boolean") ? cfg.behindBoxEnabled : true;
    var globalBehindBoxFillColor = parseColor(cfg.behindBoxFillColor, parseColor("#1a1408", globalBoxFillColor));
    var globalBehindBoxStrokeColor = parseColor(cfg.behindBoxStrokeColor, parseColor("#f59e0b", globalBoxStrokeColor));
    var globalBehindBoxRadius = (typeof cfg.behindBoxRadius === "number") ? cfg.behindBoxRadius : globalBoxRadius;
    var globalBehindBoxFillOpacity = (typeof cfg.behindBoxFillOpacity === "number") ? cfg.behindBoxFillOpacity : globalBoxFillOpacity;
    var globalBehindBoxStrokeWidth = (typeof cfg.behindBoxStrokeWidth === "number") ? cfg.behindBoxStrokeWidth : globalBoxStrokeWidth;

    // Single-pass Layer Dictionary O(L) replacing O(N^2) comp.layer() scans
    var layerByName = {};
    function refreshLayerMap() {
        layerByName = {};
        for (var lm = 1; lm <= comp.numLayers; lm++) {
            var lObj = null;
            try { lObj = comp.layer(lm); } catch (eLM) { lObj = null; }
            if (lObj) {
                try {
                    var lNm = String(lObj.name);
                    if (!layerByName[lNm]) layerByName[lNm] = lObj;
                } catch (eLN) {}
            }
        }
    }
    refreshLayerMap();

    function findNodeLayer(c, idx1, suffix) {
        return layerByName["MS_Node_" + idx1 + "_" + suffix] || layerByName["TR_Node_" + idx1 + "_" + suffix] || null;
    }
    var boxCtx = {
        globalBoxEnabled: globalBoxEnabled,
        globalBoxFillColor: globalBoxFillColor,
        globalBoxFillOpacity: globalBoxFillOpacity,
        globalBoxStrokeColor: globalBoxStrokeColor,
        globalBoxStrokeWidth: globalBoxStrokeWidth,
        globalBoxStrokeOpacity: globalBoxStrokeOpacity,
        globalBoxRadius: globalBoxRadius,
        globalBoxPaddingH: globalBoxPaddingH,
        globalBoxPaddingV: globalBoxPaddingV,
        globalTitleBoxEnabled: globalTitleBoxEnabled,
        globalTitleBoxFillColor: globalTitleBoxFillColor,
        globalTitleBoxStrokeColor: globalTitleBoxStrokeColor,
        globalTitleBoxRadius: globalTitleBoxRadius,
        globalTitleBoxFillOpacity: globalTitleBoxFillOpacity,
        globalTitleBoxStrokeWidth: globalTitleBoxStrokeWidth,
        globalDescBoxEnabled: globalDescBoxEnabled,
        globalDescBoxFillColor: globalDescBoxFillColor,
        globalDescBoxStrokeColor: globalDescBoxStrokeColor,
        globalDescBoxRadius: globalDescBoxRadius,
        globalDescBoxFillOpacity: globalDescBoxFillOpacity,
        globalDescBoxStrokeWidth: globalDescBoxStrokeWidth,
        globalBehindBoxEnabled: globalBehindBoxEnabled,
        globalBehindBoxFillColor: globalBehindBoxFillColor,
        globalBehindBoxStrokeColor: globalBehindBoxStrokeColor,
        globalBehindBoxRadius: globalBehindBoxRadius,
        globalBehindBoxFillOpacity: globalBehindBoxFillOpacity,
        globalBehindBoxStrokeWidth: globalBehindBoxStrokeWidth
    };

    var forceRebuild = (cfg.forceRebuild === true);

    // Single-pass lookup for controller, baseline and nodes layers
    var ctrl = layerByName["MASAR_CTRL"] || layerByName["TIME_RULER_CTRL"] || null;
    var baseLayer = ctrl ? (layerByName["MS_Baseline"] || layerByName["TR_Baseline"] || null) : null;
    var nodesLayer = ctrl ? (layerByName["MS_Nodes"] || layerByName["TR_Nodes"] || null) : null;

    var canUpdateInPlace = (!forceRebuild && ctrl !== null);

    var startPt = (orientation === "horizontal") ? [-halfLen, 0] : [0, -halfLen];
    var endPt = (orientation === "horizontal") ? [halfLen, 0] : [0, halfLen];

    if (!canUpdateInPlace) {
        var toRemove = [];
        for (var l = 1; l <= comp.numLayers; l++) {
            var cur = null;
            try { cur = comp.layer(l); } catch (eGetL) { cur = null; }
            if (cur) {
                var lName = "";
                try { lName = String(cur.name); } catch (eN) {}
                if (lName === "MASAR_CTRL" ||
                    lName === "TIME_RULER_CTRL" ||
                    lName === "MS_Baseline" ||
                    lName === "TR_Baseline" ||
                    lName === "MS_Nodes" ||
                    lName === "TR_Nodes" ||
                    lName.indexOf("MS_Node_") === 0 ||
                    lName.indexOf("TR_Node_") === 0) {
                    toRemove.push(cur);
                }
            }
        }
        for (var r = 0; r < toRemove.length; r++) {
            try { if (toRemove[r]) toRemove[r].parent = null; } catch (eUnp) {}
        }
        for (var r = 0; r < toRemove.length; r++) {
            try { if (toRemove[r]) toRemove[r].remove(); } catch (eRem) {}
        }
        refreshLayerMap();

        // 1. Controller Null
        ctrl = comp.layers.addNull();
        ctrl.name = "MASAR_CTRL";
        layerByName["MASAR_CTRL"] = ctrl;
        try { getProp(ctrl, "ADBE Anchor Point", "Anchor Point").setValue([0, 0, 0]); } catch (eAP0) {}
        try { getProp(ctrl, "ADBE Position", "Position").setValue([compCenter[0], compCenter[1], 0]); } catch (eP0) {}
        ctrl.label = 13;
        syncCtrlMasterEffects(ctrl, cfg, false);

        // 2. Baseline Shape Layer
        baseLayer = comp.layers.addShape();
        baseLayer.name = "MS_Baseline";
        layerByName["MS_Baseline"] = baseLayer;
        baseLayer.parent = ctrl;
        try { getProp(baseLayer, "ADBE Anchor Point", "Anchor Point").setValue([0, 0, 0]); } catch (eAP1) {}
        try { getProp(baseLayer, "ADBE Position", "Position").setValue([0, 0, 0]); } catch (eP1) {}

        var baseContents = getShapeLayerContents(baseLayer);
        var baseGroup = baseContents ? baseContents.addProperty("ADBE Vector Group") : null;
        if (baseGroup) {
            baseGroup.name = "Line";
            var lineShape = new Shape();
            if (orientation === "horizontal") {
                lineShape.vertices = [[-halfLen, 0], [halfLen, 0]];
            } else {
                lineShape.vertices = [[0, -halfLen], [0, halfLen]];
            }
            lineShape.closed = false;
            addShapePath(baseGroup, lineShape, "LinePath");
            addShapeStroke(baseGroup, lineColor, lineWidth, lineCap, lineStyle, dashSize, dashGap, lineOpacity, { bindCtrl: true });

            if (startTerminal && startTerminal !== "none") {
                addShapeTerminal(baseGroup, startTerminal, startPt, -1, orientation, terminalColor, terminalSize, "StartTerminal");
            }
            if (endTerminal && endTerminal !== "none") {
                addShapeTerminal(baseGroup, endTerminal, endPt, 1, orientation, terminalColor, terminalSize, "EndTerminal");
            }
        }

        // 3. Nodes Shape Layer
        nodesLayer = comp.layers.addShape();
        nodesLayer.name = "MS_Nodes";
        layerByName["MS_Nodes"] = nodesLayer;
        nodesLayer.parent = ctrl;
        try { getProp(nodesLayer, "ADBE Anchor Point", "Anchor Point").setValue([0, 0, 0]); } catch (eAP2) {}
        try { getProp(nodesLayer, "ADBE Position", "Position").setValue([0, 0, 0]); } catch (eP2) {}

    } else {
        // IN-PLACE SMART UPDATE
        syncCtrlMasterEffects(ctrl, cfg, false);
        if (!baseLayer) {
            baseLayer = comp.layers.addShape();
            baseLayer.name = "MS_Baseline";
            layerByName["MS_Baseline"] = baseLayer;
        }
        baseLayer.parent = ctrl;
        try { getProp(baseLayer, "ADBE Anchor Point", "Anchor Point").setValue([0, 0, 0]); } catch (eAP1b) {}
        try { getProp(baseLayer, "ADBE Position", "Position").setValue([0, 0, 0]); } catch (eP1b) {}

        if (!nodesLayer) {
            nodesLayer = comp.layers.addShape();
            nodesLayer.name = "MS_Nodes";
            layerByName["MS_Nodes"] = nodesLayer;
        }
        nodesLayer.parent = ctrl;
        try { getProp(nodesLayer, "ADBE Anchor Point", "Anchor Point").setValue([0, 0, 0]); } catch (eAP2b) {}
        try { getProp(nodesLayer, "ADBE Position", "Position").setValue([0, 0, 0]); } catch (eP2b) {}

        if (dirtyScope !== "text" && dirtyScope !== "boxes") {
            var baseContents = getShapeLayerContents(baseLayer);
            var baseGroup = baseContents ? baseContents.property("Line") : null;
            if (!baseGroup && baseContents) {
                baseGroup = baseContents.addProperty("ADBE Vector Group");
                if (baseGroup) baseGroup.name = "Line";
            }
            var bgContents = getVectorGroupContents(baseGroup);
            if (bgContents) {
                var linePathGroup = bgContents.property("LinePath");
                var lineShape = new Shape();
                if (orientation === "horizontal") {
                    lineShape.vertices = [[-halfLen, 0], [halfLen, 0]];
                } else {
                    lineShape.vertices = [[0, -halfLen], [0, halfLen]];
                }
                lineShape.closed = false;
                if (linePathGroup) {
                    try { getProp(linePathGroup, "ADBE Vector Shape").setValue(lineShape); } catch (eLP) {}
                } else {
                    addShapePath(baseGroup, lineShape, "LinePath");
                }

                // Clean old strokes, leaked fills, and terminals from baseGroup
                for (var bs = bgContents.numProperties; bs >= 1; bs--) {
                    var p = bgContents.property(bs);
                    if (p) {
                        var mName = "";
                        var pName = "";
                        try { mName = String(p.matchName); } catch (eMN) {}
                        try { pName = String(p.name); } catch (ePN) {}
                        if (mName === "ADBE Vector Graphic - Stroke" ||
                            mName === "ADBE Vector Graphic - Fill" ||
                            pName === "StartTerminal" || pName === "EndTerminal" ||
                            pName === "ArrowTerminal" || pName === "DotTerminal" || pName === "BarTerminal") {
                            try { p.remove(); } catch (eRmP) {}
                        }
                    }
                }
                addShapeStroke(baseGroup, lineColor, lineWidth, lineCap, lineStyle, dashSize, dashGap, lineOpacity, { bindCtrl: true });

                if (startTerminal && startTerminal !== "none") {
                    addShapeTerminal(baseGroup, startTerminal, startPt, -1, orientation, terminalColor, terminalSize, "StartTerminal");
                }
                if (endTerminal && endTerminal !== "none") {
                    addShapeTerminal(baseGroup, endTerminal, endPt, 1, orientation, terminalColor, terminalSize, "EndTerminal");
                }
            }
        }
    }

    // =============================================================
    // NODES & TEXTS (Applied in-place directly to existing elements)
    // =============================================================
    var nodesContents = getShapeLayerContents(nodesLayer);

    for (var i = 0; i < count; i++) {
        var posAlong = (count === 1) ? 0 : (-halfLen + margin + (i * step));
        var nodeData = nodes[i] || {};

        var effShape = (nodeData.customShape && nodeData.customShape !== "inherit" && nodeData.customShape !== "default")
            ? String(nodeData.customShape)
            : nodeShape;

        var hasVectorHollow = (nodeData.vectorData && nodeData.vectorData.isHollow === true);
        var isHollow = (nodeData.customShape && nodeData.customShape !== "inherit")
            ? (nodeData.isHollow === true || effShape === "ring" || hasVectorHollow)
            : (nodeShape === "ring" || hasVectorHollow);

        var effFill = isHollow ? null : ((nodeData.customColor && String(nodeData.customColor).length > 0)
            ? parseColor(nodeData.customColor, circleFill)
            : circleFill);

        var effStroke = (nodeData.customStroke && String(nodeData.customStroke).length > 0)
            ? parseColor(nodeData.customStroke, circleStroke)
            : ((isHollow && nodeData.customColor && String(nodeData.customColor).length > 0)
                ? parseColor(nodeData.customColor, circleStroke)
                : circleStroke);

        var effStrokeWidth = (nodeData.customStrokeWidth !== undefined && nodeData.customStrokeWidth !== null && parseFloat(nodeData.customStrokeWidth) >= 0)
            ? parseFloat(nodeData.customStrokeWidth)
            : (isHollow ? (circleStrokeWidth < 2 ? 3 : circleStrokeWidth) : circleStrokeWidth);
        if (isHollow && effStrokeWidth < 1) {
            effStrokeWidth = 3;
        }

        var effSize = (nodeData.customSize && parseFloat(nodeData.customSize) > 0)
            ? parseFloat(nodeData.customSize)
            : circleRadius;

        var centerSrc = (nodeData.sources && nodeData.sources.center) ? nodeData.sources.center : null;
        var cType = centerSrc ? centerSrc.type : "shape_number";
        var cVisible = !(centerSrc && centerSrc.visible === false) && (cType !== "none");
        var cDrawShape = cVisible && (cType === "shape_number" || cType === "shape" || cType === "shape_icon");
        var cCenter = (orientation === "horizontal") ? [posAlong, 0] : [0, posAlong];

        if (nodesContents && (!canUpdateInPlace || (dirtyScope !== "text" && dirtyScope !== "boxes"))) {
            var nGrp = nodesContents.property("Node_" + (i + 1));
            if (!nGrp) {
                nGrp = nodesContents.addProperty("ADBE Vector Group");
                if (nGrp) nGrp.name = "Node_" + (i + 1);
            }
            var nc = getVectorGroupContents(nGrp);
            if (nc) {
                for (var np = nc.numProperties; np >= 1; np--) {
                    try { nc.property(np).remove(); } catch (eRmnc) {}
                }
            }

            // Optional guide tick connecting shape to baseline (isolated in sub-group)
            if (cDrawShape && nodeData.hasGuideTick === true && effShape !== "tick") {
                addShapeTick(nGrp, posAlong, orientation, effSize + 8, tickColor, 2, "GuideTick");
            }

            if (cDrawShape) {
                if (nodeData.vectorData && nodeData.vectorData.subPaths && nodeData.vectorData.subPaths.length > 0 && effShape !== "tick") {
                    addShapeCustomVector(nGrp, cCenter, nodeData.vectorData.subPaths, effFill, effStroke, effStrokeWidth, effShape);
                } else if (effShape === "tick") {
                    var tH = (nodeData.customHeight && parseFloat(nodeData.customHeight) > 0) ? (parseFloat(nodeData.customHeight) / 2) : tickHalf;
                    var tW = (nodeData.customWidth !== undefined && nodeData.customWidth !== null && parseFloat(nodeData.customWidth) >= 0) ? parseFloat(nodeData.customWidth) : tickWidth;
                    var tCol = (nodeData.customColor && String(nodeData.customColor).length > 0) ? parseColor(nodeData.customColor, tickColor) : tickColor;
                    var tPerpShift = 0;
                    if (nodeData.customAnchor) {
                        var ca = String(nodeData.customAnchor);
                        if (orientation === "horizontal") {
                            if (ca.indexOf("top") === 0) tPerpShift = tH;
                            else if (ca.indexOf("bottom") === 0) tPerpShift = -tH;
                        } else {
                            if (ca.indexOf("left") !== -1) tPerpShift = tH;
                            else if (ca.indexOf("right") !== -1) tPerpShift = -tH;
                        }
                    }
                    addShapeTick(nGrp, posAlong, orientation, tH, tCol, tW, "Tick", tPerpShift);
                } else if (effShape === "ring") {
                    addShapeEllipse(nGrp, effSize, cCenter, null, effStroke, effStrokeWidth > 0 ? effStrokeWidth : 3, "Ring");
                } else if (effShape === "square") {
                    addShapeRect(nGrp, effSize * 2, effSize * 2, cCenter, 0, effFill, effStroke, effStrokeWidth, "Square");
                } else if (effShape === "diamond") {
                    addShapeDiamond(nGrp, effSize * 1.25, cCenter, effFill, effStroke, effStrokeWidth, "Diamond");
                } else if (effShape === "triangle" || effShape === "triangle_down" || effShape === "triangle_up") {
                    addShapeTriangle(nGrp, effSize * 1.2, cCenter, effFill, effStroke, effStrokeWidth, "Triangle");
                } else if (effShape === "hexagon") {
                    addShapeHexagon(nGrp, effSize * 1.15, cCenter, effFill, effStroke, effStrokeWidth, "Hexagon");
                } else if (effShape === "star") {
                    addShapeStar(nGrp, effSize * 1.25, cCenter, effFill, effStroke, effStrokeWidth, "Star");
                } else {
                    addShapeEllipse(nGrp, effSize, cCenter, effFill, effStroke, effStrokeWidth, "Circle");
                }
            }
        }

        // Asymmetric directional clearance from actual rendered shape
        var nodeClearTop = cDrawShape ? effSize : 0;
        var nodeClearBottom = cDrawShape ? effSize : 0;
        var centerNumOffset = [0, 0];

        if (!cDrawShape) {
            nodeClearTop = cVisible ? Math.round(numberFontSize * 0.6) : 0;
            nodeClearBottom = nodeClearTop;
        } else if (effShape === "tick") {
            var effTickHalf = (nodeData.customHeight && parseFloat(nodeData.customHeight) > 0) ? (parseFloat(nodeData.customHeight) / 2) : tickHalf;
            nodeClearTop = effTickHalf;
            nodeClearBottom = effTickHalf;
        } else if (nodeData.vectorData && nodeData.vectorData.bounds) {
            var vb = nodeData.vectorData.bounds;
            if (orientation === "horizontal") {
                nodeClearTop = Math.max(0, -vb.minY);
                nodeClearBottom = Math.max(0, vb.maxY);
            } else {
                nodeClearTop = Math.max(0, -vb.minX);
                nodeClearBottom = Math.max(0, vb.maxX);
            }
            if (nodeData.hasGuideTick === true) {
                nodeClearTop = Math.max(nodeClearTop, effSize + 8);
                nodeClearBottom = Math.max(nodeClearBottom, effSize + 8);
            }
        } else if (nodeData.vectorData && nodeData.vectorData.extent) {
            var ext = parseFloat(nodeData.vectorData.extent);
            nodeClearTop = ext;
            nodeClearBottom = ext;
        }
        if (cDrawShape && nodeData.vectorData && nodeData.vectorData.centerOffset) {
            centerNumOffset = nodeData.vectorData.centerOffset;
        }

        // 1. CENTER SOURCE: Core Node Number or Text (Positioned centered on the visual shape)
        var centerVal = "";
        if (cVisible) {
            if (cType === "shape_number" || cType === "number" || cType === "text") {
                centerVal = centerSrc ? String(centerSrc.value || "") : String(nodeData.number || "");
            } else if (cType === "icon" || cType === "shape_icon") {
                centerVal = centerSrc ? String(centerSrc.icon || centerSrc.value || "") : "";
            }
        }

        var nLayer = findNodeLayer(comp, i + 1, "Num");

        if (cVisible && centerVal.length > 0 && cType !== "none" && cType !== "shape") {
            if (!nLayer) {
                nLayer = comp.layers.addText(centerVal);
                nLayer.name = "MS_Node_" + (i + 1) + "_Num";
                layerByName[nLayer.name] = nLayer;
                nLayer.parent = ctrl;
            }
            var nProp = getTextDocumentProp(nLayer);
            var nDoc = null;
            try { nDoc = nProp.value; } catch (eNDoc) { nDoc = null; }
            var effCenterText = toStandardDigits(centerVal);
            if (nDoc) {
                try { nDoc.text = effCenterText; } catch (eNT) {}
                try {
                    if (typeof DigitSet !== "undefined" && DigitSet && DigitSet.ARABIC_DIGITS) {
                        nDoc.digitSet = DigitSet.ARABIC_DIGITS;
                    }
                } catch (eDS) {}
                var effNumSize = (cfg.numberFontSize && parseFloat(cfg.numberFontSize) > 0)
                    ? parseFloat(cfg.numberFontSize)
                    : numberFontSize;
                if (centerSrc && centerSrc.fontSize && parseFloat(centerSrc.fontSize) > 0) {
                    effNumSize = parseFloat(centerSrc.fontSize);
                } else if (nodeData && nodeData.customNumberFontSize && parseFloat(nodeData.customNumberFontSize) > 0) {
                    effNumSize = parseFloat(nodeData.customNumberFontSize);
                }
                try { nDoc.fontSize = (effNumSize > 0) ? effNumSize : ((cType === "text") ? Math.max(9, Math.round(effSize * 0.7)) : Math.max(10, Math.round(effSize * 0.95))); } catch (eNS) {}

                var effCenterCol = numberColor;
                if (centerSrc && (centerSrc.textColor || centerSrc.numColor)) {
                    effCenterCol = parseColor(centerSrc.textColor || centerSrc.numColor, numberColor);
                } else if (nodeData && (nodeData.customTextColor || nodeData.numberColor)) {
                    effCenterCol = parseColor(nodeData.customTextColor || nodeData.numberColor, numberColor);
                } else if (!cfg.numberColor && (!centerSrc || !centerSrc.color)) {
                    effCenterCol = [0.05, 0.05, 0.05];
                    if (isHollow || (effFill && (effFill[0] * 0.299 + effFill[1] * 0.587 + effFill[2] * 0.114) < 0.5)) {
                        effCenterCol = [0.98, 0.98, 0.98];
                    }
                }
                try { nDoc.fillColor = effCenterCol; } catch (eNC) {}
                try { nDoc.applyFill = true; } catch (eNAF) {}
                try { nDoc.applyStroke = false; } catch (eNAS) {}
                try { nDoc.justification = ParagraphJustification.CENTER_JUSTIFY; } catch (eNJ) {}
                try {
                    nProp.setValue(nDoc);
                } catch (eSetNDoc) {
                    try { nProp.setValue(effCenterText); } catch (eSetNRaw) {}
                }
            } else if (nProp) {
                try { nProp.setValue(effCenterText); } catch (eSetNRaw2) {}
            }

            var nRect = nLayer.sourceRectAtTime(0, false);
            var nAp = [nRect.left + (nRect.width / 2), nRect.top + (nRect.height / 2), 0];
            var nPos = (orientation === "horizontal")
                ? [posAlong + centerNumOffset[0], centerNumOffset[1], 0]
                : [centerNumOffset[0], posAlong + centerNumOffset[1], 0];

            var nApP = getProp(nLayer, "ADBE Anchor Point", "Anchor Point");
            var nPosP = getProp(nLayer, "ADBE Position", "Position");
            try {
                if (nApP) {
                    nApP.setValue(nAp);
                    nApP.expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2, 0];';
                }
            } catch (eNAp) {}

            try {
                if (nPosP) {
                    nPosP.setValue(nPos);
                    nPosP.expression = "";
                }
            } catch (eNPos) {}
            nLayer.enabled = true;
        } else if (nLayer) {
            nLayer.enabled = false;
        }

        // 2. FRONT SOURCE: Top / Front Stream (Badge, Title, Desc/List, Icon)
        var frontSrc = (nodeData.sources && nodeData.sources.front) ? nodeData.sources.front : null;
        var fType = frontSrc ? frontSrc.type : (nodeData.description ? "title_text" : "title");
        var fVis = frontSrc ? (frontSrc.visible !== false && fType !== "none") : (nodeData.title ? true : false);

        var badgeText = "";
        var titleText = "";
        var descText = "";

        if (fVis) {
            var rawIcon = (frontSrc && frontSrc.icon) ? trimStr(frontSrc.icon) : "";
            var candNum = frontSrc ? trimStr(frontSrc.number) : "";
            var candBdg = frontSrc ? trimStr(frontSrc.badge) : "";
            var candVal = frontSrc ? trimStr(frontSrc.value) : "";
            var candBTxt = (frontSrc && fType === "badge") ? trimStr(frontSrc.text) : "";
            var rawBadge = candNum.length > 0 ? candNum : (candBdg.length > 0 ? candBdg : (candVal.length > 0 ? candVal : candBTxt));
            var rawTitle = (frontSrc && frontSrc.title)
                ? trimStr(frontSrc.title)
                : ((nodeData && nodeData.title && (!frontSrc || frontSrc.showTitle !== false)) ? trimStr(nodeData.title) : "");

            var fShowBadge = (frontSrc && frontSrc.showBadge === true) || fType === "badge" || fType === "number_title" || fType === "number_text";
            var fShowTitle = (frontSrc && frontSrc.showTitle === true) || ((!frontSrc || frontSrc.showTitle !== false) && fType !== "text" && fType !== "list" && fType !== "badge" && fType !== "number_text");
            var fShowIcon = (frontSrc && frontSrc.showIcon === true) || fType === "icon_title";

            var hasBadgeVal = (rawBadge.length > 0 && fShowBadge);
            var hasTitlePart = (rawTitle.length > 0 && fShowTitle);

            if (hasBadgeVal) {
                badgeText = rawBadge;
            }

            if (hasTitlePart) {
                var titleParts = [];
                if (rawIcon && fShowIcon) {
                    titleParts.push(rawIcon);
                }
                titleParts.push(rawTitle);
                titleText = titleParts.join(" ");
            } else if (rawIcon && fShowIcon) {
                titleText = rawIcon;
            }

            var showListNow = (frontSrc && (frontSrc.showList === true || fType === "title_list" || fType === "list"));
            var showDescNow = (frontSrc && (frontSrc.showDesc === true || fType === "title_text" || fType === "text" || fType === "number_text"));

            if (showListNow) {
                if (frontSrc && frontSrc.items && frontSrc.items.length > 0) {
                    var listArr = [];
                    for (var itIdx = 0; itIdx < frontSrc.items.length; itIdx++) {
                        var itVal = String(frontSrc.items[itIdx] || "");
                        listArr.push(itVal.indexOf("\u2022") === 0 ? itVal : "\u2022 " + itVal);
                    }
                    descText = listArr.join("\r");
                } else if (frontSrc && frontSrc.text) {
                    descText = frontSrc.text.indexOf("\u2022") === 0
                        ? frontSrc.text.replace(/\n/g, "\r")
                        : "\u2022 " + frontSrc.text.replace(/\n/g, "\r\u2022 ");
                } else if (nodeData.description) {
                    descText = "\u2022 " + String(nodeData.description).replace(/\n/g, "\r\u2022 ");
                }
            } else if (showDescNow) {
                var rawDesc = (frontSrc && frontSrc.text !== undefined)
                    ? trimStr(frontSrc.text)
                    : ((nodeData && nodeData.description && (!frontSrc || frontSrc.showDesc !== false)) ? trimStr(nodeData.description) : "");
                if (rawDesc.length > 0 && rawDesc !== titleText && rawDesc !== badgeText) {
                    descText = rawDesc;
                }
            }
        }

        var hasBadge = (fVis && badgeText.length > 0);
        var hasTitle = (fVis && titleText.length > 0);
        var hasDesc = (fVis && descText.length > 0);

        var nodeSide = (nodeData.contentSide && nodeData.contentSide !== "inherit") ? nodeData.contentSide : globalContentSide;
        var effSide = nodeSide;

        if (orientation === "horizontal") {
            if (effSide === "left") effSide = "top";
            else if (effSide === "right") effSide = "bottom";
        } else {
            if (effSide === "top") effSide = "left";
            else if (effSide === "bottom") effSide = "right";
        }

        if (nodeSide === "alternate") {
            if (orientation === "vertical") {
                effSide = (i % 2 === 0) ? "left" : "right";
            } else {
                effSide = (i % 2 === 0) ? "top" : "bottom";
            }
        }

        var frontJustify = ParagraphJustification.CENTER_JUSTIFY;
        var behindJustify = ParagraphJustification.CENTER_JUSTIFY;

        if (globalTextAlign === "left") {
            frontJustify = ParagraphJustification.LEFT_JUSTIFY;
            behindJustify = ParagraphJustification.LEFT_JUSTIFY;
        } else if (globalTextAlign === "right") {
            frontJustify = ParagraphJustification.RIGHT_JUSTIFY;
            behindJustify = ParagraphJustification.RIGHT_JUSTIFY;
        } else if (globalTextAlign === "center") {
            frontJustify = ParagraphJustification.CENTER_JUSTIFY;
            behindJustify = ParagraphJustification.CENTER_JUSTIFY;
        } else {
            // "auto" mode:
            if (orientation === "horizontal") {
                frontJustify = ParagraphJustification.CENTER_JUSTIFY;
                behindJustify = ParagraphJustification.CENTER_JUSTIFY;
            } else {
                if (effSide === "left") {
                    frontJustify = ParagraphJustification.RIGHT_JUSTIFY;
                    behindJustify = ParagraphJustification.LEFT_JUSTIFY;
                } else {
                    frontJustify = ParagraphJustification.LEFT_JUSTIFY;
                    behindJustify = ParagraphJustification.RIGHT_JUSTIFY;
                }
            }
        }

        // Front Badge Layer (Independent styling, box & position)
        var bdgLayer = findNodeLayer(comp, i + 1, "Badge");

        if (hasBadge) {
            if (!bdgLayer) {
                bdgLayer = comp.layers.addText(badgeText);
                bdgLayer.name = "MS_Node_" + (i + 1) + "_Badge";
                bdgLayer.parent = ctrl;
            }
            var bdgProp = getTextDocumentProp(bdgLayer);
            var bdgDoc = null;
            try { bdgDoc = bdgProp.value; } catch (eBDoc) { bdgDoc = null; }
            var effBdgStr = toStandardDigits(badgeText);
            var effBdgSize = (frontSrc && typeof frontSrc.badgeFontSize === "number" && frontSrc.badgeFontSize > 0)
                ? frontSrc.badgeFontSize
                : ((frontSrc && typeof frontSrc.fontSize === "number" && frontSrc.fontSize > 0) ? frontSrc.fontSize : Math.max(9, Math.round(titleFontSize * 0.65)));
            var effBdgColor = (frontSrc && frontSrc.badgeColor)
                ? parseColor(frontSrc.badgeColor, [1.0, 1.0, 1.0])
                : ((frontSrc && frontSrc.color) ? parseColor(frontSrc.color, [1.0, 1.0, 1.0]) : [1.0, 1.0, 1.0]);

            if (bdgDoc) {
                try { bdgDoc.text = effBdgStr; } catch (eBT) {}
                try {
                    if (typeof DigitSet !== "undefined" && DigitSet && DigitSet.ARABIC_DIGITS) {
                        bdgDoc.digitSet = DigitSet.ARABIC_DIGITS;
                    }
                } catch (eDS) {}
                try { bdgDoc.fontSize = effBdgSize; } catch (eBS) {}
                try { bdgDoc.fillColor = effBdgColor; } catch (eBC) {}
                try { bdgDoc.applyFill = true; } catch (eBAF) {}
                try { bdgDoc.applyStroke = false; } catch (eBAS) {}
                try { bdgDoc.justification = frontJustify; } catch (eBJ) {}
                try {
                    bdgProp.setValue(bdgDoc);
                } catch (eSetBDoc) {
                    try { bdgProp.setValue(effBdgStr); } catch (eSetBRaw) {}
                }
            } else if (bdgProp) {
                try { bdgProp.setValue(effBdgStr); } catch (eSetBRaw2) {}
            }
            bdgLayer.enabled = true;
        } else if (bdgLayer) {
            bdgLayer.enabled = false;
        }

        // Front Title Layer
        var tLayer = findNodeLayer(comp, i + 1, "Title");

        if (hasTitle) {
            if (!tLayer) {
                tLayer = comp.layers.addText(titleText);
                tLayer.name = "MS_Node_" + (i + 1) + "_Title";
                tLayer.parent = ctrl;
            }
            var tProp = getTextDocumentProp(tLayer);
            var tDoc = null;
            try { tDoc = tProp.value; } catch (eTDoc) { tDoc = null; }
            var effTitleStr = toStandardDigits(titleText);
            var effTitleSize = (frontSrc && typeof frontSrc.titleFontSize === "number" && frontSrc.titleFontSize > 0)
                ? frontSrc.titleFontSize
                : ((nodeData && typeof nodeData.titleFontSize === "number" && nodeData.titleFontSize > 0) ? nodeData.titleFontSize : titleFontSize);
            var effTitleColor = (frontSrc && frontSrc.titleColor)
                ? parseColor(frontSrc.titleColor, titleColor)
                : ((nodeData && nodeData.titleColor) ? parseColor(nodeData.titleColor, titleColor) : titleColor);

            if (tDoc) {
                try { tDoc.text = effTitleStr; } catch (eTT) {}
                try {
                    if (typeof DigitSet !== "undefined" && DigitSet && DigitSet.ARABIC_DIGITS) {
                        tDoc.digitSet = DigitSet.ARABIC_DIGITS;
                    }
                } catch (eDS) {}
                try { tDoc.fontSize = effTitleSize; } catch (eTS) {}
                try { tDoc.fillColor = effTitleColor; } catch (eTC) {}
                try { tDoc.applyFill = true; } catch (eTAF) {}
                try { tDoc.applyStroke = false; } catch (eTAS) {}
                try { tDoc.justification = frontJustify; } catch (eTJ) {}
                try {
                    tProp.setValue(tDoc);
                } catch (eSetTDoc) {
                    try { tProp.setValue(effTitleStr); } catch (eSetTRaw) {}
                }
            } else if (tProp) {
                try { tProp.setValue(effTitleStr); } catch (eSetTRaw2) {}
            }
            tLayer.enabled = true;
        } else if (tLayer) {
            tLayer.enabled = false;
        }

        // Front Description / List Layer
        var dLayer = findNodeLayer(comp, i + 1, "Desc");

        if (hasDesc) {
            if (!dLayer) {
                dLayer = comp.layers.addText(descText);
                dLayer.name = "MS_Node_" + (i + 1) + "_Desc";
                dLayer.parent = ctrl;
            }
            var dProp = getTextDocumentProp(dLayer);
            var dDoc = null;
            try { dDoc = dProp.value; } catch (eDDoc) { dDoc = null; }
            var effDescStr = toStandardDigits(descText);
            var effDescSize = (frontSrc && typeof frontSrc.descFontSize === "number" && frontSrc.descFontSize > 0)
                ? frontSrc.descFontSize
                : ((nodeData && typeof nodeData.descFontSize === "number" && nodeData.descFontSize > 0) ? nodeData.descFontSize : descFontSize);
            var effDescColor = (frontSrc && frontSrc.descColor)
                ? parseColor(frontSrc.descColor, descColor)
                : ((nodeData && nodeData.descColor) ? parseColor(nodeData.descColor, descColor) : descColor);

            if (dDoc) {
                try { dDoc.text = effDescStr; } catch (eDT) {}
                try {
                    if (typeof DigitSet !== "undefined" && DigitSet && DigitSet.ARABIC_DIGITS) {
                        dDoc.digitSet = DigitSet.ARABIC_DIGITS;
                    }
                } catch (eDS) {}
                try { dDoc.fontSize = effDescSize; } catch (eDSz) {}
                try { dDoc.fillColor = effDescColor; } catch (eDC) {}
                try { dDoc.applyFill = true; } catch (eDAF) {}
                try { dDoc.applyStroke = false; } catch (eDAS) {}
                try { dDoc.justification = frontJustify; } catch (eDJ) {}
                try {
                    dProp.setValue(dDoc);
                } catch (eSetDDoc) {
                    try { dProp.setValue(effDescStr); } catch (eSetDRaw) {}
                }
            } else if (dProp) {
                try { dProp.setValue(effDescStr); } catch (eSetDRaw2) {}
            }
            dLayer.enabled = true;
        } else if (dLayer) {
            dLayer.enabled = false;
        }

        // Front Source Box Settings (Badge, Title & Desc)
        var fBoxBadge = resolveBoxSettings(frontSrc, nodeData, "badge", boxCtx);
        var fBoxTitle = resolveBoxSettings(frontSrc, nodeData, "title", boxCtx);
        var fBoxDesc = resolveBoxSettings(frontSrc, nodeData, "desc", boxCtx);
        var nodePadVTitle = fBoxTitle.enabled ? fBoxTitle.paddingV : 0;
        var nodePadVDesc = fBoxDesc.enabled ? fBoxDesc.paddingV : 0;
        var nodePadVBadge = fBoxBadge.enabled ? fBoxBadge.paddingV : 0;
        var maxNodePadV = Math.max(nodePadVTitle, nodePadVDesc, nodePadVBadge);
        var vertGap = (fBoxTitle.enabled || fBoxDesc.enabled) ? Math.max(14, maxNodePadV + 8) : 6;
        var hBoxGap = (fBoxTitle.enabled || fBoxDesc.enabled) ? Math.max(14, maxNodePadV * 2 + 6) : 8;

        var isBotOrRight = (effSide === "bottom" || effSide === "right");
        var offsetSliderName = isBotOrRight ? "MS Global Bottom Offset" : "MS Global Top Offset";
        var fixedSideClear = (isBotOrRight ? nodeClearBottom : nodeClearTop) + 4;
        var sideBaseClear = fixedSideClear + (isBotOrRight ? bottomOffset : topOffset);

        // Anchoring & Positioning for Front Stream (Badge, Title, Desc)
        var bdgH = 0;
        var bdgRect = null;
        if (hasBadge && bdgLayer) {
            bdgRect = bdgLayer.sourceRectAtTime(0, false);
            bdgH = bdgRect.height + (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 6) : 4);
        }
        var tH = 0;
        var tRect = null;
        if (hasTitle && tLayer) {
            tRect = tLayer.sourceRectAtTime(0, false);
            tH = tRect.height + hBoxGap;
        }

        function setLayerAnchor(lyr, val, expr) {
            var apP = getProp(lyr, "ADBE Anchor Point", "Anchor Point");
            if (apP) {
                try { apP.setValue(val); } catch (eA1) {}
                try { apP.expression = expr; } catch (eA2) {}
            }
        }
        function setLayerPos(lyr, val, expr) {
            var pP = getProp(lyr, "ADBE Position", "Position");
            if (pP) {
                try { pP.setValue(val); } catch (eP1) {}
                try { pP.expression = (expr !== undefined) ? expr : ""; } catch (eP2) {}
            }
        }

        if (orientation === "horizontal") {
            if (effSide === "bottom") {
                var firstPadBot = (hasBadge && fBoxBadge.enabled) ? fBoxBadge.paddingV : ((hasTitle && fBoxTitle.enabled) ? fBoxTitle.paddingV : (fBoxDesc.enabled ? fBoxDesc.paddingV : 0));
                var curY = +(sideBaseClear + firstPadBot);
                var firstFrontBotExpr = buildCtrlOffsetExpr("y", "+", fixedSideClear + firstPadBot, offsetSliderName);
                var botAnchorAssigned = false;
                if (hasBadge && bdgLayer) {
                    setLayerAnchor(bdgLayer, [bdgRect.left + (bdgRect.width / 2), bdgRect.top, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];');
                    setLayerPos(bdgLayer, [posAlong, curY, 0], firstFrontBotExpr);
                    botAnchorAssigned = true;
                    curY += bdgH;
                }
                if (hasTitle && tLayer) {
                    setLayerAnchor(tLayer, [tRect.left + (tRect.width / 2), tRect.top, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];');
                    var tPosExprB = (hasBadge && bdgLayer)
                        ? 'var b = thisComp.layer("' + bdgLayer.name + '"); var br = b.sourceRectAtTime(time, false); [b.transform.position[0], b.transform.position[1] + br.height + ' + (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 6) : 4) + ', 0];'
                        : (botAnchorAssigned ? "" : firstFrontBotExpr);
                    setLayerPos(tLayer, [posAlong, curY, 0], tPosExprB);
                    botAnchorAssigned = true;
                    curY += tH;
                }
                if (hasDesc && dLayer) {
                    var dRect = dLayer.sourceRectAtTime(0, false);
                    setLayerAnchor(dLayer, [dRect.left + (dRect.width / 2), dRect.top, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];');
                    var dPosExprB = botAnchorAssigned ? "" : firstFrontBotExpr;
                    if (hasTitle && tLayer) {
                        dPosExprB = 'var t = thisComp.layer("' + tLayer.name + '"); var tr = t.sourceRectAtTime(time, false); [t.transform.position[0], t.transform.position[1] + tr.height + ' + hBoxGap + ', 0];';
                    } else if (hasBadge && bdgLayer) {
                        dPosExprB = 'var b = thisComp.layer("' + bdgLayer.name + '"); var br = b.sourceRectAtTime(time, false); [b.transform.position[0], b.transform.position[1] + br.height + ' + (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 6) : 4) + ', 0];';
                    }
                    setLayerPos(dLayer, [posAlong, curY, 0], dPosExprB);
                }
            } else {
                // effSide === "top": Front sits above timeline (Y < 0 at -(sideBaseClear + nearestPaddingV))
                var firstPadTop = (hasDesc && fBoxDesc.enabled) ? fBoxDesc.paddingV : ((hasTitle && fBoxTitle.enabled) ? fBoxTitle.paddingV : (fBoxBadge.enabled ? fBoxBadge.paddingV : 0));
                var curYTop = -(sideBaseClear + firstPadTop);
                var firstFrontTopExpr = buildCtrlOffsetExpr("y", "-", fixedSideClear + firstPadTop, offsetSliderName);
                var topAnchorAssigned = false;
                if (hasDesc && dLayer) {
                    var dRect = dLayer.sourceRectAtTime(0, false);
                    setLayerAnchor(dLayer, [dRect.left + (dRect.width / 2), dRect.top + dRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];');
                    setLayerPos(dLayer, [posAlong, curYTop, 0], firstFrontTopExpr);
                    topAnchorAssigned = true;
                    curYTop -= (dRect.height + hBoxGap);
                }
                if (hasTitle && tLayer) {
                    setLayerAnchor(tLayer, [tRect.left + (tRect.width / 2), tRect.top + tRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];');
                    var tPosExprT = (hasDesc && dLayer)
                        ? 'var d = thisComp.layer("' + dLayer.name + '"); var dr = d.sourceRectAtTime(time, false); [d.transform.position[0], d.transform.position[1] - dr.height - ' + hBoxGap + ', 0];'
                        : (topAnchorAssigned ? "" : firstFrontTopExpr);
                    setLayerPos(tLayer, [posAlong, curYTop, 0], tPosExprT);
                    topAnchorAssigned = true;
                    curYTop -= (tRect.height + (fBoxTitle.enabled ? (fBoxTitle.paddingV * 2 + 4) : 4));
                }
                if (hasBadge && bdgLayer) {
                    setLayerAnchor(bdgLayer, [bdgRect.left + (bdgRect.width / 2), bdgRect.top + bdgRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];');
                    var bPosExprT = topAnchorAssigned ? "" : firstFrontTopExpr;
                    if (hasTitle && tLayer) {
                        bPosExprT = 'var t = thisComp.layer("' + tLayer.name + '"); var tr = t.sourceRectAtTime(time, false); [t.transform.position[0], t.transform.position[1] - tr.height - ' + (fBoxTitle.enabled ? (fBoxTitle.paddingV * 2 + 4) : 4) + ', 0];';
                    } else if (hasDesc && dLayer) {
                        bPosExprT = 'var d = thisComp.layer("' + dLayer.name + '"); var dr = d.sourceRectAtTime(time, false); [d.transform.position[0], d.transform.position[1] - dr.height - ' + hBoxGap + ', 0];';
                    }
                    setLayerPos(bdgLayer, [posAlong, curYTop, 0], bPosExprT);
                }
            }
        } else {
            // Vertical mode
            var vertRightExpr = buildCtrlOffsetExpr("x", "+", fixedSideClear, offsetSliderName);
            var vertLeftExpr = buildCtrlOffsetExpr("x", "-", fixedSideClear, offsetSliderName);
            if (effSide === "right") {
                if (hasTitle && tLayer) {
                    setLayerAnchor(tLayer, [tRect.left, tRect.top + tRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height, 0];');
                    setLayerPos(tLayer, [+sideBaseClear, posAlong - vertGap, 0], vertRightExpr);
                }
                if (hasBadge && bdgLayer) {
                    setLayerAnchor(bdgLayer, [bdgRect.left, bdgRect.top + bdgRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height, 0];');
                    var bPosY = (hasTitle && tRect) ? (posAlong - vertGap - tRect.height - (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 4) : 4)) : (posAlong - vertGap);
                    var bPosExprVR = (hasTitle && tLayer)
                        ? 'var t = thisComp.layer("' + tLayer.name + '"); var tr = t.sourceRectAtTime(time, false); [t.transform.position[0], t.transform.position[1] - tr.height - ' + (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 4) : 4) + ', 0];'
                        : vertRightExpr;
                    setLayerPos(bdgLayer, [+sideBaseClear, bPosY, 0], bPosExprVR);
                }
                if (hasDesc && dLayer) {
                    var dRect = dLayer.sourceRectAtTime(0, false);
                    setLayerAnchor(dLayer, [dRect.left, dRect.top, 0], 'var r = sourceRectAtTime(time, false); [r.left, r.top, 0];');
                    setLayerPos(dLayer, [+sideBaseClear, posAlong + vertGap, 0], vertRightExpr);
                }
            } else {
                // effSide === "left"
                if (hasTitle && tLayer) {
                    setLayerAnchor(tLayer, [tRect.left + tRect.width, tRect.top + tRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height, 0];');
                    setLayerPos(tLayer, [-sideBaseClear, posAlong - vertGap, 0], vertLeftExpr);
                }
                if (hasBadge && bdgLayer) {
                    setLayerAnchor(bdgLayer, [bdgRect.left + bdgRect.width, bdgRect.top + bdgRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height, 0];');
                    var bPosY = (hasTitle && tRect) ? (posAlong - vertGap - tRect.height - (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 4) : 4)) : (posAlong - vertGap);
                    var bPosExprVL = (hasTitle && tLayer)
                        ? 'var t = thisComp.layer("' + tLayer.name + '"); var tr = t.sourceRectAtTime(time, false); [t.transform.position[0], t.transform.position[1] - tr.height - ' + (fBoxBadge.enabled ? (fBoxBadge.paddingV * 2 + 4) : 4) + ', 0];'
                        : vertLeftExpr;
                    setLayerPos(bdgLayer, [-sideBaseClear, bPosY, 0], bPosExprVL);
                }
                if (hasDesc && dLayer) {
                    var dRect = dLayer.sourceRectAtTime(0, false);
                    setLayerAnchor(dLayer, [dRect.left + dRect.width, dRect.top, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top, 0];');
                    setLayerPos(dLayer, [-sideBaseClear, posAlong + vertGap, 0], vertLeftExpr);
                }
            }
        }

        // 3. BEHIND SOURCE: Bottom / Behind Stream (Dates, Metrics, Details)
        var behindSrc = (nodeData.sources && nodeData.sources.behind) ? nodeData.sources.behind : null;
        var bType = behindSrc ? behindSrc.type : "none";
        var bVis = behindSrc ? (behindSrc.visible === true && bType !== "none") : false;

        var behindText = "";
        if (bVis) {
            var partsBehind = [];
            var bIcon = (behindSrc && behindSrc.icon) ? trimStr(behindSrc.icon) : "";
            var bCandNum = behindSrc ? trimStr(behindSrc.number) : "";
            var bCandBdg = behindSrc ? trimStr(behindSrc.badge) : "";
            var bCandVal = behindSrc ? trimStr(behindSrc.value) : "";
            var bCandBTxt = (behindSrc && bType === "badge") ? trimStr(behindSrc.text) : "";
            var bBadge = bCandNum.length > 0 ? bCandNum : (bCandBdg.length > 0 ? bCandBdg : (bCandVal.length > 0 ? bCandVal : bCandBTxt));
            var bTitle = (behindSrc && behindSrc.title) ? trimStr(behindSrc.title) : "";
            var bText = (behindSrc && behindSrc.text) ? trimStr(behindSrc.text) : "";

            if (bIcon && (behindSrc.showIcon === true || bType === "icon_title")) partsBehind.push(bIcon);
            if (bBadge && (behindSrc.showBadge === true || bType === "number_title" || bType === "number_text" || bType === "number" || bType === "badge")) partsBehind.push(bBadge);
            if (bTitle && (behindSrc.showTitle === true || (behindSrc.showTitle !== false && (bType === "title" || bType === "title_text" || bType === "title_list" || bType === "number_title" || bType === "icon_title")))) partsBehind.push(bTitle);

            if (behindSrc.showList === true || bType === "list" || bType === "title_list") {
                if (behindSrc.items && behindSrc.items.length > 0) {
                    var bListArr = [];
                    for (var bIdx = 0; bIdx < behindSrc.items.length; bIdx++) {
                        var bItVal = String(behindSrc.items[bIdx] || "");
                        bListArr.push(bItVal.indexOf("\u2022") === 0 ? bItVal : "\u2022 " + bItVal);
                    }
                    var listStr = bListArr.join("\r");
                    if (partsBehind.length > 0) partsBehind.push("\r" + listStr);
                    else partsBehind.push(listStr);
                } else if (bText) {
                    var listStr2 = bText.indexOf("\u2022") === 0
                        ? bText.replace(/\n/g, "\r")
                        : "\u2022 " + bText.replace(/\n/g, "\r\u2022 ");
                    if (partsBehind.length > 0) partsBehind.push("\r" + listStr2);
                    else partsBehind.push(listStr2);
                }
            } else if (bText && (behindSrc.showDesc === true || (behindSrc.showDesc !== false && (bType === "title_text" || bType === "text" || bType === "number_text")))) {
                if (partsBehind.length > 0) {
                    if (bText === bBadge || partsBehind.join(" ") === bText) {
                        behindText = partsBehind.join(" ");
                    } else {
                        behindText = partsBehind.join(" ") + (bBadge ? " \u2014 " : "\r") + bText;
                    }
                } else {
                    behindText = bText;
                }
            }

            if (behindText.length === 0 && partsBehind.length > 0) {
                behindText = partsBehind.join(" ");
            }
        }

        var bLayer = findNodeLayer(comp, i + 1, "Behind");
        var bBoxSettings = resolveBoxSettings(behindSrc, nodeData, "behind", boxCtx);
        var fixedOppClear = ((effSide === "bottom" || effSide === "right") ? nodeClearTop : nodeClearBottom) + 4;
        if (bBoxSettings && bBoxSettings.enabled && orientation === "horizontal") {
            fixedOppClear += bBoxSettings.paddingV;
        }
        var oppClear = fixedOppClear + bottomOffset;

        if (bVis && behindText.length > 0) {
            if (!bLayer) {
                bLayer = comp.layers.addText(behindText);
                bLayer.name = "MS_Node_" + (i + 1) + "_Behind";
                bLayer.parent = ctrl;
            }
            var bProp = getTextDocumentProp(bLayer);
            var bDoc = null;
            try { bDoc = bProp.value; } catch (eBDoc) { bDoc = null; }
            var effBehindStr = toStandardDigits(behindText);

            var effBehindSize = Math.max(10, Math.round(descFontSize * 0.95));
            if (behindSrc) {
                if (typeof behindSrc.fontSize === "number" && behindSrc.fontSize > 0) effBehindSize = behindSrc.fontSize;
                else if (bType === "badge" && typeof behindSrc.badgeFontSize === "number" && behindSrc.badgeFontSize > 0) effBehindSize = behindSrc.badgeFontSize;
                else if ((bType === "title" || bType === "title_text" || bType === "title_list" || bType === "number_title" || bType === "icon_title") && typeof behindSrc.titleFontSize === "number" && behindSrc.titleFontSize > 0) effBehindSize = behindSrc.titleFontSize;
                else if (typeof behindSrc.descFontSize === "number" && behindSrc.descFontSize > 0) effBehindSize = behindSrc.descFontSize;
                else if (typeof behindSrc.badgeFontSize === "number" && behindSrc.badgeFontSize > 0) effBehindSize = behindSrc.badgeFontSize;
            } else if (nodeData && typeof nodeData.behindFontSize === "number" && nodeData.behindFontSize > 0) {
                effBehindSize = nodeData.behindFontSize;
            }

            var defBehindCol = parseColor("#ffb833", [1.0, 0.72, 0.2]);
            var rawBehindCol = null;
            if (behindSrc) {
                rawBehindCol = behindSrc.color || behindSrc.textColor ||
                    ((bType === "badge") ? behindSrc.badgeColor : null) ||
                    ((bType === "text" || bType === "list" || bType === "number_text") ? behindSrc.descColor : null) ||
                    behindSrc.titleColor || behindSrc.descColor || behindSrc.badgeColor;
            }
            var effBehindColor = rawBehindCol
                ? parseColor(rawBehindCol, defBehindCol)
                : ((nodeData && nodeData.behindColor) ? parseColor(nodeData.behindColor, defBehindCol) : defBehindCol);

            if (bDoc) {
                try { bDoc.text = effBehindStr; } catch (eBT) {}
                try {
                    if (typeof DigitSet !== "undefined" && DigitSet && DigitSet.ARABIC_DIGITS) {
                        bDoc.digitSet = DigitSet.ARABIC_DIGITS;
                    }
                } catch (eDS) {}
                try { bDoc.fontSize = effBehindSize; } catch (eBS) {}
                try { bDoc.fillColor = effBehindColor; } catch (eBC) {}
                try { bDoc.applyFill = true; } catch (eBAF) {}
                try { bDoc.applyStroke = false; } catch (eBAS) {}
                try { bDoc.justification = behindJustify; } catch (eBJ) {}
                try {
                    bProp.setValue(bDoc);
                } catch (eSetBDoc) {
                    try { bProp.setValue(effBehindStr); } catch (eSetBRaw) {}
                }
            } else if (bProp) {
                try { bProp.setValue(effBehindStr); } catch (eSetBRaw2) {}
            }

            var bRect = bLayer.sourceRectAtTime(0, false);
            if (orientation === "horizontal") {
                if (effSide === "bottom") {
                    setLayerAnchor(bLayer, [bRect.left + (bRect.width / 2), bRect.top + bRect.height, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];');
                    setLayerPos(bLayer, [posAlong, -oppClear, 0], buildCtrlOffsetExpr("y", "-", fixedOppClear, "MS Global Bottom Offset"));
                } else {
                    setLayerAnchor(bLayer, [bRect.left + (bRect.width / 2), bRect.top, 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];');
                    setLayerPos(bLayer, [posAlong, +oppClear, 0], buildCtrlOffsetExpr("y", "+", fixedOppClear, "MS Global Bottom Offset"));
                }
            } else {
                if (effSide === "right") {
                    setLayerAnchor(bLayer, [bRect.left + bRect.width, bRect.top + (bRect.height / 2), 0], 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height / 2, 0];');
                    setLayerPos(bLayer, [-oppClear, posAlong, 0], buildCtrlOffsetExpr("x", "-", fixedOppClear, "MS Global Bottom Offset"));
                } else {
                    setLayerAnchor(bLayer, [bRect.left, bRect.top + (bRect.height / 2), 0], 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height / 2, 0];');
                    setLayerPos(bLayer, [+oppClear, posAlong, 0], buildCtrlOffsetExpr("x", "+", fixedOppClear, "MS Global Bottom Offset"));
                }
            }
            bLayer.enabled = true;
        } else if (bLayer) {
            bLayer.enabled = false;
        }

        // 4. SHAPE BOXES FOR SIDE STREAMS (Badge, Title, Desc, Behind - Excludes pure icon-only)
        var bdgBox = createOrUpdateTextBox(comp, (hasBadge && bdgLayer && bdgLayer.enabled) ? bdgLayer : null, "MS_Node_" + (i + 1) + "_Badge_Box", fBoxBadge, layerByName);
        var tBox = createOrUpdateTextBox(comp, (hasTitle && fType !== "icon" && tLayer && tLayer.enabled) ? tLayer : null, "MS_Node_" + (i + 1) + "_Title_Box", fBoxTitle, layerByName);
        var dBox = createOrUpdateTextBox(comp, (hasDesc && dLayer && dLayer.enabled) ? dLayer : null, "MS_Node_" + (i + 1) + "_Desc_Box", fBoxDesc, layerByName);
        var bBox = createOrUpdateTextBox(comp, (bVis && behindText.length > 0 && bType !== "icon" && bLayer && bLayer.enabled) ? bLayer : null, "MS_Node_" + (i + 1) + "_Behind_Box", bBoxSettings, layerByName);

        // Stack ordering: text layers above their box layers; nodesLayer below _Num
        if (tLayer && tLayer.enabled && dLayer && dLayer.enabled) {
            try { dLayer.moveAfter(tLayer); } catch (eMO1) {}
            if (tBox) try { tBox.moveAfter(dLayer); } catch (eMO2) {}
            if (dBox) try { dBox.moveAfter(tBox ? tBox : dLayer); } catch (eMO3) {}
        } else if (tLayer && tLayer.enabled && tBox) {
            try { tBox.moveAfter(tLayer); } catch (eMO4) {}
        } else if (dLayer && dLayer.enabled && dBox) {
            try { dBox.moveAfter(dLayer); } catch (eMO5) {}
        }
        if (bdgLayer && bdgLayer.enabled && bdgBox) {
            try { bdgBox.moveAfter(bdgLayer); } catch (eMO6) {}
        }
        if (bLayer && bLayer.enabled && bBox) {
            try { bBox.moveAfter(bLayer); } catch (eMO7) {}
        }
    }

    // Unified Z-Order Check: BaseLine behind Nodes shape layer, active _Num above Nodes
    if (nodesLayer && baseLayer) {
        try { baseLayer.moveAfter(nodesLayer); } catch (eZBase) {}
    }
    if (nodesLayer) {
        for (var zi = 1; zi <= count; zi++) {
            var nZ = findNodeLayer(comp, zi, "Num");
            if (nZ && nZ.enabled) {
                try { nZ.moveBefore(nodesLayer); } catch (eZN) {}
            }
        }
    }

    // Cleanup extra layers if count was reduced
    for (var oldIdx = count + 1; oldIdx <= 150; oldIdx++) {
        var hadAny = false;
        var oldGrp = nodesContents.property("Node_" + oldIdx);
        if (oldGrp) { try { oldGrp.remove(); hadAny = true; } catch (eOG) {} }

        var suffixes = ["Title", "Title_Box", "Desc", "Desc_Box", "Badge", "Badge_Box", "Num", "Behind", "Behind_Box"];
        for (var sfxI = 0; sfxI < suffixes.length; sfxI++) {
            var oldLyr = findNodeLayer(comp, oldIdx, suffixes[sfxI]);
            if (oldLyr) {
                try { oldLyr.remove(); hadAny = true; } catch (eRmOld) {}
            }
        }

        if (!hadAny) { break; }
    }

    // Clean up any residual motion rig artifacts if present
    try {
        var oldCam = layerByName["TR_Camera"] || layerByName["MS_Camera"] || null;
        if (oldCam) oldCam.remove();
    } catch (eC) {}
    try {
        var oldCamTgt = layerByName["TR_Camera_Target"] || layerByName["MS_Camera_Target"] || null;
        if (oldCamTgt) oldCamTgt.remove();
    } catch (eCT) {}
    try {
        var oldProg = ctrl ? ctrl.effect("Timeline Progress") : null;
        if (oldProg) oldProg.remove();
    } catch (eP) {}

    // Deselect newly created layers so AE selection does not jump or steal panel focus
    try {
        if (comp && comp.selectedLayers) {
            for (var dsl = comp.selectedLayers.length - 1; dsl >= 0; dsl--) {
                comp.selectedLayers[dsl].selected = false;
            }
        }
    } catch (eDsel) {}

    // Persist compact state snapshot to MASAR_CTRL.comment for bidirectional hydration
    var savedCompState = writeCompStateToCtrl(ctrl, cfg);

    return TR.JSON.stringify({
        ok: true,
        code: "OK",
        message: "MASAR generated successfully with " + count + " nodes.",
        data: {
            count: count,
            orientation: orientation,
            stateHash: savedCompState.hash,
            statePersisted: savedCompState.persisted
        }
    });

} catch (eGen) {
    return TR.JSON.stringify({
        ok: false,
        code: "GENERATE_FAILED",
        message: "Error generating MASAR: " + String(eGen && eGen.message ? eGen.message : eGen) + (eGen && eGen.line ? " @line " + eGen.line : ""),
        data: null
    });
} finally {
    if (startedGenUndo) {
        try { app.endUndoGroup(); } catch (eEndGen) {}
    }
}
};

// ============================================================================
// MODULE: host/src/99-entry.jsx
// ============================================================================
TR.boot = function () {
    TR.ready = true;
    return true;
};

TR.dispatch = function (fnName, jsonArg) {
    try {
        if (!TR.API || typeof TR.API[fnName] !== "function") {
            return '{"ok":false,"code":"HOST_NOT_READY","message":"Method ' + String(fnName) + ' not found.","data":null}';
        }
        return TR.API[fnName](jsonArg);
    } catch (e) {
        return '{"ok":false,"code":"HOST_EXCEPTION","message":"' + String(e && e.message ? e.message : e) + '","data":null}';
    }
};
