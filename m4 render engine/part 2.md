# UNIVERSAL RENDERING ENGINE SPECIFICATION

## PART 2 — Engine Modules, Timeline Composition & Playback System

**Status:** MASTER SPECIFICATION
**Version:** 1.0
**Priority:** CRITICAL
**Target:** Gravity AI Developer

---

# OBJECTIVE

This document defines how every rendering module should work inside the Universal Rendering Engine.

The implementation must prioritize:

* Maximum performance
* Reusability
* Predictable rendering
* Modular architecture
* Timeline synchronization
* Single encoding pass

The renderer should behave similarly to a professional non-linear editor (NLE), where every component exists independently on the global timeline and is composed only during rendering.

---

# GLOBAL TIMELINE

Every active component must follow one shared timeline.

Example:

Global Timeline

↓

00:00:00

↓

00:00:01

↓

00:00:02

↓

...

↓

End of Project

No module may maintain its own independent timeline.

Every module receives the same global timestamp.

---

# TIMELINE COMPOSITION

The renderer should compose the final frame using active modules.

Composition order:

Layer 1
Background

↓

Layer 2
Overlay

↓

Layer 3
Visualizer

↓

Layer 4
Particles

↓

Layer 5
Subtitle

↓

Layer 6
Text

↓

Layer 7
Watermark

↓

Color Correction

↓

Final Output Frame

This composition occurs only in memory.

Never render each layer into intermediate videos unless technically unavoidable.

---

# INTRO ENGINE

The Intro Engine is optional.

If disabled:

Skip initialization completely.

If enabled:

Play once only.

Properties:

* Duration configurable
* Independent background
* Independent text
* Independent overlay
* Independent transition
* Independent subtitle support
* Independent audio fade

The intro must never become part of the looping section.

---

# OUTRO ENGINE

Same philosophy as Intro.

Properties:

Play Once

Never Loop

Optional

Independent Timeline Segment

---

# BACKGROUND ENGINE

Purpose:

Render the primary background video.

Typical assets:

* Nature
* Rain
* River
* Forest
* Clouds
* Fire
* Lofi Background
* Static Image
* Animated Loop

Supported assets:

MP4

MOV

WEBM

PNG

JPEG

WEBP

Animated Image

Image Sequence

---

# BACKGROUND LOOPING

Background should never be physically concatenated.

Instead:

Output Frame

↓

Frame Scheduler

↓

Background Frame

↓

Display

This prevents huge temporary files.

---

# PLAYBACK MODES

Every visual asset should expose playback modes.

Supported:

Play Once

Forward Loop

Ping-Pong

Reverse

Random Start

Random Offset

Future playback modes must be easy to add.

---

# FORWARD LOOP

Suitable for:

Water

Rain

Clouds

Fire

General ambient loops

Scheduler:

Frame Count

↓

Modulo

↓

Source Frame

---

# PING-PONG MODE

Purpose:

Reduce visible jumps on looping animations.

Recommended for:

Overlay

Visualizer Video

Certain UI animations

Not recommended for:

Waterfall

River

Fire

Smoke flowing in one direction

Because reversing those animations looks unnatural.

---

# PING-PONG IMPLEMENTATION

Do NOT repeatedly generate reversed files.

Preferred implementation:

Playback mode handled by scheduler.

The scheduler decides whether the current playback direction is:

Forward

or

Reverse

The decoder should reuse the same source whenever possible.

Only create temporary reversed media if the underlying rendering backend cannot efficiently support reverse playback.

---

# RANDOM START

Useful for:

Overlay

Particles

Floating Dust

Fog

Lens Effects

Each project can begin from a random frame.

This greatly reduces repetitive appearance.

---

# RANDOM LOOP OFFSET

Different overlay assets should not always restart simultaneously.

Allow configurable offset.

Example:

Overlay A

starts at frame 30

Overlay B

starts at frame 400

Produces more natural motion.

---

# OVERLAY ENGINE

Supported assets:

PNG

Image Sequence

MP4

MOV

WEBM

Alpha Video

Overlay Engine should support:

Opacity

Blend Mode

Playback Mode

Scale

Position

Rotation

Animation

Color Adjustment

---

# STATIC OVERLAY

If overlay is PNG:

Treat as image.

Never initialize video decoder.

Render once.

Reuse.

---

# VIDEO OVERLAY

If overlay is video:

Stream frames.

Do not preload the entire video on low-end systems.

Allow adaptive caching on higher-end systems.

---

# VISUALIZER ENGINE

The visualizer is optional.

If absent:

Do not initialize.

If enabled:

Support two implementations.

Mode A

Procedural

Mode B

Video

---

# PROCEDURAL VISUALIZER

Preferred implementation.

Advantages:

Very low memory

No decoding

No video storage

Fully scalable

Animation driven only by global time.

No beat analysis required.

No FFT required.

No BPM detection required.

Example properties:

Opacity

Scale

Rotation

Movement

Glow

Blur

Frequency

Amplitude

Everything should be generated mathematically.

---

# VIDEO VISUALIZER

If users provide video visualizers.

Support:

Forward Loop

Ping-Pong

Reverse

Random Offset

Never synchronize visualizer playback to background loop count.

Visualizer follows the global timeline.

---

# PARTICLE ENGINE

Particles should never restart because the background loop restarts.

Particles must exist continuously.

Examples:

Floating Dust

Snow

Fireflies

Rain Drops

Sparkles

Fog Particles

Particle simulation follows global time.

---

# WATERMARK ENGINE

Optional.

Supports:

PNG

SVG (if supported)

Animated Watermark

Opacity

Scale

Position

Watermark should remain independent from every other module.

---

# TEXT ENGINE

Separate from subtitles.

Purpose:

Intro Text

Title

Description

Artist Name

Album

Credits

Custom Labels

Supports:

Static

Fade

Progressive

Typewriter

Rolling

Crawl

Character Animation

Word Animation

This engine should be reusable across all rendering modes.

---

# SUBTITLE ENGINE

Subtitle Engine is completely optional.

If project contains no subtitle:

Do not initialize parser.

Do not allocate subtitle memory.

Do not execute subtitle rendering.

Zero overhead.

---

# SUPPORTED SUBTITLE FORMATS

SRT

ASS

Future formats

Architecture should remain extensible.

---

# SUBTITLE TIMELINE

Subtitle must always follow:

Global Timeline

Never:

Background Loop

Overlay Loop

Visualizer Loop

Subtitle timing is determined exclusively by subtitle timestamps.

Even if the background loops thousands of times, subtitle timing must remain synchronized with the audio timeline.

---

# SUBTITLE RENDERING

Pipeline:

Subtitle File

↓

Parser

↓

Renderer

↓

Texture Cache

↓

Composer

↓

Output

Rendering should occur only when required.

---

# SUBTITLE STYLES

Renderer should support multiple styles.

Examples:

Static

Fade

Progressive

Per Word

Per Character

Typewriter

Rolling

Crawl

Karaoke

Highlight

Future styles

Each style should be implemented as a renderer module rather than modifying the core rendering engine.

---

# AUDIO ENGINE

Audio pipeline:

Music

*

Ambient

*

Fade

*

Volume Automation

↓

Final Audio

Audio mixing occurs exactly once.

Never remix audio for every background loop.

---

# SYNCHRONIZATION

Every engine receives the same global playback time.

This guarantees:

Background

Overlay

Visualizer

Particles

Subtitle

Text

Audio

remain synchronized regardless of playback mode.

---

# COMPOSITION PHILOSOPHY

Every frame should be composed dynamically.

Do NOT create:

Background_Final.mp4

Overlay_Final.mp4

Subtitle_Final.mp4

Visualizer_Final.mp4

Those intermediate videos waste storage and increase rendering time.

Only one final output should be encoded.

---

# ACCEPTANCE CRITERIA (PART 2)

Gravity must ensure that:

* Every rendering module is independent and optional.
* Every module uses the same global timeline.
* Intro and Outro never become part of looping sections.
* Background loops mathematically rather than through repeated concatenation.
* Overlay, visualizer and particles continue naturally across loop boundaries.
* Subtitle timing always follows the subtitle timestamps and audio timeline.
* Static assets are treated differently from video assets.
* Procedural visualizers are preferred when possible.
* Playback modes are implemented as playback logic rather than duplicated media whenever possible.
* The compositor generates one final frame in memory and avoids unnecessary intermediate video generation.
