# SPRINT 05.00 - REACT PREVIEW PROFILING
## M3 PERFORMANCE ROADMAP: PHASE 7

**Status:** COMPLETED
**Priority:** HIGH
**Owner:** Gravity

---

## 1. EXECUTIVE SUMMARY

Profiling komprehensif terhadap ekosistem **React Preview** (terutama `M3PreviewCanvas.jsx` dan `MediaFactoryRenderer.jsx`) telah diselesaikan. Hasil investigasi menemukan kejanggalan struktural di mana jembatan antara *Engine* (yang berjalan statis/bebas alokasi di 60 FPS) dan *React* dirusak oleh siklus *re-render* yang masif dan berlebihan.

Titik mati utama bersumber pada pengikatan state waktu lokal (`m3CurrentTimeSec`) langsung di akar komponen `M3PreviewCanvas`, yang memaksa seluruh pohon *React Component* merender ulang hingga 60 kali per detik. Penyakit ini diperparah dengan tidak berfungsinya *memoization* akibat *prop churn* (referensi objek/fungsi baru setiap siklus).

---

## 2. REACT ARCHITECTURE OVERVIEW

Alur rendering Preview saat ini:
`M3PreviewCanvas` (Root) 
 ├── `RealtimeEffectRenderer` (Canvas Effects)
 ├── `PreviewRoot`
 │    └── `MediaFactoryRenderer` (Komposisi Elemen)
 │         ├── `PlaylistRenderer`
 │         ├── `SubtitleRenderer`
 │         └── `SocialWidgetRenderer`
 └── `M3PlaybackBar` (Playback Controls)

---

## 3. PROFILING RESULTS

- **Render Count:** $\sim$60 render per detik (terikat secara artifisial dengan *playback time*).
- **Commit Count:** $\sim$60 per detik.
- **Component Tree Depth:** Sedang ($\sim$6-8 level).
- **Props Churn:** Sangat Tinggi (kegagalan referensi array dan fungsi).
- **State Churn:** Sangat Tinggi (`m3CurrentTimeSec` mendorong *re-render* akar).
- **Heap Usage:** Fluktuatif karena konstruksi objek literal masif di dalam `render`.

---

## 4. HOTSPOT RANKING

### #1 - The 60FPS Root Re-render
- **Component:** `M3PreviewCanvas`
- **Function:** Root Render
- **Root Cause:** State `m3CurrentTimeSec` diletakkan dan diperbarui di level teratas komponen. Karena diperbarui $\sim$60 kali per detik selama *playback*, **seluruh** pohon komponen dirender ulang terus-menerus.
- **Optimization Risk:** High (Butuh decoupling indikator waktu atau perpindahan pengelolaan state ke subsistem terpisah).
- **Expected ROI:** High (Memotong 95% pemborosan *re-render* global).

### #2 - Props Churn (Unstable Callbacks)
- **Component:** `M3PreviewCanvas`
- **Function:** `handleHandleDown`, `handlePointerDown`
- **Root Cause:** *Handler* fungsi dibuat secara *inline* tanpa `useCallback`. Meskipun `MediaFactoryRenderer` dilindungi dengan `React.memo`, fungsi baru yang terus turun setiap frame merusak *memoization* tersebut seutuhnya.
- **Optimization Risk:** Medium (Membutuhkan resolusi *dependency array* yang ketat).
- **Expected ROI:** High (Mengembalikan keampuhan `React.memo`).

### #3 - Props Churn (Inline Array Filtering)
- **Component:** `M3PreviewCanvas`
- **Function:** `<RealtimeEffectRenderer effects={m3Objects.filter(...)}>`
- **Root Cause:** Metode `.filter()` memproduksi alokasi array (referensi) baru di setiap 60FPS render. 
- **Optimization Risk:** Low (Dapat diatasi dengan `useMemo`).
- **Expected ROI:** High (Menyelamatkan `RealtimeEffectRenderer` dari interupsi *render* sia-sia).

### #4 - O(N log N) Sort on Hot Path
- **Component:** `MediaFactoryRenderer`
- **Function:** `objects.map`
- **Root Cause:** Mengeksekusi penyalinan (*spread*) dan pengurutan (*sort*) array secara *inline* di dalam fungsi render: `[...objects].sort((a,b) => ...).map(...)`.
- **Optimization Risk:** Low.
- **Expected ROI:** High (Mengurangi penalti kalkulasi CPU murni di *Main Thread*).

### #5 - Array Literals Instantiation
- **Component:** `MediaFactoryRenderer`
- **Function:** `paragraphs` fallback
- **Root Cause:** Instansiasi array fallback berisi objek teks panjang secara implisit pada konstruksi JSX setiap *frame* berjalan.
- **Optimization Risk:** Low.
- **Expected ROI:** Medium (Mengurangi Minor GC *thrashing* dari eksekusi React).

### #6 - Object Literals in Inline Styles
- **Component:** `MediaFactoryRenderer` & `M3PreviewCanvas`
- **Function:** Atribut `style={{...}}`
- **Root Cause:** Kamus CSS (termasuk komputasi interpolasi template string) dialokasikan sebagai objek baru per *node* DOM pada setiap putaran render 60 FPS.
- **Optimization Risk:** Low.
- **Expected ROI:** Medium (Minimalisasi beban React *Reconciliation*).

---

## 5. SPECIAL INVESTIGATION FINDINGS

- **Unnecessary Re-render:** YES (Seluruh kanvas dirender ulang akibat state waktu lokal).
- **Unstable Props:** YES (Fungsi pointer dan hasil filter array).
- **Missing Memo:** YES (Komputasi array sorting tidak di-memoize).
- **Inline Function pada Hot Path:** YES (`handleHandleDown` dkk).
- **Object Literal pada JSX:** YES (Banyak *inline styles* kompleks).

---

## 6. RECOMMENDATION

Ekosistem *React Preview* saat ini menderita *Layout Thrashing* dan *Garbage Collection Thrashing* bukan karena Engine-nya, melainkan karena orkestrasi `React Component` memaksakan siklus hidup fungsional merespons perubahan waktu (`currentTime`) secara sinkron.

Saya merekomendasikan:
1. Memecah dan mengisolasi komponen yang membutuhkan waktu absolut (seperti `M3PlaybackBar`) dari `M3PreviewCanvas`.
2. Menerapkan pengamanan *memoization* menyeluruh (`useMemo`, `useCallback`) untuk membentengi props dari *churn*.
3. Menaikkan komputasi berat (`sort`, pemetaan fallback, statis objek) keluar dari siklus render.

Menunggu persetujuan peluru eksekusi melalui *Architecture Review*.
