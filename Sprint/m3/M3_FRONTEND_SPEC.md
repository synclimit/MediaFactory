# M3_FRONTEND_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Frontend Implementation Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini menjelaskan implementasi frontend Mode 3 secara lengkap.

Fokus:

* React Component
* State Management
* UI Interaction
* Event Handler
* Validation
* Local Cache
* Queue Preparation

Dokumen ini **tidak membahas backend**.

---

# 2. Frontend Architecture

```text
App.jsx

│

├── M3StudioPanel

│

├── M3Toolbar

├── M3AssetsPanel

├── M3PreviewCanvas

├── M3PropertiesPanel

├── M3Timeline

├── M3Statistics

└── M3ThumbnailEditor
```

Seluruh state utama tetap berada di App.jsx.

Komponen menerima state melalui props atau context.

---

# 3. State Management

State dibagi menjadi beberapa kelompok.

## Project State

```text
currentProject

projectId

projectStatus

projectDirty

projectReady
```

---

## Background State

```text
backgroundType

image

video

loopMode
```

loopMode:

* Normal
* Seamless
* Ping Pong

---

## Audio State

```text
libraryTracks

currentPlaylist

playlistMode

playlistSize

shuffle

antiDuplicate
```

playlistMode:

* File
* Folder
* YouTube

---

## Preview State

```text
previewPlaying

previewPaused

previewStopped

previewCurrentTime

previewDuration

previewZoom
```

---

## Composer State

```text
selectedObject

selectedGroup

canvasMode

composerObjects
```

canvasMode

* Composer
* Thumbnail

---

## Thumbnail State

```text
thumbnailSaved

thumbnailTemplate

thumbnailImage

thumbnailDirty
```

---

## Queue State

```text
queueReady

queueValidation

queuePayload
```

---

# 4. Component State Ownership

## App.jsx

Owner dari seluruh state global.

Tidak boleh dipindahkan.

---

## M3Toolbar

Hanya membaca state.

Tidak memiliki business logic.

---

## M3AssetsPanel

Mengubah:

* playlist
* background
* visualizer
* effects
* overlay

---

## PreviewCanvas

Mengubah:

selectedObject

dragPosition

previewPosition

---

## Inspector

Mengubah property object.

Tidak membuat object.

---

## Timeline

Mengontrol Preview.

---

## Thumbnail

Mengubah Thumbnail Object.

---

# 5. Event Handler

Semua event harus memiliki handler.

Minimal.

```text
onImportFile()

onImportFolder()

onImportYoutube()

onFetchYoutube()

onGeneratePlaylist()

onShufflePlaylist()

onAddTrack()

onRemoveTrack()

onReorderTrack()

onSelectObject()

onMoveObject()

onUpdateObject()

onDeleteObject()

onAddPlaylistTitle()

onAddCurrentPlaying()

onAddTrackList()

onAddCustomText()

onSaveThumbnail()

onImportThumbnail()

onSaveTemplate()

onApplyTemplate()

onPreviewPlay()

onPreviewPause()

onPreviewStop()

onPreviewRestart()

onAddConfigurationToQueue()
```

Semua handler sudah ada walaupun implementasi backend belum selesai.

---

# 6. Object Model

Seluruh object Composer menggunakan model yang sama.

```text
id

type

category

name

x

y

width

height

rotation

opacity

visible

locked

layer

style
```

Tidak membuat model berbeda untuk Thumbnail.

---

# 7. Track List Object

Track List merupakan object khusus.

Jenis:

track_list_left

track_list_right

track_list_group

Track List membaca Current Playlist.

Bukan menyimpan isi playlist.

---

# 8. Rendering Rules

Canvas dirender berdasarkan object.

Urutan render mengikuti:

Layer Order.

---

# 9. Selection Rules

Single Click

↓

Selected

↓

Outline

↓

Inspector Update

↓

Selection tetap aktif

Selection hanya hilang ketika:

* klik area kosong
* ESC
* object lain dipilih

---

# 10. Drag Rules

Saat drag:

Object Position berubah.

Inspector ikut berubah.

Belum menyimpan database.

---

# 11. Validation Frontend

Background wajib dipilih.

Playlist minimal 1 lagu.

Thumbnail wajib disimpan.

Current Playlist tidak boleh kosong.

Template tidak wajib.

---

# 12. Button Loading

Seluruh proses async memiliki loading.

Contoh:

Fetch YouTube

↓

Loading

↓

Success

atau

↓

Error

---

# 13. Notification

Toast Success

Toast Warning

Toast Error

Tidak menggunakan Alert Browser.

---

# 14. Local Cache

Disimpan sementara.

```text
Current Playlist

Current Objects

Thumbnail

Template

Inspector State
```

Tidak disimpan permanen.

---

# 15. Refresh Behaviour

Refresh browser.

↓

Project belum otomatis dipulihkan.

Auto Recovery belum termasuk sprint ini.

---

# 16. Error State

Komponen wajib memiliki state.

Loading

Empty

Ready

Error

---

# 17. Optimistic Update

Drag object.

↓

UI langsung berubah.

↓

Backend disinkronkan kemudian.

---

# 18. Performance

Gunakan:

React.memo

useMemo

useCallback

untuk komponen berat.

Preview tidak boleh re-render seluruh halaman.

---

# 19. Lazy Loading

Thumbnail Editor boleh di-lazy load.

Composer tetap aktif.

---

# 20. Accessibility

Keyboard:

ESC

TAB

ENTER

SPACE

Support focus indicator.

---

# 21. Frontend Validation Checklist

Validasi:

Background

Playlist

Thumbnail

Queue

Template

Current Playlist

Current Object

---

# 22. Queue Preparation

Saat user menekan:

Add Configuration To Queue

Frontend membangun payload.

Payload dikirim ke Pipeline.

Belum render.

---

# 23. Frontend Acceptance Criteria

Frontend dianggap selesai apabila:

* Seluruh komponen modular.
* State tidak duplikat.
* Event Handler lengkap.
* Selection stabil.
* Drag stabil.
* Inspector sinkron.
* Queue Payload berhasil dibuat.
* Tidak ada memory leak.
* Tidak ada infinite render.
* Tidak ada warning React.

---

# 24. Frontend Freeze

Mulai sprint backend.

Frontend hanya boleh mengalami perubahan:

* Bug Fix
* Performance Improvement
* Backend Integration

Tidak boleh mengubah:

* Layout
* UX
* Workflow
* State Structure

Tanpa persetujuan Product Owner.

Dokumen ini menjadi acuan implementasi React untuk seluruh frontend Mode 3.
