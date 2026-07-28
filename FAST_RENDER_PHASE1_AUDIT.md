# FAST RENDER ENGINE - PHASE 1 FOUNDATION AUDIT
**Project:** M3 Fast Render Engine Master Roadmap
**Status:** AUDIT COMPLETE (NO CODING)

---

## 1. Existing Architecture
Arsitektur M3 saat ini menggunakan pola **Frame-Based Synchronous Pipeline**. Seluruh proses direkatkan oleh sebuah pipa sentral (`RenderPipeline.js`) yang berjalan secara linear. Arsitektur ini sangat kokoh untuk memastikan akurasi sinkronisasi audio dan visual (deterministik), namun sifatnya "buta"—ia mengeksekusi bingkai demi bingkai secara buta tanpa peduli apakah isi visual di bingkai tersebut statis (tidak berubah) atau dinamis, karena belum memiliki "Otak Perencana" (Strategy Planner).

---

## 2. Existing Render Flow
Alur (*flow*) dasar rendering Normal saat ini bergerak secara sekuensial ke bawah tanpa ada lompatan kondisional tingkat tinggi:

1. **Project Definition** (`ProjectService` / `FrameInputProvider`) -> Menyiapkan konfigurasi aset.
2. **Add To Queue** (`QueueService` / `ExportManager`) -> Mengantrekan tugas (*job*) render.
3. **Render Tick / Loop** (`RenderScheduler`) -> Menggerakkan jarum jam (Timeline) per *dt* (1/60s).
4. **Pipeline Execution** (`RenderPipeline`) -> Memanggil seluruh mesin secara berurutan:
   - `SubtitleRuntime`
   - `BeatEngine` & `AudioDrivenRuntime`
   - `MotionEngine`
   - `VisualRuntime` (Particle, FX)
   - `PlaylistEngine` & `TypographyEngine`
5. **Compositing** (`FrameComposer`) -> Menyatukan *layer* menjadi satu Kanvas utuh.
6. **Output Transmission** (`ExportAdapter`) -> Menarik *pixels* (Base64 / Raw Uint8Array).
7. **Encoding** (`FFmpegPipeline`) -> Menjahit *frame* menjadi MP4/WEBM.

---

## 3. Existing Component Map
Peta komponen penyusun *Render Engine* M3 saat ini:
*   **QueueService & ExportManager:** Pintu masuk tugas dari pengguna.
*   **RenderScheduler:** Mesin pendorong waktu utama (Looping).
*   **RenderPipeline:** Orkesrator yang memanggil komponen di bawahnya.
*   **FrameComposer:** Kanvas penyatuan visual lapis demi lapis (*Layer Composer*).
*   **BeatEngine & AudioDrivenRuntime:** Jantung analisis FFT audio dan *impulse*.
*   **SubtitleRuntime & SubtitleLayoutEngine:** Penampil dan penata letak lirik (*hash cached*).
*   **PlaylistLayoutEngine:** Pengatur visualisasi daftar putar ganda.
*   **VisualRuntime & ParticleEngineCore:** Pelukis *Particle*, *Overlay*, dan efek visual (*Object Pooled*).
*   **BarsRenderer (Visualizer):** Pelukis batang audio (*Path2D Batched*).
*   **ExportAdapter & FFmpegPipeline:** Konverter hasil kanvas menuju fail video riil (mendukung mode *Chunking*).

---

## 4. Existing Dependency Graph
*   **Independen:** `BeatEngine`, `FFmpegPipeline`, `SubtitleLayoutEngine`, `ParticleEngineCore`. Mereka tidak peduli siapa yang memanggil mereka, cukup diberikan *input* maka mereka mengeluarkan *output*.
*   **Bergantung Kuat (Tight Coupling):** `RenderPipeline` sangat bergantung pada ketersediaan *semua* Runtime Engine di bawahnya secara berurutan. `FrameComposer` sangat bergantung pada struktur data seragam (State) yang dikeluarkan `RenderPipeline`.
*   **Dependency Arah Sejalan:** `ExportManager` $\rightarrow$ `RenderScheduler` $\rightarrow$ `RenderPipeline` $\rightarrow$ `FrameComposer` $\rightarrow$ `ExportAdapter`.

---

## 5. Reuse Analysis
Kepatuhan terhadap pedoman *"Reuse before Create"*:
*   **FFmpegPipeline & ExportAdapter:** `Reuse langsung`. Sudah sangat matang dan mendukung ekspor cepat maupun lambat.
*   **Seluruh Mesin Visual & Audio (Subtitle, Particle, Visualizer, dll):** `Reuse langsung`. Logika rendering mereka tidak perlu diubah, mereka siap menerima instruksi kapan pun.
*   **RenderPipeline:** `Perlu modifikasi kecil`. Agar bisa dieksekusi secara selektif oleh Planner (tidak wajib merender seluruh *state* dari awal jika Planner melarangnya).
*   **RenderScheduler:** `Perlu adapter`. Scheduler saat ini bersifat *Time-based loop* buta. Harus dimodifikasi untuk menerima "Resep Taktik" (*Strategy Execution*) dari Planner.
*   **Konsep Baru:** Tidak ada komponen lama yang harus dibuang. *Fast Render* 100% menggunakan komponen di atas.

---

## 6. Planner Integration Points
Pusat integrasi strategis untuk **Render Strategy Planner** berada tepat di **ANTARA** `ExportManager` dan `RenderScheduler`. 

**Skenario Integrasi Lapis Tambahan (Additional Layer):**
1. `ExportManager` menerima proyek.
2. Bukannya langsung diberikan ke `RenderScheduler`, proyek dilempar ke **Render Strategy Planner** terlebih dahulu.
3. **Planner** membedah durasi proyek: 
   - *"Menit ke 01:00 - 02:00 tidak ada partikel, tidak ada visualizer dinamis, hanya lirik statis."* 
   - Planner mencetak tiket instruksi (Strategy Blueprint).
4. `RenderScheduler` tidak lagi berputar buta 60 FPS, melainkan **mengeksekusi perintah Planner**: 
   - Melompat (*skip/fast-forward*) bingkai yang redundan, menahan lukisan latar (*Baking Background*), dan menyuruh `RenderPipeline` hanya menggambar apa yang berubah (*Dirty Frame Only*).

*Posisi Planner: Bertindak sebagai Jenderal (Pengambil Keputusan), Scheduler & Pipeline tetap bertindak sebagai Prajurit (Pengeksekusi).*

---

## 7. Compatibility Analysis
Pemetaan kelayakan modul terhadap pendekatan cerdas (*Fast Render*):
*   **FFmpeg Exporter:** `Fast Compatible`. Mendukung injeksi bingkai duplikat tanpa rendering (misal, merender 1 bingkai lalu menyuruh FFmpeg menggandakannya selama 10 detik).
*   **Subtitle Engine:** `Fast Compatible`. Lirik biasanya diam selama 2-3 detik. Sangat menguntungkan bagi Planner untuk menahan render (Freeze Frame).
*   **Overlay & Static Images:** `Fast Compatible`. Grafis diam mutlak bisa di-baking/disimpan sementara ke Kanvas Lapisan Bawah.
*   **Playlist / Typography:** `Fast Compatible`. Pergerakannya terprediksi.
*   **BarsRenderer (Visualizer):** `Normal Only (Perlu Taktik Khusus)`. Batang audio berubah di *setiap* bingkai. Planner tidak bisa "melompati" area video yang mengandung visualizer. Namun, jika latar belakang statis, Planner bisa membekukan *Background* dan hanya merender Visualizer di lapisan atas (*Layer Compositing Strategy*).
*   **Particle Engine:** `Normal Only (Perlu Taktik Khusus)`. Partikel dinamis bergerak setiap bingkai. Sama seperti Visualizer, taktiknya adalah pemisahan lapisan mati (*Static Layer*) dan lapisan hidup (*Dynamic Layer*).

---

## 8. Risk Analysis & Mitigation
*   **Risiko 1: Konflik State Timeline (Desynchronization).** Jika Planner melompati waktu (*fast-forward*) untuk melewati adegan kosong, mesin yang bergantung pada `deltaTime` terus-menerus (seperti gerak momentum *MotionEngine*) bisa patah atau rusak nilai internalnya saat dibangunkan kembali.
    *   *Mitigasi:* Saat Planner menyuruh lompat waktu, Planner harus menyuntikkan instruksi `engine.simulate(deltaTime)` tanpa harus merender ke kanvas (*Headless Simulation*).
*   **Risiko 2: Keterbatasan FrameComposer.** Saat ini `FrameComposer` membersihkan kanvas (`clearRect`) dan menggambar ulang semuanya per detik. Jika Planner ingin membekukan lapisan statis (*Layer Baking*), Komposer harus dirombak untuk mendukung *Multi-Canvas Caching*.
    *   *Mitigasi:* Mengadopsi pedoman *Extend before Rewrite*. Menambahkan kelas adapter `LayeredFrameComposer` yang membungkus komposer lama dengan fitur memori lapisan.
*   **Risiko 3: Penumpukan Bug Paralel.** M3 saat ini baru stabil. Menginjeksi *Fast Render Strategy* dapat memecah belah logika *Normal Render* jika tidak hati-hati.
    *   *Mitigasi:* Sesuai asas (Normal Render remains untouched). *Fast Render* wajib diposisikan di dalam kelas/rute terpisah, dikendalikan murni melalui rute mode eksklusif. Jika mode ini dimatikan, sistem sepenuhnya jatuh kembali ke *Normal Render* yang kita yakini keutuhannya.
