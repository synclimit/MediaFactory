# MediaFactory AI Handoff

## 1. Project Summary
MediaFactory is a desktop application (built with Vite, React, and an embedded Node backend `vite-plugin-render-engine.js`) designed to compile, preview, and render automated audio/video compilations. Currently, the active phase focuses on Mode 2 (Audio Compilation Engine), which orchestrates Source files, Audio Processing Profiles, Render Plans, and a Queue-based FFmpeg Rendering Engine.

## 2. Current Status
The project is currently in **Phase 4 Production UX**. Most core structural UI systems for Mode 2 are completed and functional, including the Source Pool, Audio Profiles, Workspace, Render Plans, Queue, and Native Pickers. Render Queue jobs currently have a known issue during asset resolution, halting the pipeline just before final FFmpeg execution.

## 3. Architecture Overview
**Mode 2 Full Pipeline**
Source -> Compilation Workspace -> Render Plans -> Queue -> Render Engine -> Output Files

*   **Source Pool**: Manages audio files, folder imports, and YouTube URLs. Includes native pickers.
*   **Compilation Workspace**: Combines sources into distinct output definitions.
*   **Render Plans**: Generated from the Workspace; acts as the blueprint for an output.
*   **Queue**: Captures immutable snapshots of Render Plans to execute.
*   **Render Engine**: A Vite plugin-based local backend spawning FFmpeg processes for real audio processing.
*   **Cache Flow**: Resolves local paths and fetches YouTube downloads via yt-dlp before FFmpeg execution.

## 4. Completed Features
*   **Mode 2 UI/UX:** Source Pool, Clean Title Editing, Audio Preview, Preset Library.
*   **Render Architecture:** Multi-Output Generation, Render Plans, Queue System.
*   **Backend Integration:** Real Audio Preview generation, Real FFmpeg Rendering hooks.
*   **UX Enhancements:** Output Result UX (play output, open folder), Native File/Folder Pickers.
*   **Cache Subsystem:** Full cache stats, integrity validation, orphan cleaning (combining backend memory and explicit client-side localStorage keys), and Last Validated persistence.

## 5. Open Tasks
The remaining tasks in the Mode 2 roadmap:
*   10D - Cache Manager (COMPLETE)
*   10D-A - Cache Orphan Detection Hotfix (COMPLETE)
*   10E - Scheduler (IMPLEMENTED - AWAITING FINAL VERIFICATION)
*   10F - Not Started
*   10G - Render Audit (COMPLETE)
*   10H - Render Analytics & History Engine (COMPLETE)
*   10I - Production Template System (COMPLETE)

## 6. Known Issues
*   Any remaining filename sync issues.
*   Any remaining preview issues.
*   Any remaining queue issues.

## 7. Recommended Next Task
**Task 10J - Batch Production Engine**
Scale the compilation engine to automatically generate massive quotas.

## 8. NEXT SESSION PRIORITY
1. Finish Task 10E Verification
2. Begin Task 10J

**Known Risk:**
Scheduler currently verified by code audit and mockup evidence, but final runtime UI proof is still pending.

**Recent History Subsystem Updates:**
- Render Analytics (`mediafactory_m2_render_history`) has been implemented as a strictly pure service managing an immutable history log.
- Maximum capacity of 500 records is enforced at the service layer to prevent localStorage blowout, while the UI table restricts DOM rendering to 50 items.
- Activity Logs for Analytics (`[M2 Analytics] History Added/Cleared/Corrupted`) are cleanly separated from the storage layer and dispatched via `App.jsx`.

**Recent Template System Updates:**
- The Template Manager (`mediafactory_m2_templates`) has been built to save global workflow states for Mode 2.
- It strictly forbids saving fixed paths (`localPath`) to maintain portability and enforce security constraints.
- When reaching the 100 limit, it securely throws a `TEMPLATE_LIMIT_REACHED` exception rather than blindly pruning older templates, ensuring no unintended data loss occurs.