const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('===================================================');
console.log('       MEDIAFACTORY SYSTEM & YT-DLP DIAGNOSTIC      ');
console.log('===================================================\n');

let AppPaths;
try {
    AppPaths = require('../backend/system/AppPaths');
} catch (e) {
    console.error('❌ Failed to load AppPaths:', e.message);
}

// 1. Check yt-dlp Path & Executable
console.log('1. Checking yt-dlp Binary...');
const ytDlpBin = AppPaths ? AppPaths.getYtDlpPath() : 'yt-dlp';
console.log(`   Path resolved: ${ytDlpBin}`);

if (fs.existsSync(ytDlpBin)) {
    console.log('   [SUCCESS] File exists on disk.');
} else {
    console.log('   [WARNING] File NOT found at resolved path, falling back to system PATH.');
}

try {
    const version = execSync(`"${ytDlpBin}" --version`, { encoding: 'utf8' }).trim();
    console.log(`   [PASS] yt-dlp Executable Version: ${version}`);
} catch (err) {
    console.log('   [FAIL] Could NOT execute yt-dlp.exe!');
    console.log('   -> Details:', err.message);
    console.log('   -> SUGGESTION: Install Microsoft Visual C++ Redistributable (x64) or check Antivirus exclusions.');
}

console.log('\n2. Testing Live YouTube Extraction (Network & Extraction Test)...');
try {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log(`   Fetching metadata for: ${testUrl}...`);
    const output = execSync(`"${ytDlpBin}" --no-check-certificates --dump-json --no-playlist "${testUrl}"`, {
        timeout: 15000,
        encoding: 'utf8'
    });
    const parsed = JSON.parse(output);
    console.log(`   [PASS] YouTube Metadata Fetch OK! Title: "${parsed.title}"`);
} catch (err) {
    console.log('   [FAIL] YouTube Metadata Fetch Failed!');
    if (err.stderr) {
        console.log('   -> yt-dlp Stderr:', err.stderr.toString().trim());
    } else {
        console.log('   -> Error:', err.message);
    }
    console.log('   -> SUGGESTION: Update yt-dlp.exe to latest version, check Internet/DNS or Antivirus.');
}

console.log('\n3. Checking FFmpeg & FFprobe...');
const ffmpegBin = AppPaths ? AppPaths.getFFmpegPath() : 'ffmpeg';
try {
    execSync(`"${ffmpegBin}" -version`, { stdio: 'ignore' });
    console.log(`   [PASS] FFmpeg OK (${ffmpegBin})`);
} catch (err) {
    console.log(`   [FAIL] FFmpeg failed at ${ffmpegBin}:`, err.message);
}

const ffprobeBin = AppPaths ? AppPaths.getFFprobePath() : 'ffprobe';
try {
    execSync(`"${ffprobeBin}" -version`, { stdio: 'ignore' });
    console.log(`   [PASS] FFprobe OK (${ffprobeBin})`);
} catch (err) {
    console.log(`   [FAIL] FFprobe failed at ${ffprobeBin}:`, err.message);
}

console.log('\n===================================================');
console.log('                  DIAGNOSTIC END                   ');
console.log('===================================================');
