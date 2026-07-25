# SPRINT 05.01 - REACT PREVIEW ARCHITECTURE VALIDATION
## M3 PERFORMANCE ROADMAP: PHASE 7

**Status:** COMPLETED
**Priority:** HIGH
**Owner:** Gravity

---

## 1. EXECUTIVE SUMMARY

Fokus sprint investigasi ini adalah membedah arsitektur komunikasi lintas-batas (*Boundary Communication*) antara siklus pemutaran waktu (*Playback Clock*) dengan ekosistem antarmuka React, secara spesifik mengaudit propagasi dan kepemilikan *state* `m3CurrentTimeSec`. 

Hasil validasi memastikan bahwa arsitektur reaktif saat ini menderita cacat desain fundamental (Root Prop-Drilling Anti-Pattern), di mana akar utama UI MediaFactory dirender paksa 60 kali per detik demi memperbarui garis penunjuk (playhead) di komponen yang jauh di lapisan bawah.

---

## 2. STATE OWNERSHIP ANALYSIS (`m3CurrentTimeSec`)

Alur propagasi saat ini:
**Playback Clock** (HTML Audio) $\rightarrow$ **State Owner** (`M3StudioPanel` via `useState`) $\rightarrow$ **React State** (Re-render Root) $\rightarrow$ **Prop Drilling** (Canvas, Timelines, Toolbar) $\rightarrow$ **MediaFactoryRenderer** $\rightarrow$ **Engine**.

Berdasarkan validasi forensik, berikut adalah jawaban atas hipotesis kepemilikan state:

1. **Apakah state ini memang harus dimiliki React?**
   **TIDAK.** React dirancang untuk memanajemen struktur (*layout/view*) yang reaktif secara kondisional, bukan dirender berulang pada frekuensi layar murni 60 FPS. State ini adalah parasit bagi pohon React.

2. **Apakah state ini bisa dimiliki Engine?**
   **BISA.** Waktu pemutaran absolut (*Absolute Playback Time*) merupakan wilayah natural *PlaybackEngine* atau *RenderFrameStore*. Engine memproses delta time (dt) sendiri secara mandiri dari *RequestAnimationFrame* tanpa bergantung pada React.

3. **Apakah cukup menggunakan ref?**
   **TIDAK CUKUP** untuk komponen yang bergerak. *Playhead* dan *Time Indicator* perlu secara literal pindah posisi dan memperbarui teks, yang membutuhkan mutasi DOM langsung. *Ref* bisa dipakai apabila memutasi gaya (style.left) lewat akses DOM murni, tapi kurang rapi di kacamata deklaratif React.

4. **Apakah cukup event subscription?**
   **CUKUP.** Komponen berukuran mikro (*Leaf Components*) seperti `<Playhead />` dapat berlangganan ke *event emitter* dan hanya merender kepingannya sendiri tanpa mengganggu induknya.

5. **Apakah cukup external store?**
   **SANGAT CUKUP.** Sistem arsitektur kita sudah memiliki `renderFrameStore`. Penggabungan ini akan melenyapkan duplikasi state (*Single Source of Truth*).

6. **Berapa component yang benar-benar membutuhkan perubahan setiap frame?**
   Hanya **3 komponen daun (*Leaf Components*)**:
   - Garis *Playhead* vertikal di `M3TimelinePanel`.
   - Garis *Playhead* vertikal di `M3SubtitleTimelinePanel`.
   - Teks Indikator Waktu (`00:10 / 01:20`) di `M3PreviewCanvas`.

Seluruh Panel, Editor, Inspektur, Menu, dan Kontainer tidak memiliki urusan dengan perubahan pergerakan milidetik.

---

## 3. ARCHITECTURE TRANSITION TABLE

| Aspek | Skenario | Deskripsi Detail |
| :--- | :--- | :--- |
| **Current Architecture** | Root State & Prop Drilling | `M3StudioPanel` (sebagai dewa aplikasi) memegang state `m3CurrentTimeSec` $\rightarrow$ merender seluruh pohon turunannya 60 kali setiap detik setiap audio diputar. |
| **Proposed Architecture** | Engine-owned External Store | Cabut state dari `M3StudioPanel`. Waktu diikat murni di *RenderFrameStore / PlaybackEngine*. Komponen mikro (*Leaf*) secara spesifik men-*subscribe* store, hanya meng-*update* DOM masing-masing secara terisolasi. |
| **Risk** | Konfigurasi Dua Arah (*Two-Way Binding*) | Menekan garis waktu (*Seek/Scrubbing*) oleh mouse *user* harus disinkronkan kembali menjadi *command* memutar balik (*Rewind/Forward*) menuju Engine, bukan memanggil `setState` UI. Risiko menengah (*Medium*). |
| **Benefit** | Lenyapnya Root Re-render | Pembebasan 100% beban perenderan tak beralasan. Beban CPU React mendekati 0%, antarmuka akan sedingin es saat *playback* jalan, melancarkan *throughput* FPS ke *RealtimeEffectRenderer*. |

---

## 4. RECOMMENDATION

Arsitektur sekarang sangat membatasi skalabilitas aplikasi MediaFactory, di mana setiap tombol atau panel baru yang dimasukkan ke UI akan otomatis dieksekusi ulang 60 kali per detik akibat *Prop Drilling* `m3CurrentTimeSec`.

Implementasi optimasi kelak (di Sprint selanjutnya) **wajib** mengeksekusi operasi *"State Decoupling"* ini sebelum optimasi mikro (*useMemo/useCallback*) lainnya dipertimbangkan. Waktu berdetak milik Engine, bukan milik *M3StudioPanel*.
