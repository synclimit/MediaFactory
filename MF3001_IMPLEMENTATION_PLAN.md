# MF-3001 — drawVisualizer CanvasKit Port Implementation Plan

The objective of **MF-3001** is to adapt the production MediaFactory visualizer algorithm (`src/services/pipeline/renderer/drawVisualizer.js`) 1:1 into CanvasKit (`src/services/pipeline/renderer/CanvasKitDrawVisualizer.js`) by replacing standard Canvas2D API calls with native CanvasKit Skia WASM calls while preserving 100% of the visualizer algorithm, geometry, FFT normalization, center anchoring, and gradient math.

This sprint is strictly limited to rendering API migration. No algorithm redesign, no React UI components, no Workers, OffscreenCanvas, IPC, FFmpeg, or `DrawCommand` abstractions will be introduced.

---

## Roadmap Position

```
Roadmap V2 (COMPLETED)
        │
        ▼
MF-2999 Rendering Backend Spike (COMPLETED)
        │
        ▼
MediaFactory V3
    ├── ✅ MF-3000 CanvasKit Foundation POC
    ├── ▶ MF-3001 drawVisualizer Port
    ├── ⏳ MF-3002 Master Loop & Shared Buffer Engine
    ├── ⏳ MF-3003 Preview Viewport Migration
    └── ⏳ MF-3004 FFmpeg Raw Video Pipe Integration
```

---

## Mandatory Rewrite Budget & Preservation Rules

1. **Algorithm Preservation (100%)**:
   - FFT normalization, bar iteration loop, spacing, bar thickness, center anchor calculations ($cx=960, cy=540$), opacity, and gradient color stop positioning are preserved 1:1.
2. **API-Only Replacement**:
   - `ctx.fillRect()` $\rightarrow$ `canvas.drawRect(CanvasKit.XYWHRect(...), paint)`
   - `ctx.createLinearGradient()` $\rightarrow$ `CanvasKit.Shader.MakeLinearGradient(...)`
   - `ctx.fillStyle` $\rightarrow$ `paint.setShader(...)`
3. **Rewrite Budget Constraint ($\le 20\%$)**:
   - Original `drawVisualizer.js`: 83 total lines (72 lines algorithm/geometry, 11 lines Canvas2D calls).
   - Expected Rewrite Ratio: $11 / 83 = 13.25\%$ (PASS — within 20% budget).

---

## User Review Required

> [!IMPORTANT]
> **Strict Deliverable Scope**:
> MF-3001 produces EXACTLY 3 files:
> 1. `src/services/pipeline/renderer/CanvasKitDrawVisualizer.js`
> 2. `test_mf3001_visualizer.mjs`
> 3. `MF3001_VISUALIZER_REPORT.md`
> Nothing more. No changes to `src/components/`.

---

## Open Questions

None.

---

## Proposed Changes

### Component 1 — Production CanvasKit Visualizer Port

#### [NEW] [CanvasKitDrawVisualizer.js](file:///d:/MediaFactory/src/services/pipeline/renderer/CanvasKitDrawVisualizer.js)
- 1:1 production port of `drawVisualizer.js` into CanvasKit Skia WASM API.
- Exposes:
  - `drawCanvasKitVisualizer(CanvasKit, canvas, dataArray, config, width, height)`: Executes bar loop, linear gradient shader, and Skia rect draws.

---

### Component 2 — Verification Suite & Report

#### [NEW] [test_mf3001_visualizer.mjs](file:///d:/MediaFactory/test_mf3001_visualizer.mjs)
- Automated verification script checking:
  1. Real production FFT input array processes cleanly.
  2. `drawCanvasKitVisualizer` renders 1080p frame into `frame.rgba` ($8,294,400\text{ bytes}$) and `frame.png`.
  3. Reused lines count ($\ge 70$), rewritten lines count ($\le 15$), and rewrite ratio ($\le 20\%$).

#### [NEW] [MF3001_VISUALIZER_REPORT.md](file:///d:/MediaFactory/MF3001_VISUALIZER_REPORT.md)
- Architectural certification report documenting code reuse metrics, rewrite percentage, render performance, and SHA-256 fingerprint.

---

## Verification Plan

### Automated Tests
- Run:
  ```powershell
  node test_mf3001_visualizer.mjs
  ```
- Verify all checks pass and rewrite ratio is $\le 20\%$.

### Manual Verification & Stop Condition
- **STRICT STOP CONDITION**: Stop execution immediately after `MF3001_VISUALIZER_REPORT.md` is generated. Await explicit user review before starting MF-3002.
