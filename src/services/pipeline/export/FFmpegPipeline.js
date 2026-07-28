import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

/**
 * FFmpegPipeline (Real FFmpeg Integration)
 * 
 * Production-ready FFmpeg export interface using FFmpeg.wasm.
 * Supports MP4, WEBM, PNG Sequence, and Image exports.
 * Fixed: Implements Video Chunking to prevent MEMFS OOM Memory Leaks.
 */
export class FFmpegPipeline {
    constructor() {
        this.ffmpeg = new FFmpeg();
        this.isReady = false;
        this.format = 'mp4';
        this.frameCount = 0;
        this.onProgress = null;
        this.log = '';
        
        this.CHUNK_SIZE = 300; // Encode every 300 frames to prevent OOM
        this.chunks = [];
    }

    async initialize(format = 'mp4', onProgress = null) {
        this.format = format;
        this.onProgress = onProgress;
        this.frameCount = 0;
        this.log = '';
        this.chunks = [];
        
        this.ffmpeg.on('log', ({ message }) => {
            this.log += message + '\n';
        });

        if (!this.ffmpeg.loaded) {
            await this.ffmpeg.load();
        }
        this.isReady = true;
    }

    async ingestFrame(renderFrame, adapterData) {
        if (!this.isReady) throw new Error('FFmpegPipeline not initialized');
        
        if (adapterData.rawBuffer) {
            // RAW BUFFER PIPELINE: Write RGBA byte array directly
            const fileName = `frame_${String(this.frameCount).padStart(5, '0')}.raw`;
            await this.ffmpeg.writeFile(fileName, adapterData.rawBuffer);
            this.rawWidth = adapterData.width || 1920;
            this.rawHeight = adapterData.height || 1080;
            this.frameCount++;
        } else if (adapterData.base64) {
            // LEGACY PIPELINE
            const data = await fetchFile(adapterData.base64);
            const fileName = `frame_${String(this.frameCount).padStart(5, '0')}.png`;
            await this.ffmpeg.writeFile(fileName, data);
            this.frameCount++;
        }

        // MEMORY LEAK PREVENTION (CHUNKING)
        // If we hit the chunk limit, stop and encode this chunk immediately to free RAM
        if (this.frameCount > 0 && this.frameCount % this.CHUNK_SIZE === 0) {
            await this._encodeChunk();
        }
    }

    async _encodeChunk() {
        const vcodec = this.format === 'webm' ? 'libvpx-vp9' : 'libx264';
        const enableRaw = window.__M3_FEATURE_FLAGS?.enableRawBufferPipeline ?? false;
        const fileExt = enableRaw ? 'raw' : 'png';
        const chunkExt = this.format === 'webm' ? 'webm' : 'mp4';
        
        const chunkIndex = this.chunks.length;
        const chunkName = `chunk_${chunkIndex}.${chunkExt}`;
        
        const startFrame = chunkIndex * this.CHUNK_SIZE;
        const framesInChunk = this.frameCount - startFrame;
        if (framesInChunk <= 0) return;

        let args = [];
        if (enableRaw) {
            args = [
                '-f', 'rawvideo', '-pixel_format', 'rgba',
                '-video_size', `${this.rawWidth || 1920}x${this.rawHeight || 1080}`,
                '-framerate', '60', '-start_number', String(startFrame),
                '-i', `frame_%05d.raw`, '-vframes', String(framesInChunk),
                '-c:v', vcodec, '-pix_fmt', 'yuv420p', chunkName
            ];
        } else {
            args = [
                '-framerate', '60', '-start_number', String(startFrame),
                '-i', `frame_%05d.png`, '-vframes', String(framesInChunk),
                '-c:v', vcodec, '-pix_fmt', 'yuv420p', chunkName
            ];
        }

        await this.ffmpeg.exec(args);
        this.chunks.push(chunkName);

        // FREE MEMORY IMMEDIATELY
        for (let i = startFrame; i < this.frameCount; i++) {
            await this.ffmpeg.deleteFile(`frame_${String(i).padStart(5, '0')}.${fileExt}`);
        }
    }

    async finalize() {
        if (!this.isReady) return null;
        if (this.frameCount === 0) return null;

        try {
            if (this.format === 'png_sequence') {
                return { success: true, format: this.format, type: 'sequence', count: this.frameCount };
            } else if (this.format === 'jpg') {
                const data = await this.ffmpeg.readFile('frame_00000.png');
                const blob = new Blob([data.buffer], { type: 'image/jpeg' });
                return { success: true, format: 'jpg', url: URL.createObjectURL(blob), log: this.log };
            } else {
                // Encode remaining trailing frames as the final chunk
                if (this.frameCount > this.chunks.length * this.CHUNK_SIZE) {
                    await this._encodeChunk();
                }

                const ext = this.format === 'webm' ? 'webm' : 'mp4';
                const finalOutput = `output.${ext}`;

                if (this.chunks.length === 1) {
                    // Only one chunk, just rename/copy it
                    await this.ffmpeg.exec(['-i', this.chunks[0], '-c', 'copy', finalOutput]);
                } else {
                    // Concat multiple chunks using concat demuxer
                    let concatList = '';
                    for (let c of this.chunks) {
                        concatList += `file '${c}'\n`;
                    }
                    await this.ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatList));
                    await this.ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', finalOutput]);
                    await this.ffmpeg.deleteFile('concat.txt');
                }

                const data = await this.ffmpeg.readFile(finalOutput);
                const mime = this.format === 'webm' ? 'video/webm' : 'video/mp4';
                const blob = new Blob([data.buffer], { type: mime });
                
                // Cleanup FS chunks
                for (let c of this.chunks) {
                    await this.ffmpeg.deleteFile(c);
                }
                await this.ffmpeg.deleteFile(finalOutput);

                this.isReady = false;
                return { success: true, format: this.format, url: URL.createObjectURL(blob), log: this.log };
            }
        } catch (error) {
            return { success: false, error: error.message, log: this.log };
        }
    }
}
