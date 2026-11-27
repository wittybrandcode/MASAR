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
