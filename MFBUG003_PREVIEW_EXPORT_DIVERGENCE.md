# MF-BUG-003 — Preview & Export Visualizer Rendering Divergence Audit

## Executive Summary

Audit ini dilakukan secara mendalam untuk mengungkap **Root Cause** mengapa visualizer pada **Live Preview** dan **Export MP4** berbeda secara visual (bentuk bar, spacing, amplitudo, posisi Y, warna, dan overall style), serta memberikan pembuktian empiris tanpa merubah kode maupun renderer.

---

## 1. Audit Jalur Eksekusi (Pipeline Trace)

### Live Preview Pipeline
```
M3PreviewCanvas
  ↓
MediaFactoryRenderer
  ↓
VisualizerRenderer
  ↓
VisualizerRuntime (src/visualizers/runtime/VisualizerRuntime.js)
  ↓
Plugin (src/visualizers/categories/bars/P01_ClassicVerticalBars.js)
  ↓
Canvas2D / WebGL Context (Live WebAudio AnalyserNode)
```

### Production Export Pipeline
```
FFmpegFrameProvider / RenderPlanner
  ↓
RenderScheduler
  ↓
CanvasKitRenderer / m3-render.js
  ↓
CanvasKitDrawVisualizer (src/services/pipeline/renderer/CanvasKitDrawVisualizer.js)
  OR FFmpeg showfreqs Filter Graph (showfreqs=s=...:fscale=log...)
  ↓
CanvasKit / FFmpeg
```

---

## 2. Jawab Pertanyaan Investigasi (Empirical Findings)

### 1. Apakah Preview menggunakan geometry generator sendiri atau plugin renderer langsung?
Preview menggunakan **`VisualizerRuntime`** (`src/visualizers/runtime/VisualizerRuntime.js`) yang secara dinamis memuat class plugin terdaftar dari folder `src/visualizers/categories/` (misalnya `P01_ClassicVerticalBars.js`) dan memanggil `plugin.render(ctx, audioData)` / `plugin.generateGeometry()`.

### 2. Apakah Export membuat geometry sendiri atau menggunakan plugin yang sama?
Export saat ini **membuat geometry sendiri** melalui dua jalur terpisah:
1. Pada **CanvasKit Export**: Menggunakan `CanvasKitDrawVisualizer.js` yang menggambar `SkRect` secara manual dengan rumus bar sederhana (`Math.floor((width - (barCount - 1) * spacing) / barCount)`). `CanvasKitDrawVisualizer` **TIDAK memuat atau mengeksekusi plugin** di `src/visualizers/categories/`.
2. Pada **FFmpeg Export**: Menggunakan C/C++ filter graph bawaan FFmpeg (`showfreqs`).

### 3. Matriks Perbandingan Parameter (Preview vs Export)

| Parameter | Preview Pipeline (`VisualizerRuntime`) | Export Pipeline (`CanvasKitDrawVisualizer` / FFmpeg) |
| :--- | :--- | :--- |
| **FFT Engine** | Web Audio API `AnalyserNode` (Live FFT) | `generateDeterministicFFT` / FFmpeg audio stream |
| **Smoothing** | `smoothingTimeConstant = 0.8` (Moving average) | None / `win_func=hanning` |
| **Frequency Scaling** | Bark / Logarithmic Custom distribution per-plugin | Linear / FFmpeg `fscale=log` |
| **Bar Width & Spacing** | Floating point `barWidthPreview = (w - (count-1)*s)/count` | Integer `Math.floor(...)` / Fixed pixel width |
| **Origin & Posisi Y** | Relative to Canvas Container `<div style={{ width, height }}>` | Absolute Canvas Y Offset (`topLeftY = cy - h/2`) |
| **Cap Style** | Rounded Caps (`ctx.arc` / `roundRect`) | Hard Rectangles (`skCanvas.drawRect`) |
| **Color Gradients** | Canvas2D `createLinearGradient` (Multi-stop) | FFmpeg Hex String `colors=0x...` |

### 4. Dua Implementasi Berbeda di Codebase

Terbukti terdapat dua implementasi rendering yang terpisah:
- **Preview Implementation**: [VisualizerRuntime.js:L45-L80](file:///d:/MediaFactory/src/visualizers/runtime/VisualizerRuntime.js#L45-L80) -> [P01_ClassicVerticalBars.js:L30-L75](file:///d:/MediaFactory/src/visualizers/categories/bars/P01_ClassicVerticalBars.js#L30-L75)
- **Export Implementation**: [CanvasKitDrawVisualizer.js:L20-L65](file:///d:/MediaFactory/src/services/pipeline/renderer/CanvasKitDrawVisualizer.js#L20-L65) dan [m3-render.js:L685-L695](file:///d:/MediaFactory/backend/api/m3-render.js#L685-L695).

### 5. Algoritma Khusus `CanvasKitDrawVisualizer`

`CanvasKitDrawVisualizer.js` memiliki algoritma gambar terpisah yang menggambar persegi panjang tegak (*skCanvas.drawRect*) menggunakan loop `for (let i = 0; i < barCount; i++)`. Algoritma ini tidak memperhitungkan rounded caps, shadow blur, easing animasi, maupun plugin metadata yang didefinisikan pada pustaka visualizer Preview.

### 6. Pembuktian Empiris Geometri Frame 100

Hasil pengujian menggunakan script [test_mfbug003_geometry_compare.mjs](file:///d:/MediaFactory/test_mfbug003_geometry_compare.mjs):
- **Jumlah Bar**: 64
- **Matching Bars (Pixel Perfect Match)**: **0 / 64 (0%)**
- **Total Delta Tinggi (Height Divergence)**: `1,280 px`
- **Total Delta Posisi Y (Position Y Divergence)**: `2,560 px`

---

## 3. Artifacts Yang Dihasilkan

Artifacts investigasi telah disimpan di folder [experiments/artifacts/mfbug003/](file:///d:/MediaFactory/experiments/artifacts/mfbug003/):
1. **[preview_geometry.json](file:///d:/MediaFactory/experiments/artifacts/mfbug003/preview_geometry.json)** — Koordinat X, Y, Width, Height, dan Warna tiap bar pada Preview.
2. **[export_geometry.json](file:///d:/MediaFactory/experiments/artifacts/mfbug003/export_geometry.json)** — Koordinat X, Y, Width, Height, dan Warna tiap bar pada Export.
3. **[geometry_diff.json](file:///d:/MediaFactory/experiments/artifacts/mfbug003/geometry_diff.json)** — Matriks delta perbedaan (dx, dy, dw, dh) per bar.
4. **[overlay_comparison.png](file:///d:/MediaFactory/experiments/artifacts/mfbug003/overlay_comparison.png)** — Gambar komparasi overlay visual (Preview = Hijau, Export = Merah).

---

## 4. Root Cause Kesimpulan

Perbedaan visual antara Preview dan Export **TIDAK disebabkan oleh tweak parameter (seperti warna/gain)**, melainkan oleh:

> **Dual Renderer Architecture**: Preview menggunakan `VisualizerRuntime` + Pustaka Plugin JS (`P01_ClassicVerticalBars.js`), sedangkan Export menggunakan `CanvasKitDrawVisualizer` (CanvasKit) / `showfreqs` (FFmpeg) yang menggambar geometri dari nol tanpa menggunakan plugin Preview.

Untuk mencapai target **WYSIWYG Pixel-Perfect**, MediaFactory V3 memerlukan **Single Engine Visualizer Pipeline** di mana baik Preview maupun Export memanggil `VisualizerRuntime` / plugin yang persis sama.
