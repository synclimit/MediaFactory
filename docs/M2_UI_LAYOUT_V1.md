# MediaFactory M2 - UI Layout Specification V1

Module

M2 Audio Remix Factory

Version

1.0

---

# Design Goal

M2 harus terasa seperti:

Audio Factory

bukan Audio Editor.

User mengatur sekali.

Sistem menghasilkan banyak output.

---

# Layout Structure

┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Source Pool                         │
├─────────────────────────────────────┤
│ Audio Processing                    │
├─────────────────────────────────────┤
│ Output Planning                     │
├─────────────────────────────────────┤
│ Queue Preview                       │
└─────────────────────────────────────┘

Pipeline tetap di kanan.

Sama seperti M1.

---

# SECTION 1

Source Pool

---

Purpose

Mengumpulkan seluruh sumber lagu.

---

Top Controls

[ Import Audio ]

[ Import Folder ]

[ Add YouTube URL ]

---

Source Counter

Example

Sources Loaded: 15

Audio Files: 6

Folder Tracks: 5

YouTube Tracks: 4

---

Source Table

Columns

Type

Title

Duration

Status

Actions

---

Example

Audio

DJ TABOLA BALE

03:42

Ready

Delete

---

YouTube

DJ ORANG BARU

04:15

Ready

Delete

---

Expandable Details

Original Title

Cleaned Title

Source Path

Channel

Duration

---

# SECTION 2

Audio Processing

---

Purpose

Global processing profile.

Applies to ALL sources.

---

Preset Row

Preset:

[ Neutral ▼ ]

---

Controls

Pitch

Speed

Volume

Bass

Treble

Stereo Width

Fade In

Fade Out

Normalize

---

Slider Layout

Pitch

[-1.0] ===== [0] ===== [+1.0]

---

Speed

[0.95] ===== [1.00] ===== [1.05]

---

Volume

[-20%] ===== [0] ===== [+20%]

---

Tooltip Examples

Pitch

Changes voice tone.

Higher = brighter.

Lower = deeper.

---

Speed

Changes playback speed.

Does not affect pitch.

---

Bass

Adds low-end energy.

Useful for headphones.

---

Treble

Adds brightness and clarity.

---

Stereo Width

Makes audio feel wider.

---

Normalize

Balances volume automatically.

---

# SECTION 3

Live Preview

---

Purpose

Preview profile before rendering.

---

Layout

Original

Processed

Compare

---

Controls

[ Play ]

━━━━━━━━━━━━━━━●━━━━━━

00:45 / 03:12

---

Behavior

User moves slider

↓

Audio updates instantly

↓

Play again

↓

Hear difference

---

No Pause Button

No Stop Button

Single Play Button Only

---

# SECTION 4

Output Planning

---

Purpose

Configure generation logic.

---

Target Duration

Dropdown

AI Automatic

5 Minutes

10 Minutes

15 Minutes

20 Minutes

30 Minutes

45 Minutes

60 Minutes

---

Output Count

Dropdown

AI Automatic

1

3

5

10

20

50

100

---

Shuffle Strength

Dropdown

Low

Medium

High

---

Naming Pattern

Dropdown

Title A

Title A x Title B

Title A x Title B x Title C

Custom

AI Suggested

---

Custom Pattern Box

Visible only if:

Custom selected

Example

DJ VIRAL TIKTOK 2026

---

Expected Output Summary

Outputs: 12

Average Duration: 15m

Estimated Storage: 480 MB

---

# SECTION 5

Output Planner Preview

---

Purpose

Preview generated outputs.

---

Table

Output Name

Duration

Tracks

---

Example

DJ TABOLA BALE

15m

A+B+C

---

DJ TABOLA BALE x DJ ORANG BARU

15m

B+C+D

---

DJ ORANG BARU x DJ KAKA

15m

A+D+E

---

# SECTION 6

Queue Preview

---

Purpose

Final validation.

---

Display

Ready Outputs

Duplicates

Invalid

Estimated Storage

Estimated Render Time

---

Example

Ready Outputs: 12

Duplicates: 0

Invalid: 0

Render Time: 6 min

---

# Footer Actions

[ Create New Configuration ]

[ Continue Editing ]

[ Add Configuration To Queue ]

---

# Create New Configuration

Must Reset

Source Pool

Processing

Planner

Preview

Validation

---

Must Not Reset

Pipeline

Queue

Completed Jobs

---

# Right Side Pipeline

Unchanged

Same system used by M1.

---

# Design Rule

The user should never need to manually build outputs one by one.

The system should:

* process
* shuffle
* name
* validate
* queue

automatically.

User only configures.

System does the work.
