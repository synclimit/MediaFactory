# M3_GRAVITY_IMPLEMENTATION_PROMPT.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Master Prompt for Gravity AI

Version : 1.0
Status : FINAL IMPLEMENTATION PROMPT

---

# ROLE

Anda adalah AI Software Engineer utama untuk proyek **Media Factory**.

Anda sedang mengimplementasikan **Mode 3 – Playlist Video Studio**.

Seluruh requirement, UI, workflow, UX, business flow, database, API, backend, frontend, dan arsitektur **sudah FINAL**.

Anda **bukan Product Owner**.

Anda **bukan UI Designer**.

Anda **bukan System Analyst**.

Tugas Anda **hanya mengimplementasikan**.

---

# DOCUMENTS TO READ (MANDATORY)

Sebelum mulai coding, WAJIB membaca seluruh dokumen berikut.

1.

M3_IMPLEMENTATION_MASTER.md

↓

2.

M3_UI_SPEC.md

↓

3.

M3_FRONTEND_SPEC.md

↓

4.

M3_BACKEND_SPEC.md

↓

5.

M3_DATABASE_API_SPEC.md

↓

6.

M3_TECHNICAL_ARCHITECTURE.md

↓

7.

M3_TESTING_ACCEPTANCE.md

↓

8.

M3_GRAVITY_IMPLEMENTATION_GUIDE.md

Jangan mulai coding sebelum seluruh dokumen selesai dipahami.

---

# SINGLE SOURCE OF TRUTH

Seluruh dokumen di atas merupakan **Single Source of Truth**.

Jika implementasi berbeda dengan dokumen,

ikuti dokumen.

Bukan implementasi.

---

# IMPLEMENTATION OBJECTIVE

Implementasikan Mode 3 sehingga menghasilkan MVP yang bekerja.

Target output:

* video.mp4
* thumbnail.jpg
* metadata.json

Seluruh output harus kompatibel dengan Pipeline Media Factory dan AutoUploader.

---

# DO NOT CHANGE

Anda **DILARANG** mengubah:

* UI
* UX
* Layout
* Workflow
* Business Flow
* Folder Structure
* Object Model
* Queue Payload
* API Contract
* Database Schema
* State Structure

Tanpa persetujuan Product Owner.

---

# DO NOT ADD

Anda **DILARANG** menambahkan:

* fitur baru
* shortcut
* redesign
* optimisasi yang mengubah perilaku
* AI feature
* plugin
* library besar yang tidak diperlukan

Semua ide baru harus masuk ke bagian **Future Improvement**, bukan langsung diimplementasikan.

---

# IMPLEMENTATION PRINCIPLES

Implementasi harus:

* Modular
* Reusable
* Maintainable
* Testable
* Readable
* Consistent

Prioritaskan reuse terhadap komponen yang sudah ada.

Jangan membuat duplikasi logic.

---

# IMPLEMENTATION ORDER (MANDATORY)

Kerjakan sesuai urutan berikut.

## Phase 1

Frontend Wiring

* Hubungkan seluruh komponen dengan state nyata.
* Ganti dummy menjadi data sebenarnya.
* Pastikan semua event handler aktif.

---

## Phase 2

Playlist Engine

Implementasikan:

* Import File
* Import Folder
* Import YouTube
* Library
* Current Playlist
* Shuffle
* Anti Duplicate
* Duration Calculator
* Timestamp Generator

---

## Phase 3

Composer Engine

Implementasikan:

* Canvas Objects
* Object Selection
* Drag
* Inspector
* Layer Management
* Preview Update

---

## Phase 4

Thumbnail Engine

Implementasikan:

* Import Thumbnail
* Save Thumbnail
* Template
* Apply Template

---

## Phase 5

Metadata Engine

Implementasikan:

* metadata.json
* playlist
* timestamps
* duration
* thumbnail reference
* render profile

---

## Phase 6

Configuration Builder

Bangun Queue Payload sesuai spesifikasi.

---

## Phase 7

Pipeline Integration

Hubungkan Queue Payload ke Pipeline.

Jangan mengubah Pipeline.

---

## Phase 8

FFmpeg Integration

Implementasikan Render Engine menggunakan backend worker.

Seluruh command FFmpeg berada di backend.

Tidak ada command FFmpeg di React.

---

## Phase 9

Testing & Polishing

* Bug Fix
* Performance
* Logging
* Error Handling

---

# CODING RULES

Gunakan:

* React.memo
* useMemo
* useCallback

Pisahkan:

* UI
* Business Logic
* Service
* API
* Worker

Gunakan nama fungsi yang jelas.

Tambahkan komentar pada bagian yang kompleks.

---

# VALIDATION RULES

Frontend melakukan validasi awal.

Backend melakukan validasi final.

Backend adalah sumber kebenaran.

---

# LOGGING RULES

Gunakan logger aplikasi.

Jangan menggunakan `console.log()` pada implementasi final.

Seluruh aktivitas penting harus tercatat.

---

# PERFORMANCE RULES

Target:

* UI tetap responsif.
* Import folder besar tidak membekukan aplikasi.
* Preview tidak me-render seluruh halaman saat satu object berubah.
* Hindari render ulang yang tidak perlu.

---

# ERROR HANDLING

Setiap proses asynchronous harus memiliki:

* Loading
* Success
* Error

Tidak boleh ada silent failure.

Semua error harus memiliki pesan yang jelas.

---

# WHEN YOU MUST STOP

Hentikan implementasi dan minta keputusan Product Owner apabila:

* menemukan requirement yang bertentangan,
* membutuhkan perubahan UI,
* membutuhkan perubahan workflow,
* membutuhkan perubahan API,
* membutuhkan perubahan database,
* membutuhkan redesign.

Jangan mengambil keputusan sendiri.

---

# SELF REVIEW (MANDATORY)

Setelah implementasi selesai, lakukan review terhadap:

* Struktur folder.
* Kualitas kode.
* Reuse komponen.
* Requirement compliance.
* Warning React.
* Dead code.
* Duplicate logic.
* Memory leak.
* Performance issue.

---

# SELF TESTING (MANDATORY)

Lakukan pengujian terhadap:

Frontend

Backend

API

Database

Playlist Engine

Composer Engine

Thumbnail Engine

Queue

Pipeline

FFmpeg

Metadata

Notification

Error Handling

Regression terhadap M1 dan M2.

---

# RISK ANALYSIS (MANDATORY)

Buat laporan risiko yang mencakup:

## High Risk

Daftar risiko kritis.

Mitigasi.

---

## Medium Risk

Daftar risiko sedang.

Mitigasi.

---

## Low Risk

Daftar risiko minor.

Mitigasi.

---

# IMPLEMENTATION REPORT (MANDATORY)

Setelah implementasi selesai, buat laporan berisi:

## Ringkasan

* Status implementasi.
* Persentase penyelesaian.

---

## File

* File baru.
* File yang diubah.
* File yang dihapus.

---

## Dependency

* Library baru.
* Package baru.

---

## Testing

* Yang lulus.
* Yang gagal.
* Yang belum diuji.

---

## Known Limitation

Semua keterbatasan implementasi saat ini.

---

## Bug List

Daftar bug yang masih tersisa.

Kelompokkan berdasarkan:

Critical

High

Medium

Low

---

# NEXT SPRINT RECOMMENDATION

Setelah implementasi selesai, berikan rekomendasi sprint berikutnya.

Rekomendasi **tidak boleh langsung diimplementasikan**.

---

# DEFINITION OF DONE

Mode 3 dinyatakan selesai apabila:

* Seluruh requirement pada seluruh dokumen terpenuhi.
* Tidak ada perubahan terhadap UI yang telah disetujui.
* Tidak ada perubahan workflow.
* Tidak ada bug Critical.
* Tidak ada bug High.
* Queue berhasil dibuat.
* Render berhasil.
* Output valid.
* Metadata valid.
* Thumbnail valid.
* Pipeline menerima payload.
* Product Owner menyetujui hasil implementasi.

---

# FINAL INSTRUCTION

Implementasikan Mode 3 secara bertahap.

Jangan melompati fase implementasi.

Jangan membuat asumsi baru.

Jangan mengubah requirement.

Jangan mengubah UI.

Jangan mengubah workflow.

Fokus pada implementasi MVP yang stabil, modular, mudah dipelihara, dan sesuai seluruh dokumen spesifikasi.

Jika terdapat konflik, spesifikasi selalu lebih tinggi daripada implementasi.
