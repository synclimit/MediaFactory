/**
 * tools/ensure-binaries.cjs
 *
 * Ensures all required CLI binaries (ffmpeg.exe, ffprobe.exe, yt-dlp.exe)
 * exist in both backend/bin and bin before packaging with electron-builder.
 *
 * If running on GitHub Actions or a clean clone, it automatically fetches
 * any missing binaries from official sources.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKEND_BIN = path.join(ROOT_DIR, 'backend', 'bin');
const ROOT_BIN = path.join(ROOT_DIR, 'bin');

const REQUIRED_FILES = ['ffmpeg.exe', 'ffprobe.exe', 'yt-dlp.exe'];

function ensureDirs() {
    if (!fs.existsSync(BACKEND_BIN)) fs.mkdirSync(BACKEND_BIN, { recursive: true });
    if (!fs.existsSync(ROOT_BIN)) fs.mkdirSync(ROOT_BIN, { recursive: true });
}

function syncBetweenDirs() {
    for (const file of REQUIRED_FILES) {
        const backendFile = path.join(BACKEND_BIN, file);
        const rootFile = path.join(ROOT_BIN, file);

        const backendExists = fs.existsSync(backendFile) && fs.statSync(backendFile).size > 0;
        const rootExists = fs.existsSync(rootFile) && fs.statSync(rootFile).size > 0;

        if (backendExists && !rootExists) {
            console.log(`[ensure-binaries] Copying ${file} from backend/bin to bin...`);
            fs.copyFileSync(backendFile, rootFile);
        } else if (!backendExists && rootExists) {
            console.log(`[ensure-binaries] Copying ${file} from bin to backend/bin...`);
            fs.copyFileSync(rootFile, backendFile);
        }
    }
}

function downloadFile(url, destPath, maxRedirects = 10) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) {
            return reject(new Error(`Too many redirects when downloading ${url}`));
        }

        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'MediaFactory-Build-Script/1.0'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const nextUrl = new URL(res.headers.location, url).href;
                return resolve(downloadFile(nextUrl, destPath, maxRedirects - 1));
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`Download failed with HTTP ${res.statusCode} for ${url}`));
            }

            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close(() => resolve());
            });

            fileStream.on('error', (err) => {
                fs.unlink(destPath, () => {});
                reject(err);
            });
        });

        req.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

function findOnSystem(command) {
    try {
        const stdout = execSync(`where.exe ${command}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            if (fs.existsSync(line) && fs.statSync(line).size > 0) {
                return line;
            }
        }
    } catch (e) {
        // Not found in PATH
    }
    return null;
}

async function ensureYtDlp() {
    const backendFile = path.join(BACKEND_BIN, 'yt-dlp.exe');
    const rootFile = path.join(ROOT_BIN, 'yt-dlp.exe');

    const backendOk = fs.existsSync(backendFile) && fs.statSync(backendFile).size > 1000000;
    const rootOk = fs.existsSync(rootFile) && fs.statSync(rootFile).size > 1000000;

    if (backendOk && rootOk) {
        console.log('[ensure-binaries] yt-dlp.exe is present in both directories.');
        return;
    }

    if (backendOk && !rootOk) {
        fs.copyFileSync(backendFile, rootFile);
        return;
    }

    if (!backendOk && rootOk) {
        fs.copyFileSync(rootFile, backendFile);
        return;
    }

    console.log('[ensure-binaries] Downloading yt-dlp.exe from official GitHub releases...');
    const url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    await downloadFile(url, backendFile);
    fs.copyFileSync(backendFile, rootFile);
    console.log('[ensure-binaries] yt-dlp.exe downloaded successfully.');
}

async function ensureFFmpegAndFFprobe() {
    const backendFfmpeg = path.join(BACKEND_BIN, 'ffmpeg.exe');
    const rootFfmpeg = path.join(ROOT_BIN, 'ffmpeg.exe');
    const backendFfprobe = path.join(BACKEND_BIN, 'ffprobe.exe');
    const rootFfprobe = path.join(ROOT_BIN, 'ffprobe.exe');

    let hasFfmpeg = (fs.existsSync(backendFfmpeg) && fs.statSync(backendFfmpeg).size > 1000000) ||
                    (fs.existsSync(rootFfmpeg) && fs.statSync(rootFfmpeg).size > 1000000);
    let hasFfprobe = (fs.existsSync(backendFfprobe) && fs.statSync(backendFfprobe).size > 1000000) ||
                     (fs.existsSync(rootFfprobe) && fs.statSync(rootFfprobe).size > 1000000);

    syncBetweenDirs();

    if (hasFfmpeg && hasFfprobe) {
        console.log('[ensure-binaries] ffmpeg.exe and ffprobe.exe are present in both directories.');
        return;
    }

    // Attempt 1: Look on system PATH (e.g. GitHub Actions Windows runners with Chocolatey FFmpeg)
    if (!hasFfmpeg) {
        const sysFfmpeg = findOnSystem('ffmpeg.exe');
        if (sysFfmpeg) {
            console.log(`[ensure-binaries] Found ffmpeg on system at ${sysFfmpeg}, copying...`);
            fs.copyFileSync(sysFfmpeg, backendFfmpeg);
            fs.copyFileSync(sysFfmpeg, rootFfmpeg);
            hasFfmpeg = true;
        }
    }

    if (!hasFfprobe) {
        const sysFfprobe = findOnSystem('ffprobe.exe');
        if (sysFfprobe) {
            console.log(`[ensure-binaries] Found ffprobe on system at ${sysFfprobe}, copying...`);
            fs.copyFileSync(sysFfprobe, backendFfprobe);
            fs.copyFileSync(sysFfprobe, rootFfprobe);
            hasFfprobe = true;
        }
    }

    if (hasFfmpeg && hasFfprobe) {
        console.log('[ensure-binaries] ffmpeg and ffprobe acquired from system.');
        return;
    }

    // Attempt 2: Download Gyan.dev or BtbN release zip containing both ffmpeg.exe and ffprobe.exe
    console.log('[ensure-binaries] Downloading FFmpeg essentials archive (contains ffmpeg & ffprobe)...');
    const zipUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
    const tempZip = path.join(ROOT_DIR, 'temp_ffmpeg.zip');

    try {
        await downloadFile(zipUrl, tempZip);
        console.log('[ensure-binaries] Extracting ffmpeg.exe and ffprobe.exe from zip archive...');

        const zip = new AdmZip(tempZip);
        const entries = zip.getEntries();

        for (const entry of entries) {
            if (entry.entryName.endsWith('ffmpeg.exe')) {
                fs.writeFileSync(backendFfmpeg, entry.getData());
                fs.copyFileSync(backendFfmpeg, rootFfmpeg);
                console.log('[ensure-binaries] Extracted ffmpeg.exe successfully.');
            } else if (entry.entryName.endsWith('ffprobe.exe')) {
                fs.writeFileSync(backendFfprobe, entry.getData());
                fs.copyFileSync(backendFfprobe, rootFfprobe);
                console.log('[ensure-binaries] Extracted ffprobe.exe successfully.');
            }
        }
    } finally {
        if (fs.existsSync(tempZip)) {
            try { fs.unlinkSync(tempZip); } catch (e) {}
        }
    }
}

async function main() {
    console.log('===================================================');
    console.log('    MEDIAFACTORY BINARY ASSET PREPARATION          ');
    console.log('===================================================');

    ensureDirs();
    syncBetweenDirs();

    await ensureYtDlp();
    await ensureFFmpegAndFFprobe();
    syncBetweenDirs();

    console.log('\nFinal binary inventory:');
    let allOk = true;
    for (const f of REQUIRED_FILES) {
        const bPath = path.join(BACKEND_BIN, f);
        const rPath = path.join(ROOT_BIN, f);

        const bSize = fs.existsSync(bPath) ? fs.statSync(bPath).size : 0;
        const rSize = fs.existsSync(rPath) ? fs.statSync(rPath).size : 0;

        console.log(` - backend/bin/${f}: ${bSize > 0 ? (bSize / 1024 / 1024).toFixed(1) + ' MB' : 'MISSING'}`);
        console.log(` - bin/${f}:         ${rSize > 0 ? (rSize / 1024 / 1024).toFixed(1) + ' MB' : 'MISSING'}`);

        if (bSize === 0 || rSize === 0) allOk = false;
    }

    if (!allOk) {
        console.error('\n[ensure-binaries] ERROR: One or more required binaries could not be prepared!');
        process.exit(1);
    }

    console.log('\n[ensure-binaries] SUCCESS: All binaries are verified and ready for packaging.');
    console.log('===================================================\n');
}

main().catch((err) => {
    console.error('[ensure-binaries] Fatal error:', err);
    process.exit(1);
});
