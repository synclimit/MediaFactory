# M3 ENGINE CONTRACT: MODULE GOVERNANCE, STATE OWNERSHIP & INTERFACE SPECIFICATION

**Document Version:** 2.9.0  
**Target Module:** Mode 3 (M3: Playlist & Composer Engine)  
**Status:** LOCKED (Phase 2.9 Architectural Contract — Zero Code Modifications)  
**Scope:** Official, binding constitutional contract governing data ownership, interface boundaries, allowed/forbidden dependencies, state lifecycles, memory management, and execution protocols across all M3 engine modules.

---

## SECTION 1: EXECUTIVE SUMMARY

The **M3 Engine Contract** establishes the supreme architectural law for Mode 3 (`M3`) inside **MediaFactory**. While previous phase documents established *what* needed optimization (`Audit`), *how* rendering should behave (`Render Policy`), *where* resource budgets lie (`Performance Blueprint`), and *when* changes should occur (`Implementation Strategy`), this Engine Contract defines **who owns, controls, reads, writes, and communicates across every data structure and runtime boundary**.

### 1.1 Relationship to Previous Phase Documents
- **`M3_SYSTEM_AUDIT.md` (Phase 1):** Identified the system's baseline topology and bottlenecks. This contract formalizes boundaries around the four high-cost modules identified during the audit (`Export Engine`, `Particle Engine`, `Core Effects`, `Beat DSP`).
- **`M3_RENDER_POLICY.md` (Phase 2):** Established the 12 execution rules and 6 foundational pillars (`UI IS SACRED`, `WORKFLOW IS SACRED`, `FEATURE COMPLETE`, `ENGINE FIRST`, `SINGLE SOURCE OF TRUTH`, `PERFORMANCE BY DESIGN`). This contract codifies those policies into enforceable interface boundaries.
- **`M3_PERFORMANCE_BLUEPRINT.md` (Phase 2):** Set quantitative budgets (`CPU`, `GPU`, `RAM`, `VRAM`, `Disk`). This contract assigns strict memory and computational invariants to specific module owners to ensure compliance.
- **`M3_IMPLEMENTATION_STRATEGY.md` (Phase 2.5):** Scheduled 12 sequential sprints and mapped ROI. This contract provides the precise API boundaries and dependency guards required so engineers can execute those sprints in isolation without cross-module regressions.

### 1.2 Decision Rules & Governance Mandate
For every contract and interface specification defined within this document, four mandatory architectural dimensions are established:
1. **Alasan Dibuat (`Why it exists`):** The structural or algorithmic rationale behind the rule.
2. **Masalah yang Dicegah (`Problems prevented`):** The exact memory leaks, race conditions, CPU lockups, or visual glitches avoided.
3. **Modul yang Terdampak (`Impacted modules`):** The upstream data providers and downstream consumers bound by the rule.
4. **Risiko Jika Dilanggar (`Risk of violation`):** The catastrophic system failure or regression that occurs if an implementation breaches the contract.

---

## SECTION 2: CORE ENGINE HIERARCHY

All data and execution ticks in M3 must flow unidirectionally through the strict 8-tier architectural hierarchy defined below. No tier may bypass an intermediate node or execute out of sequence.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: TIMELINE & CLOCK AUTHORITY (`Timeline / FrameInputProvider`)        │
│          Produces: `currentTimeSec`, `deltaTime (dt)`, `isPlaying`          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: AUDIO DSP & BEAT AUTHORITY (`BeatEngine.js` / `BeatCacheManager`)   │
│          Produces: `BeatRuntime` (`beatStrength`, `energy`, `dataArray`)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: KINETIC MOTION AUTHORITY (`MotionEngine.js`)                        │
│          Produces: `MotionRuntime` (`zoomScale`, `cameraOffset`)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: REACTIVE RUNTIME (`AudioDrivenRuntime.js` / `ReactiveProcessor`)    │
│          Produces: `ReactiveState` (`musicalFeel`, evaluated multipliers)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 5: OBJECT & FEATURE RUNTIMES (`ParticleEngineCore`, `Visualizer`, etc.)│
│          Produces: Evaluated object matrices & geometric path packages      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 6: LAYER COMPOSITOR & STRATA AUTHORITY (`VisualRuntime.js`)           │
│          Produces: Double-Buffered `VisualComposition` read buffer          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 7: RENDERER (`MediaFactoryRenderer.jsx` / `RealtimeEffectRenderer`)    │
│          Produces: Hardware-accelerated canvas/DOM visual rasterization     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 8: ENCODER & CONSUMER INGESTION (`OutputManager` / `FFmpegPipeline`)   │
│          Produces: Display frames, Wasm base64 streams, or MP4 video files  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 3: MODULE OWNERSHIP

Every module in M3 possesses explicit ownership rights, read permissions, and strict forbidden zones. Accessing data outside designated permissions is a critical contract breach.

### 3.1 Beat Engine (`BeatEngine.js` & `BeatCacheManager.js`)
- **Owner & Responsible:** Audio Engineering Core Team (`Gravity`).
- **Owned State:** `BeatRuntime` (`dataArray`, `timeDomainArray`, `subBass`, `bass`, `mid`, `treble`, `beatStrength`, `kickScore`, `bpm`, `confidence`).
- **Read Permissions:** `Timeline.currentTimeSec`, `Timeline.isPlaying`, raw `AudioBuffer` / `AnalyserNode` input stream.
- **Forbidden (No-Touch Zone):** `ParticleState`, `VisualizerGeometry`, `CameraState`, `RendererDOMNodes`, `SubtitleModels`, `ExportQueueState`.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Establishes a single, immutable source of truth for audio feature extraction.
  - *Masalah yang Dicegah:* Prevents duplicate FFT loops and conflicting transient calculations across UI and visual components.
  - *Modul yang Terdampak:* All reactive features (`MotionEngine`, `Particles`, `Visualizers`).
  - *Risiko Jika Dilanggar:* $100\%$ CPU saturation from duplicate audio analysis and desynchronized visual beats across layers.

### 3.2 Motion Engine (`MotionEngine.js`)
- **Owner & Responsible:** Physics & Animation Engineering (`Gravity`).
- **Owned State:** `MotionRuntime` (`zoomScale`, `cameraOffsetX`, `cameraOffsetY`, internal spring-damper velocities and accelerations).
- **Read Permissions:** `BeatRuntime.beatStrength`, `BeatRuntime.kickScore`, `Timeline.deltaTime`.
- **Forbidden (No-Touch Zone):** `BeatRuntime` internal FFT arrays, `M3Objects` local coordinates (`x, y`), `RendererCanvasContext`.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Isolates global camera and viewport physics from local object transformations.
  - *Masalah yang Dicegah:* Prevents local object layout coordinates (`obj.x, obj.y`) from being permanently mutated by transient camera shakes.
  - *Modul yang Terdampak:* `VisualRuntime`, `MediaFactoryRenderer`.
  - *Risiko Jika Dilanggar:* Permanent coordinate drift and layout corruption when saving project states after a camera shake occurs.

### 3.3 Visual Runtime (`VisualRuntime.js`)
- **Owner & Responsible:** Layer Compositor & Effects Engineering (`Gravity`).
- **Owned State:** Double-Buffered `VisualComposition` instances (`buffers[0]`, `buffers[1]`), `writeIndex`, core effect profile states (`ZoomEffect`, `GlowEffect`, `CameraEffect`, `ParticleEffect`, `BlurEffect`, `SpectrumEffect`).
- **Read Permissions:** `MotionRuntime`, `ReactiveState`, `M3Objects` scene list, `Timeline.deltaTime`.
- **Forbidden (No-Touch Zone):** `BeatRuntime` raw `dataArray` (must read through `ReactiveState`/`VisualizerObject`), `FFmpegPipeline` memory buffers, `AssetCache` raw blob management.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Enforces a zero-allocation double-buffering compositing boundary between object evaluation and canvas rendering.
  - *Masalah yang Dicegah:* Prevents half-rendered frame tearing and per-frame memory allocation garbage.
  - *Modul yang Terdampak:* `MediaFactoryRenderer`, `RealtimeEffectRenderer`, all 6 core effect classes.
  - *Risiko Jika Dilanggar:* Race conditions during layer blending and heavy V8 Garbage Collection pauses.

### 3.4 Object Runtime (`ReactiveObjectProcessor.js` & `M3Objects`)
- **Owner & Responsible:** Scene Graph & Object Governance (`Gravity`).
- **Owned State:** `ObjectState` (`evaluatedScale`, `evaluatedOpacity`, `evaluatedRotation`, active triage status: `Invisible`, `Disabled`, `Locked`, `Active`).
- **Read Permissions:** `BeatRuntime.energy`, `BeatRuntime.beatStrength`, `Timeline.currentTimeSec`, user configurations inside `M3Objects`.
- **Forbidden (No-Touch Zone):** `VisualComposition` double buffers, `BeatEngine` internal FFT states, `SubtitleCacheManager`.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Evaluates object triage (`visible`, `enabled`, `locked`) and calculates final transformation matrices before layer sorting.
  - *Masalah yang Dicegah:* Prevents disabled or hidden objects from executing expensive matrix math and draw calls.
  - *Modul yang Terdampak:* `ParticleEngineCore`, `VisualizerRenderer`, `OverlayRenderer`, `TextPanel`.
  - *Risiko Jika Dilanggar:* Severe CPU bottlenecks during complex scenes containing $100+$ inactive or hidden objects.

### 3.5 Particle Engine (`ParticleEngineCore.js`)
- **Owner & Responsible:** Physics Simulation Engineering (`Gravity`).
- **Owned State:** `ParticleState` (`this.systems` object pools, internal particle coordinate vectors `x, y, vx, vy, life, maxLife, scale`).
- **Read Permissions:** `ObjectState` (evaluated multipliers), `BeatRuntime.beatStrength` (via reactive config), `Timeline.deltaTime`.
- **Forbidden (No-Touch Zone):** `BeatEngine` audio nodes, global `CameraState` offsets, DOM element styling.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Confines all 13 particle flows and 16 geometric shapes to an isolated, pre-allocated memory pool.
  - *Masalah yang Dicegah:* Prevents continuous particle instantiation (`new Particle()`) from triggering GC pauses.
  - *Modul yang Terdampak:* `VisualRuntime` stratum `z-50`, `RealtimeEffectRenderer`.
  - *Risiko Jika Dilanggar:* Severe memory fragmentation and frame drops (`< 15 FPS`) during high-density particle bursts.

### 3.6 Visualizer Engine (`VisualizerRenderer.jsx` / `SpectrumEffect.js`)
- **Owner & Responsible:** Audio Visualization Engineering (`Gravity`).
- **Owned State:** `VisualizerGeometry` (pre-allocated $2\text{D}$ coordinate arrays for bars, waves, circles, lines).
- **Read Permissions:** `BeatRuntime.dataArray` (frequency bins), `BeatRuntime.timeDomainArray` (waveform), `ObjectState` styling configs.
- **Forbidden (No-Touch Zone):** `BeatEngine.analyser` node configuration, `ParticleState`, `ChromaKey` pixel buffers.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Converts raw FFT frequency bins into grouped geometric draw paths ($O(B)$ complexity).
  - *Masalah yang Dicegah:* Prevents excessive $2\text{D}$ canvas context state switches (`beginPath`, `stroke` loops).
  - *Modul yang Terdampak:* `VisualRuntime` stratum `z-50`.
  - *Risiko Jika Dilanggar:* CPU draw thread overload when rendering multi-layered spectrum graphs across $256\text{ bins}$.

### 3.7 Subtitle Runtime (`SubtitleRuntime.js` & `SubtitleRenderer.jsx`)
- **Owner & Responsible:** Typography & Speech Alignment Engineering (`Gravity`).
- **Owned State:** `SubtitleState` (`activeSubtitleIndex`, `activeWordIndex`, `wordHighlightPercentage`, transition alpha ratios).
- **Read Permissions:** `Timeline.currentTimeSec`, pre-parsed `SubtitleModels` (`SubtitleCacheManager`).
- **Forbidden (No-Touch Zone):** `BeatRuntime`, `ParticleState`, `Overlay` coordinates, raw Whisper AI analysis processes.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Decouples static subtitle model data from dynamic per-frame word-sync karaoke timing calculations.
  - *Masalah yang Dicegah:* Prevents re-parsing JSON subtitle models or re-measuring text strings on every frame tick.
  - *Modul yang Terdampak:* `VisualRuntime` stratum `z-90` to `z-100`.
  - *Risiko Jika Dilanggar:* Karaoke word highlight jitter and unnecessary font measurement overhead during playback.

### 3.8 Overlay & Background Runtimes (`OverlayPanel`, `M1Background`, `ChromaKey`)
- **Owner & Responsible:** Media Compositing Engineering (`Gravity`).
- **Owned State:** `LayerMediaState` (`HTMLVideoElement` pool instances, `ChromaKey` masked alpha texture buffers, bounding box coordinates).
- **Read Permissions:** `Timeline.currentTimeSec`, `Timeline.isPlaying`, `AssetCache` media URIs, `ObjectState`.
- **Forbidden (No-Touch Zone):** `BeatRuntime` FFT arrays, `SubtitleState`, global `VisualComposition` double buffers.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Manages media decoding, video looping, and pixel-level green screen removal (`ChromaKeyImage/Video`).
  - *Masalah yang Dicegah:* Prevents duplicate video decoding and unmasked color-distance calculations across clear pixels.
  - *Modul yang Terdampak:* `VisualRuntime` strata `z-10` through `z-40`, and `z-60` through `z-80`.
  - *Risiko Jika Dilanggar:* Multi-gigabyte memory leaks from unevicted video frames and CPU lockup during Chroma Key masking.

### 3.9 Renderer (`MediaFactoryRenderer.jsx` / `RealtimeEffectRenderer.jsx`)
- **Owner & Responsible:** Frontend & Hardware Acceleration Engineering (`Gravity`).
- **Owned State:** `RendererDOMNodes`, `CanvasContext2D`, `OffscreenCanvas` contexts, GPU transform property bindings (`will-change`, `translateZ(0)`).
- **Read Permissions:** Immutable `VisualComposition` read buffer (`buffers[writeIndex ^ 1]`), `RenderFrame` package.
- **Forbidden (No-Touch Zone):** Modifying any state inside `BeatRuntime`, `MotionRuntime`, `ParticleState`, `ObjectState`, or `VisualComposition`.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Executes final hardware-accelerated rasterization and DOM/Canvas painting without mutating simulation states.
  - *Masalah yang Dicegah:* Prevents layout thrashing (`contain: layout style paint`) and read/write race conditions.
  - *Modul yang Terdampak:* Browser DOM, `PreviewCanvas`.
  - *Risiko Jika Dilanggar:* Severe UI layout thrashing ($< 10\text{ FPS}$) and visual flickering across layered objects.

### 3.10 Encoder, Export & Queue Engines (`FFmpegPipeline`, `m3-render.js`, `App.jsx`)
- **Owner & Responsible:** Production Export & Backend Systems Engineering (`Gravity`).
- **Owned State:** `ExportQueueState` (`jobs[]`, `jobCounterM3`), `FFmpegProcessState` (child processes, virtual Wasm filesystem, `concat_q_*.txt` files).
- **Read Permissions:** Complete `payload` JSON schema, `AssetCache` file paths, `Timeline` duration bounds.
- **Forbidden (No-Touch Zone):** Live browser DOM elements (`MediaFactoryRenderer`), active `AudioContext` nodes, client-side UI progress bars.
- **Decision Rule & Governance:**
  - *Alasan Dibuat:* Governs deterministic offline rendering, job concurrency limits, and FFmpeg `-filter_complex` execution.
  - *Masalah yang Dicegah:* Prevents $100\%$ CPU starvation, intermediate disk overflow (`pingpong_*.mp4`), and hanging zombie processes.
  - *Modul yang Terdampak:* `backend/api/m3-render.js`, `RenderScheduler.js`, `ExportManager.js`.
  - *Risiko Jika Dilanggar:* System crash, out-of-memory (`OOM`) kills, disk full errors, and complete backend server freeze during multi-hour renders.

---

## SECTION 4: ENGINE CONTRACT SPECIFICATIONS

| Module Name | Input Contract | Output Contract | Required Dependencies | Lifecycle States | Error Behaviour | Recovery Behaviour |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Beat Engine** | `AudioBuffer` / `AnalyserNode`, `Timeline.currentTimeSec`, `isPlaying` | `BeatRuntime` singleton (`beatStrength`, `energy`, `dataArray`, `bpm`) | `ServiceRegistry`, `Timeline` | `Create -> Initialize -> Ready -> Running -> Paused -> Disposed` | If audio node disconnects or FFT fails, emit zeroed `BeatRuntime` (`beatStrength: 0`). | Automatically re-probe active `AudioContext` and re-attach `AnalyserNode` on next tick. |
| **Motion Engine** | `BeatRuntime.beatStrength`, `BeatRuntime.kickScore`, `Timeline.dt` | `MotionRuntime` (`zoomScale`, `cameraOffsetX`, `cameraOffsetY`) | `BeatEngine`, `Timeline` | `Create -> Ready -> Running -> Paused -> Disposed` | If differential math produces `NaN` or `Infinity`, clamp outputs to baseline (`zoomScale: 1.0, offset: 0`). | Reset spring-damper velocity and acceleration vectors to zero immediately. |
| **Visual Runtime** | `MotionRuntime`, `ReactiveState`, `M3Objects`, `dt` | Double-Buffered `VisualComposition` read buffer (`buffers[writeIndex ^ 1]`) | `MotionEngine`, `ObjectRuntime`, `ParticleEngine`, `Visualizer` | `Create -> Initialize -> Ready -> Running -> Paused -> Disposed` | If stratum evaluation throws, log error, skip current stratum, and swap buffer normally. | Evict corrupted strata objects and restore baseline composition buffer from previous clean tick. |
| **Object Runtime** | `M3Objects` configs, `BeatRuntime.energy`, `currentTimeSec` | `ObjectState` (`evaluatedScale/Opacity/Rotation`, triage flags) | `BeatEngine`, `Timeline` | `Create -> Ready -> Running -> Paused -> Disposed` | If object property evaluation fails, mark object `Invisible` for current frame. | Re-evaluate object configuration schema from raw `M3Objects` definition on next tick. |
| **Particle Engine** | `ObjectState` configs, `BeatRuntime.beatStrength`, `dt` | `ParticleState` pools, drawn particle shapes/trails on stratum `z-50` | `ObjectRuntime`, `BeatEngine` | `Create -> Initialize -> Ready -> Running -> Paused -> Disposed` | If particle pool overflows (`count > targetCount`), reject new spawns and continue drawing existing pool. | Purge inactive/dead particles (`life <= 0`) in-place (`spawnParticle(..., false)`). |
| **Visualizer Engine** | `BeatRuntime.dataArray/timeDomainArray`, `ObjectState` | `VisualizerGeometry` paths drawn on stratum `z-50` | `BeatEngine`, `ObjectRuntime` | `Create -> Ready -> Running -> Disposed` | If `dataArray` length is zero or missing, render flat zero-energy baseline geometry. | Re-subscribe to `BeatEngine.state.dataArray` pointer on next frame tick. |
| **Subtitle Runtime** | `SubtitleModels`, `currentTimeSec`, `dt` | `SubtitleState` (`activeSubtitleIndex`, `wordHighlightPercentage`) | `Timeline`, `SubtitleCacheManager` | `Create -> Initialize -> Ready -> Running -> Paused -> Disposed` | If timestamp comparison fails or model corrupts, render empty subtitle string (`""`). | Reload `SubtitleModels` from `SubtitleCacheManager` using active project ID. |
| **Overlay / Background**| `AssetCache` media URIs, `currentTimeSec`, `isPlaying` | Rasterized video frames, masked `ChromaKey` textures on strata `z-10..80` | `AssetCache`, `Timeline`, `ObjectRuntime` | `Create -> Initialize -> Ready -> Running -> Paused -> Disposed` | If video element stalls or `HTMLImageElement` fails decode, skip draw call (`NO RENDER`). | Trigger asynchronous media reload (`img.src = ...` / `video.load()`) in background task. |
| **Layer Runtime** | Strata object lists (`z-10..100`), `VisualComposition` | Layer-sorted, occlusion-culled strata commands ready for rasterization | `ObjectRuntime`, `VisualRuntime` | `Create -> Ready -> Running -> Disposed` | If Z-index sorting fails, retain previous frame's layer ordering (`REUSE`). | Re-sort active object array using deterministic numerical comparison (`a.zIndex - b.zIndex`). |
| **Renderer** | `VisualComposition` read buffer, `RenderFrame` package | Hardware-accelerated Canvas $2\text{D}$ / WebGL / DOM visual output | `VisualRuntime`, `FrameComposer` | `Create -> Initialize -> Ready -> Running -> Paused -> Disposed` | If WebGL/Canvas context is lost (`webglcontextlost`), switch to fallback $2\text{D}$ Canvas path. | Listen for `webglcontextrestored`, re-allocate textures, and resume hardware rendering. |
| **Export Engine** | `payload` JSON, `AssetCache` paths, `checkFFmpeg()` | Production `video.mp4`, `thumbnail.jpg`, `metadata.json` | `FFmpegPipeline`, `AssetCache`, `BeatCacheManager` | `Create -> Initialize -> Ready -> Running -> Stopped -> Disposed` | If FFmpeg child process exits with non-zero code (`!= 0`), reject promise and mark job `FAILED`. | Execute automated zombie process cleanup (`tasklist /FI...`), purge partial temp files, and report stack trace. |
| **Queue Engine** | User export clicks (`handleStartRender`), `payload` | Managed `jobs[]` array (`Waiting -> Pending -> Rendering -> Completed`) | `ExportEngine`, `App.jsx` state | `Create -> Ready -> Running -> Paused -> Disposed` | If active render job crashes or hangs ($> 30\text{ min}$ without progress), mark `Failed`. | Dequeue next pending job (`activeJobId = nextPending.id`) and resume single-active processing. |

---

## SECTION 5: STATE OWNERSHIP MATRIX

The matrix below defines absolute ownership, read/write permissions, lifecycle bounds, and mutability contracts for every critical data structure in M3:

| State Name | Sole Owner (`Owner`) | Authorized Readers (`Reader`) | Authorized Writers (`Writer`) | Lifetime Scope | Mutability Contract |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`BeatRuntime`** | `BeatEngine.js` | `MotionEngine`, `VisualRuntime`, `ObjectRuntime`, `Particles`, `Visualizers` | `BeatEngine.js` *EXCLUSIVELY* | Application Session / Project Duration | **Mutable Internal, Immutable Read:** Mutated in-place by `BeatEngine` once per tick; strictly read-only to consumers. |
| **`MotionRuntime`** | `MotionEngine.js` | `VisualRuntime`, `MediaFactoryRenderer` | `MotionEngine.js` *EXCLUSIVELY* | Application Session / Project Duration | **Mutable Internal, Immutable Read:** Updated via differential integration once per tick. |
| **`ObjectState`** | `ObjectRuntime` | `VisualRuntime`, `ParticleEngine`, `Visualizer`, `OverlayRenderer` | `ObjectRuntime` *EXCLUSIVELY* | Scene Object Existence (`m3Objects`) | **Mutable Internal, Immutable Read:** Re-evaluated when properties, triage flags, or beat multipliers change. |
| **`ParticleState`** | `ParticleEngineCore`| `VisualRuntime` stratum `z-50` | `ParticleEngineCore` *EXCLUSIVELY*| Particle Pool Existence (`this.systems`) | **Pre-Allocated Mutable Pool:** Individual properties (`p.x, p.life`) mutated in-place during update loops. Zero allocation. |
| **`VisualizerGeometry`**| `VisualizerRenderer`| `VisualRuntime` stratum `z-50` | `VisualizerRenderer` *EXCLUSIVELY*| Frequency Bin Lifecycle | **Pre-Allocated Mutable Pool:** Coordinate paths overwritten inside pre-allocated arrays (`this.coords`). |
| **`SubtitleState`** | `SubtitleRuntime.js`| `VisualRuntime` stratum `z-90` | `SubtitleRuntime.js` *EXCLUSIVELY*| Subtitle Playback Duration | **Mutable Internal, Immutable Read:** Updated when `currentTime` crosses active word boundary timestamps. |
| **`VisualComposition`**| `VisualRuntime.js` | `MediaFactoryRenderer`, `FrameComposer` | `VisualRuntime.js` *EXCLUSIVELY* | Engine Initialization to Teardown | **Double-Buffered (`buffers[0]/[1]`):** Active write buffer is mutable; active read buffer (`writeIndex ^ 1`) is strictly **IMMUTABLE**. |
| **`RenderFrame`** | `FrameComposer` | `OutputManager`, `PreviewCanvas`, `FFmpegPipeline` | `FrameComposer` *EXCLUSIVELY* | Single Frame Step ($16.6\text{ ms}$ / $\text{dt}$) | **Strictly Immutable Package:** Constructed at end of tick; discarded/recycled upon consumer ingestion. |
| **`AssetCache`** | `AssetCacheManager` | All Media, Typography, and Background Runtimes | `AssetCacheManager` *EXCLUSIVELY* | Workspace Session / Reference Count $> 0$| **Strictly Immutable Blobs:** Once decoded into bitmap/buffer, media assets are read-only across all consumers. |
| **`BeatCache`** | `BeatCacheManager` | `RenderPipeline` (Offline Mode), `BeatEngine` | `BeatCacheManager` *EXCLUSIVELY* | Offline Render Job Duration (`beat.cache.json`)| **Strictly Immutable JSON Stream:** Written once during Stage 2 (`buildPlaylistAudio`), read sequentially per frame step. |
| **`PreviewCache`** | `PreviewCanvas` | Scrubber UI (`M3TimelinePanel`), Thumbnail Generator | `PreviewCanvas` *EXCLUSIVELY* | Scrubber Pause / Scrub Threshold ($< 512\text{ MB}$) | **Mutable Ring Buffer:** Stores recent `RenderFrame` outputs; purged on memory threshold breach or profile clear. |

---

## SECTION 6: ALLOWED DEPENDENCY GRAPH

To guarantee modular separation and zero circular dependencies, module consumption must strictly follow the directed acyclic graph (`DAG`) below. An arrow ($A \rightarrow B$) indicates that **Module A is explicitly authorized to import, reference, and consume the read-only output of Module B**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTHORIZED DEPENDENCY DAG                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ • `BeatEngine`         ──► Consumes: `Timeline`, `ServiceRegistry`          │
│ • `MotionEngine`       ──► Consumes: `BeatEngine`, `Timeline`               │
│ • `ObjectRuntime`      ──► Consumes: `BeatEngine`, `Timeline`, `M3Objects`  │
│ • `ParticleEngineCore` ──► Consumes: `ObjectRuntime`, `BeatEngine`, `Timeline`│
│ • `VisualizerRenderer` ──► Consumes: `BeatEngine`, `ObjectRuntime`          │
│ • `SubtitleRuntime`    ──► Consumes: `Timeline`, `SubtitleCacheManager`     │
│ • `Overlay/Background` ──► Consumes: `AssetCache`, `Timeline`, `ObjectRuntime`│
│ • `VisualRuntime`      ──► Consumes: `MotionEngine`, `ObjectRuntime`,       │
│                                      `ParticleEngine`, `Visualizer`,        │
│                                      `SubtitleRuntime`, `Overlay/Background`│
│ • `MediaFactoryRender` ──► Consumes: `VisualRuntime` (Read Buffer ONLY)     │
│ • `ExportEngine`       ──► Consumes: `AssetCache`, `BeatCacheManager`,      │
│                                      `FFmpegPipeline`, `payload` Schema     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 7: FORBIDDEN DEPENDENCIES & STRUCTURAL REASONS

Any import, direct reference, or state subscription that violates the authorized dependency DAG (`Section 6`) is **STRICTLY FORBIDDEN**. The table below documents specific high-risk forbidden dependencies, the architectural reasons for their prohibition, and the catastrophic problems prevented:

| Forbidden Dependency | Architectural Rationale (`Alasan Dibuat`) | Severe Problems Prevented (`Masalah yang Dicegah`) |
| :--- | :--- | :--- |
| **`ParticleEngineCore` $\rightarrow$ `BeatEngine.analyser`** | Particles must consume standardized `BeatRuntime` (`beatStrength`, `energy`) via `ObjectRuntime` configs, never raw Web Audio API nodes directly. | Prevents particle modules from executing custom FFT loops or transient detection formulas, preventing CPU saturation. |
| **`VisualizerRenderer` $\rightarrow$ `ParticleEngineCore`** | Visualizers and particles occupy distinct strata (`z-50`) inside `VisualRuntime`. Neither may inspect or mutate the other's geometry pools. | Prevents inter-layer race conditions, array memory corruption, and circular rendering deadlocks inside stratum loops. |
| **`MediaFactoryRenderer` $\rightarrow$ `BeatEngine`** | The final DOM/Canvas renderer is strictly a display consumer (`Tier 7`). It must render what `VisualRuntime` outputs, without evaluating audio states. | Prevents layout thrashing and desynchronization where the display renderer attempts to calculate audio reactivity at different frame intervals than the composition engine. |
| **`SubtitleRuntime` $\rightarrow$ `ParticleEngineCore`** | Subtitles (`Tier 5`) and particles (`Tier 5`) are peer runtimes. Subtitle karaoke timing cannot depend on particle density or physics states. | Prevents subtitle word-sync timing delays when high-density particle bursts (`flow_explosion`) experience heavy GPU rasterization. |
| **`QueueEngine` $\rightarrow$ `MediaFactoryRenderer`** | Offline background queue processing (`jobs[]`) must remain totally decoupled from live client-side DOM/Canvas display trees. | Prevents offline exports (`POST /api/m3/render`) from crashing if the user minimizes the browser tab, clears the preview canvas, or navigates away during rendering. |
| **`ObjectRuntime` $\rightarrow$ `VisualComposition`** | Objects evaluate transformation matrices (`ObjectState`), but must never directly invoke canvas draw calls (`ctx.drawImage`) onto composition buffers. | Preserves layer sorting (`zIndex`), occlusion culling, and double-buffer immutability boundaries managed exclusively by `VisualRuntime`. |

---

## SECTION 8: EVENT FLOW CONTRACT

Inside a single deterministic frame step ($16.6\text{ ms}$ at $60\text{ Hz}$ or exact $\text{dt} = 1/\text{fps}$ offline step), execution must proceed sequentially through exactly ten event gates (`Gate 1` through `Gate 10`). 

**MANDATORY UNIDIRECTIONAL RULE:** No event or execution path may ever jump backward to a previous gate during a single frame tick (`e.g., Gate 6 jumping back to Gate 2 to re-run audio analysis is strictly illegal`).

```
[GATE 1: Timeline Tick]
   └─► `timeline.clock.tick(dt)` -> Emits `currentTimeSec` & `isPlaying`.
        │
[GATE 2: Beat Engine Evaluation]
   └─► `beatEngine.update()` -> Extracts FFT bins & emits `BeatRuntime` singleton.
        │
[GATE 3: Motion Physics Integration]
   └─► `motionEngine.update(dt)` -> Resolves spring-damper camera matrices.
        │
[GATE 4: Audio-Driven & Preset Evaluation]
   └─► `audioDrivenRuntime.update(dt)` -> Emits `ReactiveState` (`musicalFeel`).
        │
[GATE 5: Object State & Triage Evaluation]
   └─► `ObjectRuntime.update()` -> Triages `Invisible/Disabled/Locked`, computes matrices.
        │
[GATE 6: Feature Stratum Execution]
   └─► `ParticleEngineCore`, `VisualizerRenderer`, `SubtitleRuntime` update pre-allocated pools.
        │
[GATE 7: Layer Sorting & Culling]
   └─► `VisualRuntime` sorts strata `z-10..100`, applies `Empty/Hidden/Static` skip rules.
        │
[GATE 8: Double-Buffered Composition]
   └─► Stratum draw commands execute onto `buffers[writeIndex]`; `writeIndex` swaps.
        │
[GATE 9: Frame Packaging]
   └─► `FrameComposer` wraps read buffer (`buffers[writeIndex ^ 1]`) into immutable `RenderFrame`.
        │
[GATE 10: Consumer Ingestion & Output]
   └─► `MediaFactoryRenderer` paints display OR `RenderScheduler` pushes bitmap to `FFmpegPipeline`.
```

---

## SECTION 9: FRAME CONTRACT (`RenderFrame` Specification)

Every completed frame emitted at `Gate 9` (`FrameComposer`) must strictly adhere to the immutable `RenderFrame` contract defined below. This package acts as the sole data bridge between the simulation engine (`VisualRuntime`) and display/encoding consumers.

```json
{
  "frameId": "frame_1784420000_000123",
  "frameNumber": 123,
  "currentTimeSec": 2.050,
  "deltaTimeSec": 0.0166667,
  "fps": 60,
  "isRealtime": true,
  "visualComposition": {
    "bufferReference": "VisualComposition_Buffer_0",
    "width": 1920,
    "height": 1080,
    "zoomMatrix": [1.02, 0, 0, 1.02, -19.2, -10.8],
    "activeEffects": ["Zoom Pulse", "Glow Warmth"]
  },
  "audioStateSnapshot": {
    "beatStrength": 0.85,
    "energy": 0.72,
    "isTransient": true
  },
  "subtitleSnapshot": {
    "activeText": "Cinematic Beat Sync",
    "activeWordIndex": 2,
    "highlightPercentage": 45.0
  }
}
```

### 9.1 Zero-Allocation Frame Rules:
- **What is Immutable (`IMMUTABLE`):** All numerical properties (`frameNumber`, `currentTimeSec`, `fps`), structural references (`bufferReference`), and snapshot payloads are strictly read-only once emitted by `FrameComposer`.
- **What Can Change Across Frames (`MUTABLE ACROSS TICKS`):** `bufferReference` toggles strictly between `"VisualComposition_Buffer_0"` and `"VisualComposition_Buffer_1"` due to double-buffer swapping. Snapshot values reflect real-time evaluation updates.
- **What Cannot Be Re-Allocated Each Frame (`ZERO-ALLOCATION GUARANTEE`):** Instantiating `new RenderFrame()` or allocating new inner snapshot objects (`{ beatStrength: ... }`) per tick is forbidden. `FrameComposer` must maintain exactly two pre-allocated `RenderFrame` wrapper structures and overwrite their primitive values in-place each step.

---

## SECTION 10: ASSET CONTRACT

All media assets across M3 must execute under strict lifecycle stages and sole ownership authorities to prevent duplicate decodes, memory leaks, and unevicted blob references:

| Asset Type | Sole Owner | Lifecycle Ingestion (`Load / Decode`) | Caching & Deduplication (`Cache / Reuse`) | Release Protocol (`Release`) |
| :--- | :--- | :--- | :--- | :--- |
| **Image (`.jpg/png`)** | `AssetCacheManager` | Loaded asynchronously (`new Image()`) -> decoded once into memory via `img.decode()`. | Keyed by exact source URI (`sourcePath`) inside `AssetCache`. Reused across all background/overlay objects. | Reference counted (`refCount`). Purged and `URL.revokeObjectURL()` executed when `refCount === 0`. |
| **Video (`.mp4/webm`)** | `AssetCacheManager` | Ingested via pooled `HTMLVideoElement` (preview) or FFmpeg stream reader (offline export). | Cached in `AssetCache`. Intermediate looping files (`pingpong_*.mp4`) cached on disk under `.mediafactory/cache/m3/`. | Video elements paused, `src = ''`, `load()` called upon profile clear. Temp disk files purged post-export. |
| **GIF (`.gif`)** | `AssetCacheManager` | Decoded once into static frame bitmap arrays or converted into sprite streams during loading. | Frame arrays cached in `AssetCache` up to memory budget limits ($< 80\text{ MB}$). Shared across matching GIF IDs. | Purged immediately from memory pool when all overlay objects referencing the GIF are deleted. |
| **Subtitle (`.json/.srt`)**| `SubtitleCacheManager` | Parsed once via `WhisperAnalysisManager` into standardized `SubtitleModels` structures. | Stored in `SubtitleCacheManager` keyed by project ID and track hash. | Retained across workspace sessions for instant re-alignment; cleared upon manual cache flush. |
| **Audio (`.mp3/wav`)** | `AssetCacheManager` | Local paths ingested directly. YouTube URIs downloaded once via `yt-dlp` (`yt_[id].mp3`). | Stored on disk under `.mediafactory/cache/m3/` and referenced by URI inside `AssetCache`. | Disk audio caches persist across sessions for fast project re-exports; cleared only via manual purge. |
| **Thumbnail (`.jpg`)** | `M3ThumbnailEditor` | Captured via `html2canvas` (or fallback $2\text{D}$ canvas) and serialized as base64 JPEG string. | Stored inside project `payload.thumbnail` and cached in `AssetCache`. | Overwritten in-place when user triggers re-capture or profile reset. |
| **Preset (`.json`)** | `ReactivePresets` | Loaded once during module bootstrap from `src/services/reactive/ReactivePresets.js`. | Singleton static lookup object (`ReactivePresets[presetId]`). Zero memory duplication. | Never released during active session; resides permanently in application memory. |
| **Logo (`.png/.svg`)** | `BrandingPanel` | Loaded via `AssetCacheManager` and decoded once into high-resolution bitmap buffer. | Stored in `AssetCache` under global branding strata (`z-60..80`). Shared across watermark/subscribe widgets. | Retained until channel branding preferences or alias settings are modified by the user. |

---

## SECTION 11: CACHE CONTRACT

To guarantee absolute memory boundaries and prevent stale data propagation, the seven core system caches must operate according to the exact creation, utilization, and eviction protocols defined below:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE SYSTEM CACHE CONTRACT                       │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Cache Name           │ Creation Condition   │ Eviction & Purge Trigger      │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ 1. `AssetCache`      │ First media load     │ `refCount === 0` && Mode close│
│ 2. `BeatCache`       │ Stage 2 audio build  │ Audio track modification/delete│
│ 3. `FrameCache`      │ Double-buffer init   │ Application termination ONLY  │
│ 4. `PreviewCache`    │ UI timeline scrubbing│ Memory $> 512$ MB || Mode switch│
│ 5. `ObjectCache`     │ Scene object creation│ Object deletion (`m3Objects`) │
│ 6. `ParticlePool`    │ System bootstrap     │ Never (In-place recycling)    │
│ 7. `LayerCache`      │ Static layer render  │ Camera shake / Scale change   │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **`AssetCache`:** Created when an image, video, or font is loaded. Used across all active layers referencing the asset URI. Purged when `refCount === 0` and the user clears or closes M3 Mode.
2. **`BeatCache` (`beat.cache.json`):** Created during offline audio compilation (`buildPlaylistAudio`). Used across every frame step of offline video rendering (`tickSequential()`), eliminating live FFT overhead. Purged immediately if playlist tracks (`m3AudioTracks`) are modified or deleted.
3. **`FrameCache` (`VisualComposition` Double-Buffers):** Created exactly once during `VisualRuntime` bootstrap (`buffers = [new VisualComposition(), new VisualComposition()]`). Swapped per frame step (`writeIndex ^ 1`). Never purged until total engine teardown.
4. **`PreviewCache`:** Created during live UI timeline scrubbing to store recent `RenderFrame` outputs for instant backward scrubbing. Purged when memory consumption exceeds $512\text{ MB}$ or when mode switches (`setActiveMode`).
5. **`ObjectCache`:** Created when `M3Objects` are added to the scene. Used by `ReactiveObjectProcessor` for matrix math. Purged when the object is deleted from `m3Objects` (`setM3Objects`).
6. **`ParticlePool` (`this.systems.get(id)`):** Created during particle system initialization up to `targetCount`. Used across every frame step. Never purged or deleted (`delete p` is forbidden); dead particles (`life <= 0`) are recycled in-place.
7. **`LayerCache`:** Created when a static background stratum (`z-10`) completes rendering. Used (`REUSE`) across consecutive frames when global camera (`Zoom/Shake`) is stationary. Purged immediately when camera offsets change or background media is replaced.

---

## SECTION 12: MEMORY CONTRACT

Total memory utilization across all M3 operations is strictly partitioned and bounded across seven distinct structural domains (`CPU Heap, VRAM, RAM, Disk, Temporary Buffer, Frame Buffer, Double Buffer`):

| Memory Domain | Authorized Sole Owner | Maximum Quantitative Limit | Allocation & Zero-Allocation Contract |
| :--- | :--- | :--- | :--- |
| **CPU Heap (`V8 Memory`)**| `ServiceRegistry` / Node Core | $< 1.5\text{ GB}$ (Total System Heap) | All per-frame simulation loops (`update()`) must execute with **ZERO NEW HEAP ALLOCATIONS**. Pre-allocated arrays and object pools are mandatory. |
| **VRAM (`GPU Memory`)** | `MediaFactoryRenderer` / WebGL | $< 512\text{ MB}$ (Low-Spec Target Limit) | Hardware textures and `OffscreenCanvas` contexts must be shared and recycled. No duplicate texture uploads across layers. |
| **System RAM (`Main Memory`)**| `AssetCacheManager` | $< 512\text{ MB}$ (Active Asset Pool) | Decoded media bitmaps must strictly honor reference counting (`refCount`). Expired blobs must be immediately revoked. |
| **Local Disk (`Storage`)** | `ExportEngine` (`m3-render.js`) | $< 2.0\text{ GB}$ (`.mediafactory/cache/m3/`) | Zero intermediate uncompressed video files (`pingpong_*.mp4`). Concat text lists (`concat_q_*.txt`) and temp files must be purged post-export. |
| **Temporary Buffer** | `ParticleEngineCore` / `Visualizer`| $< 16\text{ MB}$ (Pre-Allocated Math Pool) | Temporary $2\text{D}$ coordinate vectors (`_tmpVec2`) and numerical scratch arrays must be pre-allocated once during bootstrap and reused indefinitely. |
| **Frame Buffer** | `FrameComposer` | Exactly $2\text{ Instances}$ (`RenderFrame`) | Wrapper structures must be pre-allocated and overwritten in-place per tick (`Gate 9`). |
| **Double Buffer** | `VisualRuntime.js` | Exactly $2\text{ Instances}$ (`VisualComposition`) | Read buffer (`writeIndex ^ 1`) and write buffer (`writeIndex`) swap strictly per tick (`Gate 8`). Zero buffer instantiations inside render loop. |

---

## SECTION 13: THREAD & TASK CONTRACT

To guarantee UI responsiveness (`UI IS SACRED`) while maintaining maximum export throughput (`ENGINE FIRST`), execution tasks are conceptually partitioned across five dedicated operational threads/tasks without mandating specific low-level technologies (`Worker`, `OffscreenCanvas`, etc. as final tech selections):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. MAIN THREAD (`Browser UI & User Interactions`)                           │
│    Runs: `M3StudioPanel`, `M3Toolbar`, `M3TimelinePanel` ($15\text{ Hz}$ Throttled Telemetry)│
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. PREVIEW TASK (`Real-Time Canvas Compositing & Rendering`)               │
│    Runs: `RenderPipeline.update()`, `VisualRuntime`, `MediaFactoryRenderer` ($60\text{ Hz}$)│
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. LOADING TASK (`Media Ingestion, Decoding & Whisper AI Analysis`)          │
│    Runs: `AssetCache` image/video decoding, `yt-dlp` downloads, `SubtitleModels`│
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. BACKGROUND TASK (`Queue Polling, State Serialization & File Writing`)   │
│    Runs: `App.jsx` queue polling (`setInterval`), `metadata.json` writing   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. ENCODING TASK (`Production Offline Video Assembly & FFmpeg Execution`)   │
│    Runs: `backend/api/m3-render.js` (`processM3Job`), `spawnFFmpegM3`       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 13.1 Concurrency & Isolation Governance:
- **Main Thread Isolation:** The Main Thread is strictly reserved for user input, panel layout, and throttled UI telemetry updates ($15\text{ Hz}$ / $66\text{ ms}$). No heavy canvas rasterization (`ParticleEngineCore`) or synchronous file I/O may execute on the Main Thread.
- **Preview Task Decoupling:** The Preview Task runs at up to $60\text{ Hz}$. It reads `BeatRuntime` and updates `VisualComposition` double buffers without blocking or waiting for Main Thread UI progress bar reconciliations.
- **Encoding Task Concurrency Guard:** The Encoding Task (`m3-render.js`) executes in dedicated backend processes. It must enforce explicit thread capping (`-threads 2` on 4-core systems) and buffer bounding (`-bufsize 64M`) to prevent starving the Main Thread or Loading Task during multi-hour renders.

---

## SECTION 14: ERROR & RECOVERY CONTRACT

Every M3 module must enforce a standardized error behavior policy (`Retry, Fallback, Skip, Stop, Recovery`) upon encountering runtime faults, preventing localized crashes from cascading across the global engine:

```
[Module Runtime Error Encountered]
               │
               ├─► Beat Engine / Audio Node Failure   ──► [RETRY / FALLBACK: Emit Zeroed `BeatRuntime` (beatStrength: 0)]
               │                                          └─► Re-probe AudioContext & re-attach AnalyserNode next tick.
               │
               ├─► Motion Engine Math Error (`NaN/Inf`)──► [FALLBACK: Clamp to Baseline (`zoomScale: 1.0, offset: 0`)]
               │                                          └─► Reset spring-damper velocity/acceleration vectors instantly.
               │
               ├─► Visual / Layer Stratum Corrupt      ──► [SKIP: Skip Corrupt Stratum, Swap Double-Buffer Normally]
               │                                          └─► Evict corrupted objects & restore previous clean composition.
               │
               ├─► Media Asset / Decode Stall         ──► [SKIP: Skip Draw Call (`NO RENDER`), Retain Baseline Background]
               │                                          └─► Dispatch async background reload (`img.src` / `video.load()`).
               │
               ├─► Renderer Context Lost (`webgllost`) ──► [FALLBACK: Switch instantly to 2D Canvas Fallback Path]
               │                                          └─► Listen for `webglrestored`, re-allocate textures, resume GPU.
               │
               └─► Export FFmpeg Child Crash (`!= 0`) ──► [STOP: Reject Promise, Mark Job `FAILED`, Prune Zombies]
                                                          └─► Execute `tasklist /FI...` cleanup, purge partial temp files.
```

---

## SECTION 15: MODULE LIFECYCLE CONTRACT

Every engine and runtime module across M3 (`BeatEngine`, `MotionEngine`, `VisualRuntime`, `ParticleEngineCore`, `SubtitleRuntime`, `Renderer`, `ExportEngine`) must transition deterministically through exactly seven standardized lifecycle states:

```
[CREATE] ──► [INITIALIZE] ──► [READY] ──► [RUNNING] ◄──► [PAUSED]
                                 │           │              │
                                 ▼           ▼              ▼
                              [STOPPED] ──► [DISPOSED] ◄────┘
```

1. **`CREATE`:** The module constructor (`new Module()`) is invoked. Internal properties and zero-allocation memory pools (`systems.get(id)`, `_tmpVec2`) are allocated. No external subscriptions or asset loads exist.
2. **`INITIALIZE`:** The module boots (`initialize()`). Dependencies are resolved via `ServiceRegistry`. Initial media assets, preset lookups (`ReactivePresets`), and double-buffers (`buffers[0]/[1]`) are loaded and bound.
3. **`READY`:** Initialization completes successfully. The module is fully armed, memory pools are verified (`checkAllocations()`), and the runtime awaits the start of the timeline clock.
4. **`RUNNING`:** The timeline clock ticks (`timeline.clock.isPlaying === true`). Per-frame update loops (`update(dt)`) and rasterization draw calls execute at $60\text{ Hz}$ (`Preview Task`) or sequential temporal steps (`Encoding Task`).
5. **`PAUSED`:** Playback halts (`timeline.pause()`). Per-frame update loops freeze immediately. The module retains all active memory buffers, double-buffers, and object states in-place for instant resume.
6. **`STOPPED`:** Project playback resets or export job terminates (`handleStopRender`). Active simulation momentum (`MotionEngine` velocities, particle bursts) resets to baseline zero states while keeping pre-allocated memory pools intact.
7. **`DISPOSED`:** The project closes or M3 Mode unmounts (`dispose()`). All memory pools, `VisualComposition` double buffers, object arrays, and event listeners are completely torn down, detached, and marked for clean V8 Garbage Collection.

---

## SECTION 16: PERFORMANCE & ALGORITHMIC CONTRACT

To ensure M3 remains compliant with our quantitative budgets (`M3_PERFORMANCE_BLUEPRINT.md`) on low-spec hardware (`CPU: 2–4 Cores, RAM: 4–8 GB`), every module must strictly satisfy its assigned computational complexity and resource targets:

| Module Name | Target CPU Budget | Target RAM Budget | Target Update Frequency | Allocation Contract (`Per Tick`) | Target Draw Call Limit (`Per Frame`) | Algorithmic Complexity Contract |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Beat Engine** | $< 4\%$ | $< 16\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 2`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $0\text{ Draw Calls}$ | $O(1)$ constant-time extraction from pre-allocated `dataArray` (`FFTAnalyzer`). |
| **Motion Engine** | $< 2\%$ | $< 4\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 3`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $0\text{ Draw Calls}$ | $O(1)$ spring-damper differential integration across affine camera matrices. |
| **Visual Runtime** | $< 5\%$ | $< 32\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 7-8`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $< 5\text{ Batch Passes}$ | $O(S)$ where $S$ is active stratum count ($S \le 10$). Double-buffer index swap. |
| **Object Runtime** | $< 4\%$ | $< 24\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 5`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $0\text{ Draw Calls}$ | $O(N)$ where $N$ is total scene object count ($N \le 150$). Early culling exit. |
| **Particle Engine** | $< 12\%$ | $< 64\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 6`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $< 15\text{ Instanced Draws}$| $O(P)$ where $P$ is active particle count ($P \le 300$). Pre-allocated array pools. |
| **Visualizer Engine**| $< 8\%$ | $< 32\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 6`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $< 4\text{ Grouped Paths}$ | $O(B)$ where $B$ is frequency bin count ($B \le 256$). Path grouping mandatory. |
| **Subtitle Runtime** | $< 2\%$ | $< 16\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 6`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $< 2\text{ Text Passes}$ | $O(\log M)$ binary search across pre-parsed `SubtitleModels` timestamps ($M$). |
| **Overlay / Chroma** | $< 6\%$ | $< 80\text{ MB}$ | Exactly $1\text{x Per Frame (`Gate 6`)}$ | **Zero Allocation ($0\text{ Bytes}$)** | $< 10\text{ Bounded Draws}$| $O(W \times H)$ parallelized pixel masking across bounded overlay dimensions. |
| **Renderer** | $< 10\%$ | $< 128\text{ MB}$| Exactly $1\text{x Per Frame (`Gate 10`)}$| **Zero Allocation ($0\text{ Bytes}$)** | $< 20\text{ Hardware Comps}$| $O(1)$ hardware-accelerated CSS/Canvas matrix application (`translateZ(0)`). |
| **Export Engine** | $< 75\%$ (Capped)| $< 512\text{ MB}$| Deterministic Stepper (`dt = 1/fps`) | **Bounded Buffer Stream** | N/A (Offline Assembly)| $O(T)$ where $T$ is total playlist track duration. Single-pass `-filter_complex`. |

---

## SECTION 17: API BOUNDARY SPECIFICATION

To prevent structural coupling, **Module A is strictly prohibited from accessing, inspecting, or mutating the internal private state (`this._privateProperty`) of Module B**. All communication across modules must flow exclusively through the public API boundaries defined below:

```typescript
// ============================================================================
// OFFICIAL M3 API BOUNDARY SPECIFICATIONS (PUBLIC INTERFACES ONLY)
// ============================================================================

export interface IBeatEngine {
  readonly state: IBeatRuntimeSnapshot; // Read-Only Singleton State
  initialize(audioContext: AudioContext, analyser: AnalyserNode): Promise<void>;
  update(isPlaying: boolean): void; // Allowed strictly at Gate 2
  dispose(): void;
}

export interface IBeatRuntimeSnapshot {
  readonly beatStrength: number;
  readonly energy: number;
  readonly kickScore: number;
  readonly subBass: number;
  readonly bass: number;
  readonly mid: number;
  readonly treble: number;
  readonly bpm: number;
  readonly dataArray: Uint8Array; // Read-Only FFT Reference
}

export interface IMotionEngine {
  readonly state: IMotionRuntimeSnapshot;
  applyImpulse(type: 'zoom' | 'pulse', strength: number): void; // Allowed strictly on beat transient
  update(isPlaying: boolean, dt: number): void; // Allowed strictly at Gate 3
  reset(): void;
}

export interface IMotionRuntimeSnapshot {
  readonly zoomScale: number;
  readonly cameraOffsetX: number;
  readonly cameraOffsetY: number;
}

export interface IObjectRuntime {
  update(objects: ReadonlyArray<IM3Object>, beatState: IBeatRuntimeSnapshot, timeSec: number): void; // Gate 5
  getEvaluatedObject(objectId: string): IEvaluatedObjectState | null;
}

export interface IParticleEngineCore {
  initialize(targetCanvasWidth: number, targetCanvasHeight: number): void;
  updateAndRender(configArray: ReadonlyArray<IParticleConfig>, dt: number, beatValue: number): void; // Gate 6
  dispose(): void;
}

export interface IVisualRuntime {
  readonly currentReadBuffer: IVisualCompositionReadBuffer; // Strictly Immutable Read Buffer
  initialize(width: number, height: number): Promise<void>;
  update(dt: number, audioDrivenState: IReactiveState, objects: ReadonlyArray<IM3Object>): void; // Gate 7-8
  dispose(): void;
}

export interface IVisualCompositionReadBuffer {
  readonly bufferId: string;
  readonly width: number;
  readonly height: number;
  readonly layers: ReadonlyArray<ILayerCommand>;
}

export interface IFrameComposer {
  composeFrame(timeSec: number, dt: number, frameNumber: number, readBuffer: IVisualCompositionReadBuffer): IRenderFrame; // Gate 9
}

export interface IExportEngine {
  submitRenderJob(payload: IM3RenderPayload): Promise<IJobSubmissionResult>;
  getJobStatus(queueId: string): Promise<IJobStatusReport>;
  killJob(queueId: string): Promise<boolean>;
}
```

---

## SECTION 18: EXTENSION CONTRACT

To ensure M3 remains future-proof, introducing new visual features or AI runtimes must follow strict extension rules that guarantee **zero modification to existing core engine loops (`RenderPipeline.js`, `VisualRuntime.js`, `BeatEngine.js`)**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OFFICIAL EXTENSION RULES                          │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ Extension Target     │ Mandatory Registration & Interface Contract          │
├──────────────────────┼──────────────────────────────────────────────────────┤
│ • New Effect Profile │ Implement `IEffectModule`, register in `ReactivePresets`│
│ • New Particle Flow  │ Add math equation to `updateParticle()` (`ParticleEngine`)│
│ • New Visualizer     │ Implement `IVisualizerGeometry`, draw on stratum `z-50` │
│ • New Subtitle Style │ Register CSS/Canvas style in `SubtitleRenderer.jsx`  │
│ • New Export Engine  │ Implement `IExportPipeline`, register in `ServiceRegistry`│
│ • New AI Module      │ Ingest via `Loading Task` (`Tier 3`), output to `AssetCache`│
└──────────────────────┴──────────────────────────────────────────────────────┘
```

1. **Adding a New Effect (`IEffectModule`):**  
   Create a self-contained effect class extending `BaseEffect`. Register its profile ID inside `src/services/reactive/ReactivePresets.js`. The effect must expose `update(dt, beatState)` and `applyToBuffer(composition)`. `VisualRuntime` will automatically evaluate and blend it during `Gate 7` without core pipeline changes.
2. **Adding a New Particle Flow / Shape (`ParticleEngineCore`):**  
   Add the new flow physics formula inside `updateParticle(p, config, width, height, reactiveValue)` using existing pre-allocated `p.vx, p.vy` vectors. Add the geometric drawing routine inside `drawShape(ctx, p, shape)`. Zero changes permitted to the double-buffer compositing strata.
3. **Adding a New Visualizer Type (`IVisualizerGeometry`):**  
   Implement a geometric path generator consuming `BeatEngine.state.dataArray`. Ensure drawing commands group contiguous paths (`beginPath()` once per color). Register the renderer in `VisualizerRenderer.jsx` stratum `z-50`.
4. **Adding a New AI Module (`e.g., AI Scene Segmentation`):**  
   AI analysis must execute strictly inside the `Loading Task` (`Section 13`) during project bootstrap or asset ingestion. The AI module must serialize its output into static JSON models stored inside `AssetCacheManager` (`e.g., SceneSegmentModels.js`). Real-time renderers (`Tier 5/6`) consume these static models with $O(1)$ lookup, guaranteeing zero live AI inference overhead during video rendering.

---

## SECTION 19: VERSIONING & MIGRATION CONTRACT

All API interfaces (`Section 17`) and serialized project schemas (`payload`, `metadata.json`) are governed by semantic versioning (`MAJOR.MINOR.PATCH`). Changes must honor three strict backward-compatibility rules:

```
[Interface or Schema Modification Proposed]
                     │
                     ├─► Is it a Non-Breaking Addition (`PATCH/MINOR`)? ──► [AUTHORIZED: Add optional fields / interfaces]
                     │
                     └─► Is it a Breaking Structural Change (`MAJOR`)?
                                     │
                                     ├─► Step 1: Deprecate legacy interface (`@deprecated` + console warning).
                                     │
                                     ├─► Step 2: Implement automated schema migration adapter (`SchemaMigrator.js`).
                                     │
                                     └─► Step 3: Maintain 100% backward compatibility for existing user projects.
```

1. **Backward Compatibility Guarantee (`100% Parity`):**  
   If an existing user project saved under schema `v1.0.0` or `v2.0.0` is loaded into an M3 engine running `v2.9.0` or higher, the project must load, preview, and export without error, data loss, or visual degradation (`FEATURE COMPLETE`).
2. **Deprecation Protocol (`Graceful Phase-Out`):**  
   When an interface or property is scheduled for replacement, it must be marked `@deprecated` in TypeScript interfaces and emit a single console warning during bootstrap (`[M3 Deprecation Notice]: Property X is deprecated; use Y`). The legacy property must remain fully functional across at least two major version cycles.
3. **Automated Schema Migration (`SchemaMigrator.js`):**  
   When `handleGenerateM3Configuration` or `backend/api/m3-render.js` encounters an outdated `payload` format, `SchemaMigrator.migrate(payload)` must run synchronously before Stage 1 initialization (`checkFFmpeg`), transforming legacy property keys (`e.g., legacy m1VideoQuality to videoExportQuality`) into current schema definitions in-memory without modifying the user's original source files on disk.

---

## SECTION 20: FINAL IMPLEMENTATION RULES

During the execution of Phase 3 sprints, every engineer and code review must strictly enforce the following **Ten Final Implementation Commandments**:

1. **Rule of Exclusive State Mutation:**  
   A module (`BeatEngine`, `ParticleEngineCore`, `VisualRuntime`) may **ONLY** mutate its own owned state (`Section 5`). Mutating another module's state directly or bypassing API boundaries (`Section 17`) is forbidden.
2. **Rule of Private State Isolation:**  
   No module may read, inspect, or destructure the private internal properties (`this._privateVar`) of another module. All reads must pass through public read-only snapshots (`BeatRuntime.state`, `MotionRuntime.state`).
3. **Rule of Zero Duplicate Ownership:**  
   No data structure (`dataArray`, `VisualComposition`, `systems.get(id)`) may be owned or managed by more than one module. Duplicate ownership across components is strictly illegal.
4. **Rule of Zero Duplicate Caches:**  
   No asset, decoded bitmap, or audio file may reside in multiple caches. All media caching is centralized in `AssetCacheManager`; all beat caching is centralized in `BeatCacheManager`.
5. **Rule of Zero Duplicate Runtimes:**  
   Exactly one instance of `BeatEngine`, `MotionEngine`, `VisualRuntime`, and `RenderPipeline` may exist per active M3 Mode session. Instantiating secondary shadow runtimes is illegal.
6. **Rule of Zero Duplicate FFT (`Single Source of Truth`):**  
   Exactly one `AnalyserNode` (`getByteFrequencyData`) is authorized to execute during `Gate 2`. Creating secondary audio analyzers in UI components or visualizers is forbidden.
7. **Rule of Zero Duplicate Renderers:**  
   Exactly one active display renderer (`MediaFactoryRenderer`) is authorized to paint `RenderFrame` outputs to the browser DOM/Canvas per active preview canvas.
8. **Rule of Zero Circular Dependencies:**  
   All module imports and data flows must strictly honor the directed acyclic graph (`DAG`) defined in `Section 6`. Circular imports ($A \rightarrow B \rightarrow A$) are strictly illegal.
9. **Rule of Zero Synchronous Blocking in Render Loops:**  
   Executing synchronous disk file reads (`fs.readFileSync`), synchronous network fetches, or heavy DOM node queries (`document.querySelector`) inside per-frame update (`update(dt)`) or render loops is strictly forbidden.
10. **Rule of Zero-Allocation Per-Frame Ticks:**  
    Inside the active $60\text{ Hz}$ update tick (`Gates 1 through 9`), allocating new objects (`{}`), arrays (`[]`), typed arrays (`new Uint8Array`), or wrapper instances (`new RenderFrame()`) is strictly illegal. All modules must overwrite pre-allocated memory pools and double-buffers in-place.

---

## SECTION 21: IMPLEMENTATION READINESS CHECKLIST

Before authorizing the start of **Phase 3 (Implementation & Optimization Execution)**, all 12 architectural contract dimensions defined within this document must be verified and locked against previous phase blueprints:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 PHASE 2.9 ARCHITECTURAL READINESS CHECKLIST                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ [x] Engine Contract Ready    ──► Tier 1-8 hierarchy & module owners locked. │
│ [x] State Ownership Ready    ──► 11 core states & immutability contracts locked.│
│ [x] Dependency Ready         ──► Authorized DAG & forbidden guards locked.  │
│ [x] Module Ready             ──► Input/Output specs & error protocols locked.│
│ [x] Frame Ready              ──► `RenderFrame` package & zero-alloc bounds locked.│
│ [x] Cache Ready              ──► 7 system caches & eviction boundaries locked.│
│ [x] Memory Ready             ──► Quantitative Heap, VRAM & RAM limits locked.│
│ [x] Asset Ready              ──► Ingestion, decode & reference counts locked.│
│ [x] API Ready                ──► TypeScript public interfaces (`IBeatEngine`) locked.│
│ [x] Error Ready              ──► Retry, Fallback, Skip & Stop policies locked.│
│ [x] Lifecycle Ready          ──► 7-stage (`Create..Disposed`) state machine locked.│
│ [x] Extension & Version Ready──► Non-breaking extension & migration adapters locked.│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Official Supreme Architectural Authorization Declaration:
All 12 architectural contract dimensions and governance rules above are officially verified and marked **READY**.  

The M3 Playlist & Composer Engine is fully contracted, bounded, protected, and authorized. **Phase 3 (Implementation & Optimization Execution) is officially approved to commence upon your command.**

---
**[END OF M3 ENGINE CONTRACT — SUPREME ARCHITECTURAL GOVERNANCE LOCKED]**
