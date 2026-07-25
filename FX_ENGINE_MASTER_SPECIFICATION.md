# MEDIAFACTORY FX ENGINE — MASTER SPECIFICATION

**Document Version:** 1.0  
**Classification:** Internal Design Document — Confidential  
**Author:** Lead Creative Director, MediaFactory  
**Date:** July 2026  
**Status:** Pre-Development Specification  

---

> **Design Philosophy**
>
> *"Every frame should feel alive. Every beat should be visible. Every genre should have its own soul."*
>
> MediaFactory FX Engine is not a filter library. It is a living, breathing, audio-reactive visual effects compositor designed from the ground up to transform static video into cinematic, music-driven art. Where BSP Labs offers presets, we offer an ecosystem. Where After Effects offers manual keyframing, we offer intelligent automation. Where DaVinci Resolve offers color science, we offer color *emotion*.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [FX Categories & Complete Effect Library](#2-fx-categories--complete-effect-library)
3. [Universal Parameter System](#3-universal-parameter-system)
4. [Trigger System](#4-trigger-system)
5. [Modulation System](#5-modulation-system)
6. [FX Stack & Render Order](#6-fx-stack--render-order)
7. [Color Grading System](#7-color-grading-system)
8. [Genre Preset Packs](#8-genre-preset-packs)
9. [Smart Presets & AI Presets](#9-smart-presets--ai-presets)
10. [Preset Engine](#10-preset-engine)
11. [Marketplace Architecture](#11-marketplace-architecture)
12. [Performance Budget](#12-performance-budget)
13. [Appendix: Effect Specification Sheets](#13-appendix-effect-specification-sheets)

---

# 1. ARCHITECTURE OVERVIEW

## 1.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MEDIAFACTORY FX ENGINE                         │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ AUDIO        │    │ TRIGGER      │    │ MODULATION           │   │
│  │ ANALYZER     │───▶│ DISPATCHER   │───▶│ MATRIX               │   │
│  │              │    │              │    │                      │   │
│  │ • FFT        │    │ • Beat       │    │ • LFO                │   │
│  │ • Onset      │    │ • Kick       │    │ • Perlin             │   │
│  │ • Pitch      │    │ • Snare      │    │ • Envelope           │   │
│  │ • Energy     │    │ • Bass       │    │ • Spring             │   │
│  │ • Spectral   │    │ • Treble     │    │ • Noise              │   │
│  │ • Transient  │    │ • Drop       │    │ • Audio-Driven       │   │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘   │
│                                                      │              │
│  ┌───────────────────────────────────────────────────▼───────────┐  │
│  │                     FX STACK (Ordered Pipeline)                │  │
│  │                                                               │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│  │
│  │  │ Layer 1 │▶│ Layer 2 │▶│ Layer 3 │▶│ Layer 4 │▶│Layer N ││  │
│  │  │ Camera  │ │ Distort │ │ Light   │ │ Color   │ │ Output ││  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘│  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ PRESET       │    │ SMART        │    │ AI ASSISTANT         │   │
│  │ ENGINE       │    │ PRESETS      │    │                      │   │
│  │              │    │              │    │ • Natural Language    │   │
│  │ • Load       │    │ • Genre      │    │ • Style Transfer     │   │
│  │ • Save       │    │ • Mood       │    │ • Auto-Suggest       │   │
│  │ • Export     │    │ • Energy     │    │ • Preset Generation  │   │
│  │ • Inherit    │    │ • Context    │    │                      │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.2 Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Audio First** | Every effect must be designable as audio-reactive. Even static effects must expose a "React to Audio" toggle. |
| 2 | **Non-Destructive** | All effects are applied as layers. Original content is never modified. Any effect can be disabled, reordered, or removed at any time. |
| 3 | **GPU-Native** | All visual effects run on the GPU via WebGL/WebGPU shaders. CPU is reserved only for audio analysis and trigger computation. |
| 4 | **Modular** | Each effect is a self-contained module with standardized inputs/outputs. Effects can be composed, stacked, and chained freely. |
| 5 | **One-Click to Pro** | A beginner should be able to click one preset and get professional results. An expert should be able to fine-tune every parameter. |
| 6 | **Scalable Performance** | Every effect has a performance cost rating. The engine auto-adjusts quality based on available GPU resources. |
| 7 | **Future-Proof** | Architecture supports marketplace plugins, user-created effects, and AI-generated presets. |

## 1.3 Comparison: MediaFactory vs BSP Labs

| Feature | BSP Labs | MediaFactory (Target) |
|---------|----------|----------------------|
| Total Effects | ~15 | **80+** |
| FX Categories | 3 (Color, Film, Beat) | **22 Categories** |
| Trigger Types | 4 (Always, Beat, Kick, Bass) | **20+ Triggers** |
| Modulation | None | **12 Modulation Types** |
| Color Grading | 7 presets | **25+ LUT Styles** |
| Genre Presets | ~30 | **40+ with Smart Logic** |
| FX Stack | Fixed order | **User-Reorderable** |
| AI Presets | None | **Natural Language AI** |
| Marketplace | None | **Full Marketplace** |
| GPU Pipeline | Basic | **Multi-Pass Compositor** |
| Preset Inheritance | None | **Full Inheritance Tree** |

---

# 2. FX CATEGORIES & COMPLETE EFFECT LIBRARY

## 2.1 Category Overview

| # | Category | Icon | Effects Count | Description |
|---|----------|------|--------------|-------------|
| 1 | **Camera FX** | 🎥 | 8 | Simulates physical camera behaviors — shake, zoom, pan, dolly, rack focus |
| 2 | **Color FX** | 🎨 | 10 | Color manipulation — grade, shift, invert, threshold, posterize |
| 3 | **Film FX** | 🎞️ | 8 | Analog film simulation — grain, dust, scratches, flicker, vignette |
| 4 | **Glitch FX** | ⚡ | 7 | Digital corruption — RGB shift, block glitch, data moshing, pixel sort |
| 5 | **Lens FX** | 🔍 | 6 | Optical effects — chromatic aberration, barrel distortion, lens flare, bokeh |
| 6 | **Lighting FX** | 💡 | 7 | Light simulation — glow, bloom, god rays, light leak, strobe |
| 7 | **Particle FX** | ✨ | 8 | Particle systems — confetti, rain, snow, fire, sparks, smoke, dust motes |
| 8 | **Distortion FX** | 🌀 | 7 | Spatial warping — wave, ripple, twirl, shear, kaleidoscope, mirror |
| 9 | **Blur FX** | 🌫️ | 6 | Focus effects — gaussian, motion, radial, directional, tilt-shift, depth |
| 10 | **Stylize FX** | 🖼️ | 6 | Artistic styles — halftone, comic, sketch, oil paint, mosaic, neon outline |
| 11 | **Beat FX** | 🥁 | 5 | Percussion-reactive — beat zoom, beat flash, beat pulse, beat shake, beat wipe |
| 12 | **Post Processing** | 🔧 | 6 | Final output — sharpen, denoise, anti-alias, tone map, dither, LUT apply |
| 13 | **Transition FX** | 🔄 | 8 | Scene transitions — dissolve, wipe, slide, zoom, glitch cut, flash, morph, shatter |
| 14 | **Environmental FX** | 🌍 | 6 | Natural phenomena — fog, mist, heat haze, underwater, aurora, lightning |
| 15 | **Atmospheric FX** | 🌌 | 5 | Mood effects — light rays, dust motes, lens condensation, breath fog, haze |
| 16 | **Motion FX** | 🏃 | 5 | Motion augmentation — trail, echo, speed lines, motion smear, time stretch |
| 17 | **Geometry FX** | 📐 | 5 | Geometric manipulation — tile, fractal, symmetry, voronoi, tessellation |
| 18 | **Audio Reactive FX** | 🎵 | 5 | Deep audio analysis — spectrum map, waveform overlay, frequency heatmap, amplitude pulse, harmonic rings |
| 19 | **Advanced FX** | 🧪 | 5 | Professional compositing — chroma key, mask, blend modes, depth map, displacement |
| 20 | **Experimental FX** | 🔬 | 4 | Cutting-edge — AI style transfer, neural glow, procedural texture, reaction-diffusion |
| 21 | **Text FX** | 🔤 | 4 | Typography effects — text glow, text shadow, text stroke animation, kinetic type |
| 22 | **Retro FX** | 📼 | 5 | Vintage simulation — VHS, CRT, 8-bit, analog TV, cassette tape |

**TOTAL: 134 Individual Effects**

---

## 2.2 Complete Effect Library — By Category

### CATEGORY 01: CAMERA FX 🎥

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Camera Shake** | Simulates handheld camera vibration. Randomized X/Y displacement with configurable intensity. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 2 | **Beat Zoom** | Rapid zoom-in/out synced to audio transients. Creates a "punchy" feel. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 3 | **Dolly Zoom** | Vertigo/Hitchcock effect — zoom in while pulling back, or reverse. Disorienting. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Pan & Tilt** | Slow or beat-synced camera panning across the frame. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Rack Focus** | Simulates shifting focus plane — foreground to background or reverse. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 6 | **Roll / Dutch Angle** | Rotates the camera on the Z-axis. Creates unease or energy. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 7 | **Orbit** | Slow circular or spiral camera movement around a center point. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 8 | **Breathing** | Subtle rhythmic zoom simulating human breathing cadence. Calming. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Camera Shake — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 20.0 | Overall strength of the shake displacement in pixels |
| Frequency | Float | 0.1 | 30.0 | 8.0 | How many shake oscillations per second |
| Smoothing | Float | 0.0 | 1.0 | 0.5 | Interpolation smoothness — 0 = jerky, 1 = fluid |
| X Amplitude | Float | 0.0 | 100.0 | 50.0 | Horizontal shake strength relative to intensity |
| Y Amplitude | Float | 0.0 | 100.0 | 50.0 | Vertical shake strength relative to intensity |
| Rotation Amount | Float | 0.0 | 15.0 | 2.0 | Degrees of rotational shake |
| Trigger | Enum | — | — | Beat | When the shake activates (see Trigger System) |
| Trigger Source | Enum | — | — | Kick | Which audio element drives the shake |
| Attack | Float | 0.0 | 1.0 | 0.1 | How fast shake reaches full intensity after trigger |
| Decay | Float | 0.0 | 3.0 | 0.5 | How long shake takes to settle after trigger |
| Mode | Enum | — | — | Light | Light (recommended, fast) / Heavy (GPU-intensive, cinematic) |
| Seed | Int | 0 | 9999 | Random | Randomization seed for reproducible shake patterns |

**Typical Use Cases:** Music drops, EDM builds, horror sequences, action scenes  
**Recommended Genres:** Phonk, Trap, EDM, Dubstep, Metal, Rock  
**Recommended Combinations:** Camera Shake + Beat Zoom + Chromatic Aberration  
**Pro Tip:** Use Light mode for CPU rendering. Keep intensity below 30 for cinematic feel; above 60 for aggressive EDM.

#### Beat Zoom — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Zoom Depth | Float | 0.0 | 100.0 | 65.0 | Maximum zoom percentage per beat |
| Direction | Enum | — | — | In | Zoom In / Zoom Out / Alternate / Pulse |
| Attack | Float | 0.01 | 0.5 | 0.05 | Seconds to reach full zoom |
| Release | Float | 0.05 | 2.0 | 0.3 | Seconds to return to normal |
| Easing | Enum | — | — | EaseOut | Linear / EaseIn / EaseOut / EaseInOut / Elastic / Bounce |
| Center X | Float | 0.0 | 1.0 | 0.5 | Horizontal zoom origin (0=left, 1=right) |
| Center Y | Float | 0.0 | 1.0 | 0.5 | Vertical zoom origin (0=top, 1=bottom) |
| Trigger | Enum | — | — | Beat | Trigger type |
| Trigger Source | Enum | — | — | Kick | Audio source |
| Max Zoom Cap | Float | 1.0 | 3.0 | 1.5 | Maximum scale factor to prevent excessive zoom |

**Typical Use Cases:** Beat drops, chorus emphasis, bass-heavy tracks  
**Recommended Genres:** EDM, Dubstep, Phonk, Trap, Hip-Hop  
**Recommended Combinations:** Beat Zoom + Camera Shake + Bloom  
**Pro Tip:** Set Direction to "Pulse" for a breathing effect. Use "Elastic" easing for bounce-back energy.

#### Dolly Zoom — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Effect Strength | Float | 0.0 | 100.0 | 50.0 | Intensity of the vertigo effect |
| Speed | Float | 0.1 | 5.0 | 1.0 | Animation speed multiplier |
| Direction | Enum | — | — | Forward | Forward (zoom in + pull back) / Reverse |
| Duration | Float | 0.5 | 10.0 | 2.0 | Seconds for one complete dolly zoom cycle |
| Loop | Bool | — | — | false | Whether the effect repeats |
| Trigger | Enum | — | — | Drop | When the effect fires |

**Typical Use Cases:** Dramatic reveals, horror sequences, emotional climax  
**Recommended Genres:** Cinematic, Horror, Classical, Metal  
**Recommended Combinations:** Dolly Zoom + Vignette + Desaturation  
**Pro Tip:** Use sparingly — one dolly zoom at a key moment in the track is far more impactful than continuous use.

#### Pan & Tilt — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Pan Speed | Float | -100.0 | 100.0 | 10.0 | Horizontal movement speed (negative = left) |
| Tilt Speed | Float | -100.0 | 100.0 | 0.0 | Vertical movement speed (negative = up) |
| Range X | Float | 0.0 | 50.0 | 20.0 | Maximum horizontal displacement percentage |
| Range Y | Float | 0.0 | 50.0 | 10.0 | Maximum vertical displacement percentage |
| Motion Type | Enum | — | — | Sine | Sine / Linear / Random / Beat-Driven |
| Loop | Bool | — | — | true | Whether the pan/tilt loops |

**Typical Use Cases:** Establishing shots, ambient movement, slow builds  
**Recommended Genres:** Ambient, Lo-fi, Classical, Jazz, Cinematic  
**Recommended Combinations:** Pan & Tilt + Breathing + Warm Color Grade  

#### Rack Focus — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Blur Amount | Float | 0.0 | 20.0 | 8.0 | Maximum blur radius in pixels |
| Focus Point | Float | 0.0 | 1.0 | 0.5 | Focal plane position (0=near, 1=far) |
| Transition Speed | Float | 0.1 | 5.0 | 1.0 | Seconds for focus shift |
| Depth of Field | Float | 0.0 | 1.0 | 0.3 | Width of the in-focus zone |
| Auto Focus | Bool | — | — | false | Automatically focus on the loudest moment |
| Trigger | Enum | — | — | Manual | Manual / Beat / Drop / Chorus |

**Typical Use Cases:** Shifting viewer attention, cinematic transitions  
**Recommended Genres:** Cinematic, Classical, Jazz, Ambient  
**Recommended Combinations:** Rack Focus + Vignette + Bokeh  

#### Roll / Dutch Angle — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Angle | Float | -45.0 | 45.0 | 15.0 | Maximum rotation angle in degrees |
| Speed | Float | 0.1 | 10.0 | 1.0 | Rotation speed |
| Motion Type | Enum | — | — | Oscillate | Oscillate / One-Shot / Beat-Driven / Random |
| Easing | Enum | — | — | Sine | Linear / Sine / Elastic |
| Trigger | Enum | — | — | Always On | When the rotation activates |

**Typical Use Cases:** Disorientation, energy, transitions  
**Recommended Genres:** Phonk, Trap, Horror, EDM  

#### Orbit — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Radius | Float | 0.0 | 50.0 | 15.0 | Size of the circular orbit path (% of frame) |
| Speed | Float | 0.01 | 5.0 | 0.3 | Revolutions per minute |
| Direction | Enum | — | — | Clockwise | Clockwise / Counter-Clockwise / Alternate |
| Shape | Enum | — | — | Circle | Circle / Ellipse / Figure-8 / Spiral |
| Center X | Float | 0.0 | 1.0 | 0.5 | Center of orbit X position |
| Center Y | Float | 0.0 | 1.0 | 0.5 | Center of orbit Y position |

**Typical Use Cases:** Ambient atmosphere, dreamlike sequences  
**Recommended Genres:** Ambient, Meditation, Lo-fi, Classical  

#### Breathing — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Amplitude | Float | 0.5 | 10.0 | 3.0 | Zoom amount per breath cycle (%) |
| BPM | Float | 4.0 | 30.0 | 12.0 | Breaths per minute |
| Smoothing | Float | 0.0 | 1.0 | 0.8 | How smooth the breathing motion is |
| Sync to Audio | Bool | — | — | false | Sync breathing to track tempo |

**Typical Use Cases:** Meditation, relaxation, ambient videos  
**Recommended Genres:** Meditation, Ambient, ASMR, Piano, Worship  

---

### CATEGORY 02: COLOR FX 🎨

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Color Grade** | Professional LUT-based color transformation. The foundation of all color work. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Hue Shift** | Rotates the entire color wheel by a configurable angle. | Low | GPU | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 3 | **Saturation** | Increase or decrease color intensity globally or per-channel. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 4 | **Brightness / Exposure** | Lighten or darken the entire image uniformly or via curves. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 5 | **Contrast** | Expand or compress tonal range. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 6 | **Color Invert** | Negates all color channels, producing a photographic negative. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 7 | **Posterize** | Reduces color depth to create flat, poster-like bands. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 8 | **Color Threshold** | Converts to black/white based on a luminance threshold. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 9 | **Channel Mixer** | Remix R/G/B channels — swap, offset, or blend channels together. | Low | GPU | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| 10 | **Color Pulse** | Pulses the scene between two colors, synced to beat. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

#### Color Grade — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| LUT Preset | Enum | — | — | None | Select from built-in LUT styles (see Color Grading System) |
| Intensity | Float | 0.0 | 100.0 | 100.0 | Blend between original and graded image |
| Temperature | Float | -100.0 | 100.0 | 0.0 | Warm (positive) or Cool (negative) |
| Tint | Float | -100.0 | 100.0 | 0.0 | Green (negative) or Magenta (positive) |
| Exposure | Float | -5.0 | 5.0 | 0.0 | Exposure stops adjustment |
| Contrast | Float | -100.0 | 100.0 | 0.0 | Tonal range compression/expansion |
| Highlights | Float | -100.0 | 100.0 | 0.0 | Brightest areas adjustment |
| Shadows | Float | -100.0 | 100.0 | 0.0 | Darkest areas adjustment |
| Saturation | Float | -100.0 | 100.0 | 0.0 | Overall color intensity |
| Vibrance | Float | -100.0 | 100.0 | 0.0 | Selective saturation (protects skin tones) |

**Typical Use Cases:** Every project — color grading is the foundation of visual identity  
**Recommended Genres:** All  
**Pro Tip:** Always apply Color Grade as the LAST effect in the stack for predictable results.

#### Hue Shift — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Angle | Float | -180.0 | 180.0 | 0.0 | Degrees to rotate the color wheel |
| Speed | Float | 0.0 | 10.0 | 0.0 | Automatic rotation speed (0 = static) |
| Beat React | Bool | — | — | false | Jump hue on each beat |
| Jump Amount | Float | 10.0 | 180.0 | 30.0 | Degrees to jump per beat (if Beat React enabled) |
| Target | Enum | — | — | All | All / Shadows Only / Midtones Only / Highlights Only |

**Typical Use Cases:** Psychedelic sequences, transitions between color themes  
**Recommended Genres:** Synthwave, EDM, Disco, Psychedelic, K-Pop  
**Recommended Combinations:** Hue Shift + Bloom + Particles  

#### Color Pulse — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Color A | Color | — | — | #FF0000 | First pulse color |
| Color B | Color | — | — | #0000FF | Second pulse color |
| Blend Mode | Enum | — | — | Overlay | How colors blend with the source |
| Intensity | Float | 0.0 | 100.0 | 40.0 | Strength of the color overlay |
| Trigger | Enum | — | — | Beat | When pulse fires |
| Duration | Float | 0.05 | 2.0 | 0.2 | Seconds for each pulse |
| Alternating | Bool | — | — | true | Alternate between Color A and Color B |

**Typical Use Cases:** Club visuals, EDM drops, strobe effects  
**Recommended Genres:** EDM, Techno, Trance, House, Disco  

---

### CATEGORY 03: FILM FX 🎞️

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Film Grain** | Adds photochemical noise simulating analog film stock. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Dust & Scratches** | Simulates aged film with floating dust particles and vertical scratches. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 3 | **Film Flicker** | Random brightness fluctuations simulating old projector lamp instability. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 4 | **Vignette** | Darkens edges of the frame, drawing attention to the center. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 5 | **Light Leak** | Simulates stray light entering the camera body — warm organic bleeds. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 6 | **Film Burn** | Hot overexposed edges that creep inward, simulating film degradation. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 7 | **Sprocket Holes** | Renders visible film sprocket holes at frame edges (4-perf, 8-perf). | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 8 | **Gate Weave** | Simulates slight vertical jitter of film in the camera gate. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

#### Film Grain — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Density | Float | 0.0 | 100.0 | 40.0 | Amount of visible grain particles |
| Size | Float | 0.1 | 5.0 | 1.0 | Grain particle size multiplier |
| Speed | Float | 0.1 | 5.0 | 1.0 | Animation speed of grain movement |
| Softness | Enum | — | — | Fine | Fine / Medium / Coarse |
| Monochrome | Bool | — | — | true | Grain is grayscale (true) or colored (false) |
| Trigger | Enum | — | — | Always On | When grain is visible |
| Blend Mode | Enum | — | — | Overlay | How grain blends with image |
| Film Stock | Enum | — | — | Generic | Generic / Kodak Tri-X / Fuji 400H / Ilford HP5 / CineStill 800T |
| Color Sensitivity | Float | 0.0 | 100.0 | 50.0 | How much grain reacts to underlying image brightness |

**Typical Use Cases:** Vintage feel, cinematic texture, music video aesthetic  
**Recommended Genres:** Lo-fi, Jazz, Classical, Cinematic, Vintage, Hip-Hop  
**Recommended Combinations:** Film Grain + Warm Color Grade + Vignette  
**Pro Tip:** Use Kodak Tri-X stock with density ~35 for that perfect "YouTube Lofi" look.

#### Vignette — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 55.0 | Darkness of the vignette |
| Radius | Float | 0.1 | 2.0 | 0.8 | Size of the clear center area |
| Softness | Float | 0.0 | 1.0 | 0.5 | Edge gradient smoothness |
| Roundness | Float | 0.0 | 1.0 | 1.0 | 1.0 = circle, 0.0 = rectangle |
| Color | Color | — | — | #000000 | Vignette color (usually black) |
| Center X | Float | 0.0 | 1.0 | 0.5 | Horizontal center offset |
| Center Y | Float | 0.0 | 1.0 | 0.5 | Vertical center offset |
| Trigger | Enum | — | — | Always On | When vignette is active |
| Beat React | Bool | — | — | false | Pulse vignette on beat |
| Pulse Amount | Float | 0.0 | 50.0 | 15.0 | How much the vignette tightens on beat |

**Typical Use Cases:** Focus attention, cinematic framing, mood setting  
**Recommended Genres:** All — especially Cinematic, Jazz, Lo-fi, Classical  
**Pro Tip:** A subtle vignette (intensity 30-40) improves almost every composition.

#### Dust & Scratches — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Dust Density | Float | 0.0 | 100.0 | 40.0 | Number of dust particles visible |
| Dust Size | Float | 0.5 | 5.0 | 1.5 | Size range of dust particles |
| Dust Speed | Float | 0.1 | 5.0 | 0.5 | How fast dust particles move |
| Scratch Density | Float | 0.0 | 100.0 | 30.0 | Number of vertical scratches |
| Scratch Width | Float | 0.5 | 3.0 | 1.0 | Width of scratch lines |
| Scratch Speed | Float | 0.1 | 5.0 | 1.0 | How fast scratches scroll |
| Scratch Color | Color | — | — | #FFFFFF | Color of scratch marks |
| Hair Chance | Float | 0.0 | 100.0 | 10.0 | Probability of film hair appearing |
| Aging | Enum | — | — | Moderate | New / Moderate / Heavily Aged / Destroyed |
| Trigger | Enum | — | — | Always On | When the effect is active |

**Typical Use Cases:** Retro aesthetics, nostalgic mood, aging simulation  
**Recommended Genres:** Lo-fi, Jazz, Classical, Vintage, Retro VHS  
**Recommended Combinations:** Dust & Scratches + Film Grain + Sepia Grade  

#### Light Leak — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 40.0 | Brightness of the light leak |
| Position | Enum | — | — | Random | Top-Left / Top-Right / Bottom-Left / Bottom-Right / Random / Center |
| Color | Enum | — | — | Warm | Warm (orange/amber) / Cool (blue/cyan) / Rainbow / Custom |
| Custom Color | Color | — | — | #FF8844 | Custom leak color (if Color = Custom) |
| Speed | Float | 0.1 | 5.0 | 0.5 | Animation speed of light leak movement |
| Size | Float | 10.0 | 100.0 | 40.0 | Size of the leak area (% of frame) |
| Blend Mode | Enum | — | — | Screen | Screen / Add / Overlay / Soft Light |
| Trigger | Enum | — | — | Always On | When the light leak appears |
| Beat Flash | Bool | — | — | false | Flash the leak brighter on beat |

**Typical Use Cases:** Dreamy warmth, cinematic transitions, analog feel  
**Recommended Genres:** Lo-fi, Pop, Cinematic, Ambient, Indie  

---

### CATEGORY 04: GLITCH FX ⚡

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **RGB Split** | Displaces red, green, and blue channels in different directions. | Low | GPU | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| 2 | **Block Glitch** | Randomly displaces rectangular blocks of the image. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 3 | **Data Mosh** | Simulates codec errors — frame blending, macro-blocking, smearing. | High | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Pixel Sort** | Sorts pixels by brightness, hue, or saturation along scan lines. | High | GPU | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 5 | **Digital Noise** | Random per-pixel noise injection — static, snow, interference. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 6 | **Scan Drift** | Horizontal scan lines that shift and tear, simulating signal loss. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 7 | **Bit Crush** | Reduces color bit depth creating banding and dithering artifacts. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

#### RGB Split — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 35.0 | Maximum pixel displacement of channels |
| Angle | Float | 0.0 | 360.0 | 0.0 | Direction of the split (0 = horizontal) |
| Red Offset X | Float | -50.0 | 50.0 | -5.0 | Red channel horizontal displacement |
| Red Offset Y | Float | -50.0 | 50.0 | 0.0 | Red channel vertical displacement |
| Green Offset X | Float | -50.0 | 50.0 | 0.0 | Green channel horizontal displacement |
| Green Offset Y | Float | -50.0 | 50.0 | 0.0 | Green channel vertical displacement |
| Blue Offset X | Float | -50.0 | 50.0 | 5.0 | Blue channel horizontal displacement |
| Blue Offset Y | Float | -50.0 | 50.0 | 0.0 | Blue channel vertical displacement |
| Animation | Enum | — | — | Pulse | None / Pulse / Random / Oscillate |
| Trigger | Enum | — | — | Beat | When the split activates |
| Blend | Enum | — | — | Add | Add / Screen / Normal |

**Typical Use Cases:** Digital chaos, energy, drops, transitions  
**Recommended Genres:** Phonk, EDM, Dubstep, Glitchcore, Cyberpunk  
**Recommended Combinations:** RGB Split + Block Glitch + Camera Shake  
**Pro Tip:** Keep intensity low (10-15) for subtle cinematic chromatic aberration. Use 50+ for aggressive glitch.

#### Block Glitch — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 35.0 | Overall strength |
| Block Size | Float | 5.0 | 200.0 | 40.0 | Average size of displaced blocks in pixels |
| Block Count | Int | 1 | 50 | 8 | Number of simultaneous displaced blocks |
| Displacement | Float | 0.0 | 200.0 | 30.0 | How far blocks shift from original position |
| Duration | Float | 0.01 | 1.0 | 0.1 | Seconds each glitch frame persists |
| Color Shift | Bool | — | — | true | Whether blocks also shift in color |
| Trigger | Enum | — | — | Beat | When glitch fires |
| Probability | Float | 0.0 | 100.0 | 60.0 | Chance of glitch occurring on each trigger |

**Typical Use Cases:** Digital corruption, transitions, beat emphasis  
**Recommended Genres:** Phonk, Trap, EDM, Cyberpunk, Horror  

#### Data Mosh — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 40.0 | Severity of the mosh |
| Mode | Enum | — | — | I-Frame Remove | I-Frame Remove / P-Frame Repeat / Pixel Bleed |
| Bloom | Float | 0.0 | 100.0 | 20.0 | Pixel smearing bloom amount |
| Decay | Float | 0.0 | 5.0 | 1.0 | Seconds for mosh to fade after trigger |
| Trigger | Enum | — | — | Drop | When data mosh activates |
| Frame Hold | Int | 1 | 30 | 3 | Number of frames to hold the corrupted state |

**Typical Use Cases:** Artistic glitch, music video transitions  
**Recommended Genres:** EDM, Dubstep, Experimental, Glitchcore  
**Pro Tip:** Very performance-heavy. Use sparingly and only on drops/transitions.

---

### CATEGORY 05: LENS FX 🔍

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Chromatic Aberration** | Color fringing at image edges, simulating imperfect lens optics. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Barrel Distortion** | Bows the image outward (fish-eye) or inward (pincushion). | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Lens Flare** | Simulates light scattering through multi-element lens systems. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 4 | **Bokeh** | Renders out-of-focus highlights as shaped discs (circle, hexagon, star). | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Anamorphic Streak** | Horizontal streaks from bright highlights, simulating anamorphic glass. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 6 | **Prism** | Rainbow refraction splitting at frame edges. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Chromatic Aberration — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 20.0 | Overall aberration strength |
| Radial | Bool | — | — | true | Aberration increases from center to edges |
| Direction | Enum | — | — | Radial | Radial / Horizontal / Vertical / Custom Angle |
| Custom Angle | Float | 0.0 | 360.0 | 0.0 | Direction if Direction = Custom Angle |
| Red Shift | Float | -20.0 | 20.0 | 2.0 | Red channel displacement |
| Blue Shift | Float | -20.0 | 20.0 | -2.0 | Blue channel displacement |
| Trigger | Enum | — | — | Always On | When the effect activates |
| Beat Pulse | Bool | — | — | false | Pulse intensity on beat |
| Pulse Amount | Float | 0.0 | 50.0 | 15.0 | Additional intensity on pulse |

**Typical Use Cases:** Cinematic style, imperfect lens look, subtle energy  
**Recommended Genres:** Cinematic, Synthwave, Cyberpunk, Phonk, All  
**Pro Tip:** Subtle (5-15) for cinematic polish. Heavy (40+) for glitch/cyberpunk.

---

### CATEGORY 06: LIGHTING FX 💡

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Glow** | Adds a soft luminous aura around bright areas. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Bloom** | High-quality multi-pass glow with threshold, creating a dreamy look. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 3 | **God Rays** | Volumetric light rays emanating from a bright source point. | High | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Strobe** | Rapid on/off flash effect, simulating club lighting. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Neon Glow** | Glow specifically tuned for neon-colored elements — saturated, vibrant. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 6 | **Light Sweep** | A beam of light sweeps across the frame directionally. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 7 | **Flash** | Full-frame brightness flash — white, colored, or gradient. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

#### Bloom — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 40.0 | Overall bloom brightness |
| Threshold | Float | 0.0 | 1.0 | 0.7 | Luminance value above which pixels bloom |
| Radius | Float | 1.0 | 50.0 | 15.0 | How far the bloom extends from bright areas |
| Softness | Float | 0.0 | 1.0 | 0.8 | How diffused the bloom edges are |
| Color | Color | — | — | #FFFFFF | Bloom tint color |
| Passes | Int | 1 | 8 | 4 | Number of blur passes (quality vs performance) |
| Blend Mode | Enum | — | — | Add | Add / Screen / Soft Light |
| Trigger | Enum | — | — | Always On | When bloom activates |
| Beat React | Bool | — | — | false | Pulse bloom intensity on beat |

**Typical Use Cases:** Dreamy atmosphere, neon scenes, magical moments  
**Recommended Genres:** Synthwave, K-Pop, Pop, Ambient, Worship  
**Recommended Combinations:** Bloom + Neon Glow + Chromatic Aberration  

#### Strobe — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Frequency | Float | 0.5 | 30.0 | 8.0 | Flashes per second |
| Intensity | Float | 0.0 | 100.0 | 80.0 | Maximum brightness of the flash |
| Color | Color | — | — | #FFFFFF | Flash color |
| Duty Cycle | Float | 0.05 | 0.95 | 0.2 | Ratio of "on" time vs "off" time per cycle |
| Sync to Beat | Bool | — | — | true | Sync flashes to detected beats |
| Epilepsy Safe | Bool | — | — | true | Limits maximum flash rate to safe levels |
| Trigger | Enum | — | — | Beat | When strobe fires |

**Typical Use Cases:** Club visuals, EDM drops, concert simulation  
**Recommended Genres:** EDM, Techno, Trance, House, Dubstep  

> ⚠️ **SAFETY NOTE:** Strobe effect MUST include an epilepsy safety toggle. When enabled, maximum flash rate is capped at 3Hz and intensity cannot exceed 70%.

---

### CATEGORY 07: PARTICLE FX ✨

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Confetti** | Colorful paper/metallic shards falling or exploding from a point. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 2 | **Rain** | Falling water droplets with configurable density, angle, and speed. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Snow** | Gentle falling snowflakes with drift and rotation. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Sparks** | Bright point particles that radiate outward and fade. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 5 | **Smoke / Fog** | Volumetric haze particles that drift and dissipate. | High | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 6 | **Fireflies** | Small glowing particles that float, drift, and pulse organically. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 7 | **Bubbles** | Translucent spheres that rise and pop. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 8 | **Star Field** | Cosmic star particles creating a flying-through-space effect. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Confetti — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Emission Rate | Float | 1.0 | 500.0 | 100.0 | Particles emitted per second |
| Lifetime | Float | 0.5 | 10.0 | 3.0 | Seconds each particle lives |
| Size | Float | 2.0 | 30.0 | 8.0 | Particle size in pixels |
| Size Variation | Float | 0.0 | 100.0 | 50.0 | Random size variance |
| Gravity | Float | -100.0 | 100.0 | 50.0 | Downward pull (negative = upward) |
| Wind | Float | -100.0 | 100.0 | 10.0 | Horizontal drift |
| Rotation Speed | Float | 0.0 | 360.0 | 90.0 | Spin speed of individual particles |
| Colors | Color[] | — | — | Rainbow | Array of colors to randomly assign |
| Shape | Enum | — | — | Rectangle | Rectangle / Circle / Star / Heart / Custom |
| Emission Point | Enum | — | — | Top | Top / Center / Bottom / Sides / Burst Point |
| Burst Count | Int | 0 | 200 | 50 | Particles in a single burst (0 = continuous) |
| Trigger | Enum | — | — | Beat | When particles spawn |

**Typical Use Cases:** Celebration, drops, transitions, festive mood  
**Recommended Genres:** Pop, K-Pop, Kids, Worship, EDM  

---

### CATEGORY 08: DISTORTION FX 🌀

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Wave** | Sinusoidal distortion creating a wavy, underwater feel. | Low | GPU | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| 2 | **Ripple** | Concentric ring distortion emanating from a point, like a stone in water. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 3 | **Twirl** | Spiraling distortion rotating pixels around a center point. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Shear** | Horizontal or vertical sliding distortion along scan lines. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 5 | **Kaleidoscope** | Mirrors and rotates segments of the image into symmetric patterns. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 6 | **Mirror** | Reflects image along a configurable axis (horizontal, vertical, quad). | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 7 | **Spherize** | Warps image as if wrapped around a sphere or bubble. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Wave — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Amplitude | Float | 0.0 | 100.0 | 20.0 | Height of waves in pixels |
| Frequency | Float | 0.1 | 20.0 | 3.0 | Number of wave cycles across the frame |
| Speed | Float | 0.0 | 10.0 | 1.0 | How fast waves animate |
| Direction | Enum | — | — | Horizontal | Horizontal / Vertical / Both / Radial |
| Phase | Float | 0.0 | 360.0 | 0.0 | Starting phase offset |
| Damping | Float | 0.0 | 1.0 | 0.0 | Reduces wave intensity from center outward |
| Trigger | Enum | — | — | Always On | When the wave distortion is active |
| Beat Sync | Bool | — | — | false | Sync wave phase to beat |

**Typical Use Cases:** Underwater scenes, psychedelic visuals, dreamy transitions  
**Recommended Genres:** Ambient, Meditation, Psychedelic, Lo-fi  

---

### CATEGORY 09: BLUR FX 🌫️

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Gaussian Blur** | Standard multi-directional blur with configurable radius. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Motion Blur** | Directional blur simulating fast movement. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 3 | **Radial Blur** | Blur radiating from a center point, simulating zoom or spin. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Directional Blur** | Blur along a specific angle. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 5 | **Tilt-Shift** | Selective focus blur simulating miniature/diorama photography. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 6 | **Depth Blur** | Blur based on estimated depth — background blur while keeping foreground sharp. | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Radial Blur — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Intensity | Float | 0.0 | 100.0 | 30.0 | Blur strength |
| Type | Enum | — | — | Zoom | Zoom (zoom blur) / Spin (rotational blur) |
| Center X | Float | 0.0 | 1.0 | 0.5 | Center of blur effect |
| Center Y | Float | 0.0 | 1.0 | 0.5 | Center of blur effect |
| Quality | Int | 4 | 32 | 16 | Number of samples (more = smoother, slower) |
| Trigger | Enum | — | — | Beat | When blur activates |
| Duration | Float | 0.05 | 2.0 | 0.3 | Seconds the blur persists after trigger |

**Typical Use Cases:** Speed emphasis, drop impact, warp transitions  
**Recommended Genres:** EDM, Dubstep, Phonk, Trap  

---

### CATEGORY 10: STYLIZE FX 🖼️

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Halftone** | Converts image to dot pattern simulating newspaper/comic print. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | **Comic Book** | Bold outlines + flat color fills, simulating comic/manga style. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Sketch** | Edge detection that renders the scene as pencil or ink lines. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Oil Paint** | Smoothing + edge preservation creating an oil painting look. | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Mosaic / Pixelate** | Reduces resolution to large pixel blocks. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 6 | **Neon Outline** | Glowing neon edges on detected contours. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### CATEGORY 11: BEAT FX 🥁

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Beat Zoom** | Punchy zoom pulse on each beat detection. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Beat Flash** | Brief full-frame brightness flash on beat. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Beat Pulse** | Rhythmic expansion/contraction of the entire frame. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 4 | **Beat Shake** | Camera shake triggered only on beat transients. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 5 | **Beat Wipe** | Directional wipe that reveals/conceals on each beat. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Note:** Beat FX are simplified, preset versions of Camera/Lighting effects. They exist for quick one-click application. Power users should use the full Camera FX / Lighting FX for fine control.

---

### CATEGORY 12: POST PROCESSING 🔧

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Sharpen** | Enhances edge detail and clarity. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Denoise** | Temporal and spatial noise reduction. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Anti-Alias** | Smooths jagged edges (FXAA, SMAA). | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Tone Map** | HDR to SDR mapping with configurable curves. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Dither** | Reduces banding in gradients via ordered or error-diffusion dithering. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 6 | **LUT Apply** | Applies external .cube or .3dl LUT files for custom grading. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### CATEGORY 13: TRANSITION FX 🔄

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Dissolve** | Smooth opacity crossfade between two states. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | **Wipe** | Directional reveal — left, right, top, bottom, radial. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Slide** | Content slides in/out from a direction. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Zoom Transition** | Zooms into center then reveals next state. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Glitch Cut** | Abrupt cut with glitch artifacts between states. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 6 | **Flash Transition** | White or colored flash between states. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 7 | **Morph** | Organic morphing/melting between two states. | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 8 | **Shatter** | Frame shatters into pieces that fly away to reveal next state. | High | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### CATEGORY 14: ENVIRONMENTAL FX 🌍

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Fog** | Atmospheric haze that reduces contrast and adds depth. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Heat Haze** | Shimmering refraction simulating hot air rising. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Underwater** | Blue-green tint + wave distortion + caustic light patterns. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Aurora** | Colorful shimmering bands of light across the sky area. | High | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Lightning** | Branching electrical discharges with flash. | Medium | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| 6 | **Wind Lines** | Speed lines indicating wind direction and force. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### CATEGORY 15: ATMOSPHERIC FX 🌌

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Volumetric Light Rays** | Simulates sunlight streaming through openings. | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | **Dust Motes** | Floating illuminated particles drifting in light beams. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 3 | **Lens Condensation** | Moisture/fog on the camera lens that clears and reforms. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Breath Fog** | Cold-weather breath vapor effect at bottom of frame. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Haze** | Uniform atmospheric haze reducing overall contrast. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### CATEGORY 16: MOTION FX 🏃

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Motion Trail** | Ghostly afterimages following moving elements. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Echo** | Repeating delayed copies of the frame at decreasing opacity. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Speed Lines** | Manga/anime-style converging lines indicating motion. | Low | GPU | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| 4 | **Motion Smear** | Directional pixel stretching based on detected motion. | High | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Time Stretch** | Slow-motion or speed-ramp effect on visual elements. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### CATEGORY 17: GEOMETRY FX 📐

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Tile** | Repeats the frame in a grid pattern. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Fractal Mirror** | Creates infinite mirror tunnel/fractal recursion. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Symmetry** | Real-time bilateral or quadrilateral symmetry. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 4 | **Voronoi** | Generates Voronoi cell patterns overlaid on or compositing the image. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Tessellation** | Breaks image into geometric tiles (triangle, hexagon). | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### CATEGORY 18: AUDIO REACTIVE FX 🎵

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Spectrum Map** | Maps audio frequency data to visual parameters (color, displacement). | Medium | GPU+CPU | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 2 | **Waveform Overlay** | Renders the audio waveform directly on the frame. | Low | GPU+CPU | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 3 | **Frequency Heatmap** | Maps spectral data to color intensity across the frame. | Medium | GPU+CPU | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 4 | **Amplitude Pulse** | Global visual pulse (brightness, scale, color) driven by amplitude. | Low | GPU+CPU | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 5 | **Harmonic Rings** | Concentric rings that pulse based on harmonic analysis. | Medium | GPU+CPU | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

### CATEGORY 19: ADVANCED FX 🧪

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Chroma Key** | Remove a specific color (green/blue screen). | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | **Mask** | Region-based effect application via shapes or luma/alpha masks. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 3 | **Blend Modes** | Layer compositing modes — Multiply, Screen, Overlay, etc. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 4 | **Depth Map** | Estimated depth for parallax, focus, or 3D effects. | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Displacement** | Uses a map texture to displace pixels. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

### CATEGORY 20: EXPERIMENTAL FX 🔬

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **AI Style Transfer** | Applies artistic style from reference images using neural networks. | Very High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | **Neural Glow** | AI-enhanced glow that intelligently identifies and illuminates subjects. | High | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **Procedural Texture** | Generated textures (marble, wood, fabric) overlaid on content. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 4 | **Reaction-Diffusion** | Organic patterns (Turing patterns) that evolve and react to audio. | High | GPU | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

---

### CATEGORY 21: TEXT FX 🔤

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **Text Glow** | Adds luminous glow around text elements. | Low | GPU | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 2 | **Text Shadow** | Drop shadow or multi-layered shadow behind text. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| 3 | **Text Stroke Anim** | Animated outline that draws/erases around text characters. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Kinetic Type** | Physics-based text animation — bounce, shake, wave, explode. | Medium | GPU+CPU | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### CATEGORY 22: RETRO FX 📼

| # | Effect Name | Description | Performance | GPU/CPU | Beat? | Bass? | Vocal? | Freq? | Stackable? | Multi-Instance? |
|---|-------------|-------------|-------------|---------|-------|-------|--------|-------|------------|-----------------|
| 1 | **VHS** | Complete VHS simulation — tracking lines, color bleeding, noise, warp. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2 | **CRT Monitor** | Scanlines + curvature + RGB subpixels + glow bleed. | Medium | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 3 | **8-Bit / Pixel Art** | Extreme pixelation + limited palette simulating retro game consoles. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 4 | **Analog TV** | Static, channel switching, horizontal hold issues, test patterns. | Medium | GPU | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 5 | **Cassette Tape** | Audio-visual warble, wow/flutter visual equivalent, warm tone. | Low | GPU | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### VHS — Full Parameter Specification

| Parameter | Type | Min | Max | Default | Description |
|-----------|------|-----|-----|---------|-------------|
| Tracking Noise | Float | 0.0 | 100.0 | 40.0 | Intensity of horizontal tracking lines |
| Color Bleed | Float | 0.0 | 100.0 | 30.0 | Chroma channel misalignment |
| Head Switching | Float | 0.0 | 100.0 | 20.0 | Bottom-of-frame noise bar |
| Tape Warble | Float | 0.0 | 100.0 | 15.0 | Horizontal jitter from tape stretch |
| Static Noise | Float | 0.0 | 100.0 | 10.0 | Random pixel noise |
| Date Stamp | Bool | — | — | false | Show "REC" and fake date/time overlay |
| Quality | Enum | — | — | SP | SP (Standard Play) / LP (Long Play) / EP (Extended Play) |
| Trigger | Enum | — | — | Always On | When the VHS effect is active |

**Typical Use Cases:** Retro aesthetics, nostalgic mood, vaporwave  
**Recommended Genres:** Vaporwave, Lo-fi, Retro, Synthwave, Hip-Hop  
**Recommended Combinations:** VHS + Warm Grade + Film Grain + CRT  

---

# 3. UNIVERSAL PARAMETER SYSTEM

## 3.1 Parameter Types

Every adjustable parameter in the FX Engine conforms to one of these types:

| Type | Description | UI Widget | Example |
|------|-------------|-----------|---------|
| **Float** | Continuous numeric value with min/max/default | Slider + Number Input | Intensity: 0.0 — 100.0 |
| **Int** | Discrete integer value | Slider + Number Input | Passes: 1 — 8 |
| **Bool** | True/False toggle | Toggle Switch | Beat React: On/Off |
| **Enum** | Select from predefined options | Dropdown / Pill Buttons | Mode: Light / Heavy |
| **Color** | RGBA color value | Color Picker | Tint Color: #FF8844 |
| **Color[]** | Array of colors | Multi-Color Picker | Palette: [#FF0000, #00FF00] |
| **Vec2** | Two-component vector | XY Pad / Dual Sliders | Center: (0.5, 0.5) |
| **Curve** | Bezier curve / envelope | Curve Editor | Response Curve |
| **File** | External file reference | File Picker | LUT File: custom.cube |

## 3.2 Universal Meta-Parameters

Every effect instance (regardless of type) also exposes these meta-parameters:

| Meta-Parameter | Type | Default | Description |
|----------------|------|---------|-------------|
| **Enabled** | Bool | true | Master on/off switch for this effect instance |
| **Mix / Dry-Wet** | Float (0–100) | 100 | Blend between processed and original |
| **Solo** | Bool | false | Disable all other effects, show only this one |
| **Bypass** | Bool | false | Temporarily skip this effect (different from Enabled — preserves GPU allocation) |
| **GPU Priority** | Enum | Normal | Low / Normal / High — affects resource allocation |
| **Label** | String | Auto | User-defined name for this instance |
| **Color Tag** | Color | None | Visual tag for organizing in the FX Stack |

## 3.3 Animation System

Any Float, Int, Color, or Vec2 parameter can be animated via:

| Animation Type | Description |
|----------------|-------------|
| **Static** | Fixed value, no animation |
| **Keyframe** | Manual keyframes on timeline with interpolation curves |
| **Trigger-Driven** | Value changes in response to audio triggers |
| **Modulation** | Value oscillates via LFO, noise, or other modulation sources |
| **Expression** | Simple math expression linking to other parameters |
| **Audio Map** | Direct mapping from audio frequency/amplitude to value |

---

# 4. TRIGGER SYSTEM

## 4.1 Trigger Architecture

The Trigger System is the bridge between audio analysis and visual response. Every audio-reactive parameter connects to the Trigger Dispatcher.

```
┌──────────────────────┐
│    AUDIO INPUT        │
│    (WAV/MP3/OGG)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   AUDIO ANALYZER     │
│                      │
│  ┌─────────────────┐ │
│  │ FFT Engine       │ │ → Frequency spectrum (0-22kHz)
│  │ 2048/4096 bins   │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │ Onset Detector   │ │ → Beat/Transient timing
│  │ Multi-band       │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │ Pitch Tracker    │ │ → Fundamental frequency, melody
│  │                  │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │ Energy Tracker   │ │ → RMS energy, loudness
│  │                  │ │
│  └─────────────────┘ │
│  ┌─────────────────┐ │
│  │ Spectral Analyzer│ │ → Centroid, spread, rolloff
│  │                  │ │
│  └─────────────────┘ │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  TRIGGER DISPATCHER  │
│                      │
│  Routes analyzed     │
│  signals to the      │
│  appropriate FX      │
│  parameters.         │
└──────────────────────┘
```

## 4.2 Complete Trigger Types

| # | Trigger | Source | Description | Reactivity | Use Cases |
|---|---------|--------|-------------|------------|-----------|
| 1 | **Always On** | None | Effect runs continuously, no trigger needed | Constant | Vignette, color grade, grain |
| 2 | **Beat** | Onset Detector | Fires on every detected beat (any instrument) | Fast | Beat zoom, flash, shake |
| 3 | **Kick** | Low-Freq Onset | Fires specifically on kick drum transients (20-150Hz) | Fast | Bass-heavy effects, camera shake |
| 4 | **Snare** | Mid-Freq Onset | Fires on snare/clap transients (150-500Hz) | Fast | Flash, glitch, transition |
| 5 | **Hi-Hat** | High-Freq Onset | Fires on hi-hat/cymbal transients (5kHz+) | Very Fast | Subtle flicker, sparkle |
| 6 | **Bass** | Low Band Energy | Responds to sustained bass energy, not just transients | Smooth | Bloom pulse, color warmth |
| 7 | **Treble** | High Band Energy | Responds to sustained high-frequency energy | Smooth | Brightness, sharpness |
| 8 | **Mid** | Mid Band Energy | Responds to mid-range frequency energy | Smooth | Saturation, contrast |
| 9 | **Vocal** | Pitch/Formant | Responds to detected vocal frequencies (85-1100Hz + formants) | Medium | Vocal emphasis effects |
| 10 | **Drop** | Energy Delta | Fires when audio energy spikes after a quiet section | Rare | Maximum impact effects |
| 11 | **Chorus** | Section Detect | Fires during detected chorus sections | Section | Color changes, intensity boost |
| 12 | **Silence** | Energy Threshold | Fires during near-silence or very quiet sections | Rare | Fade effects, atmospheric |
| 13 | **Random** | PRNG | Fires at random intervals within configurable bounds | Variable | Glitch, unexpected events |
| 14 | **Timeline Marker** | User Input | Fires at user-placed markers on the timeline | Precise | Choreographed moments |
| 15 | **Every X Seconds** | Timer | Fires at fixed time intervals | Periodic | Regular pulse, cycling |
| 16 | **Manual Keyframe** | Keyframe | User-animated trigger curve on timeline | Precise | Custom choreography |
| 17 | **Amplitude Threshold** | RMS | Fires when audio exceeds a configurable dB threshold | Reactive | Loudness-based effects |
| 18 | **Frequency Threshold** | FFT Bin | Fires when a specific frequency band exceeds threshold | Reactive | Targeted frequency response |
| 19 | **Energy Burst** | Energy Delta | Fires on any sudden energy increase (broader than Drop) | Reactive | General impact effects |
| 20 | **Peak Detection** | Waveform | Fires at local amplitude peaks in the waveform | Fast | Precise rhythmic sync |
| 21 | **Combo (AND)** | Multiple | Fires only when two or more triggers fire simultaneously | Complex | Snare AND Bass = heavy drop |
| 22 | **Combo (OR)** | Multiple | Fires when any of the configured triggers fire | Complex | Multiple rhythmic sources |

## 4.3 Trigger Parameters

Every trigger instance exposes:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Sensitivity | Float (0–100) | 50 | How easily the trigger fires |
| Cooldown | Float (0–5s) | 0.1 | Minimum time between firings |
| Attack | Float (0–1s) | 0.05 | Rise time from 0 to peak |
| Hold | Float (0–5s) | 0.0 | Time at peak before decay begins |
| Decay | Float (0–5s) | 0.3 | Fall time from peak to 0 |
| Threshold | Float (0–100) | 30 | Minimum signal level to fire |
| Smoothing | Float (0–1) | 0.3 | Temporal smoothing of trigger signal |
| Invert | Bool | false | Fires when trigger is NOT active |

---

# 5. MODULATION SYSTEM

## 5.1 Modulation Architecture

Modulation allows any parameter to oscillate, randomize, or evolve over time — independent of audio triggers.

```
┌──────────────────────────────────────────────────────┐
│                  MODULATION SOURCES                   │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐│
│  │  LFO   │ │ Noise  │ │Envelope│ │ Audio Energy   ││
│  └───┬────┘ └───┬────┘ └───┬────┘ └───────┬────────┘│
│      │          │          │              │          │
│      ▼          ▼          ▼              ▼          │
│  ┌──────────────────────────────────────────────────┐│
│  │            MODULATION MATRIX                     ││
│  │                                                  ││
│  │  Source → Amount → Target Parameter              ││
│  │  Source → Amount → Target Parameter              ││
│  │  Source → Amount → Target Parameter              ││
│  │  (Any source can modulate any parameter)         ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

## 5.2 Complete Modulation Types

| # | Modulator | Waveform | Description | Best For |
|---|-----------|----------|-------------|----------|
| 1 | **LFO (Sine)** | ∿ | Smooth oscillation | Gentle pulsing, breathing |
| 2 | **LFO (Triangle)** | △ | Linear ramp up and down | Mechanical sweeps |
| 3 | **LFO (Square/Pulse)** | □ | Instant on/off switching | Strobe, hard cuts |
| 4 | **LFO (Sawtooth)** | ╱ | Linear ramp up, instant drop | Building tension |
| 5 | **Random (Uniform)** | ⚄ | Pure random values each frame | Chaos, glitch |
| 6 | **Random (Smooth)** | ~ | Interpolated random (S&H) | Organic drift |
| 7 | **Perlin Noise** | ≈ | Smooth procedural noise | Natural movement |
| 8 | **Simplex Noise** | ≈ | Perlin variant, fewer artifacts | Smoother natural movement |
| 9 | **Spring** | 🔄 | Physics spring dynamics — overshoot + settle | Bouncy reactions |
| 10 | **Elastic** | 🏸 | Spring with stronger overshoot and oscillation | Energetic impacts |
| 11 | **Envelope (ADSR)** | 📐 | Attack-Decay-Sustain-Release envelope | Shaped responses |
| 12 | **Audio Energy** | 🔊 | Direct mapping from audio RMS to parameter | Responsive visuals |
| 13 | **Audio Frequency** | 🎵 | Maps a specific frequency band to parameter | Spectral response |
| 14 | **Velocity** | 🏃 | Rate of change of another parameter | Motion-dependent effects |
| 15 | **Step Sequence** | ▪▫▪▫ | User-defined step pattern (like a sequencer) | Rhythmic patterns |

## 5.3 Modulation Slot Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Source | Enum | LFO Sine | Which modulation type |
| Target | Parameter Ref | None | Which effect parameter to modulate |
| Amount | Float (-100 to 100) | 50 | Modulation depth (negative = inverted) |
| Rate | Float (0.01–50 Hz) | 1.0 | Speed of modulation (for LFO types) |
| Phase | Float (0–360°) | 0 | Starting phase offset |
| Offset | Float (-100 to 100) | 0 | DC offset added to modulation |
| Clamp Min | Float | Parameter Min | Lower bound for modulated value |
| Clamp Max | Float | Parameter Max | Upper bound for modulated value |
| Sync to BPM | Bool | false | Lock modulation rate to track tempo |
| BPM Division | Enum | 1/4 | Note value for BPM sync (1/1, 1/2, 1/4, 1/8, 1/16) |

---

# 6. FX STACK & RENDER ORDER

## 6.1 Default Render Pipeline

The order in which effects process matters enormously. Applying bloom before color grading produces different results than color grading before bloom.

```
INPUT (Visualizer + Background + Overlays composited)
  │
  ▼
┌─────────────────────────────────┐
│ STAGE 1: GEOMETRY               │  Tile, Mirror, Kaleidoscope, Symmetry
│ (Spatial transforms first —     │
│  everything else operates on    │
│  the transformed geometry)      │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 2: CAMERA                 │  Shake, Zoom, Pan, Orbit, Dolly
│ (Virtual camera moves applied   │
│  before any image processing)   │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 3: DISTORTION             │  Wave, Ripple, Twirl, Spherize
│ (Pixel displacement before      │
│  lighting/color so displaced    │
│  pixels get correct treatment)  │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 4: PARTICLES              │  Confetti, Rain, Snow, Sparks, Smoke
│ (Particles composited before    │
│  lighting so they receive       │
│  bloom and glow correctly)      │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 5: LIGHTING               │  Glow, Bloom, God Rays, Neon, Flare
│ (Light effects applied to the   │
│  complete scene including       │
│  particles)                     │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 6: GLITCH                 │  RGB Split, Block Glitch, Data Mosh
│ (Digital artifacts applied      │
│  after lighting for maximum     │
│  visibility of the corruption)  │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 7: BLUR                   │  Gaussian, Motion, Radial, Tilt-Shift
│ (Blur softens everything        │
│  including glitch artifacts,    │
│  creating cohesion)             │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 8: FILM                   │  Grain, Dust, Vignette, Light Leak
│ (Analog simulation applied      │
│  near the end so grain sits     │
│  on top of everything)          │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 9: COLOR                  │  Grade, Hue, Saturation, Contrast
│ (Color grading is SECOND-TO-   │
│  LAST so it affects the final   │
│  look of all preceding effects) │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│ STAGE 10: POST PROCESSING       │  Sharpen, Denoise, Dither, LUT
│ (Final cleanup and output       │
│  preparation — always last)     │
└──────────────┬──────────────────┘
               ▼
OUTPUT FRAME
```

## 6.2 Why This Order?

| Stage | Rationale |
|-------|-----------|
| **Geometry First** | Spatial transforms like Tile and Mirror must happen on clean input. If you tile after bloom, you'd see bloom edges at tile boundaries. |
| **Camera Before Image** | Camera shake displaces the viewport. All subsequent effects must process the shaken frame, not the stable one. |
| **Distortion Before Lighting** | If you distort after bloom, the bloom halos wouldn't follow the distortion. By distorting first, bloom wraps around distorted geometry correctly. |
| **Particles Before Lighting** | Particles should receive bloom and glow. A glowing particle looks natural. A particle on top of bloom looks pasted on. |
| **Lighting Before Glitch** | Glitch effects should corrupt the lit scene. Glitching before bloom would produce soft, pretty glitches — the opposite of the intended effect. |
| **Blur After Glitch** | A slight blur after glitch effects integrates the hard digital artifacts into the scene, preventing them from feeling disconnected. |
| **Film Near End** | Grain and dust are physical properties of the display medium. They sit on top of everything, just as real film grain sits on top of the photographed scene. |
| **Color Second-to-Last** | Color grading defines the final emotional tone. It must see the complete processed image to make consistent color decisions. |
| **Post Processing Last** | Sharpening, denoising, and output preparation must be the absolute last step to ensure the final frame is clean and delivery-ready. |

## 6.3 User Customization

While the default order is optimized, **advanced users can reorder effects within each stage** and even **move effects between stages**. A warning icon appears when an effect is placed outside its recommended stage.

---

# 7. COLOR GRADING SYSTEM

## 7.1 Built-in LUT Styles

| # | Style | Temperature | Saturation | Contrast | Shadows | Highlights | Mood | Visual Description |
|---|-------|-------------|------------|----------|---------|------------|------|--------------------|
| 1 | **Neutral** | 0 | 0 | 0 | 0 | 0 | Baseline | No grading — clean, as-is |
| 2 | **Warm** | +35 | +10 | +5 | Orange +15 | Golden +10 | Cozy, nostalgic | Amber/golden cast, gentle warmth |
| 3 | **Cold** | -30 | -5 | +10 | Blue +20 | Cyan +10 | Isolating, clinical | Blue steel tones, desaturated |
| 4 | **Vintage** | +20 | -20 | -10 | Lifted +25 | Rolled -15 | Nostalgic, faded | Lifted blacks, faded colors, warm bias |
| 5 | **Noir** | -10 | -80 | +40 | Crushed -20 | High +20 | Dramatic, mysterious | Near-monochrome, extreme contrast |
| 6 | **Teal-Orange** | 0 | +15 | +15 | Teal +30 | Orange +30 | Cinematic, Hollywood | Complementary color split — teal shadows, orange highlights |
| 7 | **Film — Kodak** | +15 | +5 | +5 | Warm +10 | Warm +5 | Classic, natural | Emulates Kodak Vision3 film stock warmth |
| 8 | **Film — Fuji** | -5 | +10 | +5 | Green +10 | Cool +5 | Fresh, airy | Emulates Fuji film — slightly cooler, green-shifted |
| 9 | **CineStill 800T** | -15 | +20 | +10 | Blue +15 | Halation glow | Night, neon | Tungsten-balanced with neon halation |
| 10 | **Cyberpunk** | -20 | +40 | +25 | Deep purple +30 | Neon pink +25 | Futuristic, electric | Saturated neons, deep blacks, purple-pink cast |
| 11 | **Neon** | -10 | +60 | +20 | Black -10 | Vivid +30 | Vibrant, intense | Maximum color intensity, glowing brights |
| 12 | **Monochrome** | 0 | -100 | +15 | 0 | 0 | Timeless, dramatic | Complete desaturation |
| 13 | **Sepia** | +40 | -70 | +5 | Brown +30 | Cream +20 | Antique, aged | Brown-tinted monochrome |
| 14 | **HDR** | 0 | +15 | +35 | Lifted +15 | Extended +20 | Hyperreal, vivid | Wide dynamic range simulation |
| 15 | **Pastel** | +10 | -30 | -15 | Lifted +20 | Soft +15 | Dreamy, gentle | Washed-out, low-contrast, light colors |
| 16 | **Dream** | +15 | -15 | -20 | Lifted +30 | Bloomed +20 | Ethereal, surreal | Heavy bloom, lifted shadows, soft focus feel |
| 17 | **Moody** | -15 | -10 | +20 | Crushed -10 | Muted -10 | Dark, brooding | Desaturated with heavy shadows |
| 18 | **Golden Hour** | +45 | +15 | -5 | Warm +20 | Golden +30 | Magical, romantic | Rich golden tones, soft contrast |
| 19 | **Night City** | -25 | +25 | +30 | Deep blue -20 | Neon +20 | Urban, electric | Deep blue-black shadows, vivid artificial lights |
| 20 | **Synthwave** | -15 | +30 | +15 | Magenta +25 | Cyan +20 | Retro-futuristic | Pink-purple-cyan color palette |
| 21 | **Bleach Bypass** | -5 | -30 | +35 | Metallic +10 | Silver +15 | Gritty, war-film | Desaturated + high contrast + silver overlay |
| 22 | **Orange & Teal Alt** | 0 | +10 | +10 | Deep teal +35 | Burnt orange +35 | Blockbuster | More aggressive teal-orange split |
| 23 | **Candlelight** | +50 | -5 | -10 | Deep amber +25 | Soft gold +20 | Intimate, sacred | Extreme warm cast with soft falloff |
| 24 | **Moonlight** | -35 | -15 | +5 | Blue-silver +20 | Cool white +15 | Serene, cold | Blue-silver nighttime simulation |
| 25 | **Apocalyptic** | +5 | -40 | +25 | Green-grey +15 | Blown +10 | Desolate, hopeless | Desaturated with slight green-yellow sickness |

## 7.2 Advanced Color Tools

Beyond LUT presets, professional users have access to:

| Tool | Description |
|------|-------------|
| **Curves** | RGB and Luma curve editor with control points |
| **Color Wheels** | Lift / Gamma / Gain three-way color wheels (DaVinci-style) |
| **HSL Qualifier** | Select and adjust specific hue/saturation/luminance ranges |
| **Skin Tone Protection** | Automatically protects skin tones when adjusting saturation |
| **Secondary Correction** | Isolate and grade specific color ranges independently |
| **Custom LUT Import** | Import .cube, .3dl, .lut files |
| **LUT Export** | Export current grade as a .cube file |

---

# 8. GENRE PRESET PACKS

## 8.1 Complete Genre Specifications

### PHONK

| Attribute | Value |
|-----------|-------|
| **Mood** | Aggressive, dark, menacing, underground |
| **Visual Identity** | Heavy contrast, dark shadows, red/purple accents, gritty |
| **Main Colors** | Deep red (#8B0000), Black (#0A0A0A), Purple (#4B0082), Crimson (#DC143C) |
| **Camera Motion** | Aggressive shake on kick, heavy beat zoom, slight dutch angle |
| **Color Grade** | Moody + high contrast + crushed blacks + red tint in shadows |
| **Recommended FX** | Camera Shake (55%), Beat Zoom (70%), Chromatic Aberration (30%), Film Grain (25%), VHS Tracking (15%), Vignette (60%) |
| **FX Strength** | 70-90% overall — intense |
| **Recommended Visualizers** | Bars (aggressive, red), Waveform (sharp), Circular (dark) |

### TRAP

| Attribute | Value |
|-----------|-------|
| **Mood** | Hard, bouncy, confident, street |
| **Visual Identity** | Dark backgrounds, neon accents, sharp contrasts, urban grit |
| **Main Colors** | Black (#000000), Neon Green (#39FF14), Gold (#FFD700), White (#FFFFFF) |
| **Camera Motion** | Beat zoom on kick + snare, moderate shake, hi-hat reactive flickers |
| **Color Grade** | High contrast + slight teal shadows + warm highlights |
| **Recommended FX** | Beat Zoom (60%), Camera Shake (40%), Glow (30%), Block Glitch (20% on drops), Strobe (on drops), Vignette (45%) |
| **FX Strength** | 60-80% — punchy but controlled |
| **Recommended Visualizers** | Bars (neon green), Circular (gold), Waveform |

### EDM / FUTURE BASS

| Attribute | Value |
|-----------|-------|
| **Mood** | Euphoric, energetic, colorful, uplifting |
| **Visual Identity** | Bright colors, rainbow gradients, explosive particles, clean bloom |
| **Main Colors** | Cyan (#00FFFF), Magenta (#FF00FF), Pink (#FF69B4), Electric Blue (#7DF9FF) |
| **Camera Motion** | Heavy beat zoom on drops, moderate shake, zoom transitions |
| **Color Grade** | Vibrant + high saturation + neon highlights + clean blacks |
| **Recommended FX** | Beat Zoom (75%), Bloom (50%), Confetti (on drops), Chromatic Aberration (25%), Color Pulse (40%), Radial Blur (on drops), Flash (on drops) |
| **FX Strength** | 80-100% — maximum energy |
| **Recommended Visualizers** | Circular (rainbow), Bars (gradient), Particle cloud |

### DUBSTEP

| Attribute | Value |
|-----------|-------|
| **Mood** | Chaotic, heavy, aggressive, mechanical |
| **Visual Identity** | Dark base, extreme glitch on drops, neon flashes, distortion |
| **Main Colors** | Deep Purple (#1A0033), Neon Green (#00FF41), Electric Blue (#0000FF), Black |
| **Camera Motion** | Extreme shake on bass, violent zoom on drops, calm on breakdowns |
| **Color Grade** | Dark + high contrast + neon tint + deep blacks |
| **Recommended FX** | Camera Shake (80%), Block Glitch (60% on drops), RGB Split (50%), Beat Zoom (70%), Strobe (on drops), Data Mosh (on drops), Radial Blur (40%) |
| **FX Strength** | 90-100% — absolute maximum |
| **Recommended Visualizers** | Bars (aggressive), Waveform (distorted), 3D shapes |

### HOUSE / TECHNO

| Attribute | Value |
|-----------|-------|
| **Mood** | Groovy, driving, hypnotic, underground |
| **Visual Identity** | Geometric patterns, clean lines, minimal color palette, subtle pulse |
| **Main Colors** | Dark Grey (#1A1A1A), Orange (#FF6600), Warm White (#FFF5E1), Teal (#008080) |
| **Camera Motion** | Subtle beat zoom on kick, gentle orbit, minimal shake |
| **Color Grade** | Warm + moderate contrast + slightly desaturated + orange tint |
| **Recommended FX** | Beat Zoom (30%), Bloom (25%), Vignette (40%), Scanline (15%), Glow (20%), Heat Haze (10%) |
| **FX Strength** | 30-50% — subtle, hypnotic |
| **Recommended Visualizers** | Geometric, Circular (minimal), Bars (clean) |

### SYNTHWAVE / RETROWAVE

| Attribute | Value |
|-----------|-------|
| **Mood** | Nostalgic, futuristic, dreamy, 80s |
| **Visual Identity** | Neon grid, sunset gradients, chrome, scanlines, VHS texture |
| **Main Colors** | Hot Pink (#FF1493), Cyan (#00FFFF), Purple (#9B30FF), Orange (#FF4500), Magenta (#FF00FF) |
| **Camera Motion** | Slow orbit, gentle breathing zoom, minimal shake |
| **Color Grade** | Synthwave (pink/cyan) + high saturation + warm midtones + bloom |
| **Recommended FX** | Scanline (35%), Bloom (50%), Chromatic Aberration (20%), VHS (15%), Neon Glow (40%), Film Grain (15%), Vignette (50%), CRT (optional 20%) |
| **FX Strength** | 50-70% — stylized but readable |
| **Recommended Visualizers** | Bars (neon gradient), Grid, Circular (neon) |

### LO-FI / CHILL HOP

| Attribute | Value |
|-----------|-------|
| **Mood** | Relaxed, cozy, nostalgic, mellow |
| **Visual Identity** | Warm tones, film grain, soft focus, vintage feel, handwritten aesthetic |
| **Main Colors** | Warm Beige (#F5E6CC), Soft Brown (#8B7355), Muted Orange (#CC8844), Cream (#FFFDD0) |
| **Camera Motion** | Very subtle breathing (amplitude 2%), slight drift, NO shake |
| **Color Grade** | Warm/Vintage + lifted blacks + low contrast + reduced saturation |
| **Recommended FX** | Film Grain (Kodak Tri-X, 35%), Dust & Scratches (20%), Vignette (45%), Warm Grade, Light Leak (15%), Breathing (2%), Gate Weave (5%) |
| **FX Strength** | 20-40% — gentle, never aggressive |
| **Recommended Visualizers** | Simple waveform, gentle bars, minimal circle |

### JAZZ

| Attribute | Value |
|-----------|-------|
| **Mood** | Sophisticated, smooth, intimate, late-night |
| **Visual Identity** | Dark lounge atmosphere, golden highlights, smoke, warm spotlights |
| **Main Colors** | Deep Blue (#0A0A30), Gold (#D4A574), Warm Black (#1A1005), Amber (#FFBF00) |
| **Camera Motion** | Very slow pan, no shake, occasional gentle rack focus |
| **Color Grade** | Candlelight/Golden Hour + high warmth + soft contrast + crushed blacks |
| **Recommended FX** | Film Grain (25%), Vignette (55%), Dust Motes (15%), Light Leak Warm (10%), Bloom (15%), Fog (10%) |
| **FX Strength** | 15-30% — refined, subtle |
| **Recommended Visualizers** | Simple bars, waveform, circular (gold) |

### CLASSICAL / ORCHESTRAL

| Attribute | Value |
|-----------|-------|
| **Mood** | Grand, elegant, emotional, timeless |
| **Visual Identity** | Rich colors, symmetry, golden ratios, concert-hall ambiance |
| **Main Colors** | Deep Gold (#B8860B), Burgundy (#800020), Ivory (#FFFFF0), Royal Blue (#002366) |
| **Camera Motion** | Very slow orbit, dramatic dolly zoom at climaxes, gentle breathing |
| **Color Grade** | Golden Hour + warm + moderate contrast + rich shadows |
| **Recommended FX** | Vignette (50%), Film Grain (10%), Bloom (20%), God Rays (at climaxes), Rack Focus (during solos), Volumetric Light (15%) |
| **FX Strength** | 10-25% — never distracting from the music |
| **Recommended Visualizers** | Elegant bars, flowing waveform, particle clouds |

### AMBIENT / MEDITATION

| Attribute | Value |
|-----------|-------|
| **Mood** | Serene, transcendent, vast, peaceful |
| **Visual Identity** | Slow movement, soft focus, nature-inspired, ethereal |
| **Main Colors** | Sky Blue (#87CEEB), Soft Lavender (#E6E6FA), Seafoam (#98FFB5), White (#FFFFFF) |
| **Camera Motion** | Ultra-slow orbit, gentle breathing (3%), no shake, float-like drift |
| **Color Grade** | Dream/Pastel + low contrast + high brightness + desaturated |
| **Recommended FX** | Bloom (30%), Breathing (3%), Gaussian Blur subtle (5%), Vignette (30%), Dust Motes (10%), Fog (15%), Haze (10%) |
| **FX Strength** | 5-20% — barely perceptible |
| **Recommended Visualizers** | Particle cloud (white), fluid, aurora |

### CINEMATIC / EPIC

| Attribute | Value |
|-----------|-------|
| **Mood** | Epic, dramatic, sweeping, powerful |
| **Visual Identity** | Wide letterbox, film grain, dramatic lighting, bold contrasts |
| **Main Colors** | Teal (#008080), Orange (#FF6B00), Dark Slate (#2F4F4F), Gold (#FFD700) |
| **Camera Motion** | Slow dramatic pan, dolly zoom at crescendos, gentle orbit |
| **Color Grade** | Teal-Orange + high contrast + warm highlights + deep shadows |
| **Recommended FX** | Vignette (55%), Film Grain (20%), Anamorphic Streak (25%), Chromatic Aberration (10%), Bloom (25%), Letterbox overlay, God Rays (at peaks) |
| **FX Strength** | 30-50% — controlled drama |
| **Recommended Visualizers** | Bars (dramatic), circular (golden), flowing lines |

### ROCK

| Attribute | Value |
|-----------|-------|
| **Mood** | Raw, energetic, rebellious, live-concert |
| **Visual Identity** | Stage lighting simulation, gritty texture, high energy, concert vibe |
| **Main Colors** | Red (#FF0000), Black (#000000), White (#FFFFFF), Yellow (#FFD700) |
| **Camera Motion** | Moderate shake on drums, beat zoom on chorus, quick pans |
| **Color Grade** | High contrast + warm + slightly desaturated + gritty |
| **Recommended FX** | Camera Shake (35%), Beat Zoom (40%), Film Grain (30%), Strobe (on chorus), Bloom (30%), Lens Flare (on solos), Light Leak (20%) |
| **FX Strength** | 50-70% — energetic but not chaotic |
| **Recommended Visualizers** | Bars (raw), waveform (aggressive), circular |

### METAL

| Attribute | Value |
|-----------|-------|
| **Mood** | Extreme, brutal, dark, intense |
| **Visual Identity** | Near-black backgrounds, fire accents, extreme energy, chaos on drops |
| **Main Colors** | Black (#000000), Blood Red (#660000), Fire Orange (#FF4500), Steel Grey (#4A4A4A) |
| **Camera Motion** | Violent shake on blast beats, extreme zoom, dutch angle |
| **Color Grade** | Noir-adjacent + very high contrast + desaturated + red tint |
| **Recommended FX** | Camera Shake (70%), Beat Zoom (60%), Block Glitch (on breakdowns), RGB Split (30%), Film Grain (35%), Vignette (70%), Strobe (on drops), Flash (white, on hits) |
| **FX Strength** | 80-100% — absolute intensity |
| **Recommended Visualizers** | Bars (fire), aggressive shapes, distorted waveform |

### HIP-HOP / RAP

| Attribute | Value |
|-----------|-------|
| **Mood** | Confident, smooth, urban, stylish |
| **Visual Identity** | Slow motion feel, gold accents, clean aesthetic with edge |
| **Main Colors** | Gold (#FFD700), Black (#000000), Dark Purple (#2D1B4E), White (#FFFFFF) |
| **Camera Motion** | Smooth beat zoom, very subtle shake on snare, slow drift |
| **Color Grade** | Warm + moderate saturation + rich blacks + golden highlights |
| **Recommended FX** | Beat Zoom (35%), Vignette (40%), Bloom (20%), Film Grain (15%), Light Sweep (on hooks), Chromatic Aberration (10%) |
| **FX Strength** | 35-55% — stylish, not overcooked |
| **Recommended Visualizers** | Bars (gold), waveform (clean), minimal circular |

### R&B / SOUL

| Attribute | Value |
|-----------|-------|
| **Mood** | Smooth, sensual, emotional, warm |
| **Visual Identity** | Soft lighting, warm tones, gentle gradients, intimate |
| **Main Colors** | Deep Rose (#C71585), Warm Gold (#DAA520), Midnight Blue (#191970), Soft Pink (#FFB6C1) |
| **Camera Motion** | Very slow breathing, gentle drift, no shake |
| **Color Grade** | Golden Hour + warm + soft contrast + lifted shadows |
| **Recommended FX** | Bloom (30%), Vignette (40%), Light Leak (20%), Film Grain (10%), Dust Motes (10%), Soft Focus (15%) |
| **FX Strength** | 20-35% — sensual, refined |
| **Recommended Visualizers** | Smooth bars, flowing waveform, soft circular |

### REGGAE

| Attribute | Value |
|-----------|-------|
| **Mood** | Laid-back, positive, warm, natural |
| **Visual Identity** | Warm tropical colors, relaxed movement, nature-inspired |
| **Main Colors** | Green (#008000), Gold (#FFD700), Red (#FF0000), Brown (#8B4513) |
| **Camera Motion** | Gentle bob on off-beat, slow pan, no aggressive movement |
| **Color Grade** | Warm + vibrant green/gold + moderate contrast |
| **Recommended FX** | Beat Zoom (15%, off-beat), Film Grain (15%), Vignette (30%), Warm Grade, Light Leak (10%) |
| **FX Strength** | 15-30% — chill, relaxed |
| **Recommended Visualizers** | Bars (green/gold), circular (warm), waveform |

### DISCO / FUNK

| Attribute | Value |
|-----------|-------|
| **Mood** | Fun, groovy, colorful, retro party |
| **Visual Identity** | Disco ball sparkle, bright colors, light patterns, 70s feel |
| **Main Colors** | Gold (#FFD700), Pink (#FF69B4), Silver (#C0C0C0), Turquoise (#40E0D0) |
| **Camera Motion** | Rhythmic zoom on beat, gentle orbit, fun dutch angle |
| **Color Grade** | Warm/Vintage + high saturation + golden highlights |
| **Recommended FX** | Bloom (40%), Lens Flare sparkles (30%), Color Pulse (25%), Beat Zoom (30%), Confetti (on chorus), Hue Shift slow (10%), Light Sweep (20%) |
| **FX Strength** | 40-60% — fun, energetic |
| **Recommended Visualizers** | Circular (disco), bars (colorful), geometric |

### POP / K-POP

| Attribute | Value |
|-----------|-------|
| **Mood** | Bright, fun, polished, trendy |
| **Visual Identity** | Clean, colorful, well-produced, social-media-ready |
| **Main Colors** | Pastel Pink (#FFB7C5), Baby Blue (#89CFF0), Lavender (#E6E6FA), Mint (#98FF98) |
| **Camera Motion** | Clean beat zoom, smooth transitions, dynamic but controlled |
| **Color Grade** | Pastel/Vibrant + clean + moderate contrast + balanced |
| **Recommended FX** | Beat Zoom (35%), Bloom (30%), Confetti (on chorus), Color Pulse (20%), Chromatic Aberration (10%), Flash (on drops), Lens Flare (15%) |
| **FX Strength** | 35-55% — polished, never messy |
| **Recommended Visualizers** | Clean bars (pastel), circular (gradient), modern shapes |

### WORSHIP / GOSPEL

| Attribute | Value |
|-----------|-------|
| **Mood** | Uplifting, reverent, hopeful, transcendent |
| **Visual Identity** | Warm light, golden rays, soft focus, heavenly atmosphere |
| **Main Colors** | Gold (#FFD700), Warm White (#FFF8DC), Sky Blue (#87CEEB), Soft Amber (#FFBF00) |
| **Camera Motion** | Very slow rising, gentle breathing, no shake |
| **Color Grade** | Golden Hour/Candlelight + warm + soft + lifted shadows |
| **Recommended FX** | God Rays (25%), Bloom (35%), Vignette (35%), Dust Motes (15%), Light Leak warm (15%), Breathing (2%), Fog soft (10%) |
| **FX Strength** | 15-30% — reverent, beautiful |
| **Recommended Visualizers** | Gentle waveform, soft circular, particle clouds |

### NASHEED

| Attribute | Value |
|-----------|-------|
| **Mood** | Devotional, dignified, peaceful, powerful |
| **Visual Identity** | Clean, respectful, geometric patterns, calligraphy-inspired |
| **Main Colors** | Deep Green (#006400), Gold (#D4AF37), Cream (#FFFDD0), Deep Blue (#000080) |
| **Camera Motion** | Very slow orbit, gentle drift, absolutely no shake |
| **Color Grade** | Warm + moderate saturation + clean + golden highlights |
| **Recommended FX** | Vignette (40%), Bloom (20%), Film Grain subtle (8%), Light Leak warm (10%), Breathing (1.5%), Geometric patterns (20%) |
| **FX Strength** | 10-25% — dignified, clean |
| **Recommended Visualizers** | Geometric, circular (golden), clean bars |

### DANGDUT / KOPLO

| Attribute | Value |
|-----------|-------|
| **Mood** | Festive, energetic, colorful, celebratory |
| **Visual Identity** | Bright saturated colors, rapid movement, party atmosphere |
| **Main Colors** | Bright Red (#FF0000), Gold (#FFD700), Green (#00FF00), Hot Pink (#FF1493) |
| **Camera Motion** | Aggressive beat zoom on kendang, shake on beats, fast transitions |
| **Color Grade** | Vibrant + high saturation + warm + high contrast |
| **Recommended FX** | Beat Zoom (60%), Camera Shake (40%), Color Pulse (30%), Confetti (on hooks), Bloom (35%), Flash (on drops), Strobe (mild, on chorus) |
| **FX Strength** | 60-80% — high energy, festive |
| **Recommended Visualizers** | Bars (colorful), circular (gold), geometric |

### VAPORWAVE

| Attribute | Value |
|-----------|-------|
| **Mood** | Surreal, nostalgic, ironic, dreamlike |
| **Visual Identity** | Pastel/neon, VHS aesthetic, Greek statues, retro tech |
| **Main Colors** | Pastel Pink (#FFB6C1), Cyan (#00CED1), Lavender (#B57EDC), Soft Purple (#9370DB) |
| **Camera Motion** | Ultra-slow drift, slight VHS tracking wobble, no shake |
| **Color Grade** | Pastel + Synthwave mix + reduced contrast + VHS warmth |
| **Recommended FX** | VHS (30%), Scanline (20%), Bloom (35%), Film Grain (15%), Chromatic Aberration (15%), Hue Shift slow (10%), CRT (15%), Gate Weave (5%) |
| **FX Strength** | 40-55% — dreamy, textured |
| **Recommended Visualizers** | Bars (pastel), geometric (retro), circular (vaporwave) |

### CYBERPUNK

| Attribute | Value |
|-----------|-------|
| **Mood** | Futuristic, dystopian, neon-soaked, tech-noir |
| **Visual Identity** | Neon signs, rain, dark alleys, holographic UI, high-tech low-life |
| **Main Colors** | Neon Pink (#FF10F0), Electric Blue (#0080FF), Yellow (#FFE400), Deep Black (#050505) |
| **Camera Motion** | Moderate shake, glitch cuts on transitions, slow digital pan |
| **Color Grade** | Cyberpunk/Night City + extreme neon saturation + deep blacks |
| **Recommended FX** | Chromatic Aberration (30%), Neon Glow (50%), Scanline (25%), Block Glitch (15%), Rain (25%), Bloom (40%), RGB Split (15%), Lens Flare (20%), Anamorphic Streak (20%) |
| **FX Strength** | 55-75% — stylized and immersive |
| **Recommended Visualizers** | Bars (neon), circular (holographic), geometric (cyber) |

### HORROR

| Attribute | Value |
|-----------|-------|
| **Mood** | Terrifying, unsettling, dark, dread |
| **Visual Identity** | Near-black, red accents, flicker, distortion, grain |
| **Main Colors** | Black (#000000), Dark Red (#330000), Pale Green (#98FB98), Grey (#666666) |
| **Camera Motion** | Unsettling slow drift, sudden violent shake on scares, dutch angle |
| **Color Grade** | Noir/Apocalyptic + desaturated + green tint + crushed blacks |
| **Recommended FX** | Film Grain (45%), Vignette (70%), Film Flicker (30%), Camera Shake sudden (40%), Block Glitch (on scares), Noise burst (on scares), Chromatic Aberration (25%), Fog (20%) |
| **FX Strength** | 50-70% — oppressive atmosphere |
| **Recommended Visualizers** | Minimal, dark, waveform (green), distorted shapes |

### ANIME / GAMING

| Attribute | Value |
|-----------|-------|
| **Mood** | Exciting, dynamic, colorful, action-packed |
| **Visual Identity** | Speed lines, bold colors, comic effects, clean outlines |
| **Main Colors** | Bright Orange (#FF6600), Blue (#0066FF), Red (#FF0000), White (#FFFFFF) |
| **Camera Motion** | Dynamic zoom on action, speed lines on intensity, clean movement |
| **Color Grade** | Vibrant + high saturation + clean + anime-style highlights |
| **Recommended FX** | Speed Lines (40%), Beat Zoom (50%), Bloom (35%), Neon Outline (20%), Flash white (on hits), Radial Blur (on impacts), Confetti (on victories) |
| **FX Strength** | 50-70% — dynamic, exciting |
| **Recommended Visualizers** | Bars (bright), circular (anime), geometric |

### KIDS / CHILDREN

| Attribute | Value |
|-----------|-------|
| **Mood** | Happy, playful, safe, colorful |
| **Visual Identity** | Primary colors, soft edges, fun particles, friendly |
| **Main Colors** | Red (#FF0000), Blue (#0088FF), Yellow (#FFD700), Green (#00CC00) |
| **Camera Motion** | Gentle bounce on beat, no shake, smooth and safe |
| **Color Grade** | Bright + high saturation + low contrast + no dark shadows |
| **Recommended FX** | Confetti (20%), Bloom (25%), Beat Zoom gentle (15%), Bubbles (15%), Stars/Sparkle (20%), Snow (seasonal) |
| **FX Strength** | 15-25% — fun but never overwhelming |
| **Recommended Visualizers** | Bars (rainbow), circular (colorful), simple shapes |

> ⚠️ **SAFETY:** Kids preset MUST disable Strobe, Flicker, and any effect that could trigger photosensitive epilepsy.

### SCI-FI / FANTASY

| Attribute | Value |
|-----------|-------|
| **Mood** | Otherworldly, mystical, cosmic, imaginative |
| **Visual Identity** | Space imagery, magical particles, ethereal glow, cosmic colors |
| **Main Colors** | Deep Space Blue (#0D1B2A), Nebula Purple (#7B2D8E), Star White (#F8F8FF), Emerald (#50C878) |
| **Camera Motion** | Slow cosmic drift, gentle orbit, breathing |
| **Color Grade** | Night City/Cyberpunk + blue tint + moderate saturation |
| **Recommended FX** | Star Field (30%), Bloom (40%), God Rays (20%), Aurora (15%), Fireflies (20%), Dust Motes (15%), Lens Flare (15%), Vignette (45%) |
| **FX Strength** | 30-50% — atmospheric, immersive |
| **Recommended Visualizers** | Particle clouds, circular (cosmic), geometric (crystal) |

---

# 9. SMART PRESETS & AI PRESETS

## 9.1 Smart Preset Logic

Smart Presets are rule-based macros. When a user clicks a genre button, the system executes a deterministic set of operations:

### Smart Preset Data Structure

```
SmartPreset {
  id: "lofi"
  name: "Lo-fi"
  category: "Genre"
  
  // Effects to enable
  enable: [
    { effect: "FilmGrain",  params: { density: 35, filmStock: "Kodak Tri-X", softness: "Fine" } },
    { effect: "Vignette",   params: { intensity: 45, softness: 0.6 } },
    { effect: "DustScratches", params: { dustDensity: 20, scratchDensity: 10 } },
    { effect: "LightLeak",  params: { intensity: 15, color: "Warm", position: "Random" } },
    { effect: "Breathing",  params: { amplitude: 2.0, bpm: 12 } },
    { effect: "GateWeave",  params: { intensity: 5 } }
  ]
  
  // Effects to disable
  disable: [
    "CameraShake", "BeatZoom", "Strobe", "Flash", "BlockGlitch",
    "RGBSplit", "DataMosh", "SpeedLines"
  ]
  
  // Color grade to apply
  colorGrade: {
    preset: "Vintage",
    temperature: +25,
    saturation: -15,
    contrast: -10
  }
  
  // Audio reactivity settings
  triggers: {
    globalSensitivity: 20,   // Very low — gentle
    beatReact: false,         // No beat-reactive effects
    bassReact: false
  }
}
```

### Smart Preset Conflict Resolution

When switching from one genre to another:

1. **Disable** all effects from the previous preset
2. **Apply** the new preset's settings
3. **Preserve** any user-manually-added effects that aren't in either preset
4. **Show toast notification**: "Switched to Lo-fi preset. 3 custom effects preserved."

## 9.2 AI Preset System

### Natural Language Interface

Users can type natural language descriptions and the AI generates an FX configuration:

| User Input | AI Response |
|------------|-------------|
| "Make this look like Blade Runner" | Cyberpunk grade + Rain + Neon Glow + Anamorphic Streak + Chromatic Aberration + Bloom |
| "Make this dreamy" | Dream grade + Bloom (40%) + Soft Focus + Breathing + Dust Motes + Pastel shift |
| "Make this VHS" | VHS (40%) + Film Grain + Warm grade + Scanline + Gate Weave + Tracking noise |
| "Make this horror" | Noir grade + Green tint + Heavy Grain + Vignette (70%) + Film Flicker + Random Glitch |
| "Make this YouTube Lofi" | Lo-fi Smart Preset + Warm grade + Vinyl crackle visual + Study-lamp vignette |
| "Aggressive bass drops" | Beat Zoom (80%) + Camera Shake (60%) + RGB Split (on bass) + Strobe (on drops) |
| "Calm meditation" | Ambient Smart Preset + Very slow bloom + Breathing + Minimal movement |
| "Concert energy" | Rock Smart Preset + Stage lighting + Lens Flare + Confetti + Strobe |
| "90s music video" | VHS + Film Grain + Warm + Light Leaks + Cross-process grade |
| "Anime opening" | Speed Lines + Flash + Dynamic Zoom + Vibrant colors + Beat sync |

### AI Suggestion Engine

Beyond direct input, the AI passively analyzes the current project and offers suggestions:

| Context | AI Suggestion |
|---------|---------------|
| Audio is very bass-heavy | "💡 This track has strong bass. Consider enabling Beat Zoom or Camera Shake for impact." |
| Audio is very quiet/ambient | "💡 Detected ambient music. Consider reducing FX intensity and enabling Breathing + Bloom." |
| No color grade applied | "💡 No color grading detected. Try 'Warm' for a cozy feel or 'Teal-Orange' for cinematic." |
| FX stack has 10+ effects | "⚠️ 12 effects active. Performance may suffer. Consider disabling low-impact effects." |
| Strobe + Kids genre | "🚨 Strobe is not recommended for children's content. Auto-disabling for safety." |

---

# 10. PRESET ENGINE

## 10.1 Preset Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRESET ENGINE                         │
│                                                         │
│  ┌──────────────┐                                       │
│  │ Preset File   │ ← JSON-based, human-readable         │
│  │ (.mfxpreset) │                                       │
│  └──────┬───────┘                                       │
│         │                                               │
│  ┌──────▼───────┐    ┌────────────┐   ┌──────────────┐ │
│  │  Preset       │    │  Preset    │   │  Preset      │ │
│  │  Manager      │───▶│  Browser   │───▶│  Inspector   │ │
│  │               │    │            │   │              │ │
│  │  • Load       │    │  • Grid    │   │  • Preview   │ │
│  │  • Save       │    │  • Tags    │   │  • Settings  │ │
│  │  • Export     │    │  • Search  │   │  • Apply     │ │
│  │  • Import     │    │  • Filter  │   │  • Merge     │ │
│  │  • Inherit    │    │  • Sort    │   │  • Override  │ │
│  └──────────────┘    └────────────┘   └──────────────┘ │
│                                                         │
│  ┌──────────────┐    ┌────────────┐   ┌──────────────┐ │
│  │  Categories   │    │  Tags      │   │  Favorites   │ │
│  │               │    │            │   │              │ │
│  │  • Genre      │    │  • Mood    │   │  ★ Starred   │ │
│  │  • Mood       │    │  • Energy  │   │  ♡ Liked     │ │
│  │  • Energy     │    │  • Color   │   │  🕐 Recent   │ │
│  │  • Style      │    │  • Genre   │   │  📦 Custom   │ │
│  │  • Custom     │    │  • Custom  │   │              │ │
│  └──────────────┘    └────────────┘   └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 10.2 Preset File Format

```
MediaFactory Preset (.mfxpreset)
{
  "version": "1.0",
  "meta": {
    "name": "Neon Dreams",
    "author": "MediaFactory",
    "category": "Genre",
    "tags": ["synthwave", "neon", "retro", "dreamy"],
    "description": "80s retrowave aesthetic with neon glow and scanlines",
    "thumbnail": "base64 encoded preview image",
    "created": "2026-07-17T00:00:00Z",
    "modified": "2026-07-17T00:00:00Z",
    "compatibility": "MF >= 3.0"
  },
  "inherits": null,  // or "parent_preset_id"
  "effects": [ ... ],
  "colorGrade": { ... },
  "triggers": { ... },
  "modulation": [ ... ]
}
```

## 10.3 Preset Inheritance

Presets can inherit from parent presets and override specific values:

```
Base: "Synthwave"
  └── Child: "Synthwave Dark" (inherits all, overrides: contrast +20, shadows -15)
       └── Child: "Synthwave Horror" (inherits Dark, adds: Film Flicker, Glitch)
```

This allows:
- **Efficient storage** — children only store overrides
- **Automatic updates** — updating the parent cascades to all children
- **Easy customization** — users create children of factory presets

## 10.4 Preset Categories & Tags

| Category | Description | Example Presets |
|----------|-------------|-----------------|
| **Genre** | Music genre-specific looks | Phonk, Lo-fi, EDM |
| **Mood** | Emotional tone | Dreamy, Aggressive, Peaceful |
| **Era** | Time period aesthetics | 80s, 90s, 2000s, Vintage |
| **Film Style** | Cinematic looks | Noir, Blockbuster, Indie |
| **Color** | Color-dominant presets | Golden, Blue Hour, Neon |
| **Performance** | Organized by GPU cost | Lightweight, Standard, Premium |
| **Community** | User-created shared presets | Top Rated, New, Trending |
| **AI Generated** | Presets created by AI | From Prompt, Auto-Detected |

---

# 11. MARKETPLACE ARCHITECTURE

## 11.1 Marketplace Product Types

| Product Type | File Extension | Description | Pricing Model |
|--------------|----------------|-------------|---------------|
| **FX Preset Pack** | .mfxpack | Bundle of 5-50 presets | One-time purchase |
| **LUT Pack** | .mfxlut | Collection of color LUTs | One-time purchase |
| **Particle Pack** | .mfxparticle | Custom particle systems | One-time purchase |
| **Transition Pack** | .mfxtransition | Custom transitions | One-time purchase |
| **Complete Theme** | .mfxtheme | Presets + LUTs + Particles | One-time purchase |
| **AI Model** | .mfxmodel | Trained style transfer model | Subscription |

## 11.2 Marketplace Features

| Feature | Description |
|---------|-------------|
| **Preview** | Live preview of preset applied to user's current project before purchase |
| **Ratings & Reviews** | 5-star rating + written reviews from verified purchasers |
| **Creator Profiles** | Seller pages with portfolio, sales stats, and badges |
| **Revenue Split** | 70% creator / 30% MediaFactory |
| **Version Control** | Creators can update packs; buyers get updates free |
| **License Types** | Personal / Commercial / Enterprise |
| **Search & Filter** | By category, tag, price, rating, compatibility, genre |
| **Collections** | Curated bundles ("Best of 2026", "Horror Essentials") |
| **Free Tier** | Every creator must offer at least 1 free preset for discovery |

---

# 12. PERFORMANCE BUDGET

## 12.1 GPU Cost Classification

| Rating | GPU Time per Frame | Examples | Max Simultaneous |
|--------|-------------------|----------|-----------------|
| **Low** | < 0.5ms | Color Grade, Vignette, Film Grain, Shake | Unlimited |
| **Medium** | 0.5–2ms | Bloom, Particles, Blur, Glitch | 8-10 |
| **High** | 2–5ms | God Rays, Data Mosh, Bokeh, Depth Map | 3-4 |
| **Very High** | 5ms+ | AI Style Transfer, Oil Paint | 1 |

## 12.2 Performance Targets

| Resolution | Target FPS | Max GPU Budget per Frame | Recommended Max Effects |
|------------|------------|--------------------------|------------------------|
| 720p | 60 FPS | 10ms | 15+ effects |
| 1080p | 60 FPS | 12ms | 12 effects |
| 1440p | 60 FPS | 14ms | 10 effects |
| 4K | 30 FPS | 25ms | 8 effects |
| 4K | 60 FPS | 14ms | 6 effects |

## 12.3 Auto-Quality System

When the engine detects frame drops, it automatically:

1. **Level 1:** Reduce blur quality (fewer passes)
2. **Level 2:** Lower particle count by 50%
3. **Level 3:** Disable "Very High" cost effects
4. **Level 4:** Reduce render resolution internally, upscale output
5. **Level 5:** Switch to "Lite" mode — only Low-cost effects remain

A performance meter in the UI shows current GPU utilization in real-time.

---

# 13. APPENDIX: DESIGN DECISIONS

## 13.1 Why 22 Categories Instead of BSP Labs' 3?

BSP Labs bundles everything into "Color Grade", "Film Effects", and "Beat FX". This works for a simple tool but creates problems:

- **Discoverability:** Users can't find effects they don't know exist
- **Organization:** 50+ effects in 3 categories is overwhelming
- **Scalability:** Adding new effects requires reworking categories
- **Professional workflow:** Compositing professionals expect granular categorization (see After Effects, DaVinci Resolve)

Our 22 categories group effects by *what they do*, not by when they were implemented.

## 13.2 Why Modular Triggers Instead of Hardcoded Audio Reactivity?

BSP Labs has a fixed trigger system: effects either react to beat or they don't. Our modular trigger system means:

- **Any effect** can react to **any audio feature**
- **Sensitivity** is configurable per-effect
- **Multiple triggers** can be combined (AND/OR logic)
- **Custom triggers** (Timeline Markers, Every X Seconds) support non-musical content
- **Future triggers** (AI-detected mood, key change detection) can be added without code changes

## 13.3 Why a Modulation Matrix?

Professional tools (synthesizers, After Effects expressions, DaVinci Resolve node system) all use modulation/linking between parameters. Without modulation:

- Animations require manual keyframing
- Effects feel static and lifeless
- Complex behaviors are impossible without coding

With our Modulation Matrix, a beginner user can create complex, evolving visual behaviors by simply connecting a modulation source to any parameter — no keyframing, no coding.

## 13.4 Why Preset Inheritance?

Without inheritance, every preset is an island. Users who want "Synthwave but darker" must duplicate the entire Synthwave preset and manually tweak values. With inheritance:

- Changes to "Synthwave" automatically flow to "Synthwave Dark"
- Users only override what they need
- Storage is efficient
- Marketplace presets can build on factory presets

---

> **End of Document**
>
> This specification is a living document. It will be updated as the FX Engine evolves through development, user testing, and market feedback.
>
> **Next Steps:**
> 1. Engineering review of performance budgets
> 2. UX prototyping of the FX Panel interface
> 3. Shader development for priority effects (Camera Shake, Bloom, Film Grain, Vignette, Color Grade)
> 4. Audio Analyzer implementation (FFT, Onset Detection)
> 5. Trigger Dispatcher and Modulation Matrix architecture
> 6. Smart Preset data authoring for all 40+ genres
