# M3_BACKEND_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Backend Implementation Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini menjadi acuan implementasi backend Mode 3.

Backend bertanggung jawab untuk:

* memproses seluruh konfigurasi dari Frontend,
* membangun playlist,
* mempersiapkan render,
* menghasilkan metadata,
* mengirim pekerjaan ke Pipeline,
* mencatat aktivitas.

Backend **tidak menangani UI**.

---

# 2. Backend Architecture

```text
Frontend

↓

Validation

↓

Configuration Builder

↓

Playlist Engine

↓

Composer Engine

↓

Thumbnail Engine

↓

Metadata Engine

↓

Queue Builder

↓

Pipeline

↓

FFmpeg Worker

↓

Output
```

Backend harus modular.

Setiap engine berdiri sendiri.

---

# 3. Backend Modules

## Playlist Engine

Bertugas:

* membaca source audio
* membangun Current Playlist
* melakukan shuffle
* anti duplicate
* menghitung durasi

---

## Composer Engine

Bertugas:

* membaca Composer Object
* membaca Layer
* membaca Visualizer
* membaca Overlay
* membangun Render Configuration

---

## Thumbnail Engine

Bertugas:

* membaca Thumbnail Object
* menghasilkan Thumbnail Configuration

Belum melakukan render image.

---

## Metadata Engine

Membangun:

metadata.json

Berisi:

* title
* playlist
* timestamps
* duration
* thumbnail
* render configuration

---

## Queue Builder

Mengubah seluruh konfigurasi menjadi Queue Payload.

---

# 4. Business Flow

```text
Receive Configuration

↓

Validate

↓

Build Playlist

↓

Generate Timestamp

↓

Build Composer Config

↓

Build Thumbnail Config

↓

Build Metadata

↓

Create Queue Job

↓

Return Success
```

---

# 5. Playlist Engine

## Input

File

Folder

YouTube

---

## File Mode

User memilih beberapa file.

Playlist mengikuti urutan user.

---

## Folder Mode

Engine membaca seluruh isi folder.

↓

Menghasilkan Library.

↓

Shuffle.

↓

Generate Playlist.

---

## YouTube Mode

URL

↓

Fetch Metadata

↓

Download Audio (worker terpisah)

↓

Masuk Library

↓

Current Playlist

---

# 6. Playlist Builder

Menghasilkan:

```text
Track 1

Track 2

Track 3

...

Track N
```

Setiap track memiliki:

* id
* title
* duration
* source
* local path

---

# 7. Shuffle Engine

Shuffle dilakukan sebelum playlist dibuat.

Random menggunakan seed.

Tidak menggunakan random sederhana.

Target:

hasil lebih stabil.

---

# 8. Anti Duplicate Engine

Jika Folder Mode digunakan.

Backend mencatat kombinasi playlist.

Playlist berikutnya harus berbeda.

Selama kombinasi masih tersedia.

---

# 9. Duration Calculator

Backend menghitung:

Total Playlist Duration.

Hasil digunakan oleh:

* Preview
* Timeline
* Metadata
* Render

---

# 10. Timestamp Generator

Timestamp dibuat otomatis.

Contoh:

```text
00:00 Song A

03:41 Song B

07:58 Song C
```

Tidak boleh berasal dari frontend.

---

# 11. Composer Engine

Membaca:

Background

Overlay

Visualizer

Effects

Track List

Current Playing

Playlist Title

Custom Text

Layer

Transform

Style

---

Menghasilkan:

Composer Configuration.

---

# 12. Thumbnail Engine

Membaca:

Thumbnail Objects.

↓

Menghasilkan:

Thumbnail Configuration.

Belum menghasilkan JPEG.

Render Thumbnail dilakukan saat proses render.

---

# 13. Metadata Builder

Output:

metadata.json

Minimal:

```json
{
  "title":"",
  "playlist":[],
  "duration":"",
  "thumbnail":"",
  "background":"",
  "renderProfile":"",
  "workspace":"",
  "timestamps":[]
}
```

---

# 14. Configuration Builder

Menggabungkan:

Playlist

Composer

Thumbnail

Metadata

↓

Menjadi:

Queue Payload.

---

# 15. Queue Payload

Minimal:

```text
projectId

background

playlist

objects

thumbnail

metadata

renderProfile

outputPath
```

---

# 16. Queue Integration

Backend memanggil Queue Engine.

↓

Queue membuat Job.

↓

Mengembalikan:

Job ID.

---

# 17. Worker

Worker membaca Job.

↓

Memanggil FFmpeg.

↓

Render.

↓

Update Progress.

---

# 18. Validation

Backend wajib memvalidasi.

Background ada.

Playlist tidak kosong.

Thumbnail tersedia.

Minimal satu object Composer.

Output Path valid.

---

# 19. Activity Log

Catat:

Project dibuat.

Playlist dibuat.

Thumbnail disimpan.

Queue dibuat.

Render dimulai.

Render selesai.

Render gagal.

---

# 20. Scheduler

Backend tidak menjalankan render langsung.

Scheduler Pipeline menentukan kapan render dimulai.

---

# 21. Queue Status

Status:

Waiting

Queued

Rendering

Completed

Failed

Cancelled

---

# 22. Error Handling

Kemungkinan Error.

Background hilang.

Playlist kosong.

Folder tidak ditemukan.

Audio rusak.

Metadata gagal.

Thumbnail belum disimpan.

Output Path tidak valid.

Queue gagal.

Worker gagal.

FFmpeg gagal.

---

# 23. Retry Policy

Retry hanya dilakukan pada:

Queue Error

Worker Error

Tidak melakukan retry jika validasi gagal.

---

# 24. Logging

Gunakan:

Application Log

Render Log

Worker Log

Queue Log

Jangan menggunakan console.log sebagai logging utama.

---

# 25. Backend Performance

Playlist dibangun sekali.

Metadata dibangun sekali.

Configuration immutable.

Gunakan cache untuk:

Library

Playlist

Metadata

---

# 26. Security

Validasi seluruh path.

Cegah:

Directory Traversal

Invalid File Extension

Invalid URL

File Injection

---

# 27. Backend Acceptance Criteria

Backend dianggap selesai apabila:

* Playlist berhasil dibangun.
* Timestamp benar.
* Metadata benar.
* Queue Payload valid.
* Queue berhasil dibuat.
* Worker dapat membaca Queue.
* Tidak ada data corrupt.
* Error handling berjalan.

---

# 28. Future Backlog

Tidak termasuk sprint ini:

* AI Metadata
* AI Thumbnail
* Whisper Subtitle
* Auto Lyrics
* Cloud Render
* Distributed Worker
* GPU Preview
* Smart Playlist Recommendation

---

# 29. Backend Freeze

Mulai implementasi:

Tidak boleh mengubah:

* Workflow
* Queue Structure
* Metadata Structure
* Composer Structure
* Thumbnail Structure

Tanpa persetujuan Product Owner.

Dokumen ini menjadi acuan implementasi seluruh backend Mode 3 Playlist Video Studio.
