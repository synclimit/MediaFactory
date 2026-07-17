# MEDIAFACTORY_MASTER_SPEC.md

## PROJECT STATUS

Current Stage:
Backend Integration Phase

UI Status:

* M1 UI Exists
* M2 UI Exists
* M3 UI Exists

Focus:
Stabilize backend architecture and workflow.

---

# PRODUCT VISION

MediaFactory is an offline-first desktop application for content creators.

Purpose:

Generate YouTube-ready content and hand off completed outputs directly to AutoUploader.

MediaFactory is NOT a video editor.

MediaFactory is a Content Production Factory.

---

# CORE PRINCIPLES

1. Offline First
2. SQLite Local Database
3. FFmpeg Based Rendering
4. No Supabase Dependency
5. Workspace Based
6. AutoUploader Compatible
7. Metadata Driven
8. Multi Channel Ready

---

# WORKSPACE SYSTEM

MediaFactory starts with Workspace Selection.

Example:

* Rainy Lofi
* Cover Music
* Jazz Channel
* Sleep Music

Each workspace owns:

* Profile
* Templates
* Presets
* Output Folder
* Render History

---

# WORKSPACE PROFILE

Fields:

Workspace Name

Channel Name

Email

Avatar

Genre

Language

Default Upload Category

Default Visibility

Not For Kids

---

# OUTPUT FOLDER CONFIGURATION

Per Workspace:

M1 Output Folder

M2 Output Folder

M3 Output Folder

Example:

D:\MediaFactory\RainyLofi\M1

D:\MediaFactory\RainyLofi\M2

D:\MediaFactory\RainyLofi\M3

---

# M1 VIDEO GENERATOR

Purpose:

Generate standard video content.

Output:

video.mp4

thumbnail.jpg

metadata.json

---

# M2 AUDIO COMPILER

Purpose:

Compile multiple audio sources.

Rules:

Target Duration = Maximum allowed duration

Output duration must NEVER exceed target duration.

Example:

Target = 15 minutes

Valid:
14:59

Invalid:
15:01

Output:

audio.mp3

metadata.json

---

# M3 PLAYLIST CREATOR

Purpose:

Create playlist-style videos.

Modes:

Manual Playlist Mode

Auto Playlist Mode

---

## M3 MANUAL MODE

User selects tracks manually.

Input:

Audio A

Audio B

Audio C

Output:

Playlist Video

Timestamp

Thumbnail

Metadata

---

## M3 AUTO PLAYLIST MODE

Input:

Folder

Example:

D:\MusicLibrary

Contains:

50 songs

User chooses:

Tracks Per Playlist = 15

System automatically selects tracks.

---

# M3 TRACK SELECTION RULES

1. Random Selection

2. No Duplicate Tracks

3. No Duplicate Playlist Combination

4. Playlist History Tracking

5. Hash Validation

Example:

A-B-C-D-E

If already used:

Reject

Generate new combination

---

# M3 TIMESTAMP GENERATOR

Generated automatically.

Example:

00:00 Song A

04:12 Song B

08:30 Song C

13:44 Song D

Uses actual audio duration.

No manual input required.

---

# M3 THUMBNAIL GENERATOR

Source:

Template

Auto-generated Track List

Example:

00:00 Song A

04:12 Song B

08:30 Song C

13:44 Song D

---

# VISUAL MODES

## IMAGE MODE

Supports:

Audio Spectrum

Visualizer

Particles

Light Overlay

Subscribe Overlay

Logo

---

## VIDEO MODE

Supports:

Loop Video

Logo

Watermark

Subscribe Overlay

No heavy visualizer.

---

# MUSIC LIBRARY SYSTEM

Folder Structure:

MusicLibrary

Audio Files

library.json

Example:

[
{
"title":"Before You Go",
"artist":"Boyce Avenue",
"duration":254
}
]

---

# TITLE CLEANING SYSTEM

Priority:

1 Metadata Track

2 Metadata Song

3 Cleaned Title

Remove:

Official Video

Official Audio

Lyrics

Live

Cover

HD

4K

etc

Store:

title_original

title_clean

---

# PIPELINE SYSTEM

Single Source of Truth

Statuses:

Waiting

Scheduled

Pending

Rendering

Completed

Failed

---

# SCHEDULER

User can schedule rendering.

Render starts automatically.

No duplicate queue system.

Pipeline is the only queue.

---

# OUTPUT STANDARD

Every completed render MUST generate:

video.mp4

thumbnail.jpg

metadata.json

---

# METADATA.JSON STANDARD

{
"workspace": "",
"channel": "",
"title": "",
"description": "",
"tags": [],
"category": "",
"privacy": "private",
"notForKids": true,
"videoPath": "",
"thumbnailPath": "",
"createdAt": ""
}

---

# AUTOUPLOADER INTEGRATION

AutoUploader watches output folders.

When metadata.json appears:

AutoUploader loads:

Title

Description

Tags

Category

Video Path

Thumbnail Path

Upload Settings

---

# LICENSE SYSTEM

Offline First

No Supabase

No Monthly Server

Architecture:

SQLite

License.key

Hardware ID

Validation:

License matches Hardware ID

App Unlocks

Otherwise:

License Invalid

---

# DATABASE

SQLite

Stores:

Workspace

Queue

Templates

Profiles

Render History

Playlist History

Settings

---

# FUTURE

MediaFactory

↓

AutoUploader

↓

Full Creator Production Pipeline
