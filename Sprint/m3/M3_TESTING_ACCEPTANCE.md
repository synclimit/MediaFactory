# M3_TESTING_ACCEPTANCE.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Testing, Validation & Acceptance Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini menjadi acuan resmi proses QA (Quality Assurance), UAT (User Acceptance Test), Regression Test, serta Final Acceptance sebelum Mode 3 dinyatakan selesai.

Dokumen ini berlaku untuk:

* Frontend
* Backend
* Database
* API
* Queue
* Pipeline Integration
* FFmpeg Integration

---

# 2. Testing Strategy

Testing dilakukan secara bertahap.

```text
Unit Test

↓

Component Test

↓

Integration Test

↓

Workflow Test

↓

Regression Test

↓

Performance Test

↓

User Acceptance Test

↓

Release
```

---

# 3. Frontend Testing Checklist

## 3.1 Layout

* [ ] Studio Layout tampil sempurna.
* [ ] Toolbar tidak berubah posisi.
* [ ] Preview Canvas menggunakan aspect ratio 16:9.
* [ ] Assets Panel tampil lengkap.
* [ ] Inspector tampil lengkap.
* [ ] Timeline tampil lengkap.
* [ ] Thumbnail Editor dapat dibuka.

---

## 3.2 Navigation

* [ ] Composer → Thumbnail berjalan.
* [ ] Thumbnail → Composer berjalan.
* [ ] Tidak kehilangan state saat berpindah mode.

---

## 3.3 Selection

* [ ] Klik object langsung terseleksi.
* [ ] Outline muncul.
* [ ] Inspector berubah.
* [ ] Klik object lain berpindah.
* [ ] ESC menghapus selection.
* [ ] Klik area kosong menghapus selection.

---

## 3.4 Drag

* [ ] Object dapat dipindahkan.
* [ ] Position berubah.
* [ ] Inspector ikut berubah.
* [ ] Tidak terjadi glitch.

---

## 3.5 Preview

* [ ] Play bekerja.
* [ ] Pause bekerja.
* [ ] Stop bekerja.
* [ ] Restart bekerja.
* [ ] Preview Time berubah.
* [ ] Preview tidak crash.

---

# 4. Assets Panel Testing

## Background

* [ ] Import Image.
* [ ] Import Video.
* [ ] Image dan Video tidak aktif bersamaan.
* [ ] Loop Mode aktif hanya untuk Video.

---

## Playlist File

* [ ] Import satu file.
* [ ] Import banyak file.
* [ ] Drag & Drop.

---

## Folder

* [ ] Folder berhasil dipilih.
* [ ] Library berhasil dibuat.
* [ ] Playlist Size bekerja.
* [ ] Shuffle bekerja.
* [ ] Generate Playlist berhasil.

---

## YouTube

* [ ] URL valid.
* [ ] Fetch berhasil.
* [ ] Metadata tampil.
* [ ] Add To Playlist berhasil.

---

# 5. Playlist Testing

* [ ] Track Number benar.
* [ ] Duration benar.
* [ ] Remove Track.
* [ ] Reorder.
* [ ] Shuffle.
* [ ] Anti Duplicate.

---

# 6. Composer Testing

## Background

* [ ] Background tampil.

## Overlay

* [ ] Watermark.
* [ ] Subscribe.
* [ ] Playlist Overlay.
* [ ] Current Playing.
* [ ] Track Counter.
* [ ] Track Change.

## Visualizer

* [ ] Circle.
* [ ] Spectrum.
* [ ] Bars.
* [ ] Wave.

## Effects

* [ ] Snow.
* [ ] Rain.
* [ ] Fog.
* [ ] Glow.
* [ ] Dust.
* [ ] Fireflies.

---

# 7. Text Object Testing

* [ ] Add Playlist Title.
* [ ] Add Current Playing.
* [ ] Add Custom Text.
* [ ] Add Track List.

---

# 8. Track List Testing

## Single

* [ ] Single Column.

## Dual Balanced

* [ ] Left Column.
* [ ] Right Column.

## Dual Wide

* [ ] Position benar.

---

## Dynamic

* [ ] Playlist berubah.
* [ ] Track List ikut berubah.

---

# 9. Inspector Testing

## Transform

* [ ] Position X.
* [ ] Position Y.
* [ ] Width.
* [ ] Height.
* [ ] Rotation.

---

## Appearance

* [ ] Opacity.
* [ ] Shadow.
* [ ] Gradient.
* [ ] Glow.

---

## Text

* [ ] Font.
* [ ] Font Size.
* [ ] Alignment.
* [ ] Color.
* [ ] Stroke.

---

## Layer

* [ ] Bring Forward.
* [ ] Send Backward.
* [ ] Layer Order.

---

## Visibility

* [ ] Hide.
* [ ] Show.

---

## Lock

* [ ] Lock Position.

---

# 10. Thumbnail Testing

* [ ] Import Thumbnail.
* [ ] Save Thumbnail.
* [ ] Template.
* [ ] Apply.
* [ ] Canvas Selection.
* [ ] Inspector Sinkron.

---

# 11. Template Testing

* [ ] Save Template.
* [ ] Load Template.
* [ ] Apply Template.
* [ ] Layout berubah.
* [ ] Playlist tidak berubah.
* [ ] Background tidak berubah.

---

# 12. Queue Testing

* [ ] Add Configuration To Queue.
* [ ] Payload berhasil dibuat.
* [ ] Queue menerima payload.
* [ ] Job ID dikembalikan.

---

# 13. Backend Testing

## Playlist Engine

* [ ] Build Playlist.
* [ ] Shuffle.
* [ ] Anti Duplicate.

---

## Timestamp

* [ ] Timestamp benar.

---

## Metadata

* [ ] metadata.json valid.

---

## Composer Config

* [ ] Composer Configuration benar.

---

## Thumbnail Config

* [ ] Thumbnail Configuration benar.

---

# 14. API Testing

Semua endpoint diuji:

* [ ] HTTP Method.
* [ ] Authentication.
* [ ] Permission.
* [ ] Validation.
* [ ] Success Response.
* [ ] Error Response.
* [ ] Timeout.

---

# 15. Database Testing

* [ ] Insert.
* [ ] Update.
* [ ] Delete.
* [ ] Foreign Key.
* [ ] Transaction.
* [ ] Index.

---

# 16. Queue & Pipeline Testing

* [ ] Queue dibuat.
* [ ] Scheduler membaca Queue.
* [ ] Worker menerima Job.
* [ ] Progress berubah.
* [ ] Completed.
* [ ] Failed.

---

# 17. FFmpeg Testing

* [ ] Background Image.
* [ ] Background Video.
* [ ] Loop Mode.
* [ ] Overlay.
* [ ] Visualizer.
* [ ] Audio Playlist.
* [ ] Thumbnail.
* [ ] Metadata.

---

# 18. Notification Testing

Success

* [ ] Thumbnail Saved.
* [ ] Template Saved.
* [ ] Queue Added.

Warning

* [ ] Playlist kosong.
* [ ] Background kosong.
* [ ] Thumbnail belum disimpan.

Error

* [ ] Import gagal.
* [ ] Queue gagal.
* [ ] Render gagal.

---

# 19. Performance Testing

Target minimum:

## UI

* [ ] Tidak ada lag saat drag object.
* [ ] Preview tetap responsif.

## Playlist

* [ ] 500 lagu.
* [ ] 1000 lagu.

## Composer

* [ ] 100 object.
* [ ] 200 object.

## Memory

* [ ] Tidak terjadi memory leak.

---

# 20. Security Testing

* [ ] Invalid File.
* [ ] Invalid URL.
* [ ] Path Traversal.
* [ ] Duplicate Request.
* [ ] JSON Injection.
* [ ] Oversized File.

---

# 21. Edge Case Testing

* [ ] Playlist kosong.
* [ ] Folder kosong.
* [ ] Background dihapus.
* [ ] Thumbnail belum disimpan.
* [ ] Queue ganda.
* [ ] Worker mati.
* [ ] Render gagal.
* [ ] File audio corrupt.
* [ ] Video corrupt.
* [ ] User menutup aplikasi saat Queue dibuat.

---

# 22. Regression Testing

Pastikan perubahan M3 tidak memengaruhi:

* [ ] M1
* [ ] M2
* [ ] Pipeline
* [ ] Notification
* [ ] Activity Log
* [ ] Workspace

---

# 23. User Acceptance Test (UAT)

Workflow lengkap:

* [ ] Membuka Mode 3.
* [ ] Memilih Background.
* [ ] Import Audio.
* [ ] Generate Playlist.
* [ ] Menambahkan Object.
* [ ] Mengedit Composer.
* [ ] Mengedit Thumbnail.
* [ ] Save Thumbnail.
* [ ] Add Configuration To Queue.
* [ ] Render berhasil.
* [ ] Output valid.

---

# 24. Acceptance Criteria

Mode 3 dinyatakan selesai apabila:

## Frontend

* [ ] UI sesuai Requirement Freeze.
* [ ] Tidak ada bug mayor.

## Backend

* [ ] Semua engine berjalan.

## API

* [ ] Semua endpoint stabil.

## Database

* [ ] Tidak ada data corrupt.

## Queue

* [ ] Job berhasil dibuat.

## Render

* [ ] FFmpeg menghasilkan output yang benar.

## Output

* [ ] video.mp4
* [ ] thumbnail.jpg
* [ ] metadata.json

Siap digunakan oleh AutoUploader.

---

# 25. Severity Classification

## Critical

* Crash aplikasi.
* Queue gagal total.
* Render gagal total.
* Data hilang.

Harus diperbaiki sebelum release.

---

## High

* Workflow utama gagal.
* Metadata salah.
* Playlist salah.

Harus diperbaiki sebelum release.

---

## Medium

* UI glitch.
* Preview tidak sinkron.
* Inspector salah update.

Diperbaiki sebelum final release.

---

## Low

* Typo.
* Alignment UI.
* Tooltip.

Masuk sprint polishing.

---

# 26. Release Checklist

Sebelum Mode 3 dinyatakan RELEASE READY:

* [ ] Semua Acceptance Criteria terpenuhi.
* [ ] Tidak ada bug Critical.
* [ ] Tidak ada bug High.
* [ ] Semua dokumen sinkron.
* [ ] UI Freeze dipatuhi.
* [ ] Backend Freeze dipatuhi.
* [ ] Database Freeze dipatuhi.
* [ ] API Freeze dipatuhi.
* [ ] Regression Test lulus.
* [ ] UAT disetujui Product Owner.

---

# 27. Final Sign-off

Mode 3 Playlist Video Studio hanya boleh dinyatakan selesai apabila:

* Product Owner menyatakan UI final.
* Seluruh checklist pada dokumen ini selesai.
* Gravity menyelesaikan Self Review.
* Gravity menyelesaikan Self Testing.
* Gravity menyerahkan Implementation Report.
* Tidak ada perubahan requirement di luar Requirement Freeze.

Dokumen ini menjadi acuan resmi QA, Testing, dan Final Acceptance untuk implementasi Mode 3 Playlist Video Studio.
