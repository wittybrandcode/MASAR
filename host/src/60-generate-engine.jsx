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
