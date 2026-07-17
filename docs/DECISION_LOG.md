# Decision Log: MediaFactory

## Architectural & Product Decisions

### DR-001: Local, Offline-First Focus
* **Status**: Accepted
* **Context**: Need a fast, secure, and reliable media automation system that runs on local hardware.
* **Decision**: Architected entirely as a local desktop app. No cloud synchronization, remote storage, or SaaS licensing model.
* **Consequences**: Minimizes operational costs and maintains user data privacy. All computation runs on local CPU/GPU.

### DR-002: No Initial Frontend or Backend Implementation Code
* **Status**: Accepted
* **Context**: Ensure complete alignment on project scope, boundaries, and documentation before writing implementation code.
* **Decision**: Create documentation structure only. Deferred React UI, backend scaffolding, FFmpeg bridge, and uploader implementations.
* **Consequences**: Established solid foundation and guidelines for future phases.

### DR-003: No Sidebar
* **Status**: Accepted
* **Context**: Traditional sidebar navigation divides user focus across multiple disconnected screens.
* **Decision**: Omit all sidebar navigation. The UI operates on a single unified screen layout.
* **Consequences**: Promotes a continuous automation workflow context without switching screens.

### DR-004: Mode 2 Has No Profile
* **Status**: Accepted
* **Context**: Mode 2 is intended for fast, randomized audio compilation output only.
* **Decision**: Completely bypass profiles for Mode 2 workflows.
* **Consequences**: Users can quickly compile audio batches without preset management overhead.

### DR-005: Queue Never Stops On Failure
* **Status**: Accepted
* **Context**: Long-running automated queues can stall overnight if a single job fails.
* **Decision**: Enforce that a job failure moves the item to the Failed Queue and the engine immediately proceeds to the next item.
* **Consequences**: Ensures maximum queue throughput during unattended execution.

### DR-006: Auto Retry 2x
* **Status**: Accepted
* **Context**: Minor filesystem locks or transient process errors can cause rendering to fail.
* **Decision**: Automatically retry failed rendering tasks up to exactly 2 times before marking them as failed.
* **Consequences**: Reduces manual intervention for temporary issues.

### DR-007: Validation Before Upload
* **Status**: Accepted
* **Context**: Uploading broken or zero-byte videos wastes user bandwidth.
* **Decision**: Require post-render integrity checks (file size, readability via ffprobe) before initiating AutoUploader routines.
* **Consequences**: Guarantees only healthy files are uploaded.

### DR-008: Static Workspace Layout
* **Status**: Accepted
* **Context**: Resizable panels in desktop environments can cause critical action buttons to shift off-screen.
* **Decision**: Maintain a fixed, static full-screen desktop layout matching the viewport boundaries.
* **Consequences**: Eliminates unexpected UI breakage and keeps critical controls anchored.

### DR-009: Right Side Profile Drawer
* **Status**: Accepted
* **Context**: Profile selections and parameters consume significant space if mixed directly into input forms.
* **Decision**: Place all profile management and settings panels in a persistent right-side drawer.
* **Consequences**: Keeps the main workspace clean and focused on asset allocation.

### DR-010: Mode 3 Default 720p
* **Status**: Accepted
* **Context**: Playlist videos are typically long and rendering them in high resolution requires substantial hardware resources.
* **Decision**: Set the default output quality for Mode 3 to 720p, with 1080p selectable as an option.
* **Consequences**: Balances rendering performance with acceptable viewing quality for target creators.

### DR-011: Mode 1 Default 240p
* **Status**: Accepted
* **Context**: Mode 1 generates large numbers of videos from a single source video, making render speeds critical.
* **Decision**: Set the default output quality for Mode 1 to 240p, with 360p available as an option.
* **Consequences**: Ensures high-speed output generation for high-volume content creators.

### DR-012: Internal Panel Scroll Only
* **Status**: Accepted
* **Context**: Main window scrollbars disrupt static layouts and hide header controls.
* **Decision**: Lock the main window viewport scroll and apply overflow rules to inner components (Queue, Workspace inputs, Profile list) only.
* **Consequences**: Keeps mode selectors and action buttons persistently visible.
