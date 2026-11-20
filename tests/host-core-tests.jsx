// ============================================================================
// TIME RULER — Host Core Test Runner (ExtendScript ES3, environment-agnostic)
// ============================================================================
// Runs the geometry/numeric/calendar/timecode case suites from
// tests/geometry-cases.json, tests/config-cases.json,
// tests/calendar-cases.json and tests/timecode-cases.json in EITHER
// environment:
//
//   - After Effects 2023+ : run as a script (File > Scripts > Run Script File,
//     or via the panel). Detects `app`, loads host/lib/json2.jsxinc (optional
//     native-JSON fallback) + host/core/*.jsxinc via $.evalFile relative to
//     this file, reads the case JSONs with the File object, prints per-case
//     lines with $.write, writes tests/results-ae.json and alerts the summary.
//
//   - Node 22             : tests/node-harness.js pre-loads the namespace shim
//     and the ES3 modules, evals this file, then calls
//     TIME_RULER.tests.core.runAll(geoCases, cfgCases, calCases, tcCases),
//     prints the lines and sets process.exitCode.
//
// Public API (attached to the TIME_RULER namespace as TR.tests.core):
//   runAll(geoCases, cfgCases, calCases, tcCases) -> { passed, failed, total, lines }
//   main()                     -> AE entry; loads modules/cases, runs, reports.
//
// Output per case: "[PASS] <id>" or "[FAIL] <id> — <reason>", then
// "SUMMARY {passed:N, failed:M, total:T}".
//
// PURE TEST LOGIC (ES3): no let/const, no arrows, no template literals,
// no map/forEach/filter/reduce, no Object.keys, no String.trim.
// M4 additions (additive only, existing case grammar untouched):
//   kinds calendar | timecode | resolveFps | timecodeString | daysInMonth |
//   parseISO | calendarLabel | utcMs | frameFromSeconds
//   expect.labelsArray / expect.msArray (sequence-like results),
//   boolean values in expect.fields (e.g. dropFrameAllowed).
// ============================================================================

var TR = (function () {
    try {
        if (typeof $ !== 'undefined' && $.global && $.global.TIME_RULER) {
            return $.global.TIME_RULER;
        }
    } catch (eNs) {}
    try {
        if (typeof global !== 'undefined' && global.TIME_RULER) {
            return global.TIME_RULER;
        }
    } catch (eNs2) {}
    return undefined;
})();

TR = TR || {};
TR.tests = TR.tests || {};
TR.tests.core = (function () {

    var DEFAULT_TOL = 1e-6;

    // ------------------------------------------------------------- utilities

    function approx(a, b, tol) {
        if (typeof a !== 'number' || typeof b !== 'number') { return false; }
        var t = (typeof tol === 'number') ? tol : DEFAULT_TOL;
        return Math.abs(a - b) <= t;
    }

    function fmtNum(v) {
        if (typeof v !== 'number') { return String(v); }
        var s = String(v);
        if (s.length > 12) { s = s.substring(0, 12); }
        return s;
    }

    function describeErr(err) {
        if (!err) { return "unknown error"; }
        if (err.code) { return "code=" + err.code; }
        if (err.message) { return String(err.message); }
        return String(err);
    }

    function result() {
        return { passed: 0, failed: 0, total: 0, lines: [] };
    }

    function pass(r, id) {
        r.passed++; r.total++;
        r.lines[r.lines.length] = "[PASS] " + id;
    }

    function fail(r, id, why) {
        r.failed++; r.total++;
        r.lines[r.lines.length] = "[FAIL] " + id + " — " + why;
    }

    // Field checker: compare selected fields of an object against a spec.
    // Numbers approx, strings and booleans exact. The "note" key is
    // documentation only.
    function checkFields(r, id, obj, spec, tol) {
        var key;
        for (key in spec) {
            if (!spec.hasOwnProperty(key) || key === "note") { continue; }
            var want = spec[key];
            var got = obj ? obj[key] : undefined;
            if (typeof want === 'string') {
                if (got !== want) {
                    fail(r, id, key + ": expected \"" + want + "\" got \"" + String(got) + "\"");
                    return false;
                }
            } else if (typeof want === 'boolean') {
                if (got !== want) {
                    fail(r, id, key + ": expected " + want + " got " + String(got));
                    return false;
                }
            } else if (!approx(got, want, tol)) {
                fail(r, id, key + ": expected " + fmtNum(want) + " got " + fmtNum(got));
                return false;
            }
        }
        return true;
    }

    // ---------------------------------------------------------- case dispatch

    function execute(kind, input) {
        var G = TR.core.geometry;
        var NT = TR.core.numericTime;
        var CAL = TR.core.calendarTime;
        var TCE = TR.core.timecode;
        if (!G || !NT) { throw new Error("core modules not loaded"); }

        if (kind === "degToRad") {
            return { rad: G.degToRad(input.deg) };
        }
        if (kind === "pointOnCircle") {
            return G.pointOnCircle(input.cx, input.cy, input.radius, input.angleDeg);
        }
        if (kind === "outVector") {
            return G.outVector(input.angleDeg);
        }
        if (kind === "distributeCircular") {
            return { items: G.distributeCircular(input.count, input.startAngleDeg, input.sweepDeg, input.mode, input.seamGapDegrees) };
        }
        if (kind === "distributeArc") {
            return { items: G.distributeArc(input.count, input.startAngleDeg, input.sweepDeg) };
        }
        if (kind === "distributeLinear") {
            return { items: G.distributeLinear(input.count, input.startX, input.startY, input.length, input.orientation, input.direction) };
        }
        if (kind === "sequence") {
            var tc = (input.timeCfg) ? input.timeCfg : input;
            return NT.sequence(tc);
        }
        if (kind === "format") {
            var tc2 = (input.timeCfg) ? input.timeCfg : input;
            return NT.format(input.value, tc2);
        }
        if (kind === "buildTickPlan") {
            return G.buildTickPlan(input.cfg, input.compInfo);
        }
        // ---- M4 calendar / timecode kinds (additive) ----
        if (kind === "calendar") {
            if (!CAL) { throw new Error("calendarTime module not loaded"); }
            var ctc = (input.timeCfg) ? input.timeCfg : input;
            return CAL.sequence(ctc);
        }
        if (kind === "timecode") {
            if (!TCE) { throw new Error("timecode module not loaded"); }
            var ttc = (input.timeCfg) ? input.timeCfg : input;
            return TCE.sequence(ttc, input.compInfo);
        }
        if (kind === "resolveFps") {
            if (!TCE) { throw new Error("timecode module not loaded"); }
            return TCE.resolveFps(input.timeCfg ? input.timeCfg : input, input.compInfo);
        }
        if (kind === "timecodeString") {
            if (!TCE) { throw new Error("timecode module not loaded"); }
            return TCE.timecodeString(input.frame, input.num, input.den, input.drop);
        }
        if (kind === "frameFromSeconds") {
            if (!TCE) { throw new Error("timecode module not loaded"); }
            return TCE.frameFromSeconds(input.seconds, input.num, input.den);
        }
        if (kind === "daysInMonth") {
            if (!CAL) { throw new Error("calendarTime module not loaded"); }
            return CAL.daysInMonth(input.y, input.m);
        }
        if (kind === "parseISO") {
            if (!CAL) { throw new Error("calendarTime module not loaded"); }
            return CAL.parseISO(input.s);
        }
        if (kind === "calendarLabel") {
            if (!CAL) { throw new Error("calendarTime module not loaded"); }
            return CAL.labelFor(input.value, input.timeCfg ? input.timeCfg : input);
        }
        if (kind === "utcMs") {
            if (!CAL) { throw new Error("calendarTime module not loaded"); }
            return CAL.utcMs(input);
        }
        throw new Error("unknown case kind: " + kind);
    }

    // ------------------------------------------------------------ expectation

    function listOf(kind, res) {
        if (kind === "sequence") { return res.values; }
        if (kind === "buildTickPlan") { return null; }
        return res.items;
    }

    function checkItems(r, id, items, expect, tol) {
        var i, key;

        if (expect.count !== undefined && items.length !== expect.count) {
            fail(r, id, "count: expected " + expect.count + " got " + items.length);
            return false;
        }
        if (expect.first) {
            if (!checkFields(r, id, items[0], expect.first, tol)) { return false; }
        }
        if (expect.last) {
            if (!checkFields(r, id, items[items.length - 1], expect.last, tol)) { return false; }
        }
        if (expect.itemAt) {
            var idx = expect.itemAt.index;
            var spec = {};
            for (key in expect.itemAt) {
                if (expect.itemAt.hasOwnProperty(key) && key !== "index") {
                    spec[key] = expect.itemAt[key];
                }
            }
            if (!checkFields(r, id, items[idx], spec, tol)) { return false; }
        }
        if (expect.anglesAscending || expect.anglesDescending) {
            for (i = 1; i < items.length; i++) {
                var a0 = items[i - 1].angleDeg;
                var a1 = items[i].angleDeg;
                if (expect.anglesAscending && a1 < a0 - tol) {
                    fail(r, id, "anglesAscending violated at " + i + ": " + fmtNum(a0) + " > " + fmtNum(a1));
                    return false;
                }
                if (expect.anglesDescending && a1 > a0 + tol) {
                    fail(r, id, "anglesDescending violated at " + i);
                    return false;
                }
            }
        }
        if (expect.tAscending) {
            for (i = 1; i < items.length; i++) {
                if (items[i].t < items[i - 1].t - tol) {
                    fail(r, id, "tAscending violated at " + i);
                    return false;
                }
            }
        }
        if (expect.anglesUnique) {
            for (i = 0; i < items.length; i++) {
                var j;
                for (j = i + 1; j < items.length; j++) {
                    if (approx(items[i].angleDeg, items[j].angleDeg, tol)) {
                        fail(r, id, "anglesUnique violated: items " + i + "," + j + " both near " + fmtNum(items[i].angleDeg));
                        return false;
                    }
                }
            }
        }
        if (expect.noAngleNear !== undefined) {
            for (i = 0; i < items.length; i++) {
                if (approx(items[i].angleDeg, expect.noAngleNear, tol)) {
                    fail(r, id, "noAngleNear " + fmtNum(expect.noAngleNear) + " violated by item " + i);
                    return false;
                }
            }
        }
        if (expect.angleStep !== undefined) {
            for (i = 1; i < items.length; i++) {
                var d = items[i].angleDeg - items[i - 1].angleDeg;
                if (!approx(d, expect.angleStep, tol)) {
                    fail(r, id, "angleStep: item " + i + " delta " + fmtNum(d) + " expected " + fmtNum(expect.angleStep));
                    return false;
                }
            }
        }
        if (expect.maxAngleDeg !== undefined || expect.minAngleDeg !== undefined) {
            var mx = items[0].angleDeg, mn = items[0].angleDeg;
            for (i = 1; i < items.length; i++) {
                if (items[i].angleDeg > mx) { mx = items[i].angleDeg; }
                if (items[i].angleDeg < mn) { mn = items[i].angleDeg; }
            }
            if (expect.maxAngleDeg !== undefined && !approx(mx, expect.maxAngleDeg, tol)) {
                fail(r, id, "maxAngleDeg: expected " + fmtNum(expect.maxAngleDeg) + " got " + fmtNum(mx));
                return false;
            }
            if (expect.minAngleDeg !== undefined && !approx(mn, expect.minAngleDeg, tol)) {
                fail(r, id, "minAngleDeg: expected " + fmtNum(expect.minAngleDeg) + " got " + fmtNum(mn));
                return false;
            }
        }
        if (expect.tFirst !== undefined && !approx(items[0].t, expect.tFirst, tol)) {
            fail(r, id, "tFirst: expected " + fmtNum(expect.tFirst) + " got " + fmtNum(items[0].t));
            return false;
        }
        if (expect.tLast !== undefined && !approx(items[items.length - 1].t, expect.tLast, tol)) {
            fail(r, id, "tLast: expected " + fmtNum(expect.tLast) + " got " + fmtNum(items[items.length - 1].t));
            return false;
        }
        if (expect.constField) {
            var f = expect.constField.field;
            var fv = expect.constField.value;
            for (i = 0; i < items.length; i++) {
                if (!approx(items[i][f], fv, tol)) {
                    fail(r, id, "constField " + f + " violated at " + i + ": " + fmtNum(items[i][f]));
                    return false;
                }
            }
        }
        return true;
    }

    function checkSequence(r, id, res, expect, tol) {
        if (expect.count !== undefined && res.count !== expect.count) {
            fail(r, id, "count: expected " + expect.count + " got " + res.count);
            return false;
        }
        if (expect.count !== undefined && res.values.length !== expect.count) {
            fail(r, id, "values.length: expected " + expect.count + " got " + res.values.length);
            return false;
        }
        if (expect.endIncluded !== undefined && res.endIncluded !== expect.endIncluded) {
            fail(r, id, "endIncluded: expected " + expect.endIncluded + " got " + res.endIncluded);
            return false;
        }
        if (expect.cyclic !== undefined && res.cyclic !== expect.cyclic) {
            fail(r, id, "cyclic: expected " + expect.cyclic + " got " + res.cyclic);
            return false;
        }
        if (!checkItems(r, id, res.values, expect, tol)) { return false; }
        if (expect.valuesArray) {
            if (res.values.length !== expect.valuesArray.length) {
                fail(r, id, "valuesArray length: expected " + expect.valuesArray.length + " got " + res.values.length);
                return false;
            }
            var i;
            for (i = 0; i < expect.valuesArray.length; i++) {
                if (!approx(res.values[i].value, expect.valuesArray[i], tol)) {
                    fail(r, id, "valuesArray[" + i + "]: expected " + fmtNum(expect.valuesArray[i]) + " got " + fmtNum(res.values[i].value));
                    return false;
                }
            }
        }
        if (expect.msArray) {
            if (res.values.length !== expect.msArray.length) {
                fail(r, id, "msArray length: expected " + expect.msArray.length + " got " + res.values.length);
                return false;
            }
            var k;
            for (k = 0; k < expect.msArray.length; k++) {
                if (!approx(res.values[k].ms, expect.msArray[k], tol)) {
                    fail(r, id, "msArray[" + k + "]: expected " + fmtNum(expect.msArray[k]) + " got " + fmtNum(res.values[k].ms));
                    return false;
                }
            }
        }
        if (expect.labelsArray) {
            if (res.values.length !== expect.labelsArray.length) {
                fail(r, id, "labelsArray length: expected " + expect.labelsArray.length + " got " + res.values.length);
                return false;
            }
            var l;
            for (l = 0; l < expect.labelsArray.length; l++) {
                if (res.values[l].label !== expect.labelsArray[l]) {
                    fail(r, id, "labelsArray[" + l + "]: expected \"" + expect.labelsArray[l] + "\" got \"" + String(res.values[l].label) + "\"");
                    return false;
                }
            }
        }
        if (expect.valuesDescending) {
            var j;
            for (j = 1; j < res.values.length; j++) {
                if (res.values[j].value >= res.values[j - 1].value) {
                    fail(r, id, "valuesDescending violated at " + j);
                    return false;
                }
            }
        }
        return true;
    }

    function checkPlan(r, id, plan, expect, tol) {
        var i;

        if (expect.type !== undefined && plan.type !== expect.type) {
            fail(r, id, "type: expected \"" + expect.type + "\" got \"" + String(plan.type) + "\"");
            return false;
        }
        if (expect.baselineKind !== undefined && plan.baseline.kind !== expect.baselineKind) {
            fail(r, id, "baseline.kind: expected \"" + expect.baselineKind + "\" got \"" + String(plan.baseline.kind) + "\"");
            return false;
        }
        if (expect.direction !== undefined && plan.direction !== expect.direction) {
            fail(r, id, "direction: expected \"" + expect.direction + "\" got \"" + String(plan.direction) + "\"");
            return false;
        }
        if (expect.majorCount !== undefined && plan.items.major.length !== expect.majorCount) {
            fail(r, id, "majorCount: expected " + expect.majorCount + " got " + plan.items.major.length);
            return false;
        }
        if (expect.minorCount !== undefined && plan.items.minor.length !== expect.minorCount) {
            fail(r, id, "minorCount: expected " + expect.minorCount + " got " + plan.items.minor.length);
            return false;
        }
        if (expect.microCount !== undefined && plan.items.micro.length !== expect.microCount) {
            fail(r, id, "microCount: expected " + expect.microCount + " got " + plan.items.micro.length);
            return false;
        }
        if (expect.labelCount !== undefined && plan.labels.length !== expect.labelCount) {
            fail(r, id, "labelCount: expected " + expect.labelCount + " got " + plan.labels.length);
            return false;
        }
        if (expect.teethAbsent === true) {
            if (plan.teeth) {
                fail(r, id, "teethAbsent: plan.teeth is not null");
                return false;
            }
        }
        if (expect.teethCount !== undefined) {
            if (!plan.teeth || plan.teeth.length !== expect.teethCount) {
                fail(r, id, "teethCount: expected " + expect.teethCount + " got " + (plan.teeth ? plan.teeth.length : "null"));
                return false;
            }
        }
        if (expect.majorAngleAt) {
            var mi = expect.majorAngleAt.index;
            if (!checkFields(r, id, plan.items.major[mi], { angleDeg: expect.majorAngleAt.angleDeg }, tol)) { return false; }
        }
        if (expect.labelAt) {
            var li = expect.labelAt.index;
            var spec = {};
            var key;
            for (key in expect.labelAt) {
                if (expect.labelAt.hasOwnProperty(key) && key !== "index") {
                    spec[key] = expect.labelAt[key];
                }
            }
            if (!checkFields(r, id, plan.labels[li], spec, tol)) { return false; }
        }
        if (expect.labelLast) {
            var specL = {};
            var keyL;
            for (keyL in expect.labelLast) {
                if (expect.labelLast.hasOwnProperty(keyL)) {
                    specL[keyL] = expect.labelLast[keyL];
                }
            }
            if (!checkFields(r, id, plan.labels[plan.labels.length - 1], specL, tol)) { return false; }
        }
        if (expect.majorTAscending) {
            for (i = 1; i < plan.items.major.length; i++) {
                if (plan.items.major[i].t < plan.items.major[i - 1].t - tol) {
                    fail(r, id, "majorTAscending violated at " + i);
                    return false;
                }
            }
        }
        if (expect.majorAnglesAscending || expect.majorAnglesDescending) {
            for (i = 1; i < plan.items.major.length; i++) {
                var a0 = plan.items.major[i - 1].angleDeg;
                var a1 = plan.items.major[i].angleDeg;
                if (expect.majorAnglesAscending && a1 < a0 - tol) {
                    fail(r, id, "majorAnglesAscending violated at " + i);
                    return false;
                }
                if (expect.majorAnglesDescending && a1 > a0 + tol) {
                    fail(r, id, "majorAnglesDescending violated at " + i);
                    return false;
                }
            }
        }
        if (expect.minorAnglesBetweenMajors === true) {
            if (!checkMinorsBetweenMajors(r, id, plan, tol)) { return false; }
        }
        if (expect.sweep !== undefined && !approx(plan.sweep, expect.sweep, tol)) {
            fail(r, id, "sweep: expected " + fmtNum(expect.sweep) + " got " + fmtNum(plan.sweep));
            return false;
        }
        return true;
    }

    // Every minor angle must sit strictly inside an open interval between two
    // adjacent major angles (wrap interval supported for full circles).
    function checkMinorsBetweenMajors(r, id, plan, tol) {
        var majors = [];
        var i;
        for (i = 0; i < plan.items.major.length; i++) {
            majors[majors.length] = plan.items.major[i].angleDeg;
        }
        var fullCircle = (plan.sweep >= 360 - 1e-6);
        // Normalize to offsets from start, ascending; insertion sort (small n).
        var start = plan.startAngle;
        var period = fullCircle ? 360 : (plan.sweep + 1e-6);
        var offs = [];
        for (i = 0; i < majors.length; i++) {
            var o = majors[i] - start;
            o = o % period;
            if (o < 0) { o += period; }
            offs[offs.length] = o;
        }
        for (i = 1; i < offs.length; i++) {
            var key = offs[i];
            var j = i - 1;
            while (j >= 0 && offs[j] > key) { offs[j + 1] = offs[j]; j--; }
            offs[j + 1] = key;
        }
        var minors = plan.items.minor;
        for (i = 0; i < minors.length; i++) {
            var mo = minors[i].angleDeg - start;
            mo = mo % period;
            if (mo < 0) { mo += period; }
            var inside = false;
            var k;
            for (k = 0; k < offs.length - 1; k++) {
                if (mo > offs[k] + tol && mo < offs[k + 1] - tol) { inside = true; break; }
            }
            if (!inside && fullCircle && offs.length > 1) {
                if (mo > offs[offs.length - 1] + tol && mo < period - tol) { inside = true; } // wrap interval
            }
            if (!inside) {
                fail(r, id, "minorAnglesBetweenMajors violated: minor[" + i + "] offset " + fmtNum(mo));
                return false;
            }
        }
        return true;
    }

    function checkExpect(r, id, kind, res, expect) {
        if (!expect) { return true; }
        var tol = (typeof expect.tol === 'number') ? expect.tol : DEFAULT_TOL;

        if (expect.equals !== undefined) {
            if (res !== expect.equals) {
                fail(r, id, "expected \"" + String(expect.equals) + "\" got \"" + String(res) + "\"");
                return false;
            }
            return true;
        }
        if (kind === "calendar" || kind === "timecode") {
            // Sequence-like result with top-level fields (fps/num/den/...):
            // check fields first, then the standard sequence/item checks.
            if (expect.fields) {
                if (!checkFields(r, id, res, expect.fields, tol)) { return false; }
            }
            return checkSequence(r, id, res, expect, tol);
        }
        if (expect.fields) {
            return checkFields(r, id, res, expect.fields, tol);
        }
        if (kind === "sequence") {
            return checkSequence(r, id, res, expect, tol);
        }
        if (kind === "buildTickPlan") {
            return checkPlan(r, id, res, expect, tol);
        }
        var items = listOf(kind, res);
        if (items) { return checkItems(r, id, items, expect, tol); }
        return true;
    }

    function runCase(r, c) {
        var kind = c.kind;
        try {
            var res = execute(kind, c.input);
            if (c.expect && c.expect.throws) {
                fail(r, c.id, "expected throw " + c.expect.throws + " but call succeeded");
                return;
            }
            if (checkExpect(r, c.id, kind, res, c.expect)) {
                pass(r, c.id);
            }
        } catch (err) {
            if (c.expect && c.expect.throws) {
                var code = err && err.code ? err.code : describeErr(err);
                if (code === c.expect.throws) { pass(r, c.id); }
                else { fail(r, c.id, "threw " + code + " expected " + c.expect.throws); }
            } else {
                fail(r, c.id, "threw unexpectedly: " + describeErr(err));
            }
        }
    }

    // ------------------------------------------------------------------- run

    function runAll(geoCases, cfgCases, calCases, tcCases) {
        var r = result();
        var i;
        if (geoCases) {
            for (i = 0; i < geoCases.length; i++) { runCase(r, geoCases[i]); }
        }
        if (cfgCases) {
            for (i = 0; i < cfgCases.length; i++) { runCase(r, cfgCases[i]); }
        }
        if (calCases) {
            for (i = 0; i < calCases.length; i++) { runCase(r, calCases[i]); }
        }
        if (tcCases) {
            for (i = 0; i < tcCases.length; i++) { runCase(r, tcCases[i]); }
        }
        r.lines[r.lines.length] = "SUMMARY {passed:" + r.passed + ", failed:" + r.failed + ", total:" + r.total + "}";
        return r;
    }

    // ------------------------------------------------------- AE entry points

    function isAE() {
        return (typeof app !== 'undefined') && app && app.project;
    }

    function scriptDir() {
        // $.fileName is the running script path (AE). Node harness never calls this.
        var f = new File($.fileName);
        return f.parent;
    }

    function evalRel(dir, rel) {
        var p = dir.fsName + "/" + rel;
        $.evalFile(p);
    }

    function readJsonAE(dir, rel) {
        var f = new File(dir.fsName + "/" + rel);
        if (!f.open("r")) {
            throw new Error("cannot open " + rel);
        }
        var txt = f.read();
        f.close();
        return JSON.parse(txt);
    }

    function loadModulesAE() {
        var dir = scriptDir();
        evalRel(dir, "../host/lib/json2.jsxinc"); // no-op where native JSON exists
        evalRel(dir, "../host/core/geometry.jsxinc");
        evalRel(dir, "../host/core/numeric-time.jsxinc");
        evalRel(dir, "../host/core/calendar-time.jsxinc");
        evalRel(dir, "../host/core/timecode.jsxinc");
        return (typeof $ !== 'undefined' && $.global && $.global.TIME_RULER) ? $.global.TIME_RULER : undefined;
    }

    function main() {
        if (!isAE()) { return; } // Node: the harness drives runAll directly
        var out = { passed: 0, failed: 0, total: 0 };

        try {
            var tr = loadModulesAE();
            if (!tr || !tr.core || !tr.core.geometry || !tr.core.numericTime ||
                !tr.core.calendarTime || !tr.core.timecode) {
                throw new Error("modules failed to load");
            }
            var dir = scriptDir();
            var geoCases = readJsonAE(dir, "geometry-cases.json");
            var cfgCases = readJsonAE(dir, "config-cases.json");
            var calCases = readJsonAE(dir, "calendar-cases.json");
            var tcCases = readJsonAE(dir, "timecode-cases.json");
            var r = runAll(geoCases.cases, cfgCases.cases, calCases.cases, tcCases.cases);
            out = { passed: r.passed, failed: r.failed, total: r.total };

            var i;
            for (i = 0; i < r.lines.length; i++) {
                $.write(r.lines[i] + "\n");
            }

            // Write results JSON next to tests/
            var resFile = new File(dir.fsName + "/results-ae.json");
            if (resFile.open("w")) {
                resFile.write(JSON.stringify({
                    environment: "after-effects",
                    aeVersion: (app && app.version) ? String(app.version) : "unknown",
                    passed: r.passed,
                    failed: r.failed,
                    total: r.total,
                    lines: r.lines
                }));
                resFile.close();
            }

            alert("TIME RULER core tests: " + r.passed + "/" + r.total +
                  " passed (" + r.failed + " failed). Details: tests/results-ae.json");
        } catch (e) {
            alert("TIME RULER core tests ERROR: " + describeErr(e));
        }
        return out;
    }

    var api = {
        runAll: runAll,
        main: main,
        isAE: isAE
    };

    // Auto-run when loaded inside After Effects.
    if (isAE()) {
        try { main(); } catch (eAuto) { alert("TIME RULER tests auto-run failed: " + describeErr(eAuto)); }
    }

    return api;
})();

// Re-publish namespace in Node (modules already registered it; keep in sync).
try {
    if (typeof global !== 'undefined' && global.TIME_RULER) {
        global.TIME_RULER.tests = global.TIME_RULER.tests || {};
        global.TIME_RULER.tests.core = TR.tests.core;
    }
} catch (ePub) {}
