# Changelog — TIME RULER

All notable changes to the TIME RULER CEP extension are documented here.
Format follows Keep a Changelog; versioning is SemVer.

## [1.0.0] — Unreleased (build in progress)

### Added
- Build specification `TIME_RULER_GEMINI_BUILD_SPEC.md` (master contract).
- Milestone 1 — CEP shell:
  - `CSXS/manifest.xml` (AEFT, CEP 11, AE 2023+).
  - Client panel shell (dark UI, 6 tabs) + `bridge.js` with request queue and
    `quoteForEvalScript()` escaping.
  - `host/bootstrap.jsx`: idempotent boot, ES3 logger, module loading via
    `$.evalFile` with absolute paths.
  - `host/api.jsxinc`: bridge API — `ping`, `version`, `getHostInfo`,
    `getActiveCompInfo`, `validateConfig`, `getPresetDefaults`, `generate`,
    `listInstances` implemented.
- Milestone 2 — core engines:
  - `host/core/config.jsxinc`: config schema v1.0 defaults, normalize, resolveAuto, LIMITS.
  - `host/core/validation.jsxinc`: full §7.1 validation with issue codes.
  - `host/core/geometry.jsxinc` + `host/core/numeric-time.jsxinc`: pure-math
    geometry/numeric engines producing the LayoutPlan contract.
  - `tests/`: Node-runnable data-driven engine tests (149 passed).
- Milestone 3 — native AE generator:
  - `host/ae/shape-builder.jsxinc`: vector shapes, ticks, baselines, teeth, markers, progress paths.
  - `host/ae/text-builder.jsxinc`: editable label text layers, centered anchor, styling.
  - `host/ae/controller-builder.jsxinc`: master null controller.
  - `host/ae/layer-manager.jsxinc`: coordinate mapping, parenting, safe removal.
  - `host/ae/metadata.jsxinc`: layer comment tagging and instance discovery.
- Milestone 4 — Calendar & Timecode Host Integration (COMPLETED):
  - `host/core/calendar-time.jsxinc`: calendar engine with leap year calculation, tokenized formatting, DST awareness.
  - `host/core/timecode.jsxinc`: timecode engine supporting drop-frame (29.97/59.94) and non-drop frames.
  - `host/core/geometry.jsxinc`: integrated calendar and timecode domain calculations into circular, arc, and linear layout plans with subdivision interpolation.
  - `host/rig/counter.jsxinc`: calendar and timecode hold-keyframe generation for the rig counter text layer.
- Milestone 5 — Animation Rig & Expressions (COMPLETED):
  - `host/ae/expression-builder.jsxinc`: central generator of all AE expressions with read-back verification.
  - `host/ae/controller-builder.jsxinc`: 11 effect controls on master null (5 main: Progress, Reveal, Highlight Start/End, Rotation Offset; 6 style colors).
  - `host/rig/progress.jsxinc`: full-range polyline with Trim Paths End bound to Progress; style binds for ticks/labels; rig sequence orchestrator.
  - `host/rig/marker.jsxinc`: parent-space center-relative position expression for circular/arc/linear; marker color bind; controller rotation bind.
  - `host/rig/highlight.jsxinc`: dedicated shape layer with dual Trim Paths (Start/End) bound to sliders.
  - `host/rig/reveal.jsxinc`: staggered opacity ramp based on normalized position t across tick groups and labels; dense ruler safety cap (>600 items).
  - `host/rig/counter.jsxinc`: text counter parented to marker with live numeric Source Text expression (`toFixed` precision, prefix/suffix).
- Milestone 6 — Regeneration & Instance Management (COMPLETED):
  - `host/ae/metadata.jsxinc`: added `extractConfigSnapshot` to parse `|CFG:<json>` snapshot from master controller comment.
  - `host/api.jsxinc`: implemented `update` (rig sliders live update), `regenerate` (atomic re-generation with confirmation and layer cleanup), `detach` (metadata comment removal), `getInstanceConfig` (configuration snapshot retrieval).
- Milestone 7 — UI Completion & QA (COMPLETED):
  - `client/js/preset-manager.js`: preset management engine supporting 4 built-in presets (`historical-2000-2030`, `clock-12-months`, `clean-timeline`, `instrument-dial`), protected built-ins, user presets saved in `localStorage`, duplication, and state sync.
  - `client/js/app.js`: wired preset selection, load, save, duplicate; wired instance list click-to-load-config; wired Update, Regenerate (with confirmation), and Detach (with confirmation); integrated automatic instance discovery on comp connect.
  - `client/js/state.js`: added `loadConfig(newConfig)` with deep defaults merging.
  - `client/js/form-binding.js`: added `syncFormFromState()` and duplicate listener prevention (`_trBound`).
  - Automated test coverage: 149/149 node-harness + 164/164 ae-mock-harness = **313/313 tests passing (100%)**.
- Four built-in presets (historical circular, 12-months clock, clean linear
  timeline, mechanical instrument dial).
- Install/debug scripts for Windows and macOS + packaging notes + licenses.

### Untested (as of this entry)
- Everything inside the real After Effects engine (CEP ScriptPath loading,
  `$.evalFile` from the installed folder, AE DOM writes) — pending first AE
  manual run; see `tests/manual-test-matrix.md`.
