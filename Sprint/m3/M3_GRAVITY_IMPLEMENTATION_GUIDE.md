# M3_GRAVITY_IMPLEMENTATION_GUIDE.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Gravity Implementation Guide

Version : 1.0
Status : IMPLEMENTATION GUIDE (Requirement Freeze)

---

# 1. Purpose

Dokumen ini adalah SOP implementasi untuk AI Coding (Gravity).

Dokumen ini **bukan** dokumen requirement.

Dokumen ini menjelaskan **bagaimana Gravity harus mengimplementasikan Mode 3** berdasarkan seluruh spesifikasi yang telah disetujui.

Gravity **tidak diperbolehkan** mengubah:

* UI
* UX
* Workflow
* Business Flow
* Database Schema
* API Contract
* Architecture

Seluruh perubahan hanya boleh berupa implementasi.

---

# 2. Documents Reading Order (WAJIB)

Gravity WAJIB membaca seluruh dokumen berikut secara berurutan.

1. M3_IMPLEMENTATION_MASTER.md
2. M3_UI_SPEC.md
3. M3_FRONTEND_SPEC.md
4. M3_BACKEND_SPEC.md
5. M3_DATABASE_API_SPEC.md
6. M3_TECHNICAL_ARCHITECTURE.md
7. M3_TESTING_ACCEPTANCE.md

Tidak boleh langsung coding sebelum seluruh dokumen dipahami.

---

# 3. Implementation Rules

Gravity wajib:

✅ Reuse komponen yang sudah ada.

✅ Reuse Pipeline.

✅ Reuse Notification System.

✅ Reuse Queue.

✅ Reuse Theme.

Gravity dilarang:

❌ Membuat redesign.

❌ Mengubah posisi UI.

❌ Menambah fitur baru.

❌ Menghapus fitur.

❌ Mengubah workflow.

❌ Mengubah struktur state.

---

# 4. Sprint Order (WAJIB)

Implementasi harus mengikuti urutan berikut.

## Sprint 1

Frontend Wiring

Target:

* Semua UI menggunakan data nyata.
* Dummy dihapus.
* State terhubung.

Belum melakukan render.

---

## Sprint 2

Playlist Engine

Target:

* Import File
* Import Folder
* Import YouTube
* Shuffle
* Anti Duplicate
* Timestamp
* Duration

---

## Sprint 3

Composer Engine

Target:

* Canvas Object
* Selection
* Drag
* Inspector
* Layer

Belum FFmpeg.

---

## Sprint 4

Thumbnail Engine

Target:

* Save Thumbnail
* Import Thumbnail
* Template
* Apply Template

---

## Sprint 5

Metadata Engine

Target:

metadata.json

timestamps

playlist

render profile

---

## Sprint 6

Queue Integration

Target:

Configuration Builder

↓

Queue Payload

↓

Pipeline

---

## Sprint 7

FFmpeg Integration

Target:

Render benar-benar berjalan.

Output:

video.mp4

thumbnail.jpg

metadata.json

---

## Sprint 8

Polishing

Target:

Bug Fix

Performance

UX Minor

Logging

---

# 5. Development Priority

Selalu kerjakan:

Core Workflow terlebih dahulu.

Urutan:

1

Playlist

↓

2

Composer

↓

3

Thumbnail

↓

4

Queue

↓

5

Render

Jangan mulai Render sebelum Queue selesai.

---

# 6. Code Quality Rules

Gravity wajib:

* Modular
* Reusable
* Readable
* Maintainable

Gunakan:

* React.memo
* useMemo
* useCallback

Hindari:

* Hardcode
* Duplicate Logic
* Global Variable
* Magic Number

---

# 7. Naming Convention

Component

PascalCase

Contoh

M3PreviewCanvas

---

Function

camelCase

Contoh

generatePlaylist()

---

Variable

camelCase

---

Constant

UPPER_CASE

---

Folder

lowercase

---

# 8. State Rules

Single Source of Truth.

Tidak boleh:

State yang sama disimpan di dua tempat.

Semua perubahan melalui Event Handler.

---

# 9. Component Rules

Setiap komponen hanya memiliki satu tanggung jawab.

Contoh:

PreviewCanvas

↓

Render Canvas

Bukan:

Preview

*

Playlist

*

Queue

Sekaligus.

---

# 10. Service Rules

Semua request backend melalui Service.

Tidak boleh:

Component langsung memanggil fetch().

Contoh:

PlaylistService

TemplateService

QueueService

MetadataService

---

# 11. Error Handling Rules

Setiap async wajib memiliki:

Loading

↓

Success

↓

Error

Tidak boleh:

Silent Failure

---

# 12. Logging Rules

Gunakan Logger.

Jangan menggunakan:

console.log()

pada implementasi final.

---

# 13. Validation Rules

Frontend melakukan validasi awal.

Backend melakukan validasi final.

Backend selalu menjadi sumber validasi utama.

---

# 14. Queue Rules

Gravity tidak boleh mengubah Queue Engine.

Mode 3 hanya membuat Queue Payload.

Pipeline tetap menjadi pemilik Queue.

---

# 15. FFmpeg Rules

Gravity tidak boleh menulis command FFmpeg langsung di Component React.

Semua render dilakukan melalui Backend Worker.

---

# 16. Template Rules

Template hanya menyimpan:

* Layout
* Position
* Font
* Style
* Overlay
* Visualizer

Template tidak boleh menyimpan:

* Audio
* Playlist
* Thumbnail Image
* Background File

---

# 17. Activity Log Rules

Minimal log:

Project Created

Playlist Generated

Thumbnail Saved

Template Applied

Queue Created

Render Started

Render Finished

Render Failed

---

# 18. Performance Rules

Preview:

Target minimal 60 FPS pada interaksi dasar.

Import Folder:

Tidak boleh memblok UI.

Playlist besar harus diproses asynchronous.

---

# 19. Backward Compatibility

Implementasi Mode 3 tidak boleh memengaruhi:

* M1
* M2
* Pipeline
* Notification
* Workspace

Regression wajib dilakukan.

---

# 20. Self Review (WAJIB)

Setelah implementasi selesai.

Gravity wajib melakukan:

Code Review.

Checklist:

* Requirement sesuai.
* Tidak ada dead code.
* Tidak ada duplicate code.
* Tidak ada unused import.
* Tidak ada warning React.
* Tidak ada TODO yang tertinggal.

---

# 21. Self Testing (WAJIB)

Gravity wajib menguji:

Frontend

Backend

API

Database

Workflow

Queue

Render

Error Handling

Notification

Tidak boleh menyerahkan kode tanpa pengujian.

---

# 22. Risk Analysis (WAJIB)

Setelah implementasi selesai.

Gravity wajib membuat analisis:

High Risk

Medium Risk

Low Risk

Beserta mitigasinya.

---

# 23. Implementation Report (WAJIB)

Gravity wajib menyerahkan laporan implementasi.

Minimal berisi:

* File yang diubah.
* File baru.
* File yang dihapus.
* Dependency baru.
* Library baru.
* Breaking Change.
* Known Limitation.

---

# 24. Next Sprint Recommendation

Setelah implementasi selesai.

Gravity memberikan rekomendasi:

Sprint berikutnya.

Contoh:

* Subtitle Engine
* GPU Preview
* AI Metadata

Rekomendasi hanya ditulis.

Tidak diimplementasikan.

---

# 25. STOP Rules

Gravity HARUS berhenti dan meminta keputusan Product Owner apabila:

* Requirement bertentangan.
* UI tidak sesuai spesifikasi.
* Dibutuhkan perubahan workflow.
* Dibutuhkan perubahan database.
* Dibutuhkan perubahan API.
* Dibutuhkan redesign.

Gravity tidak boleh mengambil keputusan sendiri.

---

# 26. Definition of Done

Implementasi dianggap selesai apabila:

* Seluruh requirement terpenuhi.
* Seluruh Acceptance Test lulus.
* Tidak ada bug Critical.
* Tidak ada bug High.
* Queue berhasil dibuat.
* Render berhasil.
* Output valid.
* Product Owner menyetujui hasil implementasi.

---

# 27. Final Rule

Seluruh dokumen Mode 3 merupakan **Single Source of Truth**.

Apabila terdapat konflik antara implementasi dengan dokumen spesifikasi, maka Gravity wajib mengikuti spesifikasi.

Gravity tidak diperbolehkan melakukan improvisasi terhadap requirement tanpa persetujuan Product Owner.

Dokumen ini menjadi SOP resmi implementasi Mode 3 Playlist Video Studio.
