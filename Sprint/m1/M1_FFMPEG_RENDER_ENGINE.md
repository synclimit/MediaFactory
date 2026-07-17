# M1_FFMPEG_RENDER_ENGINE.md

Version : 1.0
Status : REQUIREMENT FREEZE
Module : M1 Movie Video Generator
Component : Real FFmpeg Render Engine

---

# 1. Tujuan

Dokumen ini mendefinisikan standar implementasi Render Engine M1.

Seluruh proses rendering WAJIB menggunakan FFmpeg.

Tidak boleh menggunakan:

* Fake Progress
* Mock Rendering
* Simulasi Interval
* Dummy Output
* Dummy Status

Status **Completed** hanya boleh diberikan apabila file output benar-benar telah berhasil dibuat di disk.

---

# 2. Render Pipeline Overview

Setiap Job pada Pipeline diproses secara independen.

Workflow:

Pipeline

↓

Waiting

↓

Pending

↓

Rendering

↓

Verifying

↓

Completed

atau

↓

Failed

Tidak ada status lain.

---

# 3. Input Render Job

Setiap Job minimal memiliki data berikut:

* Queue ID
* Workspace ID (sementara placeholder)
* Source Video Path
* Segment Start
* Segment End
* Audio Source Type (YouTube / Local)
* Audio File
* Thumbnail
* Metadata
* Target Resolution
* Playback Speed
* Watermark Enabled
* Subscribe Overlay Enabled
* Output Folder

Semua field harus berasal dari data nyata.

---

# 4. Render Workflow

## STEP 1

Validasi Input

Pastikan:

* Source Video ada
* Audio ada
* Output Folder ada

Jika gagal

↓

Status

FAILED

---

## STEP 2

FFprobe

Membaca metadata:

* Duration
* Width
* Height
* FPS
* Codec
* Bitrate

Semua digunakan sebagai acuan render.

---

## STEP 3

Cut Video

Gunakan FFmpeg untuk memotong video sesuai Segment.

Contoh:

00:00:00

↓

00:06:00

Output:

segment.mp4

---

## STEP 4

Mute Original Audio

Audio asli video WAJIB dihilangkan.

Contoh:

-an

atau filter audio setara.

Output:

Video tanpa audio.

---

## STEP 5

Convert Resolution

Target default:

240p

Skala dilakukan menggunakan FFmpeg Scale Filter.

---

## STEP 6

Playback Speed

Video diperlambat.

Default:

0.5x

Gunakan filter video FFmpeg.

---

## STEP 7

Loop Video

Hitung durasi Audio.

Jika:

Audio > Video

↓

Loop video hingga durasi audio selesai.

Contoh

Video

6 menit

Audio

40 menit

↓

Video diulang berkali-kali hingga tepat 40 menit.

Tidak boleh lebih.

Tidak boleh kurang.

---

## STEP 8

Replace Audio

Audio baru dipasang.

Audio asli tetap tidak digunakan.

---

## STEP 9

Watermark

Jika Enable

↓

Render Watermark.

Jika Disable

↓

Skip.

Watermark sementara menggunakan Placeholder.

---

## STEP 10

Subscribe Overlay

Jika Enable

↓

Render Overlay Subscribe.

Jika Disable

↓

Skip.

---

## STEP 11

Thumbnail

Generate

thumbnail.jpg

Menggunakan frame pertama atau frame yang telah ditentukan oleh sistem.

Tidak boleh menggunakan thumbnail dummy.

---

## STEP 12

Metadata JSON

Generate

metadata.json

Minimal berisi:

* Render ID
* Queue ID
* Source Video
* Audio Source
* Segment
* Resolution
* Codec
* FPS
* Duration
* Output File
* Thumbnail
* Created Time

JSON akan digunakan oleh AutoUploader pada sprint berikutnya.

---

## STEP 13

Verification

WAJIB melakukan pengecekan:

video.mp4

thumbnail.jpg

metadata.json

Gunakan pengecekan file fisik.

Jika salah satu gagal dibuat

↓

Status

FAILED

---

## STEP 14

Completed

Status Completed hanya boleh diberikan apabila:

✓ video.mp4 ada

✓ thumbnail.jpg ada

✓ metadata.json ada

Jika tidak lengkap

↓

FAILED

---

# 5. Progress System

Progress harus berasal dari FFmpeg.

Gunakan:

-progress pipe:1

Parsing:

out_time_ms

Progress dihitung berdasarkan:

Current Encode Time

dibagi

Target Duration

Tidak boleh menggunakan:

progress += 10

progress += 25

setInterval Dummy

atau simulasi lainnya.

---

# 6. Logging Standard

Backend WAJIB mencetak log berikut:

RENDER_START

RENDER_PROGRESS

SEGMENT_CREATED

VIDEO_MUTED

VIDEO_LOOP_STARTED

VIDEO_LOOP_COMPLETED

AUDIO_ATTACHED

WATERMARK_RENDERED

SUBSCRIBE_RENDERED

THUMBNAIL_CREATED

METADATA_CREATED

VERIFY_OUTPUT

OUTPUT_EXISTS

RENDER_COMPLETED

RENDER_FAILED

Semua log menggunakan timestamp.

---

# 7. Error Handling

Jika terjadi:

FFprobe gagal

↓

FAILED

---

Source Video tidak ditemukan

↓

FAILED

---

Audio gagal diunduh

↓

FAILED

---

FFmpeg Exit Code ≠ 0

↓

FAILED

---

Output Folder tidak ada

↓

FAILED

---

Output File tidak ditemukan

↓

FAILED

---

# 8. Output Folder Structure

Output Root

↓

Workspace (Sprint berikutnya)

↓

M1

↓

YYYY-MM-DD

↓

Render_ID

↓

video.mp4

thumbnail.jpg

metadata.json

render.log

Struktur ini wajib dipertahankan agar kompatibel dengan AutoUploader.

---

# 9. Performance Rules

Render dilakukan satu job dalam satu waktu (Sequential Rendering).

Tidak boleh menjalankan dua proses FFmpeg bersamaan pada engine yang sama, kecuali fitur parallel rendering ditambahkan pada sprint mendatang.

---

# 10. Acceptance Criteria

Render Engine dinyatakan selesai apabila:

✓ FFprobe membaca metadata asli.

✓ Segment dipotong sesuai target.

✓ Audio asli berhasil dimute.

✓ Video diperlambat 0.5x.

✓ Video di-loop hingga mengikuti durasi audio.

✓ Audio baru berhasil dipasang.

✓ Watermark berjalan jika aktif.

✓ Subscribe Overlay berjalan jika aktif.

✓ Thumbnail dibuat.

✓ metadata.json dibuat.

✓ Progress berasal dari FFmpeg.

✓ Status Completed hanya muncul jika seluruh file output telah terverifikasi secara fisik.

✓ Tidak ada simulasi render, dummy progress, maupun fake completed.

---

# 11. Future Backlog (Out of Scope Sprint Ini)

Fitur berikut TIDAK diimplementasikan pada sprint ini:

* GPU Acceleration
* Multi Render Worker
* Parallel Rendering
* AI Thumbnail Generator
* AI Subtitle Generator
* AI Intro / Outro Generator
* Visual Effects Pack
* Workspace Watermark Manager
* Hardware Encoder Selection
* Preset Quality Manager

Semua fitur di atas akan dibahas pada sprint berikutnya.

---

END OF DOCUMENT
