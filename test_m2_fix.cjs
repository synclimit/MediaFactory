const { spawn } = require('child_process');

console.log("=== TESTING M2 YOUTUBE METADATA EXTRACTION FIX ===");

function cleanYoutubeUrl(url) {
    if (!url) return '';
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed);
        if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
            parsed.searchParams.delete('list');
            parsed.searchParams.delete('start_radio');
            parsed.searchParams.delete('index');
            parsed.searchParams.delete('pp');
            return parsed.toString();
        }
    } catch(e) {}
    return trimmed;
}

let rawUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1";
let cleanedUrl = cleanYoutubeUrl(rawUrl);

console.log("Raw URL:    ", rawUrl);
console.log("Cleaned URL:", cleanedUrl);

const dumpArgs = ['--dump-json', '--no-playlist', '--js-runtimes', 'node', '--', cleanedUrl];
console.log("\nSpawning yt-dlp without shell:true with args:", dumpArgs.join(' '));

const ytProc = spawn('yt-dlp', dumpArgs);
let stdoutData = '';
let stderrData = '';

ytProc.stdout.on('data', d => stdoutData += d.toString());
ytProc.stderr.on('data', d => stderrData += d.toString());

ytProc.on('close', code => {
    console.log(`\nyt-dlp process exited with code: ${code}`);
    if (code === 0) {
        try {
            const data = JSON.parse(stdoutData);
            console.log("SUCCESS!");
            console.log("Video Title:", data.title);
            console.log("Channel Name:", data.uploader || data.channel);
            console.log("Duration (sec):", data.duration);
            console.log("\n=== TEST PASSED CLEANLY ===");
        } catch(e) {
            console.error("FAIL: JSON Parse error:", e.message);
        }
    } else {
        console.error("FAIL: yt-dlp stderr output:", stderrData);
    }
});

ytProc.on('error', err => {
    console.error("FAIL: Spawn error:", err.message);
});
