# MediaFactory - Mode 2 Product Vision V1.0

## Module Name

Mode 2 — Audio Remix Factory

---

# Purpose

Mode 2 is designed to transform multiple audio sources into multiple new audio outputs using a single global processing profile.

Mode 2 is NOT:

* Audio Editor
* DAW
* Audio Workstation
* Multi-track Timeline Editor

Mode 2 IS:

* Audio Remix Factory
* Audio Compilation Generator
* Batch Audio Production System

---

# Primary Workflow

Source Pool

↓

Metadata Cleaner

↓

Audio Processing

↓

Audio Preview Monitor

↓

Remix Generator

↓

Output Naming

↓

Queue

---

# Source Pool

Supported Source Types:

* Audio File
* Folder
* YouTube URL

Users may freely combine all source types inside the same project.

Example:

* DJ A.mp3
* DJ B.mp3
* Folder (3 audio files)
* YouTube URL #1
* YouTube URL #2

Total Sources: 7

---

# Metadata Cleaner

Purpose:

Clean noisy source titles before output generation.

Example:

Original:

DJ TABOLA BALE VIRAL TIKTOK 2026 FULL BASS

↓

Cleaned:

DJ Tabola Bale

Cleaner removes:

* Viral
* TikTok
* Official Audio
* Official Video
* HD
* Full Bass
* Terbaru
* Tahun
* Promotional phrases

Metadata Modes:

* Original
* Cleaned

---

# Audio Processing System

Processing profile is GLOBAL.

All source tracks receive identical processing settings.

No per-track processing.

Supported Controls:

* Pitch
* Speed
* Volume
* Bass Boost
* Treble Boost
* Stereo Width
* Fade In
* Fade Out
* Crossfade
* Normalize

---

# Processing Presets

Built-in Presets:

* Default
* Full Bass
* Slow Remix
* Club Mix
* Chill
* Custom

Presets act as starting points.

Users may still manually adjust every parameter.

---

# Audio Preview Monitor

Purpose:

Allow users to hear processing changes before rendering.

Preview Source:

Selected source track only.

Preview Controls:

* Play
* Seek Bar

Users can:

* Jump forward
* Jump backward
* Listen to specific sections

No Pause button required.

No Stop button required.

---

# Compare Mode

Available Modes:

* Original
* Processed

Original:

Audio before processing.

Processed:

Audio after current processing profile.

Changes should be audible in real time when possible.

---

# Remix Generator

Purpose:

Generate multiple outputs from available source material.

---

## Target Duration

Options:

* 5 Minutes
* 10 Minutes
* 15 Minutes
* 20 Minutes
* 30 Minutes

Default:

15 Minutes

---

## Output Count

Options:

* AI Recommended
* 5
* 10
* 20
* 50
* Custom

Default:

AI Recommended

---

## AI Recommendation

Recommendation is calculated from:

* Source Count
* Source Duration
* Target Duration

---

# Shuffle Engine

Purpose:

Control how aggressively source tracks are rearranged.

Options:

* Low
* Medium
* High

Descriptions:

Low:
Small variations.

Medium:
Balanced variation.

High:
Maximum variation.

---

# Output Diversity

Purpose:

Control output uniqueness.

Options:

* Conservative
* Balanced
* Aggressive

Descriptions:

Conservative:
Less variation.

Balanced:
Standard behavior.

Aggressive:
Maximum variation.

---

# Output Naming

Naming Modes:

* Title A
* Title A x Title B
* Title A x Title B x Title C
* Custom

Examples:

DJ Tabola Bale

DJ Orang Baru

↓

DJ Tabola Bale X DJ Orang Baru

---

Custom Example:

Prefix:

DJ Viral TikTok 2026

Outputs:

DJ Viral TikTok 2026 Vol 01

DJ Viral TikTok 2026 Vol 02

DJ Viral TikTok 2026 Vol 03

---

# Naming Preview

Live preview must always be visible.

Example:

DJ Tabola Bale X DJ Orang Baru

DJ Orang Baru X DJ Kaka

DJ Tabola Bale X DJ Kaka

---

# Rendering Workflow

Source Pool

↓

Metadata Cleaning

↓

Audio Processing

↓

Shuffle Engine

↓

Crossfade

↓

Final Mix Normalize

↓

Output Generation

↓

Queue

---

# Queue Integration

Every Mode 2 configuration creates a batch job.

Queue Summary should display:

* Source Count
* Output Count
* Duration
* Processing Preset
* Naming Mode
* Shuffle Strength
* Output Diversity

---

# Preset Manager

Users may save processing profiles.

Functions:

* Save Preset
* Load Preset

Examples:

* Reggae Standard
* Full Bass DJ
* Slow Remix
* TikTok Chill

---

# Hardware Awareness

Display in Top Bar:

* CPU
* RAM
* GPU
* Free Storage

---

# Processing Complexity Meter

Display:

* LOW
* MEDIUM
* HIGH

Calculated from:

* Source Count
* Output Count
* Target Duration

---

# Excluded From M2 V1

The following features are intentionally excluded:

* Waveform Editor
* Timeline Editor
* Multi-track Editing
* Stem Separation
* Lyrics Processing
* AI Music Generation
* Cover Song Workflow
* Per-Output Audio Editing
* Per-Track Effect Chains

These may be considered for future modules.
