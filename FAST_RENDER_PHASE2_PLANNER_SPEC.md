# FAST RENDER ENGINE - PHASE 2: PLANNER SPECIFICATION
**Project:** M3 Fast Render Engine Master Roadmap
**Status:** DESIGN COMPLETE (NO CODING)

---

## 1. Planner Internal Architecture
**Render Strategy Planner** bertindak sebagai "Otak" terisolasi yang mengambil keputusan *sebelum* proses perenderan dimulai.

*   **Input Planner:** 
    *   `Project Object` (Seluruh daftar aset, objek, durasi lagu).
    *   `Timeline Object` (Informasi BPM, segmen lirik).
    *   `Hardware Profile` (Spesifikasi GPU/RAM dari *HardwareDetector*).
    *   `Export Settings` (Resolusi, FPS, Format).
*   **Output Planner:** 
    *   `RenderPlan` (Kontrak eksekusi kaku yang tidak bisa dibantah).
*   **Tahapan Analisis:**
    1.  **Ingestion:** Menerima *input* dan memecahnya menjadi daftar modul yang aktif.
    2.  **Rule Evaluation:** Setiap modul melewati *Rule System* untuk dinilai tingkat kedinamisannya.
    3.  **Segmentation:** Memotong garis waktu (Timeline) menjadi beberapa bagian (Segmen) berdasarkan kejadian (Event) seperti pergantian gambar latar atau lirik.
    4.  **Strategy Formulation:** Merumuskan taktik (Bake, Skip, Duplikat) untuk setiap segmen.
    5.  **Plan Generation:** Mengunci keputusan menjadi objek `RenderPlan`.

---

## 2. Planner Decision Flow (Decision Tree)
Planner mengevaluasi proyek dari lapisan terbawah hingga teratas:

1.  **Hardware Check:** Apakah RAM < 4GB? $\rightarrow$ Jika Ya, jatuhkan ke `Normal Only` (Risiko memori untuk *Baking*).
2.  **Background Check:**
    *   Apakah Video/Shader? $\rightarrow$ Memaksa *Frame-by-Frame* (Gagal Fast Render Penuh).
    *   Apakah Gambar Statis/Warna Solid? $\rightarrow$ Lolos ke taktik *Baking*.
3.  **Global FX / Camera Check:**
    *   Apakah ada efek *Motion Zoom / Shake* di latar belakang? $\rightarrow$ Memaksa *Frame-by-Frame* untuk *Layer* latar.
4.  **Foreground Engine Check (Particle/Visualizer):**
    *   Apakah Particle/Visualizer aktif? $\rightarrow$ Memaksa mode `Layer Strategy` (Pisahkan latar mati dan objek hidup).
5.  **Event-Driven Check (Subtitle / Playlist / Intro):**
    *   Kapan lirik berubah? $\rightarrow$ Catat titik waktu A dan B. Instruksikan *Fast Forward* atau *Frame Duplication* di sela-sela waktu saat lirik tidak bergerak.

---

## 3. Render Plan Specification
`RenderPlan` adalah kontrak mutlak. `Scheduler` hanya membacanya layaknya instruksi mesin, tanpa logika `if/else` berat.

**Struktur Kontrak (JSON Representation):**
```json
{
  "globalStrategy": "LAYER_STRATEGY", 
  "hardwareProfile": "SAFE",
  "canvasLayers": {
     "staticLayer": true,
     "dynamicLayer": true
  },
  "segments": [
    {
      "startFrame": 0,
      "endFrame": 300,
      "strategy": "BAKE_AND_HOLD",
      "bakeTargets": ["Background", "IntroText"],
      "dynamicTargets": []
    },
    {
      "startFrame": 301,
      "endFrame": 3600,
      "strategy": "LAYERED_DYNAMIC",
      "bakeTargets": ["Background"],
      "dynamicTargets": ["Visualizer", "Particle", "Subtitle"]
    }
  ]
}
```
**Aturan Kontrak:** Scheduler dilarang keras menimpa (`override`) keputusan Render Plan. Jika Plan bilang "Tahan (Hold)", Scheduler wajib menyalin *frame* terakhir.

---

## 4. Planner Rule System
Sistem aturan tidak di-*hardcode* di dalam tubuh Planner dengan rentetan `if/else`. Sistem menggunakan pola **Registry Pattern**.

*   **Penyimpanan Aturan:** Terdapat kelas `PlannerRuleRegistry`. Setiap mesin (Visualizer, Subtitle) mendaftarkan aturannya ke sini saat aplikasi diinisialisasi.
*   **Evaluasi Aturan:** Planner melakukan perulangan (`for`) ke seluruh aturan yang terdaftar.
    *   Contoh: `VisualizerRule.evaluate(project)` akan mereturn: `{ requiresDynamicLayer: true, preventsFullFast: true }`.
*   **Ekspansi:** Jika besok ada modul "3D Model", *engineer* cukup membuat `Model3DRule` dan mendaftarkannya, tanpa menyentuh *source code* Planner sama sekali.

---

## 5. Planner Compatibility Levels
Menggunakan 4 level spesifik demi menjaga kestabilan memori dan akurasi:

1.  **Full Fast:** 
    *   *Kondisi:* Hanya berisi lirik, gambar diam, intro diam. Tidak ada efek reaktif audio.
    *   *Eksekusi:* Planner menyuruh FFmpeg menggandakan 1 frame menjadi ratusan frame dalam sedetik tanpa merender Kanvas sama sekali.
2.  **Layer Strategy (Partial Fast):**
    *   *Kondisi:* Latar diam, tetapi ada Visualizer/Partikel yang hidup di depan.
    *   *Eksekusi:* Latar belakang di-*render* (Bake) 1x dan disimpan sebagai gambar tempel. Visualizer dirender di atasnya setiap frame. Menghemat 50% *Draw Calls*.
3.  **Event-Driven Fast:**
    *   *Kondisi:* Latar video pendek yang diulang (*Loop*), dengan Subtitle panjang.
    *   *Eksekusi:* Menggunakan algoritma *modulo* untuk mendaur ulang *cache frame*.
4.  **Normal Only:**
    *   *Kondisi:* Kamera berguncang (*Motion Shake* aktif), Latar belakang video panjang dinamis, Filter keseluruhan aktif.
    *   *Eksekusi:* Planner menyerah dan mendelegasikan 100% beban ke `RenderPipeline` lama (Legacy Fallback).

---

## 6. Segment-Based Planning
**Rekomendasi Mutlak: TIMELINE SEGMENT.**

*Alasan Teknis:*
Merancang eksekusi berdasar *Frame* (Frame-by-frame planning) sama saja dengan membebani CPU dua kali (Satu untuk mikir, satu untuk menggambar per 1/60 detik). 

Dengan pendekatan **Timeline Segment** (misal: Scene Intro 0-5s, Scene Lirik 5-30s), Planner hanya bekerja "Satu Kali" di awal sebelum ekspor. Planner membagi lagu menjadi blok-blok waktu. Saat blok dieksekusi, Scheduler tidak perlu berpikir lagi, melainkan tinggal mengendarai instruksi blok tersebut hingga waktu habis.

---

## 7. Planner Output Examples

**Contoh 1: Project Sederhana (Full Fast)**
*(Latar gambar statis, musik, lirik statis)*
```json
{
  "globalStrategy": "FULL_FAST",
  "segments": [
    {
      "startSec": 0, "endSec": 10,
      "strategy": "DUPLICATE_FRAME",
      "triggerEvent": "Lyric: Aku Cinta Kamu"
    },
    {
      "startSec": 10, "endSec": 20,
      "strategy": "DUPLICATE_FRAME",
      "triggerEvent": "Lyric: Sampai Mati"
    }
  ]
}
```
*Hasil:* Ekspor 3 menit selesai dalam 5 detik.

**Contoh 2: Project Visualizer (Layer Strategy)**
*(Latar gambar statis, ada Visualizer)*
```json
{
  "globalStrategy": "LAYER_STRATEGY",
  "segments": [
    {
      "startSec": 0, "endSec": 180,
      "strategy": "LAYERED_DYNAMIC",
      "bakingInstruction": { "layer": 0, "renderOnce": true },
      "dynamicInstruction": { "layer": 1, "engines": ["BarsRenderer"] }
    }
  ]
}
```
*Hasil:* Background tidak pernah digambar ulang (0 biaya CPU setelah frame pertama).

---

## 8. Extension Strategy (Future-Proofing)
Planner dirancang "Buta terhadap Modul". Ia tidak mengenal apa itu "Visualizer" atau "Subtitle". 
Ia hanya memegang antarmuka (Interface): `IPlannerRule`.

Setiap komponen di M3 wajib mengimplementasikan metode:
*   `analyze(projectData)` $\rightarrow$ me-return tingkat kedinamisan (*Static*, *Layered*, atau *Volatile*).
*   `getEvents()` $\rightarrow$ me-return titik waktu (Timestamp) kapan komponen ini berubah wujud.

Dengan pola Inversi Kendali (*Inversion of Control*) ini, jika suatu hari M3 memiliki modul **AI Video Generator**, modul tersebut cukup mengekspos dirinya sebagai `Volatile` (selalu berubah) ke dalam Registry, dan Planner akan otomatis menurunkannya ke mode `Normal Only` tanpa ada yang perlu memodifikasi kelas inti `StrategyPlanner.js`.
