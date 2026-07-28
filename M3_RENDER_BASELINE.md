# M3 RENDER BASELINE (SPRINT 0)
**Project:** M3 NORMAL RENDER OPTIMIZATION
**Status:** READ ONLY

Dokumen ini merupakan rekaman keadaan (*baseline*) mesin rendering M3 yang absolut sebelum Roadmap 3 dimulai. Semua angka, alur, dan metrik di sini akan menjadi pembanding kinerja setelah implementasi.

## 1. Current Render Pipeline
Pipeline render saat ini bekerja secara sinkronus seluruhnya di Main Thread (Utas Utama UI). 
Setiap *frame* dieksekusi secara berurutan mulai dari sinkronisasi waktu pada *Timeline Clock*, membaca *Beat Cache*, menghitung *layout* Subtitle secara *real-time*, dan mengeksekusi operasi gambar (*drawing*) pada *Canvas2D* untuk Visualizer serta Particle. Setelah seluruh kanvas selesai digambar, data piksel diekstrak (dikonversi) menjadi urutan string `Base64 PNG`. String teks besar tersebut dikirimkan menuju *ExportQueue*, yang lalu membacanya kembali dan menulis (ingest) ke dalam *Virtual File System* WebAssembly (FFmpeg) frame demi frame. 

## 2. Current File Inventory
Daftar file inti eksisting dan tanggung jawabnya sebelum Roadmap 3:
- `src/services/pipeline/RenderPipeline.js`: Orkes utama siklus render.
- `src/services/pipeline/export/RenderScheduler.js`: Pewaktu pemanggilan frame render ekspor.
- `src/services/pipeline/export/ExportQueue.js`: Menampung antrean pekerjaan dan frame batch.
- `src/services/pipeline/export/FFmpegPipeline.js`: Menerima frame gambar dan merangkai MP4/WebM.
- `src/visualizers/renderers/Canvas2DRenderer.js`: Sistem gambar *2D Context* (ribuan `fillRect`/`arc`).
- `src/services/visual/ParticleEngineCore.js`: Hitungan matriks partikel, membuat objek di dalam memori saat partikel baru lahir.
- `src/services/subtitle/SubtitleLayoutEngine.js`: Merancang layout dan ukuran font tiap render siklus.
- `src/components/m3/widgets/SubtitleRenderer.jsx`: Merender string subtitle ke DOM (React).

## 3. Current Bottleneck
Berdasarkan Audit M3 (Roadmap 1), hambatan absolut tanpa modifikasi adalah:
1. Ingesti string **Base64 PNG** ke *Virtual FS FFmpeg* mencekik CPU sepenuhnya dan membuang RAM sia-sia.
2. Canvas2D diutas utama dipaksa menggambar puluhan ribu titik/garis untuk **Visualizer** tanpa *batching* tingkat rendah.
3. Proses **Instansiasi Objek Array** yang lahir/mati setiap milidetik di Particle Engine mengundang V8 *Garbage Collection (GC)* membekukan FPS.
4. Kalkulasi ulang *DOM Layout* Subtitle (terutama **Word Highlight & Karaoke**) yang menyita siklus *rendering* internal React.

## 4. Current Metrics
Tabel ukuran beban sistem saat melakukan Ekspor Normal (Pra-R3):

| Metrik | Angka Baseline Saat Ini |
| :--- | :--- |
| **CPU Usage** | Tinggi (~90% - 100%) - Sering Throttling |
| **GPU Usage** | Rendah (~10% - 20%) - Kurang Termaksimalkan |
| **RAM Usage** | Grafik Bergerigi (*Sawtooth*) karena V8 Garbage Collector |
| **Render Time** | Lambat / Menahan Proses Main Thread |
| **Peak Memory** | Tinggi (dapat menembus limit 2GB - 4GB) |
| **Frame Gen Time** | Sangat tidak stabil (terpengaruh Base64 String Decode) |
| **Avg Frame Time** | Tersendat (Jittery / Stutter) |
| **Output Resolusi** | Mendukung 1080p / 4K |
| **Output FPS** | Konfigurasi bawaan (30 / 60 FPS) |

## 5. Current Render Flow
Diagram antrean node render bawaan M3 saat ini:
```text
Render Queue
  ↓
Timeline (Waktu Utama)
  ↓
Background (Layer Paling Bawah)
  ↓
Visualizer (Kanvas Visual Reaktif)
  ↓
Particle (Alokasi & Update Array Emitter)
  ↓
Subtitle (Re-Kalkulasi Bounding Box & CSS)
  ↓
FFmpeg (Base64 Encode ➡️ FS Write ➡️ MP4)
```

## 6. Current Feature Flags
Identifikasi keberadaan bendera pengujian (saklar *fallback* opsional).
**NONE** (Tidak ada. Pipeline berjalan statis tanpa alternatif fallback eksperimental internal).

## 7. Current Risks
Risiko aktual sistem saat ini jika tidak ada perbaikan arsitektur:
- **Browser Crash:** Terlalu banyak Base64 memicu "Out of Memory" (Aw Snap!).
- **Freeze Ekspor:** Antrean frame terblokir karena Thread UI sibuk menghapus (Garbage Collect) 10.000 titik partikel mati.
- **Hardware Overheating:** Pengerjaan CPU 100% untuk waktu lama di laptop pengguna (*Thermal Throttling*).

## 8. Success Comparison Table
Matriks perbandingan ini akan menjadi tolok ukur kesuksesan pada setiap akhir fase Sprint 3.

| Area | Current (Baseline Roadmap 1) | Target (Blueprint Roadmap 2) | Actual (Hasil Roadmap 3) |
| :--- | :--- | :--- | :--- |
| **FFmpeg Ingest** | Base64 PNG String Virtual FS | Raw Uint8Array Stream / OS Pipe | - |
| **Particle Engine** | Dinamis (Array *new Object()*) | Statis (Pre-allocated Object Pooling) | - |
| **Visualizer Draw** | Canvas2D *Unbatched Calls* | Optimized Path Batching / WebGL | - |
| **Subtitle Layout** | Dihitung per frame render | Di-*cache* Bounding Box per Cue | - |
| **Architecture** | 100% Main Thread Sinkronus | Dynamic Worker & Lazy Pipeline | - |
| **Peak CPU Load** | 100% (Memblokir UI Total) | Minimal (Tergantung Target Resolusi) | - |

## 9. Sprint 1 Entry Checklist
Prasyarat untuk menembus gerbang Sprint 1 Roadmap 3:
- [x] Baseline M3_RENDER_BASELINE.md selesai.
- [ ] Baseline M3_RENDER_BASELINE.md disetujui.
- [ ] Tidak ada konflik interpretasi Blueprint.

*(Dokumen bersifat statis/READ ONLY. Modifikasi ditutup).*
