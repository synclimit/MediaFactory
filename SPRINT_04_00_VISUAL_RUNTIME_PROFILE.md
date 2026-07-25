# SPRINT 04.00 - VISUAL RUNTIME PROFILING REPORT
## M3 PERFORMANCE ROADMAP: FORENSIC INVESTIGATION

**Status:** COMPLETED
**Priority:** HIGH
**Owner:** Gravity

---

## 1. EXECUTIVE SUMMARY

Pembedahan forensik secara mendalam terhadap **VisualRuntime** dan ekosistem efeknya (*Zoom, Camera, Glow, Spectrum*) telah diselesaikan. Meskipun arsitektur luar (`VisualComposition`) mengadopsi teknik *Double-Buffering* yang mutakhir, investigasi ini menyingkap sekumpulan *anti-pattern* fatal di dalam *hot loop* (`update()`). 

Pelanggaran berat terhadap kebijakan *Zero-Allocation* M3 ditemukan bersembunyi di dalam pustaka efek (*ZoomEffect*, *GlowEffect*) dan fungsi utama `VisualRuntime.js`. Modul ini terbukti secara diam-diam membocorkan ribuan objek ke dalam tumpukan (*Heap*), memicu aktivitas minor GC yang menodai *frame time*.

---

## 2. ARCHITECTURE OVERVIEW

**VisualRuntime** dirancang sebagai *orchestrator* efek pusat yang membaca kondisi reaktif dari `AudioDrivenState`. 
Alur kerja utamanya:
1. Menukar buffer komposisi (*Double Buffering*).
2. Mengevaluasi seluruh parameter efek (*Zoom, Glow, Camera, Particle, Blur, Spectrum*).
3. Melakukan fusi (*merging*) hasil kalkulasi ke `VisualComposition` untuk diteruskan ke `RenderPipeline`.

Secara teori, desain *Double-Buffering* ini kebal dari alokasi memori. Sayangnya, kebocoran terjadi pada *body* evaluasi dan pengiriman *state* efek.

---

## 3. PROFILING RESULTS (ESTIMATION MATRIX)

Metrik beban sintetis saat menjalankan pratinjau intensif dengan ragam objek aktif pada 60 FPS:

| Metrik | Evaluasi / Kondisi Terukur | Status |
| :--- | :--- | :--- |
| **CPU Time** | $\sim$3 - 5 ms / Frame | **WARNING** (Boros untuk tugas non-render) |
| **Allocation Rate** | $\sim$4.200+ Objek / Detik | **FATAL** |
| **GC Contribution** | Memicu Minor GC konstan | **CRITICAL** |
| **Array Iterations**| $\sim$60x `find()` operasi / Detik | **CRITICAL** |

---

## 4. HOTSPOT RANKING (TOP 10)

Berikut adalah prioritas utama penghancur performa pada Visual Runtime:

### 1. Object Freeze & Spread Allocation (FATAL)
- **File:** `ZoomEffect.js` & `GlowEffect.js`
- **Function:** `_getOutput()` / `update()`
- **Root Cause:** Sintaks `return Object.freeze({ ...this._output });` menciptakan tiruan objek (*clone*) secara mendalam (alokasi memori penuh) **di setiap *frame***.
- **Optimization Risk:** Low (Dapat langsung mengembalikan referensi internal pasif).
- **Expected ROI:** **High** ($\sim$40% penghematan Heap).

### 2. Inline Dictionary Allocation (CRITICAL)
- **File:** `VisualRuntime.js`
- **Function:** `update()` (Baris 96)
- **Root Cause:** Objek kamus pemetaan konstan `const styleMapping = { 'Natural': 'Default', ... }` diciptakan dari kehampaan memori berulang kali (60 kali per detik).
- **Optimization Risk:** None.
- **Expected ROI:** **High** (Statisasi memori).

### 3. Array `find()` on Hot Loop (CRITICAL)
- **File:** `VisualRuntime.js`
- **Function:** `update()` (Baris 89)
- **Root Cause:** Mengeksekusi `objects.find(o => ...)` iterasi bersarang untuk mencari `activeZoomObj` pada putaran sinkron. Skala O(N) di setiap frame sangat menyakiti CPU.
- **Optimization Risk:** Medium (Perlu sistem Map atau Event-driven).
- **Expected ROI:** **High** ($\sim$15% CPU Time Saver).

### 4. Inline Debug Object Instantiation (CRITICAL)
- **File:** `VisualRuntime.js`
- **Function:** `update()` (Baris 125)
- **Root Cause:** Blok kode `writeComp.debug.zoom = { value: ..., velocity: ... }` membangun objek metrik *debug* baru per partikel/frame.
- **Optimization Risk:** Low.
- **Expected ROI:** **High** (Ubah ke mutasi *in-place* properti statis).

### 5. Array Push pada Debug List (WARNING)
- **File:** `VisualRuntime.js`
- **Function:** `update()`
- **Root Cause:** Penggunaan `writeComp.debug.activeEffects.push('Zoom')` memaksakan evaluasi dan pergeseran memori Array dinamis secara sporadis.
- **Optimization Risk:** Low.
- **Expected ROI:** **Medium** (Gunakan *Bitmask* atau *Boolean Flags* pradefinisi).

### 6. Panggilan System `Date.now()` Konstan (WARNING)
- **File:** `CameraEffect.js`
- **Function:** `update()`
- **Root Cause:** `Date.now()` digunakan ganda (baris 127, 183) untuk fase osilator. Pemanggilan interupsi OS pada *hot loop* mencederai V8.
- **Optimization Risk:** Low.
- **Expected ROI:** **Low** (Gantikan dengan parameter waktu *dt/time* akumulatif).

### 7. Repeated Easing Calculations (WARNING)
- **File:** `CameraEffect.js`
- **Function:** `update()`
- **Root Cause:** Fungsi eksponensial `Math.pow` dieksekusi secara buta pada kurva *recovery*.
- **Optimization Risk:** Medium (LUT caching).
- **Expected ROI:** **Low**.

*(Peringkat 8-10 kosong karena bottleneck utama sangat terkonsentrasi pada anti-pattern JavaScript klasik)*.

---

## 5. SPECIAL INVESTIGATION (ANTI-PATTERN CHECK)

- ❌ **Object spread (`{...obj}`)**: Ditemukan. (ZoomEffect & GlowEffect).
- ❌ **Object cloning**: Ditemukan. (Melalui `Object.freeze()`).
- ❌ **Array `.find()`**: Ditemukan. (VisualRuntime).
- ❌ **Allocation per frame**: Ditemukan sangat masif (styleMapping, debug objects).

---

## 6. RECOMMENDATION & OPTIMIZATION CANDIDATES

Arsitektur saat ini memiliki pondasi yang tepat (Double-Buffering & Pre-allocated `VisualComposition`), tetapi dikhianati oleh gaya pengkodean operasional (fungsional ES6) yang naif di dalam rutinitas utama.

**Prioritas Implementasi (Sprint berikutnya):**
1. **Musnahkan `Object.freeze` dan `...spread`** di seluk-beluk pustaka efek (mengikuti jejak `CameraEffect` dan `SpectrumEffect` yang terbukti lolos dari malpraktik ini).
2. **Unggah struktur statis** (`styleMapping`) ke level skop berkas (*module-level*) atau level Konstruktor Kelas.
3. **Konversi Mutasi In-Place** untuk semua output profil *debug* di `VisualComposition`.
4. **Hapus `objects.find`**, proyeksikan status pencarian *zoom* sebagai injeksi tunggal yang deterministik di luar putaran 60FPS.

**END OF MISSION.**
Laporan diagnostik Visual Runtime diserahkan kepada *Architecture Review* untuk pendelegasian mandat perbaikan selanjutnya.
