# MF-2999.4B — Root Cause Isolation Implementation Plan

The objective of **MF-2999.4B** is to scientifically isolate and quantify the individual contributions of color space, gradient interpolation, subpixel snapping, anti-aliasing, blend modes, and gamma handling to the measured **12.46065% pixel difference** between HTML5 Canvas 2D and CanvasKit WASM.

This sprint does NOT attempt to fix the renderer. All work remains 100% isolated inside `experiments/`. No production code inside `src/`, `backend/`, or `electron/` will be modified.

---

## Roadmap Position

```
Roadmap V2
    COMPLETE
         │
         ▼
MF-2999 Rendering Backend Spike
    ├── ✅ MF-2999.1 Baseline Capture
    ├── ✅ MF-2999.2 Pixel Comparison Framework
    ├── ✅ MF-2999.3 CanvasKit Compatibility
    ├── ⚠ MF-2999.4 CanvasKit Visualizer (REOPENED)
    ├── ✅ MF-2999.4A Validation Audit
    ├── ▶ MF-2999.4B Root Cause Isolation
    └── ⏳ MF-2999.5 Architecture Decision
              │
              ▼
          MF-3000 V3 (LOCKED)
```

---

## User Review Required

> [!IMPORTANT]
> **Pure Variables Isolation (No Renderer Modifications)**:
> This milestone WILL NOT modify production code or force a renderer fix. It will execute 6 controlled variable isolation experiments to measure the exact percentage contribution of each rendering layer to the total 12.46% pixel delta.

---

## Controlled Experiments Suite

### Experiment 1 — Color Space
- Compare sRGB vs Linear sRGB vs Premultiplied alpha color space models in CanvasKit shader creation.

### Experiment 2 — Gradient Interpolation
- Replace horizontal linear gradient with a solid fill color (`#AB55F7`) across both HTML5 Canvas 2D and CanvasKit WASM to isolate gradient-specific color drift.

### Experiment 3 — Subpixel Coordinate Snapping
- Compare integer-rounded coordinates `Math.round(x)` against floating-point coordinates `x` to isolate subpixel boundary deltas.

### Experiment 4 — Anti-Aliasing (AA)
- Compare `setAntiAlias(true)` vs `setAntiAlias(false)` on Skia paints to isolate edge antialiasing contribution.

### Experiment 5 — Blend Modes
- Compare `BlendMode.SrcOver` vs `BlendMode.Src` vs `BlendMode.DstOver` to isolate alpha compositing deltas.

### Experiment 6 — Gamma Curve Handling
- Evaluate sRGB gamma transfer function variations against linear transfer functions.

---

## Proposed Changes

### Component 1 — Isolation Experiments Runner

#### [NEW] [root_cause_experiments.js](file:///d:/MediaFactory/experiments/canvaskit/root_cause_experiments.js)
- Automated isolation runner script executing Experiments 1 through 6 against the ground-truth baseline (`baseline_frame.png`).

---

### Component 2 — Scientific Analysis & Reports

#### [NEW] [ROOT_CAUSE_REPORT.json](file:///d:/MediaFactory/ROOT_CAUSE_REPORT.json)
- Structured JSON report containing metrics for all 6 experiments.

#### [NEW] [ROOT_CAUSE_MATRIX.md](file:///d:/MediaFactory/ROOT_CAUSE_MATRIX.md)
- Engineering contribution breakdown matrix isolating the estimated percentage contribution of each factor to the total 12.46% delta.

#### [NEW] [ROOT_CAUSE_EXPERIMENTS.md](file:///d:/MediaFactory/ROOT_CAUSE_EXPERIMENTS.md)
- Complete scientific experimental methodology and findings log.

---

## Verification Plan

### Automated Tests
- Run:
  ```powershell
  node experiments/canvaskit/root_cause_experiments.js
  ```
- Verify `ROOT_CAUSE_REPORT.json`, `ROOT_CAUSE_MATRIX.md`, and `ROOT_CAUSE_EXPERIMENTS.md` are generated cleanly.

### Manual Verification & Stop Condition
- Inspect `ROOT_CAUSE_MATRIX.md` to confirm the estimated contributions sum logically to explaining the 12.46% delta.
- **STRICT STOP CONDITION**: Stop execution immediately after MF-2999.4B is completed. Do NOT attempt fixes, do NOT proceed to MF-2999.5. Wait for user review.
