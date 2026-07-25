const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { FingerprintProvider } = require('../providers/FingerprintProvider');
const { MockBeatProvider } = require('../providers/MockBeatProvider');
const { MockWhisperProvider } = require('../providers/MockWhisperProvider');
const { RealWhisperProvider } = require('../providers/RealWhisperProvider');

class AssetGeneratorEngine {
    constructor() {
        this.jobs = {}; // Store queues by sessionId or global
        this.activeQueue = [];
        this.isProcessing = false;
        this.shouldCancel = false;
        this.currentAbortController = null;
        this.currentOptions = {};

        // Supported extensions
        this.supportedExtensions = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg']);
    }

    /**
     * Get ffprobe metadata
     */
    async getMetadata(filePath) {
        return new Promise((resolve, reject) => {
            const args = [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                filePath
            ];

            const proc = spawn('ffprobe', args);
            let output = '';

            proc.stdout.on('data', chunk => {
                output += chunk.toString();
            });

            proc.on('error', err => reject(err));

            proc.on('close', code => {
                if (code !== 0) {
                    return reject(new Error('ffprobe failed'));
                }
                try {
                    const data = JSON.parse(output);
                    const format = data.format || {};
                    const stream = data.streams?.find(s => s.codec_type === 'audio') || {};

                    resolve({
                        duration: Number(format.duration || 0),
                        sampleRate: Number(stream.sample_rate || 0),
                        channels: Number(stream.channels || 0),
                        bitrate: Number(format.bit_rate || 0),
                        fileSize: Number(format.size || 0)
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    scanDirectory(dirPath, fileList = []) {
        if (!fs.existsSync(dirPath)) return fileList;
        
        try {
            const initialStat = fs.statSync(dirPath);
            if (initialStat.isFile()) {
                const ext = path.extname(dirPath).toLowerCase();
                if (this.supportedExtensions.has(ext)) {
                    fileList.push(dirPath);
                }
                return fileList;
            }

            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        this.scanDirectory(fullPath, fileList);
                    } else {
                        const ext = path.extname(fullPath).toLowerCase();
                        if (this.supportedExtensions.has(ext)) {
                            fileList.push(fullPath);
                        }
                    }
                } catch (err) {
                    // Ignore unreadable files (e.g. EPERM, broken symlink)
                }
            }
        } catch (err) {
            // Ignore unreadable directories
        }
        return fileList;
    }

    /**
     * Init a new scan job (doesn't process yet, just returns list)
     */
    async scanFolder(folderPath) {
        try {
            const files = this.scanDirectory(folderPath);
            return {
                success: true,
                files: files.map((f, i) => ({
                    id: `asset_job_${Date.now()}_${i}`,
                    filePath: f,
                    fileName: path.basename(f),
                    status: 'Pending',
                    error: null
                }))
            };
        } catch(e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Start processing a queue
     */
    startQueue(queue, options = {}) {
        if (this.isProcessing) return;
        this.jobs = {}; // clear old
        this.activeQueue = queue;
        this.shouldCancel = false;
        this.currentOptions = options;
        
        // Return immediately, process in background
        if (!this.isProcessing) {
            this.processNext();
        }
    }

    cancelQueue() {
        this.shouldCancel = true;
        // Mark all Pending as Cancelled
        for (const job of this.activeQueue) {
            if (job.status === 'Pending') job.status = 'Cancelled';
        }
        if (this.currentAbortController) {
            this.currentAbortController.abort();
            this.currentAbortController = null;
        }
    }

    getQueueStatus() {
        return {
            queue: this.activeQueue,
            isProcessing: this.isProcessing
        };
    }

    updateJob(id, updates) {
        const job = this.activeQueue.find(j => j.id === id);
        if (job) {
            Object.assign(job, updates);
        }
    }

    async processNext() {
        this.isProcessing = true;
        this.currentAbortController = new AbortController();

        const nextJob = this.activeQueue.find(j => j.status === 'Pending');
        if (!nextJob || this.shouldCancel) {
            // Note: If we just cancelled, we might have no nextJob, or shouldCancel is true.
            this.isProcessing = false;
            this.currentAbortController = null;
            return;
        }

        const jobId = nextJob.id;
        const filePath = nextJob.filePath;
        
        try {
            this.updateJob(jobId, { status: 'Scanning' });

            const parsedPath = path.parse(filePath);
            const srtPath = path.join(parsedPath.dir, parsedPath.name + '.srt');
            const jsonPath = path.join(parsedPath.dir, parsedPath.name + '.analysis.json');

            // 1. Calculate Hash
            const currentHash = await FingerprintProvider.getFingerprint(filePath);

            // 2. Validate Existing Cache (skip if forceRegenerate)
            let cacheValid = false;
            if (!this.currentOptions.forceRegenerate && fs.existsSync(srtPath) && fs.existsSync(jsonPath)) {
                try {
                    const cache = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                    if (cache.fingerprint && cache.fingerprint.audioHash === currentHash) {
                        cacheValid = true;
                    }
                } catch(e) {
                    // JSON invalid, ignore
                }
            }

            if (cacheValid) {
                this.updateJob(jobId, { status: 'Skipped' });
                // Move to next
                setTimeout(() => this.processNext(), 0);
                return;
            }

            // 3. Metadata
            this.updateJob(jobId, { status: 'Metadata' });
            const metadata = await this.getMetadata(filePath);

            // 4. Beat
            this.updateJob(jobId, { status: 'Beat' });
            const beatData = await MockBeatProvider.analyze(filePath, metadata.duration);

            // 5. Whisper
            this.updateJob(jobId, { status: 'Whisper' });
            // Fallback to MockWhisperProvider if testing without real engine, else use RealWhisperProvider
            // The user wanted to implement Real Whisper directly.
            const whisperData = await RealWhisperProvider.analyze(filePath, metadata.duration, {
                model: this.currentOptions.whisperModel || 'base',
                signal: this.currentAbortController.signal
            });

            // 6. Saving
            this.updateJob(jobId, { status: 'Saving' });
            
            // Write SRT
            fs.writeFileSync(srtPath, whisperData.srtContent, 'utf8');

            // Write JSON
            const schema = {
                metadata: {
                    duration: metadata.duration,
                    sampleRate: metadata.sampleRate,
                    channels: metadata.channels,
                    bitrate: metadata.bitrate,
                    fileSize: metadata.fileSize
                },
                beat: {
                    bpm: beatData.bpm,
                    beatTimeline: beatData.beatTimeline
                },
                subtitle: {
                    wordTimestamps: whisperData.wordTimestamps,
                    detectedLanguage: whisperData.detectedLanguage,
                    confidence: whisperData.confidence
                },
                fingerprint: {
                    audioHash: currentHash
                },
                version: {
                    schemaVersion: "1.0",
                    whisperVersion: "mock-1.0",
                    beatEngineVersion: "mock-1.0"
                }
            };
            fs.writeFileSync(jsonPath, JSON.stringify(schema, null, 2), 'utf8');

            this.updateJob(jobId, { status: 'Completed' });

        } catch (error) {
            if (error.message === 'Aborted' || this.shouldCancel) {
                this.updateJob(jobId, { status: 'Cancelled' });
            } else {
                console.error('[AssetGeneratorEngine]', error);
                this.updateJob(jobId, { status: 'Failed', error: error.message });
            }
        } finally {
            this.currentAbortController = null;
        }

        // Loop to next
        setTimeout(() => this.processNext(), 0);
    }
}

// Export singleton
const engine = new AssetGeneratorEngine();
module.exports = { AssetGeneratorEngine: engine };
