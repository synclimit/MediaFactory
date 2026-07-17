class EncoderBuilder {
    static profiles = {
        CPU_FAST: '-c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 128k',
        CPU_BALANCED: '-c:v libx264 -preset ultrafast -crf 25 -c:a aac -b:a 128k',
        NVENC_HIGH: '-c:v h264_nvenc -preset p6 -cq 19 -b:v 8M -c:a aac -b:a 320k',
        YOUTUBE_SHORTS: '-c:v libx264 -preset medium -crf 18 -profile:v high -c:a aac -b:a 320k',
        TIKTOK: '-c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k'
    };

    /**
     * Retrieves the FFmpeg encoding flags based on the OptimizationPlan's preferred profile.
     * @param {Object} outputSettings 
     * @param {string} preferredProfile 
     */
    static build(outputSettings, preferredProfile) {
        // Fallback to CPU_BALANCED if profile not found
        let flags = this.profiles[preferredProfile] || this.profiles.CPU_BALANCED;

        const threads = outputSettings.performance?.threads || 0;
        if (threads > 0) {
            flags += ` -threads ${threads}`;
        }

        return flags;
    }
}

module.exports = EncoderBuilder;
