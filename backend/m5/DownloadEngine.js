const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const LibraryEngine = require('./LibraryEngine');
const crypto = require('crypto');
const AppPaths = require('../system/AppPaths');

class DownloadEngine {
    constructor() {
        this.downloadCachePath = path.join(AppPaths.getCacheBase(), 'm5', 'downloads');
    }

    async init() {
        await fs.mkdir(this.downloadCachePath, { recursive: true });
    }

    // Resolves a yt-dlp or ffmpeg download
    async download(url, category, saveFolder, onProgress) {
        await this.init();
        
        console.log(`[M5 DownloadEngine] Starting download for ${url} in category ${category}`);
        
        // Generate a random name to avoid conflicts
        const randId = crypto.randomBytes(4).toString('hex');
        
        // Output path logic
        let outDir = saveFolder || this.downloadCachePath;
        try {
            await fs.mkdir(outDir, { recursive: true });
        } catch (dirErr) {
            console.warn(`[M5 DownloadEngine] Cannot create folder ${outDir}, falling back to cache folder:`, dirErr.message);
            outDir = this.downloadCachePath;
            await fs.mkdir(outDir, { recursive: true });
        }
        const outFileName = `M5_${category}_${randId}.mp4`;
        const outputPath = path.join(outDir, outFileName);

        return new Promise((resolve, reject) => {
            // Check if it's a social URL or direct link
            const isSocial = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com');
            
            if (isSocial) {
                // Using yt-dlp, preferring video+audio mp4 without watermark if possible
                const ytArgs = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]', '--no-playlist', '-o', outputPath, '--', url];
                const ytProc = spawn('yt-dlp', ytArgs);
                
                ytProc.stdout.on('data', (data) => {
                    const output = data.toString();
                    // Parse: [download]  15.2% of 45.33MiB
                    const match = output.match(/\[download\]\s+([\d\.]+)%/);
                    if (match && match[1]) {
                        const pct = parseFloat(match[1]);
                        if (!isNaN(pct) && onProgress) {
                            // Map 0-100 from yt-dlp to 10-99 progress
                            onProgress(10 + Math.floor(pct * 0.89));
                        }
                    }
                });
                
                ytProc.on('close', async (code) => {
                    if (code === 0) {
                        await LibraryEngine.registerFile(category, outputPath);
                        resolve({ success: true, path: outputPath });
                    } else {
                        reject(new Error(`yt-dlp failed with code ${code}`));
                    }
                });
                ytProc.on('error', (err) => reject(err));
            } else {
                // Direct file link, download via ffmpeg to sanitize it
                const ffmpegArgs = ['-y', '-i', url, '-c', 'copy', outputPath];
                const AppPaths = require('../system/AppPaths');
                const ffProc = spawn(AppPaths.getFFmpegPath(), ffmpegArgs);
                                
                ffProc.on('close', async (code) => {
                    if (code === 0) {
                        await LibraryEngine.registerFile(category, outputPath);
                        resolve({ success: true, path: outputPath });
                    } else {
                        reject(new Error(`ffmpeg failed with code ${code}`));
                    }
                });
                ffProc.on('error', (err) => reject(err));
            }
        });
    }

    async getMetadata(url) {
        return new Promise((resolve) => {
            const ytArgs = ['--dump-json', '--no-playlist', '--no-warnings', url];
            const ytProc = spawn('yt-dlp', ytArgs);
            let stdout = '';
            
            ytProc.stdout.on('data', data => stdout += data.toString());
            
            ytProc.on('close', code => {
                if (code === 0 && stdout.trim()) {
                    try {
                        const json = JSON.parse(stdout.trim());
                        
                        // Format duration
                        let durStr = '-';
                        if (json.duration) {
                            const mins = Math.floor(json.duration / 60);
                            const secs = Math.floor(json.duration % 60);
                            durStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                        }
                        
                        // Format size
                        let sizeStr = '-';
                        const bytes = json.filesize || json.filesize_approx;
                        if (bytes) {
                            sizeStr = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                        }

                        resolve({
                            title: json.title || json.fulltitle || 'Video Download',
                            preview: json.thumbnail || null,
                            duration: durStr,
                            size: sizeStr
                        });
                    } catch (e) {
                        resolve({ title: 'Video Download', preview: null, duration: '-', size: '-' });
                    }
                } else {
                    resolve({ title: 'Video Download', preview: null, duration: '-', size: '-' });
                }
            });
            ytProc.on('error', () => resolve({ title: 'Video Download', preview: null, duration: '-', size: '-' }));
        });
    }
}

module.exports = new DownloadEngine();
