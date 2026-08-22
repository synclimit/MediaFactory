# Visual Continuity Certification Specification (MF-1409)

## Overview

**End-to-End Visual Continuity Certification** provides the final empirical validation layer for MediaFactory Fast Workspace (Roadmap V2.1).

While previous certification sprints (MF-1400 through MF-1408-CERT) verified procedural formulas, PRNG period boundary math, classification registries, and adaptation dispatchers, MF-1409 verifies actual rendered frame visual continuity:

$$\text{Rendered Frame}_{t = 0} \equiv \text{Rendered Frame}_{t = T_{\text{loop}}} \quad (\text{within tolerance } \epsilon)$$

---

## Architecture Flow

The certification layer is completely renderer-agnostic and interacts exclusively through the `RenderingContext` gateway API. It never calls procedural strategies directly.

```
                  ┌────────────────────────┐
                  │     M3 Project State   │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │    RenderingContext    │
                  └─────┬────────────┬─────┘
                        │            │
         t = 0.0s       │            │       t = T_loop (10.0s)
     (Loop Start)       │            │       (Loop End)
                        ▼            ▼
               ┌───────────┐      ┌───────────┐
               │  Golden   │      │ Loop End  │
               │   Frame   │      │   Frame   │
               └─────┬─────┘      └─────┬─────┘
                     │                  │
                     └────────┬─────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │    FrameComparator     │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │  Certification Result  │
                  └────────────────────────┘
```

---

## 1. Golden Frame Generation

`GoldenFrameSuite.js` is responsible for generating Golden Frames:
1. **Golden Frame ($t = 0.0\text{s}$)**: Sampled at the start of the master loop.
2. **Loop End Frame ($t = T_{\text{loop}}$)**: Sampled at the exact loop boundary duration (default 10.0s).

Both frames are evaluated using `RenderingContext.getPreviewObjects()` to reflect full workspace adaptation without bypassing any runtime transformations.

---

## 2. Frame Comparison & Pixel Math

`FrameComparator.js` compares frame outputs in two primary modes:

### A. Raw Pixel Buffer Comparison (`ImageData` / `Uint8ClampedArray`)
For flat RGBA buffers, channel-by-channel absolute difference is computed across all pixels:

$$\Delta_{\text{pixel}} = \sum_{i=1}^{N} |A[i] - B[i]|$$

$$\Delta_{\text{max}} = \max_{1 \le i \le N} |A[i] - B[i]|$$

$$\bar{\Delta} = \frac{\Delta_{\text{pixel}}}{\text{Compared Pixels}}$$

### B. Structured Rendered State Comparison
For object trees and adapted parameters, all numerical render properties (e.g. scale, rotation, displacement offset, alpha, FFT spectrum caches) are extracted recursively and evaluated:

$$\text{Identical} = \begin{cases} 
\text{true} & \text{if } \Delta_{\text{max}} \le \epsilon \\
\text{false} & \text{if } \Delta_{\text{max}} > \epsilon 
\end{cases}$$

---

## 3. Floating Point Tolerance

Due to floating-point precision characteristics in trigonometric PRNG functions ($\sin$, $\cos$), a standard tolerance of $\epsilon = 1 \times 10^{-4}$ (or $1 \times 10^{-6}$ for pure procedural formulas) is enforced.

- **Acceptable variation ($\Delta \le 10^{-4}$)**: Microscopic floating point rounding noise.
- **Unacceptable variation ($\Delta > 10^{-4}$)**: Temporal boundary popping or seam discontinuity.

---

## 4. Failure Diagnostics & Examples

### Failure Example 1: Discontinuous Strobe Flash (`strobe-flash`)
- **Cause**: High-frequency non-periodic state at $t = 10.0\text{s}$.
- **Result**:
  ```json
  {
    "passed": false,
    "failedObjects": ["strobe1"],
    "maxDifference": 0.85,
    "tolerance": 0.0001
  }
  ```
- **Diagnostic Action**: Features marked as `Unsupported` or `TIMELINE_ONLY` produce expected boundary failure when evaluated out of fast loop mode.

### Failure Example 2: Non-Periodic Noise Seed Drift
- **Cause**: Linear time parameter $t$ passed without loop normalization $t \pmod{T_{\text{loop}}}$.
- **Result**: Frame at $t = 10.0$ differs from frame at $t = 0.0$.
- **Diagnostic Action**: Verify that adaptation occurs via `RenderingContext` and `PeriodicNoiseStrategy`/`SeededNoiseStrategy`.

---

## 5. Acceptance Criteria

Sprint **MF-1409** is certified when:
1. `tests/certification/FrameComparator.js` compares frame structures independently of Fast Workspace.
2. `tests/certification/GoldenFrameSuite.js` produces Golden Frames ($t=0$) and test frames ($t=T$).
3. `tests/certification/VisualContinuityCertification.js` exposes public `certifyProject(project)` using only `RenderingContext`.
4. `test_mf1409_visual_continuity.mjs` verifies visual continuity for:
   - `PeriodicNoise`
   - `SeededNoise`
   - `FFTCache`
   - `Camera Shake`
   - `Visualizer`
   - `Particle`
   - `Mixed Scene`
   - `Complete Project`
5. All regression tests (MF-1300 through MF-1408-CERT) remain 100% green with ZERO regressions.
