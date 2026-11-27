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
