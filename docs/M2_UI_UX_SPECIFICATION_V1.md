# MediaFactory - M2 UI UX Specification V1.0

## Module

Mode 2 — Audio Remix Factory

---

# Screen Layout

Mode 2 uses a two-panel workspace.

LEFT PANEL:

* Source Pool
* Metadata Cleaner
* Audio Processing
* Audio Preview Monitor
* Remix Generator
* Output Naming

RIGHT PANEL:

* Processing Summary
* Output Preview
* Queue Summary
* Rendering Pipeline

---

# Source Pool Section

## Header

Display:

Audio Sources

Actions:

* Add File
* Add Folder
* Add YouTube

---

## Source List

Each source appears as a Source Card.

Card Layout:

🎵 Source Title

Type:

* Audio File
* Folder Import
* YouTube

Duration

Status

---

## Source Card Actions

Buttons:

▶ Preview

✏ Rename

🗑 Remove

---

## Multi Select Actions

Checkbox support.

Toolbar:

Select All

Remove Selected

Apply Cleaner

---

## Source Summary

Display:

Total Sources

Total Duration

YouTube Count

Audio Count

Folder Count

---

# Metadata Cleaner Section

Purpose:

Clean source titles before output generation.

---

## Metadata Mode

Dropdown:

Original

Cleaned

---

## Preview Area

Display:

Original Title

↓

Cleaned Title

Live update.

---

## Cleaner Rules Tooltip

Examples:

Removes:

* Viral
* TikTok
* Official Audio
* Official Video
* HD
* Full Bass
* Tahun
* Terbaru

---

# Audio Processing Section

Purpose:

Global processing profile.

All tracks receive identical processing.

---

## Preset Selector

Dropdown:

Default

Full Bass

Slow Remix

Club Mix

Chill

Custom

---

## Save Preset

Button:

Save Preset

Tooltip:

Save current processing settings for future projects.

---

## Load Preset

Button:

Load Preset

Tooltip:

Load previously saved processing settings.

---

# Audio Controls

Each control includes tooltip help.

---

## Pitch

Slider

Range:

-1.0 to +1.0

Tooltip:

Adjusts audio pitch slightly higher or lower.

---

## Speed

Slider

Range:

0.90x to 1.10x

Tooltip:

Controls playback speed.

---

## Volume

Slider

Range:

0–200%

Tooltip:

Controls overall loudness.

---

## Bass

Slider

Range:

-20 to +20

Tooltip:

Adds or reduces low frequencies.

---

## Treble

Slider

Range:

-20 to +20

Tooltip:

Adds or reduces high frequencies.

---

## Stereo Width

Slider

Range:

0–200%

Tooltip:

Controls stereo spread.

---

## Fade In

Slider

Range:

0–10 seconds

---

## Fade Out

Slider

Range:

0–10 seconds

---

## Crossfade

Slider

Range:

0–10 seconds

Tooltip:

Smoothly blends tracks together.

---

## Normalize

Toggle

Default:

ON

Tooltip:

Keeps output volume consistent.

---

# Audio Preview Monitor

Purpose:

Preview processing before rendering.

---

## Preview Track

Selected source only.

Not output files.

---

## Playback Controls

Single Button:

▶ Play

---

## Seek Bar

User can:

Jump forward

Jump backward

Preview specific moments

---

## Compare Mode

Buttons:

Original

Processed

---

## Live Monitoring

While playing:

Pitch changes

Bass changes

Treble changes

Speed changes

Should update in real time whenever possible.

---

# Remix Generator

## Target Duration

Dropdown:

5 Minutes

10 Minutes

15 Minutes

20 Minutes

30 Minutes

Default:

15 Minutes

---

## Output Count

Dropdown:

AI Recommended

5

10

20

50

Custom

---

## Custom Output Count

Visible only when Custom is selected.

---

## AI Recommendation Panel

Display:

Track Count

Available Duration

Suggested Output Count

Reasoning Summary

---

# Shuffle Engine

## Shuffle Strength

Dropdown:

Low

Medium

High

Descriptions:

Low:
Small variations.

Medium:
Balanced.

High:
Maximum variation.

---

# Output Diversity

Dropdown:

Conservative

Balanced

Aggressive

Descriptions:

Conservative:
Lower variation.

Balanced:
Standard variation.

Aggressive:
Maximum variation.

---

# Output Naming

## Naming Mode

Dropdown:

Title A

Title A x Title B

Title A x Title B x Title C

Custom

---

## Custom Prefix

Visible only when Custom selected.

Example:

DJ Viral TikTok 2026

---

## Naming Preview

Live Preview Box

Examples:

DJ Tabola Bale X DJ Orang Baru

DJ Orang Baru X DJ Kaka

DJ Tabola Bale X DJ Kaka

Updates instantly.

---

# Processing Summary Panel

Right Side

Displays:

Source Count

Target Duration

Output Count

Preset

Shuffle Strength

Output Diversity

Naming Mode

---

# Output Preview Panel

Displays estimated output names.

Displays estimated durations.

Displays estimated quantity.

---

# Queue Summary Panel

Displays:

Ready Outputs

Estimated Storage

Estimated Processing Time

Validation Status

---

# Validation Indicators

Green:

Ready

Yellow:

Warning

Red:

Invalid

---

# Create New Configuration

Button:

Create New Configuration

Function:

Resets entire Mode 2 workspace.

Must clear:

Sources

Metadata

Processing Profile

Preview State

Remix Settings

Naming Settings

Queue Summary

---

# Accessibility

All sliders must show numeric values.

All dropdowns require tooltips.

All warnings should use plain language.

Avoid technical audio engineering terminology whenever possible.

---

# Design Goal

Mode 2 should feel like:

Audio Factory

NOT

Audio Editing Software

The user should be able to generate large batches of audio outputs with minimal manual work.
