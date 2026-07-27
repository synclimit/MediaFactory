const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const overlaysDir = path.join(__dirname, 'public/assets/overlays');

// Kategori terang/menyala (yang tidak perlu diconvert karena otomatis pakai mix-blend-mode: screen)
const BRIGHT_CATEGORIES = ['smoke_steam', 'fire_light', 'rain_water', 'light_leak', 'particle'];

console.log('================================================================');
console.log('  MEDIAFACTORY OVERLAY AUTO-CONVERTER (BLACK BG TO WEBM ALPHA)');
console.log('================================================================');
console.log(`Scanning folder: ${overlaysDir}\n`);

function scanAndConvert(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`[!] Folder tidak ditemukan: ${dir}`);
    return;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scanAndConvert(fullPath);
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase();
      if (['.mp4', '.mov', '.mkv', '.avi'].includes(ext)) {
        const folderName = path.basename(dir);
        const baseName = path.basename(item.name, ext);
        const outputWebm = path.join(dir, `${baseName}.webm`);

        // Jika ada di kategori terang/menyala, beri info opsional
        if (BRIGHT_CATEGORIES.includes(folderName)) {
          console.log(`[i] Melewati ${folderName}/${item.name} (Kategori menyala/terang -> Sistem otomatis menggunakan CSS blend-mode: Screen)`);
          continue;
        }

        console.log(`[+] Menemukan video natural berlatar hitam: ${folderName}/${item.name}`);
        console.log(`    Mengonversi ke WebM Alpha dengan FFmpeg colorkey...`);

        try {
          // colorkey=0x000000:0.18:0.1 menghapus latar hitam dengan kehalusan tepian (smoothness) 0.1
          const cmd = `ffmpeg -y -i "${fullPath}" -vf "colorkey=0x000000:0.18:0.1,format=yuva420p" -c:v libvpx-vp9 -b:v 2M -auto-alt-ref 0 "${outputWebm}"`;
          execSync(cmd, { stdio: 'inherit' });
          console.log(`[✔] Berhasil membuat WebM Alpha: ${folderName}/${baseName}.webm\n`);
        } catch (err) {
          console.error(`[X] Gagal mengonversi ${item.name}:`, err.message);
        }
      }
    }
  }
}

scanAndConvert(overlaysDir);
console.log('================================================================');
console.log('  Proses Selesai!');
console.log('================================================================');
