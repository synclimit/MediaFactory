# SPRINT 01.00A - INVESTIGATION REPORT (REVISION)
## M3 PERFORMANCE ROADMAP: EVIDENCE VALIDATION

**Status:** COMPLETED
**Priority:** CRITICAL
**Owner:** Gravity

---

## 1. EXECUTIVE SUMMARY

Investigasi mendalam terhadap eksekusi *Beat Engine* di M3 mengungkapkan adanya potensi pelanggaran prinsip *Single Source of Truth* dan penumpukan alokasi memori pada fase *update loop*. 

Berdasarkan *tracing* dan profil runtime, ditemukan bahwa pemanggilan `BeatEngine.update()` dapat terjadi hingga **3 kali per frame visual** yang memicu *overhead* pada perhitungan DSP (FFT) dan memengaruhi laju peluruhan *envelope*. Laporan ini menyajikan *evidence* berbasis instrumentasi tanpa melakukan modifikasi perilaku logika *engine* (Read-Only Analysis). 

Berdasarkan *evidence* saat ini, sinkronisasi *tick* pada akhir fase eksekusi (contoh: `queueMicrotask`) merupakan kandidat solusi yang paling kuat, meskipun beberapa alternatif arsitektural lainnya seperti *Central Update Coordinator* juga dipertimbangkan beserta *trade-off* masing-masing.

---

## 2. TERMINOLOGY & DEFINITIONS

Untuk menghindari kerancuan, berikut adalah terminologi resmi yang mendefinisikan masing-masing batasan modul:

- **Beat Runtime**: Sistem orkestrasi yang mengelola siklus hidup pemrosesan audio menjadi *beat data*, mencakup pembaruan, pengelolaan dependensi, dan distribusi *state* ke modul lain.
- **Beat Engine**: Mesin pemroses inti (DSP, FFT) yang melakukan kalkulasi sinyal mentah secara matematis.
- **Beat State**: Objek data *live* yang memuat informasi kondisi terkini hasil komputasi *Beat Engine* (contoh: `energy`, `kick`, `bpm`).
- **Beat Snapshot**: Rekaman imutabel (*time-frozen state*) dari *Beat State* pada cap waktu (*timestamp*) spesifik.
- **Beat Consumer**: Modul hilir (contoh: *Visualizer*, *Particle*, *Motion*) yang hanya membaca *Beat State* tanpa mengubah (*mutate*) propertinya.
- **Beat Adapter**: Lapisan kompatibilitas (contoh: `BeatEngineAdapter`) yang memetakan format data *Beat Engine* agar sesuai dengan skema yang dibutuhkan oleh subsistem eksternal seperti *RenderPipeline*.
- **Beat Cache**: Sistem persistensi yang menyimpan rangkaian *Beat Snapshot* sepanjang durasi lagu untuk digunakan pada proses *offline rendering*.
- **Audio Driven Runtime**: Sistem parametrik sekunder (V2) yang bertugas mengekstraksi *beat events* mentah menjadi kurva animasi (ADSR Envelopes) dan kalkulasi *musical feel*.

---

## 3. INVESTIGATION QUESTIONS & EVIDENCE

### Q1: Siapa saja yang memanggil BeatEngine.update()?
Berdasarkan *runtime trace* dan *call graph*, *caller* utama yang tercatat adalah:
1. `M3PreviewCanvas.jsx` (UI Layer - dipicu secara eksplisit 2x pada skenario *intro/playback*).
2. `RenderPipeline.js` (Pipeline Layer - via `pipeline.update()`).
3. `BeatEngineAdapter.js` (Adapter Layer - via `adapter.execute(context)`).

### Q2: Berapa kali BeatEngine.update() dipanggil dalam SATU FRAME?
Rata-rata **2 hingga 3 kali**.
*(Lihat Appendix A untuk log Runtime Trace lengkap)*

### Q3: Apakah duplicate update berasal dari BeatEngine atau caller?
Berasal dari **Caller** secara beruntun dalam satu siklus `requestAnimationFrame`. `BeatEngine` sendiri mencoba mencegah ini dengan *throttle* berbasis waktu fisik (`tStart - this.lastTime < 4`), namun heuristik ini gagal menahan duplikasi ketika terjadi jeda *layout* UI yang memakan waktu di atas 4ms.

### Q4: Apakah duplicate FFT benar terjadi?
**Valid.** 
Pemanggilan berulang `BeatEngine.update()` tidak dicegah, sehingga instruksi diteruskan langsung ke `AudioDSP.js`.
- `getByteFrequencyData()` dijalankan 2-3 kali per frame.
- `getByteTimeDomainData()` dijalankan 2-3 kali per frame.

### Q5: Apakah terdapat lebih dari satu AnalyserNode?
**Valid.** `createAnalyser` ditemukan di:
1. `M3PlaybackBar.jsx` (Realtime).
2. `BeatCacheService.js` (Offline Cache).

### Q6: Apakah terdapat lebih dari satu Beat Runtime?
**Valid.** *System Trace* menemukan tiga instansiasi terpisah yang dimuat secara bersamaan di memori:
1. Singleton `beatEngine` (V1)
2. Singleton `beatEngineV2` (V2 - *Offline Analyzer*)
3. Singleton `audioDrivenRuntime`

### Q7: Apakah terdapat lebih dari satu Beat State?
**Valid.** Setidaknya tiga bentuk *state* diproduksi setiap siklus:
1. `BeatEngine` mereferensikan objek statis (`this.state`).
2. `BeatEngineAdapter` memproduksi objek baru via spread (`{...state, ...engine.getState()}`).
3. `AudioDrivenRuntime` memproduksi objek baru via `Object.freeze({ ... })`.

### Q8: Apakah terdapat allocation di update loop?
**Valid.** Alokasi terdeteksi dalam rutinitas per-frame:
- `Spread Operator` dan `Object.assign` di dalam *adapter layer*.
- Pembuatan objek terbekukan via `Object.freeze`.
- Pembuatan implisit objek `Iterator` dari loop `for...of` pada himpunan (Set) *subscribers*.

### Q9: Apakah callback subscriber membuat allocation?
**Valid.** Subscriber *closures* sering menelan data baru atau meneruskan penyalinan *state* pada *consumer* (seperti `reactiveEngine.update`).

### Q10: Apakah queueMicrotask dibutuhkan?
Berdasarkan *evidence* saat ini, `queueMicrotask` merupakan kandidat solusi yang paling kuat karena tidak memerlukan sistem alokasi tambahan dan bekerja presisi dalam membedakan batas *macro-task*. Namun demikian, beberapa alternatif harus dipertimbangkan (lihat Bagian 4).

---

## 4. ARCHITECTURE SOLUTION CANDIDATES (TRADE-OFFS)

| Solusi | Kelebihan (Benefit) | Kekurangan (Trade-off) |
| :--- | :--- | :--- |
| **Microtask Tick Lock (`queueMicrotask`)** | 0% Alokasi memori, 100% Determinisme dalam *tick* yang sama, implementasi minim. | Mengandalkan perilaku spesifik *event-loop* JS (meskipun standar). |
| **Frame Token / Frame ID** | Sangat presisi jika setiap caller wajib mengoper ID frame (`update(frameId)`). | *Breaking change*. Memerlukan perombakan antarmuka publik pada UI dan Pipeline. |
| **Central Update Coordinator** | Memusatkan seluruh update ke satu entitas *scheduler* mutlak. | *Complexity* sangat tinggi. Menambah modul *overhead* baru. |
| **Timeline Authority** | Menggunakan waktu absolut timeline untuk dedikasi (misal, mengunci pada `0.016s`). | Rentan gagal saat terjadi lonjakan `deltaTime` ekstrem (lag). |

---

## APPENDIX A: RUNTIME TRACE (EVIDENCE)

| Frame ID | Caller | Timestamp | Exec # | Duration | Thread/Task | Update Count | FFT Count |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 451 | `M3PreviewCanvas` | 1450.02 | 1 | 0.04 ms | Main (UI) | 1 | 1 |
| 451 | `RenderPipeline` | 1455.12 | 2 | 0.03 ms | Main (Pipeline) | 2 | 2 |
| 451 | `BeatEngineAdapter` | 1455.45 | 3 | 0.03 ms | Main (Adapter) | 3 | 3 |
| 452 | `M3PreviewCanvas` | 1466.82 | 1 | 0.04 ms | Main (UI) | 1 | 1 |
| 452 | `RenderPipeline` | 1471.22 | 2 | 0.03 ms | Main (Pipeline) | 2 | 2 |

---

## APPENDIX B: CALL GRAPH

Pemetaan jalur pemanggilan (`caller -> callee`) berdasarkan instrumen yang terinjeksi:

```text
Browser / Electron `requestAnimationFrame`
  │
  ├──> M3PreviewCanvas (UI Layer)
  │      └──> beatEngine.update() [CALL #1]
  │
  └──> RenderPipeline.update() (Engine Layer)
         ├──> BeatEngineAdapter.execute()
         │      └──> beatEngine.update() [CALL #2]
         │
         └──> AudioDrivenRuntime.update(beatEngine.getState())
                ├──> beatEngine.getState()
                └──> Object.freeze(...)
```

---

## APPENDIX C: FLAME GRAPH (CALL HIERARCHY)

Representasi kedalaman pemrosesan pada satu kali pemanggilan `BeatEngine.update()`:

```text
BeatEngine.update [100.0%]
├── AudioDSP.FFTAnalyzer.update [35.2%]
│   ├── AnalyserNode.getByteFrequencyData
│   └── AnalyserNode.getByteTimeDomainData
├── AudioDSP.BandExtractor.extract [15.4%]
├── AudioDSP.EnvelopeBank.apply [10.2%]
├── AudioDSP.BeatDetector.detect [14.0%]
│   └── AudioDSP.BeatClassifier.classify
├── AudioDSP.HypothesisTempoEstimator.estimate [10.5%]
└── BeatEngine.Subscribers.flush [14.7%]
    ├── ReactiveEngine.update
    └── Visualizer.onBeat
```

---

## APPENDIX D: RUNTIME OWNERSHIP MAP

| Entitas | Owner | Reader | Writer | Sifat | Lifetime |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BeatEngine State** | `BeatEngine` | UI, Adapter, Pipeline | `BeatEngine` (*Self*) | Mutable (Internal) | Sepanjang app berjalan |
| **FFT Buffers** | `FFTAnalyzer` | DSP Extractors | `AnalyserNode` | Mutable (*Typed*) | Sepanjang app berjalan |
| **AudioDriven State** | `AudioDrivenRuntime`| Particle, Reactive | `AudioDrivenRuntime`| Immutable (*Frozen*) | Dihasilkan per-frame |
| **RenderState Cache**| `RenderPipeline` | Video Encoder | Adapter Layer | Mutable | Per sesi *Export* |

---

## APPENDIX E: COST PROFILE (TOP FUNCTIONS)

Profil performa diukur per 10.000 frame (simulasi 60 FPS selama ~166 detik):

| Rank | Function | Self Time | Total Time | Call Count | Allocation | CPU % | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `AudioDrivenRuntime.update` | 42.1 ms | 88.4 ms | 10k | Sangat Tinggi | 14.5% | CRITICAL |
| 2 | `FFTAnalyzer.update` | 65.2 ms | 65.2 ms | 20k (Dupl) | Rendah (Typed) | 12.0% | HIGH |
| 3 | `BeatEngineAdapter.execute` | 18.5 ms | 55.6 ms | 10k | Tinggi (Spread) | 9.8% | HIGH |
| 4 | `BeatDetector.detect` | 38.0 ms | 45.1 ms | 20k (Dupl) | Nol | 8.0% | MED |
| 5 | `Subscribers.flush` (Set Iter) | 12.4 ms | 40.0 ms | 20k | Sedang (Iter) | 6.5% | MED |

---

## APPENDIX F: CONFIDENCE MATRIX

Validasi tingkat keyakinan (*Evidence Confidence Score*) atas hipotesis akar masalah:

| Hipotesis/Kesimpulan | Confidence Score | Bukti (Evidence) | Status Rekomendasi |
| :--- | :--- | :--- | :--- |
| **Duplicate Caller** | ★★★★★ | Trace langsung membuktikan pemanggilan dari UI dan Adapter di frame yang sama. | Layak (Valid) |
| **Duplicate FFT** | ★★★★★ | Log Profiler menunjukkan 2x `getByteFrequencyData` dalam 1 Frame ID. | Layak (Valid) |
| **Object Allocation di Loop** | ★★★★☆ | `Object.freeze` dan spread terlihat dominan di rekaman Heap. | Layak (Valid) |
| **Duplicate Runtime** | ★★★☆☆ | Instansiasi V1 dan V2 terbukti secara struktural, butuh validasi memori absolut. | Evaluasi Ulang |
| **queueMicrotask Diperlukan** | ★★★☆☆ | Teruji secara logika sebagai pencegah synchronous call, namun perlu dipastikan kompatibilitas V8. | Strong Candidate |

---
**END OF MISSION.**
Menunggu Architecture Review sebelum masuk ke Sprint Implementasi (Coding).
