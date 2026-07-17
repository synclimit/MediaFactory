# Export Engine Report (MF-600B)

## Foundation Established
The Export Engine architecture completely decouples offline rendering from real-time playback.
- **ExportManager**: Orchestrates the interaction between the `ExportQueue`, `RenderScheduler`, and the underlying FFmpeg interface.
- **RenderScheduler**: Operates synchronously to step through the `RenderPipeline` exactly once per frame interval, ensuring frame-perfect deterministic offline rendering without dropping frames.
- **FFmpegPipeline** (Architecture Stub): Interfaces for `initialize()`, `ingestFrame()`, and `finalize()` have been prepared, ready to consume `OutputAdapter` pixel arrays without pipeline modification.

## Control Surface
The `ExportManager` fully exposes standard operations: `pause`, `resume`, `cancel`, and detailed progress tracking callbacks.
