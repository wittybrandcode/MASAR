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
