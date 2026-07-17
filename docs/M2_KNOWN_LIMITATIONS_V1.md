# MediaFactory M2 Known Limitations V1

## Purpose

This document records intentional limitations of M2 V1.

These are NOT bugs.

These are deliberate design decisions.

---

# Limitation 01

No Per-Track Processing

Description

Users cannot apply different audio settings to individual tracks.

Example

Track A

Bass +10

Track B

Bass +20

Not supported.

Reason

M2 uses a Global Audio Profile.

This keeps workflow simple and scalable.

---

# Limitation 02

No Output-Specific Processing

Description

Users cannot edit processing settings per generated output.

Example

Output 01

Bass +10

Output 02

Bass +20

Not supported.

Reason

M2 is an audio factory.

Not an audio editor.

---

# Limitation 03

No Waveform Editing

Description

Users cannot:

* cut audio manually
* trim audio manually
* move waveform sections

Reason

Outside M2 scope.

---

# Limitation 04

No Timeline Editor

Description

Users cannot manually arrange tracks.

Reason

Shuffle Engine handles arrangement automatically.

---

# Limitation 05

No Multi-Track Mixer

Description

Users cannot adjust:

* individual track volume
* individual track EQ
* individual track pan

Reason

M2 uses automated processing.

---

# Limitation 06

No Video Processing

Description

M2 handles audio only.

Reason

Video workflows belong to M1 and M3.

---

# Limitation 07

No Lyrics Processing

Description

M2 does not:

* generate lyrics
* rewrite lyrics
* modify lyrics

Reason

Outside project scope.

---

# Limitation 08

No Cover Song Workflow

Description

M2 does not create cover songs.

Reason

Potential future M4 feature.

---

# Limitation 09

No AI Music Generation

Description

M2 does not generate music.

Reason

M2 works with existing audio sources.

---

# Limitation 10

No Stem Separation

Description

M2 cannot isolate:

* vocals
* drums
* bass
* instruments

Reason

Future expansion only.

---

# Limitation 11

Preview Is Source Based

Description

Preview uses source tracks.

Not generated outputs.

Reason

Output preview would require expensive regeneration.

---

# Limitation 12

Single Audio Profile

Description

Only one active processing profile per configuration.

Reason

Keeps render logic predictable.

---

# Limitation 13

Queue Uses Configuration Signature

Description

Duplicate detection is based on configuration signature.

Not filename only.

Reason

More reliable for batch generation.

---

# Limitation 14

YouTube Sources Are Audio Only

Description

Only audio metadata is imported.

No thumbnail workflow.

No video workflow.

Reason

M2 is audio-focused.

---

# Future Expansion Candidates

Potential M2 V2+

* Advanced Audio Profiles
* Multi Profile Rendering
* Output Templates
* Audio Packs
* Stem Separation
* AI Audio Analysis

---

# Design Philosophy

M2 prioritizes:

Speed

Automation

Consistency

Batch Generation

over

Manual Editing

Fine Tuning

Audio Engineering Complexity
