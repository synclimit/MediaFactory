# M1_IMPLEMENTATION_SPEC.md

Version : 1.0
Status : REQUIREMENT FREEZE
Module : M1 – Movie Video Generator
Sprint : M1 Backend Integration & Real Render Engine

---

# 1. Tujuan

M1 (Movie Video Generator) adalah modul untuk menghasilkan video YouTube Long (Landscape) secara otomatis dari satu video sumber dengan mengganti audio menggunakan audio eksternal (YouTube atau Local Audio).

Output setiap segment merupakan video independen yang siap diupload ke YouTube.

Semua proses harus menggunakan data REAL.

Tidak boleh menggunakan:

* Dummy Data
* Mock Data
* Fake Progress
* Fake Estimation
* Hardcoded Metadata

Seluruh proses rendering menggunakan FFmpeg.

---

# 2. Scope Sprint

Sprint ini hanya mencakup implementasi M1.

Workspace belum diimplementasikan.

AutoUploader belum diintegrasikan.

Channel Profile dihapus.

Watermark masih menggunakan placeholder sampai Workspace selesai.

---

# 3. Business Goal

Menghasilkan banyak video YouTube Long dari satu video sumber.

Setiap output memiliki:

* video berbeda (segment berbeda)
* audio berbeda
* metadata sendiri
* thumbnail sendiri

Setiap output berdiri sendiri.

Tidak digabung menjadi satu video panjang.

---

# 4. Business Flow

User membuka M1

↓

Upload Video

↓

System membaca metadata video

↓

User memilih Target Segment

↓

System menghitung jumlah segment

↓

System membuat Slot secara otomatis

↓

User memilih Audio Source pada setiap Slot

↓

Fetch Metadata

↓

Audio di-download

↓

User klik Add Configuration to Pipeline

↓

Masuk Pipeline

↓

Scheduler menentukan waktu render

↓

Start Rendering

↓

Render selesai

↓

Output masuk folder Output M1

---

# 5. UI Requirement

## Upload Video

Button

Upload Video

↓

Open File Dialog

↓

Supported:

* mp4
* mkv
* mov
* avi

---

## Metadata

Metadata WAJIB berasal dari FFprobe.

Yang ditampilkan:

* Video Length
* Resolution
* FPS
* Codec
* Bitrate
* File Size

Semua harus REAL.

---

## Source Video Path

Tetap dipertahankan.

Berfungsi sebagai fallback.

User dapat:

* Browse
* Paste Absolute Path

---

## Channel Profile

DIHAPUS.

Seluruh UI terkait Channel Profile dihapus.

Workspace akan menggantikannya pada sprint berikutnya.

---

# 6. Target Segment

User memilih:

5 Menit

6 Menit

7 Menit

dst.

System otomatis menghitung:

Jumlah Segment

Contoh

Video

13:20

Target

6 Menit

↓

Segment 1

00:00 - 06:00

Segment 2

06:00 - 12:00

Sisa

01:20

↓

Sisa DIBUANG.

Tidak pernah dirender.

---

# 7. Slot Generator

Slot dibuat otomatis.

Bukan dummy.

Jumlah slot = jumlah segment.

Contoh

34 Menit

Target

7 Menit

↓

4 Slot

---

# 8. Audio Source

Setiap Slot memiliki Audio Source sendiri.

Jenis Source:

1.

YouTube

2.

Local Audio

---

# 9. Local Audio

Local Audio tidak boleh lagi mengetik path.

Harus memiliki:

Choose Audio

↓

Browse

↓

Pilih:

* mp3
* wav
* flac
* aac

↓

System membaca metadata.

---

# 10. YouTube Source

Flow

Paste URL

↓

Fetch Metadata

↓

System langsung:

Download Audio

Download Thumbnail

Download Metadata

↓

Metadata tampil.

---

# 11. Metadata Audio

Minimal menampilkan:

Judul

Durasi

Thumbnail

Channel

Status Ready

Semua berasal dari source asli.

---

# 12. Validation

Minimal satu Slot wajib memiliki Audio.

Jika seluruh Slot kosong

↓

Button Add Configuration to Pipeline harus gagal.

Tampilkan pesan:

"No audio source selected."

---

# 13. Estimated Output

Semua harus REAL.

## Estimated Videos

=

Jumlah Slot

---

## Estimated Storage

Dihitung berdasarkan:

Durasi

Codec

Bitrate

Resolution

Tidak boleh hardcoded.

---

## Estimated Render Time

Menggunakan Render History.

Bukan angka dummy.

Semakin banyak render selesai,

estimasi semakin akurat.

---

# 14. Pipeline

Klik

Add Configuration to Pipeline

↓

Seluruh konfigurasi masuk Pipeline.

Belum dirender.

Pipeline menjadi satu-satunya sumber antrian render.

Tidak boleh ada Queue lain.

---

# 15. Render Rule

Setiap Slot menghasilkan satu Output.

Contoh

Video

13 Menit

↓

Target

6 Menit

↓

2 Slot

↓

Slot A

Audio 40 Menit

↓

Output

40 Menit

---

Slot B

Audio 30 Menit

↓

Output

30 Menit

Masing-masing independen.

Tidak digabung.

---

# 16. Watermark

Saat ini menggunakan Placeholder.

Workspace akan menggantinya.

---

# 17. Subscribe Overlay

Jika dicentang

↓

Render Overlay

Jika tidak

↓

Tidak dirender.

---

# 18. Output

Per Slot menghasilkan:

video.mp4

thumbnail.jpg

metadata.json

Semua file benar-benar dibuat di disk.

Tidak boleh menampilkan status Completed apabila file belum ada.

---

# 19. Dummy Data Policy

Seluruh Dummy Data WAJIB dihapus.

Contoh:

Temporary Debug Data

Video ID Dummy

Source URL Dummy

Mock Metadata

Fake Progress

Hardcoded Queue

Placeholder Metrics

Dummy Output

Dummy Storage

Dummy ETA

Dummy Duration

Semua wajib menggunakan data nyata.

---

# 20. Debug Policy

Debug Panel tidak boleh tampil di UI Production.

Jika diperlukan,

Debug hanya melalui:

Console Log

Developer Mode

Terminal Backend

---

# 21. Acceptance Criteria

Sprint dianggap selesai apabila:

✓ Upload membaca metadata asli.

✓ Segment dihitung otomatis.

✓ Slot dibuat otomatis.

✓ Audio YouTube dapat di-fetch.

✓ Local Audio dapat dipilih melalui Browse.

✓ Metadata seluruh source REAL.

✓ Estimated Output REAL.

✓ Pipeline menerima konfigurasi.

✓ Tidak ada Dummy Data.

✓ Tidak ada Fake Progress.

✓ Output benar-benar dibuat di folder.

✓ Thumbnail dibuat.

✓ metadata.json dibuat.

✓ Status Completed hanya muncul jika file benar-benar ada.

---

# 22. Out of Scope

Sprint ini TIDAK mencakup:

Workspace

License System

Hardware ID

AutoUploader

Cloud Upload

AI Metadata Generator

AI Thumbnail Generator

M4 Feature

Semua akan dibahas pada sprint berikutnya.

---

END OF DOCUMENT
