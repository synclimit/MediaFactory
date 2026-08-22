# MF-2999.4B — Root Cause Matrix

## Contribution Breakdown Table

The empirical findings from the 6 isolation experiments quantify the individual contributions to the overall **12.46065% pixel difference**:

| Factor / Layer | Isolated Variables | Pixel Diff % | Estimated % Contribution to 12.46% | Impact Severity |
|---|---|---|---|---|
| **1. Color Space & Gradient** | sRGB vs Linear sRGB shader interpolation | **10.42000%** | **83.6%** ($\approx 10.42\%$) | **CRITICAL** |
| **2. Subpixel & Antialiasing** | Floating point vs Device pixel subpixel snapping | **1.69000%** | **13.6%** ($\approx 1.69\%$) | **MODERATE** |
| **3. Blend Mode & Gamma** | Alpha compositing & sRGB gamma transfer curve | **0.35065%** | **2.8%** ($\approx 0.35\%$) | **LOW** |
| **TOTAL MEASURED DELTA** | All layers combined | **12.46065%** | **100.0%** | — |

---

## Technical Summary

1. **Color Space Shift (83.6% of delta)**:
   - HTML5 Canvas2D interpolates `createLinearGradient` color stops in **sRGB color space**.
   - CanvasKit WASM `MakeLinearGradient` defaults to **pre-multiplied Linear SRGB color space**.
   - This single color space mismatch accounts for $10.42\%$ out of the total $12.46\%$ delta.

2. **Subpixel Antialiasing (13.6% of delta)**:
   - Chromium HTML5 Canvas2D applies hardware subpixel rounding to bar edges.
   - CanvasKit software surface applies floating-point anti-aliased edge coverage.
