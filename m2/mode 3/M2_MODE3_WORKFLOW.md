# M2 Mode 3 Workflow

## Status

Draft v1.0 (Planning Only)

# Tujuan

Menjelaskan alur kerja Generate Assets dari awal hingga selesai tanpa
membahas implementasi kode.

------------------------------------------------------------------------

# Workflow Utama

1.  User membuka M2.
2.  User memilih Mode 3 - Generate Assets.
3.  User memilih satu file audio atau satu folder audio.
4.  MediaFactory melakukan scan seluruh file audio yang didukung.
5.  Queue Generate Assets dibuat otomatis.
6.  Seluruh lagu diproses satu per satu atau paralel sesuai kemampuan
    hardware.
7.  Asset disimpan.
8.  Queue selesai.

------------------------------------------------------------------------

# Scan Audio

Saat folder dipilih:

-   Scan seluruh audio.
-   Abaikan file yang tidak didukung.
-   Tampilkan jumlah lagu yang ditemukan.

------------------------------------------------------------------------

# Queue

Setiap lagu menjadi satu job independen.

Contoh:

Job 001 Relax.mp3

Job 002 Rain.mp3

Job 003 Ocean.mp3

------------------------------------------------------------------------

# Validasi

Sebelum generate:

-   Cek apakah analysis.json sudah ada.
-   Cek apakah SRT sudah ada.
-   Validasi fingerprint bila tersedia.

Jika asset masih valid:

SKIP.

Jika belum ada atau tidak valid:

Generate.

------------------------------------------------------------------------

# Generate Assets

Untuk setiap lagu:

1.  Baca audio.
2.  Generate metadata.
3.  Analisis beat.
4.  Hitung BPM.
5.  Jalankan Whisper.
6.  Simpan subtitle SRT.
7.  Simpan analysis.json.

------------------------------------------------------------------------

# Output

Setelah selesai:

NamaLagu.mp3 NamaLagu.srt NamaLagu.analysis.json

Semua berada pada folder yang sama.

------------------------------------------------------------------------

# Error Handling

Jika satu lagu gagal:

-   Tandai Failed.
-   Simpan log.
-   Lanjut ke lagu berikutnya.

Batch tidak boleh berhenti hanya karena satu file gagal.

------------------------------------------------------------------------

# Resume

Jika aplikasi ditutup atau crash:

-   Queue terakhir disimpan.
-   Saat dibuka kembali, lanjut dari lagu yang belum selesai.

------------------------------------------------------------------------

# Progress

Tampilkan:

-   Lagu selesai
-   Lagu diproses
-   Lagu gagal
-   Lagu tersisa
-   Estimasi waktu (opsional)

------------------------------------------------------------------------

# Integrasi M3

Saat M3 membuka MP3:

1.  Cari file SRT.
2.  Cari analysis.json.
3.  Muat otomatis.

Jika asset belum tersedia:

Tawarkan Generate Assets.

Tidak meminta user memilih file SRT atau JSON secara manual.

------------------------------------------------------------------------

# UX Principles

-   Satu klik untuk memulai.
-   Tidak ada konfigurasi teknis yang wajib.
-   User hanya bekerja dengan file audio.
-   Seluruh file pendukung dikelola backend.
