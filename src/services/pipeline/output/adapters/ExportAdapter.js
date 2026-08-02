import { OutputAdapter } from '../OutputAdapter';

/**
 * ExportAdapter
 * Captures frames from the unified RenderPipeline and pushes to FFmpeg.
 */
export class ExportAdapter extends OutputAdapter {
    constructor(ffmpegPipeline) {
        super();
        this.ffmpegPipeline = ffmpegPipeline;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.width = 1920;
        this.height = 1080;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initialize() {
        console.log('[ExportAdapter] Initialized for export');
    }

    async render(frame) {
        if (!frame || !frame.canvas) return;

        // Draw the composed render frame to our export buffer
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(frame.canvas, 0, 0, this.width, this.height);

        const enableRaw = window.__M3_FEATURE_FLAGS?.enableRawBufferPipeline ?? false;

        if (enableRaw) {
            // RAW BUFFER PIPELINE: No Base64 String Encoding
            const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            const rawBuffer = new Uint8Array(imageData.data.buffer);
            await this.ffmpegPipeline.ingestFrame(frame, { rawBuffer, width: this.width, height: this.height });
        } else {
            // LEGACY PIPELINE: Canvas to Base64 String
            const base64 = this.canvas.toDataURL('image/png');
            await this.ffmpegPipeline.ingestFrame(frame, { base64 });
        }
    }

    dispose() {
        this.canvas = null;
        this.ctx = null;
        console.log('[ExportAdapter] Disposed');
    }
}
