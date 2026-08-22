# MF-2999.4C — Chromium Renderer Verification Implementation Plan (Host: Puppeteer Headless Chromium)

The objective of **MF-2999.4C** is to benchmark Chromium's native Canvas2D rendering engine against the Live Editor baseline using **Puppeteer Headless Chromium** as the explicit renderer host, outputting an uncompressed **RGBA Frame Buffer** (`frame.rgba`) and PNG image (`render.png`) verified through a **3-step gated audit** (Draw Command Audit $\rightarrow$ Geometry Audit $\rightarrow$ Pixel Comparison).

All work remains 100% isolated inside `experiments/chromium/`. No production code inside `src/`, `backend/`, or `electron/` will be modified.

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
    ├── ✅ MF-2999.4 CanvasKit Visualizer
    ├── ✅ MF-2999.4A Validation Audit
    ├── ✅ MF-2999.4B Root Cause Isolation
    ├── ▶ MF-2999.4C Chromium Renderer Verification
    └── ⏳ MF-2999.5 Architecture Decision Gate
              │
              ▼
          MF-3000 V3 (LOCKED)
```

---

## Renderer Host Selection & Rationale

- **Selected Renderer Host**: **Puppeteer Headless Chromium** (`puppeteer ^25.1.0` already present in MediaFactory `package.json`).
- **Rationale for Selection**:
  1. **Pure Headless Skia Canvas2D Engine**: Launches Chromium in `--headless=new` mode with hardware GPU Skia Canvas2D rasterization without Electron window or IPC overhead.
  2. **Direct RGBA Frame Extraction**: Provides instant zero-loss binary extraction of raw RGBA pixel arrays (`getImageData(0,0,1920,1080).data.buffer`) directly into Node.js `Buffer`.
  3. **100% V3 Reusability**: The Puppeteer Headless Chromium rendering worker pattern established in this spike will be reused 1:1 by `BackendRenderRuntime` and `FrameComposer` in **MediaFactory V3 (MF-3000)**.

---

## V3 Pipeline & Dual Output Specification

$$\mathtt{drawVisualizer.js} \longrightarrow \text{Puppeteer Chromium Canvas2D} \longrightarrow \mathtt{frame.rgba} \text{ (8,294,400 bytes)} \longrightarrow \mathtt{render.png} \text{ (Audit Only)}$$

- **`frame.rgba`**: Raw RGBA 32-bit uncompressed binary buffer ($1920 \times 1080 \times 4 = 8,294,400\text{ bytes}$). Primary V3 render buffer format.
- **`render.png`**: PNG encoded frame generated exclusively for pixel comparison benchmarking against `baseline_frame.png`.

---

## Gated 3-Step Verification Sequence

- **Gate 1 — Draw Command Trace Audit**: Log all drawing commands (`fillRect`, `createLinearGradient`, `fillStyle`, `alpha`, `transform`) into `DRAW_COMMAND_TRACE.json`. Compare against baseline trace. If commands differ, **STOP IMMEDIATELY**.
- **Gate 2 — Geometry Audit**: Log exact coordinates ($x, y, w, h$, FFT amplitude) for all 256 bars into `GEOMETRY_REPORT.json`. If geometry differs, **STOP IMMEDIATELY**.
- **Gate 3 — Step-Gated Pixel Benchmark**: Perform pixel-by-pixel RGBA comparison **ONLY** after Gates 1 & 2 return `PASS`.

---

## User Review Required

> [!IMPORTANT]
> **Strict Success Criteria**:
> Puppeteer Chromium Renderer is classified as **`PASS`** ONLY IF:
> 1. Draw Commands == `PASS`
> 2. Geometry == `PASS`
> 3. Pixel Difference $\le 0.05\%$
> Otherwise, Renderer is classified as **`FAIL`**.

---

## Proposed Changes

### Component 1 — Puppeteer Chromium Renderer Harness

#### [NEW] [render_visualizer.js](file:///d:/MediaFactory/experiments/chromium/render_visualizer.js)
- Puppeteer Headless Chromium renderer script.
- Launches Headless Chromium, executes `drawVisualizer.js` logic on 1920x1080 canvas.
- Extracts `frame.rgba` ($8,294,400\text{ bytes}$) and encodes `render.png`.
- Writes `renderer_metadata.json`, `DRAW_COMMAND_TRACE.json`, and `GEOMETRY_REPORT.json`.

#### [NEW] [renderer_metadata.json](file:///d:/MediaFactory/experiments/chromium/renderer_metadata.json)
- Metadata containing: `width` (1920), `height` (1080), `stride` (7680), `pixelFormat` ("RGBA32"), `renderDuration`, `rendererHost` ("Puppeteer Headless Chromium"), `chromiumVersion`.

---

### Component 2 — Audit & Validation Deliverables

#### [NEW] [DRAW_COMMAND_TRACE.json](file:///d:/MediaFactory/DRAW_COMMAND_TRACE.json)
- Trace log of all Canvas2D drawing operations ($256 \times \mathtt{fillRect}$, gradients, transforms).

#### [NEW] [GEOMETRY_REPORT.json](file:///d:/MediaFactory/GEOMETRY_REPORT.json)
- Audit log of $x, y, w, h$ coordinates and FFT amplitudes for all 256 spectrum bars.

#### [NEW] [RENDERER_AUDIT.md](file:///d:/MediaFactory/RENDERER_AUDIT.md)
- Step-by-step audit log of Gates 1, 2, and 3.

#### [NEW] [OSR_VALIDATION_REPORT.md](file:///d:/MediaFactory/OSR_VALIDATION_REPORT.md)
- Final validation report documenting Puppeteer Chromium benchmark results.

---

## Verification Plan

### Automated Tests
- Run:
  ```powershell
  node experiments/chromium/render_visualizer.js
  node experiments/compare/pixel_compare.js
  ```
- Verify `frame.rgba` ($8,294,400\text{ bytes}$), `render.png`, and `renderer_metadata.json` are created.

### Manual Verification & Stop Condition
- **STRICT STOP CONDITION**: Stop execution immediately after the benchmark completes.
- **MF-2999.5 Architecture Decision Gate** remains **LOCKED** until both CanvasKit AND Puppeteer Chromium empirical evidence files are reviewed by the user.
