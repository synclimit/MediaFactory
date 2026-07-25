# M2 Mode 3 Asset Specification

## Status

Draft v1.0 (Planning Only)

# Tujuan

Dokumen ini menjelaskan seluruh output yang dihasilkan oleh M2 Mode 3
(Generate Assets).

Dokumen ini hanya mendefinisikan struktur dan fungsi asset. Tidak
membahas implementasi kode.

------------------------------------------------------------------------

# Output

Contoh:

Relax.mp3 Relax.srt Relax.analysis.json

Audio asli tetap dipertahankan.

Generate Assets tidak mengubah file audio.

------------------------------------------------------------------------

# Relax.mp3

Fungsi: - Audio utama. - Menjadi sumber seluruh asset. - Digunakan oleh
M2, M3, Render Queue.

Tidak dimodifikasi.

------------------------------------------------------------------------

# Relax.srt

Fungsi:

Subtitle standar untuk video.

Berisi: - Timestamp per kalimat - Isi subtitle

Digunakan untuk: - Subtitle biasa - Sentence Mode - Editing subtitle

Bukan sumber data karaoke.

------------------------------------------------------------------------

# Relax.analysis.json

Fungsi:

Cache hasil analisis audio.

Seluruh engine membaca file ini agar tidak melakukan analisis ulang.

------------------------------------------------------------------------

# Struktur Data

## Metadata

Berisi informasi dasar audio:

-   Judul (jika tersedia)
-   Durasi
-   Sample Rate
-   Channels
-   Bitrate
-   File Size

Tujuan:

Menghindari pembacaan MP3 berulang.

------------------------------------------------------------------------

## Beat Analysis

Berisi:

-   BPM
-   Beat Timeline

Digunakan oleh:

-   Beat Engine
-   Motion Engine
-   Zoom Pulse
-   Camera Shake
-   Reactive Background
-   Visualizer
-   Engine lain yang membutuhkan sinkronisasi beat

Beat dianalisis satu kali.

Seluruh engine menggunakan hasil yang sama.

------------------------------------------------------------------------

## Subtitle Analysis

Berisi:

-   Timestamp per kata
-   Bahasa hasil deteksi
-   Confidence (opsional)

Tidak menyimpan isi subtitle utama.

Isi subtitle tetap berada di file SRT.

Tujuan:

-   Karaoke Lite
-   Karaoke Studio
-   Sinkronisasi per kata
-   Pengembangan fitur subtitle di masa depan

------------------------------------------------------------------------

## Audio Fingerprint

Berisi hash unik audio.

Tujuan:

-   Mendeteksi perubahan file.
-   Menentukan apakah asset masih valid.
-   Menghindari generate ulang yang tidak diperlukan.

------------------------------------------------------------------------

## Version

Berisi:

-   Schema Version
-   Whisper Version
-   Beat Engine Version

Tujuan:

Menentukan kompatibilitas asset dengan versi engine.

------------------------------------------------------------------------

# Data yang Tidak Disimpan

Sesuai keputusan saat ini:

-   Waveform
-   Thumbnail
-   Visualizer
-   Video Preview

Jika di masa depan dibutuhkan, dapat ditambahkan melalui versi schema
berikutnya.

------------------------------------------------------------------------

# Hubungan Antar Asset

Relax.mp3 │ ├── Relax.srt │ └── Relax.analysis.json

Ketiga file memiliki nama dasar yang sama agar dapat ditemukan otomatis
oleh MediaFactory.

------------------------------------------------------------------------

# Integrasi Live Editor

Saat user memilih:

Relax.mp3

MediaFactory otomatis:

1.  Mencari Relax.srt
2.  Mencari Relax.analysis.json
3.  Memuat seluruh asset

User tidak perlu memilih file pendukung secara manual.

------------------------------------------------------------------------

# Prinsip Desain

-   Audio tetap menjadi sumber utama.
-   Asset merupakan cache analisis.
-   Analisis dilakukan satu kali.
-   Seluruh engine menggunakan hasil analisis yang sama.
-   Backend mengelola seluruh asset secara otomatis.
