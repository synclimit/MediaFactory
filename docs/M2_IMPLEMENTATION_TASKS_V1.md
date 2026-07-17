# MediaFactory M2 - Implementation Tasks V1

Status: Approved For Development

Priority: High

Module: M2 Audio Remix Factory

---

# Development Order

IMPORTANT

Do NOT build all features simultaneously.

Build sequentially.

Complete and test each task before moving to the next.

---

# TASK 01

Source Pool System

Priority: Critical

---

Goal

Create unified source ingestion.

---

Requirements

Support:

* Audio File
* Folder
* YouTube URL

Mixed together.

---

Example

Source 1

Audio File

---

Source 2

Folder

---

Source 3

YouTube URL

---

All appear in one source pool.

---

Acceptance Test

Import:

2 audio files

1 folder containing 3 songs

2 YouTube URLs

Result:

7 source tracks detected.

---

Status

Pending

---

# TASK 02

YouTube Audio Import

Priority: Critical

---

Goal

Import audio-only from YouTube.

---

Requirements

Extract:

* title
* duration
* channel

Download:

audio stream only

---

Do Not Download

* video
* thumbnail
* subtitles

---

Acceptance Test

Paste URL

System displays:

* title
* duration
* channel

inside source pool.

---

Status

Pending

---

# TASK 03

Metadata Cleaner

Priority: High

---

Goal

Normalize track names.

---

Cleaner Rules

Remove:

Official Video

Official Audio

TikTok Viral

HD

2026

Remastered

Lyrics

Audio

etc.

---

Example

Input:

DJ TABOLA BALE VIRAL TIKTOK 2026

Output:

DJ TABOLA BALE

---

Acceptance Test

Display both:

Original

Cleaned

---

Status

Pending

---

# TASK 04

Audio Processing Panel

Priority: Critical

---

Goal

Global processing controls.

---

Controls

Pitch

Speed

Volume

Bass

Treble

Stereo Width

Normalize

Fade In

Fade Out

---

Processing applies globally.

---

Example

Pitch +0.2

Affects all source tracks.

---

Acceptance Test

Changing slider updates profile state.

---

Status

Pending

---

# TASK 05

Processing Presets

Priority: High

---

Goal

One-click settings.

---

Presets

Neutral

Club

Bass Boost

Soft Vocal

Podcast

Custom

---

Acceptance Test

Selecting preset updates sliders.

---

Status

Pending

---

# TASK 06

Live Preview Engine

Priority: Critical

---

Goal

Preview processing instantly.

---

Player

Single Play Button

Timeline Scrubber

Current Time

Duration

---

Modes

Original

Processed

Compare

---

Acceptance Test

Move Pitch Slider

Press Compare

Difference is immediately audible.

---

Status

Pending

---

# TASK 07

Shuffle Engine

Priority: Critical

---

Goal

Generate output combinations.

---

Inputs

Source Pool

Target Duration

Shuffle Strength

---

Modes

Low

Medium

High

---

Acceptance Test

5 songs

15-minute target

Generates multiple unique combinations.

---

Status

Pending

---

# TASK 08

Naming Engine

Priority: Critical

---

Goal

Automatic naming.

---

Modes

Title A

Title A x Title B

Title A x Title B x Title C

Custom Pattern

AI Suggested

---

Examples

DJ TABOLA BALE

DJ TABOLA BALE x DJ ORANG BARU

DJ TABOLA BALE x DJ ORANG BARU x DJ KAKA

---

Acceptance Test

Generated outputs display names before queueing.

---

Status

Pending

---

# TASK 09

Output Count Engine

Priority: Critical

---

Goal

Control number of outputs.

---

Modes

AI Automatic

Manual

---

Manual Values

1

3

5

10

20

50

100

---

Acceptance Test

User selects 10.

System creates exactly 10 outputs.

---

Status

Pending

---

# TASK 10

Output Planner

Priority: High

---

Goal

Preview generation plan.

---

Display

Output Name

Duration

Tracks Used

Estimated Size

---

Example

Output 01

15m

Track A

Track B

Track C

---

Acceptance Test

User can inspect plan before queueing.

---

Status

Pending

---

# TASK 11

Validation Engine

Priority: Critical

---

Checks

Source Available

Target Duration

Naming Valid

Output Count Valid

Duplicate Names

Queue Collision

---

Acceptance Test

Invalid configurations cannot queue.

---

Status

Pending

---

# TASK 12

Queue Integration

Priority: Critical

---

Goal

Connect M2 to pipeline.

---

Queue Item

{
id,
mode,
outputName,
duration,
tracks,
profile
}

---

Acceptance Test

Outputs appear individually in pipeline.

---

Status

Pending

---

# TASK 13

Create New Configuration

Priority: Critical

---

Must Reset

Source Pool

Processing

Naming

Preview

Validation

Planner

---

Must Not Reset

Queue

Pipeline

Completed Jobs

---

Acceptance Test

Workspace clears completely.

---

Status

Pending

---

# TASK 14

Render Engine

Priority: Critical

---

Pipeline

Load Sources

↓

Apply Processing

↓

Shuffle

↓

Normalize

↓

Export MP3

↓

Register Queue Result

---

Acceptance Test

Completed output appears in pipeline.

---

Status

Pending

---

# TASK 15

M2 Debug Panel

Priority: Development Only

---

Display

Source Count

Ready Outputs

Planned Outputs

Queue Collisions

Duplicate Names

Validation Status

---

Production

Hidden

Developer Mode Only

---

Status

Pending

---

# Release Criteria

M2 may be considered complete only when:

Task 01–15

all pass acceptance testing.

No task may be skipped.
