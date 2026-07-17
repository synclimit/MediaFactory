# MF-206B — Transcript Contract Lock

## 1. Objective

This document defines the **Transcript Contract**, the official and universal blueprint for all transcription results within the MediaFactory ecosystem. Whisper is merely one of the available Analysis Engines. The architecture mandates that **all** Analysis Engines, present and future, must strictly adhere to and produce this identical Transcript Contract.

## 2. Responsibilities

The Transcript Contract acts as the single source of truth. It is the exclusive format designed to be understood and processed by all downstream components:

* Subtitle Engine
* Karaoke
* Lyric Animation
* Translation
* AI Caption
* Future Analysis Engines

## 3. Object Model

The structure of the Transcript Contract is standardized across the entire platform. The minimum required fields are defined as follows:

```text
TranscriptContract
├── Header
├── Summary
├── Segments
├── Words
├── Analysis
└── Metadata
```

### 3.1 Header
Information about the engine and environment that produced the contract. 
*(e.g., schema version, engine name, model used, audio hash, timestamps)*

### 3.2 Summary
Aggregated statistics of the transcript.
*(e.g., total duration, total segments, total words, primary detected language, overall confidence score)*

### 3.3 Segments
An array containing sentence-level or phrase-level text strings. Includes start and end timestamps, along with segment-level confidence.

### 3.4 Words
A highly granular array of individual words. Includes exact start and end timestamps. Essential for synchronization-heavy features like Karaoke and Word Highlight.

### 3.5 Analysis
Contextual and analytical metrics derived by the engine beyond raw text. 
*(e.g., voice activity detection (VAD), speaker diarization, silence intervals, emotion/sentiment indicators)*

### 3.6 Metadata
Additional auxiliary data required for routing, processing, or future extensibility.

## 4. Immutable Rules & System Constraints

To maintain data integrity and a clean architectural separation of concerns, the following rules apply:

1. **Immutable Transcript:** Once generated, the Transcript Contract is completely **immutable**.
2. **Engine Restriction:** The Subtitle Engine (and any other consuming engine) is strictly prohibited from modifying the Transcript Contract. 
3. **Workspace Separation (User Editing):** User-driven modifications, edits, and adjustments are stored and performed on an entirely separate layer known as the **Subtitle Workspace**. The Transcript Contract remains untouched as the pristine original source.
4. **Engine Output Guarantee:** The Whisper Analysis engine (or any competing analysis engine) is constrained to only output the Transcript Contract. It must not handle UI state, editing logic, or storage mutations.

---
**Status**: Ready for Review  
**Foundation**: This Transcript Contract serves as the foundational data payload that will be stored within the Whisper Cache Model (as defined in MF-206A). No code implementation has been made in this sprint.
