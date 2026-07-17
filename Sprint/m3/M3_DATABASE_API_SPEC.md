# M3_DATABASE_API_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Database & API Implementation Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini mendefinisikan struktur data permanen, kontrak API, relasi antar entitas, serta aturan pertukaran data antara Frontend, Backend, Pipeline, dan Render Worker.

Dokumen ini menjadi acuan implementasi backend dan integrasi frontend.

---

# 2. Database Philosophy

Database digunakan untuk:

* Menyimpan konfigurasi project.
* Menyimpan playlist.
* Menyimpan object composer.
* Menyimpan thumbnail layout.
* Menyimpan render job.
* Menyimpan activity log.

Database **bukan** tempat menyimpan file media.

Semua file media tetap berada di filesystem/workspace.

Database hanya menyimpan metadata dan referensi file.

---

# 3. Database Schema

Mode 3 minimal memiliki tabel berikut:

```text
m3_projects

m3_playlist_tracks

m3_canvas_objects

m3_thumbnail_objects

m3_templates

m3_render_jobs

m3_activity_logs
```

---

# 4. Table : m3_projects

Primary Key

```text
project_id
```

Field

| Field           | Type     | Keterangan                   |
| --------------- | -------- | ---------------------------- |
| project_id      | UUID     | Primary Key                  |
| project_name    | TEXT     | Nama Project                 |
| workspace       | TEXT     | Workspace                    |
| background_type | TEXT     | image / video                |
| background_path | TEXT     | Lokasi background            |
| loop_mode       | TEXT     | normal / seamless / pingpong |
| playlist_mode   | TEXT     | file / folder / youtube      |
| thumbnail_saved | BOOLEAN  | Status                       |
| duration        | INTEGER  | Detik                        |
| render_profile  | TEXT     | Render Profile               |
| queue_status    | TEXT     | waiting/rendering/completed  |
| created_at      | DATETIME | Waktu                        |
| updated_at      | DATETIME | Waktu                        |

Index

```text
project_id

queue_status

created_at
```

---

# 5. Table : m3_playlist_tracks

Primary Key

```text
track_id
```

Foreign Key

```text
project_id
```

Field

| Field            | Type     |
| ---------------- | -------- |
| track_id         | UUID     |
| project_id       | UUID     |
| track_number     | INTEGER  |
| title            | TEXT     |
| artist           | TEXT     |
| duration         | INTEGER  |
| source_type      | TEXT     |
| source_path      | TEXT     |
| youtube_url      | TEXT     |
| local_audio_path | TEXT     |
| created_at       | DATETIME |

---

# 6. Table : m3_canvas_objects

Setiap object Composer.

Field

| Field       | Type     |
| ----------- | -------- |
| object_id   | UUID     |
| project_id  | UUID     |
| object_type | TEXT     |
| object_name | TEXT     |
| x           | FLOAT    |
| y           | FLOAT    |
| width       | FLOAT    |
| height      | FLOAT    |
| rotation    | FLOAT    |
| opacity     | FLOAT    |
| visible     | BOOLEAN  |
| locked      | BOOLEAN  |
| layer       | INTEGER  |
| style_json  | JSON     |
| created_at  | DATETIME |

---

# 7. Table : m3_thumbnail_objects

Sama seperti Composer.

Namun khusus Thumbnail.

Field

Sama dengan Canvas Object.

---

# 8. Table : m3_templates

Menyimpan Template Layout.

Tidak menyimpan Playlist.

Tidak menyimpan Audio.

Tidak menyimpan Background.

Field

| Field         | Type     |
| ------------- | -------- |
| template_id   | UUID     |
| template_name | TEXT     |
| template_type | TEXT     |
| object_json   | JSON     |
| created_at    | DATETIME |

---

# 9. Table : m3_render_jobs

Terhubung dengan Pipeline.

Field

| Field           | Type     |
| --------------- | -------- |
| job_id          | UUID     |
| project_id      | UUID     |
| pipeline_job_id | UUID     |
| status          | TEXT     |
| progress        | INTEGER  |
| output_path     | TEXT     |
| render_log      | TEXT     |
| created_at      | DATETIME |
| finished_at     | DATETIME |

---

# 10. Table : m3_activity_logs

Field

| Field       | Type     |
| ----------- | -------- |
| log_id      | UUID     |
| project_id  | UUID     |
| action      | TEXT     |
| description | TEXT     |
| created_at  | DATETIME |

---

# 11. Relationship

```text
Project

│

├── Playlist Tracks

├── Canvas Objects

├── Thumbnail Objects

├── Render Jobs

└── Activity Logs
```

---

# 12. API Overview

Base URL

```text
/api/m3
```

Semua endpoint berada di namespace Mode 3.

---

# 13. Playlist API

## Import File

POST

```text
/api/m3/playlist/import-file
```

Request

```json
{
  "files":[]
}
```

Response

```json
{
  "success":true,
  "tracks":[]
}
```

---

## Import Folder

POST

```text
/api/m3/playlist/import-folder
```

Request

```json
{
  "folder":"..."
}
```

Response

```json
{
  "library":[]
}
```

---

## Generate Playlist

POST

```text
/api/m3/playlist/generate
```

Request

```json
{
  "playlistSize":15,
  "shuffle":true,
  "antiDuplicate":true
}
```

Response

```json
{
  "playlist":[]
}
```

---

## Import YouTube

POST

```text
/api/m3/youtube/fetch
```

Request

```json
{
  "url":"..."
}
```

Response

```json
{
  "title":"",
  "duration":"",
  "thumbnail":"",
  "artist":""
}
```

---

# 14. Composer API

## Save Composer

POST

```text
/api/m3/composer/save
```

Request

```json
{
  "objects":[]
}
```

---

## Load Composer

GET

```text
/api/m3/composer/{projectId}
```

---

# 15. Thumbnail API

Save Thumbnail

POST

```text
/api/m3/thumbnail/save
```

---

Import Thumbnail

POST

```text
/api/m3/thumbnail/import
```

---

# 16. Template API

Save Template

POST

```text
/api/m3/template/save
```

---

Load Template

GET

```text
/api/m3/template/list
```

---

Apply Template

POST

```text
/api/m3/template/apply
```

---

# 17. Queue API

POST

```text
/api/m3/queue/add
```

Request

```json
{
  "projectId":"..."
}
```

Response

```json
{
  "jobId":"",
  "status":"waiting"
}
```

---

# 18. Metadata API

POST

```text
/api/m3/metadata/generate
```

Response

```json
{
  "metadata":{}
}
```

---

# 19. Authentication

Menggunakan authentication aplikasi Media Factory.

Tidak membuat sistem login baru.

---

# 20. Permission

Admin

Semua akses.

Operator

Seluruh Mode 3.

Guest

Tidak dapat melakukan render.

---

# 21. Validation

Backend wajib memvalidasi:

* Background tersedia.
* Playlist minimal 1 lagu.
* Thumbnail telah disimpan.
* Output folder valid.
* URL YouTube valid.
* File audio valid.

---

# 22. Error Response

Standar

```json
{
  "success":false,
  "code":"...",
  "message":"..."
}
```

Contoh:

PROJECT_NOT_FOUND

PLAYLIST_EMPTY

INVALID_BACKGROUND

INVALID_AUDIO

YOUTUBE_FETCH_FAILED

QUEUE_FAILED

TEMPLATE_NOT_FOUND

---

# 23. Activity Log

Minimal mencatat:

* Project dibuat.
* Audio diimport.
* Playlist dibuat.
* Template diterapkan.
* Thumbnail disimpan.
* Queue dibuat.
* Render dimulai.
* Render selesai.
* Render gagal.

---

# 24. Audit Log

Jika mode audit aktif.

Simpan:

* User
* Timestamp
* IP (jika tersedia)
* Action
* Payload Ringkas

---

# 25. Performance

Gunakan:

* Prepared Statement
* Transaction
* Bulk Insert untuk Playlist
* Index pada project_id
* Lazy Load Template
* Cache Playlist Library

---

# 26. Security

Validasi:

* Path Traversal
* File Extension
* Maximum File Size
* Invalid URL
* Duplicate Request
* JSON Injection

Semua input wajib disanitasi.

---

# 27. Edge Case

Tangani kondisi berikut:

* Folder kosong.
* Semua lagu corrupt.
* URL YouTube tidak valid.
* Thumbnail belum disimpan.
* Background dihapus setelah dipilih.
* Playlist berubah saat Queue dibuat.
* Queue ganda.
* Project dibuka bersamaan.
* Worker mati saat render.

---

# 28. Acceptance Criteria

Database & API dianggap selesai apabila:

* Seluruh tabel berhasil dibuat.
* Relasi valid.
* API mengikuti kontrak.
* Response konsisten.
* Error handling lengkap.
* Queue dapat menerima payload.
* Activity Log tercatat.
* Tidak ada data orphan.

---

# 29. Freeze

Mulai tahap implementasi:

* Struktur tabel tidak boleh diubah.
* Kontrak API tidak boleh diubah.
* Nama endpoint tidak boleh diubah.
* Response schema tidak boleh diubah.

Perubahan hanya boleh dilakukan atas persetujuan Product Owner.

Dokumen ini menjadi acuan resmi implementasi Database dan API untuk Mode 3 Playlist Video Studio.
