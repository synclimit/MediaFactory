# M3_IMPLEMENTATION_MASTER.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Master Implementation Specification

**Version:** 1.0 (Requirement Freeze)
**Status:** APPROVED - IMPLEMENTATION READY

---

# 1. Overview

## Module Name

Mode 3 - Playlist Video Studio

---

## Purpose

Mode 3 merupakan modul yang digunakan untuk membuat satu video playlist YouTube berdurasi panjang secara semi-otomatis.

Video yang dihasilkan siap dikirim ke Pipeline Media Factory dan selanjutnya diproses oleh Render Engine sebelum digunakan oleh AutoUploader.

---

## Primary Goal

Menghasilkan satu paket output:

* video.mp4
* thumbnail.jpg
* metadata.json

yang siap di-upload ke YouTube.

---

## Module Position

```text
Media Factory

├── M1 Movie Generator
├── M2 Audio Compiler
├── M3 Playlist Video Studio   ← Dokumen ini
└── Pipeline
```

---

# 2. Scope

Dokumen ini hanya membahas implementasi Mode 3.

Tidak mencakup:

* M1
* M2
* M4
* AutoUploader
* Pipeline Engine (kecuali integrasi)

---

# 3. Module Objective

Mode 3 digunakan untuk:

* membuat playlist video YouTube,
* menyusun audio,
* menyusun visual,
* membuat thumbnail,
* membuat metadata,
* mengirim konfigurasi ke Pipeline.

Mode ini **bukan video editor umum**.

Mode ini adalah **Playlist Video Composer**.

---

# 4. Dependency

## Bergantung pada

Pipeline

Render Engine

FFmpeg Engine

Metadata Engine

Thumbnail Engine

Notification System

Activity Log

Workspace Manager

Project Storage

---

## Tidak Bergantung pada

M1

M2

M4

---

# 5. Final Business Flow

```text
Open Mode 3

↓

Choose Background

↓

Choose Audio Source

↓

Generate Playlist

↓

Compose Visual

↓

Preview

↓

Thumbnail Editor

↓

Save Thumbnail

↓

Add Configuration To Queue

↓

Pipeline

↓

Render Engine

↓

Output

↓

AutoUploader Ready
```

---

# 6. User Flow

## Step 1

User membuka Mode 3.

↓

Studio otomatis ditampilkan.

---

## Step 2

User memilih Background.

Pilihan:

* Image
* Video

Keduanya bersifat eksklusif.

Tidak boleh aktif bersamaan.

---

## Step 3

User memilih sumber Playlist Audio.

Pilihan:

* File
* Folder
* YouTube URL

---

## Step 4

Jika Folder dipilih.

User menentukan:

* Playlist Size
* Shuffle
* Generate Playlist

Playlist dibentuk dari seluruh isi folder.

---

## Step 5

Jika YouTube dipilih.

Workflow:

Paste URL

↓

Fetch Metadata

↓

Add To Playlist

↓

Current Playlist

---

## Step 6

User mengatur Composer.

Menambahkan:

* Background
* Visualizer
* Overlay
* Text
* Track List
* Watermark
* Current Playing

Semua dapat dipindahkan.

---

## Step 7

User berpindah ke Thumbnail Mode.

↓

Mengedit Thumbnail.

↓

Save Thumbnail.

---

## Step 8

User kembali ke Composer.

↓

Preview.

↓

Review.

↓

Add Configuration To Queue.

---

## Step 9

Pipeline menerima seluruh konfigurasi.

↓

Menunggu proses Render.

---

# 7. Final Workflow

```text
Frontend

↓

Input User

↓

Playlist Engine

↓

Composer Engine

↓

Thumbnail Engine

↓

Validation

↓

Configuration Builder

↓

Pipeline Queue

↓

Render Worker

↓

Output Builder

↓

Completed
```

---

# 8. Output

Mode 3 menghasilkan:

video.mp4

thumbnail.jpg

metadata.json

render.log

(optional)

timestamps.txt

---

# 9. Requirement Freeze

Seluruh requirement berikut dianggap final.

## UI

APPROVED

## UX

APPROVED

## Workflow

APPROVED

## Business Flow

APPROVED

## Layout

APPROVED

## Interaction

APPROVED

Perubahan hanya boleh dilakukan atas persetujuan Product Owner.

---

# 10. Design Principles

Mode 3 bukan editor video.

Mode 3 adalah Playlist Composer.

Fokus utama:

* cepat,
* sederhana,
* preview realtime,
* mudah digunakan.

---

# 11. Reuse Policy

Implementasi wajib:

Reuse Existing Components.

Reuse Existing Theme.

Reuse Existing Pipeline.

Reuse Existing Queue.

Reuse Existing Notification.

Tidak diperbolehkan redesign tanpa persetujuan.

---

# 12. Out of Scope

Berikut tidak termasuk Sprint M3:

* Subtitle AI
* Whisper Integration
* AI Lyrics
* AI Thumbnail
* AI Metadata
* AI Object Detection

Semua masuk backlog.

---

# 13. Backlog / Future Improvement

Fitur berikut sudah dibahas namun tidak termasuk implementasi saat ini:

* Subtitle berbasis Whisper.
* Auto Lyrics.
* AI Metadata Enhancement.
* AI Thumbnail Generation.
* Motion Template Marketplace.
* Preset Cloud Sync.
* Real-time Audio Waveform.
* GPU Preview Optimization.
* Multi-monitor Composer.
* Live YouTube Metadata Fetch Enhancement.

Tidak boleh diimplementasikan pada sprint ini.

---

# 14. Acceptance Gate

Mode 3 dianggap selesai apabila:

* UI sesuai desain final.
* Workflow sesuai requirement final.
* Backend berjalan.
* Playlist Engine berjalan.
* Thumbnail Engine berjalan.
* Metadata Engine berjalan.
* Queue terintegrasi.
* Pipeline menerima konfigurasi.
* FFmpeg berhasil menghasilkan output.
* Output valid untuk AutoUploader.

---

# 15. Document Structure

Dokumen ini merupakan dokumen induk.

Dokumen implementasi berikut wajib mengacu pada dokumen ini:

1. M3_UI_SPEC.md
2. M3_FRONTEND_SPEC.md
3. M3_BACKEND_SPEC.md
4. M3_DATABASE_API_SPEC.md
5. M3_TESTING_ACCEPTANCE.md
6. M3_GRAVITY_IMPLEMENTATION_PROMPT.md

Seluruh dokumen tersebut menjadi satu kesatuan dan tidak boleh saling bertentangan.

---

# 16. Single Source of Truth

Dokumen ini merupakan **Master Specification** untuk Mode 3.

Apabila terjadi konflik antara dokumen lain dengan dokumen ini, maka **M3_IMPLEMENTATION_MASTER.md** menjadi acuan utama.

Semua implementasi Gravity wajib mengikuti dokumen ini tanpa mengubah UI, workflow, business flow, maupun requirement yang telah disetujui.
