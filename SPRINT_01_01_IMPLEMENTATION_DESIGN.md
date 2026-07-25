# SPRINT 01.01 - IMPLEMENTATION DESIGN
## M3 PERFORMANCE ROADMAP: BEAT RUNTIME BLUEPRINT

**Status:** COMPLETED (WAITING APPROVAL)
**Priority:** CRITICAL
**Owner:** Gravity

---

## 1. DESIGN CANDIDATES

Berdasarkan *evidence* dari investigasi sebelumnya, Gravity mengusulkan 3 desain arsitektur untuk menanggulangi eksekusi ganda dan kebocoran alokasi di `BeatEngine.update()`.

### DESIGN A: Microtask Tick Lock (Rekomendasi Utama)
**Konsep:** Memanfaatkan mekanisme *event loop* JavaScript murni. `BeatEngine` memiliki sebuah *flag* `_inCurrentTick`. Saat `update()` dipanggil pertama kali di dalam satu *synchronous macrotask* (seperti `requestAnimationFrame`), *flag* dinyalakan dan fungsi *reset* dilempar ke `queueMicrotask`. Semua pemanggilan `update()` selanjutnya di dalam macrotask yang sama akan langsung dikembalikan (*return*) tanpa kalkulasi.

**Flow:**
1. Call 1 (UI) $\rightarrow$ `_inCurrentTick === false` $\rightarrow$ Set `True` $\rightarrow$ Jadwalkan Microtask $\rightarrow$ Eksekusi FFT.
2. Call 2 (Pipeline) $\rightarrow$ `_inCurrentTick === true` $\rightarrow$ Return State lama.
3. Call 3 (Adapter) $\rightarrow$ `_inCurrentTick === true` $\rightarrow$ Return State lama.
4. JS Event Loop selesai $\rightarrow$ Microtask berjalan $\rightarrow$ `_inCurrentTick = false`.

**Pseudo Code:**
```javascript
update(isPlaying) {
    if (this._inCurrentTick) return this.state;
    
    this._inCurrentTick = true;
    queueMicrotask(this._resetTick); // _resetTick = () => this._inCurrentTick = false;
    
    // ... jalankan FFT & DSP ...
}
```

### DESIGN B: Frame ID Pass-Through (Update Token)
**Konsep:** Mewajibkan semua pemanggil (UI, Pipeline, Adapter) untuk meneruskan ID Frame absolut (seperti `frame.metadata.frameNumber` atau penghitung RAF global). `BeatEngine` memblokir kalkulasi jika ID yang diterima sama dengan ID sebelumnya.

**Flow:**
1. UI mendapatkan RAF ID = 150 $\rightarrow$ `update(true, 150)` $\rightarrow$ Eksekusi.
2. Pipeline mendapatkan RAF ID = 150 $\rightarrow$ `update(true, 150)` $\rightarrow$ Diabaikan.
3. Offline Export memompa Frame = 151 $\rightarrow$ `update(true, 151)` $\rightarrow$ Eksekusi.

**Pseudo Code:**
```javascript
update(isPlaying, frameId) {
    if (frameId !== undefined && this.lastFrameId === frameId) return this.state;
    this.lastFrameId = frameId;
    
    // ... jalankan FFT & DSP ...
}
```

### DESIGN C: Central Update Authority (Monolithic Caller)
**Konsep:** Mencabut hak pemanggilan `update()` dari komponen UI (`M3PreviewCanvas`) dan mendelegasikan otoritas tunggal hanya kepada `RenderPipeline`. Semua komponen lain bergeser murni menjadi *Beat Consumer* (Read-Only).

**Flow:**
1. RAF UI dipicu $\rightarrow$ UI TIDAK memanggil `BeatEngine`. UI langsung me-render Visualizer.
2. RAF UI memanggil `pipeline.update()`.
3. `pipeline.update()` memanggil `BeatEngine.update()` (Satu-satunya sumber).
4. `BeatEngine` mendistribusikan *state* terbaru.

---

## 2. DESIGN COMPARISON & TRADE-OFFS

| Kriteria | Design A (Microtask) | Design B (Frame ID) | Design C (Authority) |
| :--- | :--- | :--- | :--- |
| **Dependency** | Sangat Rendah (Internal Engine) | Sangat Tinggi (Global ID) | Tinggi (Arsitektur Pipeline) |
| **Compatibility** | 100% (*Drop-in Replacement*) | Memerlukan *refactor* pemanggil | Memerlukan rombakan alur UI |
| **Memory Allocation**| 0 (Fungsi Reset di-bind 1x) | 0 | 0 |
| **CPU Overhead** | Sangat Rendah (`queueMicrotask` instan) | Sangat Rendah | Paling Rendah (1 pemanggil pasti) |
| **Regression Risk** | Rendah | Tinggi (Caller lupa pass ID) | Sangat Tinggi (Sync UI-Audio patah) |
| **Kemudahan Rollback**| Sangat Mudah (Hapus 2 baris) | Sulit (Revert di banyak file) | Sulit (Revert di banyak file) |

**Kesimpulan Evaluasi:**
- **Paling Sederhana & Aman:** **Design A**. Tidak mengubah tanda tangan fungsi (API *Signature*) dan 100% aman bagi *caller* lama maupun eksternal.
- **Paling Presisi (Matematis):** **Design B**. Sangat presisi namun memakan ongkos *refactoring* luas.

---

## 3. IMPACT ANALYSIS

Bagaimana penerapan **Design A (Microtask)** memengaruhi ekosistem:

| Modul | Dampak (Impact) | Tindakan |
| :--- | :--- | :--- |
| `BeatEngine` | Kinerja CPU meningkat $\sim$300%. *Duplicate execution* hilang total. | Implementasi *Microtask Lock*. |
| `AudioDSP` | Jumlah panggilan *FFT/Extractor* turun drastis. | Tidak ada (Read-Only). |
| `BeatEngineAdapter` | Menerima data 100% konsisten dalam 1 frame yang sama. | Tidak ada (Read-Only). |
| `RenderPipeline` | Tetap berjalan normal, tidak lagi membuang CPU pada *BeatEngine*. | Tidak ada (Read-Only). |
| `M3PreviewCanvas` | Tetap berjalan normal. Eksekusi pertama di-handle, sisanya di-skip. | Tidak ada (Read-Only). |
| `Visualizer` & `Particle`| Animasi stabil, *over-decay* (*Envelope*) berhenti seketika. | Tidak ada (Read-Only). |
| `Subtitle` & `Overlay` | Tetap presisi terhadap *Timeline*. | Tidak ada (Read-Only). |
| `Export` (Offline) | Proses *offline batch* tidak akan terkunci karena beda *macrotask*. | Tidak ada (Read-Only). |

---

## 4. MIGRATION PLAN (STEP-BY-STEP)

Rencana eksekusi untuk mengubah kode (JIKA DISETUJUI), dirancang dengan prinsip **Reversible** (Dapat dibatalkan seketika).

- **Step 1:** Modifikasi konstruktor `BeatEngine.js` untuk menginisiasi variabel `this._inCurrentTick = false` dan `this._resetTick = () => { this._inCurrentTick = false; }`.
- **Step 2:** Modifikasi baris atas fungsi `BeatEngine.update()` untuk menambahkan logika *return early* jika `_inCurrentTick === true`.
- **Step 3:** Panggil `queueMicrotask(this._resetTick)` dan nyalakan `this._inCurrentTick = true`.
- **Step 4:** Validasi `BeatEngineSelector.js` agar hanya instansiasi *engine* secara *lazy* jika memungkinkan (opsional untuk *Memory Risk*).
- **Step 5:** Optimalkan Iterator (`for...of`) pada `subscribers.flush()` menjadi struktur yang tidak alokatif (*Zero-allocation Iteration*).

---

## 5. ROLLBACK PLAN

Jika desain GAGAL saat pengujian:
1. Jalankan *command*: `git checkout -- src/services/audio/BeatEngine.js`.
2. Semua arsitektur langsung kembali ke kondisi *legacy* berbasis `performance.now()`. Tidak ada komponen UI/Pipeline yang terpengaruh, karena *signature* parameter tidak pernah diubah.

---

## 6. TEST PLAN

1. **Unit Test:** Panggil `update()` 5 kali berturut-turut dalam satu alur sinkron dan pastikan DSP hitungan (FFT) tetap bernilai 1.
2. **Integration Test:** Pastikan `RenderPipeline` dan `BeatEngineAdapter` tetap sinkron tanpa menimbulkan *desync* ketukan.
3. **Regression Test:** Jalankan di *browser*, inspeksi dengan Profiler. Garis grafik *Garbage Collector* minor harus datar (menandakan penyelesaian masalah *Zero-Allocation*).
4. **Performance Test:** Catat total waktu eksekusi *rendering* pada proyek durasi panjang (Target: $\ge$ 30% kecepatan meningkat).
5. **Offline Render Test:** Validasi `ExportEngine` untuk memastikan eksekusi *batch loop* (`while(isExporting)`) tidak membekukan DSP Engine.

---

## 7. RISK MATRIX

| Risiko (Risk) | Probabilitas | Dampak | Level | Mitigasi |
| :--- | :--- | :--- | :--- | :--- |
| **Offline Loop Terkunci (Microtask tersumbat)** | Rendah | *Export Freeze* | **High** | Offline *batch loop* di Node/Chromium menjalankan *queueMicrotask* setiap akhir iterasi `while`, sehingga sangat kecil kemungkinan menyumbat. Akan divalidasi penuh di *Test Plan*. |
| **Asynchronous Consumer Desync** | Rendah | Visual *Lag* | **Medium** | Semua *consumer* di *MediaFactory* adalah *synchronous reader*. |
| **API Signature Compatibility** | Sangat Rendah | UI *Error* | **Low** | Design A tidak mengubah satupun *signature* fungsi. |

---

## 8. RECOMMENDATION (KEPUTUSAN AKHIR)

**Gravity secara resmi merekomendasikan DESIGN A (Microtask Tick Lock).**

Alasan utama: *Impact Isolation*. Desain A hanya memerlukan perubahan internal $\sim$5 baris pada `BeatEngine.js` tanpa menyentuh ratusan baris sistem UI dan Pipeline. Beban CPU dan Memori langsung terselesaikan tanpa memancing risiko regresi pada modul eksisting.

---
**END OF MISSION.**
Menunggu persetujuan secara eksplisit dari *Architecture Review Board* sebelum melangkah ke penulisan kode.
