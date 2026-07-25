# M2 Mode 3 Master Plan -- Generate Assets

## Status

Draft v1.0 (Planning Only)

## Tujuan

Mode 3 pada M2 berfungsi sebagai **Generate Assets Engine** untuk
seluruh kebutuhan analisis audio. Modul ini bukan renderer video dan
bukan bagian dari M3. Seluruh implementasi akan dikerjakan oleh Gravity
berdasarkan dokumen ini.

------------------------------------------------------------------------

# Goal

-   Melakukan analisis audio satu kali.
-   Menyimpan hasil analisis sebagai cache.
-   Menghilangkan analisis ulang pada Live Editor.
-   Mendukung PC kentang maupun PC high-end.
-   Menjaga UX tetap sederhana.
-   Memanfaatkan resource hardware secara efisien tanpa bottleneck.

------------------------------------------------------------------------

# Scope

Input: - Folder Audio - File Audio

Output: - Audio asli (tidak diubah) - File `.srt` - File
`.analysis.json`

Tidak menghasilkan video.

------------------------------------------------------------------------

# Filosofi

Generate Assets adalah proses **pre-processing audio**.

Semua analisis dilakukan sekali, disimpan, lalu digunakan kembali oleh
seluruh engine MediaFactory.

------------------------------------------------------------------------

# Posisi Modul

M1 : Tidak terkait

M2 : - Mode 1 - Mode 2 - **Mode 3 → Generate Assets**

M3 : - Live Editor - Membaca hasil Generate Assets - Tidak menjalankan
Whisper

Render Queue: - Hanya untuk render video. - Tidak menjalankan Whisper.

------------------------------------------------------------------------

# Workflow User

1.  User memilih folder audio.
2.  MediaFactory melakukan scan audio.
3.  Queue Generate Assets dibuat otomatis.
4.  Seluruh lagu diproses.
5.  Asset disimpan di folder yang sama.
6.  Selesai.
7.  Saat M3 membuka lagu, asset otomatis dimuat.

User tidak pernah memilih: - SRT - JSON - Beat - Metadata

Semuanya otomatis.

------------------------------------------------------------------------

# Struktur Output

Contoh:

Relax.mp3 Relax.srt Relax.analysis.json

MP3 tetap file asli.

Tidak diubah. Tidak di-copy. Tidak di-encode ulang.

------------------------------------------------------------------------

# Isi analysis.json

## Metadata

-   Durasi
-   Sample Rate
-   Channels
-   Bitrate
-   File Size

## Beat

-   BPM
-   Beat Timeline

## Subtitle

-   Timestamp per kata (untuk karaoke)
-   Bahasa hasil deteksi
-   Confidence (opsional)

Catatan: Teks subtitle utama tetap berada di file SRT.

## Fingerprint

-   Audio Hash

## Version

-   Schema Version
-   Whisper Version
-   Beat Engine Version

------------------------------------------------------------------------

# Keputusan yang Sudah Dikunci

-   Waveform tidak disimpan (sesuai desain saat ini).
-   BPM wajib disimpan.
-   Beat Timeline wajib disimpan.
-   Whisper dijalankan satu kali.
-   Hasil Whisper digunakan kembali.
-   M3 tidak menjalankan Whisper.
-   M3 hanya membaca asset.

------------------------------------------------------------------------

# Subtitle

Whisper menghasilkan:

-   Subtitle (SRT)
-   Timestamp per kata

Mode tampilan di M3:

-   Sentence
-   Karaoke Lite
-   Karaoke Studio

Semua memakai data analisis yang sama.

Tidak ada analisis ulang.

------------------------------------------------------------------------

# UX

User hanya mengenal:

-   Folder Audio
-   Lagu

User tidak perlu mengetahui adanya: - SRT - JSON - Beat - Metadata

Semua ditangani backend.

------------------------------------------------------------------------

# Optimasi

-   Batch Queue
-   Skip Existing Assets
-   Resume Queue
-   Incremental Save
-   Dynamic Worker
-   Multi-core Processing
-   Audio Decode Once
-   Smart Cache
-   Fingerprint Validation
-   Background Processing
-   Auto GPU Detection (bila tersedia)
-   Per-song Isolation (gagal satu lagu tidak menghentikan batch)
-   Smart Scheduler

------------------------------------------------------------------------

# Integrasi dengan M3

Saat user memilih MP3:

MediaFactory otomatis mencari:

-   file SRT
-   file analysis.json

Jika ditemukan: langsung dimuat.

Jika belum ada: tawarkan Generate Assets.

Tidak ada upload manual.

------------------------------------------------------------------------

# Target UX

Generate Assets dijalankan sekali.

Selanjutnya seluruh workflow terasa instan.

User cukup bekerja dengan lagu, bukan dengan file pendukung.
