class EncoderDetector {
    constructor() {}

    async detect() {
        // Re-uses HardwareService or queries ffmpeg directly
        return ['h264_nvenc', 'libx264']; // Stub
    }
}

module.exports = EncoderDetector;
