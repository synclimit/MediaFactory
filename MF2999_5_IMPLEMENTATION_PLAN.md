# MF-2999.5 — Architecture Decision Gate Implementation Plan

The objective of **MF-2999.5** is to make the final, evidence-based engineering decision for the MediaFactory V3 rendering backend based entirely on the empirical evidence gathered during MF-2999.1 through MF-2999.4B.

This milestone DOES NOT implement V3. It ONLY evaluates evidence and issues the official Architecture Decision. No production code inside `src/`, `backend/`, or `electron/` will be modified.

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
    ├── ✅ MF-2999.4 Visualizer Spike
    ├── ✅ MF-2999.4A Validation Audit
    ├── ✅ MF-2999.4B Root Cause Isolation
    ├── ▶ MF-2999.5 Architecture Decision Gate
    │
    ▼
MF-3000 V3 (LOCKED — Waiting for User Approval)
```

---

## User Review Required

> [!IMPORTANT]
> **Pure Evidence-Based Architecture Decision**:
> The decision will be derived exclusively from empirical evidence artifacts (`ROOT_CAUSE_MATRIX.md`, `ROOT_CAUSE_REPORT.json`, `ROOT_CAUSE_EXPERIMENTS.md`, `MF2999_SPIKE_VALIDATION_REPORT.md`, `report.json`, `diff.png`) without architectural bias or forced assumptions.

---

## Required Evidence Review

The decision gate evaluates:
- `ROOT_CAUSE_MATRIX.md` (10.42% Color Space Gradient, 1.69% Subpixel AA, 0.35% Blend/Gamma)
- `ROOT_CAUSE_REPORT.json` (Structured test results)
- `ROOT_CAUSE_EXPERIMENTS.md` (6 isolation experiments)
- `MF2999_SPIKE_VALIDATION_REPORT.md` (Validation audit)
- `experiments/compare/report.json` (Pixel compare report)
- `experiments/compare/diff.png` (Visual diff image)

---

## Architecture Evaluation Matrix

The evaluation assesses CanvasKit against 6 core criteria:
1. **Pixel Accuracy**: Difference % (12.46%), Max Delta (224), Mean Delta (157.85).
2. **Algorithm Reuse**: `drawVisualizer.js` reuse (86.75% reused, 13.25% rewrite ratio).
3. **Rendering Quality**: Gradient color space shift (sRGB vs Linear sRGB), AA edge coverage.
4. **Performance**: WASM init (81ms), Render time (318ms), Memory (84.12 MB).
5. **Maintainability**: Swappable `IRenderBackend` interface compatibility.
6. **Production Risk**: WASM loading overhead, color space calibration requirement.

---

## Possible Verdicts

1. **`PASS`**: CanvasKit becomes the official MediaFactory V3 renderer. Proceed to MF-3000.
2. **`LIMITED`**: CanvasKit is usable but requires color space calibration in `FrameComposer` or dual-mode OSR option before V3 migration. Roadmap pauses.
3. **`FAIL`**: CanvasKit is rejected. MF-3000 must redesign the renderer architecture.

---

## Proposed Changes

### Component 1 — Decision & Execution Reports

#### [NEW] [ARCHITECTURE_DECISION_REPORT.md](file:///d:/MediaFactory/ARCHITECTURE_DECISION_REPORT.md)
- Formal architecture decision document containing Evidence Summary, Evaluation Matrix, Pros, Cons, Remaining Risks, Final Verdict, and Engineering Recommendation.

#### [NEW] [EXECUTION_REPORT_MF2999_5.md](file:///d:/MediaFactory/EXECUTION_REPORT_MF2999_5.md)
- Execution log documenting reviewed reports, decision trace, and roadmap handoff recommendation.

---

## Verification Plan

### Automated Tests
- Verify all evidence reports exist on disk.
- Verify `git status` confirms zero production files in `src/` or `backend/` are modified.

### Manual Verification & Stop Condition
- **STRICT STOP CONDITION**: Stop execution immediately after `ARCHITECTURE_DECISION_REPORT.md` is generated. MediaFactory V3 (MF-3000) MUST NOT start automatically. Await explicit user approval.
