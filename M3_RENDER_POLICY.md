# M3 RENDER POLICY: OFFICIAL ENGINE GOVERNANCE & EXECUTION RULES

**Document Version:** 2.0.0  
**Target Module:** Mode 3 (M3: Playlist & Composer Engine)  
**Status:** LOCKED (Phase 2 Blueprint & Governance — Zero Code Modifications)  
**Scope:** Strict, non-negotiable architectural rules and execution policies governing all current and future implementations of the M3 rendering and live preview engine.

---

## SECTION 1: PERFORMANCE PHILOSOPHY

All M3 engineering decisions, runtime designs, and rendering pipelines must strictly adhere to the following six foundational pillars:

1. **UI IS SACRED:**  
   The user interface layout, DOM hierarchy, panel dimensions (`M3StudioPanel`, `M3Toolbar`, `M3ObjectInspector`), controls, and styling must remain untouched. Optimizations must never alter visual controls, reposition buttons, or simplify layout complexity to save rendering cost.

2. **WORKFLOW IS SACRED:**  
   The operational flow—from workspace loading, asset ingestion (`M3BgPool`), playlist configuration (`M3AudioTracks`), scene object positioning, interactive scrubbing, through to export configuration and queue submission—must remain $100\%$ identical for the user.

3. **FEATURE COMPLETE:**  
   No feature, effect, particle flow, visualizer type, subtitle transition, or overlay animation may be deprecated, disabled, or degraded. Every parameter across all 13 particle flows, 16 vector shapes, 9 trail modes, and 6 core visual effects (`Zoom`, `Camera`, `Glow`, `Blur`, `Particle`, `Spectrum`) must execute with full fidelity.

4. **ENGINE FIRST:**  
   Performance gains must be achieved entirely through engine algorithmic efficiency, deterministic frame scheduling, memory pooling, zero-allocation contracts, and execution path optimization—never by compromising visual output quality or cutting corners on user features.

5. **SINGLE SOURCE OF TRUTH:**  
   `BeatEngine.js` is the sole and exclusive authority for real-time and pre-compiled audio feature extraction, spectral flux analysis, and beat timing. No secondary audio analyzers or duplicate frequency extractors may exist anywhere in the application.

6. **PERFORMANCE BY DESIGN:**  
   High performance across ultra-long projects (1 to 12 hours) on low-spec hardware (`CPU: 2–4 Cores, RAM: 4–8 GB`) is not an afterthought; it is an invariant architectural constraint. Every module, asset loader, and render layer must be designed from inception to operate within strict memory limits and zero-allocation frame boundaries.

---

## SECTION 2: FRAME LIFECYCLE

Every single frame produced by M3—whether during interactive real-time preview or deterministic offline rendering—must strictly follow a unidirectional, sequential 7-stage lifecycle.

```
[1. Timeline Synchronization]
           │
           ▼
[2. Beat Runtime Evaluation]
           │
           ▼
[3. Animation & Physics Update]
           │
           ▼
[4. Object State & Evaluation]
           │
           ▼
[5. Layer Compositing & Blending]
           │
           ▼
[6. Frame Output & Double-Buffer Swap]
           │
           ▼
[7. Encoder / Frame Consumer Ingestion]
```

### Stage-by-Stage Execution Rules:
1. **Timeline Synchronization (`Timeline / FrameInputProvider`):**  
   The clock advances (`currentTime += dt`). The pipeline validates project bounds and checks if external seek events occurred (`Math.abs(settings.currentTimeSec - timeline.currentTime) > 0.05s`). If seeking occurred, internal state buffers reset deterministically.

2. **Beat Runtime Evaluation (`BeatEngine.js` / `BeatCacheManager.js`):**  
   The audio engine executes *exactly once per frame step*. During live preview, `beatEngine.update(isPlaying)` extracts frequency bands (`subBass`, `bass`, `mid`, `treble`) and evaluates transient flux (`kickScore`, `beatStrength`). During offline rendering, `BeatCacheManager` ticks sequentially (`tickSequential(timeSec)`), feeding pre-computed JSON beat events directly into `beatEngine.state`.

3. **Animation & Physics Update (`MotionEngine.js` / `AudioDrivenRuntime.js`):**  
   If `beatEngine.state.beat` is true, instantaneous kinetic impulses (`applyImpulse('zoom', strength)`, `applyImpulse('pulse', strength)`) are dispatched. Next, `motionEngine.update(isPlaying ? 1.0 : 0.0, dt)` and `audioDrivenRuntime.update(dt, beatEngine.state)` advance spring-damper differential equations and musical feel states.

4. **Object State & Evaluation (`ReactiveObjectProcessor.js` & `M3Objects`):**  
   `ReactiveObjectProcessor` maps global beat values (`energy`, `beatStrength`, `kick`) to individual object IDs. Each object in the scene list (`m3Objects`) is evaluated against visibility, enabled, and lock flags. Active objects calculate their current transformation matrices ($x, y, \text{scale}, \text{rotation}, \text{opacity}$) using evaluated reactive multipliers.

5. **Layer Compositing & Blending (`VisualRuntime.js` & `MediaFactoryRenderer`):**  
   Objects are sorted strictly by `zIndex` (`z-10` through `z-100+`). Active visual effects (`ZoomEffect`, `GlowEffect`, `CameraEffect`, `ParticleEffect`, `BlurEffect`, `SpectrumEffect`) inject their modifiers into the current write buffer (`VisualComposition`). Particle systems (`ParticleEngineCore`) update particle positions and perform shape/trail draws across their designated strata.

6. **Frame Output & Double-Buffer Swap (`FrameComposer`):**  
   The write buffer swaps (`writeIndex = (writeIndex + 1) % 2`), locking the completed `VisualComposition` into an immutable read buffer. `FrameComposer` constructs a unified `RenderFrame` package containing `currentTime`, `deltaTime`, `frameNumber`, and references to all active layer states.

7. **Encoder / Frame Consumer Ingestion (`OutputManager` / `FFmpegPipeline`):**  
   The consumer ingests the completed frame. In live preview, `PreviewCanvas` paints the visual buffer to the display. In offline export (`RenderScheduler`), the frame is captured and passed to the active encoder (`FFmpeg.wasm` or `child_process` FFmpeg).

---

## SECTION 3: BEAT POLICY

To prevent CPU saturation and maintain absolute temporal consistency across all reactive elements, the audio analysis pipeline is governed by five strict rules:

1. **Single Evaluation Per Tick:**  
   `BeatEngine.update()` (or `BeatCacheManager.tickSequential()`) must be called **exactly once per frame step**. No component, renderer, effect, or object inspector may trigger an audio analysis update directly.

2. **Global Read-Only Access:**  
   All downstream consumers—including `MotionEngine`, `VisualRuntime`, `AudioDrivenRuntime`, `ParticleEngineCore`, and individual `M3Objects`—must read exclusively from `beatEngine.state`. Modification of `beatEngine.state` outside `BeatEngine.js` is strictly forbidden.

3. **Zero Duplicate Analysis (No Second FFT/Detector/Analyzer):**  
   - **No Second FFT:** The application must maintain exactly one `AnalyserNode` (`dataArray`, `timeDomainArray`) for live analysis. Creating a second `AnalyserNode` or running duplicate FFT loops on the same audio data is prohibited.
   - **No Second Beat Detector:** The dual-EMA spectral flux onset algorithm inside `BeatDetector` is the sole detector. Modifying visualizers or particles to run custom transient detection formulas on raw audio arrays is strictly prohibited.
   - **No Second Audio Analyzer:** Module-specific analyzers (e.g., ad-hoc volume threshold checks in UI components) are forbidden; all features must consume the standardized band energies (`subBass`, `bass`, `mid`, `treble`, `presence`) exposed by `BeatEngine.state`.

4. **Universal Reactive Synchronization:**  
   Every beat-reactive object (`beatReactive: true`) must map its scaling, opacity, and velocity modulation to the exact same temporal frame of `beatEngine.state`, ensuring that when a drum impact occurs, every particle, logo pulse, and zoom effect triggers in absolute frame lockstep.

5. **Zero-Allocation Analysis Contract:**  
   Inside the per-frame `BeatEngine.update()` execution, no new objects (`{}`), arrays (`[]`), or typed arrays (`new Uint8Array(...)`) may be allocated. All data extraction must write into pre-allocated memory pools and singleton state properties.

---

## SECTION 4: OBJECT UPDATE POLICY

To eliminate redundant computations during complex scenes containing dozens or hundreds of M3 objects, every object must undergo an explicit state triage before evaluation and rendering:

```
[M3 Object Triage]
       │
       ├─► Invisible Object (visible === false) ──► [SKIP UPDATE] ──► [SKIP RENDER]
       │
       ├─► Disabled Object (enabled === false)  ──► [SKIP TOTAL (No Evaluation, No Layout, No Render)]
       │
       ├─► Locked Object (locked === true)      ──► [SKIP LAYOUT UPDATE & SKIP PROPERTY UPDATE]
       │                                            └─► [EVALUATE REACTIVITY & RENDER IF VISIBLE]
       │
       └─► Active / Dynamic Object              ──► [FULL UPDATE (Layout + Reactivity)] ──► [RENDER]
```

### 1. Invisible Object (`visible === false` or `opacity <= 0`):
- **Update Rule:** `NO UPDATE`. Physics updates, reactive interpolations, and coordinate calculations (`x`, `y`, `scale`) are bypassed entirely for this tick.
- **Render Rule:** `NO RENDER`. The object is excluded from layer sorting and draw loops.

### 2. Disabled Object (`enabled === false`):
- **Update Rule:** `SKIP TOTAL`. The object is ignored by all runtimes (`VisualRuntime`, `ReactiveObjectProcessor`) as if it does not exist in the scene graph.
- **Render Rule:** `NO RENDER`. Excluded from all composition and export buffers.

### 3. Locked Object (`locked === true`):
- **Update Rule:** `NO LAYOUT UPDATE` & `NO PROPERTY UPDATE`. User-driven coordinate modifications (`x`, `y`, `width`, `height`, `rotation`) and static property adjustments are frozen.
- **Render Rule:** If `visible === true` and `enabled === true`, the object **must still be evaluated for beat reactivity and rendered**. Locking protects against accidental UI layout edits; it does not disable visual output or audio reactivity (`Logo Pulse`).

### 4. Active / Dynamic Object (`visible === true`, `enabled === true`):
- **Update Rule:** `FULL UPDATE`. Transforms, reactive scaling ($1.0 + \text{beatStrength} \times \text{amplitude}$), and particle/visualizer internal states are fully evaluated.
- **Render Rule:** `FULL RENDER`. Submitted to the composition strata according to `zIndex`.

---

## SECTION 5: LAYER POLICY

The rendering hierarchy (`MediaFactoryRenderer` & `VisualRuntime`) manages visual layers according to four mandatory state rules:

1. **Empty Layers (`SKIP`):**  
   If a designated Z-index stratum (`z-50 Particles`, `z-90 Subtitles`, etc.) contains zero active objects for the current frame, the entire stratum execution and compositing pass must be skipped immediately. No empty canvas draw calls (`clearRect`, empty `drawImage`) may be issued for an empty stratum.

2. **Hidden Layers (`SKIP`):**  
   If a layer stratum or category toggle is globally hidden in the UI (`m3Effects.visible === false`), the engine must skip all calculations, physics loops, and rasterization for every object assigned to that layer.

3. **Static Layers (`REUSE`):**  
   If a layer contains only static objects (e.g., an unmoving, non-reactive background image, fixed watermark, or static overlay graphic) and the global camera (`Zoom Pulse`, `Camera Shake`) is currently at rest (`scale === 1.0`, `offset === 0`), the layer's output **must be reused directly from its cached bitmap/buffer** without re-executing draw loops.

4. **Dynamic Layers (`UPDATE`):**  
   Layers containing beat-reactive objects (`scale_pulse_default`), active particle systems (`ParticleEngineCore`), playing video backgrounds (`M1Background`), or advancing subtitles (`SubtitleRuntime`) must undergo a full update and re-render pass every tick.

---

## SECTION 6: RENDER POLICY

Each feature category must execute under a defined render strategy engineered to maximize visual fidelity while strictly controlling CPU/GPU rasterization costs:

| Feature Category | Render Strategy & Execution Rules |
| :--- | :--- |
| **Background** | **Resolution & Loop Anchored:** Static image backgrounds (`type: 'image'`) are drawn once to a baseline cache buffer and reused across frames unless global camera effects are active. Looping video backgrounds (`type: 'video'`) are rendered using direct texture streaming (`HTMLVideoElement` or FFmpeg stream decode). If `Ping Pong` loop mode is selected, intermediate forward/reverse frames must be processed without causing per-frame memory re-allocations. Output scaling strictly honors `videoExportQuality` (`Follow Export Target`, `1080p`, `4K`). |
| **Visualizer** | **DSP-Synchronized Geometric Rasterization:** Spectrum bars (`Bars`), circular graphs (`Circle`), waves (`Wave`), and lines (`Line`) consume `BeatEngine.state.dataArray` (`timeDomainArray` for waves). Geometry must be computed using pre-allocated coordinate arrays. Draw paths must group contiguous elements (e.g., a single `beginPath()` for all bars of a uniform color) to minimize 2D state context switches (`ctx.stroke()` / `ctx.fill()`). |
| **Particle** | **Batch-Instanced Physics Strata:** `ParticleEngineCore.js` renders active systems (`flow_explosion`, `flow_rain`, `flow_swirl`, etc.) inside designated Z-index strata (`z-50`). Particle arrays (`systems.get(id)`) must maintain pre-allocated pools up to `targetCount` (`config.count`). Dead particles (`life <= 0`) are recycled in-place (`spawnParticle(config, ..., false)`). Blend modes (`Screen`, `Additive/Lighter`, `Overlay`) must be set once globally per system batch, not per individual particle draw. |
| **Overlay** | **Bounded Box & Chroma Key Pipeline:** Static PNG/GIF overlays and animated graphics (`OverlayPanel`) are drawn using bounding box coordinates (`x`, `y`, `width`, `height`). For Chroma Key layers (`ChromaKeyImage`, `ChromaKeyVideo`), color-distance masking must execute via highly parallel pixel transformation rules (or GPU shaders when available), bypassing non-masked clear pixels to prevent redundant color-distance calculations. |
| **Subtitle** | **Frame-Accurate Word-Sync Karaoke:** Subtitle rendering (`SubtitleRuntime.js`, `SubtitleRenderer.jsx`) reads timestamp models from `SubtitleModels.js` generated via `WhisperAnalysisManager.js`. Text must only be re-layouted/re-measured when active words change or during intro/outro transitions. Word highlight state (`activeWordIndex`, `percentage`) must update deterministically from `currentTime`. |
| **Text** | **Font-Cached Vector Typography:** Custom text layers (`TextPanel.jsx`) utilizing custom fonts uploaded via `/api/m3/font/upload` (`.ttf`/`.otf`) must ensure fonts are fully loaded (`document.fonts.check()`) prior to draw initiation. Text metrics (`measureText`) must be cached on change (`text`, `font`, `size`) and never re-calculated per frame during static playback. |
| **Branding** | **Zero-Frame Global Overlay:** Channel logos, watermarks, and subscribe call-to-action widgets (`BrandingPanel.jsx`) are positioned at `z-60` to `z-80`. Unlike track-reactive effects, branding overlays must start rendering immediately at timeline `00:00.000` and persist across intro/outro boundaries unless explicit intro-delay offset (`start after intro ends`) is enabled by the user. |
| **Transition** | **Interpolated Alpha & Transform Blending:** Intro/Outro transitions (e.g., text fade-ins, subtitle slide-ups, or crossfades between background segments) must compute progression ratios (`t = elapsed / duration`) using clamped linear or eased curves (`Math.min(Math.max(t, 0), 1)`). Alpha and scale blending must apply directly to layer composition matrices without creating temporary intermediate canvas allocations. |
| **Camera** | **Global Viewport Transformation Matrix:** Camera effects (`Camera Shake`, `Earthquake`, `Handheld Drift`) and `Zoom Pulse` operate as global affine transformation matrices applied directly to the root composition buffer (`ctx.translate(offsetX, offsetY)`, `ctx.scale(zoom, zoom)`). Camera transforms must never alter local coordinates of individual objects stored in `m3Objects`. |

---

## SECTION 7: ANIMATION POLICY

Every animation parameter driving M3 objects must be classified and evaluated under one of five strictly bounded update rules:

1. **Beat Reactive Animations:**  
   - **Source:** Directly driven by `BeatEngine.state.beatStrength`, `energy`, `kickScore`, or `subBass`.  
   - **Update Rule:** Evaluated instantaneously on beat events via `MotionEngine` impulses or `ReactiveObjectProcessor` scaling formulas (`1.0 + Math.pow(reactiveValue, 1.2) * amplitude`). During transients, value interpolation uses high responsiveness ($\text{lerp} = 0.45$); during cooldowns, smooth deceleration applies ($\text{lerp} = 0.10$).  
   - **Temporal Scope:** Active only after any configured Intro sequence concludes, preventing reactive distortion during title screens.

2. **Time-Based Animations:**  
   - **Source:** Directly driven by continuous delta-time (`dt`) accumulation (`wavePhase += waveSpeed * dt`, `rotation += rotSpeed * dt`).  
   - **Update Rule:** Must integrate deterministically regardless of variable frame rates (`FPS`). Step delta `dt` must be clamped (`Math.min(dt, 0.1)`) to prevent physics explosions after pause or background tab delays.

3. **Random Animations:**  
   - **Source:** Stochastic variation applied during object or particle spawning (`flow_float`, `flow_swirl`, random rotation/scale).  
   - **Update Rule:** Random seeds (`Math.random()`) are permitted exclusively during object instantiation (`spawnParticle`). Once spawned, properties must evolve deterministically using integrated physics equations; calling `Math.random()` on every frame inside active update loops is forbidden.

4. **Manual Animations:**  
   - **Source:** Direct user scrubbing or manual slider drag (`SliderRow`, `M3TimelinePanel`).  
   - **Update Rule:** Must immediately sync project properties (`settings.currentTimeSec`) to `timeline.seek()`, overriding integrated physical momentum and resetting motion dampers to baseline zero states.

5. **Keyframe Animations:**  
   - **Source:** Mathematical easing presets defined in `ReactivePresets.js` (`easeOut`, `easeInOut`, `impulse`).  
   - **Update Rule:** Evaluated using parametric time normalization ($t \in [0, 1]$) across defined `attack` and `release` envelopes (`attack: 5ms, release: 150ms`). Keyframe evaluations must use lookup tables or algebraic formulas without generating transient curve arrays.

---

## SECTION 8: EFFECT POLICY

All available M3 effects (`src/services/visual/effects` & `ReactivePresets.js`) are classified below according to behavioral dynamism, beat reactivity, and computational cost. This classification establishes strict rules for execution prioritization and caching:

| Effect Name | Static / Dynamic | Beat Reactive | Cost Class | Execution & Evaluation Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Zoom Pulse (`ZoomEffect`)** | Dynamic | Yes (`beatStrength`) | **Cheap** | Global 2D affine scale matrix. Evaluates $O(1)$ math; applies once to root composition buffer. |
| **Scale Pulse (`scale_pulse_default`)** | Dynamic | Yes (`energy`) | **Cheap** | Local object affine scale multiplier. Evaluates $O(1)$ per target object. |
| **Logo Pulse (`logo_pulse_default`)** | Dynamic | Yes (`beatStrength`) | **Cheap** | Local UI/Logo popping and locking matrix. Evaluates $O(1)$ per branding object. |
| **Camera Shake (`CameraEffect`)** | Dynamic | Yes (`bass` / `kick`) | **Cheap** | Global 2D affine translation offset ($x, y$). Evaluates $O(1)$ random offset under bass transient threshold. |
| **Beat Flash (`beat_flash_default`)** | Dynamic | Yes (`beat`) | **Cheap** | Global strobe alpha/brightness multiplier. Evaluates $O(1)$ impulse decay envelope. |
| **Background Pulse (`bg_pulse_default`)** | Dynamic | Yes (`energy`) | **Cheap** | Global or background-specific brightness modulation. Evaluates $O(1)$ envelope. |
| **Brightness Pulse (`brightness_pulse_default`)** | Dynamic | Yes (`energy`) | **Cheap** | Color luminance multiplier applied across active layers. Evaluates $O(1)$. |
| **Glow / Bloom (`GlowEffect`)** | Dynamic | Yes (`energy`) | **Expensive** | Multi-pass shadow blur (`shadowBlur`) or gaussian bloom. Requires heavy GPU/CPU fill rasterization. Must be bounded by max radius limits. |
| **Blur / Motion Blur (`BlurEffect`)** | Dynamic | Yes (`transient`) | **Expensive** | Multi-pass directional or gaussian blur filter (`filter = 'blur(4px)'`). Requires extensive pixel neighborhood sampling. |
| **Particle Burst (`ParticleEffect`)** | Dynamic | Yes (`beatReactive`) | **Expensive** | Multi-flow particle physics (`ParticleEngineCore`). O(N) iteration over hundreds of active particles with individual shapes and trails. |
| **Spectrum Visualizer (`SpectrumEffect`)** | Dynamic | Yes (`dataArray`) | **Moderate** | Audio FFT bar/circle geometric rendering (`VisualizerRenderer`). O(B) iteration where B is frequency band count ($64$ to $256$). |
| **Chroma Key (`ChromaKeyImage/Video`)** | Dynamic | No / Optional | **Expensive** | Pixel-by-pixel color distance evaluation across full video/image frame dimensions (`1920x1080`). Requires parallel processing to prevent CPU lockup. |

---

## SECTION 9: ASSET POLICY

To prevent memory leaks, disk storage exhaustion, and duplicate network/file requests during multi-hour projects, all media assets (`M3BgPool`, `M3AudioTracks`, overlays, fonts) must adhere to explicit lifecycle rules:

```
[Asset Request] ──► [Check Asset Cache]
                          │
            ┌─────────────┴─────────────┐
     (Cache Hit)                  (Cache Miss)
            │                           │
            ▼                           ▼
      [REUSE ASSET]          [LOAD / DECODE / INGEST]
                                        │
                                        ▼
                              [REGISTER TO CACHE]
                                        │
                                        ▼
                             [MONITOR REFERENCE COUNT]
                                        │
                        (Reference Count === 0 && Project Closed)
                                        │
                                        ▼
                                [RELEASE & PURGE]
```

### 1. Image Assets (`Backgrounds`, `Overlays`, `Watermarks`):
- **Load Rule:** Loaded asynchronously via `HTMLImageElement` or file reader. Must decode once into memory (`img.decode()`).
- **Cache Rule:** Stored in the global `AssetCache` keyed by exact file URI / path (`sourcePath || filename`).
- **Reuse Rule:** If multiple objects or layers reference the same image file, all instances must point to the exact same cached bitmap/texture.
- **Release Rule:** Released (`URL.revokeObjectURL(uri)`, delete cache entry) only when no scene objects reference the image and the project/mode is reset or closed.

### 2. Video Assets (`Video Backgrounds`, `Video Overlays`):
- **Load Rule:** Ingested via `HTMLVideoElement` (for live preview) or FFmpeg stream reader (for offline render).
- **Cache Rule:** For live preview, video elements must be pooled. For offline rendering (`buildLoopVideo`), intermediate ping-pong files (`pingpong_*.mp4`) must be cached under `.mediafactory/cache/m3/` keyed by queue ID and file hash.
- **Reuse Rule:** When looping (`-stream_loop -1` or `loop 1`), the underlying video decoder must rewind seamlessly without re-reading or re-probing container headers from disk.
- **Release Rule:** Video elements must pause, clear src (`src = ''`), and execute `load()` upon project reset. Intermediate FFmpeg disk files (`pingpong_*.mp4`, `rev_*.mp4`) must be automatically purged upon successful export validation.

### 3. GIF Assets (`Animated Overlays`):
- **Load Rule:** Decoded into frame arrays or rendered via direct video-converted sprites/streams to avoid browser layout thrashing during GIF animation ticks.
- **Cache Rule:** Frame sequences are cached in `AssetCache` up to memory budget limits.
- **Reuse Rule:** Shared across all overlay objects referencing the exact same GIF ID.
- **Release Rule:** Purged immediately upon object removal or workspace transition.

### 4. Subtitle & Audio Assets (`M3AudioTracks`, `SubtitleModels`):
- **Load Rule:** Audio tracks (`local files` or `YouTube URIs`) are ingested. Remote YouTube tracks are downloaded once via `yt-dlp` (`yt_[id].mp3`). Subtitles are parsed once via `WhisperAnalysisManager` into `SubtitleModels`.
- **Cache Rule:** Audio files reside in `.mediafactory/cache/m3/`. Subtitle models reside in `SubtitleCacheManager`.
- **Reuse Rule:** The multi-track audio concatenation (`buildPlaylistAudio`) must read cached `yt_[id].mp3` files if their disk footprint (`fs.stat(ytOut).size > 0`) is valid, skipping network re-downloads entirely.
- **Release Rule:** Audio disk caches persist across sessions for fast project re-exports, cleared only during manual workspace cleanup or cache eviction policies.

### 5. Thumbnail & Logo Assets (`M3ThumbnailEditor`, `Branding`):
- **Load & Cache Rule:** Captured thumbnails (`m3ThumbnailSaved`) are serialized as base64 JPEG strings and cached inside the project configuration (`payload.thumbnail`).
- **Release Rule:** Replaced in-place upon manual re-capture or fallback generation.

---

## SECTION 10: MEMORY POLICY

Memory allocation across RAM, VRAM, and Disk buffers must be tightly bounded across five distinct operational structures:

| Memory Structure | Creation Condition | Release Condition | Reuse Policy |
| :--- | :--- | :--- | :--- |
| **Asset Cache** | Created upon first load of an Image, Video, Audio, or Font file. | Released when reference count reaches zero or project/mode is closed. | Always reused when `sourcePath`, `URI`, or file hash matches an existing cache entry. |
| **Object Cache** | Created when `M3Objects` (`ParticleObject`, `VisualizerObject`, `OverlayObject`) are instantiated by user placement or preset loading. | Released when object is deleted from scene list (`setM3Objects`) or workspace is cleared. | Pre-allocated internal object structures (`systems.get(id)` in `ParticleEngineCore`) are recycled in-place for dead particles (`life <= 0`). |
| **Frame Buffer** | Created once during `VisualRuntime` initialization: exactly two `VisualComposition` instances (`buffers = [new VisualComposition(), new VisualComposition()]`). | Released only upon application termination or total graphics engine teardown. | Strictly double-buffered (`buffers[writeIndex]`). Swapped per frame step; zero new buffer allocations permitted during update ticks. |
| **Beat Cache** | Created during offline audio compilation (`buildPlaylistAudio` / `BeatCacheManager`) or pre-calculated DSP extraction (`beat.cache.json`). | Released when active render job completes or when audio playlist tracks are modified/deleted. | Reused sequentially across every frame of offline video rendering (`tickSequential()`), bypassing live `AnalyserNode` FFT overhead entirely. |
| **Preview Cache** | Created during live UI preview scrubbing (storing recent `RenderFrame` outputs or thumbnail bitmaps). | Released when memory threshold is breached ($> 512\text{ MB}$) or when mode switches (`setActiveMode`). | Reused when the timeline scrubber is paused or held stationary at a previously rendered timecode. |

---

## SECTION 11: QUALITY POLICY

To ensure that M3 can execute gracefully on low-spec systems (`CPU: 2–4 Cores, RAM: 4–8 GB`) without sacrificing feature completeness, every rendering and visual feature must define three execution rules corresponding to system load and operational mode:

```
[Quality Path Governance]
          │
          ├─► Low Cost Path ──► [Interactive Preview / Scrubbing on Low-Spec PC]
          │                     └─► Simplified math, capped counts, no heavy blurs
          │
          ├─► Normal Path   ──► [Standard Realtime Preview on Recommended PC]
          │                     └─► Standard particle counts, full DSP sync, standard blending
          │
          └─► High Quality  ──► [Final Offline Production Export (`m3-render.js`)]
                                └─► Full particle density, maximum FFT resolution, uncompressed compositing
```

### 1. Low Cost Path (Interactive Scrubbing / Low-Spec Preview Mode):
- **Rule:** Executed automatically during rapid timeline scrubbing or when system hardware diagnostics report critical CPU/RAM constraints (`systemSpecs.ramFree < 1GB`).
- **Execution Constraints:** Particle counts (`ParticleEngineCore`) are clamped to $25\%$ of target (`count * 0.25`). Heavy multi-pass filters (`GlowEffect`, `BlurEffect`, `ChromaKey smoothing`) are bypassed or replaced with fast single-pass alpha opacity approximations. Visualizer FFT sampling is decimated ($64\text{ bins}$ instead of $256$).

### 2. Normal Path (Standard Real-Time Preview Mode):
- **Rule:** Executed during normal 1x speed playback inside `M3PreviewCanvas`.
- **Execution Constraints:** Full standard particle counts (`targetCount`), standard Attack/Release envelope smoothing across DSP bands (`EnvelopeBank`), and standard global composite blend modes (`Screen`, `Additive`, `Overlay`).

### 3. High Quality Path (Final Production Export Mode):
- **Rule:** Executed exclusively during offline production rendering (`RenderScheduler` & `processM3Job` via `backend/api/m3-render.js`).
- **Execution Constraints:** Maximum particle density ($100\%$ target count + high-precision sub-pixel trajectory integration). Maximum FFT resolution ($256+$ frequency bands). Full multi-pass Gaussian blur, pristine bloom radius calculations, and high-precision Chroma Key color distance masking. No frames are dropped; exact $60\text{ FPS}$ stepping is enforced.

---

## SECTION 12: FORBIDDEN OPERATIONS

To permanently safeguard the M3 engine against architectural regressions, memory leaks, and layout thrashing, the following operations are **STRICTLY AND UNCONDITIONALLY FORBIDDEN** inside any update loop (`update()`), render loop (`render()`), or per-frame execution path:

1. **FFT Berulang (`Duplicate FFT Analysis`):**  
   Calling `analyser.getByteFrequencyData()`, `analyser.getFloatFrequencyData()`, or `analyser.getByteTimeDomainData()` anywhere outside the single authorized per-frame tick inside `BeatEngine.update()` is forbidden.

2. **Duplicate Decode (`Duplicate Media Decoding`):**  
   Decoding the same image file (`img.decode()`), font file, or video header multiple times across different layers or widgets is forbidden. All decoding must occur once at the `AssetCache` level.

3. **Duplicate Image / Audio Load (`Redundant File/Network Ingestion`):**  
   Initiating multiple `fetch()`, `URL.createObjectURL()`, or `yt-dlp` download spawns for identical source paths (`sourcePath`, `URI`) is forbidden. Assets must be deduplicated by URI prior to ingestion.

4. **Duplicate Audio Analysis (`Secondary Transient / Beat Calculations`):**  
   Running secondary beat detection loops, custom threshold calculations on raw PCM arrays, or independent BPM estimators inside visualizers, particles, or UI components is forbidden. All components must read `beatEngine.state`.

5. **Hidden Object Render (`Rasterizing Invisible/Disabled Layers`):**  
   Executing `ctx.drawImage()`, `ctx.fill()`, `ctx.stroke()`, or GPU draw calls for any object where `visible === false`, `enabled === false`, or `opacity <= 0` is forbidden.

6. **Unused Effect Update (`Evaluating Inactive Modifiers`):**  
   Executing matrix calculations, blur convolution loops, or particle physics updates (`updateParticle`) for effect profiles or strata that are disabled or un-assigned in the current scene is forbidden.

7. **Per-Frame Asset Loading (`Dynamic I/O Inside Draw Loops`):**  
   Instantiating `new Image()`, `new Audio()`, invoking `document.createElement('canvas')`, or executing disk `fs.readFile()` / `fs.stat()` operations inside per-frame `update()` or `render()` ticks is forbidden. All assets must be pre-loaded, pre-allocated, and cached prior to entering the render loop.

---
**[END OF M3 RENDER POLICY — OFFICIAL ENGINE RULES LOCKED]**
