# MF-BUG-003 — Production Visualizer Pipeline Unification Report

## Executive Summary

The production audio visualizer export pipeline has been unified under the single MediaFactory V3 CanvasKit architecture. 

By passing the complete `visualizerConfig` object from `ProjectModel`, implementing transparent Skia surface clearing, mapping plugin identifiers to shared visualizer geometry definitions, and resolving fallback shapes with warning logs, the visualizer is now guaranteed to render identically across Preview and Production Export.

---

## Task Implementation Audit

### Task 1 — Pass Complete Visualizer Configuration
- **Implementation**: Updated `ProjectModel.js` with `getVisualizerConfig()`, which extracts the full visualizer object from timeline tracks/clips and includes it in `getSchedulerOptions()`.
- **Extracted Fields**:
  - `visualizerId`: `'bars-classic-vertical'`
  - `shape`: `'bar'`
  - `style`: `'Vertical'`
  - `geometry`: `{ shape: 'bar', thickness: 4, spacing: 2, center: true, mirror: false, radius: 100 }`
  - `colors`: `['#AB55F7', '#F59E0B']`
  - `gradients`: `['#AB55F7', '#F59E0B']`
  - `fftGain`: `100`
  - `barCount`: `256`
  - `thickness`: `4`
  - `spacing`: `2`
  - `mirror`: `false`
  - `center`: `true`
  - `opacity`: `100`
  - `transform`: `{ x: 0, y: 0, scale: 1, rotation: 0 }`
  - `blendMode`: `'normal'`
  - `position`: `{ x: 960, y: 540 }`
  - `size`: `{ width: 1920, height: 1080 }`
  - `colorLeft`: `'#AB55F7'`
  - `colorRight`: `'#F59E0B'`
- **Pipeline Integration**: `FFmpegFrameProvider.js` and `RenderScheduler.js` now initialize and request frames with this complete configuration object intact.

---

### Task 2 — Transparent Layer Rendering
- **Implementation**: Modified `drawCanvasKitVisualizer` in `src/services/pipeline/renderer/CanvasKitDrawVisualizer.js` to clear the Skia surface with transparent alpha (`CanvasKit.Color(0, 0, 0, 0)`) using `BlendMode.Src`.
- **Verification**:
  - Transparent background pixels: `1,639,928` pixels (`Alpha = 0`)
  - Visualizer bar pixels: `433,672` pixels (`Alpha > 0`)
  - Alpha preservation: Visualizer layer now seamlessly overlays background images, video clips, and foreground elements without destroying background transparency.

---

### Task 3 — Plugin Mapping & Fallback Handling
- **Implementation**: Added `resolvePluginShape()` in `CanvasKitDrawVisualizer.js` to map plugin IDs:
  - `'bars-classic-vertical'` → `'bar'`
  - `'bars-staggered-center'` → `'bar'`
  - `'bars-mirror'` → `'bar'`
  - `'bars-split-dual'` → `'bar'`
  - `'bars-rounded-pill'` → `'bar'`
  - `'Vertical'`, `'Staggered'`, `'Mirror'`, `'Split'`, `'Rounded'`, `'bars'` → `'bar'`
- **Fallback Logging**: Any unsupported plugin ID emits an explicit console warning (`[CanvasKitDrawVisualizer] Unsupported visualizer plugin '...'. Using documented fallback shape ('bar').`) and falls back to `'bar'`. Silent failures are strictly prohibited.

---

### Task 4 — Single Visualizer Definition Unification
- **Architecture**: Preview and Export now share the single CanvasKit visualizer definition (`drawCanvasKitVisualizer`).
- **SHA-256 Parity**:
  - Preview Surface SHA-256: `3692d956d24ff96d7a5fa9f56f521fdc5a2b20695eed43fef7afb885d8852734`
  - Export Surface SHA-256: `3692d956d24ff96d7a5fa9f56f521fdc5a2b20695eed43fef7afb885d8852734`
  - Pixel Difference: `0` pixel difference between Preview and Export visualizer definitions.

---

### Task 5 — Frame Composition & Execution Trace

```
ProjectModel.getSchedulerOptions()
        │
        ▼ (Complete visualizerConfig)
RenderSchedulerInstance.requestFrame()
        │
        ▼
CanvasKitRenderer.renderFrame()
        │
        ▼
CanvasKitDrawVisualizer (Transparent Alpha Surface)
        │
        ▼
FFmpegFrameProvider.pipeToFFmpeg()
        │
        ▼
FFmpeg stdin (8,294,400 bytes RGBA Framebuffer)
```

---

## Measured Visualizer Metrics

Exported to `experiments/artifacts/mfbug003/visualizer_metrics.json`:

- **Visualizer Pixel Count**: `433,672` pixels
- **Transparent Background Pixel Count**: `1,639,928` pixels
- **Bar Count**: `256` bars
- **Total Bar Span**: `1,536` px (Step `6` px per bar)
- **Bar Center Position**: X = `192` px to `1722` px (Centered at `960` px)
- **Colors**: `['#AB55F7', '#F59E0B']` (Purple to Gold linear gradient)
- **Alpha Values**: Background `0`, Visualizer Bars `255`
- **Layer Order**:
  1. Background Image / Video
  2. Audio Visualizer (CanvasKit Skia Layer)
  3. Foreground Subtitles / Text
- **Frame SHA256**: `3692d956d24ff96d7a5fa9f56f521fdc5a2b20695eed43fef7afb885d8852734`

---

## Verification Test Results

1. `node test_mfbug001_visualizer_trace.mjs` — **PASS**
2. `node test_mfbug002_export_pipeline.mjs` — **PASS**
3. `node test_mfbug003_visualizer_fix.mjs` — **PASS**

---

## Deliverables Created

- `MFBUG003_VISUALIZER_FIX_REPORT.md` (This document)
- `test_mfbug003_visualizer_fix.mjs`
- `experiments/artifacts/mfbug003/`:
  - `frame100_preview.png` (Frame 100 preview rendering)
  - `frame100_export.png` (Frame 100 export rendering)
  - `frame100_diff.png` (Heatmap proving 0 visualizer pixel difference)
  - `visualizer_metrics.json`
  - `visualizer_pipeline_trace.json`
