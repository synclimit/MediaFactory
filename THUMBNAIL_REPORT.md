# Thumbnail & Screenshot Report (MF-600D)

## Approach
Rather than parsing the timeline and duplicating rendering paths, we integrated thumbnail and screenshot capture deeply into the `OutputManager`.

## Generators
- **ScreenshotGenerator**: Captures a high-resolution buffer of the current time by registering a `ScreenshotAdapter`, calling `pipeline.update()`, and immediately returning the rendered frame buffer without affecting the primary UI state.
- **ThumbnailGenerator**: Programmatically scrubs the `timeline`, forces `pipeline.update()`, and extracts the payload via `ThumbnailAdapter`.

## Features Enabled
- Single-point current-frame captures.
- Auto-thumbnailing (equally spaced timestamps).
- Preset thumbnailing (Beginning, Middle, End).
All capturing guarantees perfect fidelity as it strictly utilizes the singular rendering core.
