# MF-206A — Whisper Cache (Software Design Document)

## 1. Objective

This document serves as the official blueprint for the **Whisper Cache**. The Whisper Cache is responsible for storing transcription results from the Analysis Engine to prevent redundant executions and ensure consistency across multiple features.

This cache is designed to be highly reusable for:
- Subtitle Engine
- Karaoke
- Word Highlight
- Lyric Animation
- Future AI Features

## 2. Object Model

The Whisper Cache adopts a structured and extensible format consistent with the Beat Cache, ensuring uniform data handling across the MediaFactory architecture.

```text
CacheRoot
├── Header
├── Summary
├── Transcript
└── State
```

## 3. Data Structure Specification

### 3.1 Header
The `Header` contains vital metadata to identify the cache's origin and version compatibility.

* `schemaVersion`: Version of the Whisper Cache schema (e.g., `1.0.0`).
* `schemaType`: Identifier for the schema type (e.g., `whisper_cache`).
* `engineVersion`: The version of the transcription engine used to generate the cache.
* `modelVersion`: The specific Whisper model version/size used (e.g., `large-v3`, `medium`).
* `audioHash`: A unique cryptographic hash (e.g., SHA-256) of the source audio file.
* `language`: The explicitly set or primary language for transcription.
* `createdAt`: ISO 8601 timestamp of when the cache was generated.

### 3.2 Summary
The `Summary` section provides high-level statistics and aggregated information about the transcription result.

* `duration`: Total duration of the processed audio (in seconds).
* `segmentCount`: Total number of segments/sentences generated.
* `wordCount`: Total number of words recognized.
* `detectedLanguage`: The language automatically detected by the model (if applicable).
* `averageConfidence`: The average confidence score across all segments/words.

### 3.3 Transcript
The `Transcript` holds the detailed granular data of the speech recognition process. It is separated into three distinct sub-sections to cater to different use cases (e.g., full subtitle rendering vs. word-by-word karaoke).

* `Segments`: Array of transcribed sentences or phrases. Each segment typically includes `text`, `start`, `end`, and `confidence`.
* `Words`: Granular array of individual words. Each word typically includes `text`, `start`, `end`, and `confidence`. This is highly crucial for Karaoke and Word Highlight features.
* `Metadata`: Additional contextual data returned by the transcription model, such as speaker information or background noise indicators.

### 3.4 State
The `State` holds operational or progressive state values if the cache generation involves multiple stages (e.g., pending, processing, completed, failed). 

## 4. Cache Lifecycle & Validation Strategy

To ensure data integrity, the Whisper Cache must be invalidated and regenerated if the underlying context changes. 

The cache is considered **STALE** and must be recomputed if there is a change in any of the following parameters:

1. `audioHash`: The source audio file has been modified.
2. `modelVersion`: A different Whisper model (e.g., upgrading from medium to large) is requested.
3. `engineVersion`: The core Analysis Engine logic has been updated, potentially altering output formats or accuracy.
4. `language`: The target transcription language requirement has changed.
5. `transcriptionParameters`: Any critical parameter passed to the engine (e.g., `beam_size`, `temperature`, `initial_prompt`) has been altered.

If any of these conditions are met, the existing cache is discarded and a new transcription cycle is initiated.

---
**Status**: Ready for Review  
**Note**: This sprint specifically covers the Software Design Document. Implementation, storage handling, UI components, and integrations into the Subtitle Engine are deliberately out of scope for MF-206A.
