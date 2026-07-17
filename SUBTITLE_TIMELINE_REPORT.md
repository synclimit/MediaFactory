# Subtitle Timeline Report

## Architecture
- **M3SubtitleTimelinePanel.jsx**: New standalone component mounted at the bottom of the `M3StudioPanel`.
- Reads `subtitleRuntime.document` for live layout of subtitle blocks on the timeline.
- Zoom slider dictates pixels per second scale, adjusting the track width and segment dimensions perfectly.
- Listens to `SubtitleEditorService` for live layout updates (dirty state, dragging, selected segment).

## Features Implemented
- **Segment Blocks**: Subtitles are displayed as track segments with accurate widths corresponding to duration.
- **Drag & Resize**: Implemented pointer events allowing horizontal translation of segments and edge resizing (Start / End), committing directly back to `SubtitleEditorService`.
- **Selection Highlight**: Selected segments are highlighted in bright orange for visual feedback.
- **Live Sync**: Changes correctly update `SubtitleRuntime` and trigger `subtitleRuntime.update()` for instant renderer feedback without playback restart.
