# M3 PERFORMANCE BLUEPRINT: OPTIMIZATION ROADMAP & EXECUTION BLUEPRINT

**Document Version:** 2.0.0  
**Target Module:** Mode 3 (M3: Playlist & Composer Engine)  
**Status:** LOCKED (Phase 2 Blueprint & Governance — Zero Code Modifications)  
**Scope:** Comprehensive performance blueprint and optimization roadmap designed to guide Phase 3 engine implementations for long-duration rendering (1 to 12 hours) on low-spec workstations (`CPU: 2–4 Cores, RAM: 4–8 GB`).

---

## SECTION 1: CURRENT ARCHITECTURE SUMMARY

Based on the exhaustive Phase 1 System Audit (`M3_SYSTEM_AUDIT.md`), Mode 3 (`M3`) operates as a multi-layered, audio-driven reactive composition engine governing both real-time browser previewing (`RenderPipeline.js` / `MediaFactoryRenderer.jsx`) and offline production rendering (`backend/api/m3-render.js`).

### Core Architectural Profile:
- **Reactive Engine Core:** Consists of `BeatEngine.js` (Single Source of Truth for audio DSP feature extraction), `MotionEngine.js` (spring-damper camera physics), `AudioDrivenRuntime.js` (musical feel & event generation), `VisualRuntime.js` (double-buffered visual composition), and `ParticleEngineCore.js` (13 physics flows and 16 geometric shapes).
- **Dual Export Pipelines:**
  - *Client-Side (`FFmpegPipeline.js` / `RenderScheduler.js`):* Uses a deterministic temporal stepper (`dt = 1/fps`) bridging DOM canvases via `html2canvas` directly into `FFmpeg.wasm`.
  - *Server-Side (`backend/api/m3-render.js`):* Executes a 5-stage Node.js workflow processing multi-hour playlists (`buildPlaylistAudio` via `yt-dlp` & `ffmpeg concat`), generating metadata/thumbnails, and compiling looping backgrounds (`buildLoopVideo` / `buildPingPongIntermediate`).
- **Identified Critical Bottlenecks (1–12 Hour Projects on Low-Spec Hardware):**
  1. *Disk & RAM Exhaustion (`OOM`):* Generating uncompressed intermediate forward/reverse video files (`pingpong_*.mp4`) and massive audio concatenation files (`compiled_audio_q_*.mp3`) exhausts local storage and V8 heap limits.
  2. *Garbage Collection (`GC`) Pauses:* Per-frame DOM-to-Canvas bridging via `html2canvas` during client export creates millions of transient DOM wrappers, causing heavy V8 GC pauses (`< 1 FPS`).
  3. *CPU Lockup & Thread Saturation:* Unbounded `child_process` FFmpeg spawns on 2–4 core processors consume $100\%$ CPU, starving Node.js event loops and freezing the browser UI (`UI IS SACRED`).
  4. *Rasterization Overhead:* 2D Canvas path iterations across hundreds of active particles (`ParticleEngineCore`) and pixel-by-pixel Chroma Keying (`ChromaKeyVideo`) saturate CPU draw threads when not offloaded to accelerated shaders.

---

## SECTION 2: PERFORMANCE BUDGET

To guarantee stable execution on our target low-spec profile (`CPU: 2–4 Cores, RAM: 4–8 GB, Integrated GPU`), every feature category is assigned a strict, non-negotiable resource budget across preview and export modes:

| Feature Category | Preview Cost | Render Cost | CPU Budget | GPU Budget | RAM Budget | VRAM Budget | Disk Budget | Priority | Target Goal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Background** | Cheap | Moderate | $< 5\%$ | $< 15\%$ | $< 150\text{ MB}$ | $< 256\text{ MB}$ | $< 50\text{ MB/s}$ | **High** | Zero intermediate disk writes (`pingpong_*.mp4`); zero frame-drop texture reuse. |
| **Visualizer** | Moderate | Moderate | $< 8\%$ | $< 10\%$ | $< 32\text{ MB}$ | $< 64\text{ MB}$ | $0\text{ MB}$ (Cache) | **High** | $O(B)$ pre-allocated path grouping; zero per-frame coordinate array allocations. |
| **Particle** | Expensive | Expensive | $< 12\%$ | $< 25\%$ | $< 64\text{ MB}$ | $< 128\text{ MB}$ | $0\text{ MB}$ | **Critical** | Zero-allocation particle pool (`systems.get(id)`); batch-instanced strata draws. |
| **Overlay** | Moderate | Expensive | $< 6\%$ | $< 15\%$ | $< 80\text{ MB}$ | $< 128\text{ MB}$ | $< 15\text{ MB/s}$ | **Moderate** | Bounding-box occlusion culling; parallelized color-distance Chroma Key masking. |
| **Subtitle** | Cheap | Cheap | $< 3\%$ | $< 5\%$ | $< 16\text{ MB}$ | $< 32\text{ MB}$ | $0\text{ MB}$ (Model) | **Moderate** | Pre-parsed `SubtitleModels`; layout calculations strictly on word/segment change. |
| **Camera** | Cheap | Cheap | $< 2\%$ | $< 5\%$ | $< 8\text{ MB}$ | $< 16\text{ MB}$ | $0\text{ MB}$ | **Low** | Global $2\text{D}$ affine transform applied once to root buffer (`ctx.translate/scale`). |
| **Effects** | Expensive | Expensive | $< 10\%$ | $< 30\%$ | $< 64\text{ MB}$ | $< 128\text{ MB}$ | $0\text{ MB}$ | **Critical** | Bounded multi-pass blur/glow radii; single-pass approximations on low-spec path. |
| **Transition** | Cheap | Moderate | $< 4\%$ | $< 10\%$ | $< 24\text{ MB}$ | $< 48\text{ MB}$ | $0\text{ MB}$ | **Low** | Clamped parametric interpolation ($t \in [0, 1]$); zero temporary intermediate canvases. |
| **Export** | Moderate | Critical | $< 75\%$ (Capped)| $< 40\%$ | $< 512\text{ MB}$ | $< 256\text{ MB}$ | $< 30\text{ MB/s}$ | **Critical** | Capped FFmpeg threads (`-threads 2`); stream-concat filtergraphs (`-bufsize 64M`). |

---

## SECTION 3: HOT PATH ANALYSIS

The **Hot Path** constitutes the continuous execution loop (`RenderPipeline.update()`) invoked up to $60\text{ times per second}$ ($60\text{ Hz}$). Any inefficiency inside this path multiplies across millions of frames during long-duration projects.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          PER-FRAME TICK (60 Hz / 16.6 ms)                         │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 1. Timeline Advancement (`currentTime += dt`)                                     │
│ 2. Audio DSP Update (`BeatEngine.update()` -> Read AnalyserNode / Cache)          │
│ 3. Motion & Camera Physics (`MotionEngine.update(dt)` -> Spring-Damper Step)      │
│ 4. Visual Composition Swap (`VisualRuntime.buffers[writeIndex]`)                  │
│ 5. Active Object Matrix & Particle Trajectory Evaluation (`ParticleEngineCore`)     │
│ 6. Layer Blending & Draw Execution (`MediaFactoryRenderer` / `RealtimeEffect`)     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Operations Running Every Frame ($60\text{ Hz}$ / Per Tick):
- Timeline delta accumulation (`dt`) and timecode validation.
- `BeatEngine.update()` single-pass DSP extraction or `BeatCacheManager.tickSequential()` JSON cache read.
- `MotionEngine.update()` spring-damper differential integration for camera zoom and offset.
- Double-buffer index swap inside `VisualRuntime` (`writeIndex = (writeIndex + 1) % 2`).
- Particle velocity integration (`p.x += p.vx * speedMult`), lifetime checks (`p.life -= p.decay`), and shape/trail draws.
- Spectrum visualizer bar/wave path drawing across active frequency bins.
- Hardware-accelerated CSS transform matrix application in `MediaFactoryRenderer`.

### 2. Operations Running Once Per Beat / Event:
- Instantaneous impulse injections into camera physics (`motionEngine.applyImpulse('zoom', strength)`).
- Particle velocity burst target acceleration ($\text{lerp} = 0.45$ on transient impact vs $\text{lerp} = 0.10$ on decay).
- Subtitle active word index transition (`activeWordIndex`) when `currentTime` crosses word boundary timestamps.
- Audio-driven event propagation (`audioDrivenRuntime.processEvent`) updating musical feel states.

### 3. Operations That Can Be Moved Outside the Per-Frame Loop:
- **Audio FFT Calculations:** Moved entirely out of the video render loop by pre-computing `beat.cache.json` (`BeatCacheManager`) during the audio compilation stage (`buildPlaylistAudio`).
- **Font & Text Metric Measurement:** `ctx.measureText()` moved to property change handlers (`TextPanel` edits); never executed inside static playback loops.
- **Chroma Key Mask Generation:** Static green screen backgrounds can be processed once into an alpha-masked texture cache rather than re-evaluating color-distance equations on every frame tick.
- **DOM-to-Canvas Bridging (`html2canvas`):** Decoupled from the DOM tree by moving frame generation (`FrameComposer`) inside a headless worker or direct canvas buffer stream.

---

## SECTION 4: COLD PATH ANALYSIS

The **Cold Path** encompasses heavy initialization, serialization, and I/O workflows that occur only during state transitions. While not executed at $60\text{ Hz}$, cold path inefficiencies cause UI freezes and long delays during project setup or final delivery.

### 1. Saat Load (Workspace & Project Loading):
- **Processes:** Reading `metadata.json`, probing video background dimensions (`m1VideoProbing`), scanning local font directories (`/api/m3/font/list`), populating `M3BgPool` and `M3AudioTracks`, and initializing `VisualRuntime` double buffers.
- **Optimization Strategy:** Asynchronous parallel asset probing (`Promise.all`), lazy-loading video preview buffers, and deduplicating media sources by URI (`AssetCache`) prior to DOM mounting.

### 2. Saat Export (Configuration & Queue Submission):
- **Processes:** Executing `handleGenerateM3Configuration()`, capturing thumbnail canvas via `html2canvas` (with fallback protection), constructing `payload` JSON, and dispatching queue job objects (`setQueue`).
- **Optimization Strategy:** Non-blocking thumbnail extraction, lightweight JSON payload serialization (excluding raw binary blobs from main queue state), and immediate UI notification to preserve perceived instant responsiveness.

### 3. Saat Save (State Serialization & Metadata Writing):
- **Processes:** Writing track timestamps (`00:00 Title`), calculating total playlist duration (`m3TotalDurationSec`), writing `metadata.json`, and encoding `thumbnail.jpg` to disk (`backend/api/m3-render.js`).
- **Optimization Strategy:** Streamed JSON stringification and background file writing using async `fs.writeFile()` without blocking active rendering threads.

### 4. Saat Queue (Job Scheduling & Pipeline Dispatch):
- **Processes:** Polling queue status (`handleStartRender`), verifying FFmpeg binary presence (`checkFFmpeg()`), creating working directories (`.mediafactory/cache/m3`), and spawning child processes (`POST /api/m3/render`).
- **Optimization Strategy:** Strict single-job concurrency enforcement (`ENFORCE SINGLE ACTIVE RENDER`), automated stale process cleanup (`tasklist /FI "PID eq..."`), and telemetry reporting via `diagnosticReport`.

---

## SECTION 5: REUSE OPPORTUNITY

Systematic asset and data reuse across frames, objects, and layers is essential to achieving our strict memory (`$< 512\text{ MB RAM}$`) and zero-allocation performance budgets without choosing or mandating a final implementation technology:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                             SYSTEM REUSE OPPORTUNITIES                            │
├───────────────────────────────────────────────────────────────────────────────────┤
│ • Static Background Buffer: Draw once, reuse across frames when camera at rest.     │
│ • Beat DSP Cache (`beat.cache.json`): Write during audio build, read across ticks.  │
│ • Pre-Allocated Particle Pool (`systems.get(id)`): Recycle dead particles in-place. │
│ • Shared Asset Textures: Deduplicate image/overlay URIs in global `AssetCache`.   │
│ • Decoded Font Metrics: Measure typography once upon text editing, cache metrics. │
│ • Double-Buffered Composition: Swap two `VisualComposition` instances per tick.   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

1. **Static Background Composition Reuse:**  
   If `m3BgPool[0]` is a static image and global camera effects (`Zoom Pulse`, `Camera Shake`) are inactive or at baseline (`scale === 1.0`, `offset === 0`), the background stratum must reuse its previously rendered bitmap/buffer across consecutive frames, reducing background rasterization cost to $0\text{ ms}$.

2. **Sequential Beat DSP Cache (`beat.cache.json`):**  
   The audio compilation step (`buildPlaylistAudio`) generates `compiled_audio.mp3`. A one-time fast-forward analysis can produce a sequential beat cache (`beatCacheManager.tickSequential()`). Both live preview (when paused/seeking) and offline video rendering reuse this pre-computed data stream, bypassing FFT analysis per frame.

3. **In-Place Particle & Object Pool Recycling:**  
   `ParticleEngineCore` maintains persistent array pools (`this.systems.get(config.id)`) up to `targetCount`. When `p.life <= 0`, the object is not garbage collected (`delete p` is forbidden); instead, `spawnParticle(..., false)` resets the existing object properties (`x, y, vx, vy, life`) in-place, achieving zero GC overhead.

4. **Shared Overlay & Branding Textures:**  
   If multiple scene objects or branding layers reference the same logo or watermark file (`m3OverlayWatermark`), the underlying decoded image buffer in `AssetCache` is shared across all renderers, reducing memory footprint and avoiding duplicate decode operations.

5. **Double-Buffered Visual Composition (`VisualRuntime.buffers`):**  
   By pre-allocating exactly two `VisualComposition` instances at initialization and swapping their write index (`writeIndex = (writeIndex + 1) % 2`) each frame, the system reuses internal layer structures indefinitely without creating transient frame composition objects.

---

## SECTION 6: COST REDUCTION OPPORTUNITY

Without selecting or mandating a final implementation technology (such as WebGL, Web Workers, or OffscreenCanvas as final decisions), the following algorithmic and structural opportunities represent the core targets for Phase 3 optimization:

### 1. Mengurangi Duplicate Work (`Eliminating Redundant Calculations`):
- **Audio Analysis Consolidation:** Ensure `BeatEngine.update()` is the sole entry point for audio feature extraction. Eliminate any secondary volume threshold checks or frequency loop scans in UI components (`M3PlaybackBar`, `M3PreviewCanvas`).
- **FFmpeg Concat & Loop Consolidation:** In `backend/api/m3-render.js`, eliminate the multi-step intermediate ping-pong disk writes (`rev_*.mp4`, `pingpong_*.mp4`) by combining forward/reverse looping and audio merging into a single unified FFmpeg `-filter_complex` command pass.

### 2. Mengurangi Object Traversal (`Graph Culling & Triage`):
- **Visibility & Enable Culling:** Apply the Section 4 Object Update Policy ($O(1)$ early exit on `visible === false` or `enabled === false`) immediately at the start of the render tick, bypassing matrix calculations and property evaluations for inactive scene objects.
- **Stratum-Level Bounding Checks:** Skip entire Z-index strata (`VisualRuntime` layers) if the filtered list of active objects for that stratum is empty (`objects.length === 0`).

### 3. Mengurangi Redraw (`Occlusion & Static Layer Culling`):
- **Static Layer Caching:** Avoid re-drawing non-reactive background images (`M1Background`) and static branding overlays (`BrandingPanel`) during frames where global scale and rotation remain unchanged.
- **Occlusion Bounding:** For opaque full-screen overlays or video backgrounds, skip rendering lower-strata background elements that are entirely occluded from view.

### 4. Mengurangi Allocation (`Zero-Allocation Frame Loops`):
- **Pre-Allocated Math Buffers:** Replace per-frame object instantiations (`{ x: ..., y: ... }`) in `ParticleEngineCore.updateParticle()` and `VisualizerRenderer` with pre-allocated working arrays or reuse existing property slots.
- **Eliminating Transient Arrays:** Avoid using `.map()`, `.filter()`, or `.slice()` inside high-frequency $60\text{ Hz}$ update loops (`RenderPipeline.update()`), as these methods generate transient arrays that trigger V8 Garbage Collection pauses.

### 5. Mengurangi Decode (`Media & Typography Cache`):
- **Single-Pass Image & Font Decoding:** Ensure `HTMLImageElement.decode()` and `document.fonts.check()` occur exactly once during asset ingestion (`AssetCache`), never inside the active draw pass.
- **Streamed Audio Concatenation:** Read local audio files directly into the FFmpeg concat demuxer (`concat_q_*.txt`), avoiding intermediate PCM decoding in Node.js memory buffers.

### 6. Mengurangi Layout (`Preventing Layout Thrashing`):
- **Component Reflow Isolation:** Maintain strict `contain: layout style paint` boundaries on all preview canvas containers (`MediaFactoryRenderer`) to isolate visual updates from triggering document-wide reflows.
- **UI Progress Quantization:** Throttle timeline progress and scrubber updates (`currentTimeSec`) in the UI panel to $15\text{ Hz}$ ($66\text{ ms}$ intervals) using threshold guards (`Math.abs(newTime - prevTime) > 0.066`), while allowing the core rendering engine to run smoothly at $60\text{ Hz}$.

### 7. Mengurangi Serialization (`Lightweight IPC & Payload Passing`):
- **Minimal Queue Payload Passing:** When submitting export jobs from `handleGenerateM3Configuration()` to `/api/m3/render`, pass only necessary configuration metadata, track paths, and asset URIs rather than serializing massive base64 image strings or full DOM trees inside the job payload.

---

## SECTION 7: MODULE PRIORITY

To maximize the performance return on engineering effort during Phase 3, M3 engine modules are ranked below from **Paling Berat (`Heaviest Computational Cost`)** to **Paling Ringan (`Lightest Computational Cost`)**, accompanied by technical justifications:

```
[1. Export Pipeline Engine (backend/api/m3-render.js)] ──► PALING BERAT (Disk I/O, CPU Saturation, Concat Sprawl)
                           │
[2. Particle Physics Engine (ParticleEngineCore.js)]     ──► SANGAT BERAT (O(N) Iteration, 2D Path Rasterization)
                           │
[3. Core Visual Effects (Glow, Blur, Chroma Key)]        ──► BERAT (Multi-pass Convolution & Pixel Sampling)
                           │
[4. Audio DSP & Beat Analysis (BeatEngine.js)]           ──► SEDANG (FFT Extraction & Spectral Flux Math)
                           │
[5. Spectrum Visualizers (VisualizerRenderer.jsx)]       ──► SEDANG (O(B) Frequency Bin Geometry Drawing)
                           │
[6. Subtitles & Karaoke (SubtitleRuntime.js)]            ──► RINGAN (Word-Sync Timestamp Interpolation)
                           │
[7. Camera & Zoom Physics (MotionEngine.js / Zoom)]      ──► PALING RINGAN (O(1) Global Affine Matrix Math)
```

### Technical Justification & Ranking:
1. **Export Pipeline Engine (`backend/api/m3-render.js`):** **PALING BERAT (`CRITICAL`)**  
   *Justification:* Multi-hour offline rendering (`1 to 12 hours`) currently risks $100\%$ CPU saturation and multi-gigabyte disk overflow due to intermediate ping-pong video writes (`pingpong_*.mp4`) and unbounded FFmpeg child process spawning. Optimizing this module yields the highest impact on system stability and export completion rates.

2. **Particle Physics Engine (`ParticleEngineCore.js`):** **SANGAT BERAT (`HIGH`)**  
   *Justification:* Iterating across hundreds of active particles (`config.count`), evaluating speed/beat scale multipliers, and executing 2D Canvas path commands (`beginPath`, `arc`, `stroke`, `fill`) across 13 flows and 16 shapes consumes up to $25\%$ of GPU/CPU draw budget per frame.

3. **Core Visual Effects (`GlowEffect`, `BlurEffect`, `ChromaKey`):** **BERAT (`HIGH`)**  
   *Justification:* Multi-pass shadow blur (`Glow`), Gaussian motion blur (`Blur`), and full-canvas color-distance masking (`ChromaKeyVideo`) require heavy pixel sampling and convolution math. On low-spec integrated GPUs, these effects rapidly degrade frame rates if not bounded or approximated on low-cost paths.

4. **Audio DSP & Beat Analysis (`BeatEngine.js`):** **SEDANG (`MODERATE`)**  
   *Justification:* While `BeatEngine` is highly modularized (`FFTAnalyzer`, `BandExtractor`, `BeatDetector`), running live FFT extraction (`getByteFrequencyData`) and dual-EMA flux formulas at $60\text{ Hz}$ taxes low-end CPUs. Transitioning video rendering to consume pre-computed `beat.cache.json` removes this cost entirely.

5. **Spectrum Visualizers (`VisualizerRenderer.jsx` / `SpectrumEffect`):** **SEDANG (`MODERATE`)**  
   *Justification:* Drawing geometric frequency bars (`Classic Bars`, `Mirrored Wave`) requires $O(B)$ path operations where $B$ is the bin count ($64–256$). Path grouping and coordinate array reuse keep this module well within moderate budget limits.

6. **Subtitles & Karaoke (`SubtitleRuntime.js` / `SubtitleRenderer`):** **RINGAN (`LOW`)**  
   *Justification:* Subtitle models (`SubtitleModels.js`) are pre-parsed by `WhisperAnalysisManager`. Per-frame execution only requires evaluating timestamp comparisons (`currentTime`) and updating word percentage ratios (`activeWordIndex`), consuming $< 3\%$ CPU.

7. **Camera & Zoom Physics (`MotionEngine.js` / `ZoomEffect`):** **PALING RINGAN (`LOWEST`)**  
   *Justification:* Resolving spring-damper equations (`motionEngine.update`) and applying global $2\text{D}$ affine transformations (`ctx.translate`, `ctx.scale`) requires only $O(1)$ constant-time algebraic math, representing the lightest computational footprint in the engine.

---

## SECTION 8: RISK ANALYSIS

Executing optimizations across an enterprise-grade rendering engine introduces technical risks that must be proactively mitigated to preserve our locked architectural invariants:

| Optimization Risk | Potential Failure Mode | Invariant Protected | Mandatory Mitigation & Guardrail |
| :--- | :--- | :--- | :--- |
| **1. UI Layout & DOM Desynchronization** | Offloading rendering or throttling progress bars (`currentTimeSec`) could cause scrubber knobs, object inspector sliders, or timecode displays to appear out-of-sync or lag behind audio playback. | **UI IS SACRED & WORKFLOW IS SACRED** | Maintain strict separation between UI progress telemetry ($15\text{ Hz}$ / $66\text{ ms}$ thresholded updates) and internal engine clock ticks ($60\text{ Hz}$). Ensure `timeline.seek()` immediately flushes UI state. |
| **2. Feature Degradation & Visual Clipping** | Replacing multi-pass effects (`Glow`, `Blur`, `Chroma Key`) or clamping particle counts on low-spec paths could alter visual appearance during final production exports. | **FEATURE COMPLETE** | Enforce the Section 11 Quality Policy: low-cost paths are restricted *exclusively* to live interactive scrubbing on low-spec PCs. Final offline exports (`backend/api/m3-render.js`) strictly enforce the `High Quality Path` ($100\%$ fidelity). |
| **3. Audio-Visual Temporal Drift** | Using pre-computed beat caches (`beat.cache.json`) or asynchronous frame buffers could introduce timing drift where visual pulses (`Zoom Pulse`, `Particle Burst`) desynchronize from drum impacts over a 12-hour timeline. | **SINGLE SOURCE OF TRUTH** | Enforce absolute timecode indexing (`timeSec`) inside `BeatCacheManager.tickSequential(timeSec)`. Frame timestamps (`frameNumber * dt`) must exact-match pre-computed audio onset intervals. |
| **4. FFmpeg Thread Starvation / Deadlocks** | Combining complex filtergraphs (`reverse + concat + loop`) with explicit thread caps (`-threads 2`) on low-spec systems could lead to pipe buffer overflows (`-bufsize`) or process deadlocks if stderr logging is blocked. | **PERFORMANCE BY DESIGN** | Ensure all `spawnFFmpegM3` child processes continuously drain `stdout` and `stderr` streams, apply explicit buffer sizes (`-bufsize 64M`), and enforce automated process cleanup in `finally` blocks. |
| **5. Double-Buffer Write Contention** | Swapping `VisualComposition` double buffers (`buffers[writeIndex]`) across asynchronous tasks or workers could cause read/write race conditions where half-rendered layers appear in the output frame. | **ENGINE FIRST** | Enforce strict synchronous execution boundaries inside `RenderPipeline.update()`. Buffer indices (`writeIndex`) may only swap after all active runtimes (`Subtitle`, `Beat`, `Motion`, `Visual`) have fully completed their evaluation pass. |

---

## SECTION 9: IMPLEMENTATION READINESS

Before any code modifications, refactoring, or Phase 3 implementations are authorized, every foundational policy, budget, and analysis documented across both `M3_RENDER_POLICY.md` and `M3_PERFORMANCE_BLUEPRINT.md` must be verified and locked.

### Phase 2 Governance & Readiness Checklist:
- `[x]` **Beat Policy Ready:** Single evaluation per tick (`BeatEngine.update`), universal read-only access, zero duplicate FFT/detector loops, and zero-allocation contracts locked (`Section 3`).
- `[x]` **Render Policy Ready:** Exact execution strategies defined across all 9 feature categories (`Background`, `Visualizer`, `Particle`, `Overlay`, `Subtitle`, `Text`, `Branding`, `Transition`, `Camera`) (`Section 6`).
- `[x]` **Memory Policy Ready:** Creation, release, and reuse boundaries locked across `Asset Cache`, `Object Cache`, `Frame Buffer`, `Beat Cache`, and `Preview Cache` (`Section 10`).
- `[x]` **Layer Policy Ready:** Stratum skipping (`Empty/Hidden`), static layer texture reuse, and dynamic layer evaluation rules locked (`Section 5`).
- `[x]` **Asset Policy Ready:** Lifecycle stages (`Load`, `Cache`, `Release`, `Reuse`) defined across Images, Videos, GIFs, Subtitles, Audio, Thumbnails, Logos, and Presets (`Section 9`).
- `[x]` **Feature & Performance Budget Ready:** Exact quantitative budgets (`CPU`, `GPU`, `RAM`, `VRAM`, `Disk`) and priority rankings established across all features (`Section 2`).
- `[x]` **Hot Path Ready:** Per-frame $60\text{ Hz}$ operations isolated from once-per-beat events and deferrable offline computations (`Section 3`).
- `[x]` **Cold Path Ready:** Inefficiencies and non-blocking strategies mapped across `Saat Load`, `Saat Export`, `Saat Save`, and `Saat Queue` (`Section 4`).
- `[x]` **Reuse Analysis Ready:** Comprehensive reuse targets (`Static Backgrounds`, `Beat DSP Cache`, `Particle Pools`, `Shared Textures`, `Double-Buffers`) mapped without selecting mandatory tech (`Section 5`).
- `[x]` **Risk Analysis & Guardrails Ready:** Invariant protections (`UI IS SACRED`, `WORKFLOW IS SACRED`, `FEATURE COMPLETE`, `SINGLE SOURCE OF TRUTH`) and mitigation protocols locked (`Section 8`).

### Authorization Declaration:
All 10 governance criteria above are verified and marked **READY**.  
The M3 rendering and preview engine is officially structured, bounded, and approved to enter **Phase 3 (Engine Optimization & Implementation)** upon your command.

---
**[END OF M3 PERFORMANCE BLUEPRINT — ROADMAP & GOVERNANCE LOCKED]**
