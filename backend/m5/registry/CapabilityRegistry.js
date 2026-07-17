class CapabilityRegistry {
    static renderers = {
        FFMPEG: {
            zoompan: true,
            motion_blur: true,
            hardware_encode: true,
            advanced_audio: true
        },
        MOVIEPY: {
            zoompan: false,
            motion_blur: false,
            hardware_encode: false,
            advanced_audio: true
        },
        WEBGL: {
            zoompan: true,
            motion_blur: false,
            hardware_encode: true,
            advanced_audio: false
        }
    };

    /**
     * Checks if a renderer supports a specific capability.
     * @param {string} rendererName 
     * @param {string} capability 
     */
    static supports(rendererName, capability) {
        const renderer = this.renderers[rendererName.toUpperCase()];
        if (!renderer) return false;
        return !!renderer[capability];
    }
}

module.exports = CapabilityRegistry;
