# MF-3000 — CanvasKit Foundation POC Implementation Plan (Revised Architecture)

The objective of **MF-3000 (Revised)** is to build the ultra-minimal production foundation proving that **CanvasKit (Google Skia WASM)** can initialize and render a 1080p frame inside `src/services/pipeline/renderer/CanvasKitRuntime.js` without any UI components, React integration, or internal surface leaks.

This milestone is strictly isolated inside `src/services/pipeline/renderer/`. Zero UI components in `src/components/` are modified or created.

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
    ▶ MF-3000 CanvasKit Foundation POC (REVISED MINIMAL SCOPE)
    ├── MF-3001 Renderer Abstraction & Primitives (DrawCommand / IRenderBackend)
    ├── MF-3002 Master Loop & Shared Buffer Engine
    ├── MF-3003 Preview Viewport Migration
    └── MF-3004 FFmpeg Raw Video Pipe Integration
```

---

## Architectural Principles & Scope Constraints

### 1. Zero UI Integration
- NO React components created or modified.
- NO changes to `src/components/`.
- CanvasKit foundation remains 100% encapsulated inside `src/services/pipeline/renderer/`.

### 2. Encapsulated Surface Lifecycle
- `CanvasKitRuntime.renderPOCFrame()` MUST NOT return internal CanvasKit Surface or Paint instances.
- Surface creation and deletion (`surface.delete()`, `image.delete()`, `paint.delete()`) are handled entirely internally.
- Exposes ONLY stable outputs:
  - `rgbaBuffer`: Uint8Array / Buffer ($8,294,400\text{ bytes}$)
  - `pngBuffer`: Uint8Array / Buffer
  - `metadata`: `{ width, height, stride, pixelFormat, renderDurationMs, sha256 }`

### 3. Excluded Concepts (Deferred to MF-3001+)
- NO `DrawCommand`
- NO `IRenderBackend`
- NO `RenderScheduler`
- NO `Worker` or `OffscreenCanvas`
- NO IPC channels
- NO FFmpeg integration
- NO Timeline or Preview integration

---

## User Review Required

> [!IMPORTANT]
> **Strict Deliverable Isolation**:
> MF-3000 produces EXACTLY 3 files:
> 1. `src/services/pipeline/renderer/CanvasKitRuntime.js`
> 2. `test_mf3000_foundation.mjs`
> 3. `MF3000_FOUNDATION_REPORT.md`
> Nothing more.

---

## Proposed Changes

### Component 1 — Production Renderer Foundation

#### [NEW] [CanvasKitRuntime.js](file:///d:/MediaFactory/src/services/pipeline/renderer/CanvasKitRuntime.js)
- Production CanvasKit WASM runtime loader and frame rasterizer.
- Exposes:
  - `initCanvasKit()`: Asynchronously initializes CanvasKit WASM module.
  - `renderPOCFrame({ width = 1920, height = 1080 })`: Internal surface creation, deterministic rendering, internal surface disposal, returning `{ rgbaBuffer, pngBuffer, metadata }`.

---

### Component 2 — Objective Test Suite & Report

#### [NEW] [test_mf3000_foundation.mjs](file:///d:/MediaFactory/test_mf3000_foundation.mjs)
- Automated verification script checking ONLY objective criteria:
  - CanvasKit initializes successfully.
  - `rgbaBuffer` generated with correct size ($8,294,400\text{ bytes}$).
  - `pngBuffer` generated.
  - `metadata` contains valid properties (`width`, `height`, `stride`, `pixelFormat`, `sha256`).

#### [NEW] [MF3000_FOUNDATION_REPORT.md](file:///d:/MediaFactory/MF3000_FOUNDATION_REPORT.md)
- Architectural foundation report documenting WASM init duration, frame rendering duration, RAM footprint, and SHA-256 fingerprint.

---

## Verification Plan

### Automated Tests
- Run:
  ```powershell
  node test_mf3000_foundation.mjs
  ```
- Verify `test_mf3000_foundation.mjs` returns `PASS` for all 5 objective criteria.

### Manual Verification & Stop Condition
- **STRICT STOP CONDITION**: Stop execution immediately after `MF3000_FOUNDATION_REPORT.md` is generated.
- Await explicit user approval before proceeding to MF-3001.
