# Profile Specification: MediaFactory

This document details the Profile System of MediaFactory, which represents a YouTube channel configuration.

---

## Core Concept
A profile in MediaFactory maps directly to a target YouTube channel's settings, output directories, and default branding configurations. 

### Mapping Rules
* **1-to-1 Relationship**: One profile corresponds to exactly one YouTube channel.
* **Mode Applicability**:
  * **Mode 1**: Uses Profiles (required).
  * **Mode 3**: Uses Profiles (required).
  * **Mode 2**: Does not use Profiles (completely bypassed).

---

## Profile Data Structure
Each profile record contains the following fields:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| **Profile Name** | String (Unique) | Friendly identifier for display within the application. |
| **Channel Name** | String | The target YouTube channel name. |
| **Allowed Mode** | Enum | Restricts profile usage to `Mode 1`, `Mode 3`, or `Both`. |
| **Watermark Asset** | File Path | Local path to the overlay watermark image (PNG). |
| **Subscribe Overlay Asset** | File Path | Local path to the subscribe animation/still asset. |
| **AutoUploader Mapping** | Object | API keys or channel configuration references for the AutoUploader Bridge. |
| **Output Folder** | File Path | Absolute path to the directory where completed renders are saved. |
| **Default Preset** | String / Object | Configuration parameters such as default quality (e.g., 240p for Mode 1, 720p for Mode 3). |

---

## Validation & Restrictions
* **Unique Profiles**: Profile names must be unique. The Profile Manager will reject creation of duplicate profile names.
* **Asset Accessibility**: Watermark and Subscribe Overlay assets must exist locally and be readable at configuration/save time.
* **Output Path Verification**: The Output Folder must point to a valid, writeable local directory path.

---

## User Workflows
Profiles are managed exclusively through the **Right-Side Profile Drawer**.

### Create Profile
1. Open the Profile Drawer.
2. Click **Create New Profile**.
3. Input profile name, channel details, select allowed mode(s), and locate target watermark/branding assets on the local file system.
4. Set default output folders.
5. Click **Save**. The system validates all fields and updates the dropdown selector.

### Edit Profile
1. Select a profile from the Profile Drawer selector.
2. Click **Edit Profile**.
3. Modify configuration parameters.
4. Click **Save Changes** (runs field validations before updating).

### Delete Profile
1. Select a profile in the Profile Drawer.
2. Click **Delete Profile**.
3. Confirm the deletion prompt.
4. The profile is removed. Any unsaved workspace mapping using this profile is reset to blank.
