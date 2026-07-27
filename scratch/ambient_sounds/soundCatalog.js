/**
 * soundCatalog.js
 *
 * Single source of truth untuk mapping judul UI -> file audio fisik.
 * Backend SELALU ambil file lewat getSoundForTitle(), tidak pernah lewat
 * pencarian/keputusan AI saat runtime. Ini mencegah "ketuker" antara
 * request user dan file yang benar-benar dikirim.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUDIO_DIR = path.join(__dirname, "assets", "sounds");

/**
 * @typedef {Object} SoundItem
 * @property {string} id           - kode unik, dipakai internal. Tidak boleh duplikat.
 * @property {string} titleUi      - label yang tampil di UI, harus persis sama dgn desain.
 * @property {string} filename     - nama file fisik di folder assets/sounds/.
 * @property {string[]} keywords   - kata kunci pencarian/verifikasi sumber (bukan dipakai runtime).
 * @property {string} [sourceUrl]  - link sumber asli, untuk audit kalau ada yang meleset.
 */

/** @type {SoundItem[]} */
const SOUND_CATALOG = [
  { id: "air_terjun", titleUi: "Air terjun", filename: "air_terjun.mp3", keywords: ["waterfall", "loop"] },
  { id: "angin", titleUi: "Angin", filename: "angin.mp3", keywords: ["wind", "ambient", "loop"] },
  { id: "angin_badai", titleUi: "Angin badai", filename: "angin_badai.mp3", keywords: ["storm wind", "gusts"] },
  { id: "angin_malam", titleUi: "Angin malam", filename: "angin_malam.mp3", keywords: ["night wind", "howling"] },
  { id: "angin_sepoi", titleUi: "Angin sepoi", filename: "angin_sepoi.mp3", keywords: ["gentle breeze"] },
  { id: "api_unggun", titleUi: "Api unggun", filename: "api_unggun.mp3", keywords: ["campfire", "crackling"] },
  { id: "brown_noise", titleUi: "Brown noise", filename: "brown_noise.wav", keywords: ["synthetic", "generated"] },
  { id: "cafe_ramai", titleUi: "Cafe ramai", filename: "cafe_ramai.mp3", keywords: ["coffee shop", "chatter"] },
  { id: "hujan_deras_1", titleUi: "Hujan deras 1", filename: "hujan_deras_1.mp3", keywords: ["heavy rain"] },
  { id: "hujan_deras_2", titleUi: "Hujan deras 2", filename: "hujan_deras_2.mp3", keywords: ["heavy rain", "variant2"] },
  { id: "hujan_deras_3", titleUi: "Hujan deras 3", filename: "hujan_deras_3.mp3", keywords: ["heavy rain", "variant3"] },
  { id: "hujan_petir", titleUi: "Hujan petir", filename: "hujan_petir.mp3", keywords: ["rain", "thunder"] },
  { id: "hujan_rintik", titleUi: "Hujan rintik", filename: "hujan_rintik.mp3", keywords: ["light rain", "drizzle"] },
  { id: "hutan_malam", titleUi: "Hutan malam", filename: "hutan_malam.mp3", keywords: ["forest night"] },
  { id: "jalanan_raya", titleUi: "Jalanan raya", filename: "jalanan_raya.mp3", keywords: ["traffic", "street"] },
  { id: "jangkrik_malam", titleUi: "Jangkrik malam", filename: "jangkrik_malam.mp3", keywords: ["cricket", "night"] },
  { id: "kabin_pesawat", titleUi: "Kabin pesawat", filename: "kabin_pesawat.mp3", keywords: ["airplane cabin"] },
  { id: "kebakaran_hutan", titleUi: "Kebakaran hutan", filename: "kebakaran_hutan.mp3", keywords: ["wildfire"] },
  { id: "keramaian_kota", titleUi: "Keramaian kota", filename: "keramaian_kota.mp3", keywords: ["city crowd"] },
  { id: "kereta_api", titleUi: "Kereta api", filename: "kereta_api.mp3", keywords: ["train"] },
  { id: "ombak_besar", titleUi: "Ombak besar", filename: "ombak_besar.mp3", keywords: ["big waves"] },
  { id: "pantai", titleUi: "Pantai", filename: "pantai.mp3", keywords: ["beach", "waves"] },
  { id: "pantai_1", titleUi: "Pantai 1", filename: "pantai_1.mp3", keywords: ["beach", "variant1"] },
  { id: "pantai_2", titleUi: "Pantai 2", filename: "pantai_2.mp3", keywords: ["beach", "variant2"] },
  { id: "pink_noise", titleUi: "Pink noise", filename: "pink_noise.wav", keywords: ["synthetic", "generated"] },
  { id: "sungai", titleUi: "Sungai", filename: "sungai.mp3", keywords: ["river"] },
  { id: "sungai_deras", titleUi: "Sungai deras", filename: "sungai_deras.mp3", keywords: ["river", "rapids"] },
  { id: "sungai_tenang", titleUi: "Sungai tenang", filename: "sungai_tenang.mp3", keywords: ["river", "calm"] },
  { id: "white_noise", titleUi: "White noise", filename: "white_noise.wav", keywords: ["synthetic", "generated"] },
];

/**
 * Jalankan ini setiap kali server start (atau di CI sebelum deploy).
 * Menangkap 3 kesalahan paling umum penyebab "suara ga nyambung":
 *  - id duplikat
 *  - file fisik yang dirujuk tidak ada di folder assets
 *  - dua judul UI berbeda mengarah ke file fisik yang SAMA
 */
function validateCatalog() {
  const errors = [];
  const seenIds = new Set();
  const filenameToTitles = new Map();

  for (const item of SOUND_CATALOG) {
    if (seenIds.has(item.id)) {
      errors.push(`[DUPLIKAT ID] ${item.id}`);
    }
    seenIds.add(item.id);

    const filepath = path.join(AUDIO_DIR, item.filename);
    if (!fs.existsSync(filepath)) {
      errors.push(`[FILE HILANG] '${item.titleUi}' -> ${filepath} tidak ditemukan`);
    }

    if (!filenameToTitles.has(item.filename)) {
      filenameToTitles.set(item.filename, []);
    }
    filenameToTitles.get(item.filename).push(item.titleUi);
  }

  for (const [filename, titles] of filenameToTitles.entries()) {
    if (titles.length > 1) {
      errors.push(`[FILE DIPAKAI GANDA] ${filename} dipakai oleh: ${titles.join(", ")}`);
    }
  }

  return errors;
}

/**
 * Opsional: hash tiap file. Kalau suatu saat file ke-overwrite tanpa sengaja
 * dengan suara lain, hash-nya berubah dan bisa dideteksi dari script cron/CI.
 */
function checksumReport() {
  const report = {};
  for (const item of SOUND_CATALOG) {
    const filepath = path.join(AUDIO_DIR, item.filename);
    if (fs.existsSync(filepath)) {
      const buffer = fs.readFileSync(filepath);
      report[item.id] = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 8);
    }
  }
  return report;
}

/** Backend selalu panggil ini, bukan pencarian/keputusan AI saat runtime. */
function getSoundForTitle(titleUi) {
  return SOUND_CATALOG.find((item) => item.titleUi === titleUi) || null;
}

function getSoundById(id) {
  return SOUND_CATALOG.find((item) => item.id === id) || null;
}

module.exports = {
  SOUND_CATALOG,
  AUDIO_DIR,
  validateCatalog,
  checksumReport,
  getSoundForTitle,
  getSoundById,
};

// Jalankan langsung: node soundCatalog.js -> cetak laporan validasi
if (require.main === module) {
  const errors = validateCatalog();
  if (errors.length > 0) {
    console.log("ADA MASALAH MAPPING:");
    errors.forEach((e) => console.log(" -", e));
    process.exitCode = 1;
  } else {
    console.log("Semua mapping OK, tidak ada file bolong atau ketuker.");
  }
  console.log(JSON.stringify(checksumReport(), null, 2));
}
