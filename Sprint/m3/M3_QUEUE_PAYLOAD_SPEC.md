# M3_QUEUE_PAYLOAD_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Queue Payload Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini mendefinisikan format **Queue Payload** yang dikirim dari Mode 3 menuju Pipeline.

Queue Payload merupakan satu-satunya data yang digunakan oleh Pipeline untuk menjalankan proses render.

Pipeline **tidak membaca UI**, **tidak membaca database**, dan **tidak membaca state React**.

Pipeline hanya membaca Queue Payload.

---

# 2. Philosophy

Workflow:

```text
Mode 3

↓

Configuration Builder

↓

Queue Payload

↓

Pipeline

↓

Render Worker

↓

Output
```

Queue Payload adalah snapshot final project.

Setelah payload dikirim ke Queue, perubahan pada UI tidak boleh mempengaruhi payload tersebut.

---

# 3. Payload Rules

Queue Payload harus:

* Immutable
* Self Contained
* Serializable
* Independent
* Complete

Worker tidak boleh meminta data tambahan.

---

# 4. Root Payload

```json
{
  "job": {},
  "project": {},
  "configuration": {},
  "render": {},
  "output": {}
}
```

---

# 5. Job Object

```json
{
  "jobId": "",
  "module": "M3",
  "priority": "normal",
  "status": "waiting",
  "createdAt": "",
  "createdBy": ""
}
```

Status:

* waiting
* queued
* rendering
* completed
* failed
* cancelled

---

# 6. Project Object

```json
{
  "projectId": "",
  "projectName": "",
  "workspace": "",
  "schemaVersion": "1.0.0"
}
```

---

# 7. Configuration Object

Configuration merupakan object utuh yang berasal dari:

M3_CONFIGURATION_SCHEMA.md

Tidak boleh dipecah.

```json
{
  "background": {},
  "playlist": {},
  "composer": {},
  "thumbnail": {},
  "effects": {},
  "visualizer": {},
  "metadata": {}
}
```

---

# 8. Render Object

```json
{
  "profile": "balanced",
  "threads": "auto",
  "hardwareAcceleration": false,
  "schedulerTime": "",
  "retry": 0
}
```

Field:

profile

* fast
* balanced
* high

schedulerTime

Digunakan oleh Pipeline Scheduler.

---

# 9. Output Object

```json
{
  "workspace": "",
  "outputFolder": "",
  "videoFile": "video.mp4",
  "thumbnailFile": "thumbnail.jpg",
  "metadataFile": "metadata.json",
  "overwrite": false
}
```

---

# 10. Payload Lifecycle

```text
User

↓

Composer

↓

Configuration Builder

↓

Queue Payload

↓

Queue Database

↓

Pipeline

↓

Worker

↓

Completed
```

Queue Payload tidak boleh dimodifikasi setelah dibuat.

---

# 11. Queue Builder

Queue Builder bertugas:

* Validasi
* Snapshot Configuration
* Generate Job ID
* Generate Timestamp
* Build Payload
* Kirim ke Queue

Queue Builder tidak melakukan render.

---

# 12. Validation Before Queue

Semua validasi harus lolos.

Minimal:

* Background tersedia.
* Playlist minimal satu lagu.
* Thumbnail sudah disimpan.
* Composer memiliki object.
* Metadata valid.
* Output folder valid.

Jika gagal:

Payload tidak dibuat.

---

# 13. Payload Size

Payload tidak boleh berisi:

* Binary Image
* Binary Audio
* Binary Video

Payload hanya menyimpan:

* Path
* Metadata
* Configuration

---

# 14. Queue Persistence

Payload harus dapat:

* Disimpan ke database.
* Diekspor ke JSON.
* Dibaca ulang.
* Diproses ulang.

---

# 15. Retry Rules

Retry menggunakan payload yang sama.

Tidak membuat payload baru.

Retry Counter ditambah.

---

# 16. Scheduler Rules

Pipeline membaca:

schedulerTime

Jika kosong:

Render langsung.

Jika ada waktu:

Menunggu Scheduler.

---

# 17. Worker Rules

Worker membaca payload.

Tidak melakukan query tambahan ke frontend.

Semua data harus tersedia di payload.

---

# 18. Payload Integrity

Sebelum render dimulai:

Pipeline melakukan checksum sederhana terhadap payload.

Jika payload rusak:

Status menjadi Failed.

---

# 19. Activity Log

Saat Queue dibuat:

Catat:

* Job ID
* Project ID
* Workspace
* User
* Waktu
* Render Profile

---

# 20. Error Codes

Contoh:

```text
M3Q001

Configuration Invalid

M3Q002

Background Missing

M3Q003

Playlist Empty

M3Q004

Thumbnail Missing

M3Q005

Output Folder Invalid

M3Q006

Queue Insert Failed

M3Q007

Payload Corrupted
```

---

# 21. Example Payload

```json
{
  "job": {
    "jobId": "JOB-20260618-001",
    "module": "M3",
    "status": "waiting"
  },
  "project": {
    "projectId": "M3-001",
    "projectName": "Lofi Playlist"
  },
  "configuration": {
    "...": "see M3_CONFIGURATION_SCHEMA"
  },
  "render": {
    "profile": "balanced"
  },
  "output": {
    "outputFolder": "D:/MediaFactory/output"
  }
}
```

---

# 22. Queue State Transition

```text
Waiting

↓

Queued

↓

Rendering

↓

Completed

atau

↓

Failed
```

Pipeline adalah satu-satunya pihak yang boleh mengubah status.

---

# 23. Performance Rules

* Payload dibuat satu kali.
* Hindari serialisasi berulang.
* Gunakan referensi path, bukan isi file.
* Payload harus ringan agar Queue tetap cepat.

---

# 24. Security Rules

Payload tidak boleh menyimpan:

* Password
* API Key
* Token
* Session
* Cookie

Semua path harus divalidasi sebelum dikirim.

---

# 25. Acceptance Criteria

Queue Payload dianggap selesai apabila:

* Payload dapat dibuat dari Configuration.
* Pipeline dapat membaca payload tanpa transformasi tambahan.
* Worker dapat melakukan render hanya dari payload.
* Retry menggunakan payload yang sama.
* Payload dapat disimpan dan dimuat kembali.
* Tidak ada ketergantungan ke state frontend.

---

# 26. Future Backlog

Belum termasuk:

* Distributed Queue
* Cloud Worker
* Priority Queue Multi Level
* Queue Compression
* Payload Encryption

---

# 27. Queue Payload Freeze

Mulai implementasi:

* Root payload tidak boleh berubah.
* Nama field tidak boleh berubah.
* Worker hanya membaca Queue Payload.
* Queue Payload menjadi kontrak resmi antara Mode 3 dan Pipeline.

Dokumen ini menjadi acuan resmi Queue Payload Specification untuk Mode 3 Playlist Video Studio.
