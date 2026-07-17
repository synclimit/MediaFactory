# M3_FFMPEG_RENDER_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### FFmpeg Render Engine Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini mendefinisikan bagaimana Render Engine Mode 3 harus bekerja.

Dokumen ini menjadi acuan implementasi Backend Worker yang menggunakan FFmpeg.

Dokumen ini **tidak membahas UI**.

Dokumen ini hanya membahas proses render.

---

# 2. Render Philosophy

Mode 3 bukan video editor.

Mode 3 adalah **Playlist Video Renderer**.

Seluruh object yang diatur pada Composer hanya menjadi konfigurasi render.

Render dilakukan satu kali saat Queue diproses.

Preview Composer bukan hasil render sebenarnya.

Preview hanya simulasi.

---

# 3. Render Pipeline

Urutan render WAJIB mengikuti pipeline berikut.

```text
Load Configuration

↓

Load Background

↓

Background Processor

↓

Loop Engine

↓

Audio Playlist Builder

↓

Visualizer Renderer

↓

Effects Renderer

↓

Overlay Renderer

↓

Text Renderer

↓

Watermark

↓

Current Playing

↓

Track Counter

↓

Track Change Notification

↓

Thumbnail Renderer

↓

Metadata Generator

↓

FFmpeg Encoding

↓

Output
```

Urutan layer tidak boleh diubah.

---

# 4. Input

Render Engine menerima satu Queue Payload.

Payload minimal berisi:

```text
Project

Playlist

Background

Objects

Effects

Visualizer

Thumbnail

Metadata

Render Profile

Output Folder
```

Render Engine tidak membaca UI secara langsung.

---

# 5. Background Engine

Background hanya memiliki dua mode.

## Mode 1

Image

Format:

* jpg
* png
* webp

Workflow

```text
Load Image

↓

Scale

↓

Crop

↓

Fit Canvas

↓

Ready
```

---

## Mode 2

Video

Format:

* mp4
* mov
* mkv

Workflow

```text
Load Video

↓

Scale

↓

Crop

↓

Loop Engine

↓

Ready
```

Background tidak boleh Image dan Video aktif bersamaan.

---

# 6. Loop Engine

Loop Engine hanya aktif untuk Video Background.

Pilihan:

## Normal

Video diulang dari awal.

---

## Seamless

Video dibuat transisi halus.

Menggunakan crossfade pendek.

Target:

Loop tidak terasa.

---

## Ping Pong

Video diputar:

```text
A → B

↓

B → A

↓

A → B
```

Kemudian hasil Ping Pong digunakan sebagai source loop.

Target:

Tidak terlihat loncatan di titik akhir.

---

# 7. Audio Playlist Builder

Playlist dibangun berdasarkan Current Playlist.

Workflow

```text
Track 1

↓

Track 2

↓

Track 3

↓

...

↓

Track N
```

Output:

Satu stream audio.

---

# 8. Audio Processing

Urutan:

```text
Load Audio

↓

Normalize

↓

Fade In (opsional)

↓

Fade Out (opsional)

↓

Join Playlist

↓

Ready
```

Audio tidak diubah pitch atau tempo pada Mode 3.

---

# 9. Duration Resolver

Durasi video mengikuti total durasi playlist.

```text
Video Duration

=

Total Playlist Duration
```

Jika background lebih pendek:

↓

Loop.

Jika lebih panjang:

↓

Trim.

---

# 10. Visualizer Engine

Visualizer dirender di atas Background.

Mode awal yang didukung:

* Spectrum
* Circle
* Bars
* Wave

Semua visualizer membaca audio final playlist.

---

# 11. Effects Engine

Effects bersifat opsional.

Contoh:

* Snow
* Rain
* Dust
* Fog
* Fireflies
* Glow

Semua effect dirender di atas Background namun di bawah Text.

---

# 12. Overlay Engine

Overlay dirender sesuai urutan.

Layer:

```text
Visualizer

↓

Effects

↓

Playlist Overlay

↓

Track Counter

↓

Current Playing

↓

Subscribe

↓

Watermark
```

Watermark selalu berada pada layer paling atas.

---

# 13. Text Renderer

Object Text:

* Playlist Title
* Current Playing
* Track List
* Custom Text

Semua membaca konfigurasi Composer.

Properti:

* Font
* Size
* Color
* Shadow
* Stroke
* Opacity
* Position

---

# 14. Track List Renderer

Track List dibangun dari Current Playlist.

Mode:

Single

Dual Balanced

Dual Wide

Renderer otomatis membagi lagu berdasarkan mode yang dipilih.

Track List tidak menyimpan data sendiri.

---

# 15. Current Playing Engine

Saat lagu berubah:

Renderer otomatis mengganti:

* Judul
* Nomor Track
* Progress

Pergantian mengikuti Timestamp Generator.

---

# 16. Track Counter

Format:

```text
Track

05 / 15
```

Mengikuti Current Playlist.

---

# 17. Thumbnail Renderer

Thumbnail dirender secara terpisah.

Input:

Thumbnail Configuration.

Output:

```text
thumbnail.jpg
```

Thumbnail tidak diambil dari frame video.

---

# 18. Metadata Generator

Output:

metadata.json

Berisi:

* Title
* Playlist
* Timestamp
* Duration
* Thumbnail
* Render Profile
* Output Path

---

# 19. Encoding Engine

Encoding dilakukan paling akhir.

Input:

Video Layer

*

Audio Layer

↓

FFmpeg Encode

↓

video.mp4

---

# 20. Render Profile

Render Engine membaca Render Profile.

Contoh:

Fast

Balanced

High Quality

Profile menentukan:

* Preset
* CRF
* Thread
* Audio Bitrate

Detail profile dijelaskan pada dokumen terpisah.

---

# 21. Temporary Files

Render menggunakan folder sementara.

```text
temp/

audio/

frames/

cache/

preview/
```

Semua file sementara wajib dihapus setelah render berhasil.

---

# 22. Error Handling

Render harus berhenti apabila:

* Background tidak ditemukan.
* Playlist kosong.
* Audio corrupt.
* Thumbnail gagal dibuat.
* Output folder tidak valid.
* FFmpeg gagal dijalankan.

Semua error dikembalikan ke Pipeline.

---

# 23. Logging

Minimal log:

* Load Background
* Load Playlist
* Build Visualizer
* Render Thumbnail
* Generate Metadata
* Encode Start
* Encode Finish
* Encode Failed

---

# 24. Performance Rules

* Hindari decode ulang asset yang sama.
* Gunakan stream processing bila memungkinkan.
* Jangan membuat file intermediate yang tidak diperlukan.
* Hapus cache setelah render selesai.
* Render berjalan di Worker, bukan di UI.

---

# 25. Output

Minimal menghasilkan:

```text
video.mp4

thumbnail.jpg

metadata.json
```

Ketiga file harus berada pada folder output project.

---

# 26. Acceptance Criteria

Render Engine dianggap selesai apabila:

* Background Image berhasil dirender.
* Background Video berhasil dirender.
* Loop Mode bekerja sesuai pilihan.
* Playlist Audio tergabung dengan benar.
* Visualizer tampil sesuai konfigurasi.
* Effects tampil sesuai konfigurasi.
* Overlay sesuai urutan layer.
* Thumbnail berhasil dibuat.
* Metadata valid.
* FFmpeg menghasilkan video tanpa error.
* Output kompatibel dengan Pipeline dan AutoUploader.

---

# 27. Future Backlog

Tidak termasuk implementasi sprint ini:

* GPU Rendering
* Hardware Encoding Optimization
* HDR Output
* Multi Background Scene
* Animated Text Template
* AI Motion Effect
* AI Subtitle
* Whisper Lyrics
* Dynamic Camera Path
* Cloud Render

---

# 28. Render Freeze

Mulai implementasi:

* Urutan Render Pipeline tidak boleh diubah.
* Layer Order tidak boleh diubah.
* Loop Engine tidak boleh diubah.
* Output Structure tidak boleh diubah.
* Render hanya membaca Queue Payload.

Dokumen ini menjadi acuan resmi implementasi FFmpeg Render Engine untuk Mode 3 Playlist Video Studio.
