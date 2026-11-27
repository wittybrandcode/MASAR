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
