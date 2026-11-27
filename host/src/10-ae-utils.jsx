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
