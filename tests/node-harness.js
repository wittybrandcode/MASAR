#!/usr/bin/env node
// ============================================================================
// TIME RULER — Node 22 test harness for the host core engines
// ============================================================================
// Runs the ES3 ExtendScript engines (host/core/*.jsxinc) under Node and drives
// the environment-agnostic runner (tests/host-core-tests.jsx) against
// tests/geometry-cases.json, tests/config-cases.json, tests/calendar-cases.json
// and tests/timecode-cases.json.
//
// Design (see task spec):
//   - global.$ = { global: {} } shim so the ES3 namespace bootstrap
//     (`var TR = $.global.TIME_RULER; ...`) works verbatim.
//   - Loads ONLY fs (+ node built-ins already global). json2.jsxinc is optional
//     and auto-skips on native JSON.
//   - Engines are independent of config/validation: this harness ASSERTS that
//     TR.core.validation is NOT defined (engines must not reference it) and
//     treats it as non-required.
//   - Eval order: host/lib/json2.jsxinc -> host/core/geometry.jsxinc ->
//     host/core/numeric-time.jsxinc -> host/core/calendar-time.jsxinc ->
//     host/core/timecode.jsxinc -> tests/host-core-tests.jsx (runner).
//     Indirect global eval keeps sloppy (non-strict) ES3 semantics.
//   - Exit code: 1 if any case failed, else 0.
// ============================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ------------------------------------------------------------------- shim
// Minimal ExtendScript `$` stand-in. NOTE: deliberately NOT strict at eval
// time (indirect eval below runs sloppy-mode ES3 code).
global.$ = { global: {} };

function loadRel(rel) {
  const full = path.join(ROOT, rel);
  const code = fs.readFileSync(full, 'utf8');
  try {
    (0, eval)(code); // indirect eval -> global scope, sloppy mode (ES3 semantics)
  } catch (err) {
    console.error('[harness] FAILED to load ' + rel + ' -> ' + (err && err.stack ? err.stack : err));
    process.exit(2);
  }
}

// ------------------------------------------------------------------- load
// 1) JSON polyfill for ES3 (auto-detects native JSON and skips).
loadRel(path.join('host', 'lib', 'json2.jsxinc'));

// 2) Core engines (pure math, ES3).
loadRel(path.join('host', 'core', 'geometry.jsxinc'));
loadRel(path.join('host', 'core', 'numeric-time.jsxinc'));
loadRel(path.join('host', 'core', 'calendar-time.jsxinc'));
loadRel(path.join('host', 'core', 'timecode.jsxinc'));

// 3) Namespace sanity: engines must be registered, validation must NOT exist.
const TR = (global.$ && global.$.global && global.$.global.TIME_RULER) || global.TIME_RULER;
if (!TR || !TR.core || !TR.core.geometry || !TR.core.numericTime ||
    !TR.core.calendarTime || !TR.core.timecode) {
  console.error('[harness] core namespace incomplete after loading engines');
  process.exit(2);
}
if (TR.core.validation !== undefined) {
  console.error('[harness] TR.core.validation is defined — engines must stay independent of config/validation');
  process.exit(2);
}

// 4) Environment-agnostic runner.
loadRel(path.join('tests', 'host-core-tests.jsx'));
const runner = TR.tests && TR.tests.core;
if (!runner || typeof runner.runAll !== 'function') {
  console.error('[harness] runner did not register TIME_RULER.tests.core.runAll');
  process.exit(2);
}

// 5) Case suites.
function readCases(rel) {
  const full = path.join(ROOT, rel);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

let geoCases;
let cfgCases;
let calCases;
let tcCases;
try {
  geoCases = readCases(path.join('tests', 'geometry-cases.json'));
  cfgCases = readCases(path.join('tests', 'config-cases.json'));
  calCases = readCases(path.join('tests', 'calendar-cases.json'));
  tcCases = readCases(path.join('tests', 'timecode-cases.json'));
} catch (err) {
  console.error('[harness] cannot read case JSON files -> ' + err);
  process.exit(2);
}

// 6) Run + report.
const result = runner.runAll(geoCases.cases, cfgCases.cases, calCases.cases, tcCases.cases);
for (let i = 0; i < result.lines.length; i++) {
  console.log(result.lines[i]);
}

process.exitCode = result.failed > 0 ? 1 : 0;
