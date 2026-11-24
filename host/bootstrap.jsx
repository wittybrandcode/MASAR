/**
 * MASAR PRO - host/bootstrap.jsx (Professional Node-Timeline Engine)
 * Handles communication between CEP panel and After Effects.
 */

var TR = $.global.MASAR || $.global.TIME_RULER;
if (typeof TR === "undefined") {
    TR = {};
    $.global.MASAR = TR;
    $.global.TIME_RULER = TR;
}
$.global.MASAR = TR;
$.global.TIME_RULER = TR;

TR.product = "MASAR";
TR.version = "2.5.0";
TR.ready = true;

// Install JSON support
if (typeof TR.JSON !== "object" || TR.JSON === null) {
    TR.JSON = (function () {
        function getJson() {
            if (typeof JSON !== "undefined" && JSON !== null &&
                typeof JSON.parse === "function" && typeof JSON.stringify === "function") {
                return JSON;
            }
            return null;
        }
        return {
            parse: function (s) {
                try {
                    var j = getJson();
                    if (!j) throw new Error("No JSON engine");
                    return j.parse(s);
                } catch (e) { return null; }
            },
            stringify: function (o) {
                try {
                    var j = getJson();
                    if (!j) throw new Error("No JSON engine");
                    return j.stringify(o);
                } catch (e) { return "{}"; }
            }
        };
    })();
}

// ------------------------------------------------------------------
// ExtendScript ECMAScript 3 Polyfills (Safe & Non-Destructive)
// ------------------------------------------------------------------
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return String(this).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function (fn, thisArg) {
        var res = [];
        for (var i = 0; i < this.length; i++) {
            res.push(fn.call(thisArg, this[i], i, this));
        }
        return res;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function (fn, thisArg) {
        var res = [];
        for (var i = 0; i < this.length; i++) {
            if (fn.call(thisArg, this[i], i, this)) {
                res.push(this[i]);
            }
        }
        return res;
    };
}
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, thisArg) {
        for (var i = 0; i < this.length; i++) {
            fn.call(thisArg, this[i], i, this);
        }
    };
}
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement, fromIndex) {
        var k = fromIndex ? Math.max(0, fromIndex) : 0;
        for (; k < this.length; k++) {
            if (this[k] === searchElement) return k;
        }
        return -1;
    };
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
            if (app.activeViewer.activeComp && isComp(app.activeViewer.activeComp)) {
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
            if (isComp(TR._lastActiveComp) && TR._lastActiveComp.parentFolder !== null) {
                return TR._lastActiveComp;
            }
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

function addShapePath(group, shapeObj, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var pg = contents.addProperty("ADBE Vector Shape - Group");
    if (name) { pg.name = name; }
    var path = pg.property("ADBE Vector Shape");
    if (path) {
        path.setValue(shapeObj);
    }
    return pg;
}

function addShapeStroke(group, color, width, capType, lineStyle, dashSize, dashGap, opacity) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
    if (stroke) {
        try { stroke.property("ADBE Vector Stroke Color").setValue(color); } catch (eC) {}
        try { stroke.property("ADBE Vector Stroke Width").setValue(width); } catch (eW) {}
        
        // Line Cap: 1 = Butt, 2 = Round, 3 = Projecting
        var capVal = 2; // Default round
        if (capType === "butt" || capType === 1) capVal = 1;
        else if (capType === "round" || capType === 2) capVal = 2;
        else if (capType === "projecting" || capType === 3) capVal = 3;
        try { stroke.property("ADBE Vector Stroke Line Cap").setValue(capVal); } catch (eCap) {}

        if (typeof opacity === "number" && opacity >= 0 && opacity <= 100) {
            try { stroke.property("ADBE Vector Stroke Opacity").setValue(opacity); } catch (eOp) {}
        }

        // Dashed / Dotted handling
        if (lineStyle === "dotted") capVal = 2; // Always round for circular dots
        try { stroke.property("ADBE Vector Stroke Line Cap").setValue(capVal); } catch (eCap2) {}

        if (lineStyle === "dashed" || lineStyle === "dotted") {
            try {
                var dashes = stroke.property("ADBE Vector Stroke Dashes");
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
                        stroke.property("ADBE Vector Stroke Line Cap").setValue(2); // Round cap produces round dots
                    }
                }
            } catch (eDash) {}
        }
    }
    return stroke;
}

function addShapeEllipse(group, radius, center, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var eg = contents.addProperty("ADBE Vector Shape - Ellipse");
    if (name) { eg.name = name; }
    try {
        eg.property("ADBE Vector Ellipse Size").setValue([radius * 2, radius * 2]);
        eg.property("ADBE Vector Ellipse Position").setValue([center[0], center[1]]);
    } catch (eE) {}

    if (fillCol) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
        } catch (eS) {}
    }
    return eg;
}

function addShapeRect(group, width, height, center, roundness, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var rg = contents.addProperty("ADBE Vector Shape - Rect");
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
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
        } catch (eS) {}
    }
    return rg;
}

function addShapeDiamond(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var pg = contents.addProperty("ADBE Vector Shape - Group");
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
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (eS) {}
    }
    return pg;
}

function addShapeTriangle(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var pg = contents.addProperty("ADBE Vector Shape - Group");
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
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (eS) {}
    }
    return pg;
}

function addShapeHexagon(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var pg = contents.addProperty("ADBE Vector Shape - Group");
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
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (eS) {}
    }
    return pg;
}

function addShapeStar(group, size, center, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var pg = contents.addProperty("ADBE Vector Shape - Group");
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
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
    }
    if (strokeCol && strokeW > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (eS) {}
    }
    return pg;
}

function addShapeTick(group, posAlong, orientation, tickHalf, tickColor, tickWidth, name) {
    var tShape = new Shape();
    if (orientation === "horizontal") {
        tShape.vertices = [[posAlong, -tickHalf], [posAlong, tickHalf]];
    } else {
        tShape.vertices = [[-tickHalf, posAlong], [tickHalf, posAlong]];
    }
    tShape.closed = false;
    addShapePath(group, tShape, name || "Tick");
    addShapeStroke(group, tickColor, tickWidth, 1, "solid");
}

function addShapeTerminal(group, type, pt, direction, orientation, color, size, name) {
    if (!type || type === "none") return null;
    var s = size || 10;
    var x = pt[0];
    var y = pt[1];

    if (type === "arrow") {
        var aShape = new Shape();
        if (orientation === "horizontal") {
            if (direction > 0) { // Right pointing
                aShape.vertices = [[x - s * 1.2, y - s * 0.7], [x + s * 0.2, y], [x - s * 1.2, y + s * 0.7]];
            } else { // Left pointing
                aShape.vertices = [[x + s * 1.2, y - s * 0.7], [x - s * 0.2, y], [x + s * 1.2, y + s * 0.7]];
            }
        } else {
            if (direction > 0) { // Down pointing
                aShape.vertices = [[x - s * 0.7, y - s * 1.2], [x, y + s * 0.2], [x + s * 0.7, y - s * 1.2]];
            } else { // Up pointing
                aShape.vertices = [[x - s * 0.7, y + s * 1.2], [x, y - s * 0.2], [x + s * 0.7, y + s * 1.2]];
            }
        }
        aShape.closed = true;
        addShapePath(group, aShape, name || "ArrowTerminal");
        var contents = group.property("Contents") || group.property("ADBE Vectors Group");
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        try { fill.property("ADBE Vector Fill Color").setValue(color); } catch (e) {}
    } else if (type === "dot") {
        addShapeEllipse(group, s * 0.6, pt, color, null, 0, name || "DotTerminal");
    } else if (type === "bar") {
        var bShape = new Shape();
        var bLen = s * 1.2;
        if (orientation === "horizontal") {
            bShape.vertices = [[x, y - bLen], [x, y + bLen]];
        } else {
            bShape.vertices = [[x - bLen, y], [x + bLen, y]];
        }
        bShape.closed = false;
        addShapePath(group, bShape, name || "BarTerminal");
        addShapeStroke(group, color, Math.max(3, s * 0.35), 1, "solid");
    }
}

function addShapeCustomVector(group, center, subPaths, fillCol, strokeCol, strokeW, name) {
    var contents = group.property("Contents") || group.property("ADBE Vectors Group");
    var pg = contents.addProperty("ADBE Vector Group");
    pg.name = name || "VectorShape";
    var pgContents = pg.property("Contents") || pg.property("ADBE Vectors Group");

    for (var sp = 0; sp < subPaths.length; sp++) {
        var sub = subPaths[sp];
        var sObj = new Shape();
        var verts = [];
        for (var v = 0; v < sub.vertices.length; v++) {
            verts.push([
                center[0] + sub.vertices[v][0],
                center[1] + sub.vertices[v][1]
            ]);
        }
        sObj.vertices = verts;
        sObj.inTangents = sub.inTangents || [];
        sObj.outTangents = sub.outTangents || [];
        sObj.closed = (sub.closed !== false);

        var pathPropGroup = pgContents.addProperty("ADBE Vector Shape - Group");
        pathPropGroup.name = "Path_" + (sp + 1);
        var pathProp = pathPropGroup.property("ADBE Vector Shape");
        pathProp.setValue(sObj);
    }

    if (fillCol) {
        var fill = pgContents.addProperty("ADBE Vector Graphic - Fill");
        try { fill.property("ADBE Vector Fill Color").setValue(fillCol); } catch (eF) {}
        try { fill.property("ADBE Vector Fill Rule").setValue(2); } catch (eR) {} // 2 = EvenOdd for compound cutouts
    }

    if (strokeCol && strokeW > 0) {
        var stroke = pgContents.addProperty("ADBE Vector Graphic - Stroke");
        try {
            stroke.property("ADBE Vector Stroke Color").setValue(strokeCol);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeW);
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (eS) {}
    }

    return pg;
}

// ------------------------------------------------------------------
// API methods
// ------------------------------------------------------------------
TR.API = {
    ping: function () {
        return TR.JSON.stringify({ ok: true, code: "OK", message: "TIME RULER host ready.", data: { ready: true } });
    },

    getHostInfo: function () {
        var v = "unknown";
        try { v = String(app.version); } catch (e) {}
        return TR.JSON.stringify({
            ok: true,
            code: "OK",
            message: "Host information",
            data: { aeVersion: v, version: TR.version }
        });
    },

    getActiveCompInfo: function () {
        var comp = getActiveComp();
        if (!comp) {
            return TR.JSON.stringify({
                ok: false,
                code: "NO_ACTIVE_COMP",
                message: "No active composition. Open a comp first.",
                data: null
            });
        }
        var hasRuler = false;
        try {
            hasRuler = (comp.layer("MASAR_CTRL") !== null || comp.layer("TIME_RULER_CTRL") !== null);
        } catch (eH) {}

        var info = {
            name: String(comp.name),
            compName: String(comp.name),
            width: Number(comp.width),
            height: Number(comp.height),
            duration: Number(comp.duration),
            frameRate: Number(comp.frameRate),
            hasRuler: hasRuler
        };
        return TR.JSON.stringify({
            ok: true,
            code: "OK",
            message: "Active composition found.",
            data: info
        });
    },

    inspectCompLayers: function () {
        var comp = getActiveComp();
        if (!comp) return TR.JSON.stringify({ ok: false, code: "NO_ACTIVE_COMP", message: "No active comp", data: null });
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var l = comp.layer(i);
            layers.push({ index: i, name: l.name, enabled: l.enabled });
        }
        return TR.JSON.stringify({ ok: true, code: "OK", message: "Comp layers", data: layers });
    },

    validateConfig: function () {
        return TR.JSON.stringify({
            ok: true,
            code: "OK",
            message: "Configuration valid.",
            data: { valid: true, errors: [], warnings: [] }
        });
    },

    startUndoSession: function (nameArg) {
        var name = (typeof nameArg === "string" && nameArg.length > 0) ? nameArg : "TIME RULER Edit";
        if (!TR._activeUndoSession) {
            app.beginUndoGroup(name);
            TR._activeUndoSession = name;
        }
        return TR.JSON.stringify({ ok: true, session: TR._activeUndoSession });
    },

    endUndoSession: function () {
        if (TR._activeUndoSession) {
            app.endUndoGroup();
            TR._activeUndoSession = null;
        }
        return TR.JSON.stringify({ ok: true });
    },

    setupEssentialGraphics: function () {
        var comp = getActiveComp();
        if (!comp) {
            return TR.JSON.stringify({ ok: false, code: "NO_ACTIVE_COMP", message: "No active comp" });
        }
        if (!TR._activeUndoSession) { app.beginUndoGroup("Setup Essential Graphics"); }
        try {
            comp.motionGraphicsTemplateName = "MASAR - " + comp.name;
            try { comp.openInEssentialGraphics(); } catch (e) {}

            var added = 0;

            // 1. Add node texts
            for (var i = 1; i <= 50; i++) {
                var tL = null; try { tL = comp.layer("MS_Node_" + i + "_Title") || comp.layer("TR_Node_" + i + "_Title"); } catch (e) {}
                if (tL && tL.enabled) {
                    var pT = tL.property("Source Text");
                    if (pT && typeof pT.canAddToMotionGraphicsTemplate === "function" && pT.canAddToMotionGraphicsTemplate(comp)) {
                        try { pT.addToMotionGraphicsTemplate(comp); added++; } catch (e) {}
                    }
                }
                var dL = null; try { dL = comp.layer("MS_Node_" + i + "_Desc") || comp.layer("TR_Node_" + i + "_Desc"); } catch (e) {}
                if (dL && dL.enabled) {
                    var pD = dL.property("Source Text");
                    if (pD && typeof pD.canAddToMotionGraphicsTemplate === "function" && pD.canAddToMotionGraphicsTemplate(comp)) {
                        try { pD.addToMotionGraphicsTemplate(comp); added++; } catch (e) {}
                    }
                }
                var bL = null; try { bL = comp.layer("MS_Node_" + i + "_Behind") || comp.layer("TR_Node_" + i + "_Behind"); } catch (e) {}
                if (bL && bL.enabled) {
                    var pB = bL.property("Source Text");
                    if (pB && typeof pB.canAddToMotionGraphicsTemplate === "function" && pB.canAddToMotionGraphicsTemplate(comp)) {
                        try { pB.addToMotionGraphicsTemplate(comp); added++; } catch (e) {}
                    }
                }
            }

            // 3. Set Responsive Design - Time Marker
            try {
                if (comp.markerProperty) {
                    var mIntro = new MarkerValue("Intro Protected");
                    mIntro.duration = 2.5;
                    mIntro.protectedRegion = true;
                    comp.markerProperty.setValueAtTime(0, mIntro);
                }
            } catch (eM) {}

            if (!TR._activeUndoSession) { app.endUndoGroup(); }
            return TR.JSON.stringify({ ok: true, code: "OK", message: "Essential Graphics configured with " + added + " properties.", data: { addedCount: added } });
        } catch (err) {
            if (!TR._activeUndoSession) { app.endUndoGroup(); }
            return TR.JSON.stringify({ ok: false, code: "EG_ERROR", message: err.toString() });
        }
    },

    exportMOGRT: function (rawArg) {
        var comp = getActiveComp();
        if (!comp) {
            return TR.JSON.stringify({ ok: false, code: "NO_ACTIVE_COMP", message: "No active comp" });
        }
        try {
            // Setup properties and markers
            TR.API.setupEssentialGraphics();

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
                exported = comp.exportAsMotionGraphicsTemplate(true, mogrtFile.fsName);
            } catch (eInner) {
                exported = false;
            } finally {
                if (typeof app.endSuppressDialogs === "function") app.endSuppressDialogs(false);
            }

            return TR.JSON.stringify({
                ok: true,
                code: "OK",
                message: "MOGRT exported successfully to: " + mogrtFile.fsName,
                data: { path: mogrtFile.fsName, exported: exported }
            });
        } catch (eExp) {
            return TR.JSON.stringify({
                ok: false,
                code: "MOGRT_EXPORT_FAILED",
                message: "Export failed: " + String(eExp && eExp.message ? eExp.message : eExp)
            });
        }
    },

    generate: function (rawArg) {
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

        if (!TR._activeUndoSession) { app.beginUndoGroup("Generate MASAR Timeline"); }

        try {
            var orientation = cfg.orientation || "horizontal";
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

            // Spacing & Length calculation
            var margin = (cfg.endMargin !== undefined && cfg.endMargin !== null && !isNaN(parseFloat(cfg.endMargin))) ? Math.max(0, parseFloat(cfg.endMargin)) : 60;
            var spacingMode = cfg.spacingMode || "auto"; // "auto" or "fixed"
            var spacingGap = parseFloat(cfg.spacingGap) || 240;
            var length = 0;

            if (spacingMode === "fixed") {
                length = ((count - 1) * spacingGap) + (2 * margin);
            } else {
                var defaultLen = (orientation === "horizontal") ? Math.round(compW * 0.8) : Math.round(compH * 0.8);
                length = parseFloat(cfg.length) || defaultLen;
            }

            var halfLen = length / 2;
            var usableSpan = length - (2 * margin);
            var step = (count > 1) ? (usableSpan / (count - 1)) : 0;

            // Styling params
            var lineWidth = parseFloat(cfg.lineWidth) || 4;
            var lineColor = parseColor(cfg.lineColor, [0.95, 0.95, 0.95]);

            var lineStyle = cfg.lineStyle || "solid"; // "solid" | "dashed" | "dotted"
            var lineCap = cfg.lineCap || "round"; // "butt" | "round" | "projecting"
            var dashSize = parseFloat(cfg.dashSize) || 16;
            var dashGap = parseFloat(cfg.dashGap) || 10;
            var lineOpacity = (typeof cfg.lineOpacity === "number" && !isNaN(cfg.lineOpacity)) ? Math.max(0, Math.min(100, cfg.lineOpacity)) : 100;
            var startTerminal = cfg.startTerminal || "none";
            var endTerminal = cfg.endTerminal || "none";
            var terminalSize = (cfg.terminalSize !== undefined && cfg.terminalSize !== null && !isNaN(parseFloat(cfg.terminalSize))) ? parseFloat(cfg.terminalSize) : Math.max(12, lineWidth * 3);
            var terminalColor = (cfg.terminalColor && String(cfg.terminalColor).length > 0) ? parseColor(cfg.terminalColor, lineColor) : lineColor;

            var nodeShape = cfg.nodeShape || "circle"; // "circle" | "square" | "diamond" | "tick"
            var circleRadius = parseFloat(cfg.circleRadius) || 12;
            var circleFill = parseColor(cfg.circleFill, [0.05, 0.44, 0.92]); // #0e71eb
            var circleStroke = parseColor(cfg.circleStroke, [1, 1, 1]);
            var circleStrokeWidth = parseFloat(cfg.circleStrokeWidth) || 3;

            var tickHeight = parseFloat(cfg.tickHeight) || 36;
            var tickWidth = parseFloat(cfg.tickWidth) || 4;
            var tickColor = parseColor(cfg.tickColor, [0.95, 0.95, 0.95]);
            var tickHalf = tickHeight / 2;

            var titleFontSize = parseFloat(cfg.titleFontSize) || 22;
            var titleColor = parseColor(cfg.titleColor, [1, 1, 1]);

            var descFontSize = parseFloat(cfg.descFontSize) || 14;
            var descColor = parseColor(cfg.descColor, [0.7, 0.7, 0.7]);
            var topOffset = parseFloat(cfg.topOffset) || 26;

            var numberFontSize = parseFloat(cfg.numberFontSize) || 20;
            var numberColor = parseColor(cfg.numberColor, [0.2, 0.65, 1.0]);
            var bottomOffset = parseFloat(cfg.bottomOffset) || 26;

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

            // Source-Specific Global Box Settings (Title vs Desc vs Behind)
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

            function resolveBoxSettings(streamObj, nodeData, streamKind) {
                // Icons never get boxes as per user explicit requirement
                if (streamObj && (streamObj.type === "icon" || streamObj.type === "shape_icon")) {
                    return { enabled: false };
                }

                var sBox = "inherit";
                var nBox = "inherit";
                var streamGlobalEnabled = true;
                var baseFill = globalBoxFillColor;
                var baseStroke = globalBoxStrokeColor;
                var baseRadius = globalBoxRadius;
                var baseFillOp = globalBoxFillOpacity;
                var baseStrokeW = globalBoxStrokeWidth;

                if (streamKind === "title") {
                    sBox = streamObj ? (streamObj.titleBox || streamObj.titleBoxEnabled || streamObj.box || streamObj.boxEnabled) : "inherit";
                    nBox = nodeData ? (nodeData.titleBox || nodeData.titleBoxEnabled || nodeData.box || nodeData.boxEnabled) : "inherit";
                    streamGlobalEnabled = globalTitleBoxEnabled;
                    baseFill = globalTitleBoxFillColor;
                    baseStroke = globalTitleBoxStrokeColor;
                    baseRadius = globalTitleBoxRadius;
                    baseFillOp = globalTitleBoxFillOpacity;
                    baseStrokeW = globalTitleBoxStrokeWidth;
                } else if (streamKind === "desc") {
                    sBox = streamObj ? (streamObj.descBox || streamObj.descBoxEnabled || streamObj.box || streamObj.boxEnabled) : "inherit";
                    nBox = nodeData ? (nodeData.descBox || nodeData.descBoxEnabled || nodeData.box || nodeData.boxEnabled) : "inherit";
                    streamGlobalEnabled = globalDescBoxEnabled;
                    baseFill = globalDescBoxFillColor;
                    baseStroke = globalDescBoxStrokeColor;
                    baseRadius = globalDescBoxRadius;
                    baseFillOp = globalDescBoxFillOpacity;
                    baseStrokeW = globalDescBoxStrokeWidth;
                } else if (streamKind === "behind") {
                    sBox = streamObj ? (streamObj.behindBox || streamObj.box || streamObj.boxEnabled) : "inherit";
                    nBox = nodeData ? (nodeData.behindBox || nodeData.box || nodeData.boxEnabled) : "inherit";
                    streamGlobalEnabled = globalBehindBoxEnabled;
                    baseFill = globalBehindBoxFillColor;
                    baseStroke = globalBehindBoxStrokeColor;
                    baseRadius = globalBehindBoxRadius;
                    baseFillOp = globalBehindBoxFillOpacity;
                    baseStrokeW = globalBehindBoxStrokeWidth;
                }

                var isEnabled = false;
                if (sBox === true || sBox === "on") {
                    isEnabled = true;
                } else if (sBox === false || sBox === "off") {
                    isEnabled = false;
                } else if (nBox === true || nBox === "on") {
                    isEnabled = true;
                } else if (nBox === false || nBox === "off") {
                    isEnabled = false;
                } else {
                    isEnabled = globalBoxEnabled && streamGlobalEnabled;
                }

                // Granular per-stream override resolution
                var effFillColor = baseFill;
                var effStrokeColor = baseStroke;
                var effRadius = baseRadius;
                var effFillOpacity = baseFillOp;
                var effStrokeWidth = baseStrokeW;

                if (streamKind === "title") {
                    if (streamObj && (streamObj.titleBoxColor || streamObj.titleBoxFillColor || streamObj.boxFillColor || streamObj.boxColor)) {
                        effFillColor = parseColor(streamObj.titleBoxColor || streamObj.titleBoxFillColor || streamObj.boxFillColor || streamObj.boxColor, baseFill);
                    } else if (nodeData && (nodeData.titleBoxColor || nodeData.customBoxColor || nodeData.boxFillColor || nodeData.boxColor)) {
                        effFillColor = parseColor(nodeData.titleBoxColor || nodeData.customBoxColor || nodeData.boxFillColor || nodeData.boxColor, baseFill);
                    }

                    if (streamObj && (streamObj.titleBoxStroke || streamObj.titleBoxStrokeColor || streamObj.boxStrokeColor || streamObj.boxStroke)) {
                        effStrokeColor = parseColor(streamObj.titleBoxStroke || streamObj.titleBoxStrokeColor || streamObj.boxStrokeColor || streamObj.boxStroke, baseStroke);
                    } else if (nodeData && (nodeData.titleBoxStroke || nodeData.customBoxStroke || nodeData.boxStrokeColor || nodeData.boxStroke)) {
                        effStrokeColor = parseColor(nodeData.titleBoxStroke || nodeData.customBoxStroke || nodeData.boxStrokeColor || nodeData.boxStroke, baseStroke);
                    }

                    if (streamObj && typeof streamObj.titleBoxRadius === "number") {
                        effRadius = streamObj.titleBoxRadius;
                    } else if (streamObj && typeof streamObj.boxRadius === "number") {
                        effRadius = streamObj.boxRadius;
                    } else if (nodeData && typeof nodeData.titleBoxRadius === "number") {
                        effRadius = nodeData.titleBoxRadius;
                    } else if (nodeData && typeof nodeData.boxRadius === "number") {
                        effRadius = nodeData.boxRadius;
                    }

                    if (streamObj && typeof streamObj.titleBoxFillOpacity === "number") {
                        effFillOpacity = streamObj.titleBoxFillOpacity;
                    } else if (streamObj && typeof streamObj.boxFillOpacity === "number") {
                        effFillOpacity = streamObj.boxFillOpacity;
                    }
                } else if (streamKind === "desc") {
                    if (streamObj && (streamObj.descBoxColor || streamObj.descBoxFillColor || streamObj.boxFillColor || streamObj.boxColor)) {
                        effFillColor = parseColor(streamObj.descBoxColor || streamObj.descBoxFillColor || streamObj.boxFillColor || streamObj.boxColor, baseFill);
                    } else if (nodeData && (nodeData.descBoxColor || nodeData.customBoxColor || nodeData.boxFillColor || nodeData.boxColor)) {
                        effFillColor = parseColor(nodeData.descBoxColor || nodeData.customBoxColor || nodeData.boxFillColor || nodeData.boxColor, baseFill);
                    }

                    if (streamObj && (streamObj.descBoxStroke || streamObj.descBoxStrokeColor || streamObj.boxStrokeColor || streamObj.boxStroke)) {
                        effStrokeColor = parseColor(streamObj.descBoxStroke || streamObj.descBoxStrokeColor || streamObj.boxStrokeColor || streamObj.boxStroke, baseStroke);
                    } else if (nodeData && (nodeData.descBoxStroke || nodeData.customBoxStroke || nodeData.boxStrokeColor || nodeData.boxStroke)) {
                        effStrokeColor = parseColor(nodeData.descBoxStroke || nodeData.customBoxStroke || nodeData.boxStrokeColor || nodeData.boxStroke, baseStroke);
                    }

                    if (streamObj && typeof streamObj.descBoxRadius === "number") {
                        effRadius = streamObj.descBoxRadius;
                    } else if (streamObj && typeof streamObj.boxRadius === "number") {
                        effRadius = streamObj.boxRadius;
                    } else if (nodeData && typeof nodeData.descBoxRadius === "number") {
                        effRadius = nodeData.descBoxRadius;
                    } else if (nodeData && typeof nodeData.boxRadius === "number") {
                        effRadius = nodeData.boxRadius;
                    }

                    if (streamObj && typeof streamObj.descBoxFillOpacity === "number") {
                        effFillOpacity = streamObj.descBoxFillOpacity;
                    } else if (streamObj && typeof streamObj.boxFillOpacity === "number") {
                        effFillOpacity = streamObj.boxFillOpacity;
                    }
                } else if (streamKind === "behind") {
                    if (streamObj && (streamObj.boxFillColor || streamObj.boxColor || streamObj.behindBoxColor)) {
                        effFillColor = parseColor(streamObj.boxFillColor || streamObj.boxColor || streamObj.behindBoxColor, baseFill);
                    } else if (nodeData && (nodeData.behindBoxColor || nodeData.customBoxColor || nodeData.boxFillColor || nodeData.boxColor)) {
                        effFillColor = parseColor(nodeData.behindBoxColor || nodeData.customBoxColor || nodeData.boxFillColor || nodeData.boxColor, baseFill);
                    }

                    if (streamObj && (streamObj.boxStrokeColor || streamObj.boxStroke || streamObj.behindBoxStroke)) {
                        effStrokeColor = parseColor(streamObj.boxStrokeColor || streamObj.boxStroke || streamObj.behindBoxStroke, baseStroke);
                    } else if (nodeData && (nodeData.behindBoxStroke || nodeData.customBoxStroke || nodeData.boxStrokeColor || nodeData.boxStroke)) {
                        effStrokeColor = parseColor(nodeData.behindBoxStroke || nodeData.customBoxStroke || nodeData.boxStrokeColor || nodeData.boxStroke, baseStroke);
                    }

                    if (streamObj && typeof streamObj.boxRadius === "number") {
                        effRadius = streamObj.boxRadius;
                    } else if (nodeData && typeof nodeData.behindBoxRadius === "number") {
                        effRadius = nodeData.behindBoxRadius;
                    } else if (nodeData && typeof nodeData.boxRadius === "number") {
                        effRadius = nodeData.boxRadius;
                    }

                    if (streamObj && typeof streamObj.boxFillOpacity === "number") {
                        effFillOpacity = streamObj.boxFillOpacity;
                    } else if (nodeData && typeof nodeData.boxFillOpacity === "number") {
                        effFillOpacity = nodeData.boxFillOpacity;
                    }
                }

                var effPaddingH = (streamObj && typeof streamObj.boxPaddingH === "number") ? streamObj.boxPaddingH : ((nodeData && typeof nodeData.boxPaddingH === "number") ? nodeData.boxPaddingH : globalBoxPaddingH);
                var effPaddingV = (streamObj && typeof streamObj.boxPaddingV === "number") ? streamObj.boxPaddingV : ((nodeData && typeof nodeData.boxPaddingV === "number") ? nodeData.boxPaddingV : globalBoxPaddingV);

                return {
                    enabled: isEnabled,
                    fillColor: effFillColor,
                    fillOpacity: effFillOpacity,
                    strokeColor: effStrokeColor,
                    strokeWidth: effStrokeWidth,
                    strokeOpacity: globalBoxStrokeOpacity,
                    radius: effRadius,
                    paddingH: effPaddingH,
                    paddingV: effPaddingV
                };
            }

            function createOrUpdateTextBox(comp, textLayer, boxLayerName, boxSettings) {
                if (!textLayer || !textLayer.enabled || !boxSettings || !boxSettings.enabled) {
                    var oldB = null;
                    try { oldB = comp.layer(boxLayerName); } catch (e) { oldB = null; }
                    if (oldB) {
                        try { oldB.enabled = false; } catch (e) {}
                    }
                    return null;
                }

                var bLayer = null;
                try { bLayer = comp.layer(boxLayerName); } catch (e) { bLayer = null; }

                if (!bLayer) {
                    bLayer = comp.layers.addShape();
                    bLayer.name = boxLayerName;
                }

                bLayer.parent = textLayer;
                try { bLayer.property("Position").setValue([0, 0, 0]); } catch (eP) {}
                try { bLayer.property("Anchor Point").setValue([0, 0, 0]); } catch (eA) {}

                var fx = bLayer.property("ADBE Effect Parade") || bLayer.property("Effects");
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
                            var p = s.property("Slider") || s.property("ADBE Slider Control-0001") || s.property(1);
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
                            var p = c.property("Color") || c.property("ADBE Color Control-0001") || c.property(1);
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

                var contents = bLayer.property("Contents") || bLayer.property("ADBE Root Vectors Group") || bLayer.property("ADBE Vectors Group");
                if (contents) {
                    var grp = null;
                    try { grp = contents.property("Box"); } catch (e) {}
                    if (!grp) {
                        grp = contents.addProperty("ADBE Vector Group");
                        grp.name = "Box";
                    }
                    var grpContents = grp ? (grp.property("Contents") || grp.property("ADBE Vectors Group")) : null;

                    if (grpContents) {
                        var rect = null;
                        try { rect = grpContents.property("Path"); } catch (e) {}
                        if (!rect) {
                            rect = grpContents.addProperty("ADBE Vector Shape - Rect");
                            if (rect) rect.name = "Path";
                        }
                        if (rect) {
                            try {
                                var rSize = rect.property("ADBE Vector Rect Size") || rect.property("Size") || rect.property(2);
                                if (rSize) {
                                    rSize.expression = [
                                        'var r = parent.sourceRectAtTime(time, false);',
                                        'var pH = effect("Padding H")(1);',
                                        'var pV = effect("Padding V")(1);',
                                        '[r.width + pH * 2, r.height + pV * 2];'
                                    ].join('\n');
                                }
                            } catch (eRS) {}
                            try {
                                var rPos = rect.property("ADBE Vector Rect Position") || rect.property("Position") || rect.property(3);
                                if (rPos) {
                                    rPos.expression = [
                                        'var r = parent.sourceRectAtTime(time, false);',
                                        '[r.left + r.width / 2, r.top + r.height / 2];'
                                    ].join('\n');
                                }
                            } catch (eRP) {}
                            try {
                                var rRnd = rect.property("ADBE Vector Rect Roundness") || rect.property("Roundness") || rect.property(4);
                                if (rRnd) {
                                    rRnd.expression = 'Math.max(0, effect("Corner Radius")(1));';
                                }
                            } catch (eRR) {}
                        }

                        var fill = null;
                        try { fill = grpContents.property("Fill"); } catch (e) {}
                        if (!fill) {
                            fill = grpContents.addProperty("ADBE Vector Graphic - Fill");
                            if (fill) fill.name = "Fill";
                        }
                        if (fill) {
                            try {
                                var fCol = fill.property("ADBE Vector Fill Color") || fill.property("Color") || fill.property(4);
                                if (fCol) fCol.expression = 'effect("Fill Color")(1);';
                            } catch (eFC) {}
                            try {
                                var fOp = fill.property("ADBE Vector Fill Opacity") || fill.property("Opacity") || fill.property(5);
                                if (fOp) {
                                    fOp.expression = [
                                        'var txt = parent.text.sourceText + "";',
                                        'var clean = txt.replace(/\\s/g, "");',
                                        '(clean.length > 0) ? effect("Fill Opacity")(1) : 0;'
                                    ].join('\n');
                                }
                            } catch (eFO) {}
                        }

                        var stroke = null;
                        try { stroke = grpContents.property("Stroke"); } catch (e) {}
                        if (!stroke) {
                            stroke = grpContents.addProperty("ADBE Vector Graphic - Stroke");
                            if (stroke) stroke.name = "Stroke";
                        }
                        if (stroke) {
                            try {
                                var sCol = stroke.property("ADBE Vector Stroke Color") || stroke.property("Color") || stroke.property(3);
                                if (sCol) sCol.expression = 'effect("Stroke Color")(1);';
                            } catch (eSC) {}
                            try {
                                var sW = stroke.property("ADBE Vector Stroke Width") || stroke.property("Stroke Width") || stroke.property(4);
                                if (sW) sW.expression = 'Math.max(0, effect("Stroke Width")(1));';
                            } catch (eSW) {}
                            try {
                                var sOp = stroke.property("ADBE Vector Stroke Opacity") || stroke.property("Opacity") || stroke.property(5);
                                if (sOp) {
                                    sOp.expression = [
                                        'var txt = parent.text.sourceText + "";',
                                        'var clean = txt.replace(/\\s/g, "");',
                                        '(clean.length > 0) ? effect("Stroke Opacity")(1) : 0;'
                                    ].join('\n');
                                }
                            } catch (eSO) {}
                        }
                    }
                }

                bLayer.enabled = true;
                return bLayer;
            }

            var forceRebuild = (cfg.forceRebuild === true);

            // Check if MASAR or legacy ruler layers already exist for in-place updating
            var ctrl = null;
            try { ctrl = comp.layer("MASAR_CTRL") || comp.layer("TIME_RULER_CTRL"); } catch (eCtrl) { ctrl = null; }
            if (!ctrl) {
                for (var li = 1; li <= comp.numLayers; li++) {
                    try {
                        var ln = String(comp.layer(li).name);
                        if (ln === "MASAR_CTRL" || ln === "TIME_RULER_CTRL") {
                            ctrl = comp.layer(li);
                            break;
                        }
                    } catch (eF) {}
                }
            }
            var baseLayer = null;
            try { baseLayer = comp.layer("MS_Baseline") || comp.layer("TR_Baseline"); } catch (eB) { baseLayer = null; }
            if (!baseLayer && ctrl) {
                for (var li = 1; li <= comp.numLayers; li++) {
                    try {
                        var lnB = String(comp.layer(li).name);
                        if (lnB === "MS_Baseline" || lnB === "TR_Baseline") {
                            baseLayer = comp.layer(li);
                            break;
                        }
                    } catch (eF) {}
                }
            }
            var nodesLayer = null;
            try { nodesLayer = comp.layer("MS_Nodes") || comp.layer("TR_Nodes"); } catch (eN) { nodesLayer = null; }
            if (!nodesLayer && ctrl) {
                for (var li = 1; li <= comp.numLayers; li++) {
                    try {
                        var lnN = String(comp.layer(li).name);
                        if (lnN === "MS_Nodes" || lnN === "TR_Nodes") {
                            nodesLayer = comp.layer(li);
                            break;
                        }
                    } catch (eF) {}
                }
            }

            // In-place smart update is strictly preserved whenever the controller exists and forceRebuild was not requested.
            // Never destroy or delete existing timeline layers unless forceRebuild is explicitly true or ctrl is missing.
            var canUpdateInPlace = (!forceRebuild && ctrl !== null);

            var startPt = (orientation === "horizontal") ? [-halfLen, 0] : [0, -halfLen];
            var endPt = (orientation === "horizontal") ? [halfLen, 0] : [0, halfLen];

            if (!canUpdateInPlace) {
                // =========================================================
                // FULL BUILD MODE (First time or explicit Rebuild requested)
                // =========================================================

                // Remove any previous ruler layers (MASAR and legacy TIME_RULER)
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

                // 1. Controller Null
                ctrl = comp.layers.addNull();
                ctrl.name = "MASAR_CTRL";
                try { ctrl.property("Anchor Point").setValue([0, 0, 0]); } catch (eAP0) {}
                ctrl.property("Position").setValue([compCenter[0], compCenter[1], 0]);
                ctrl.label = 13; // Gold / Yellow

                // 2. Baseline Shape Layer
                baseLayer = comp.layers.addShape();
                baseLayer.name = "MS_Baseline";
                baseLayer.parent = ctrl;
                try { baseLayer.property("Anchor Point").setValue([0, 0, 0]); } catch (eAP1) {}
                baseLayer.property("Position").setValue([0, 0, 0]);

                var baseContents = baseLayer.property("Contents") || baseLayer.property("ADBE Vectors Group");
                var baseGroup = baseContents.addProperty("ADBE Vector Group");
                baseGroup.name = "Line";

                var lineShape = new Shape();
                if (orientation === "horizontal") {
                    lineShape.vertices = [[-halfLen, 0], [halfLen, 0]];
                } else {
                    lineShape.vertices = [[0, -halfLen], [0, halfLen]];
                }
                lineShape.closed = false;
                addShapePath(baseGroup, lineShape, "LinePath");
                addShapeStroke(baseGroup, lineColor, lineWidth, lineCap, lineStyle, dashSize, dashGap, lineOpacity);

                if (startTerminal && startTerminal !== "none") {
                    addShapeTerminal(baseGroup, startTerminal, startPt, -1, orientation, terminalColor, terminalSize, "StartTerminal");
                }
                if (endTerminal && endTerminal !== "none") {
                    addShapeTerminal(baseGroup, endTerminal, endPt, 1, orientation, terminalColor, terminalSize, "EndTerminal");
                }

                // 3. Nodes Shape Layer
                nodesLayer = comp.layers.addShape();
                nodesLayer.name = "MS_Nodes";
                nodesLayer.parent = ctrl;
                try { nodesLayer.property("Anchor Point").setValue([0, 0, 0]); } catch (eAP2) {}
                nodesLayer.property("Position").setValue([0, 0, 0]);

            } else {
                // =========================================================
                // IN-PLACE SMART UPDATE (Modifies target elements directly)
                // =========================================================

                // Ensure baseline exists
                if (!baseLayer) {
                    baseLayer = comp.layers.addShape();
                    baseLayer.name = "MS_Baseline";
                }
                baseLayer.parent = ctrl;
                try { baseLayer.property("Anchor Point").setValue([0, 0, 0]); } catch (eAP1b) {}
                baseLayer.property("Position").setValue([0, 0, 0]);

                // Ensure nodes shape layer exists
                if (!nodesLayer) {
                    nodesLayer = comp.layers.addShape();
                    nodesLayer.name = "MS_Nodes";
                }
                nodesLayer.parent = ctrl;
                try { nodesLayer.property("Anchor Point").setValue([0, 0, 0]); } catch (eAP2b) {}
                nodesLayer.property("Position").setValue([0, 0, 0]);

                // Update Baseline in-place without layer deletion
                var baseContents = baseLayer.property("Contents") || baseLayer.property("ADBE Vectors Group");
                var baseGroup = baseContents.property("Line");
                if (!baseGroup) {
                    baseGroup = baseContents.addProperty("ADBE Vector Group");
                    baseGroup.name = "Line";
                }
                var bgContents = baseGroup.property("Contents") || baseGroup.property("ADBE Vectors Group");
                var linePathGroup = bgContents.property("LinePath");
                var lineShape = new Shape();
                if (orientation === "horizontal") {
                    lineShape.vertices = [[-halfLen, 0], [halfLen, 0]];
                } else {
                    lineShape.vertices = [[0, -halfLen], [0, halfLen]];
                }
                lineShape.closed = false;
                if (linePathGroup) {
                    try { linePathGroup.property("ADBE Vector Shape").setValue(lineShape); } catch (eLP) {}
                } else {
                    addShapePath(baseGroup, lineShape, "LinePath");
                }

                // Clean old strokes and terminals from baseGroup
                for (var bs = bgContents.numProperties; bs >= 1; bs--) {
                    var p = bgContents.property(bs);
                    if (p) {
                        var mName = "";
                        var pName = "";
                        try { mName = String(p.matchName); } catch (eMN) {}
                        try { pName = String(p.name); } catch (ePN) {}
                        if (mName === "ADBE Vector Graphic - Stroke" ||
                            pName === "StartTerminal" || pName === "EndTerminal" ||
                            pName === "ArrowTerminal" || pName === "DotTerminal" || pName === "BarTerminal") {
                            try { p.remove(); } catch (eRmP) {}
                        }
                    }
                }
                addShapeStroke(baseGroup, lineColor, lineWidth, lineCap, lineStyle, dashSize, dashGap, lineOpacity);

                if (startTerminal && startTerminal !== "none") {
                    addShapeTerminal(baseGroup, startTerminal, startPt, -1, orientation, terminalColor, terminalSize, "StartTerminal");
                }
                if (endTerminal && endTerminal !== "none") {
                    addShapeTerminal(baseGroup, endTerminal, endPt, 1, orientation, terminalColor, terminalSize, "EndTerminal");
                }
            }

            // =============================================================
            // NODES & TEXTS (Applied in-place directly to existing elements)
            // =============================================================
            var nodesContents = nodesLayer.property("Contents") || nodesLayer.property("ADBE Vectors Group");

            for (var i = 0; i < count; i++) {
                var posAlong = (count === 1) ? 0 : (-halfLen + margin + (i * step));
                var nodeData = nodes[i] || {};

                // Find or add vector group for node i in TR_Nodes
                var nGrp = nodesContents.property("Node_" + (i + 1));
                if (!nGrp) {
                    nGrp = nodesContents.addProperty("ADBE Vector Group");
                    nGrp.name = "Node_" + (i + 1);
                }

                // Cleanly clear existing vector properties of this node group
                var nc = nGrp.property("Contents") || nGrp.property("ADBE Vectors Group");
                if (nc) {
                    for (var np = nc.numProperties; np >= 1; np--) {
                        try { nc.property(np).remove(); } catch (eRmnc) {}
                    }
                }

                // Effective shape & individual overrides
                var effShape = (nodeData.customShape && nodeData.customShape !== "inherit" && nodeData.customShape !== "default")
                    ? String(nodeData.customShape)
                    : nodeShape;

                var isHollow = (nodeData.customShape && nodeData.customShape !== "inherit")
                    ? (nodeData.isHollow === true || effShape === "ring")
                    : (nodeShape === "ring");

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
                var cDrawShape = (cType !== "none");
                if (centerSrc && centerSrc.visible === false) { cDrawShape = false; }

                var cCenter = (orientation === "horizontal") ? [posAlong, 0] : [0, posAlong];

                // Optional guide tick connecting shape to baseline
                if (cDrawShape && nodeData.hasGuideTick === true && effShape !== "tick") {
                    addShapeTick(nGrp, posAlong, orientation, effSize + 8, tickColor, 2, "GuideTick");
                }

                // Single distinct shape rendering: only when center is shape-bearing
                if (cDrawShape) {
                    if (nodeData.vectorData && nodeData.vectorData.subPaths && nodeData.vectorData.subPaths.length > 0 && effShape !== "tick") {
                        addShapeCustomVector(nGrp, cCenter, nodeData.vectorData.subPaths, effFill, effStroke, effStrokeWidth, effShape);
                    } else if (effShape === "tick") {
                        var tH = (nodeData.customHeight && parseFloat(nodeData.customHeight) > 0) ? (parseFloat(nodeData.customHeight) / 2) : tickHalf;
                        var tW = (nodeData.customWidth && parseFloat(nodeData.customWidth) > 0) ? parseFloat(nodeData.customWidth) : tickWidth;
                        var tCol = (nodeData.customColor && String(nodeData.customColor).length > 0) ? parseColor(nodeData.customColor, tickColor) : tickColor;
                        addShapeTick(nGrp, posAlong, orientation, tH, tCol, tW, "Tick");
                    } else if (effShape === "ring") {
                        addShapeEllipse(nGrp, effSize, cCenter, null, effStroke, effStrokeWidth > 0 ? effStrokeWidth : 3, "Ring");
                    } else if (effShape === "square") {
                        addShapeRect(nGrp, effSize * 2, effSize * 2, cCenter, 0, effFill, effStroke, effStrokeWidth, "Square");
                    } else if (effShape === "diamond") {
                        addShapeDiamond(nGrp, effSize * 1.25, cCenter, effFill, effStroke, effStrokeWidth, "Diamond");
                    } else if (effShape === "triangle") {
                        addShapeTriangle(nGrp, effSize * 1.2, cCenter, effFill, effStroke, effStrokeWidth, "Triangle");
                    } else if (effShape === "hexagon") {
                        addShapeHexagon(nGrp, effSize * 1.15, cCenter, effFill, effStroke, effStrokeWidth, "Hexagon");
                    } else if (effShape === "star") {
                        addShapeStar(nGrp, effSize * 1.25, cCenter, effFill, effStroke, effStrokeWidth, "Star");
                    } else {
                        // Default: "circle"
                        addShapeEllipse(nGrp, effSize, cCenter, effFill, effStroke, effStrokeWidth, "Circle");
                    }
                }

                // Text Clearance based strictly on the single shape extent
                var nodeExtent = effSize;
                if (nodeData.vectorData && nodeData.vectorData.extent) {
                    nodeExtent = parseFloat(nodeData.vectorData.extent);
                } else if (effShape === "tick") {
                    nodeExtent = (nodeData.customHeight && parseFloat(nodeData.customHeight) > 0) ? (parseFloat(nodeData.customHeight) / 2) : tickHalf;
                } else if (nodeData.hasGuideTick === true) {
                    nodeExtent = Math.max(effSize, effSize + 8);
                }
                var topClear = nodeExtent + topOffset + 4;
                var botClear = nodeExtent + bottomOffset + 4;

                // =========================================================
                // TRIPLE-SOURCE LAYERS IN-PLACE UPDATE (Center, Front, Behind)
                // =========================================================

                // 1. CENTER SOURCE: Core Node Number or Text (Positioned directly on track center)
                var centerVal = "";
                if (cType === "shape_number" || cType === "number" || cType === "text") {
                    centerVal = centerSrc ? String(centerSrc.value || "") : String(nodeData.number || "");
                } else if (cType === "icon" || cType === "shape_icon") {
                    centerVal = centerSrc ? String(centerSrc.icon || centerSrc.value || "") : "";
                }

                var nLayer = null;
                try { nLayer = comp.layer("MS_Node_" + (i + 1) + "_Num") || comp.layer("TR_Node_" + (i + 1) + "_Num"); } catch (eNL) { nLayer = null; }

                if (centerVal.length > 0 && cType !== "none" && cType !== "shape") {
                    if (!nLayer) {
                        nLayer = comp.layers.addText(centerVal);
                        nLayer.name = "MS_Node_" + (i + 1) + "_Num";
                        nLayer.parent = ctrl;
                    }
                    var nProp = nLayer.property("Source Text");
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
                        try { nDoc.fontSize = (cType === "text") ? Math.max(9, Math.round(effSize * 0.7)) : Math.max(10, Math.round(effSize * 0.95)); } catch (eNS) {}
                        // High contrast text inside node shape
                        var effCenterCol = [0.05, 0.05, 0.05]; // Black for white/light shapes
                        if (isHollow || (effFill && (effFill[0] * 0.299 + effFill[1] * 0.587 + effFill[2] * 0.114) < 0.5)) {
                            effCenterCol = [0.98, 0.98, 0.98]; // White for dark shapes
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
                    } else {
                        try { nProp.setValue(effCenterText); } catch (eSetNRaw2) {}
                    }

                    var nRect = nLayer.sourceRectAtTime(0, false);
                    var nAp = [nRect.left + (nRect.width / 2), nRect.top + (nRect.height / 2), 0];
                    var nPos = (orientation === "horizontal") ? [posAlong, 0, 0] : [0, posAlong, 0];

                    try {
                        nLayer.property("Anchor Point").setValue(nAp);
                        nLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2, 0];';
                    } catch (eNAp) {}

                    nLayer.property("Position").setValue(nPos);
                    try { nLayer.property("Position").expression = ""; } catch (eNPos) {}
                    nLayer.enabled = true;
                } else if (nLayer) {
                    nLayer.enabled = false;
                }

                // 2. FRONT SOURCE: Top / Front Stream (Title, Text, Bullet List, Badge, Icon)
                var frontSrc = (nodeData.sources && nodeData.sources.front) ? nodeData.sources.front : null;
                var fType = frontSrc ? frontSrc.type : (nodeData.description ? "title_text" : "title");
                var fVis = frontSrc ? (frontSrc.visible !== false && fType !== "none") : (nodeData.title ? true : false);

                var titleText = "";
                var descText = "";

                if (fVis) {
                    var partsTitle = [];
                    var rawIcon = (frontSrc && frontSrc.icon) ? trimStr(frontSrc.icon) : "";
                    var rawBadge = (frontSrc && (frontSrc.number !== undefined || frontSrc.badge !== undefined || frontSrc.value !== undefined || (fType === "badge" && frontSrc.text !== undefined)))
                        ? trimStr(frontSrc.number !== undefined ? frontSrc.number : (frontSrc.badge !== undefined ? frontSrc.badge : (frontSrc.value !== undefined ? frontSrc.value : frontSrc.text)))
                        : "";
                    var rawTitle = (frontSrc && frontSrc.title) ? trimStr(frontSrc.title) : ((nodeData && nodeData.title && frontSrc.showTitle !== false) ? trimStr(nodeData.title) : "");

                    if (rawIcon && (frontSrc.showIcon === true || fType === "icon_title")) {
                        partsTitle.push(rawIcon);
                    }
                    if (rawBadge && (frontSrc.showBadge === true || fType === "number_title" || fType === "badge" || fType === "number_text")) {
                        partsTitle.push(rawBadge);
                    }
                    if (rawTitle && (frontSrc.showTitle === true || (frontSrc.showTitle !== false && fType !== "text" && fType !== "list" && fType !== "badge" && fType !== "number_text"))) {
                        partsTitle.push(rawTitle);
                    }

                    titleText = partsTitle.join(" ");

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
                        var rawDesc = (frontSrc && frontSrc.text !== undefined) ? trimStr(frontSrc.text) : ((nodeData && nodeData.description && frontSrc.showDesc !== false) ? trimStr(nodeData.description) : "");
                        if (rawDesc.length > 0 && rawDesc !== titleText) {
                            descText = rawDesc;
                        }
                    }
                }

                var hasTitle = (fVis && titleText.length > 0);
                var hasDesc = (fVis && descText.length > 0);

                var nodeSide = nodeData.contentSide || globalContentSide;
                var effSide = nodeSide;

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
                        // In vertical mode:
                        // If Front content is on the Left, right-justify towards the line (standard RTL / Left Side)
                        // If Front content is on the Right, left-justify towards the line (standard LTR / Right Side)
                        if (effSide === "left") {
                            frontJustify = ParagraphJustification.RIGHT_JUSTIFY;
                            behindJustify = ParagraphJustification.LEFT_JUSTIFY;
                        } else {
                            frontJustify = ParagraphJustification.LEFT_JUSTIFY;
                            behindJustify = ParagraphJustification.RIGHT_JUSTIFY;
                        }
                    }
                }

                // Front Title Layer
                var tLayer = null;
                try { tLayer = comp.layer("MS_Node_" + (i + 1) + "_Title") || comp.layer("TR_Node_" + (i + 1) + "_Title"); } catch (eTL) { tLayer = null; }

                if (hasTitle) {
                    if (!tLayer) {
                        tLayer = comp.layers.addText(titleText);
                        tLayer.name = "MS_Node_" + (i + 1) + "_Title";
                        tLayer.parent = ctrl;
                    }
                    var tProp = tLayer.property("Source Text");
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
                    } else {
                        try { tProp.setValue(effTitleStr); } catch (eSetTRaw2) {}
                    }
                    tLayer.enabled = true;
                } else if (tLayer) {
                    tLayer.enabled = false;
                }

                // Front Description / List Layer
                var dLayer = null;
                try { dLayer = comp.layer("MS_Node_" + (i + 1) + "_Desc") || comp.layer("TR_Node_" + (i + 1) + "_Desc"); } catch (eDL) { dLayer = null; }

                if (hasDesc) {
                    if (!dLayer) {
                        dLayer = comp.layers.addText(descText);
                        dLayer.name = "MS_Node_" + (i + 1) + "_Desc";
                        dLayer.parent = ctrl;
                    }
                    var dProp = dLayer.property("Source Text");
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
                    } else {
                        try { dProp.setValue(effDescStr); } catch (eSetDRaw2) {}
                    }
                    dLayer.enabled = true;
                } else if (dLayer) {
                    dLayer.enabled = false;
                }

                // Front Source Box Settings (Title & Desc)
                var fBoxTitle = resolveBoxSettings(frontSrc, nodeData, "title");
                var fBoxDesc = resolveBoxSettings(frontSrc, nodeData, "desc");
                var vertGap = (fBoxTitle.enabled || fBoxDesc.enabled) ? Math.max(14, globalBoxPaddingV + 8) : 6;
                var hBoxGap = (fBoxTitle.enabled || fBoxDesc.enabled) ? Math.max(14, globalBoxPaddingV * 2 + 6) : 8;

                // Anchoring & Positioning for Front Stream (Title & Desc)
                if (orientation === "horizontal") {
                    if (effSide === "bottom") {
                        // Front stream sits BELOW the timeline (Y > 0 at +topClear)
                        if (hasTitle && hasDesc) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left + (tRect.width / 2), tRect.top, 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([posAlong, +topClear, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}

                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left + (dRect.width / 2), dRect.top, 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([posAlong, +topClear + tRect.height + hBoxGap, 0]);
                            try {
                                dLayer.property("Position").expression = 
                                    'var t = null; try { t = thisComp.layer("MS_Node_' + (i + 1) + '_Title") || thisComp.layer("TR_Node_' + (i + 1) + '_Title"); } catch(e){};' +
                                    'var tH = (t && t.enabled) ? (t.sourceRectAtTime(time, false).height + ' + hBoxGap + ') : 0;' +
                                    '[' + posAlong + ', +' + topClear + ' + tH, 0];';
                            } catch(e){}
                        } else if (hasTitle) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left + (tRect.width / 2), tRect.top, 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([posAlong, +topClear, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}
                        } else if (hasDesc) {
                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left + (dRect.width / 2), dRect.top, 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([posAlong, +topClear, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}
                        }
                    } else {
                        // Default: effSide === "top", Front stream sits ABOVE the timeline (Y < 0 at -topClear)
                        if (hasTitle && hasDesc) {
                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left + (dRect.width / 2), dRect.top + dRect.height, 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([posAlong, -topClear, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}

                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left + (tRect.width / 2), tRect.top + tRect.height, 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([posAlong, -topClear - dRect.height - hBoxGap, 0]);
                            try {
                                tLayer.property("Position").expression = 
                                    'var d = null; try { d = thisComp.layer("MS_Node_' + (i + 1) + '_Desc") || thisComp.layer("TR_Node_' + (i + 1) + '_Desc"); } catch(e){};' +
                                    'var dH = (d && d.enabled) ? (d.sourceRectAtTime(time, false).height + ' + hBoxGap + ') : 0;' +
                                    '[' + posAlong + ', -' + topClear + ' - dH, 0];';
                            } catch(e){}
                        } else if (hasTitle) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left + (tRect.width / 2), tRect.top + tRect.height, 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([posAlong, -topClear, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}
                        } else if (hasDesc) {
                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left + (dRect.width / 2), dRect.top + dRect.height, 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([posAlong, -topClear, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}
                        }
                    }
                } else {
                    // Vertical mode
                    if (effSide === "right") {
                        // Front stream sits strictly to the RIGHT of the timeline (X > 0 at +topClear)
                        if (hasTitle && hasDesc) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left, tRect.top + tRect.height, 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([+topClear, posAlong - vertGap, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}

                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left, dRect.top, 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left, r.top, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([+topClear, posAlong + vertGap, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}
                        } else if (hasTitle) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left, tRect.top + (tRect.height / 2), 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height / 2, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([+topClear, posAlong, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}
                        } else if (hasDesc) {
                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left, dRect.top + (dRect.height / 2), 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height / 2, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([+topClear, posAlong, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}
                        }
                    } else {
                        // Default: effSide === "left", Front stream sits strictly to the LEFT of the timeline (X < 0 at -topClear)
                        if (hasTitle && hasDesc) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left + tRect.width, tRect.top + tRect.height, 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([-topClear, posAlong - vertGap, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}

                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left + dRect.width, dRect.top, 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([-topClear, posAlong + vertGap, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}
                        } else if (hasTitle) {
                            var tRect = tLayer.sourceRectAtTime(0, false);
                            var tAp = [tRect.left + tRect.width, tRect.top + (tRect.height / 2), 0];
                            tLayer.property("Anchor Point").setValue(tAp);
                            try { tLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height / 2, 0];'; } catch(e){}
                            tLayer.property("Position").setValue([-topClear, posAlong, 0]);
                            try { tLayer.property("Position").expression = ""; } catch(e){}
                        } else if (hasDesc) {
                            var dRect = dLayer.sourceRectAtTime(0, false);
                            var dAp = [dRect.left + dRect.width, dRect.top + (dRect.height / 2), 0];
                            dLayer.property("Anchor Point").setValue(dAp);
                            try { dLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height / 2, 0];'; } catch(e){}
                            dLayer.property("Position").setValue([-topClear, posAlong, 0]);
                            try { dLayer.property("Position").expression = ""; } catch(e){}
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
                    var bBadge = (behindSrc && (behindSrc.number !== undefined || behindSrc.badge !== undefined || behindSrc.value !== undefined || (bType === "badge" && behindSrc.text !== undefined)))
                        ? trimStr(behindSrc.number !== undefined ? behindSrc.number : (behindSrc.badge !== undefined ? behindSrc.badge : (behindSrc.value !== undefined ? behindSrc.value : behindSrc.text)))
                        : "";
                    var bTitle = (behindSrc && behindSrc.title) ? trimStr(behindSrc.title) : "";
                    var bText = (behindSrc && behindSrc.text) ? trimStr(behindSrc.text) : "";

                    if (bIcon && (behindSrc.showIcon || bType === "icon_title")) partsBehind.push(bIcon);
                    if (bBadge && (behindSrc.showBadge || bType === "number_title" || bType === "number_text" || bType === "number" || bType === "badge")) partsBehind.push(bBadge);
                    if (bTitle && (behindSrc.showTitle !== false || bType === "title" || bType === "title_text")) partsBehind.push(bTitle);

                    if (behindSrc.showList || bType === "list") {
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
                            var listStr = "\u2022 " + bText.replace(/\n/g, "\r\u2022 ");
                            if (partsBehind.length > 0) partsBehind.push("\r" + listStr);
                            else partsBehind.push(listStr);
                        }
                    } else if (bText && (behindSrc.showDesc !== false || bType === "title_text" || bType === "text" || bType === "number_text")) {
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

                var bLayer = null;
                try { bLayer = comp.layer("MS_Node_" + (i + 1) + "_Behind") || comp.layer("TR_Node_" + (i + 1) + "_Behind"); } catch (eBL) { bLayer = null; }

                if (bVis && behindText.length > 0) {
                    if (!bLayer) {
                        bLayer = comp.layers.addText(behindText);
                        bLayer.name = "MS_Node_" + (i + 1) + "_Behind";
                        bLayer.parent = ctrl;
                    }
                    var bProp = bLayer.property("Source Text");
                    var bDoc = null;
                    try { bDoc = bProp.value; } catch (eBDoc) { bDoc = null; }
                    var effBehindStr = toStandardDigits(behindText);
                    var effBehindSize = (behindSrc && typeof behindSrc.fontSize === "number" && behindSrc.fontSize > 0)
                        ? behindSrc.fontSize
                        : ((nodeData && typeof nodeData.behindFontSize === "number" && nodeData.behindFontSize > 0) ? nodeData.behindFontSize : Math.max(10, Math.round(descFontSize * 0.95)));
                    var effBehindColor = (behindSrc && (behindSrc.color || behindSrc.textColor))
                        ? parseColor(behindSrc.color || behindSrc.textColor, parseColor("#ffb833", [1.0, 0.72, 0.2]))
                        : ((nodeData && nodeData.behindColor) ? parseColor(nodeData.behindColor, parseColor("#ffb833", [1.0, 0.72, 0.2])) : parseColor("#ffb833", [1.0, 0.72, 0.2]));

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
                    } else {
                        try { bProp.setValue(effBehindStr); } catch (eSetBRaw2) {}
                    }

                    var bRect = bLayer.sourceRectAtTime(0, false);
                    if (orientation === "horizontal") {
                        if (effSide === "bottom") {
                            // When Front is bottom, Behind sits ABOVE the line (Y < 0 at -botClear)
                            bLayer.property("Anchor Point").setValue([bRect.left + (bRect.width / 2), bRect.top + bRect.height, 0]);
                            try { bLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height, 0];'; } catch(e){}
                            bLayer.property("Position").setValue([posAlong, -botClear, 0]);
                        } else {
                            // When Front is top, Behind sits BELOW the line (Y > 0 at +botClear)
                            bLayer.property("Anchor Point").setValue([bRect.left + (bRect.width / 2), bRect.top, 0]);
                            try { bLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top, 0];'; } catch(e){}
                            bLayer.property("Position").setValue([posAlong, +botClear, 0]);
                        }
                    } else {
                        // Vertical mode
                        if (effSide === "right") {
                            // When Front is on the Right, Behind sits on the LEFT (X < 0 at -botClear)
                            bLayer.property("Anchor Point").setValue([bRect.left + bRect.width, bRect.top + (bRect.height / 2), 0]);
                            try { bLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height / 2, 0];'; } catch(e){}
                            bLayer.property("Position").setValue([-botClear, posAlong, 0]);
                        } else {
                            // When Front is on the Left, Behind sits on the RIGHT (X > 0 at +botClear)
                            bLayer.property("Anchor Point").setValue([bRect.left, bRect.top + (bRect.height / 2), 0]);
                            try { bLayer.property("Anchor Point").expression = 'var r = sourceRectAtTime(time, false); [r.left, r.top + r.height / 2, 0];'; } catch(e){}
                            bLayer.property("Position").setValue([+botClear, posAlong, 0]);
                        }
                    }
                    try { bLayer.property("Position").expression = ""; } catch (eBExp) {}
                    bLayer.enabled = true;
                } else if (bLayer) {
                    bLayer.enabled = false;
                }

                // 4. SHAPE BOXES FOR SIDE STREAMS (Title, Desc, Behind - Excludes Icons)
                var bBoxSettings = resolveBoxSettings(behindSrc, nodeData, "behind");
                var tBox = createOrUpdateTextBox(comp, (hasTitle && fType !== "icon" && fType !== "icon_title") ? tLayer : null, "MS_Node_" + (i + 1) + "_Title_Box", fBoxTitle);
                var dBox = createOrUpdateTextBox(comp, hasDesc ? dLayer : null, "MS_Node_" + (i + 1) + "_Desc_Box", fBoxDesc);
                var bBox = createOrUpdateTextBox(comp, (bVis && behindText.length > 0 && bType !== "icon" && bType !== "icon_title") ? bLayer : null, "MS_Node_" + (i + 1) + "_Behind_Box", bBoxSettings);

                // Stack ordering: ensure text layers are on top of their box layers
                if (tLayer && tLayer.enabled && dLayer && dLayer.enabled) {
                    dLayer.moveAfter(tLayer);
                    if (tBox) tBox.moveAfter(dLayer);
                    if (dBox) dBox.moveAfter(tBox ? tBox : dLayer);
                } else if (tLayer && tLayer.enabled) {
                    if (tBox) tBox.moveAfter(tLayer);
                } else if (dLayer && dLayer.enabled) {
                    if (dBox) dBox.moveAfter(dLayer);
                }
                if (bLayer && bLayer.enabled && bBox) {
                    bBox.moveAfter(bLayer);
                }
            }

            // Cleanup extra layers if count was reduced
            for (var oldIdx = count + 1; oldIdx <= 150; oldIdx++) {
                var hadAny = false;
                var oldGrp = nodesContents.property("Node_" + oldIdx);
                if (oldGrp) { try { oldGrp.remove(); hadAny = true; } catch (eOG) {} }

                var oldT = null; try { oldT = comp.layer("MS_Node_" + oldIdx + "_Title") || comp.layer("TR_Node_" + oldIdx + "_Title"); } catch (e) {}
                if (oldT) { try { oldT.remove(); hadAny = true; } catch (e) {} }

                var oldTB = null; try { oldTB = comp.layer("MS_Node_" + oldIdx + "_Title_Box") || comp.layer("TR_Node_" + oldIdx + "_Title_Box"); } catch (e) {}
                if (oldTB) { try { oldTB.remove(); hadAny = true; } catch (e) {} }

                var oldD = null; try { oldD = comp.layer("MS_Node_" + oldIdx + "_Desc") || comp.layer("TR_Node_" + oldIdx + "_Desc"); } catch (e) {}
                if (oldD) { try { oldD.remove(); hadAny = true; } catch (e) {} }

                var oldDB = null; try { oldDB = comp.layer("MS_Node_" + oldIdx + "_Desc_Box") || comp.layer("TR_Node_" + oldIdx + "_Desc_Box"); } catch (e) {}
                if (oldDB) { try { oldDB.remove(); hadAny = true; } catch (e) {} }

                var oldN = null; try { oldN = comp.layer("MS_Node_" + oldIdx + "_Num") || comp.layer("TR_Node_" + oldIdx + "_Num"); } catch (e) {}
                if (oldN) { try { oldN.remove(); hadAny = true; } catch (e) {} }

                var oldB = null; try { oldB = comp.layer("MS_Node_" + oldIdx + "_Behind") || comp.layer("TR_Node_" + oldIdx + "_Behind"); } catch (e) {}
                if (oldB) { try { oldB.remove(); hadAny = true; } catch (e) {} }

                var oldBB = null; try { oldBB = comp.layer("MS_Node_" + oldIdx + "_Behind_Box") || comp.layer("TR_Node_" + oldIdx + "_Behind_Box"); } catch (e) {}
                if (oldBB) { try { oldBB.remove(); hadAny = true; } catch (e) {} }

                if (!hadAny) { break; }
            }

            // Clean up any residual motion rig artifacts if present
            try {
                var oldCam = comp.layer("TR_Camera") || comp.layer("MS_Camera");
                if (oldCam) oldCam.remove();
            } catch (eC) {}
            try {
                var oldCamTgt = comp.layer("TR_Camera_Target") || comp.layer("MS_Camera_Target");
                if (oldCamTgt) oldCamTgt.remove();
            } catch (eCT) {}
            try {
                var oldProg = ctrl.effect("Timeline Progress");
                if (oldProg) oldProg.remove();
            } catch (eP) {}

            if (!TR._activeUndoSession) { app.endUndoGroup(); }

            // Deselect newly created layers so AE selection does not jump or steal panel focus
            try {
                if (comp && comp.selectedLayers) {
                    for (var dsl = comp.selectedLayers.length - 1; dsl >= 0; dsl--) {
                        comp.selectedLayers[dsl].selected = false;
                    }
                }
            } catch (eDsel) {}

            return TR.JSON.stringify({
                ok: true,
                code: "OK",
                message: "MASAR generated successfully with " + count + " nodes.",
                data: { count: count, orientation: orientation }
            });

        } catch (eGen) {
            if (!TR._activeUndoSession) { app.endUndoGroup(); }
            return TR.JSON.stringify({
                ok: false,
                code: "GENERATE_FAILED",
                message: "Error generating MASAR: " + String(eGen && eGen.message ? eGen.message : eGen) + (eGen && eGen.line ? " @line " + eGen.line : ""),
                data: null
            });
        }
    }
};

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
