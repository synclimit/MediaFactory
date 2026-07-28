# M3 BENCHMARK DATASET (PRE-SPRINT 1)
**Project:** M3 NORMAL RENDER OPTIMIZATION
**Status:** READ ONLY

Dokumen ini mendefinisikan dataset uji resmi untuk optimasi M3 Render Engine. Seluruh pengujian performa selama eksekusi Roadmap 3 **WAJIB** menggunakan referensi dataset di bawah ini untuk memastikan perbandingan *apple-to-apple*. 

---

## 1. DEFINISI DATASET

### DATASET A (Project Ringan)
*   **Tujuan:** Mengukur efisiensi *Subtitle Cache*, *Background Decode*, dan *FFmpeg Raw Buffer Pipeline* tanpa adanya hambatan memori dari fitur berat. Mengukur performa *Main Thread* murni.
*   **Durasi:** 30 Detik
*   **Resolusi:** 1080p (1920x1080)
*   **FPS:** 30 FPS
*   **Jumlah Subtitle:** 50 Baris / Cue (Mode: *Paragraph/Static*)
*   **Jumlah Beat:** ~60 Beats (120 BPM)
*   **Visualizer:** NONE (Tidak Ada)
*   **Particle:** NONE (Tidak Ada)
*   **FX:** NONE (Tidak Ada)
*   **Overlay:** 1 Logo Statis (PNG) di pojok kanan atas
*   **Background:** Gambar/Image statis (JPG resolusi tinggi)
*   **Audio:** MP3 Stereo (320kbps)
*   **Output Format:** MP4 (H.264)

### DATASET B (Project Sedang)
*   **Tujuan:** Mengukur efisiensi penjadwalan *Dynamic Worker* tunggal, sinkronisasi *Beat Engine*, *Visualizer Batching*, dan *Cache Lifetime* campuran.
*   **Durasi:** 60 Detik (1 Menit)
*   **Resolusi:** 1080p (1920x1080)
*   **FPS:** 60 FPS
*   **Jumlah Subtitle:** 120 Baris / Cue (Mode: *Word Highlight*)
*   **Jumlah Beat:** ~130 Beats (130 BPM)
*   **Visualizer:** 1 Aktif (Mode: *Ribbon* / *Dual Monitors* - Beban Sedang)
*   **Particle:** NONE (Tidak Ada)
*   **FX:** 1 Lapis (Filter *Screen Glow* ringan)
*   **Overlay:** 1 Video Animasi Transparan (WebM)
*   **Background:** Video Looping dinamis (MP4 1080p)
*   **Audio:** MP3 Stereo (320kbps)
*   **Output Format:** MP4 (H.264)

### DATASET C (Project Berat / Stress Test)
*   **Tujuan:** *Stress Test* ekstrem untuk menguji batas *Garbage Collection* V8, keberhasilan *Object Pooling*, batas transfer antar IPC (*Worker to Main Thread*), dan toleransi *Out-of-Memory* GPU.
*   **Durasi:** 180 Detik (3 Menit)
*   **Resolusi:** 4K (3840x2160)
*   **FPS:** 60 FPS
*   **Jumlah Subtitle:** 500 Baris / Cue (Mode: *Karaoke Fill* - Beban Layout Maksimal)
*   **Jumlah Beat:** ~450 Beats (150 BPM)
*   **Visualizer:** 1 Aktif (Mode: *Mandala Audio Cymatics* - Math/Vertex Ekstrem)
*   **Particle:** 1 Aktif (Mode: *Burst & Continuous* - Alokasi 10.000 partikel)
*   **FX:** 3 Lapis Aktif (*Bokeh Depth*, *Scan*, *Blur*)
*   **Overlay:** 2 *Reactive Overlays* (Goyang mengikuti Beat)
*   **Background:** 2 Video 4K dengan *Crossfade Transition*
*   **Audio:** WAV Lossless (44.1kHz)
*   **Output Format:** MP4 (H.264 High Bitrate)

---

## 2. TABEL BENCHMARK (KOSONG)
Tabel ini harus diisi pada setiap fase Validasi (*Sprint Validation*) selama Roadmap 3 untuk membuktikan ROI (*Return on Investment*) teknis.

| Metrik Evaluasi | Dataset A | Dataset B | Dataset C |
| :--- | :--- | :--- | :--- |
| **CPU Usage (Avg/Peak)** | | | |
| **GPU Usage (Avg/Peak)** | | | |
| **RAM Usage (Avg/Peak)** | | | |
| **Render Time Total** | | | |
| **Frame Gen Time (Avg)** | | | |
| **Stutter / Freeze Rate**| | | |
| **Output File Size** | | | |

---
*(Dokumen Benchmark Dataset Selesai. Status: READ ONLY).*
