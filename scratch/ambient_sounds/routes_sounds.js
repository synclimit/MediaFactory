/**
 * routes/sounds.js
 *
 * Contoh integrasi ke Express. Validasi katalog dijalankan sekali saat
 * server start (fail-fast kalau ada mapping rusak), lalu setiap request
 * mengambil file HANYA lewat getSoundForTitle/getSoundById.
 */

const express = require("express");
const path = require("path");
const {
  SOUND_CATALOG,
  AUDIO_DIR,
  validateCatalog,
  getSoundForTitle,
  getSoundById,
} = require("../soundCatalog");

const router = express.Router();

// --- Startup check: jangan biarkan server jalan kalau katalog rusak ---
const startupErrors = validateCatalog();
if (startupErrors.length > 0) {
  console.error("[soundCatalog] Ditemukan masalah mapping saat startup:");
  startupErrors.forEach((e) => console.error(" -", e));
  // Sengaja tidak throw di sini, tapi di production sebaiknya:
  // throw new Error("Sound catalog invalid, lihat log di atas.");
}

// GET /api/sounds -> daftar semua judul UI + id, tanpa expose path fisik
router.get("/api/sounds", (req, res) => {
  const list = SOUND_CATALOG.map(({ id, titleUi }) => ({ id, titleUi }));
  res.json(list);
});

// GET /api/sounds/:id/stream -> stream file audio berdasarkan id (bukan judul,
// biar tidak rawan typo/spasi dari frontend)
router.get("/api/sounds/:id/stream", (req, res) => {
  const item = getSoundById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Sound id tidak ditemukan di katalog" });
  }
  const filepath = path.join(AUDIO_DIR, item.filename);
  res.sendFile(filepath, (err) => {
    if (err) {
      console.error(`[soundCatalog] Gagal kirim file untuk id=${item.id}:`, err.message);
      if (!res.headersSent) res.status(500).json({ error: "Gagal membaca file audio" });
    }
  });
});

// Contoh lookup by title, kalau frontend memang kirim titleUi
router.get("/api/sounds/by-title/:title", (req, res) => {
  const item = getSoundForTitle(req.params.title);
  if (!item) {
    return res.status(404).json({ error: `Judul '${req.params.title}' tidak ada di katalog` });
  }
  res.json({ id: item.id, titleUi: item.titleUi });
});

module.exports = router;
