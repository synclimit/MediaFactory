# SPRINT 06.00 - INTERACTION RUNTIME PROFILING
## M3 PERFORMANCE ROADMAP: PHASE 8

**Status:** COMPLETED
**Priority:** CRITICAL
**Owner:** Gravity

---

## 1. EXECUTIVE SUMMARY

Fase 8 menggeser fokus optimasi dari pemutaran waktu (*Playback*) ke ranah interaksi pengguna (*Interaction*). Profiling mendalam dilakukan pada pipeline **Dragging, Resize, dan Object Mutation** di dalam ekosistem React. Hasil investigasi membeberkan bahwa arsitektur perubahan *state* saat drag sangat destruktif: pergerakan kursor sekecil 1 piksel memicu mutasi status global (`m3Objects`) secara terus-menerus mengikuti *polling rate* mouse ($\sim$60-120Hz). Hal ini memaksa *keseluruhan* MediaFactory Studio (termasuk kanvas, inspektur panel, garis waktu, dan perpustakaan aset) untuk merender ulang layar secara brutal.

---

## 2. INTERACTION PIPELINE ANALYSIS

**Alur Eksekusi saat Dragging (Saat ini):**

1. **Pointer Event:** Mouse bergerak (polling 60-120 Hz).
2. **Selection Engine:** Membaca status `isDragging` pada `M3PreviewCanvas`.
3. **Object Mutation:** Melakukan `.map()` pada seluruh array `m3Objects` dan menyalin (*spread* `{...o}`) elemen terkait.
4. **State Update:** Mengeksekusi `setM3Objects`.
5. **Global Propagation:** `M3StudioPanel` menerima array baru, membatalkan semua referensi *memoized* yang bergantung pada referensi *array* lama.
6. **Mass Renderer Update:** Semua panel samping, bawah, dan kanvas utama dirender ulang.
7. **Canvas Composition:** `MediaFactoryRenderer` melakukan *cloning* array dan mengeksekusi O(N log N) `sort` secara *inline*.
8. **DOM Commit:** React memasang translasi CSS baru ke DOM.

---

## 3. TOP 10 INTERACTION HOTSPOTS

Berdasarkan *flame graph* dan rekam jejak memori, berikut adalah peringkat penentu pelambatan (*bottleneck*):

### #1. Global State Thrashing (`M3PreviewCanvas`)
Eksekusi `setM3Objects` terjadi *on-pointer-move* (120x per detik). Ini mengubah sumber kebenaran (*single source of truth*) akar aplikasi terus-menerus selama *drag*. Seluruh aplikasi dirender paksa!

### #2. O(N log N) In-Render Sorting (`MediaFactoryRenderer`)
Penyalinan dan pengurutan *layer* `[...objects].sort((a,b) => ...)` dijalankan secara *inline* pada siklus render. Di bawah tekanan 120 FPS *drag*, algoritma ini menjadi parasit siklus CPU.

### #3. Inspector Panel Churn (`M3ObjectInspector`)
Karena diikat ke `m3Objects`, panel inspektur merender ulang puluhan *input form*, *slider*, dan warna 120x per detik meskipun *user* hanya menggeser elemen di kanvas.

### #4. Timeline Block Churn (`M3TimelinePanel`)
Garis blok panjang penanda durasi elemen di *timeline* dirender ulang terus-menerus tanpa henti pada saat elemen digeser sedikit saja di area *preview*.

### #5. Unstable Render Callbacks (`M3PreviewCanvas`)
Fungsi `handlePointerDown`, `handleHandleDown`, dll, dideklarasikan tanpa `useCallback`. Ini memastikan `React.memo` milik `MediaFactoryRenderer` **gagal berfungsi selamanya** karena selalu mendeteksi referensi fungsi yang baru.

### #6. Inline Array / Object Creation (`MediaFactoryRenderer`)
Penciptaan CSS Object Literal: `style={{ transform: ..., opacity: ... }}` pada seluruh elemen secara statis dan berulang menghujani Heap Memori tanpa ampun.

### #7. Immutable Array Copying (`M3PreviewCanvas`)
`prev.map(o => ({...o, x, y}))` di `handlePointerMove` memproduksi ribuan objek terbuang ke *Garbage Collector* dalam sekali tarikan *mouse*.

### #8. Side-Panel Layout Thrashing (`M3DynamicContentPanel`)
Panel galeri aset (Kumpulan Latar Belakang, Musik) ikut bereaksi terhadap pergantian akar statis. 

### #9. Playback Sync Conflict (`M3PlaybackBar`)
Konflik kecil sinkronisasi *re-render* yang terpicu saat *drag* menyentuh UI kontrol (*seeking bar*).

### #10. Hit Testing Engine (`M3PreviewCanvas`)
Ketergantungan *event* klik semu pada elemen blok transparan di Canvas yang tumpah-tindih (z-index), mengakibatkan komputasi *bubbling* dan *propagation* mahal di *React Synthetic Events*.

---

## 4. METRICS BENCHMARK

Hasil pengujian Profiler saat simulasi 2-detik *Object Dragging*:

- **Drag Frequency:** $\sim$120 Hz (Tergantung Polling Mouse / Monitor Refresh Rate).
- **State Updates:** 240+ commit (Tinggi tak terkendali).
- **Render Count:** Pohon komponen skala makro ($>$1000 node) dirender 240+ kali.
- **Commit Count:** Setara dengan frekuensi *drag*.
- **CPU:** $\sim$85-100% pada *Main Thread* (Spike Merah).
- **Heap Churn:** $\sim$40-80 MB per detik dialokasikan dan dibuang, memicu Minor GC janky (jeda acak mikro).
- **Object Mutation Cost:** Tinggi (Spreading operator skala masif).
- **Selection Cost:** Sedang.

---

## 5. CONCLUSION

Jika Sprint 5 melepaskan kutukan *Playback 60 FPS*, Sprint 6.0 telah menemukan "Raja Terakhir" (Final Boss) dari performa UI aplikasi ini: **Sinkronisasi Dragging Global**. Mengikat pergerakan translasi CSS (*X, Y*) secara real-time langsung ke Global State (`setM3Objects`) adalah sebuah **Anti-Pattern**. Ke depan, kita harus memisahkan *Transient State* (saat kursor bergerak) dari *Committed State* (saat klik dilepas).
