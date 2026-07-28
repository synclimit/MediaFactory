# FAST RENDER ENGINE - PHASE 5: DECISION KNOWLEDGE BASE
**Project:** M3 Fast Render Engine Master Roadmap
**Status:** DESIGN COMPLETE (NO CODING)

---

## 1. Decision Knowledge Base (DKB)
**Tujuan:** Menjadi sumber kebenaran tunggal (*Single Source of Truth*) untuk seluruh pengambilan keputusan logis di dalam Planner.
**Tanggung Jawab:** Menyimpan, memvalidasi, dan menyediakan kumpulan aturan (Rules). DKB membebaskan *Compatibility Engine* dan *Strategy Resolver* dari jerat `if/else` raksasa yang ter-*hardcode*.
**Ruang Lingkup:** DKB murni sebagai "Otak Pasif". Ia hanya ditanya (*queried*) oleh *Engine*, dan menjawab dengan taktik yang relevan.

---

## 2. Rule Model
Struktur abstrak sebuah Aturan (Rule) yang tidak peduli pada nama spesifik modul (seperti "Visualizer"), melainkan berfokus pada kondisi mutlak:

*   **Identifier:** Nama unik (misal: `RULE_NO_CONTINUOUS_TIMELINE`).
*   **Priority:** Angka mutlak (Misal `1000`). Semakin tinggi, semakin berkuasa.
*   **Precondition:** Kondisi pemicu (Misal: *Jika proyek mengandung Capability `RequiresRealtimeSampling`*).
*   **Resulting Strategy:** Hasil mutlak jika aturan terpenuhi (Misal: Paksa ke mode `LAYERED_DYNAMIC`).
*   **Short-Circuit Flag:** Jika `true`, evaluasi berhenti di sini dan abaikan aturan di bawahnya.
*   **Fallback:** Aturan alternatif jika eksekusi gagal di tahap perakitan segmen.
*   **Explanation:** String deskriptif (Misal: *"Proyek ini diturunkan ke mode Berlapis karena ada entitas yang butuh sampel waktu realtime."*)

---

## 3. Rule Evaluation Flow
Aliran evaluasi yang ketat dan deterministik:
1.  **Pengumpulan:** Seluruh aturan ditarik dari DKB.
2.  **Pengurutan (Sorting):** Aturan diurutkan dari *Priority* Tertinggi hingga Terendah.
3.  **Evaluasi Iteratif:** Aturan demi aturan dievaluasi (*Precondition Check*).
4.  **Short-Circuiting:** Jika aturan prioritas dewa (seperti `RULE_HARDWARE_RAM_LOW` prioritas `9999`) memberikan hasil `NORMAL_ONLY` dengan flag *Short-Circuit*, maka seluruh ratusan aturan di bawahnya langsung diabaikan. Ini menjamin performa taktis (O(1) *early exit*).

---

## 4. Rule Categories
Pengelompokan (Kategori) agar manajemen pengetahuan lebih terstruktur:
*   **Hardware Rules:** Menyangkut nyawa sistem (RAM limit, WebGL crash limit). Prioritas Tertinggi.
*   **Capability Rules:** Menyangkut kemampuan Abstrak (*Bakeable*, *Realtime*, *Static*).
*   **Layer Rules:** Mendiagnosis apakah lapisan bawah bisa dipisah dari lapisan atas.
*   **Timeline Rules:** Mendiagnosis rentang waktu antar kejadian (*Kapan lirik muncul beruntun, kapan kosong*).
*   **Fallback Rules:** Jaring pengaman (Safety Net) prioritas terendah jika tidak ada aturan yang cocok.

---

## 5. Conflict Resolution
Jika dua aturan dengan prioritas yang persis **sama** memberikan strategi yang berlawanan (Kondisi Tabrakan):
*   **Mekanisme "Paling Pesimis Menang" (Pessimistic Tie-Breaker):** 
    Sistem akan selalu memilih strategi yang paling "Aman" untuk kestabilan visual. 
    Hierarki keamanan (Dari Paling Pesimis ke Paling Agresif):
    `NORMAL_ONLY` $\rightarrow$ `LAYER_STRATEGY` $\rightarrow$ `EVENT_DRIVEN` $\rightarrow$ `FULL_FAST`.
    *Jika Rule A menyuruh `FULL_FAST` dan Rule B menyuruh `NORMAL_ONLY`, maka `NORMAL_ONLY` otomatis menang.*

---

## 6. Decision Trace
Planner secara diam-diam mencatat jejak audit (*Audit Log*) selama evaluasi aturan. 
Format *Trace*:
`[TIMESTAMP] | [RULE_ID] | [PRIORITY] | [MATCHED_PRECONDITION] | [ACTION_TAKEN]`

*Contoh Trace:*
```text
- RuleEvaluator: Loaded 14 Active Rules.
- RuleEvaluator: Checking RULE_HARDWARE_SAFE (P: 1000) -> PASS.
- RuleEvaluator: Checking RULE_CONTINUOUS_REQUIREMENT (P: 900) -> MATCH! 
  -> Action: Set Strategy to NORMAL_ONLY. Flag: ShortCircuit=true.
- RuleEvaluator: Evaluation Halted.
```
*Trace* ini disuntikkan ke dalam `ValidationContext` sebagai bukti sejarah.

---

## 7. Explainable Planning
Menerjemahkan jejak teknis (*Decision Trace*) menjadi bahasa manusia. 
Tujuan utamanya agar QA Engineer / Programmer tahu "Mengapa proyek saya lama banget dirender padahal sudah pakai Fast Render?"

Fitur API `explainDecision(RenderPlan)` akan mengembalikan teks seperti:
*"Fast Render DIBATALKAN. Keputusan diturunkan ke Normal Render oleh Aturan [RULE_CONTINUOUS_REQUIREMENT] dengan alasan: Proyek ini menggunakan entitas yang membutuhkan sampel jarum jam secara realtime, yang melarang penggunaan metode Fast-Forwarding."*

---

## 8. Rule Extensibility
Prinsip *Open for Extension, Closed for Modification*:
*   Penambahan ilmu baru tidak memerlukan pengeditan *source code* Planner.
*   Programmer cukup memanggil `DKB.registerRule(new Rule(...))`.
*   Jika M3 besok mendapatkan modul *Video Berputar*, Programmer cukup mendaftarkan `RULE_VIDEO_ROTATION` berprioritas tinggi yang akan menimpa aturan lama tanpa menghapusnya.

---

## 9. Rule Versioning
Untuk kompatibilitas mundur (*Backward Compatibility*):
*   Setiap *Rule* wajib mendeklarasikan properti: `minEngineVersion` (misal `1.0.0`) dan `maxEngineVersion` (misal `1.9.9`).
*   Jika mesin berevolusi ke versi `2.0.0` (misalnya *Particle* sudah bisa di-*Bake*), aturan `RULE_NO_PARTICLE_BAKING` yang lama (maks `1.9.9`) akan mati terabaikan secara otomatis oleh DKB. 

---

## 10. Validation of Rules
Mencegah masuknya "Aturan Sampah" ke dalam memori:
Saat `DKB.registerRule()` dipanggil, DKB akan mengaudit struktur *Rule* itu sendiri:
*   Apakah punya *ID* unik? (Tolak jika duplikat).
*   Apakah punya penjelasan manusia? (Tolak jika kosong, mencegah aturan "gaib").
*   Apakah properti *Fallback* membentuk lingkaran setan (*Circular Fallback*)? (Misal Rule A merujuk ke B, B merujuk ke A).
Jika tidak valid, DKB menolak *Rule* tersebut dan melempar `KnowledgeBaseError`.
