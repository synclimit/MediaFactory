const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const router = express.Router();

// Memory store for splitter jobs to allow polling progress
const splitterJobs = {};
let jobCounter = 0;

function hashUrl(url) {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 10);
}

// Ensure cache directory exists
const cacheDir = path.resolve('.mediafactory/cache/m2-splitter');
fs.mkdir(cacheDir, { recursive: true }).catch(() => {});

// 1. Metadata Extractor
router.post('/api/m2/splitter/metadata', async (req, res) => {
    const url = req.body.url;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const ytData = await new Promise((resolve, reject) => {
            const ytArgs = ['--dump-json', '--no-playlist', '--', url];
            const ytProc = spawn('yt-dlp', ytArgs);
            let stdoutData = '';
            let stderrData = '';

            ytProc.stdout.on('data', d => stdoutData += d.toString());
            ytProc.stderr.on('data', d => stderrData += d.toString());

            const timeoutId = setTimeout(() => {
                ytProc.kill();
                reject(new Error('Metadata request timeout'));
            }, 30000);

            ytProc.on('close', code => {
                clearTimeout(timeoutId);
                if (code === 0) {
                    try { resolve(JSON.parse(stdoutData)); } catch (e) { reject(new Error('Failed to parse yt-dlp output')); }
                } else {
                    reject(new Error(`yt-dlp failed with code ${code}: ${stderrData.substring(0, 200)}`));
                }
            });
            ytProc.on('error', err => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });

        // Ensure chapters and description are sent back
        const payload = {
            videoId: ytData.id,
            videoTitle: ytData.title,
            channelName: ytData.uploader || ytData.channel,
            videoDuration: ytData.duration,
            thumbnailUrl: ytData.thumbnail,
            chapters: ytData.chapters || null,
            description: ytData.description || ''
        };

        res.json(payload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1.5 Gemini Vision OCR & Text Extractor
router.post('/api/m2/splitter/vision', async (req, res) => {
    const { thumbnailUrl, description, apiKey } = req.body;
    if (!apiKey) {
        return res.status(400).json({ error: 'Missing api key' });
    }
    try {
        const parts = [];
        parts.push({ text: "CRITICAL INSTRUCTION: You MUST extract the EXACT and COMPLETE list of song titles from the provided video description and/or image. DO NOT skip any songs. DO NOT summarize. Only output the titles, one per line. Do not include numbers, track numbers, artist names (if it's the same for all), or timestamps. Just the raw titles. Output every single title found from the very first to the very last." });
        
        if (description) {
            parts.push({ text: "Description: " + description });
        }
        
        if (thumbnailUrl) {
            try {
                let imgRes = await fetch(thumbnailUrl);
                if (!imgRes.ok && thumbnailUrl.includes('maxresdefault')) {
                    const fallbackUrl = thumbnailUrl.replace('maxresdefault', 'hqdefault');
                    imgRes = await fetch(fallbackUrl);
                }
                if (imgRes.ok) {
                    const buffer = await imgRes.arrayBuffer();
                    const base64Img = Buffer.from(buffer).toString('base64');
                    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                    parts.push({ inline_data: { mime_type: mimeType, data: base64Img } });
                }
            } catch(e) {
                console.error("Failed to fetch thumbnail for Gemini", e);
            }
        }

        // Call Gemini
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }]
            })
        });

        if (!geminiRes.ok) {
            const err = await geminiRes.json();
            throw new Error(err.error?.message || 'Gemini API failed');
        }

        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Split by lines and clean
        const titles = text.split('\n')
            .map(t => t.replace(/^[\d\.\-\*\_]+\s*/g, '').trim())
            .filter(t => t.length > 0);

        res.json({ titles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Download and Split Flow
router.post('/api/m2/splitter/process', async (req, res) => {
    const { url, outputFolder, songs, videoId, videoTitle, aiTitles, videoDuration } = req.body;
    if (!url || !outputFolder) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    jobCounter++;
    const jobId = `M2SPLIT_${Date.now()}_${jobCounter}`;

    splitterJobs[jobId] = {
        id: jobId,
        status: 'Waiting',
        progress: 0,
        currentTask: 'Queued',
        songs: songs || [],
        error: null
    };

    res.json({ jobId });

    // Background Processing
    processSplitterJob(jobId, url, outputFolder, songs, videoId, videoTitle, aiTitles, videoDuration).catch(err => {
        if (splitterJobs[jobId]) {
            splitterJobs[jobId].status = 'Failed';
            splitterJobs[jobId].error = err.message;
        }
    });
});

router.get('/api/m2/splitter/job/:id', (req, res) => {
    const job = splitterJobs[req.params.id];
    if (job) {
        res.json(job);
    } else {
        res.status(404).json({ error: 'Job not found' });
    }
});

async function processSplitterJob(jobId, url, outputFolder, songs, videoId, videoTitle, aiTitles = [], videoDuration = 0) {
    const job = splitterJobs[jobId];
    if (!job) return;

    const safeTitle = (videoTitle || 'Playlist').replace(/[<>:"/\\|?*]+/g, '_');
    const targetFolder = path.join(outputFolder, safeTitle);
    const audioHash = hashUrl(url);
    const downloadPathTemplate = path.join(cacheDir, `${audioHash}.%(ext)s`);

    try {
        await fs.mkdir(targetFolder, { recursive: true });

        // Stage 1: Download
        job.status = 'Downloading';
        job.progress = 0;
        
        await new Promise((resolve, reject) => {
            const ytArgs = ['-f', 'bestaudio', '--no-playlist', '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', downloadPathTemplate, '--', url];
            const ytProc = spawn('yt-dlp', ytArgs);
            
            ytProc.stdout.on('data', chunk => {
                const out = chunk.toString();
                const match = out.match(/\[download\]\s+([\d\.]+)\%/);
                if (match) {
                    const p = parseFloat(match[1]);
                    job.progress = p;
                    if (p >= 100) {
                        job.status = 'Converting to MP3...';
                    }
                }
            });
            ytProc.stderr.on('data', () => {}); // Consume stderr
            
            const timeoutId = setTimeout(() => {
                ytProc.kill();
                reject(new Error('yt-dlp timeout after 120s'));
            }, 120000);

            ytProc.on('close', code => {
                clearTimeout(timeoutId);
                if (code === 0) resolve();
                else reject(new Error(`yt-dlp failed with exit code ${code}`));
            });
            ytProc.on('error', (err) => {
                clearTimeout(timeoutId);
                reject(err);
            });
        });

        const downloadedFile = path.join(cacheDir, `${audioHash}.mp3`);
        
        let finalSongs = songs || [];

        if (finalSongs.length === 0) {
            let useSmartSplit = false;
            
            // Phase 1: Smart API Estimation (iTunes) - DISABLED per user request
            // We now rely solely on Silence Detection with lower thresholds.
            if (aiTitles && aiTitles.length > 0 && videoDuration > 0) {
                // job.status = 'Estimating Track Lengths (API)';
                // ... disabled ...
            }

            // Phase 2: Silence Detect Fallback
            if (!useSmartSplit) {
                job.status = 'Detecting Silence';
                job.progress = 0;
                
                finalSongs = await new Promise((resolve, reject) => {
                    const ffArgs = ['-i', downloadedFile, '-af', 'silencedetect=noise=-35dB:d=0.4', '-f', 'null', '-'];
                    const ffProc = spawn('ffmpeg', ffArgs);
                    let ffOut = '';
                    ffProc.stderr.on('data', chunk => ffOut += chunk.toString());
                    ffProc.on('close', code => {
                        if (code === 0) {
                            const regex = /silence_end: ([\d\.]+) \| silence_duration: ([\d\.]+)/g;
                            let match;
                            const detectedSongs = [];
                            let lastEnd = 0;
                            let trackIndex = 1;
                            
                            while ((match = regex.exec(ffOut)) !== null) {
                                const silenceEnd = parseFloat(match[1]);
                                const silenceDuration = parseFloat(match[2]);
                                const silenceStart = silenceEnd - silenceDuration;
                                
                                if (silenceStart - lastEnd > 15) { // at least 15 seconds song
                                    const assignedTitle = aiTitles[trackIndex - 1] || `Track ${trackIndex}`;
                                    detectedSongs.push({
                                        title: assignedTitle,
                                        startTime: lastEnd,
                                        endTime: silenceStart
                                    });
                                    trackIndex++;
                                    lastEnd = silenceEnd; // only advance if committed
                                }
                            }
                            
                            // Add final track
                            const finalAssignedTitle = aiTitles[trackIndex - 1] || `Track ${trackIndex}`;
                            detectedSongs.push({
                                title: finalAssignedTitle,
                                startTime: lastEnd,
                                endTime: null
                            });
                            
                            // FALLBACK: Math chunking
                            if (detectedSongs.length <= 1 && aiTitles.length > 1 && videoDuration > 0) {
                                const mathSongs = [];
                                const chunkLength = videoDuration / aiTitles.length;
                                for (let i = 0; i < aiTitles.length; i++) {
                                    mathSongs.push({
                                        title: aiTitles[i],
                                        startTime: i * chunkLength,
                                        endTime: (i === aiTitles.length - 1) ? null : (i + 1) * chunkLength
                                    });
                                }
                                job.songs = mathSongs;
                                resolve(mathSongs);
                            } else {
                                job.songs = detectedSongs;
                                resolve(detectedSongs);
                            }
                        } else {
                            reject(new Error('Silence detection failed'));
                        }
                    });
                    ffProc.on('error', reject);
                });
            }
        }

        // Stage 2: Splitting
        job.status = 'Splitting';
        job.progress = 0;

        for (let i = 0; i < finalSongs.length; i++) {
            const song = finalSongs[i];
            
            // Generate valid filename matching original song title, preserving numbering if present
            const safeSongTitle = song.title.replace(/[<>:"/\\|?*]+/g, '');
            const outputPath = path.join(targetFolder, `${safeSongTitle}.mp3`);

            await new Promise((resolve, reject) => {
                // Using ffmpeg to stream copy exact segment without re-encoding quality loss
                const ffArgs = [
                    '-i', downloadedFile,
                    '-ss', song.startTime.toString(),
                    ...(song.endTime ? ['-to', song.endTime.toString()] : []),
                    '-c', 'copy',
                    '-y',
                    outputPath
                ];

                const ffProc = spawn('ffmpeg', ffArgs);
                ffProc.on('close', code => {
                    if (code === 0) resolve();
                    else reject(new Error(`ffmpeg failed to split ${safeSongTitle}`));
                });
                ffProc.on('error', reject);
            });

            job.progress = Math.round(((i + 1) / finalSongs.length) * 100);
        }

        // Cleanup temp file to save disk space
        fs.unlink(downloadedFile).catch(() => {});

        job.status = 'Exporting';
        job.progress = 100;

        // Brief delay so UI shows Exporting
        setTimeout(() => {
            job.status = 'Completed';
        }, 1500);
        
    } catch (error) {
        job.status = 'Failed';
        job.error = error.message;
        throw error;
    }
}

module.exports = { router };
