# MediaFactory Platform File Structure V1

## Purpose

Define a universal file structure for:

* M1 Video Factory
* M2 Audio Remix Factory
* M3 Thumbnail Factory
* AutoUploader

This structure must remain consistent across all modules.

---

# Root Structure

```text
MediaFactory/

├── Projects/
├── Output/
├── Templates/
├── Presets/
├── Cache/
├── Logs/
└── Settings/
```

---

# Projects

Purpose

Store project configurations.

```text
Projects/

├── Project_A/
├── Project_B/
└── Project_C/
```

---

Project Structure

```text
Project_A/

project.json

activity.log

m1/

m2/

m3/
```

---

# Output

Purpose

Store rendered outputs.

```text
Output/

├── M1/
├── M2/
├── M3/
```

---

# M1 Output Structure

```text
Output/

M1/

Batch_001/

video.mp4

thumbnail.jpg

metadata.json
```

---

metadata.json

```json
{
  "title": "",
  "description": "",
  "tags": [],
  "source_channel": "",
  "video_id": ""
}
```

---

# M2 Output Structure

```text
Output/

M2/

Batch_001/

output_001.mp3

output_002.mp3

output_003.mp3

metadata.json
```

---

metadata.json

```json
{
  "batch_name": "Batch_001",
  "preset": "Full Bass",
  "target_duration": 900,
  "output_count": 3,
  "created_at": "",
  "outputs": [
    {
      "file": "output_001.mp3",
      "title": "",
      "duration": 0,
      "sources": []
    }
  ]
}
```

---

# M3 Output Structure

```text
Output/

M3/

Batch_001/

thumbnail.jpg

layout.json
```

---

layout.json

```json
{
  "template_name": "",
  "playlist_count": 0,
  "created_at": ""
}
```

---

# AutoUploader Read Rules

AutoUploader never scans entire drive.

AutoUploader only scans:

```text
Output/

M1/

Output/

M2/

Output/

M3/
```

---

# Upload Ready Marker

Purpose

Prevent incomplete uploads.

---

When render starts:

```text
Batch_001/

status.rendering
```

---

When render completes:

```text
Batch_001/

status.ready
```

---

AutoUploader only processes:

```text
status.ready
```

---

AutoUploader ignores:

```text
status.rendering
```

---

# Templates Folder

```text
Templates/

Thumbnail/

Audio/

Naming/
```

---

Thumbnail Templates

```text
Templates/

Thumbnail/

LoFi.template

Reggae.template

Rain.template
```

---

Audio Presets

```text
Templates/

Audio/

FullBass.preset

SlowRemix.preset

ClubMix.preset
```

---

Naming Templates

```text
Templates/

Naming/

DJ_Template.naming

LoFi_Template.naming
```

---

# Presets Folder

```text
Presets/

Audio/

Video/

Render/
```

---

# Cache Folder

Purpose

Temporary files.

```text
Cache/

M1/

M2/

M3/
```

---

Cache files may be deleted automatically.

---

# Logs Folder

Purpose

Store application logs.

```text
Logs/

activity.log

errors.log

render.log
```

---

# Settings Folder

```text
Settings/

app_settings.json

workspace_settings.json
```

---

# Batch Naming Convention

M1

```text
Batch_001
Batch_002
Batch_003
```

---

M2

```text
Batch_001
Batch_002
Batch_003
```

---

M3

```text
Batch_001
Batch_002
Batch_003
```

---

# File Naming Rules

Allowed

Letters

Numbers

Spaces

Underscores

Hyphens

---

Forbidden

```text
< > : " / \ | ? *
```

---

# Future Expansion

Reserved Folders

```text
Output/

M4/

M5/

AutoUploader/

Analytics/
```

---

# Design Principle

Every module must export predictable folder structures.

AutoUploader should never need custom parsing logic for each module.

A completed batch should always be identifiable by:

status.ready

and

metadata.json

This guarantees reliable automation and future scalability.
