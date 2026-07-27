/**
 * downloadApprovedSounds.js
 *
 * Tugas script ini murni MEKANIS: mengunduh file yang sudah Anda dengar dan
 * approve, lalu menyimpannya ke assets/sounds/ dengan nama yang benar.
 *
 * Script ini TIDAK memilih atau menebak mana suara yang cocok -- itu tetap
 * keputusan Anda. Isi APPROVED_SOUNDS di bawah setelah Anda audisi manual
 * dari daftar kandidat, baru jalankan.
 *
 * Jalankan: node downloadApprovedSounds.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "assets", "sounds");

// Isi baris ini SATU PER SATU, hanya setelah Anda dengar & setujui filenya.
// "id" harus sama persis dengan id di soundCatalog.js.
// "url" harus link download langsung ke file (bukan halaman preview).
const APPROVED_SOUNDS = [
  // TESTING/DRAFT ONLY -- semua di bawah preview kualitas rendah (-lq.mp3)
  // dari Freesound, dipilih tanpa didengarkan manual oleh Anda. Untuk versi
  // final, audisi tiap file dan ganti dengan versi kualitas penuh kalau perlu.
  { id: "air_terjun",      url: "https://cdn.freesound.org/previews/274/274259_4486188-lq.mp3" },
  { id: "angin",           url: "https://cdn.freesound.org/previews/691/691806_15063689-lq.mp3" },
  { id: "angin_badai",     url: "https://cdn.freesound.org/previews/136/136287_649468-lq.mp3" },
  { id: "angin_malam",     url: "https://cdn.freesound.org/previews/223/223960_755551-lq.mp3" },
  { id: "angin_sepoi",     url: "https://cdn.freesound.org/previews/697/697217_7678208-lq.mp3" },
  { id: "api_unggun",      url: "https://cdn.freesound.org/previews/414/414767_4955305-lq.mp3" },
  { id: "cafe_ramai",      url: "https://cdn.freesound.org/previews/260/260062_2258946-lq.mp3" },
  { id: "hujan_deras_1",   url: "https://cdn.freesound.org/previews/533/533154_1038806-lq.mp3" },
  { id: "hujan_deras_2",   url: "https://cdn.freesound.org/previews/772/772074_2397507-lq.mp3" },
  { id: "hujan_deras_3",   url: "https://cdn.freesound.org/previews/645/645926_5902878-lq.mp3" },
  { id: "hujan_petir",     url: "https://cdn.freesound.org/previews/704/704603_4034520-lq.mp3" },
  { id: "hujan_rintik",    url: "https://cdn.freesound.org/previews/34/34065_28216-lq.mp3" },
  { id: "hutan_malam",     url: "https://cdn.freesound.org/previews/719/719558_15600124-lq.mp3" },
  { id: "jalanan_raya",    url: "https://cdn.freesound.org/previews/325/325506_5600514-lq.mp3" },
  { id: "jangkrik_malam",  url: "https://cdn.freesound.org/previews/175/175020_2979997-lq.mp3" },
  { id: "kabin_pesawat",   url: "https://cdn.freesound.org/previews/451/451741_1481531-lq.mp3" },
  // PERHATIAN: lisensi Attribution-NonCommercial -- HANYA boleh dipakai kalau
  // app Anda benar-benar gratis/non-komersial. Kalau ada monetisasi/poin
  // berbayar, WAJIB diganti sumber lain sebelum rilis.
  { id: "kebakaran_hutan", url: "https://cdn.freesound.org/previews/253/253770_7037-lq.mp3" },
  { id: "keramaian_kota",  url: "https://cdn.freesound.org/previews/423/423007_3325582-lq.mp3" },
  { id: "kereta_api",      url: "https://cdn.freesound.org/previews/341/341208_2792951-lq.mp3" },
  { id: "ombak_besar",     url: "https://cdn.freesound.org/previews/197/197714_7037-lq.mp3" },
  { id: "pantai",          url: "https://cdn.freesound.org/previews/585/585499_29508-lq.mp3" },
  { id: "pantai_1",        url: "https://cdn.freesound.org/previews/376/376795_6128004-lq.mp3" },
  { id: "pantai_2",        url: "https://cdn.freesound.org/previews/586/586117_29508-lq.mp3" },
  { id: "sungai",          url: "https://cdn.freesound.org/previews/39/39831_28216-lq.mp3" },
  { id: "sungai_deras",    url: "https://cdn.freesound.org/previews/39/39830_28216-lq.mp3" },
  { id: "sungai_tenang",   url: "https://cdn.freesound.org/previews/578/578068_7241289-lq.mp3" },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    const request = https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // ikuti redirect (umum terjadi di Freesound/Pixabay)
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} saat mengunduh ${url}`));
        return;
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      fileStream.on("error", reject);
    });
    request.on("error", reject);
  });
}

async function main() {
  if (APPROVED_SOUNDS.length === 0) {
    console.log("APPROVED_SOUNDS masih kosong. Isi dulu id + url yang sudah Anda approve.");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { id, url } of APPROVED_SOUNDS) {
    const ext = path.extname(new URL(url).pathname) || ".mp3";
    const destPath = path.join(OUT_DIR, `${id}${ext}`);
    try {
      await downloadFile(url, destPath);
      console.log(`OK  ${id} -> ${destPath}`);
    } catch (err) {
      console.error(`GAGAL  ${id}: ${err.message}`);
    }
  }

  console.log("\nSelesai. Jalankan `node soundCatalog.js` untuk validasi ulang katalog,");
  console.log("dan pastikan filename di soundCatalog.js sesuai dengan yang baru diunduh.");
}

main();
