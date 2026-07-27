# Instruksi Lengkap untuk Gravity — Implementasi 26 Suara Ambient

Tujuan: memasang seluruh suara ambient ke folder `assets/sounds/` backend
*MediaFactory*, dengan mapping yang BENAR antara judul UI dan file fisik
(tidak ada lagi kasus "suara ga nyambung").

Kerjakan langkah-langkah di bawah ini SECARA BERURUTAN. Jangan skip langkah
verifikasi di akhir.

---

## Langkah 1 — Salin 4 file inti ke backend

Salin file-file berikut (sudah dibuat sebelumnya) ke lokasi ini:

| File | Lokasi tujuan |
|---|---|
| `soundCatalog.js` | root folder backend |
| `routes_sounds.js` | `backend/routes/sounds.js` |
| `generateNoise.js` | root folder backend |
| `downloadApprovedSounds.js` | root folder backend |

## Langkah 2 — Generate 3 noise sintetis (White/Pink/Brown)

```
node generateNoise.js
```

Ini menghasilkan `white_noise.wav`, `pink_noise.wav`, `brown_noise.wav` di
`assets/sounds/` — murni matematika, tanpa dependency, tanpa masalah
lisensi.

## Langkah 3 — Download 26 field-recording dari daftar yang sudah di-curate

```
node downloadApprovedSounds.js
```

Script ini sudah berisi 26 entri lengkap (`id` + `url` preview Freesound).
Ia akan mengunduh semua file ke `assets/sounds/<id>.<ext>` secara otomatis.

**PENTING — bukan tugas Gravity untuk menambah/mengubah URL di file ini.**
Daftar ini sudah dipilih dan didokumentasikan sumbernya oleh pengguna. Kalau
Gravity menemukan file yang hilang atau error saat validasi, laporkan ke
pengguna — jangan tebak/ganti sendiri dengan hasil pencarian baru.

## Langkah 4 — Jalankan validasi katalog

```
node soundCatalog.js
```

Harus keluar: **"Semua mapping OK, tidak ada file bolong atau ketuker."**

Kalau masih ada `[FILE HILANG]`, cek langkah 2–3 sudah selesai jalan tanpa
error (langkah 3 butuh koneksi internet).

## Langkah 5 — Hubungkan route ke Express

Di `server.js` (atau entry point Express Anda), tambahkan:

```js
const soundRoutes = require('./routes/sounds');
app.use(soundRoutes);
```

## Langkah 6 — Pasang SoundPicker di frontend

Ganti handler tombol "Browse" di halaman Ambient (yang saat ini membuka File
Explorer Windows) supaya membuka komponen `SoundPicker.jsx` (sudah dibuat
sebelumnya, CSS sudah digabung di dalam file yang sama — tidak perlu file
`.css` terpisah). Komponen ini menarik daftar dari `/api/sounds` dan otomatis
menandai "Belum tersedia" untuk suara yang filenya belum ada.

---

## Referensi lengkap: 29 file suara dan sumbernya

(26 field-recording dari Freesound + 3 noise sintetis lokal = 29 file,
sesuai jumlah tombol di UI Anda)

| id (di katalog) | Judul UI | Sumber |
|---|---|---|
| `air_terjun` | Air terjun | Freesound (kwahmah_02) |
| `angin` | Angin | Freesound (ATRUNA) |
| `angin_badai` | Angin badai | Freesound (juskiddink) |
| `angin_malam` | Angin malam | Freesound (tcpp) |
| `angin_sepoi` | Angin sepoi | Freesound (dhallcomposer) |
| `api_unggun` | Api unggun | Freesound (samarobryn) |
| `brown_noise` | Brown noise | Generate lokal (generateNoise.js) |
| `cafe_ramai` | Cafe ramai | Freesound (mhtaylor67) |
| `hujan_deras_1` | Hujan deras 1 | Freesound (DWOBoyle) |
| `hujan_deras_2` | Hujan deras 2 | Freesound (inuetc) |
| `hujan_deras_3` | Hujan deras 3 | Freesound (lebaston100) |
| `hujan_petir` | Hujan petir | Freesound (VKProduktion) |
| `hujan_rintik` | Hujan rintik | Freesound (Arctura) |
| `hutan_malam` | Hutan malam | Freesound (fribergmusic2024) |
| `jalanan_raya` | Jalanan raya | Freesound (ListenTonyBoy) |
| `jangkrik_malam` | Jangkrik malam | Freesound (sengjinn) |
| `kabin_pesawat` | Kabin pesawat | Freesound (richwise) |
| `kebakaran_hutan` | Kebakaran hutan | Freesound (tim.kahn) — **⚠️ NonCommercial** |
| `keramaian_kota` | Keramaian kota | Freesound (OGsoundFX) |
| `kereta_api` | Kereta api | Freesound (Yoyodaman234) |
| `ombak_besar` | Ombak besar | Freesound (tim.kahn) |
| `pantai` | Pantai | Freesound (Koops — malam/tenang) |
| `pantai_1` | Pantai 1 | Freesound (amholma — sangat tenang) |
| `pantai_2` | Pantai 2 | Freesound (Koops — siang, ada camar) |
| `pink_noise` | Pink noise | Generate lokal (generateNoise.js) |
| `sungai` | Sungai | Freesound (Arctura) |
| `sungai_deras` | Sungai deras | Freesound (Arctura — versi rapids) |
| `sungai_tenang` | Sungai tenang | Freesound (BurghRecords) |
| `white_noise` | White noise | Generate lokal (generateNoise.js) |

---

## Catatan lisensi yang WAJIB diperhatikan sebelum rilis publik

- **`kebakaran_hutan`**: lisensi **Attribution-NonCommercial**. Kalau app
  Anda punya sistem poin/pembayaran/monetisasi apa pun, file ini TIDAK BOLEH
  dipakai di versi produksi — harus dicari pengganti berlisensi CC0/CC-BY
  biasa, atau dihapus dari `APPROVED_SOUNDS` dan dicari manual.
- Sisanya berlisensi CC0 (bebas pakai tanpa syarat) atau CC-BY (boleh pakai
  komersial, tinggal cantumkan kredit nama pembuat).
- Semua file yang diunduh via `downloadApprovedSounds.js` adalah preview
  kualitas rendah (~64–128kbps). Ini cukup untuk testing, tapi sebaiknya
  diganti versi kualitas penuh (butuh login Freesound untuk unduh) sebelum
  rilis final ke pengguna nyata.

## Aturan tetap berlaku untuk Gravity ke depannya

Kalau nanti ada suara baru yang perlu ditambahkan atau salah satu dari 26
ini perlu diganti:

1. **Gravity boleh** menjalankan script (download, generate, validasi) dan
   melaporkan hasilnya.
2. **Gravity TIDAK boleh** memilih sendiri file mana yang "cocok" untuk
   suatu judul tanpa pengguna mendengarkan dan menyetujui dulu — ini
   penyebab utama masalah "ga nyambung" yang terjadi sebelumnya.
3. Setiap penambahan/perubahan sound WAJIB lewat `soundCatalog.js` sebagai
   satu-satunya sumber kebenaran, lalu divalidasi dengan
   `node soundCatalog.js` sebelum dianggap selesai.
