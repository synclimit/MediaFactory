# UNIVERSAL RENDERING ENGINE SPECIFICATION

## PART 1 — Architecture, Design Philosophy & Core Rendering Pipeline

**Status:** MASTER SPECIFICATION
**Version:** 1.0
**Priority:** CRITICAL
**Target:** Gravity AI Developer

---

# OBJECTIVE

Refactor the current rendering system into a **Universal Rendering Engine** that can be reused by every rendering mode inside MediaFactory.

This engine must prioritize:

* Maximum rendering speed
* Minimum memory usage
* Minimum disk I/O
* Maximum CPU/GPU utilization
* Scalability from low-end PCs to high-end workstations
* Modular architecture
* Maintainability
* Future extensibility

This engine is NOT designed specifically for Ambient Mode.

Instead, it becomes the rendering foundation for the entire application.

---

# SUPPORTED MODULES

The renderer must be reusable by:

* Ambient Video
* Music Video
* Playlist Video
* Cover Video
* Podcast Video
* Rain Video
* Nature Video
* Meditation Video
* Relaxation Video
* Subtitle Video
* Lofi Video
* Future modules

The rendering engine must never contain logic that only works for one module.

Everything should be configurable.

---

# DESIGN PHILOSOPHY

Current rendering architecture behaves similarly to:

Video

↓

Concat

↓

Concat

↓

Concat

↓

Encode

↓

Finish

This approach wastes:

* CPU
* RAM
* GPU
* Disk I/O
* Temporary storage

and scales poorly for long-duration videos.

The new architecture must become:

Project

↓

Asset Analysis

↓

Timeline Builder

↓

Frame Scheduler

↓

Timeline Composer

↓

Single Encoding Pass

↓

Output

Rendering should become **timeline-driven**, not **concat-driven**.

---

# UNIVERSAL TIMELINE

Every project should be converted into one logical timeline.

Timeline example:

Intro

↓

Main Body

↓

Outro

Each component is an independent timeline segment.

The renderer should never merge Intro into the looping section.

---

# TIMELINE SEGMENTS

## Intro

Properties:

* Optional
* Play Once
* Never Loop
* Supports text
* Supports animation
* Supports overlay
* Supports subtitle
* Supports transition

If Intro does not exist:

Skip completely.

---

## Body

Contains:

* Background
* Overlay
* Visualizer
* Subtitle
* Watermark
* Particles

Body duration follows audio duration.

---

## Outro

Optional.

Properties:

* Play Once
* Never Loop

---

# UNIVERSAL COMPOSITOR

The renderer should use one compositor that combines every active module.

Example:

Background Engine

↓

Overlay Engine

↓

Visualizer Engine

↓

Subtitle Engine

↓

Watermark Engine

↓

Particle Engine

↓

Color Engine

↓

Final Frame

Every frame should be produced by the compositor.

The compositor should not generate unnecessary intermediate videos.

---

# MODULE SYSTEM

Every feature should become an optional module.

Modules:

Intro Engine

Outro Engine

Background Engine

Overlay Engine

Visualizer Engine

Subtitle Engine

Watermark Engine

Particle Engine

Color Engine

Transition Engine

Audio Engine

Each module must be enabled only when required.

Example:

If Subtitle does not exist:

Subtitle Engine should never initialize.

If Overlay does not exist:

Overlay Engine should remain disabled.

If Intro does not exist:

Intro Engine should be skipped.

Unused modules must consume zero rendering time.

---

# ASSET PRE-ANALYSIS

Before rendering starts, analyze every asset.

Determine:

Video:

* Resolution
* FPS
* Codec
* Duration
* Alpha Channel
* Rotation
* Pixel Format

Image:

* Resolution
* Alpha
* Format

Audio:

* Sample Rate
* Channels
* Duration
* Codec

Subtitle:

* Format
* Style
* Animation Type

Overlay:

* Static
* Animated

Visualizer:

* Video
* Procedural

Intro:

Present / Missing

Outro:

Present / Missing

Hardware:

* CPU
* GPU
* RAM
* VRAM
* SSD/HDD
* Hardware Encoder

---

# SMART PIPELINE SELECTION

After asset analysis, automatically choose the best pipeline.

Example:

Static PNG overlay

↓

Treat as image

NOT video

Video overlay

↓

Streaming video pipeline

Subtitle missing

↓

Disable subtitle renderer

Visualizer procedural

↓

Do not initialize video decoder

No intro

↓

Skip Intro Engine completely

The engine should never execute unnecessary work.

---

# HARDWARE DETECTION

Detect:

CPU

* Physical cores
* Logical threads
* Frequency

RAM

* Installed
* Available

GPU

* Vendor
* VRAM
* Hardware Encoder

Storage

* SSD
* HDD

OS

* Windows version

---

# ADAPTIVE RENDER MODES

The renderer should automatically select one mode.

## LOW-END MODE

Typical hardware:

* Dual Core
* Quad Core
* 8 GB RAM
* Integrated GPU

Priority:

Lowest RAM usage.

Streaming.

Very little cache.

Avoid temporary files.

---

## BALANCED MODE

Typical hardware:

* Ryzen 5
* Core i5
* 16 GB RAM
* GTX 1650+

Priority:

Balanced cache.

Balanced threading.

Balanced memory.

---

## HIGH-END MODE

Typical hardware:

* Ryzen 9
* Core i9
* RTX GPU
* 32 GB+

Priority:

Maximum throughput.

Larger cache.

Higher parallelism.

GPU acceleration.

---

# FRAME SCHEDULER

This is the heart of the renderer.

The scheduler determines:

For every output frame,

which source frame should be displayed.

The renderer should never generate long loop videos.

Instead:

Output Frame

↓

Scheduler

↓

Source Frame

↓

Render

This eliminates unnecessary concatenation.

---

# BACKGROUND LOOP

Background looping should be mathematical.

Example:

Master Video

8 seconds

30 FPS

240 frames

Output

2 hours

The scheduler simply calculates:

Source Frame

=

Output Frame

MOD

Background Frame Count

This avoids creating:

Loop.mp4

Loop_Final.mp4

Loop_Final_Final.mp4

Those files should never exist.

---

# PLAYBACK MODES

Every asset should support playback modes.

Supported:

Play Once

Forward Loop

Ping-Pong

Reverse

Random Start

Random Offset

Playback mode is metadata.

It should not require generating duplicate assets whenever possible.

---

# UNIVERSAL RENDERING PRINCIPLE

The renderer must avoid:

Repeated decoding

Repeated encoding

Repeated concatenation

Repeated subtitle rasterization

Repeated asset loading

Repeated temporary files

Instead, everything should be calculated once and reused intelligently.

This philosophy must guide every implementation decision.

---

# ACCEPTANCE CRITERIA (PART 1)

Gravity must ensure that:

* The renderer is universal, not Ambient-specific.
* Rendering is timeline-driven instead of concat-driven.
* Every feature is modular and optional.
* Asset analysis determines the rendering strategy automatically.
* Hardware capabilities influence pipeline selection.
* Background looping is scheduler-based rather than file-based.
* The architecture can support future rendering modules without redesign.
