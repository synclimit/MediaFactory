# M3_TECHNICAL_ARCHITECTURE.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Technical Architecture Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Purpose

Dokumen ini menjelaskan arsitektur teknis Mode 3 secara menyeluruh.

Dokumen ini menjadi acuan implementasi engineer dan Gravity agar seluruh komponen dibangun dengan struktur yang konsisten, modular, dan mudah dipelihara.

Dokumen ini **tidak mengubah UI, workflow, maupun requirement** yang telah disetujui.

---

# 2. High Level Architecture

```text
                 USER
                   │
                   ▼
         React UI (Mode 3 Studio)
                   │
                   ▼
          State Management Layer
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
 Playlist      Composer    Thumbnail
  Engine         Engine       Engine
        └──────────┼──────────┘
                   ▼
        Configuration Builder
                   │
                   ▼
            Queue Builder
                   │
                   ▼
             Pipeline Engine
                   │
                   ▼
            FFmpeg Render Worker
                   │
                   ▼
        video.mp4
        thumbnail.jpg
        metadata.json
```

---

# 3. Layer Architecture

## Layer 1

Presentation Layer

* React
* Components
* Toolbar
* Panels
* Canvas

---

## Layer 2

Application Layer

Berisi seluruh business logic frontend.

Contoh:

* Playlist Builder
* Object Manager
* Template Manager
* Thumbnail Manager

---

## Layer 3

Service Layer

Menghubungkan UI dengan Backend.

Contoh:

* PlaylistService
* TemplateService
* QueueService
* MetadataService

---

## Layer 4

Backend API

Semua request HTTP.

---

## Layer 5

Worker Layer

Berisi:

* Queue Worker
* Render Worker
* Metadata Worker

---

# 4. Recommended Folder Structure

```text
src/

components/
    m3/
        M3StudioPanel.jsx
        M3Toolbar.jsx
        M3AssetsPanel.jsx
        M3PreviewCanvas.jsx
        M3PropertiesPanel.jsx
        M3Timeline.jsx
        M3Statistics.jsx
        M3ThumbnailEditor.jsx

hooks/
    useM3Composer.js
    usePlaylist.js
    useThumbnail.js
    useTemplates.js

services/
    playlist.service.js
    youtube.service.js
    template.service.js
    queue.service.js
    metadata.service.js

store/
    m3.store.js

utils/
    playlist.js
    timestamps.js
    validation.js
    geometry.js

types/
    playlist.js
    objects.js
    template.js

renderer/
    previewRenderer.js
```

---

# 5. Core Engines

Mode 3 terdiri dari beberapa engine independen.

## Playlist Engine

Tugas:

* Import
* Shuffle
* Anti Duplicate
* Duration
* Timestamp

---

## Composer Engine

Tugas:

* Object Management
* Layer
* Transform
* Overlay
* Preview

---

## Thumbnail Engine

Tugas:

* Layout
* Template
* Save
* Export

---

## Configuration Engine

Menggabungkan seluruh konfigurasi menjadi satu payload.

---

## Queue Engine

Mengirim payload ke Pipeline.

---

# 6. Data Flow

```text
Import Audio

↓

Library

↓

Current Playlist

↓

Composer

↓

Preview

↓

Thumbnail

↓

Configuration Builder

↓

Pipeline
```

Semua data mengalir satu arah.

Tidak ada circular dependency.

---

# 7. State Flow

```text
App.jsx

↓

Global M3 State

↓

Child Components

↓

User Interaction

↓

Event Handler

↓

State Update

↓

UI Refresh
```

Single source of truth tetap berada di App.jsx atau store khusus M3.

---

# 8. Object Architecture

Semua object Composer menggunakan model yang sama.

```javascript
{
  id,
  type,
  name,
  x,
  y,
  width,
  height,
  rotation,
  opacity,
  visible,
  locked,
  layer,
  style,
  metadata
}
```

Tidak boleh ada object dengan struktur berbeda.

---

# 9. Object Types

Minimal object yang didukung:

* background
* playlist_title
* current_playing
* custom_text
* track_list_left
* track_list_right
* watermark
* subscribe
* visualizer
* playlist_overlay
* track_counter
* track_change_notification

Semua object mengikuti lifecycle yang sama.

---

# 10. Event Flow

```text
User Click

↓

Event Handler

↓

State Update

↓

Preview Update

↓

Inspector Update

↓

Validation

↓

Ready
```

Tidak boleh ada komponen yang memanipulasi DOM secara langsung.

Semua perubahan melalui state.

---

# 11. Selection Engine

Selection Engine digunakan bersama oleh:

* Composer
* Thumbnail Editor

Workflow:

```text
Click

↓

Selected Object

↓

Outline

↓

Inspector

↓

Edit

↓

Canvas Update
```

Tidak membuat engine selection terpisah.

---

# 12. Drag Engine

Drag hanya mengubah:

* Position X
* Position Y

Resize dan Rotation disiapkan untuk pengembangan berikutnya.

---

# 13. Playlist Engine Architecture

```text
Source

↓

Library

↓

Shuffle

↓

Anti Duplicate

↓

Current Playlist

↓

Timestamp

↓

Metadata
```

Current Playlist selalu menjadi sumber data utama.

---

# 14. Track List Architecture

Track List tidak menyimpan data lagu.

Track List hanya melakukan rendering berdasarkan Current Playlist.

Jika playlist berubah:

↓

Track List otomatis berubah.

Tidak membuat salinan data playlist.

---

# 15. Template Architecture

Template hanya menyimpan:

* Object Position
* Font
* Color
* Style
* Layer
* Visualizer
* Overlay
* Effect

Template tidak menyimpan:

* Audio
* Playlist
* Thumbnail Image
* Background File

---

# 16. Queue Payload Architecture

Queue Payload dibangun dari:

```text
Project

+

Playlist

+

Composer

+

Thumbnail

+

Metadata

↓

Queue Payload
```

Queue Payload menjadi satu-satunya data yang dikirim ke Pipeline.

---

# 17. Dependency Rules

Allowed

```text
Toolbar

↓

Store
```

Allowed

```text
Assets

↓

Store
```

Allowed

```text
Canvas

↓

Store
```

Forbidden

```text
Canvas

↓

Timeline
```

Forbidden

```text
Timeline

↓

Inspector
```

Komponen tidak boleh saling bergantung secara langsung.

Semua komunikasi melalui state.

---

# 18. Performance Strategy

Gunakan:

* React.memo
* useMemo
* useCallback

Preview Canvas hanya me-render object yang berubah.

Hindari re-render seluruh Studio.

---

# 19. Error Flow

```text
Validation

↓

Error

↓

Toast

↓

Stop Action
```

Tidak boleh terjadi silent error.

---

# 20. Lifecycle

```text
Create Project

↓

Import Asset

↓

Build Playlist

↓

Compose

↓

Preview

↓

Thumbnail

↓

Validate

↓

Queue

↓

Pipeline

↓

Render

↓

Complete
```

---

# 21. Integration Rules

Mode 3 hanya boleh berkomunikasi dengan:

* Notification System
* Pipeline
* Workspace
* Metadata Engine
* FFmpeg Worker

Tidak boleh mengakses langsung modul M1, M2, atau M4.

---

# 22. Coding Rules

Gravity wajib:

* Reuse component jika sudah ada.
* Tidak menduplikasi logic.
* Tidak hardcode nilai yang dapat dikonfigurasi.
* Memisahkan UI, business logic, dan service.
* Menggunakan nama fungsi yang deskriptif.
* Menambahkan komentar pada bagian kompleks.

---

# 23. Future Extension Points

Arsitektur harus memungkinkan penambahan tanpa refactor besar.

Contoh:

* Subtitle Engine
* AI Metadata
* AI Thumbnail
* Motion Template
* GPU Preview
* Plugin Visualizer
* Plugin Overlay
* Cloud Render

Semua fitur tersebut harus dapat ditambahkan sebagai engine baru.

---

# 24. Technical Acceptance Criteria

Arsitektur dianggap selesai apabila:

* Tidak ada circular dependency.
* Semua engine modular.
* State memiliki satu sumber kebenaran.
* Komponen saling independen.
* Queue Payload konsisten.
* Track List selalu sinkron dengan Current Playlist.
* Selection Engine digunakan bersama.
* Seluruh struktur siap untuk integrasi backend.

---

# 25. Architecture Freeze

Mulai implementasi:

* Struktur folder tidak boleh diubah tanpa alasan teknis yang kuat.
* Object Model tidak boleh berubah.
* Data Flow tidak boleh berubah.
* Event Flow tidak boleh berubah.
* Dependency Rule tidak boleh dilanggar.

Dokumen ini menjadi acuan resmi arsitektur teknis Mode 3 Playlist Video Studio.
