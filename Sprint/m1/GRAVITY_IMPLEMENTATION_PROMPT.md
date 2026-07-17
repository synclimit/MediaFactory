# GRAVITY_IMPLEMENTATION_PROMPT.md

Version : 1.0
Target : Gravity AI Software Engineer
Project : MediaFactory
Sprint : M1 – Movie Video Generator Backend Integration
Status : REQUIREMENT FREEZE

---

# OBJECTIVE

Implement the M1 Movie Video Generator exactly as defined in the accompanying documents:

1. M1_IMPLEMENTATION_SPEC.md
2. M1_FFMPEG_RENDER_ENGINE.md

These two documents are the **Single Source of Truth**.

Do NOT reinterpret requirements.

Do NOT redesign UI.

Do NOT introduce new features.

Implement only what has been approved.

---

# ROLE

You are acting as:

* Senior Software Engineer
* Backend Engineer
* Frontend Engineer
* Integration Engineer
* Self Reviewer
* Self Tester

You are NOT acting as Product Owner.

Business decisions have already been finalized.

---

# REQUIREMENT FREEZE

The requirements are LOCKED.

You MUST NOT:

* Add new buttons
* Add new menus
* Add new workflow
* Modify UI layout
* Change business logic
* Change validation
* Change database structure unless required by implementation
* Change API contract unless required by implementation

If you discover an improvement,

DO NOT implement it.

Instead,

record it under:

BACKLOG / FUTURE IMPROVEMENT.

---

# IMPLEMENTATION ORDER

Follow this order exactly.

## Phase 1

Code Review

Read both documents completely.

Understand:

* Workflow
* Backend
* Frontend
* Render Engine
* Pipeline
* Validation

Do not code yet.

---

## Phase 2

Implementation Plan

Create a concise implementation plan including:

* Files to modify
* Files to create
* Backend endpoints
* UI components
* Services
* Render pipeline
* Dependencies
* Risks

Do not change requirements.

---

## Phase 3

Implementation

Implement incrementally.

Priority order:

1. Remove Dummy Data
2. Upload Video
3. FFprobe Metadata
4. Target Segment Engine
5. Slot Generator
6. Audio Source
7. Fetch Metadata
8. Pipeline Integration
9. FFmpeg Render Engine
10. Output Verification

---

## Phase 4

Integration

Verify:

Frontend

↓

Backend

↓

FFprobe

↓

FFmpeg

↓

Output Folder

↓

Pipeline

Everything must work together.

---

# REAL DATA POLICY

Everything must be REAL.

Forbidden:

* Dummy Data
* Fake Queue
* Fake Progress
* Fake ETA
* Fake Storage
* Fake Duration
* Fake Metadata
* Hardcoded Outputs
* Mock Render
* Simulated Rendering

If data cannot yet be obtained,

display an appropriate loading state or error state instead of inventing values.

---

# SELF REVIEW

Before finishing,

review every implemented feature.

Minimum checklist:

Upload Video

Source Path

Metadata

Target Segment

Slot Generator

Choose Audio

YouTube Metadata

Pipeline

Render Engine

Output Folder

Watermark

Subscribe Overlay

Progress

Thumbnail

metadata.json

Console Errors

UI Errors

Validation

Acceptance Criteria

Compare implementation against the specification documents.

---

# SELF TESTING

Perform as many tests as possible.

Minimum:

Build

Compile

Run

Routing

Rendering

FFprobe

FFmpeg

Output Folder

API

Dependencies

Console

Unhandled Exceptions

If a test cannot be executed,

explicitly state why.

Do not assume it passed.

---

# RISK ANALYSIS

At the end,

identify possible risks.

Examples:

Race Condition

Memory Leak

FFmpeg Failure

Broken Pipeline

Invalid File

Missing Audio

Large File Performance

Disk Space

Permission Issue

Timeout

File Lock

Do not fix automatically.

Only report.

---

# IMPLEMENTATION REPORT

Provide a report containing:

Summary

Current Status

Completed Items

Pending Items

Known Bugs

Assumptions

Files Modified

Files Created

Backend APIs

Breaking Changes

Risk Analysis

Notes

---

# RUNTIME VERIFICATION

Provide evidence for every completed feature.

Include:

PASS / FAIL

Modified File

Function Name

Code Location

Execution Flow

Console Log

Terminal Log

Verification Method

Do not claim PASS without evidence.

---

# ACCEPTANCE RULE

A feature is considered COMPLETE only if:

1. Code has been implemented.
2. Build succeeds.
3. Runtime behavior matches the specification.
4. No dummy implementation remains.
5. Output is physically verified where applicable.

If any of these fail,

mark the feature as INCOMPLETE.

---

# BACKLOG

Do not implement any new ideas discovered during development.

List them under:

BACKLOG / FUTURE IMPROVEMENT

for discussion in the next sprint.

---

# FINAL DELIVERABLE

At the end of the sprint provide:

1. Implementation Plan
2. Working MVP
3. Self Review
4. Self Testing
5. Risk Analysis
6. Implementation Report
7. Next Sprint Recommendation (3–5 items)

Only then is the sprint considered complete.

---

END OF DOCUMENT
