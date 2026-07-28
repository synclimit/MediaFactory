# SPRINT 1: FILE AUDIT REPORT
**Project:** M3 NORMAL RENDER OPTIMIZATION
**Status:** PRE IMPLEMENTATION (READ ONLY)

Berdasarkan investigasi nyata pada *source code* (tanpa asumsi), berikut adalah hasil audit komprehensif atas titik-titik file yang akan dimodifikasi pada Roadmap 3 untuk injeksi arsitektur Raw Buffer, Cache, Object Pool, Worker, dan Lazy Pipeline.

---

## 1. Modul FFmpeg Export
**Path Lengkap:** `D:\MediaFactory\src\services\pipeline\export\FFmpegPipeline.js`
*   **Fungsi Utama:** Melakukan integrasi `ffmpeg.wasm` dan mengonversi urutan frame menjadi video utuh.
*   **Public API:** `initialize()`, `ingestFrame(renderFrame, adapterData)`, `finalize()`
*   **Dependency Masuk:** `@ffmpeg/ffmpeg`, `@ffmpeg/util` (`fetchFile`)
*   **Dependency Keluar:** `ExportQueue` (via callback progress), `RenderScheduler`
*   **Risiko Perubahan:** **CRITICAL**
*   **Boleh Dimodifikasi?** **YA**
*   **Alasan:** Ini adalah titik *bottleneck* absolut di mana iterasi saat ini mengubah frame menjadi `Base64 String` dan memanggil `fetchFile` per-frame. Baris `adapterData.base64` di fungsi `ingestFrame()` WAJIB diganti dengan injeksi Raw Buffer mentah untuk mencegah CPU 100%.

## 2. Modul Render Scheduler
**Path Lengkap:** `D:\MediaFactory\src\services\pipeline\export\RenderScheduler.js`
*   **Fungsi Utama:** Mengatur detak (*ticking clock*) secara sinkron/deterministik untuk *offline rendering* menggantikan `requestAnimationFrame`.
*   **Public API:** `start()`, `pause()`, `resume()`, `stop()`
*   **Dependency Masuk:** `RenderPipeline`, `Timeline`
*   **Dependency Keluar:** User Interface Export Modal, React Hooks.
*   **Risiko Perubahan:** **HIGH RISK**
*   **Boleh Dimodifikasi?** **YA**
*   **Alasan:** Modul ini bertanggung jawab atas iterasi variabel `dt` dan sinkronisasi audio. Diperlukan penambahan logika penahanan (await Promise) bila *Worker* belum siap (*Worker Scheduler Integration*), serta implementasi *Adaptive Resource* di dalam `start()` loop.

## 3. Modul Render Pipeline (Main Logic)
**Path Lengkap:** `D:\MediaFactory\src\services\pipeline\RenderPipeline.js`
*   **Fungsi Utama:** Memanggil seluruh engine *runtime* (subtitle, visual, motion, dsb) dalam satu orkestrasi per-frame.
*   **Public API:** Konstruktor tunggal, `executeFrame()`, metode reset state.
*   **Dependency Masuk:** `subtitleRuntime`, `visualRuntime`, `audioDrivenRuntime`, `FrameComposer`, dll.
*   **Dependency Keluar:** Dijalankan oleh `RenderScheduler`.
*   **Risiko Perubahan:** **MEDIUM RISK**
*   **Boleh Dimodifikasi?** **YA**
*   **Alasan:** File ini memuat pemanggilan secara mutlak ke seluruh modul. Titik ini merupakan lokasi terbaik untuk menanamkan **Lazy Pipeline** dan **Conditional Graph**. Eksekusi modul seperti `subtitleRuntime.update()` harus dijaga oleh blok `if (config.hasSubtitle)` agar tidak memakan CPU.

## 4. Modul Particle Engine
**Path Lengkap:** `D:\MediaFactory\src\services\visual\ParticleEngineCore.js`
*   **Fungsi Utama:** Membuat emitter, menghitung lintasan (delta), umur (lifespan), dan menghancurkan partikel berdasarkan profil.
*   **Public API:** `setContext()`, `update(dt)`, `draw()`
*   **Dependency Masuk:** Konfigurasi `ParticleProfiles` bawaan, `ReactiveObjectProcessor`.
*   **Dependency Keluar:** `VisualRuntime` / Modul Pemanggil.
*   **Risiko Perubahan:** **HIGH RISK**
*   **Boleh Dimodifikasi?** **YA**
*   **Alasan:** Implementasi saat ini (kemungkinan besar memicu Array `push()` / `splice()`) mengakibatkan **Garbage Collection Spikes**. Modifikasi **Object Pool** wajib diinjeksi pada fungsi konstruktor (menyiapkan fixed array, misalnya `new Array(10000)`) dan memakai bendera `isActive` untuk mengatur hidup matinya partikel.

## 5. Modul Subtitle Layout
**Path Lengkap:** `D:\MediaFactory\src\services\subtitle\SubtitleLayoutEngine.js`
*   **Fungsi Utama:** Menghitung ukuran metrik bounding box teks, batas paragraf lebar font (`width/height`).
*   **Public API:** `calculate(parsedSubtitles, config)`
*   **Dependency Masuk:** Transcript/Objek Subtitle.
*   **Dependency Keluar:** Layouter komponen seperti `SubtitleRenderer.jsx`.
*   **Risiko Perubahan:** **LOW RISK**
*   **Boleh Dimodifikasi?** **YA**
*   **Alasan:** Perhitungan DOM Box Model atau algoritma pengisi paragraf sangat mahal. Implementasi **Subtitle Cache** harus ditanam pada fungsi `calculate()` dengan menyimpan *hash* dari ID string teks. Jika ID teks sama pada panggilan frame berikutnya, *return* nilai cache langsung.

## 6. Modul Canvas2D Renderer (Visualizer Engine)
**Path Lengkap:** `D:\MediaFactory\src\visualizers\renderers\Canvas2DRenderer.js`
*   **Fungsi Utama:** Abstraksi perintah-perintah gambar (*stroke, fill, arc*) khusus untuk visualizer.
*   **Public API:** Fungsi geometri (seperti `drawRect`, `drawLine`, `clear`).
*   **Dependency Masuk:** Browser Native `CanvasRenderingContext2D`.
*   **Dependency Keluar:** Plugin Visualizer dari `VisualizerRegistry` (`BarsRenderer`, dll).
*   **Risiko Perubahan:** **HIGH RISK**
*   **Boleh Dimodifikasi?** **YA**
*   **Alasan:** Implementasi visualizer yang memanggil metode fill satu per satu sangat mencekik Main Thread CPU. Modifikasi diperlukan untuk membungkus panggilan menggunakan **Path Batching** (`Path2D API`), sehingga ratusan baris spektrum dapat digambar hanya dalam satu fungsi *draw call* native GPU per-frame.

---
*(Dokumen Sprint 1 File Audit Report Selesai - Standby untuk Review).*
