# MF-3003 — Preview Consumer Integration Implementation Plan

The objective of **MF-3003** is to integrate `CanvasKitRenderer` (`src/services/pipeline/renderer/CanvasKitRenderer.js`) into the Live Editor Preview component (`src/components/m3/M3PreviewCanvas.jsx`), making the Preview component the first production consumer of MediaFactory V3's single rendering engine.

The Preview component is strictly a **framebuffer consumer**. It contains **ZERO** rendering math, FFT generation, gradient calculations, or Canvas2D drawing code. It requests frames exclusively through `CanvasKitRenderer.renderFrame()` and presents the returned `rgbaBuffer`.

---

## Roadmap Position

```
MF-2999 ✅ Rendering Backend Spike
MF-3000 ✅ CanvasKit Foundation
MF-3001 ✅ CanvasKit Visualizer Port
MF-3002 ✅ Master Renderer Engine
────────────────────────────
ENGINE COMPLETE
────────────────────────────
MF-3003 ▶ Preview Consumer Integration
MF-3004 ⏳ FFmpeg Consumer Integration
MF-3005 ⏳ Performance Benchmark
MF-3006 ⏳ RenderScheduler
```

---

## Architectural Rules & Consumer Separation

1. **Preview Is a Consumer, Not a Renderer**:
   - Preview contains NO FFT math, NO gradient shaders, NO geometry calculations, and NO Canvas2D `fillRect`/`roundRect` calls.
   - Dual-path rendering (Canvas2D preview + FFmpeg render) is completely eliminated.
2. **Exclusive Frame Requests**:
   - Preview requests frames exclusively via `CanvasKitRenderer.renderFrame({ frameIndex, frameCount, width, height, visualizerConfig })`.
3. **Pure RGBA Display**:
   - Preview receives `rgbaBuffer` ($1920 \times 1080 \times 4 = 8,294,400\text{ bytes}$) and displays it on its viewport canvas using zero-copy / `putImageData` display logic.
4. **Zero Renderer Code Modifications**:
   - `CanvasKitRenderer.js` and `CanvasKitDrawVisualizer.js` remain completely untouched.

---

## User Review Required

> [!IMPORTANT]
> **Strict Scope Isolation (Exactly 4 Deliverables)**:
> MF-3003 produces EXACTLY 4 files:
> 1. `src/components/m3/M3PreviewCanvas.jsx` (Modified to consume `CanvasKitRenderer.renderFrame()`)
> 2. `test_mf3003_preview.mjs` (Automated empirical verification suite)
> 3. `MF3003_PREVIEW_REPORT.md` (Certification report)
> 4. `experiments/artifacts/mf3003/preview_screenshot.png` (Temporary verification screenshot)

---

## Open Questions

None.

---

## Proposed Changes

### Component 1 — Production Preview Consumer Component

#### [MODIFY] [M3PreviewCanvas.jsx](file:///d:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx)
- Connects `M3PreviewCanvas` to `CanvasKitRenderer.renderFrame()`.
- Removes all legacy Canvas2D `drawVisualizer` invocations inside the preview component.
- Displays returned `rgbaBuffer` onto viewport canvas via `ImageData` / `putImageData` display adapter.

---

### Component 2 — Verification Suite & Artifacts

#### [NEW] [test_mf3003_preview.mjs](file:///d:/MediaFactory/test_mf3003_preview.mjs)
- Automated verification script checking:
  1. Preview initializes `CanvasKitRenderer` exactly once.
  2. Preview never invokes Canvas2D rendering or `drawCanvasKitVisualizer` directly.
  3. Preview receives valid `rgbaBuffer` from `renderFrame()`.
  4. Displayed frame SHA-256 equals `verification.sha256`.
  5. Zero duplicate rendering path exists.
  6. Generates `experiments/artifacts/mf3003/preview_screenshot.png` for visual inspection.

#### [NEW] [MF3003_PREVIEW_REPORT.md](file:///d:/MediaFactory/MF3003_PREVIEW_REPORT.md)
- Certification report documenting consumer integration metrics, single-renderer verification, and SHA-256 parity.

---

## Verification Plan

### Automated Tests
- Run:
  ```powershell
  node --expose-gc test_mf3003_preview.mjs
  ```
- Verify all 6 checks pass cleanly and `preview_screenshot.png` is generated.

### Manual Verification & Stop Condition
- **STRICT STOP CONDITION**: Stop execution immediately after `MF3003_PREVIEW_REPORT.md` is generated.
- Do NOT begin MF-3004. Await explicit user review.
