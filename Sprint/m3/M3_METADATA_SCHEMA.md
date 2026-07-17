# M3_METADATA_SCHEMA.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Metadata Schema Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini mendefinisikan struktur **metadata.json** yang dihasilkan oleh Mode 3.

Metadata ini akan digunakan oleh:

* AutoUploader
* Pipeline
* Render History
* Workspace
* Future Analytics

Metadata merupakan salah satu output utama Mode 3 bersama:

* video.mp4
* thumbnail.jpg

---

# 2. Metadata Philosophy

Metadata harus:

* Self Contained
* Human Readable
* Machine Readable
* JSON Valid
* Compatible dengan AutoUploader

Metadata tidak boleh bergantung pada database.

---

# 3. Metadata Lifecycle

```text
Project

↓

Playlist

↓

Composer

↓

Thumbnail

↓

Render

↓

Metadata Generator

↓

metadata.json

↓

AutoUploader
```

---

# 4. Root Schema

```json
{
  "schemaVersion": "1.0.0",
  "project": {},
  "video": {},
  "playlist": {},
  "thumbnail": {},
  "timestamps": [],
  "render": {},
  "output": {}
}
```

---

# 5. Project Object

```json
{
  "projectId": "",
  "projectName": "",
  "module": "M3",
  "workspace": "",
  "createdAt": "",
  "renderedAt": ""
}
```

---

# 6. Video Object

```json
{
  "title": "",
  "description": "",
  "duration": 0,
  "category": "",
  "language": "",
  "visibility": "private"
}
```

visibility default:

Private

Karena akan digunakan AutoUploader.

---

# 7. Playlist Object

```json
{
  "totalTracks": 15,
  "totalDuration": 3600,
  "shuffle": true,
  "tracks": []
}
```

---

# 8. Track Schema

```json
{
  "index": 1,
  "title": "",
  "artist": "",
  "duration": 230,
  "source": "",
  "youtubeUrl": ""
}
```

Semua track disimpan sesuai urutan playlist final.

---

# 9. Timestamp Schema

```json
{
  "index": 1,
  "time": "00:00",
  "seconds": 0,
  "title": ""
}
```

Contoh:

```text
00:00 Intro

03:15 Rain Song

07:40 Deep Sleep

12:55 Piano Relax
```

Timestamp dibuat otomatis oleh backend.

---

# 10. Thumbnail Object

```json
{
  "file": "thumbnail.jpg",
  "template": "",
  "generated": true
}
```

---

# 11. Render Object

```json
{
  "profile": "balanced",
  "backgroundType": "image",
  "loopMode": "normal",
  "visualizer": "spectrum",
  "effects": [
    "snow",
    "glow"
  ]
}
```

---

# 12. Output Object

```json
{
  "videoFile": "video.mp4",
  "thumbnailFile": "thumbnail.jpg",
  "metadataFile": "metadata.json",
  "outputFolder": ""
}
```

---

# 13. AutoUploader Fields

Field berikut WAJIB tersedia.

```json
{
  "title": "",
  "description": "",
  "timestamps": [],
  "thumbnail": {},
  "tags": []
}
```

AutoUploader tidak boleh melakukan parsing tambahan.

---

# 14. Description Generator

Description dibangun otomatis.

Format dasar:

```text
Playlist Title

↓

Track List

↓

Timestamp

↓

Copyright Notice

↓

Social Media

↓

Hashtags
```

Template Description dapat berubah.

Schema tetap.

---

# 15. Tags

```json
[
  "lofi",
  "sleep",
  "relax",
  "study",
  "playlist"
]
```

Belum menggunakan AI.

---

# 16. Validation Rules

Metadata valid apabila:

* Title tidak kosong.
* Playlist minimal satu lagu.
* Timestamp sesuai jumlah track.
* Thumbnail tersedia.
* Output valid.

---

# 17. Serialization Rules

Metadata harus dapat:

* Dibaca manusia.
* Dibaca AutoUploader.
* Dibuka kembali.
* Diekspor.
* Diarsipkan.

---

# 18. Metadata Generation Rules

Metadata dibuat:

Sesudah Queue dibuat.

Sebelum Render dimulai.

Jika Render gagal:

Metadata tetap disimpan untuk debugging.

---

# 19. Error Codes

```text
M3M001

Metadata Empty

M3M002

Title Missing

M3M003

Playlist Missing

M3M004

Timestamp Invalid

M3M005

Thumbnail Missing
```

---

# 20. Example Metadata

```json
{
  "schemaVersion": "1.0.0",
  "project": {
    "projectName": "Lofi Sleep Playlist"
  },
  "video": {
    "title": "Relaxing Lofi Mix"
  },
  "playlist": {
    "totalTracks": 15
  },
  "timestamps": [
    {
      "time": "00:00",
      "title": "Track 01"
    }
  ]
}
```

---

# 21. Compatibility

Metadata harus kompatibel dengan:

* AutoUploader
* Render History
* Future Workspace Browser

---

# 22. Performance

Metadata harus:

* Ringan.
* Tidak menyimpan binary.
* Tidak menyimpan thumbnail.
* Tidak menyimpan audio.

Hanya referensi.

---

# 23. Future Backlog

Belum termasuk:

* AI Generated Description
* AI Generated Tags
* SEO Score
* YouTube Category Detection
* Language Detection
* Copyright Analysis

---

# 24. Acceptance Criteria

Metadata dianggap selesai apabila:

* JSON valid.
* Schema sesuai spesifikasi.
* Timestamp benar.
* Playlist benar.
* AutoUploader dapat membaca tanpa konversi.
* Tidak ada field wajib yang hilang.

---

# 25. Metadata Freeze

Mulai implementasi:

* Struktur metadata tidak boleh berubah.
* Nama field tidak boleh berubah.
* AutoUploader menggunakan schema ini sebagai kontrak resmi.

Dokumen ini menjadi acuan resmi Metadata Schema Mode 3 Playlist Video Studio.
