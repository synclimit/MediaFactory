# IMPLEMENTATION PRIORITY MATRIX
**Project:** M3 NORMAL RENDER OPTIMIZATION
**Status:** PRE IMPLEMENTATION (READ ONLY)

Dokumen ini merupakan penapisan akhir (filter evaluasi) bagi setiap kandidat perubahan yang telah diaudit. Penilaian dilakukan dengan mempertimbangkan rasio **Keuntungan Mutlak (ROI)** berbanding terbalik dengan **Tingkat Bahaya (Risiko)**, memastikan eksekusi Roadmap 3 dimulai dari langkah yang paling aman dan memberikan dampak performa paling masif.

---

## 1. PENILAIAN KANDIDAT PERUBAHAN
*(Skala 1 - 10. Nilai Tinggi = Sangat Berdampak/Sangat Sulit/Sangat Berisiko).*

### A. Subtitle Layout Bounding Box Cache
Menyimpan hasil perhitungan geometri kotak *font* per-*cue* untuk mencegah `measureText` per-frame.
*   **Technical Impact:** 7
*   **Performance Gain:** 8 (Menghapus beban CPU Layout layouter saat teks bergerak).
*   **Complexity:** 2 (Mudah, cukup gunakan Object/Map untuk Hash Cache).
*   **Risk:** 2 (Risiko teks tertinggal/tidak *update* jika frame direstart).
*   **Rollback Difficulty:** 1 (Sangat mudah, cukup kembalikan blok perhitungan).
*   **Dependency Count:** 2 (`SubtitleLayoutEngine`, `SubtitleWorkspaceModel`).
*   **Priority Score:** **80 / 100** (Sangat Aman, ROI Tinggi).

### B. Particle Object Pool (Pre-allocation)
Mengalokasikan *fixed array* ribuan partikel di awal (`new Array(10000)`) untuk menggantikan instansiasi objek dinamis (`new Particle`).
*   **Technical Impact:** 8
*   **Performance Gain:** 9 (Mengeliminasi sepenuhnya paku GC / *Garbage Collection* yang membekukan FPS).
*   **Complexity:** 3 (Sedang, butuh mengubah loop render menjadi pasif).
*   **Risk:** 3 (Risiko array indeks melampaui batas / *out of bounds*).
*   **Rollback Difficulty:** 2 (Mudah).
*   **Dependency Count:** 2 (`ParticleEngineCore`, `ParticleProfiles`).
*   **Priority Score:** **85 / 100** (Relatif Aman, ROI Sangat Tinggi).

### C. FFmpeg Raw Uint8Array Buffer Pipe
Mengganti string Base64 yang super mahal dengan transfer *array buffer* mentah langsung ke *Virtual FS FFmpeg*.
*   **Technical Impact:** 10 (Merombak jantung aliran data aplikasi).
*   **Performance Gain:** 10 (Bottleneck #1 hilang, ekspor diproyeksikan 200% - 300% lebih cepat tanpa macet CPU).
*   **Complexity:** 6 (Cukup kompleks karena berurusan dengan tipe data mentah *buffer* dan *memory leak* browser).
*   **Risk:** 8 (Berbahaya. Jika Buffer format/alignment salah, MP4 akan hancur/garbled).
*   **Rollback Difficulty:** 4 (Butuh *Feature Flag Toggle* yang kokoh).
*   **Dependency Count:** 3 (`FFmpegPipeline`, `ExportQueue`, `Canvas/Adapter`).
*   **Priority Score:** **75 / 100** (Sangat Berisiko, tapi ROI Absolut / Fundamental).

### D. Lazy Pipeline & Conditional Execution
Mem-bypass pemanggilan (*update tick*) ke modul-modul yang tidak ada di skema proyek.
*   **Technical Impact:** 5
*   **Performance Gain:** 5 (Menghemat siklus CPU dari perulangan kosong).
*   **Complexity:** 3 (Hanya menambah `if-else` *guardian*).
*   **Risk:** 2 (Aman).
*   **Rollback Difficulty:** 1 (Sangat mudah).
*   **Dependency Count:** 4+ (Seluruh *Engine Runtime*).
*   **Priority Score:** **70 / 100** (Aman, ROI Menengah).

### E. Visualizer Canvas Path Batching
Menyatukan pemanggilan API Canvas2D (seperti `fillRect`) ke dalam satu *Path2D batch*.
*   **Technical Impact:** 6
*   **Performance Gain:** 7 (Mengurangi *draw calls* GPU yang mencekik Main Thread).
*   **Complexity:** 5 (Butuh *refactor* fungsi geometri tiap bentuk visualizer).
*   **Risk:** 4 (Visualisasi bisa terlihat tidak proporsional jika koordinat path meleset).
*   **Rollback Difficulty:** 3 (Sedang).
*   **Dependency Count:** 10+ (Bergantung pada seluruh *Plugin Visualizer*).
*   **Priority Score:** **65 / 100** (Risiko Sedang, ROI Menengah-Tinggi).

### F. Dynamic Worker Scheduler
Memisahkan kalkulasi *Particle* & *Visualizer Math* ke *WebWorker* khusus.
*   **Technical Impact:** 10 (Mengubah arsitektur *Single-Thread* menjadi *Multi-Thread*).
*   **Performance Gain:** 7 (Memberi nafas pada UI Thread, tetapi menambah beban IPC *overhead*).
*   **Complexity:** 9 (Sangat sulit karena *SharedArrayBuffer* butuh isolasi header `Cross-Origin-Opener-Policy`).
*   **Risk:** 9 (Bisa menghancurkan proses sinkronisasi audio-video secara total).
*   **Rollback Difficulty:** 8 (Sangat sulit di-*rollback* tanpa versi penuh aplikasi).
*   **Dependency Count:** Banyak.
*   **Priority Score:** **40 / 100** (Sangat Berisiko, ROI Tergantung Ekosistem). Dikerjakan terakhir.

---

## 2. URUTAN PRIORITAS IMPLEMENTASI (EXECUTION ORDER)
Berdasarkan kalkulasi matriks di atas, implementasi akan dikerjakan dari yang paling aman (risiko merusak sistem paling kecil) dan memberikan dampak instan pada stabilitas:

*   **PRIORITY 1: Particle Object Pool (Skor: 85)**
    *   *Alasan:* Implementasinya tidak menuntut perubahan arsitektural. Sekali diaktifkan, memori akan *flat* tanpa membeku akibat GC, memastikan stabilitas instan.
*   **PRIORITY 2: Subtitle Layout Caching (Skor: 80)**
    *   *Alasan:* Sangat mudah diaplikasikan. Membebaskan perulangan *Render Tree React* dari menghitung kotak font setiap milidetik yang boros CPU.
*   **PRIORITY 3: Lazy Pipeline Check (Skor: 70)**
    *   *Alasan:* Pemasangan *guard if/else* sederhana di pipeline. Akan menyingkirkan *engine* hantu dari eksekusi.
*   **PRIORITY 4: FFmpeg Raw Buffer Stream (Skor: 75)**
    *   *Alasan:* Perbaikan Bottleneck terbesar. Dilakukan di urutan ke-4 agar 3 perbaikan kecil sebelumnya sudah menjamin memori stabil saat pengujian MP4 berjalan. Harus dikurung rapat dengan *Feature Flag*.
*   **PRIORITY 5: Visualizer Path Batching (Skor: 65)**
    *   *Alasan:* Berguna untuk mode *Nature/Spiral* yang berat, tetapi memakan banyak waktu untuk menyesuaikan plugin visualizer satu per satu.
*   **PRIORITY 6: Dynamic Worker (Skor: 40)**
    *   *Alasan:* Resor (*resort*) terakhir. Hanya diimplementasikan bila 5 tahap sebelumnya belum cukup membuat rendering ekspor menembus performa target.

---
*(Dokumen Priority Matrix telah selesai dan terkunci. Proses ditunda menunggu lampu hijau eksekusi koding).*
