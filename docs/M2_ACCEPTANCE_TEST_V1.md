# MediaFactory M2 - Acceptance Test V1

Module

M2 Audio Remix Factory

Version

1.0

Status

Pre-Development Validation Checklist

---

# Purpose

This document defines the minimum requirements that must pass before M2 can be considered complete.

No feature may be marked as complete until all relevant acceptance tests pass.

---

# TEST GROUP 01

Source Pool

---

TEST 01.1

Audio File Import

Action

Import 3 audio files.

Expected

All files appear in Source Pool.

Titles visible.

Durations visible.

Status = Ready.

PASS / FAIL

---

TEST 01.2

Folder Import

Action

Import folder containing 5 audio files.

Expected

All 5 tracks appear.

Track count updates correctly.

PASS / FAIL

---

TEST 01.3

YouTube Import

Action

Paste 3 YouTube URLs.

Expected

All URLs imported.

Title extracted.

Duration extracted.

Channel extracted.

PASS / FAIL

---

TEST 01.4

Mixed Source Import

Action

Import:

2 files

1 folder

2 YouTube URLs

Expected

All tracks appear in a single Source Pool.

PASS / FAIL

---

# TEST GROUP 02

Metadata Cleaner

---

TEST 02.1

Title Cleaning

Input

DJ TABOLA BALE VIRAL TIKTOK 2026

Expected

DJ TABOLA BALE

PASS / FAIL

---

TEST 02.2

Cleaner Preview

Expected

Original title visible.

Cleaned title visible.

PASS / FAIL

---

# TEST GROUP 03

Audio Processing

---

TEST 03.1

Pitch Slider

Action

Move Pitch.

Expected

Value updates correctly.

PASS / FAIL

---

TEST 03.2

Speed Slider

Action

Move Speed.

Expected

Value updates correctly.

PASS / FAIL

---

TEST 03.3

Bass Slider

Action

Move Bass.

Expected

Value updates correctly.

PASS / FAIL

---

TEST 03.4

Treble Slider

Action

Move Treble.

Expected

Value updates correctly.

PASS / FAIL

---

TEST 03.5

Normalize Toggle

Action

Enable / Disable.

Expected

State changes correctly.

PASS / FAIL

---

# TEST GROUP 04

Presets

---

TEST 04.1

Preset Load

Action

Select preset.

Expected

Sliders update automatically.

PASS / FAIL

---

TEST 04.2

Save Preset

Action

Save custom preset.

Expected

Preset appears in preset list.

PASS / FAIL

---

TEST 04.3

Load Saved Preset

Action

Load saved preset.

Expected

Values restored correctly.

PASS / FAIL

---

# TEST GROUP 05

Live Preview

---

TEST 05.1

Play Button

Action

Click Play.

Expected

Audio plays.

PASS / FAIL

---

TEST 05.2

Seek Bar

Action

Drag timeline.

Expected

Playback position updates.

PASS / FAIL

---

TEST 05.3

Compare Mode

Action

Switch Original / Processed.

Expected

Audible difference.

PASS / FAIL

---

TEST 05.4

Realtime Update

Action

Change slider while previewing.

Expected

Preview reflects changes.

PASS / FAIL

---

# TEST GROUP 06

Output Planning

---

TEST 06.1

Target Duration

Action

Select 15 Minutes.

Expected

Planner updates.

PASS / FAIL

---

TEST 06.2

Output Count

Action

Select 10 Outputs.

Expected

Planner generates 10 outputs.

PASS / FAIL

---

TEST 06.3

AI Output Count

Action

Select AI Automatic.

Expected

Suggested output count generated.

PASS / FAIL

---

TEST 06.4

Shuffle Strength

Action

Change Low / Medium / High.

Expected

Planner recalculates.

PASS / FAIL

---

# TEST GROUP 07

Naming Engine

---

TEST 07.1

Title A

Expected

Output uses first title.

PASS / FAIL

---

TEST 07.2

Title A x Title B

Expected

Output uses two titles.

PASS / FAIL

---

TEST 07.3

Title A x Title B x Title C

Expected

Output uses three titles.

PASS / FAIL

---

TEST 07.4

Custom Naming

Expected

Custom prefix applied.

PASS / FAIL

---

TEST 07.5

Naming Preview

Expected

Live preview updates instantly.

PASS / FAIL

---

# TEST GROUP 08

Output Planner

---

TEST 08.1

Output Table

Expected

Displays:

Name

Duration

Tracks Used

PASS / FAIL

---

TEST 08.2

Estimated Storage

Expected

Storage estimate visible.

PASS / FAIL

---

# TEST GROUP 09

Validation Engine

---

TEST 09.1

Empty Source Pool

Expected

Add To Queue disabled.

PASS / FAIL

---

TEST 09.2

Invalid Output Count

Expected

Validation warning visible.

PASS / FAIL

---

TEST 09.3

Duplicate Output Names

Expected

Validation warning visible.

PASS / FAIL

---

# TEST GROUP 10

Queue Integration

---

TEST 10.1

Queue Submission

Action

Add configuration to queue.

Expected

Pipeline entry created.

PASS / FAIL

---

TEST 10.2

Pipeline Display

Expected

Displays:

Output Count

Duration

Preset

Status

PASS / FAIL

---

TEST 10.3

Continue Editing

Expected

Workspace remains editable.

PASS / FAIL

---

# TEST GROUP 11

Create New Configuration

---

TEST 11.1

Workspace Reset

Action

Click Create New Configuration.

Expected

Source Pool cleared.

Planner cleared.

Processing reset.

Validation reset.

PASS / FAIL

---

TEST 11.2

Pipeline Preservation

Expected

Existing queue remains intact.

PASS / FAIL

---

# TEST GROUP 12

Render Engine

---

TEST 12.1

Render Start

Expected

Status changes to Rendering.

PASS / FAIL

---

TEST 12.2

Render Complete

Expected

Status changes to Completed.

PASS / FAIL

---

TEST 12.3

Output Export

Expected

MP3 file exported.

PASS / FAIL

---

# TEST GROUP 13

Stress Test

---

TEST 13.1

50 Sources

Expected

No UI crash.

PASS / FAIL

---

TEST 13.2

100 Outputs

Expected

No queue corruption.

PASS / FAIL

---

TEST 13.3

Repeated Queue Operations

Expected

No duplicate queue entries.

PASS / FAIL

---

# Release Criteria

M2 is considered complete only if:

All tests pass.

No critical bugs remain.

No queue corruption occurs.

No duplicate output generation occurs.

No configuration reset failures occur.

Only after all acceptance tests pass may M2 be marked:

READY FOR PRODUCTION.
