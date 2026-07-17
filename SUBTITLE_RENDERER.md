# MF-500B: Subtitle Rendering Engine V2

## Architecture Overview

The Subtitle Rendering Engine operates via a strict, zero-allocation pipeline designed for high performance and deterministic rendering. The core principle is that the `SubtitleRuntime` acts as the single source of truth and prepares all rendering values in a shared, mutated state object, which the `SubtitleRenderer.jsx` (React) simply presents without executing any calculations.

### Pipeline Flow

1. **Subtitle Cache**: Whisper JSON outputs are stored and passed to the Runtime.
2. **Subtitle Runtime**: Receives playback time and speed. Prepares all subtitle values into a zero-allocation state object.
3. **Subtitle Layout Engine**: Wraps text, calculates alignments, and determines position. Mutates the layout state. Uses a strict cache to only recalculate when configurations or segments change.
4. **Subtitle Animation Engine**: Registry-based system that computes timestamp-driven animations (Fade, Slide) and applies `opacity` and `offsetY` directly to the state.
5. **Subtitle Renderer**: Copies the fully prepared `Runtime` state into the immutable `RenderFrame`.
6. **React Presentation Layer**: `SubtitleRenderer.jsx` acts purely as a presentation layer. It draws `text`, `opacity`, `transform`, and utilizes `highlightWordId` for highlighting, avoiding any word searching, array slicing, or layout logic.

## Key Components

### 1. SubtitleRuntime
Owns the subtitle state. Prepares `currentSegment`, `currentWord`, `highlightIndex`, `highlightWordId`, `layoutState`, `animationState`, and `diagnostics`. Runs every frame with zero allocations.

### 2. SubtitleLayoutEngine
Handles wrapping, alignment (Bottom/Top/Center), and safe areas. Invalidates cache ONLY when: subtitle, canvas, font, lineHeight, letterSpacing, outline, shadow, padding, or alignment changes. 

### 3. SubtitleAnimationEngine
Computes timestamp-based animation values (`opacity`, `offsetX`, `offsetY`). Refactored to a Registry pattern allowing dynamic registration of new animation styles (`Classic`, `Fade`, `Slide`, `Slide + Fade`) without modifying existing logic.

### 4. Beat Debugger
Provides real-time telemetry on the pipeline, exposing: `Layout Cache Status`, `Layout Time`, `Animation Time`, `Runtime Lookup Time`, `Offset`, `Opacity`, and `Style`.

## Rules Enforced
* Zero allocations per frame.
* No subtitle logic inside React.
* Avoid large switch blocks.
* Caches invalidated strictly.
