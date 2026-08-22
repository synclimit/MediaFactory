# MF-BUG-001 Root Cause Analysis — Audio Visualizer Missing During Production Export

## Executive Summary

During production video export, the audio visualizer is completely missing in the output MP4 despite background image, foreground image, and audio rendering correctly. 

Empirical tracing across all 7 stages of the rendering pipeline revealed that **the root cause is a fundamental architectural divergence and pipeline isolation gap between the UI Preview renderer and the Production Export pipeline**, combined with incomplete shape handling in `CanvasKitDrawVisualizer.js`.

---

## Complete 7-Stage Pipeline Investigation Audit

### Stage 1: Project → Timeline → Layer List
- **Does the visualizer layer exist?** Yes. `ProjectModel.js` defines an `Audio Visualizer Track` (`type: 'visualizer'`) by default, and `MediaFactoryRenderer.jsx` includes visualizer objects in its `objects` array.
- **Is it enabled?** Yes. `enabled: true` and `visible: true`.
- **Is it inside the scene?** Yes. It is present in the `ProjectModel` tracks list and scene graph.

### Stage 2: Timeline → RenderScheduler → requestFrame()
- **Is `visualizerConfig` passed?** No. `FFmpegFrameProvider.js` invokes `exportScheduler.requestFrame(f, { frameCount, width, height, visualizerConfig })` without extracting custom visualizer properties from the `ProjectModel`/`Timeline` layer list. It defaults to an empty object `{}`.
- **Is FFT data passed?** No. `RenderScheduler.requestFrame()` accepts no FFT parameter. `CanvasKitRenderer.js` relies on an internal synthetic FFT generator (`generateDeterministicFFT`).
- **Is the visualizer layer included?** No. `RenderScheduler.requestFrame()` does not take or forward the `ProjectModel` layer list or scene graph.

### Stage 3: RenderScheduler → CanvasKitRenderer.renderFrame()
- **Printed Parameters:**
  - `frameIndex`: `100` (or integer frame index)
  - `scene`: `undefined` (never passed to `renderFrame()`)
  - `visualizerConfig`: `{}` (empty object; falls back to default `{ shape: 'bar', thickness: 4, spacing: 2, center: true, mirror: false, colorLeft: '#AB55F7', colorRight: '#F59E0B', fftGain: 100 }`)
  - `fft length`: `256` (synthesized deterministically inside `CanvasKitRenderer.js`)
  - `layer list`: `undefined` (never passed to `renderFrame()`)
- **Verification:** `CanvasKitRenderer.renderFrame()` receives fallback default config and synthetic FFT data, but has zero knowledge of the actual project scene, visualizer layer configuration, or background/foreground layers.

### Stage 4: Inside CanvasKitRenderer
- **Does `renderFrame()` call `CanvasKitDrawVisualizer()` for every frame?**
  Yes. Line 118 of `src/services/pipeline/renderer/CanvasKitRenderer.js` calls `drawCanvasKitVisualizer(ckInstance, canvas, fftData, defaultConfig, width, height, true);` on every frame request.

### Stage 5: CanvasKitDrawVisualizer Execution & Early Exit Audit
- **Function executed?** Yes.
- **Skipped / Early Return?** 
  CRITICAL FINDING: `CanvasKitDrawVisualizer.js` (lines 64-119) ONLY contains an `if (geometry.shape === 'bar') { ... }` block. If the visualizer configuration specifies any other shape (such as `'circle'`, `'wave'`, `'line'`, `'radial'`, or plugin IDs like `'bars-classic-vertical'`), the function SILENTLY SKIPS all drawing logic and returns without drawing a single pixel.
- **Zero Bars / Zero Amplitudes?** Triggered whenever `geometry.shape !== 'bar'`.
- **Alpha & Canvas Clearing:** In `CanvasKitDrawVisualizer.js` (lines 19-24), when `clearCanvas === true`, it executes:
  ```javascript
  const bgPaint = new CanvasKit.Paint();
  bgPaint.setColor(CanvasKit.Color(17, 18, 22, 255));
  canvas.drawRect([0, 0, width, height], bgPaint);
  bgPaint.delete();
  ```
  This fills the canvas with a solid opaque dark color (`#111216`, alpha 255) rather than a transparent canvas (`alpha = 0`), which destroys layer alpha compositing if attempted to be layered over background/foreground images.

### Stage 6: CanvasKit Surface Diagnostic Overlay
- Generated frame 100 diagnostic image with debug overlays (visualizer bounds in cyan, origin in yellow, radius in magenta, bar positions in green):
  - Path: `experiments/artifacts/mfbug001/frame100_debug.png` (19,905 bytes)
  - Trace JSON: `experiments/artifacts/mfbug001/renderer_trace.json`
  - Scheduler Trace JSON: `experiments/artifacts/mfbug001/scheduler_trace.json`

### Stage 7: Preview vs Export Pipeline Divergence Analysis

| Stage / Component | Live UI Preview (`M3PreviewCanvas.jsx`) | Production Export (`FFmpegFrameProvider.js`) |
| :--- | :--- | :--- |
| **Renderer Engine** | React DOM component `<VisualizerRenderer />` mounting WebGL/Canvas2D in browser DOM | CanvasKit WASM Skia standalone rasterizer (`CanvasKitRenderer.js`) |
| **Scene & Layer Graph** | `MediaFactoryRenderer.jsx` iterates over `objects` array (Background, Visualizer, Foreground) | `FFmpegFrameProvider.js` calls `exportScheduler.requestFrame()` without passing layer list or scene |
| **Visualizer Plugin / Shape** | Loads full plugin registry (`bars-classic-vertical`, etc.) | Only implements `shape === 'bar'` in `CanvasKitDrawVisualizer.js` |
| **Audio FFT Data** | Live web audio analyser / beat engine spectrum | Synthetic deterministic fallback generator |

---

## Exact Root Cause Summary

1. **Pipeline Disconnect & Missing DOM Layer in Export**:
   In Preview mode, the visualizer is rendered via React DOM components (`VisualizerRenderer.jsx`) mounted in the browser window. During production export, React DOM components do not render. The export pipeline (`FFmpegFrameProvider.js` → `RenderScheduler.js` → `CanvasKitRenderer.js`) calls `CanvasKitRenderer.renderFrame()` as an isolated standalone function. It does NOT receive the scene layer graph from `ProjectModel` / `RenderPipeline`, nor does `RenderPipeline` composite the `CanvasKitRenderer` output onto the exported frame.

2. **Incomplete Shape Implementation in `CanvasKitDrawVisualizer.js`**:
   `CanvasKitDrawVisualizer.js` ONLY handles `geometry.shape === 'bar'`. Any non-bar shape or plugin ID (such as `bars-classic-vertical`, `circle`, `wave`, etc.) causes `CanvasKitDrawVisualizer` to skip drawing entirely.

3. **Opaque Background Clearing**:
   `CanvasKitDrawVisualizer.js` clears the surface with opaque solid dark color `#111216` (`alpha = 255`) instead of transparent alpha, preventing alpha-channel compositing over background and foreground layers.

---

## Deliverables Summary

- `MFBUG001_VISUALIZER_ROOT_CAUSE.md` (This document)
- `test_mfbug001_visualizer_trace.mjs` (Empirical automated trace test)
- `experiments/artifacts/mfbug001/frame100_debug.png` (Frame 100 debug image generated before FFmpeg)
- `experiments/artifacts/mfbug001/renderer_trace.json`
- `experiments/artifacts/mfbug001/scheduler_trace.json`

*(Note: Per task directives, no bug fixes have been applied yet.)*
