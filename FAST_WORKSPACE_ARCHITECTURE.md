# MediaFactory Fast Workspace — Complete Technical Architecture Manual

## Version: v2.0.0 (Production Release)
**Status**: PRODUCTION RELEASED & CERTIFIED  
**Architecture Freeze**: ACTIVE  

---

## Table of Contents
1. [Overview & High-Level Architecture](#1-overview--high-level-architecture)
2. [Workspace Runtime & Lifecycle](#2-workspace-runtime--lifecycle)
3. [RenderingContext API Reference](#3-renderingcontext-api-reference)
4. [CompositionGraph & Timeline Composition Engine](#4-compositiongraph--timeline-composition-engine)
5. [Procedural Adaptation Framework](#5-procedural-adaptation-framework)
6. [Visual Validation Engine](#6-visual-validation-engine)
7. [WYSIWYG Live UI Integration](#7-wysiwyg-live-ui-integration)
8. [Extension Points & Plugin System](#8-extension-points--plugin-system)

---

## 1. Overview & High-Level Architecture

MediaFactory Fast Workspace provides a 30x–360x accelerated rendering workflow by switching live playback and export from frame-by-frame audio reactivity evaluation to a deterministic procedural loop model.

### Single Gateway Control Flow
$$\text{UI Layer} \longrightarrow \text{RenderingContext} \longrightarrow \text{CompositionGraph} \longrightarrow \text{AdaptationEngine} \longrightarrow \text{ValidationEngine}$$

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            UI PRESENTATION LAYER                            │
│  M3PreviewCanvas  │  M3ObjectInspector  │  M3Toolbar  │  SubtitleTimeline   │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ (RenderingContext Gateway Only)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RENDERING CONTEXT (GATEWAY)                       │
│  isFastWorkspace  │  getPreviewObjects  │  getInspectorValidationSummary    │
└────────┬──────────────────────────┬───────────────────────────┬─────────────┘
         │                          │                           │
         ▼                          ▼                           ▼
┌──────────────────┐      ┌───────────────────┐      ┌────────────────────────┐
│ COMPOSITIONGRAPH │      │ ADAPTATION ENGINE │      │    VALIDATIONENGINE    │
│ Segment Router   │      │ Procedural Wave   │      │ Structural & Hint      │
│ Intro/Loop/Outro │      │ Noise/FFT Caches  │      │ ValidationReport       │
└──────────────────┘      └───────────────────┘      └────────────────────────┘
```

---

## 2. Workspace Runtime & Lifecycle

- **`WorkspaceRuntime`**: Base abstraction enforcing mode separation (`NORMAL` vs `FAST`).
- **`NormalWorkspaceRuntime`**: 100% isolated legacy environment with standard real-time audio listeners.
- **`FastWorkspaceRuntime`**: Fast workspace environment binding `FastLoopProvider`, `FastProceduralProvider`, and `FastValidationProvider`.
- **`FastWorkspaceManager`**: Central singleton orchestrating non-destructive workspace mode switching (`switchWorkspace('FAST')` / `switchWorkspace('NORMAL')`).

---

## 3. RenderingContext API Reference

`RenderingContext` is the **sole gateway** between UI components and backend engine modules.

### Public Methods:
- `isFastWorkspace`: Boolean indicating if Fast Workspace is active.
- `getPreviewObjects(objects, timeSec)`: Adapts visual objects procedurally at timecode `timeSec` and formats layer badges.
- `getInspectorValidationSummary(object)`: Retrieves validation status, classification metadata, loop quality, boundary status, and unsupported feature warnings for an object.
- `getTimelineCompositionSummary()`: Retrieves CompositionGraph segments (`Intro`, `Loop`, `Outro`, `Loop Preview`), active segment, and validation score.
- `getBoundaryValidationFeedback()`: Retrieves boundary continuity validation results and warning/error counts.
- `adaptObject(object, timeSec, masterLoopDuration, seed)`: Procedurally adapts a single object using the active `ProceduralProvider`.
- `validateProject(adaptationResults)`: Evaluates CompositionGraph & adaptation hints via `ValidationEngine`.

---

## 4. CompositionGraph & Timeline Composition Engine

- **`CompositionGraph`**: Canonical playback model containing immutable, typed segments (`Intro`, `Loop`, `Outro`, `Loop Preview`) with metadata (`id`, `startTime`, `endTime`, `duration`, `loopable`, `children`).
- **`TimelineRouter`**: Canonical routing authority determining route decisions (`route`, `targetSegment`, `adaptationStrategy`, `validationRequired`, `classification`).
- **`TimelineComposer`**: Assembles the `CompositionGraph` from project state without feature-specific conditionals.

---

## 5. Procedural Adaptation Framework

- **`StrategyRegistry`**: Registry of procedural adaptation strategies (`PeriodicNoiseStrategy`, `FFTCacheStrategy`, `SeededNoiseStrategy`).
- **`AdaptationDispatcher`**: Dispatches objects to matching strategies based on capability classification (`LoopNative`, `LoopAdapted`, `TimelineOnly`, `Unsupported`).

---

## 6. Visual Validation Engine

- **`ValidationEngine`**: Read-only validator executing structural continuity checks, boundary alignment checks, missing region checks, and adaptation hint evaluations.
- **`ValidationReport`**: Recursively frozen value object containing deterministic `score` (0–100), `warnings`, `errors`, `affectedSegments`, and `boundaryContinuityResults`.

---

## 7. WYSIWYG Live UI Integration

The live editor UI acts strictly as a presentation layer:
- **`M3PreviewCanvas`**: Renders adapted objects from `renderingContext.getPreviewObjects()`.
- **`M3ObjectInspector`**: Renders property controls and validation cards from `renderingContext.getInspectorValidationSummary()`.
- **`M3Toolbar`**: Displays Fast Workspace status and live validation score (`⚡ FAST WORKSPACE (100% VALID)`).
- **`M3SubtitleTimelinePanel`**: Displays dual-ruler loop boundaries and composition graph segment markers.

---

## 8. Extension Points & Plugin System

`FastWorkspaceRuntime` provides pluggable extension providers:
- `LoopProvider` (`FastLoopProvider`): Manages loop time calculation and period synchronization.
- `ProceduralProvider` (`FastProceduralProvider`): Manages procedural wave generation and cache lookup.
- `ValidationProvider` (`FastValidationProvider`): Manages ValidationEngine execution.

---

*MediaFactory Fast Workspace v2.0.0 Architecture Manual Certified & Sealed.*
