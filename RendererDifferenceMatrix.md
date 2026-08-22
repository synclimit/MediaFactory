# Renderer Difference Matrix — MF-1406A.7

| Root Cause ID | Visual Property | Preview Implementation | Export Implementation | Initial Status | Root Cause Classification | Affected File | Resolution Applied |
|---|---|---|---|---|---|---|---|
| **RC-01** | Bar Count / Frequency Bins | 256 bars (`dataArray.length`) | Unconstrained `showfreqs` bin count | Mismatch | Geometry | `backend/api/m3-render.js` | Added `:nb_freqs=${barCount}` to `showfreqs` filter |
| **RC-02** | Color Gradient Fallback | `colorLeft` & `colorRight` from object props | `c2 = colorRight \|\| c1` | Matched | Color | `backend/api/m3-render.js` | Verified color parameter fallback parity |
| **RC-03** | Default Overlay Dimensions | `1920x180` at `x:0, y:900` | `1920x180` at `x:0, y:900` | Matched | Geometry | `src/components/m3/panels/VisualizerPanel.jsx` | Fixed default coordinates to full bottom width |
| **RC-04** | Transparency Keying | Transparent HTML5 `<canvas>` background | `colorkey=0x000000:0.2:0.1` | Matched | Color / Alpha | `backend/api/m3-render.js` | Keyed out black background for transparent overlay |

---

## Audit Certification Summary
- **Verified AdaptationResult Parity**: 100% (Confirmed by `PreviewSnapshot.json` vs `ExportSnapshot.json`)
- **Zero Procedural Mismatches**: 0
- **Total Resolved Renderer Root Cause IDs**: 4
- **Architecture Freeze Violation**: NONE (0 core modules modified)
