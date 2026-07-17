# MediaFactory - M2 Architecture V1.0

## Module

Mode 2 — Audio Remix Factory

---

# Purpose

Mode 2 generates large quantities of audio outputs from:

* Audio Files
* Folder Imports
* YouTube Audio Sources

while maintaining:

* consistent processing
* automated naming
* queue safety
* predictable output durations

---

# Core Workflow

Source Import

↓

Metadata Cleaning

↓

Audio Processing

↓

Shuffle Engine

↓

Output Builder

↓

Validation

↓

Queue

↓

Render Engine

---

# Architecture Overview

M2 consists of 8 engines:

1. Source Engine
2. Metadata Engine
3. Audio Processing Engine
4. Shuffle Engine
5. Naming Engine
6. Validation Engine
7. Queue Engine
8. Render Engine

---

# Source Engine

Responsible for:

* importing files
* importing folders
* importing YouTube URLs

---

## Accepted Inputs

Audio File

Examples:

* mp3
* wav
* flac
* m4a

---

Folder Import

Recursively scans:

* subfolders
* audio files

---

YouTube Import

Input:

YouTube URL

Extract:

* title
* duration
* channel

Download:

audio stream only

No:

* video
* thumbnail
* subtitles

required.

---

# Internal Source Object

Every imported source becomes:

{
id,
title,
cleanTitle,
duration,
sourceType,
sourcePath,
status
}

---

# Metadata Engine

Responsible for:

title cleanup

---

## Cleaner Rules

Remove:

* Official Audio
* Official Video
* Viral
* TikTok
* Remix Viral
* HD
* 2025
* 2026

etc.

---

## Example

Input:

DJ TABOLA BALE VIRAL TIKTOK 2026

Output:

DJ TABOLA BALE

---

# Audio Processing Engine

Applies processing profile globally.

All tracks receive identical settings.

---

## Processing Chain

Source

↓

Pitch

↓

Speed

↓

Volume

↓

Bass

↓

Treble

↓

Stereo Width

↓

Normalize

↓

Fade In

↓

Fade Out

↓

Export Buffer

---

# Processing Presets

Preset object:

{
pitch,
speed,
volume,
bass,
treble,
stereoWidth,
normalize,
fadeIn,
fadeOut
}

---

# Live Preview Engine

Purpose:

allow instant comparison.

---

Preview Modes

Original

Processed

---

Processing occurs:

real time

without rendering final outputs.

---

# Shuffle Engine

Responsible for output composition.

---

Input

Source Pool

↓

Processed Pool

↓

Output Generator

---

## Example

Sources:

A

B

C

D

E

Target Duration:

15 minutes

---

Output Example

Output 1

A + B + C

---

Output 2

B + C + D

---

Output 3

A + D + E

---

Output 4

C + E + B

---

# Shuffle Strength

Low

Conservative combinations

---

Medium

Balanced combinations

---

High

Maximum variation

---

# Diversity Engine

Purpose:

prevent repetitive outputs.

---

Tracks recently used receive:

lower priority.

---

Goal:

maximize output uniqueness.

---

# Duration Engine

Responsible for:

duration targeting.

---

Example

Target:

15 minutes

---

System builds combinations until:

15 minutes reached

then closes output.

---

Tolerance:

±10 seconds

---

# Naming Engine

Responsible for output filenames.

---

Mode:

Title A

Example:

DJ TABOLA BALE

---

Mode:

Title A x Title B

Example:

DJ TABOLA BALE x DJ ORANG BARU

---

Mode:

Title A x Title B x Title C

Example:

DJ TABOLA BALE x DJ ORANG BARU x DJ KAKA

---

Mode:

Custom

Example:

DJ VIRAL TIKTOK 2026 #01

DJ VIRAL TIKTOK 2026 #02

DJ VIRAL TIKTOK 2026 #03

---

# Validation Engine

Checks:

* sources available
* outputs generated
* duration valid
* names valid
* queue safe

---

# Duplicate Prevention

Output names must be unique.

---

Example

Existing:

DJ TABOLA BALE #01.mp3

---

Attempt:

DJ TABOLA BALE #01.mp3

---

Result:

Rejected

---

Auto Rename:

DJ TABOLA BALE #02.mp3

optional.

---

# Queue Engine

Queue Item Structure

{
id,
mode,
outputName,
duration,
sources,
processingProfile,
status
}

---

Statuses

Pending

Queued

Rendering

Completed

Failed

Cancelled

---

# Create New Configuration

Must reset:

Sources

Metadata

Processing

Shuffle Settings

Naming

Preview

Validation

Temporary Buffers

---

Must NOT reset:

Global Queue

Pipeline

Completed Jobs

---

# Render Engine

Receives:

validated queue items

only.

---

Processing Steps

Load Sources

↓

Apply Processing

↓

Generate Mix

↓

Normalize

↓

Export Audio

↓

Save Output

↓

Register Queue Result

---

# Expected Output Structure

Output/

DJ TABOLA BALE x DJ ORANG BARU.mp3

DJ TABOLA BALE x DJ KAKA.mp3

DJ ORANG BARU x DJ KAKA.mp3

---

# Failure Recovery

If render crashes:

Queue Item

↓

Failed

↓

Retry Available

---

No other queue items should be affected.

---

# Design Principle

Mode 2 is a batch-generation factory.

The user should spend most of their time configuring once and generating many outputs.

The system should handle:

* processing
* naming
* shuffling
* validation
* queue safety

automatically.
