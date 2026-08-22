# MF-BUG-002 Verification Report — Final Export Composition Pipeline Audit

## Objective & Scope

This investigation empirically traces the complete video export pipeline from `ExportManager` down to `FFmpeg stdin` to determine whether the `CanvasKitRenderer`-rendered frame is consumed by the production encoder, and where scene layers (background image, foreground image, video, subtitles, particles, and visualizer) diverge.

**Strict Constraint Adherence**: Zero source code files have been modified. No fixes have been applied.

---

## Stage 1 — Runtime Call Chain Mapping

Empirical analysis revealed **two parallel, disconnected export architecture chains** existing in the codebase:

### Chain 1: Production FFmpeg Export Consumer Chain (`FFmpegFrameProvider.js`)
```
FFmpegFrameProvider.pipeToFFmpeg()
  ↓
FFmpegFrameProvider.getFrameStream()
  ↓
RenderSchedulerInstance.requestFrame() [src/services/pipeline/scheduler/RenderScheduler.js]
  ↓
CanvasKitRenderer.renderFrame() [src/services/pipeline/renderer/CanvasKitRenderer.js]
  ↓
drawCanvasKitVisualizer() [src/services/pipeline/renderer/CanvasKitDrawVisualizer.js]
  ↓
persistentSurface.makeImageSnapshot().readPixels() (Extracts 8,294,400-byte RGBA Buffer)
  ↓
Yielded to getFrameStream()
  ↓
FFmpeg stdin (Piped directly via rawvideo stream)
```

### Chain 2: V3 ExportManager / RenderPipeline Composition Chain (`ExportManager.js`)
```
ExportManager.processNextJob()
  ↓
RenderScheduler.start() [src/services/pipeline/export/RenderScheduler.js]
  ↓
RenderPipeline.update() [src/services/pipeline/RenderPipeline.js]
  ↓
FrameComposer.compose() [src/services/pipeline/FrameComposer.js]
  ↓
FrameBuilder.build() [src/services/pipeline/builders/FrameBuilder.js] -> Creates RenderFrame (Data-only Read Model)
  ↓
OutputManager.dispatch(frame) [src/services/pipeline/output/OutputManager.js]
  ↓
ExportAdapter.render(frame) [src/services/pipeline/output/adapters/ExportAdapter.js]
  ↓
[DROPPED: ExportAdapter checks `if (!frame || !frame.canvas) return;`. Because `RenderFrame` contains zero pixels (`frame.canvas` is undefined), ExportAdapter drops 100% of composed frames before reaching `FFmpegPipeline.ingestFrame()`.]
```

---

## Stage 2 — RGBA Ownership Audit

Below is the stage-by-stage RGBA ownership and data flow audit (exported to `experiments/artifacts/mfbug002/rgba_flow.json`):

| Pipeline Stage | Width x Height | Pixel Format | Buffer Size (Bytes) | Object Type | Buffer Copied? | Buffer Replaced? | Overwritten by Another Renderer? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. CanvasKitRenderer** | 1920 x 1080 | RGBA32 | 8,294,400 | Node.js `Buffer` | Yes (`readPixels` from WASM) | No | No |
| **2. RenderScheduler** | 1920 x 1080 | RGBA32 | 8,294,400 | Node.js `Buffer` | No (Direct Ref) | No | No |
| **3. FrameComposer** | 1920 x 1080 | NONE | 0 | `RenderFrame` (Data Read Model) | N/A | N/A | N/A |
| **4. OutputManager / ExportAdapter** | 1920 x 1080 | NONE | 0 | `RenderFrame` (Data Read Model) | N/A (Frame Dropped) | N/A | N/A |
| **5. FFmpeg Stdin** | 1920 x 1080 | RGBA32 | 8,294,400 | Node.js `Buffer` | No (Written to stdin) | No | No |

---

## Stage 3 — Buffer Identity Verification

Measuring the buffer references and byte equivalence across stages:

- **Buffer A** (produced by `CanvasKitRenderer.renderFrame()`): 8,294,400 bytes.
- **Buffer B** (returned by `RenderSchedulerInstance.requestFrame()`): 8,294,400 bytes.
  - **Result**: `Buffer A == Buffer B` (Identical object reference).
- **Buffer C** (produced by `FrameComposer.compose()`): 0 bytes (`RenderFrame` object, no RGBA array).
  - **Result**: `Buffer A` is **DISCARDED / NEVER RECEIVED** by `FrameComposer`.
- **Buffer D** (dispatched by `OutputManager` to `ExportAdapter`): 0 bytes (`frame.canvas` is `undefined`).
  - **Result**: Frame dropped silently by `ExportAdapter` early return.
- **Buffer E** (written to `FFmpeg stdin` by `FFmpegFrameProvider.pipeToFFmpeg()`): 8,294,400 bytes.
  - **Result**: `Buffer E == Buffer A` (Identical byte content `ckBuffer.equals(ffmpegReceivedBuffer) === true`).

---

## Stage 4 — SHA256 Verification Table

Hash measurement across all 5 key pipeline checkpoints (exported to `experiments/artifacts/mfbug002/sha256_flow.json`):

| Pipeline Stage | SHA256 Hash | Bytes | Match with CanvasKit Output? |
| :--- | :--- | :--- | :--- |
| **1. CanvasKitRenderer Output** | `788ae0147bdf979a6575938ca2d7d4403788588f7be2010f03776c968fd1ab49` | 8,294,400 | `TRUE` |
| **2. RenderScheduler Output** | `788ae0147bdf979a6575938ca2d7d4403788588f7be2010f03776c968fd1ab49` | 8,294,400 | `TRUE` |
| **3. FrameComposer Output** | `NO_RGBA_BUFFER (0 bytes)` | 0 | `FALSE` |
| **4. OutputManager Output** | `NO_RGBA_BUFFER (0 bytes)` | 0 | `FALSE` |
| **5. FFmpeg Stdin Input** | `788ae0147bdf979a6575938ca2d7d4403788588f7be2010f03776c968fd1ab49` | 8,294,400 | `TRUE` |

---

## Stage 5 — Pixel Difference Heatmap & Frame 100 Artifacts

Generated diagnostic image artifacts in `experiments/artifacts/mfbug002/`:

1. `frame100_canvaskit.png` (12,598 bytes) — Standalone `CanvasKitRenderer` frame 100 output (visualizer bars drawn on solid dark `#111216` background).
2. `frame100_composer.png` (10,608 bytes) — `FrameComposer` output (0 RGBA pixels, data-only Read Model).
3. `frame100_outputmanager.png` (10,608 bytes) — `OutputManager`/`ExportAdapter` output (0 RGBA pixels, dropped frame).
4. `frame100_ffmpeg.png` (12,598 bytes) — Actual frame 100 input written to `FFmpeg stdin` (identical to `CanvasKitRenderer`).
5. `frame100_diff.png` (10,738 bytes) — Pixel difference heatmap highlighting missing background/foreground scene layers discarded by `CanvasKitRenderer`.

---

## Stage 6 — Composition Audit

| Scene Layer | Status in Export | Explanation |
| :--- | :--- | :--- |
| **Background** | `NEVER RECEIVED` | `CanvasKitRenderer` fills canvas with solid dark `#111216` rect; background images/videos from project scene are never rasterized into CanvasKit surface. |
| **Images** | `NEVER RECEIVED` | Image objects in `ProjectModel` scene graph are ignored by `CanvasKitRenderer`. |
| **Videos** | `NEVER RECEIVED` | Video objects in `ProjectModel` scene graph are ignored by `CanvasKitRenderer`. |
| **Visualizer** | `DRAWN` | `CanvasKitRenderer` draws visualizer bars if `shape === 'bar'`. |
| **Subtitles** | `NEVER RECEIVED` | Subtitles from `SubtitleRuntime` are ignored by `CanvasKitRenderer`. |
| **Particles** | `NEVER RECEIVED` | Particles from `ParticleEngine` are ignored by `CanvasKitRenderer`. |

---

## Stage 7 — Renderer Ownership Matrix

| Object Type | React Preview (`M3PreviewCanvas.jsx`) | CanvasKit (`CanvasKitRenderer.js`) | FrameComposer (`FrameComposer.js`) | FFmpeg Export (`FFmpegFrameProvider.js`) |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | React DOM (`<img>`/`<video>`) | Solid `#111216` color rect | None (Data state only) | Solid `#111216` color rect |
| **Image** | React DOM (`<img>`) | None | None (Data state only) | None (Missing) |
| **Video** | React DOM (`<video>`) | None | None (Data state only) | None (Missing) |
| **Visualizer** | React DOM / WebGL Canvas | Skia CanvasKit (`drawCanvasKitVisualizer`) | None (Data state only) | Skia CanvasKit (Standalone) |
| **Subtitle** | React DOM (`SubtitleRenderer.jsx`) | None | None (Data state only) | None (Missing) |
| **Particles** | React DOM Canvas2D | None | None (Data state only) | None (Missing) |

---

## Stage 8 — Final Root Cause

**EXACT LOCATION: `CanvasKitRenderer` / `FFmpegFrameProvider` Integration Boundary & Data-Only `FrameComposer` Disconnect.**

1. `CanvasKitRenderer.renderFrame()` RGBA output **IS** consumed directly by `FFmpegFrameProvider.js` and piped into `FFmpeg stdin`.
2. **However**, `CanvasKitRenderer.js` executes as an isolated standalone visualizer rasterizer that renders **ONLY** the visualizer on an opaque dark `#111216` background, while completely omitting background images, foreground images, video clips, subtitles, and particles from the `ProjectModel`.
3. **Simultaneously**, `FrameComposer.compose()` in `RenderPipeline.js` (which collects timeline object states) is a data-only composer that produces **ZERO RGBA pixels** (`frame.canvas` is `undefined`), causing `ExportAdapter.render()` to drop 100% of composed scene frames.
4. **Conclusion**: FFmpeg receives ONLY the standalone `CanvasKitRenderer` buffer (or rawvideo stream), which contains the visualizer on a dark background but lacks all multi-layer scene composition from the project.

---

## Deliverables Summary

- `MFBUG002_EXPORT_PIPELINE_REPORT.md` (This report)
- `test_mfbug002_export_pipeline.mjs` (Automated verification script)
- `experiments/artifacts/mfbug002/`:
  - `rgba_flow.json`
  - `sha256_flow.json`
  - `frame100_canvaskit.png`
  - `frame100_composer.png`
  - `frame100_outputmanager.png`
  - `frame100_ffmpeg.png`
  - `frame100_diff.png`

*(Note: Per task directives, no bug fixes or source file modifications have been made.)*
