# TIME RULER — Host Bridge & Config Contract (Milestones 1–3)

Shared contract between the **client lane** (CEP panel) and the **host lane**
(ExtendScript). Milestone 3+ lanes must treat this document as the interface of
record. **Breaking changes require a version bump and a note here.**

- Product: `TIME_RULER` v`1.0.0`, schema `1.0`, AE 2023+ (`AEFT`), ExtendScript ES3.
- All host code lives under the single namespace `$.global.TIME_RULER` (short alias `TR`).

---

## 1. Module load order

| # | File (relative to extension root) | Registers | Role |
|---|---|---|---|
| 1 | `host/bootstrap.jsx` | `$.global.TIME_RULER` + `TR.log/setDebug/selfTest/JSON` | Entry point; loaded by manifest `ScriptPath` |
| 2 | `host/lib/json2.jsxinc` | global `JSON` (Crockford polyfill, only when absent) | JSON engine for ES3 |
| 3 | `host/core/config.jsxinc` | `TR.core.config` | Defaults, normalize, resolveAuto, LIMITS (pure logic) |
| 4 | `host/core/validation.jsxinc` | `TR.core.validation` | validate, validateForAE (pure logic) |
| 5 | `host/core/geometry.jsxinc` | `TR.core.geometry` | LayoutPlan engine: pointOnCircle, distribute, buildTickPlan (pure logic) |
| 6 | `host/core/numeric-time.jsxinc` | `TR.core.numericTime` | Sequence/values, format, numeric projections (pure logic) |
| 7 | `host/ae/composition.jsxinc` | `TR.ae.composition` | Active-comp access + compInfoOf (`NO_PROJECT`/`NO_ACTIVE_COMP` single source) |
| 8 | `host/ae/metadata.jsxinc` | `TR.ae.metadata` | Layer-comment instance registry: write/scan/nextInstanceId |
| 9 | `host/ae/shape-builder.jsxinc` | `TR.ae.shapeBuilder` | Shape layer + vector group/path/ellipse/stroke/fill primitives |
| 10 | `host/ae/text-builder.jsxinc` | `TR.ae.textBuilder` | Editable text layers (TextDocument recipe, sourceRect centering) |
| 11 | `host/ae/controller-builder.jsxinc` | `TR.ae.controllerBuilder` | Master controller null creation |
| 12 | `host/ae/layer-manager.jsxinc` | `TR.ae.layerManager` | positionAtT, parenting, safeRemove/cleanup |
| 13 | `host/api.jsxinc` | `TR.API` | Bridge methods; orchestrates core plans into AE layers (LAST) |

- Bootstrap loads 2–13 via `$.evalFile` with **absolute paths** derived from
  `new File($.fileName).parent.fsName` (why: `#include` relative paths are not
  reliable after install — see header comment in `bootstrap.jsx`).
- Every failed load is collected in `TR.loadErrors[]`; boot continues so
  `ping()`/`selfTest()` can report what is missing.
- **Idempotent**: re-evaluating `bootstrap.jsx` after a successful boot is a
  no-op (`TR.bootstrapped` guard). Force reload with
  `TIME_RULER.bootstrapped = false` then re-evaluate.
- Core modules (`config`, `validation`, `geometry`, `numeric-time`) are **pure
  logic**: they never touch `app` / `app.project` / AE dialogs. AE DOM access
  lives only in the `host/ae/*` modules and in `api.jsxinc`, and every access
  is guarded (matchNames only, no user-layer selection, mutations wrapped in
  `TR.API._withUndo`).

## 2. Namespace rules

| Field | Type | Notes |
|---|---|---|
| `TR.product` | string | `"TIME_RULER"` |
| `TR.version` | string | `"1.0.0"` |
| `TR.schemaVersion` | string | `"1.0"` |
| `TR.ready` | boolean | `true` when `TR.loadErrors` is empty after boot |
| `TR.bootstrapped` | boolean | idempotency flag |
| `TR.debug` | boolean | console logging switch |
| `TR.loadErrors` | string[] | module load failures |
| `TR.logBuffer` | entry[] | ring buffer, max 200, newest last; `{time, level, message}` |
| `TR.lastJsonError` | string\|null | last TR.JSON failure reason |
| `TR.LOG_LEVELS` | object | `{DEBUG:10, INFO:20, WARN:30, ERROR:40}` |
| `TR.log(level, msg)` | function | DEBUG/INFO/WARN/ERROR; buffer always, console only when `TR.debug` |
| `TR.setDebug(on)` | function | toggles console logging |
| `TR.selfTest()` | function | `{ok, code, message, data:{loadErrors, modules, version, schemaVersion}}` |
| `TR.JSON.parse(s)` | function | guarded; returns `null` on failure, sets `TR.lastJsonError` |
| `TR.JSON.stringify(o)` | function | guarded; returns `""` on failure, sets `TR.lastJsonError` |
| `TR.core.config` | module | see §5 |
| `TR.core.validation` | module | see §6 |
| `TR.API` | module | see §3 — **the only namespace the panel calls** |

Logger etiquette (spec §11.4): module-level lifecycle events only — **no
per-item/per-tick logging**. Console output only while `TR.debug === true`.

## 3. API surface (`TIME_RULER.API.*`)

Call pattern from the client: `csInterface.evalScript("TIME_RULER.API." + name + "(" + quotedJson + ")", cb)`.
Payload is always a **JSON string** (`""` or `"{}"` when there is nothing to send);
responses are always **JSON strings**. One request at a time (queue on the client).

Every response envelope:

```json
{
  "ok": true,
  "code": "OK",
  "message": "…",
  "data": { },
  "warnings": []
}
```

Errors: `ok:false`, `code` = stable error code, `data:null`. Unexpected host
exceptions become `HOST_EXCEPTION` with `message` = `String(e)` + `" @line N"`.

| Method | Signature | Returns (`data`) | Failure codes |
|---|---|---|---|
| `ping` | `ping()` | `{pong:true, ready, loadErrors}` | — |
| `version` | `version()` | `{product, version, schemaVersion, api:"1.0"}` | — |
| `getHostInfo` | `getHostInfo()` | `{aeVersion, hostName:"AEFT", os, engine:"ExtendScript", debug}` | `HOST_UNAVAILABLE` |
| `getActiveCompInfo` | `getActiveCompInfo()` | `{name, width, height, duration, frameRate, pixelAspect, workAreaStart, workAreaDuration, selectionCount}` | `NO_PROJECT`, `NO_ACTIVE_COMP`, `HOST_UNAVAILABLE` |
| `validateConfig` | `validateConfig(jsonString)` | `{valid, errors:[issue], warnings:[issue]}` — `ok:true` even when the config is invalid (the *validation call* succeeded; the verdict is `data.valid`) | `BAD_PAYLOAD`, `PAYLOAD_TOO_LARGE`, `HOST_NOT_READY` |
| `getPresetDefaults` | `getPresetDefaults()` | `{defaults:<full config v1.0>}` | `HOST_NOT_READY` |
| `generate` | `generate(jsonString)` | `{instanceId:"0001", controllerName:"TR_0001_CTRL_MAIN"\|null, counts:{major, minor, micro, labels, teeth}}` — builds CTRL null + BASE_RING/BASELINE + one shape layer per enabled tick level (MAJOR/MINOR/MICRO_TICKS) + TEETH + one editable text layer per kept label (LABEL_0001…) + MARKER + PROGRESS, all parented to the controller, each tagged with a `TIME_RULER\|1.0\|<id>\|<elementId>\|<type>` layer comment; whole build inside one undo group, failure removes its own layers | `BAD_PAYLOAD`, `PAYLOAD_TOO_LARGE`, `INVALID_CONFIG` (`data.errors`), `CYCLIC_NOT_DIVISIBLE`, `UNSUPPORTED_TIME_MODE`, `TOO_MANY_INSTANCES`, `TOO_MANY_LABELS` (`data.kept`,`data.cap`), `NO_PROJECT`, `NO_ACTIVE_COMP`, `HOST_EXCEPTION` |
| `update` | `update(instanceId, jsonString)` | — stub | `NOT_IMPLEMENTED` (Milestone 6) |
| `regenerate` | `regenerate(instanceId, jsonString, confirmReplace)` | — stub | `NOT_IMPLEMENTED` (Milestone 6) |
| `detach` | `detach(instanceId)` | — stub | `NOT_IMPLEMENTED` (Milestone 6) |
| `listInstances` | `listInstances()` | `{comp:{name, width, height, frameRate}, instances:[{instanceId, controllerName, elementCounts:{CONTROLLER,BASE,TICKS,LABEL,MARKER,PROGRESS,TEETH}, elementTypes}]}` — scans layer comments, never layer names | `NO_PROJECT`, `NO_ACTIVE_COMP`, `HOST_UNAVAILABLE`, `HOST_EXCEPTION` |
| `_withUndo` | `TR.API._withUndo(name, fn)` | real helper (not a stub): wraps AE-mutating work in one `app.beginUndoGroup/endUndoGroup` step with `try/finally` | — |

Stubs respond honestly with `{ok:false, code:"NOT_IMPLEMENTED", message:"Implemented in Milestone 6 of the build.", data:null, warnings:[]}` — never empty replies.

`generate` extras on top of the envelope rules:

- `warnings[]` is dynamic (font fallback, un-applied label rotation, controller
  creation fallback); `message` is the static `"TIME RULER instance generated."`.
- Instance ids: smallest free 4-digit id in the comp (scan of metadata
  comments), `0001`–`9999`; `TOO_MANY_INSTANCES` when none remains.
- Layer naming: `TR_<ID>_<ELEMENT>` (controller `TR_<ID>_CTRL_MAIN`; tick
  groups `MAJOR_0001`…/`MINOR_0001`…/`TOOTH_0001`… inside Contents; labels
  `TR_<ID>_LABEL_0001`… numbered over the KEPT list after collision filtering).

Validation issue shape (in `data.errors` / `data.warnings`):

```json
{ "field": "geometry.sweepAngle", "code": "RANGE_SWEEP", "message": "geometry.sweepAngle must be <= 360." }
```

## 4. Bridge payload rules

- `parsePayload(s)`: `""`/`undefined` → `{}`; object → as-is (defensive); string →
  `TR.JSON.parse` guarded. Failure → envelope `{ok:false, code:"BAD_PAYLOAD"}`.
- Payload size limit: `MAX_PAYLOAD_CHARS` (see §7) → `PAYLOAD_TOO_LARGE`.
- **Never `eval()` user input**; never send raw JSON inside `evalScript` without
  escaping (client lane owns `quoteForEvalScript()`).
- `TR.JSON` prefers a native `JSON` (if the AE engine provides one) and falls
  back to the bundled Crockford `json2.jsxinc`; both parse/stringify paths are
  wrapped and never throw.

## 5. `TR.core.config` module

| Member | Description |
|---|---|
| `SCHEMA_VERSION` | `"1.0"` |
| `LIMITS` | hard guard rails, see §7 |
| `defaults()` | fresh deep-default config (never shared/mutable) — exact tree in §8 |
| `normalize(cfg)` | deep-merge partial cfg over fresh defaults; plain objects recurse, arrays & primitives replace wholesale, unknown extra keys preserved; returns NEW object (input never mutated) |
| `resolveAuto(cfg, compInfo)` | `centerMode:"compositionCenter"` → `center=[w/2, h/2]`; `radius <= 0` (or non-finite) → `round(min(w,h) * 0.4)`; returns NEW config, rest untouched |

## 6. `TR.core.validation` module

| Member | Description |
|---|---|
| `validate(cfg)` | → `{valid, errors:[issue], warnings:[issue]}`; missing fields are skipped, so it is safe on partial configs |
| `validateForAE(cfg, compInfo)` | `validate` → `resolveAuto` → re-`validate`; needs `compInfo {width, height}`; adds codes `COMP_INFO_MISSING`, `COMP_INFO_INVALID`, `HOST_NOT_READY` |

Projection model used for limit checks (numeric/timecode modes only; calendar
projects in its own engine lane): `majorCount = floor(|end-start| / majorStep) + 1`
(+1 when `includeEndPoint` and the span is not a whole multiple of `majorStep`);
minor/micro counts are the **distinct** non-parent marks; labels =
`ceil(majorCount / labelEvery)`.

## 7. Limits (`TR.core.config.LIMITS`)

| Key | Value | Enforced as |
|---|---|---|
| `MAJOR_TICKS_MAX` | 500 | error `TOO_MANY_MAJOR_TICKS` |
| `MINOR_MICRO_TOTAL_MAX` | 2000 | error `TOO_MANY_MINOR_MICRO` |
| `LABELS_WARN` | 200 | warning `TOO_MANY_LABELS` |
| `LABELS_MAX` | 400 | error `TOO_MANY_LABELS` |
| `TEETH_MAX` | 1000 | error `TOO_MANY_TEETH` (only when `teeth.enabled`) |
| `MAX_PAYLOAD_CHARS` | 2000000 | API error `PAYLOAD_TOO_LARGE` |

## 8. Config schema v1.0 — full field tree

Types: `num` = finite number, `int` = integer, `bool`, `str`, `color` = `#RRGGBB`.
Default value shown; range/enum is the validation contract.

| Path | Type | Default | Range / enum |
|---|---|---|---|
| `schemaVersion` | str | `"1.0"` | `"1.0"` |
| `product` | str | `"TIME_RULER"` | informational |
| `geometry.type` | str | `"circular"` | `circular \| linear \| arc` |
| `geometry.centerMode` | str | `"compositionCenter"` | `compositionCenter \| custom` |
| `geometry.center` | num[2] | `[960, 540]` | two finite numbers |
| `geometry.radius` | num | `0` | ≥ 0 (0 ⇒ auto-resolved to `round(min(w,h)×0.4)`) |
| `geometry.startAngle` | num | `-90` | finite (degrees) |
| `geometry.sweepAngle` | num | `360` | 1..360; cyclic ⇒ must be 360 |
| `geometry.direction` | str | `"clockwise"` | `clockwise \| counter_clockwise` |
| `geometry.distributionMode` | str | `"bounded"` | `bounded \| cyclic` |
| `geometry.seamGapDegrees` | num | `6` | 0..360; bounded+360 sweep ⇒ > 0 else warning |
| `geometry.orientation` | str | `"radial"` | free (reserved; engine lane owns semantics) |
| `geometry.linearOrientation` | str | `"horizontal"` | `horizontal \| vertical` |
| `geometry.startX` | num | `0` | finite |
| `geometry.startY` | num | `0` | finite |
| `geometry.length` | num | `800` | > 0 |
| `geometry.linearDirection` | str | `"forward"` | `forward \| reverse` |
| `geometry.tickSide` | str | `"both"` | `positive \| negative \| both` |
| `geometry.labelOffset` | num | `20` | −500..500 |
| `time.mode` | str | `"numeric"` | `numeric \| calendar \| timecode` |
| `time.start` | num | `2000` | finite; ≠ `end` |
| `time.end` | num | `2030` | finite; ≠ `start` |
| `time.majorStep` | num | `1` | > 0 |
| `time.minorDivisions` | int | `4` | 0..1000 |
| `time.microDivisions` | int | `0` | 0..1000 |
| `time.includeEndPoint` | bool | `true` | boolean |
| `time.precision` | int | `0` | 0..6 |
| `time.prefix` | str | `""` | string |
| `time.suffix` | str | `""` | string |
| `time.timeZone` | str | `"UTC"` | `UTC \| LOCAL` |
| `time.startDate` | str | `""` | `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM(:SS)`, only checked in calendar mode |
| `time.endDate` | str | `""` | same format; must be > `startDate` |
| `time.calendarUnit` | str | `"years"` | `years \| months \| days \| hours \| minutes \| seconds` |
| `time.dateFormat` | str | `""` | string (pattern used by calendar rendering) |
| `time.frameRateMode` | str | `"comp"` | `comp \| custom` |
| `time.customFps` | num | `25` | > 0 (required when mode `custom`) |
| `time.dropFrame` | bool | `false` | only valid for 29.97 / 59.94 fps (else warning) |
| `graduations.major.enabled` | bool | `true` | boolean |
| `graduations.major.length` | num | `22` | 0..500 |
| `graduations.major.width` | num | `3` | 0..500 |
| `graduations.major.offset` | num | `0` | −500..500 |
| `graduations.major.color` | color | `"#2878D0"` | hex6 |
| `graduations.major.opacity` | num | `100` | 0..100 |
| `graduations.minor.enabled` | bool | `true` | boolean |
| `graduations.minor.length` | num | `12` | 0..500 |
| `graduations.minor.width` | num | `2` | 0..500 |
| `graduations.minor.offset` | num | `0` | −500..500 |
| `graduations.minor.color` | color | `"#75A9E8"` | hex6 |
| `graduations.minor.opacity` | num | `85` | 0..100 |
| `graduations.micro.enabled` | bool | `false` | boolean |
| `graduations.micro.length` | num | `6` | 0..500 |
| `graduations.micro.width` | num | `1` | 0..500 |
| `graduations.micro.offset` | num | `0` | −500..500 |
| `graduations.micro.color` | color | `"#A9C7EA"` | hex6 |
| `graduations.micro.opacity` | num | `70` | 0..100 |
| `baseline.enabled` | bool | `true` | boolean |
| `baseline.width` | num | `2` | 0..500 |
| `baseline.color` | color | `"#2878D0"` | hex6 |
| `typography.enabled` | bool | `true` | boolean |
| `typography.fontName` | str | `"Arial"` | string |
| `typography.fontSize` | num | `30` | 1..500 |
| `typography.tracking` | num | `0` | −1000..1000 |
| `typography.color` | color | `"#2878D0"` | hex6 |
| `typography.orientation` | str | `"radial"` | `horizontal \| radial \| tangential \| auto_upright` |
| `typography.radiusOffset` | num | `52` | −500..500 |
| `typography.precision` | int | `0` | 0..6 |
| `typography.collisionMode` | str | `"alternate"` | `allow_overlap \| hide \| alternate \| every_nth` |
| `typography.labelEvery` | int | `1` | ≥ 1 |
| `teeth.enabled` | bool | `false` | boolean |
| `teeth.count` | int | `120` | enabled ⇒ 2..1000 |
| `teeth.shape` | str | `"rectangle"` | `rectangle \| square \| trapezoid \| triangle` |
| `teeth.width` | num | `3` | 0..500 |
| `teeth.height` | num | `8` | 0..500 |
| `teeth.alignment` | str | `"outer"` | `inner \| outer \| center` |
| `teeth.rotationOffset` | num | `0` | finite (degrees) |
| `teeth.color` | color | `"#2878D0"` | hex6 |
| `teeth.opacity` | num | `100` | 0..100 |
| `indicators.marker` | bool | `true` | boolean |
| `indicators.progress` | bool | `false` | boolean |
| `indicators.highlight` | bool | `false` | boolean |
| `indicators.markerColor` | color | `"#FFFFFF"` | hex6 |
| `indicators.markerSize` | num | `10` | 1..500 |
| `indicators.highlightColor` | color | `"#F2A33C"` | hex6 |
| `output.mode` | str | `"generator"` | `generator \| rig` |
| `output.granularity` | str | `"grouped"` | `grouped \| individual` |
| `output.editableTextLayers` | bool | `true` | boolean |
| `output.createMasterController` | bool | `true` | boolean |
| `animation.progress` | num | `0` | 0..100 |
| `animation.reveal` | num | `100` | 0..100 |
| `animation.rotationOffset` | num | `0` | finite |
| `animation.highlightStart` | num | `0` | 0..100; ≤ `highlightEnd` |
| `animation.highlightEnd` | num | `100` | 0..100; ≥ `highlightStart` |

## 9. Validation issue codes

| Code | Severity | Meaning |
|---|---|---|
| `SCHEMA_VERSION_UNSUPPORTED` | error | schemaVersion ≠ `1.0` |
| `ENUM_*` (`ENUM_GEOMETRY_TYPE`, `ENUM_TIME_MODE`, `ENUM_OUTPUT_MODE`, `ENUM_DIRECTION`, `ENUM_LINEAR_DIRECTION`, `ENUM_TICK_SIDE`, `ENUM_DISTRIBUTION_MODE`, `ENUM_TEETH_SHAPE`, `ENUM_TEETH_ALIGNMENT`, `ENUM_COLLISION_MODE`, `ENUM_TYPO_ORIENTATION`, `ENUM_LINEAR_ORIENTATION`, `ENUM_TIME_ZONE`, `ENUM_CALENDAR_UNIT`, `ENUM_FPS_MODE`, `ENUM_CENTER_MODE`, `ENUM_OUTPUT_GRANULARITY`) | error | value outside the allowed enum |
| `NUMBER_REQUIRED` / `INTEGER_REQUIRED` | error | wrong or non-finite type |
| `NON_FINITE_NUMBER` | error | NaN/Infinity anywhere in the tree |
| `RANGE_*` | error | value outside range (see §8) |
| `TIME_RANGE_EMPTY` | error | `time.end === time.start` |
| `CENTER_SHAPE` | error | `geometry.center` not `[num, num]` |
| `COLOR_FORMAT` | error | not `#RRGGBB` |
| `CYCLIC_SWEEP_REQUIRED` | error | cyclic circular with sweep ≠ 360 |
| `CIRC_SEAM_OVERLAP` | warning | bounded circular, full 360 sweep, `seamGapDegrees ≤ 0` |
| `ARC_SWEEP_FULL` | warning | arc with sweep 360 (use circular) |
| `TOO_MANY_MAJOR_TICKS` / `TOO_MANY_MINOR_MICRO` / `TOO_MANY_LABELS` / `TOO_MANY_TEETH` | error | projection over the §7 limit (`TOO_MANY_LABELS` is a warning between `LABELS_WARN` and `LABELS_MAX`) |
| `TEETH_COUNT_MIN` | error | enabled teeth with `count < 2` |
| `CALENDAR_DATE_FORMAT` / `CALENDAR_DATE_INVALID` / `CALENDAR_RANGE` | error | calendar-mode date problems |
| `TC_DROPFRAME_UNSUPPORTED` | warning | drop-frame with fps ∉ {29.97, 59.94} (checked when `frameRateMode:"custom"`; a re-check against the real comp fps in `generate` is planned, not part of M3) |
| `ANIM_HL_ORDER` | error | `highlightStart > highlightEnd` |
| `TYPE_BOOLEAN` / `TYPE_STRING` | warning | non-boolean/non-string value in a boolean/string field |
| `CONFIG_NOT_OBJECT` | error | payload parsed but is not a plain object |
| `BAD_PAYLOAD` / `PAYLOAD_TOO_LARGE` | API error | payload not parseable / over size limit |
| `HOST_NOT_READY` | API error | required host module missing (check `TR.loadErrors`) |
| `HOST_UNAVAILABLE` / `HOST_EXCEPTION` / `HOST_SERIALIZE_ERROR` | API error | no AE `app` global / unexpected exception / envelope serialization failed |
| `NO_PROJECT` / `NO_ACTIVE_COMP` | API error | AE state problems |

## 10. ES3 rules summary (host modules)

- `var` only — no `let/const`, no arrow functions, no template literals, no
  default/rest/spread params, no getters/setters shorthand, no trailing commas,
  no reserved words as property names.
- No ES5+ built-ins: `Object.keys`, `Array.isArray`, `Array.prototype.map/forEach/filter/reduce/some/every`,
  `String.prototype.trim`, `Date.now`, `Date.toISOString`, `Array.indexOf`, `Function.bind`.
- Classic `for (var i = 0; i < n; i++)` loops; `function(){}` expressions; `try/catch/finally`.
- `for..in` only with an `Object.prototype.hasOwnProperty` guard.
- No `eval()` on user input; JSON via guarded `TR.JSON`.
- Core modules never touch `app`/`app.project`; no top-level `alert`, no
  top-level `#include`, no ExtendScript-only calls at module top level.
- Modules must stay Node-compatible (ES3 ⊂ ES) for `node --check` + smoke harness.

## 11. Status / untested

- Verified with `node --check` on all 13 host files (temp `.cjs` copies) and an
  ES3 regex sweep (no `let/const/=>`/template literals/ES5 built-ins in code —
  comment prose excluded).
- Verified with the **mock AE harness** (`node tests/ae-mock-harness.js`,
  68 checks, exit 0): it loads the full bootstrap order against a mock AE DOM
  and exercises the whole `generate`/`listInstances` flow — counts, layer
  shapes (paths/ellipses/strokes/fills/TextDocuments), metadata comments,
  CFG snapshot, parenting, undo groups, failure cleanup, and the error codes
  `INVALID_CONFIG`/`NO_ACTIVE_COMP`/`UNSUPPORTED_TIME_MODE`/`HOST_EXCEPTION`.
  The pure-logic harness (`node tests/node-harness.js`, 62 checks) still
  passes.
- **NOT tested inside After Effects** (no AE available in this environment):
  `$.evalFile`/`File` path resolution from the installed CEP folder,
  real `TextDocument` semantics (font name vs `font` object, justification
  enum values, `sourceRectAtTime` metrics), real shape-property matchName
  behavior (auto-created groups vs seeded ones), parenting across the timeline
  panel, `_withUndo` UX in AE's Edit menu, json2 polyfill under the real
  ExtendScript engine. The manual acceptance matrix
  (`tests/manual-test-matrix.md`, "M3 Generate" section) lists the in-AE
  checks. First AE run must call `TIME_RULER.API.ping()` and confirm
  `ready:true`.
