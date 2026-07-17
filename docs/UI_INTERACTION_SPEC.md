# UI Interaction Specification: MediaFactory

This document defines the layout rules, interactive components, state changes, and navigation flows of the MediaFactory UI shell.

---

## Layout Core Constraints
* **No Sidebar**: Multi-view sidebar navigation is absent. The application operates in a single dashboard viewport.
* **Static Layout**: UI panels remain fixed to the desktop screen size. Resizing does not cause container displacement.
* **Internal Panel Scroll Only**: Global page scrolling is disabled. Scrollbars exist strictly inside content containers.
* **Right Profile Drawer**: Toggleable sliding pane on the right side of the screen dedicated to managing profile channel presets.

---

## Mode Selection Interactions

### Mode 1 Selected
* **What Appears?**
  * Profile Selector dropdown (required).
  * Source video drag-and-drop file uploader area.
  * Audio file upload grid showing calculated loop slots.
  * Quality select toggle (240p default, 360p optional).
* **What Disappears?**
  * Mode 2 audio compilation directory selectors.
  * Mode 3 watermark/subscribe/intro option toggles (except watermark/subscribe indicators set by the active profile).
* **What Actions Become Available?**
  * Upload single video source file.
  * Map uploaded audio tracks to calculated slots.
  * Configure specific Mode 1 output paths.

### Mode 2 Selected
* **What Appears?**
  * Batch audio directory uploader (multi-file select).
  * Target duration indicator (fixed to approximately 15 minutes).
  * Randomization playlist toggle.
* **What Disappears?**
  * Profile Selector dropdown (completely hidden).
  * Source video uploader.
  * Mode 3 intro, watermark, and overlay options.
  * AutoUploader config details.
* **What Actions Become Available?**
  * Upload batch audio.
  * Randomize input list sorting.
  * Specify output destination paths (local disk download only).

### Mode 3 Selected
* **What Appears?**
  * Profile Selector dropdown (required).
  * Background image/video file uploader.
  * Multi-track audio file list uploader.
  * Option checkboxes: Enable Intro, Enable Watermark, Enable Subscribe Overlay.
  * Video quality toggle (720p default, 1080p optional).
  * Thumbnail and Timestamp destination folder fields.
* **What Disappears?**
  * Mode 1 multi-slot looping assignment panels.
  * Mode 2 strict 15-minute limit constraints.
* **What Actions Become Available?**
  * Upload background asset and audio list.
  * Toggle watermark overlays and intro video attachments.
  * Auto-parse track names and metadata.

---

## Profile Drawer Interactions

When the Right-Side Profile Drawer is opened, it exposes the channel presets management view:

### Create Profile
* Clicking **Create New Profile** opens a form within the drawer.
* Fields: Profile Name, Channel Name, Allowed Modes (Mode 1, Mode 3, or Both), Watermark path, Subscribe Overlay path, AutoUploader channel credentials, Output folder, and Default Preset resolution.
* The **Save** button is disabled until Name, Channel Name, and Output Folder paths are specified.

### Edit Profile
* Selecting an existing profile exposes editable fields.
* Clicking **Save Changes** validates fields and updates active configuration mappings.

### Delete Profile
* User clicks **Delete**.
* A confirmation prompt appears within the drawer.
* Confirming clears the profile from memory and drops it from the main Workspace selector.

---

## Queue & Process Interactions

### Queue Management Actions

| Action | UI Interface Trigger | Effect / State Change | Enable/Disable Condition |
| :--- | :--- | :--- | :--- |
| **Add To Queue** | Button in Main Workspace | Appends a new item to the Pending Queue list. Resets input forms. | Disabled unless all required inputs for the active mode are populated and validated. |
| **Edit Queue** | Inline edit icon on item | Pulls item details back into the Workspace. Set state to Draft. | Enabled only for jobs in `Pending` or `Failed` status. |
| **Delete Queue** | Inline trash icon on item | Removes the item from queue lists. Triggers FFmpeg process cancel if running. | Enabled for all items. |
| **Duplicate Queue**| Inline copy icon on item | Appends an identical copy of the job configuration as a `Pending` task. | Enabled for all items in the queue list. |
| **Start Render** | Primary action button near Queue | Begins serial execution of tasks in `Pending` state. | Enabled only if at least one `Pending` job exists in the Queue. |

---

## User Navigation Flow
1. **Launch App**: App starts displaying Mode 1 workspace by default. Right Profile Drawer is closed.
2. **Configure Channel Profile** (if Mode 1/3): User clicks "Profiles" button, drawer slides out from the right, user creates or selects a profile, then closes drawer.
3. **Select Mode**: User clicks Mode 1, 2, or 3 selector at the top. Workspace content updates instantly.
4. **Prepare Assets**: User uploads background, media, and playlist components.
5. **Add to Queue**: User verifies parameters, then clicks **Add To Queue**. The job is listed in the Queue Panel at the bottom.
6. **Execute Render**: User clicks **Start Render**. Real-time log stream details run within the Queue Panel.
7. **Complete/Review**: User verifies rendering outputs or diagnostics in the Queue Panel status indicators.
