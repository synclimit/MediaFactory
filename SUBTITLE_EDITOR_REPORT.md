# Subtitle Editor Report

## Architecture
- **SubtitleEditorService.js**: New stateless mediator decoupled from the high-performance core engine `SubtitleRuntime`. 
- Handles the state history without polluting the runtime metrics.
- Manages an efficient `undoStack` and `redoStack` with shallow copying where appropriate.

## Features Implemented
- **Undo / Redo Stack**: Ctrl+Z (Undo) and Ctrl+Y (Redo) supported via keyboard event listeners globally mounted by the Editor Service. History cap protects memory limits.
- **Text Editing**: Double-clicking a segment block initiates an inline text input. Upon blur or 'Enter', the text is committed, and internal `words` objects are automatically scaled to fit the new text over the segment's duration without re-running Whisper.
- **Word Editing Support**: The `SubtitleEditorService` implements `updateWord` explicitly, exposing API for precise timing/text offsets.
- **Live Style Switcher**: The Timeline Toolbar now exposes a direct `select` dropdown modifying `subtitleRuntime.getState().style` spanning all newly implemented production styles (Classic, Fade, Slide, Slide + Fade, Highlight, Rolling Lyrics).
- **Beat Debugger Integration**: The Subtitle Pipeline panel of the Beat Debugger was cleanly expanded to 6 columns, exposing Editor Mode, Selected Segment Index, Dirty flag, and Undo Stack Size globally.
