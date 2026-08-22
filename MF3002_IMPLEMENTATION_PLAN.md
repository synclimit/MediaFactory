# MF-3002 — Master Loop & Shared Buffer Engine Implementation Plan (Final Architecture)

The objective of **MF-3002 (Final)** is to establish the first production rendering pipeline for MediaFactory V3 by combining `CanvasKitRuntime` and `CanvasKitDrawVisualizer` into `src/services/pipeline/renderer/CanvasKitRenderer.js`.

This module creates a single deterministic frame rendering loop that outputs a 1080p uncompressed RGBA framebuffer (`frame.rgba`) for every requested frame. This framebuffer becomes the single source of truth for all future V3 consumers (Preview, FFmpeg, Image Export).

No Preview component, React integration, Worker threads, OffscreenCanvas, IPC channels, FFmpeg, Timeline migration, or `DrawCommand` abstractions will be introduced.

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
    ├── ✅ MF-3000 CanvasKit Foundation
    ├── ✅ MF-3001 drawVisualizer CanvasKit Port
    ├── ▶ MF-3002 Master Loop & Shared Buffer Engine
    ├── ⏳ MF-3003 Preview Viewport Integration
    ├── ⏳ MF-3004 FFmpeg Raw Video Pipeline
    ├── ⏳ MF-3005 Performance Benchmark
    └── ⏳ MF-3006 RenderScheduler
```

---

## Final Production API (`CanvasKitRenderer.js`)

`CanvasKitRenderer.js` exposes **ONLY** 3 public lifecycle functions:

1. **`initialize()`**:
   - Asynchronously initializes CanvasKit WASM **ONCE** and reuses runtime for all subsequent frames.

2. **`renderFrame({ frameIndex, frameCount, width, height, visualizerConfig })`**:
   - Renders 1 deterministic frame and returns:
     ```javascript
     {
       rgbaBuffer,

       metadata: {
         frameIndex,
         width,
         height,
         stride,
         pixelFormat
       },

       verification: {
         sha256
       },

       diagnostics: {
         renderDurationMs,
         memoryUsageMB,
         canvasKitVersion
       }
     }
     ```
   - **`metadata` Structure (Frame Properties)**:
     - `frameIndex`: Integer index of requested frame.
     - `width`: Frame width in pixels ($1920$).
     - `height`: Frame height in pixels ($1080$).
     - `stride`: Row stride in bytes ($7680$).
     - `pixelFormat`: `"RGBA32"`.
   - **`verification` Structure (Identity & Integrity)**:
     - `sha256`: SHA-256 fingerprint hex hash of `rgbaBuffer`.
   - **`diagnostics` Structure (Runtime Execution)**:
     - `renderDurationMs`: Frame rendering duration in milliseconds.
     - `memoryUsageMB`: Current process RSS/Heap memory footprint.
     - `canvasKitVersion`: Skia WASM runtime version string.

3. **`destroyRenderer()`**:
   - Terminates the renderer runtime and disposes all persistent CanvasKit state.

---

## Verification Artifacts & Deliverables

Deliverables consist of 3 production/report files + 1 temporary verification artifact:

1. `src/services/pipeline/renderer/CanvasKitRenderer.js` (Production renderer engine)
2. `test_mf3002_renderer.mjs` (Automated verification test suite)
3. `MF3002_RENDERER_REPORT.md` (Certification report)
4. `experiments/artifacts/mf3002/frame_reference.rgba` (Temporary test artifact: $8,294,400\text{ bytes}$, not version controlled)

---

## User Review Required

> [!IMPORTANT]
> **Independent Concerns Separation**:
> `renderFrame()` separates physical frame `metadata`, identity `verification`, and performance `diagnostics` into independent objects. `experiments/artifacts/mf3002/frame_reference.rgba` is generated as a temporary test artifact. Zero UI components in `src/components/` are modified.

---

## Proposed Changes

### Component 1 — Production Master Loop Renderer Engine

#### [NEW] [CanvasKitRenderer.js](file:///d:/MediaFactory/src/services/pipeline/renderer/CanvasKitRenderer.js)
- Production master loop rendering engine module combining `initCanvasKit` and `drawCanvasKitVisualizer`.
- Exposes `initialize()`, `renderFrame()`, and `destroyRenderer()`.
- Encapsulates WASM surface allocation, frame rasterization, surface cleanup, and clean 3-part return structure (`metadata`, `verification`, `diagnostics`).

---

### Component 2 — Verification Suite & Reference Deliverables

#### [NEW] [test_mf3002_renderer.mjs](file:///d:/MediaFactory/test_mf3002_renderer.mjs)
- Automated verification script checking:
  1. `initialize()` initializes CanvasKit exactly once.
  2. `renderFrame()` returns distinct `metadata`, `verification`, and `diagnostics` objects.
  3. Determinism check: `renderFrame(frameIndex=5)` called twice produces byte-for-byte identical `verification.sha256`.
  4. Memory leak check: Skia objects disposed via `.delete()`.
  5. `destroyRenderer()` terminates runtime cleanly.
  6. Generates temporary test artifact `experiments/artifacts/mf3002/frame_reference.rgba` ($8,294,400\text{ bytes}$).

#### [NEW] [MF3002_RENDERER_REPORT.md](file:///d:/MediaFactory/MF3002_RENDERER_REPORT.md)
- Certification report documenting WASM runtime reuse, 1080p frame render duration, SHA-256 determinism, and zero memory leak verification.

---

## Verification Plan

### Automated Tests
- Run:
  ```powershell
  node test_mf3002_renderer.mjs
  ```
- Verify all checks pass cleanly and `experiments/artifacts/mf3002/frame_reference.rgba` is generated.

### Manual Verification & Stop Condition
- **STRICT STOP CONDITION**: Stop execution immediately after `MF3002_RENDERER_REPORT.md` is generated.
- Await explicit user review before starting MF-3003.
