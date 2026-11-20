# TIME RULER — Manual Test Matrix

> **Automated coverage note:** the geometry engine, numeric time engine,
> `buildTickPlan` LayoutPlan cases (spec §12.1, §12.2 numeric part) and
> the calendar + timecode engines (spec §12.2 calendar/timecode part) are
> covered by the automated suite **`tests/host-core-tests.jsx`** (run in After
> Effects or via `node tests/node-harness.js` — 149/149 passing). The generator,
> animation rig, calendar/timecode host integration, instance management
> (update/regenerate/detach), presets engine, and client preset manager are
> covered by the mock-AE harness **`tests/ae-mock-harness.js`** (164/164, Node).
> Total automated test count across both harnesses: **313/313 passing (100%)**.
> The tables below cover everything that **requires the real AE host** (DOM,
> Shape layers, Text layers, Undo, expressions engine, metadata, UI panel) and
> must be executed manually. Nothing in this file has been executed inside After
> Effects yet — every status is honestly `NOT RUN`.

---

## 1. AE Integration Tests (spec §12.3)

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| A1 | Active Composition detection | Open a comp; open TIME RULER panel; check header status | Status shows "Connected" + comp name | NOT RUN | — |
| A2 | No comp state | Close all comps; open panel | Status shows "No Active Composition", generate disabled | NOT RUN | — |
| A3 | Shape Layer creation | Generate a circular ruler (Generator Mode) | New Shape layer named per instance ID, no errors | NOT RUN | — |
| A4 | Vector Group + Path + Stroke | Inspect generated shape layer contents | Group per graduation level; paths + strokes with planned width/color/opacity | NOT RUN | — |
| A5 | Ellipse / Arc creation | Generate circular + arc rulers | Ellipse path (full circle) / Arc path with correct start/end angle, no seam artifacts | NOT RUN | — |
| A6 | Linear baseline path | Generate a linear ruler | Straight baseline path from x1,y1 to x2,y2 (respects forward/reverse) | NOT RUN | — |
| A7 | Text Layer creation | Generate labels | One independent editable Text layer per label (default mode), correct text | NOT RUN | — |
| A8 | TextDocument edit | Change font/size/color on a generated label | TextDocument reflects changes; other labels unaffected | NOT RUN | — |
| A9 | Null Controller + Controls | Generate in Rig Mode | Null created; Slider/Color Controls present and wired via expressions | NOT RUN | — |
| A10 | Parent Transform | Check generated parenting | Ticks/labels parented to the planned transform hierarchy | NOT RUN | — |
| A11 | Expressions run clean | Enable Rig Mode; scrub a control slider | No expression error banners; geometry follows slider | NOT RUN | — |
| A12 | Undo group | Generate; press Ctrl/Cmd+Z once | Whole generation reverts in one undo step; second Z re-does nothing extra | NOT RUN | — |
| A13 | Metadata read/write | Generate; re-open panel | Instance metadata read back correctly (instance ID, config version) | NOT RUN | — |

## 2. Regeneration Tests (spec §12.4)

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| R1 | First instance creation | Generate instance 1 in an empty comp | Created, metadata tagged | NOT RUN | — |
| R2 | Second instance, same comp | Generate instance 2 with different config | Both exist independently | NOT RUN | — |
| R3 | Update isolation | Update instance 1 only | Instance 2 layers unchanged | NOT RUN | — |
| R4 | User layers preserved | Add a manual solid; regenerate instance 1 | Manual solid untouched; only managed layers replaced | NOT RUN | — |
| R5 | Managed-layer detection | Inspect generated layers' metadata | Managed layers identifiable via metadata keys | NOT RUN | — |
| R6 | Cancel regeneration | Start regenerate; cancel mid-flow | Project state unchanged (no half-updated layers) | NOT RUN | — |
| R7 | Detach | Detach instance 1 | Layers kept; subsequent panel operations no longer manage them | NOT RUN | — |

## 3. Compatibility Matrix (spec §12.5 — test for real, not theoretically)

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| V1 | AE 2023 (23.x) — **mandatory** | Full flow: generate circular, linear, arc; regenerate; rig | No CEP/JSX errors; correct geometry | NOT RUN | 23.x |
| V2 | AE 2024 (24.x) — target | Same as V1 | Same as V1 | NOT RUN | 24.x |
| V3 | AE 2025 (25.x) — target | Same as V1 | Same as V1 | NOT RUN | 25.x |
| V4 | AE 2026 (26.x) — target | Same as V1 | Same as V1 | NOT RUN | 26.x |
| V5 | Windows | Run V1 on Windows (this dev machine's OS class) | Panel docks; CEP debug log clean | NOT RUN | — |
| V6 | macOS (if test env available) | Run V1 on macOS | Same as V5 | NOT RUN | — |

### In-AE runner check (bridge between automated and manual)

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| T1 | `tests/host-core-tests.jsx` inside AE | AE 2023+ : File > Scripts > Run Script File → select the file | Alert "149/149 passed (0 failed)" (62 geometry/config + 87 M4 calendar/timecode); `tests/results-ae.json` written | NOT RUN | — |

## 4. M3 Generate — manual in-AE acceptance

> Scope: what the Node mock-AE harness (`tests/ae-mock-harness.js`, 68/68)
> **cannot** prove — real ExtendScript semantics, real AE DOM behavior, and
> visual correctness. Run in the target AE version; record the version per row.

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| M3-1 | Boot & module inventory | Run `TIME_RULER.selfTest()` in ExtendScript console | `ok:true`; `data.modules` lists all 12 modules incl. `TR.core.geometry`, `TR.core.numericTime`, all 6 `TR.ae.*`; `TR.loadErrors` empty | NOT RUN | — |
| M3-2 | matchNames resolve | Generate defaults; inspect a tick group's properties by matchName (`ADBE Vector Shape - Group`, `ADBE Vector Graphic - Stroke`, …) | No `property(...)` null returns; auto-created names match the matchNames documented in `host/ae/shape-builder.jsxinc` | NOT RUN | — |
| M3-3 | Default generate (baseline) | Generate with panel defaults in a 1920×1080 comp | Ring = closed ellipse Ø864 centered at (960,540); 31 major + 90 minor tick groups; no micro layer; marker dot Ø10 at (960,108) | NOT RUN | — |
| M3-4 | Seam visual (bounded circular) | Zoom to the seam region (start angle −90°, bounded distribution) | Ring outline is a closed ellipse; tick layout keeps the 6° seam gap; no double tick at the seam | NOT RUN | — |
| M3-5 | Arc baseline visual | Generate `geometry.type:"arc"`, `sweepAngle:270` | Baseline is an OPEN sampled polyline ≤3°/segment (smooth at 100% zoom), spanning −90°→180°, no closing segment | NOT RUN | — |
| M3-6 | Linear baseline visual | Generate `geometry.type:"linear"`, horizontal, forward | Straight baseline; ticks on both sides per `tickSide`; origin at baseline midpoint; labels horizontal (rotation 0) | NOT RUN | — |
| M3-7 | Label TextDocument | Inspect a generated label's Source Text | fontName/fontSize/color applied; justification centered; text editable by typing in the comp viewer | NOT RUN | — |
| M3-8 | Label font fallback | Generate with `typography.fontName:"NoSuchFont"` | Layer still created (font fallback), a `warnings[]` entry mentions the font; no exception | NOT RUN | — |
| M3-9 | Label centering metrics | Compare label visual center vs its planned radius point (e.g. first label at (960,56)) | Label center sits on the planned point (anchor from real `sourceRectAtTime` metrics, not the mock's 0.6em estimate) | NOT RUN | — |
| M3-10 | Label collision modes | Generate twice: `collisionMode:"alternate"` then `"allow_overlap"`, then `"hide"` | 16 / 31 / filtered-count labels respectively; ids increment 0001→0002; instance 1 layers untouched | NOT RUN | — |
| M3-11 | Label rotations | `typography.orientation` = radial / tangential / auto_upright / horizontal | Rotation −90° at top label / +0° (tangent) / upright (never upside-down) / 0°; labels pivot around their own center | NOT RUN | — |
| M3-12 | Teeth visual | Generate `presets/mechanical/instrument-dial.json` | 120 teeth, one closed filled path each, base on baseline, tip outward (alignment `outer`); fill only, no stroke | NOT RUN | — |
| M3-13 | Teeth alignment variants | Generate teeth with `alignment:"inner"` and `"center"`, shapes square/trapezoid/triangle | Bases sit inside/on the baseline per alignment; outlines match the documented geometry (square side = max(w,h); trapezoid tip = w/4 wide) | NOT RUN | — |
| M3-14 | Metadata comments | Alt-click a generated layer → check Layer Comments | `TIME_RULER\|1.0\|<id>\|<elementId>\|<type>`; controller comment ends with `CFG:{...}` snapshot ≤ ~2064 chars | NOT RUN | — |
| M3-15 | Parenting | Select a tick/label/marker layer | Parent is `TR_0001_CTRL_MAIN`; moving the null moves the whole ruler; controller itself unparented | NOT RUN | — |
| M3-16 | Undo group | Generate; Edit > Undo once | Whole instance disappears in one step; Redo restores it completely | NOT RUN | — |
| M3-17 | Failure cleanup | Force a failure (e.g. temporarily deny layer creation via a script that patches `comp.layers.addShape` to throw) | No partial layers left; error envelope `HOST_EXCEPTION`; undo group closed | NOT RUN | — |
| M3-18 | Instance scan | Run `TIME_RULER.API.listInstances()` after 2 generates | `data.instances` = 2 entries with correct `controllerName` + `elementCounts`; `comp` fields match the active comp | NOT RUN | — |
| M3-19 | Error codes in AE | Send `sweepAngle:400` payload via `generate` | `INVALID_CONFIG` with `RANGE_SWEEP` in `data.errors`; no layers created; undo group still closed | NOT RUN | — |
| M3-20 | Calendar rejection | Send `time.mode:"calendar"` payload | `UNSUPPORTED_TIME_MODE`; no layers | NOT RUN | — |
| M3-21 | Multi-instance isolation | Generate instance 0002 (allow_overlap) next to 0001 | Only 0002 layers appear; 0001 layer count/names/comments unchanged | NOT RUN | — |
| M3-22 | Performance sanity | Generate the instrument-dial preset (120 teeth + 201 ticks + 11 labels) | Completes < 5 s on the dev machine; no ExtendScript timeout dialog | NOT RUN | — |

---

## 5. M4 Calendar & Timecode — manual in-AE

> The calendar (`TR.core.calendarTime`) and timecode (`TR.core.timecode`)
> engines are covered by 87 new automated cases (47 calendar + 40 timecode)
> inside `tests/host-core-tests.jsx` — 149/149 under
> `node tests/node-harness.js`. Everything below requires the REAL AE host
> and cannot be proven in Node. Statuses are honestly `NOT RUN`.

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| M4-1 | Modules load in AE | Run `TIME_RULER.selfTest()` | `ok:true`; `TR.core.calendarTime` + `TR.core.timecode` present; `TR.loadErrors` empty | NOT RUN | — |
| M4-2 | In-AE runner with M4 suites | Run `tests/host-core-tests.jsx` in AE | Alert "149/149 passed (0 failed)"; `results-ae.json` includes the calendar/timecode case ids | NOT RUN | — |
| M4-3 | LOCAL wall clock | Build a calendar ruler `timeZone:"LOCAL"` in a DST-observing TZ; compare labels against the OS clock | Labels match local wall clock (Node cannot prove local-getter semantics) | NOT RUN | — |
| M4-4 | DST boundary (LOCAL) | Ruler across a DST change (e.g. 2026-03-08 US) with `calendarUnit:"hours"` | Absolute-hour stepping shows the 1h wall-clock offset — documented v1 behavior; confirm it reads acceptably | NOT RUN | — |
| M4-5 | Comp fps resolution | Timecode ruler `frameRateMode:"comp"` on a 29.97 comp, then a 25fps comp | 29.97 → `;` drop-frame labels (when `dropFrame:true`); 25 → `:` ND labels; matches real comp fps | NOT RUN | — |
| M4-6 | Drop-frame warning path | Custom fps 25 + `dropFrame:true` via `generate` | `TC_DROPFRAME_UNSUPPORTED` warning surfaced; labels stay non-drop `:` | NOT RUN | — |
| M4-7 | Cyclic 12 months on the ring | Circular ruler, calendar cyclic months 2026-01-01→2027-01-01, sweep 360 | Jan..Dec placed end-exclusively; NO January repeated at the closure seam | NOT RUN | — |
| M4-8 | dateFormat tokens in AE text | `time.dateFormat:"MMM YYYY"` etc. | Text layers show the tokenized label exactly as `labelFor` returns (token subset only) | NOT RUN | — |
| M4-9 | Density safety valve | Calendar seconds unit over a multi-year range (bypassing validation caps) | `CALENDAR_RANGE_TOO_LARGE` error envelope, no AE hang | NOT RUN | — |

---

## 6. M5 Animation Rig & Expressions — manual in-AE

> The animation rig modules (`host/ae/expression-builder.jsxinc`,
> `host/ae/controller-builder.jsxinc`, and `host/rig/*.jsxinc`) are covered
> by 37 automated cases inside `tests/ae-mock-harness.js` (105/105 passed).
> Real After Effects expression compilation and live playback require testing
> in the real host engine. Statuses are honestly `NOT RUN`.

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| M5-1 | Master Controller Effects | Generate in `output.mode:"rig"` -> select `TR_0001_CTRL_MAIN` | Effect Controls panel displays exactly 11 controls (5 main + 6 style) with configured defaults | NOT RUN | — |
| M5-2 | Marker Position Animation | Keyframe / scrub `Progress` slider from 0 to 100 | Marker travels along the circular / linear path without jitter or offset | NOT RUN | — |
| M5-3 | Progress Trim Paths | Scrub `Progress` slider with `indicators.progress:true` | Trim Paths End follows Progress slider from 0% to 100% along the full baseline polyline | NOT RUN | — |
| M5-4 | Highlight Layer Range | Generate with `indicators.highlight:true`; scrub Highlight Start / End | Highlight line segment trims cleanly between the two slider percentages | NOT RUN | — |
| M5-5 | Reveal Staggered Wipe | Scrub `Reveal` slider from 0 to 100 | Ticks and labels fade in progressively along the ruler in sequence of normalized position | NOT RUN | — |
| M5-6 | Numeric Counter Live Text | Scrub `Progress` slider with numeric time mode | `TR_0001_COUNTER` text updates live with interpolated value matching precision and prefix/suffix; follows marker position | NOT RUN | — |
| M5-7 | Rotation Offset | Scrub `Rotation Offset` angle control | Entire ruler rotates around master controller pivot; child layers follow | NOT RUN | — |
| M5-8 | Live Style Color Binds | Change `Major Color`, `Minor Color`, `Label Color` in Effect Controls | Tick strokes and label text fills update color immediately without regenerating | NOT RUN | — |
| M5-9 | Reveal Density Cap | Generate ruler with > 600 items in rig mode | Generation succeeds; warning "Reveal simplified for dense ruler" surfaced; no expression overload dialog | NOT RUN | — |
| M5-10 | Multi-Instance Rig Isolation | Generate two rig instances (0001 and 0002) in the same composition | Scrubbing Progress on instance 0001 does NOT affect instance 0002; unique layer references | NOT RUN | — |

---

## 7. M6 Instance Management — manual in-AE

> Instance management operations (`update`, `regenerate`, `detach`, `getInstanceConfig`)
> are covered by automated cases in `tests/ae-mock-harness.js`. Testing in the
> real host ensures undo history integrity and real metadata comment tracking.

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| M6-1 | Update Rig Sliders | Select instance in panel list; change Progress in panel; click Update | Sliders on `TR_<ID>_CTRL_MAIN` update immediately without regenerating layers | NOT RUN | — |
| M6-2 | Regenerate Geometry | Change time range or radius; click Regenerate; confirm dialog | Existing instance layers replaced; new counts applied; instance ID preserved | NOT RUN | — |
| M6-3 | User Layers Preserved | Add custom video/solid layers; regenerate ruler instance | Custom layers remain intact; only layers matching `TIME_RULER\|1.0\|<id>` replaced | NOT RUN | — |
| M6-4 | Detach Instance | Select instance; click Detach; confirm dialog | Layer comments cleared; layers remain in comp; instance removed from panel list | NOT RUN | — |
| M6-5 | Multi-Instance Discovery | Generate multiple instances in one comp; click Refresh Instances | All active instances listed with controller name, ID, and layer counts | NOT RUN | — |
| M6-6 | Load Config from Snapshot | Click an instance in the instance list | Saved config snapshot extracted from controller comment; panel fields update | NOT RUN | — |

---

## 8. M7 Presets & Client UI — manual in-AE

> The preset engine and client UI bindings are verified via automated tests in
> `tests/ae-mock-harness.js`. Visual layout, tab switching, and CEP file dialogs
> require validation in the real CEP panel.

| # | Case | Steps | Expected | Status | AE version |
|---|------|-------|----------|--------|------------|
| M7-1 | Built-in Presets | Select each of the 4 built-in presets; click Load | All 4 presets load into panel, updating geometry, time, elements, style fields | NOT RUN | — |
| M7-2 | Save User Preset | Modify settings; click Save Preset; enter custom name | Preset saved in `localStorage`; appears under "User Presets" group in dropdown | NOT RUN | — |
| M7-3 | Duplicate Preset | Select built-in preset; click Duplicate; enter name | Copy created as user preset; built-in remains protected and untouched | NOT RUN | — |
| M7-4 | JSON Import / Export | Export config to JSON; modify externally; import back | Dialog opens via `cep.fs` (or browser fallback); fields populated cleanly | NOT RUN | — |
| M7-5 | Tab Navigation & Responsiveness | Switch between all 6 tabs; resize CEP panel width | Tab panels switch cleanly; inputs scale and wrap per responsive CSS | NOT RUN | — |
| M7-6 | Field Validation Feedback | Enter invalid sweep angle (e.g. 500) or end before start; click Generate | Invalid field highlighted red with tooltip error; toast error displayed | NOT RUN | — |
| M7-7 | Offline / Not-in-AE Mode | Open `client/index.html` in Chrome/Edge outside AE | Status pill shows "Not in AE"; UI remains interactive; honest error toast on host calls | NOT RUN | — |

---

**Reminder:** do not mark any version as "supported" in user-facing docs until
its row above is actually executed (spec §12.5: test for real, not theoretically).
