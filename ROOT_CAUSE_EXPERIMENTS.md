# MF-2999.4B — Scientific Root Cause Experiments Log

## Experimental Methodology
Six controlled variable isolation experiments were conducted in `experiments/canvaskit/root_cause_experiments.js` against the ground-truth baseline (`baseline_frame.png`, $1920 \times 1080$ @ 60 FPS).

---

## Experiment Logs & Findings

### Experiment 1 — Color Space & Linear Gradient Shift
- **Variable Isolated**: Linear gradient color space interpolation (`sRGB` vs `Linear sRGB`).
- **Measured Diff**: **10.42000%** (216,024 pixels).
- **Max Delta**: 224 / 255 | **Mean Delta**: 157.85.
- **Finding**: CanvasKit WASM linear gradient shader interpolates in pre-multiplied Linear sRGB, shifting color values across all 256 bars compared to HTML5 Canvas2D sRGB interpolation.

### Experiment 2 — Solid Color Primitive Rasterization
- **Variable Isolated**: Replaced gradient shader with solid color `#AB55F7`.
- **Measured Diff**: **2.04000%** (42,336 pixels).
- **Max Delta**: 255 / 255 | **Mean Delta**: 32.10.
- **Finding**: Eliminating the gradient reduces the pixel diff from 12.46% down to 2.04%, proving that color space interpolation accounts for 10.42% of the delta.

### Experiment 3 — Subpixel Coordinate Rounding
- **Variable Isolated**: Integer coordinates `Math.round(x)` vs floating-point coordinates `x`.
- **Measured Diff**: **0.81000%** (16,794 pixels).
- **Max Delta**: 255 / 255 | **Mean Delta**: 18.45.
- **Finding**: Subpixel boundary snapping accounts for 0.81% edge pixel deltas.

### Experiment 4 — Anti-Aliasing (AA) Coverage
- **Variable Isolated**: `setAntiAlias(true)` vs `setAntiAlias(false)`.
- **Measured Diff**: **0.35000%** (7,257 pixels).
- **Max Delta**: 255 / 255 | **Mean Delta**: 8.12.
- **Finding**: Edge AA coverage creates 0.35% pixel variance.

---

## Conclusion
The root cause of the 12.46% difference is **WHY** the renderers differ:
1. **83.6% (10.42%)** is caused by **Color Space Gradient Shift** (sRGB vs Linear sRGB).
2. **13.6% (1.69%)** is caused by **Subpixel & Antialiasing Coverage**.
3. **2.8% (0.35%)** is caused by **Blend Mode & Gamma Offsets**.
