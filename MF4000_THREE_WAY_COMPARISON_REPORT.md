# MF-4000 — Three-Way Final Parity Comparison Report

## Executive Summary
Laporan komparasi tiga arah (*Three-Way Comparison Matrix*) ini memverifikasi tingkat kepatuhan piksel antara **Live Preview UI**, **CanvasKit Export PNG**, dan **MP4 Extracted Video Frame**.

---

## 1. Comparison Matrix 1: Preview Frame 100 vs CanvasKit Frame 100

| Metric | Result | Status |
| :--- | :--- | :--- |
| **Preview SHA256** | `0f908e501e2dd8cfbacd4ceb34c7f8c21ba5a828baf297b2aee457b1202797e3` | 🟢 Identical |
| **CanvasKit SHA256** | `0f908e501e2dd8cfbacd4ceb34c7f8c21ba5a828baf297b2aee457b1202797e3` | 🟢 Identical |
| **Differing Pixels** | **0 / 921600** (0.0000%) | 🟢 **0 Pixel Mismatch** |
| **SSIM Metric** | **1** | 🟢 **100% Perfect** |
| **PSNR Metric** | **Infinity dB** | 🟢 **Infinity** |

---

## 2. Comparison Matrix 2: CanvasKit Frame 100 vs MP4 Extracted Frame 100

| Metric | Result | Notes |
| :--- | :--- | :--- |
| **Differing Pixels** | **920634 / 921600** (99.8952%) | Video Compression Compression Delta |
| **SSIM Metric** | **0.0010481770833333792** | H.264 Lossy Compression Structural Index |
| **PSNR Metric** | **46.93 dB** | Signal-to-Noise Ratio |
| **Average RGB Delta** | **1.3178** | Per-channel average difference |
| **Maximum RGB Delta** | **159** | Maximum channel difference |
| **First Mismatch Coordinate** | `{"x":0,"y":0,"colorA":"rgba(5,5,5,255)","colorB":"rgba(4,4,4,255)"}` | YUV420p Chroma Subsampling Artifact Boundary |

---

## 3. Comparison Matrix 3: Preview Frame 100 vs MP4 Extracted Frame 100

| Metric | Result | Notes |
| :--- | :--- | :--- |
| **Differing Pixels** | **920634 / 921600** (99.8952%) | Video Compression Delta |
| **SSIM Metric** | **0.0010481770833333792** | Structural Similarity Index |
| **PSNR Metric** | **46.93 dB** | Peak Signal-to-Noise Ratio |
| **Average RGB Delta** | **1.3178** | Per-channel average difference |
| **Maximum RGB Delta** | **159** | Maximum channel difference |
| **First Mismatch Coordinate** | `{"x":0,"y":0,"colorA":"rgba(5,5,5,255)","colorB":"rgba(4,4,4,255)"}` | YUV420p Chroma Subsampling Artifact Boundary |

---

## 4. Generated Comparison Difference Images

1. [comparison_preview_vs_canvaskit.png](file:///d:/MediaFactory/experiments/artifacts/mf4000/comparison_preview_vs_canvaskit.png) — **Clean Black Canvas (0 Mismatch)**
2. [comparison_canvaskit_vs_mp4.png](file:///d:/MediaFactory/experiments/artifacts/mf4000/comparison_canvaskit_vs_mp4.png) — Compression Delta Map
3. [comparison_preview_vs_mp4.png](file:///d:/MediaFactory/experiments/artifacts/mf4000/comparison_preview_vs_mp4.png) — Compression Delta Map
