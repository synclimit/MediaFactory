# Workflow Guardrails: MediaFactory

This document defines the strict validation rules, retry policies, and queue protection protocols enforced by the MediaFactory automation engine.

---

## Mode-Specific Rules

### Mode 1 Rules
* **Required profile**: A processing profile configuration must be actively selected.
* **Input video matching**: Only a single input video file is allowed.
* **Slot allocation**: Audio tracks must be assigned to available calculated slots.
* **Validation & Upload**: Must complete video integrity validation before being sent to the AutoUploader.

### Mode 2 Rules
* **No Profile**: Presets and profiles are ignored; system uses standard audio compilation rules.
* **No Uploader**: AutoUploader is entirely bypassed; output files are saved strictly to the local disk.
* **Target Duration**: Each output compilation target must approximate 15 minutes.
* **Silence Check**: Output audio files must undergo silence detection analysis.

### Mode 3 Rules
* **Required profile**: A profile must be selected.
* **Background requirement**: Exactly one background asset (either an image or video) must be uploaded.
* **Default quality**: Render outputs default to 720p (with 1080p selectable under profile options).
* **Companion assets**: Thumbnail files and timestamp lists must be generated alongside the video.

---

## Interactive Interface & Action Controls

### Profile Position Conflicts
* **Watermark & Subscribe Overlay positions**: Both parameters must never match. If a user sets the same position for both overlays inside the Profile Manager (e.g. both top-right), the system triggers a validation error notification and blocks saving the profile.

### Button Enable/Disable Logic
* **"Add To Queue" Button**:
  * Disabled by default.
  * Enabled only when the user satisfies the active mode's input criteria (e.g., valid profile selected, background asset present, audio list is non-empty, and target paths verified).
* **"Start Render" Button**:
  * Enabled when the Queue contains one or more valid jobs in a pending state.
  * Disabled when rendering is currently running or when the Queue is empty.

### Add To Queue Conditions
To add a task to the queue, the Validation Engine checks:
1. Target input assets exist locally and are accessible.
2. Selected profile conforms to Mode constraints.
3. Path configurations are writeable and have sufficient space (Storage Estimation Engine check).

### Start Render Conditions
To start executing a queued item:
1. The Queue Engine must not have another active job rendering.
2. System resource check validates FFmpeg can run without system lockup.
3. Post-queue pre-check verifies source files are still present at the specified paths.

---

## Asset & Duplicate Safety

### Duplicate Asset Warning
* The Duplicate Detection Engine checks input asset hash records before queuing.
* If the exact same audio playlist combinations or video background configuration was recently rendered, the system shows a warning prompt in the UI to prevent redundant render cycles.

---

## Processing & Error Policies

### Validation Conditions
Rendered outputs must pass these checks prior to AutoUploader actions:
* File exists and size is greater than zero.
* Video resolution (e.g., 240p/360p in Mode 1, 720p/1080p in Mode 3) matches configuration.
* Duration matches expected playlist runtime.
* The output is readable (e.g., passes quick ffprobe scan without stream errors).

### Retry System
* If rendering fails due to execution or process interruptions, the Retry Engine triggers.
* The system automatically retries the render up to exactly 2 times.
* A cooling delay is applied between attempts.

### Failed Queue
* When a task fails after exhausting the 2-retry limit, it is labeled `Failed` and relocated to the Failed Queue.
* Detailed error logs are attached to the job database entry for inspection.

### Queue Never Stops on Failure
* If a job fails during processing, the Queue Engine logs the error, moves the job to the Failed Queue, and immediately proceeds to process the next job in the sequence. A failure does not pause or block the automation pipeline.

---

## Daily Summaries

### Morning Report
* The Notification Center compiles a report daily or upon initial app startup.
* The report logs:
  * Total rendered output files.
  * Total playlist duration generated.
  * Success and failure statistics.
  * Detailed diagnostic list of failed queue items.
