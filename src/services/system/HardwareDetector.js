export class HardwareDetector {
    constructor() {
        this.specs = {
            cpuCores: navigator.hardwareConcurrency || 4,
            ramGb: navigator.deviceMemory || 8, // GB
            gpu: 'Unknown GPU',
            vramEstimated: 'Unknown'
        };
    }

    async detect() {
        // Detect GPU info via WebGL
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    this.specs.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        } catch (e) {
            console.warn('Failed to detect GPU info');
        }

        // Generate Recommendations
        this.recommendations = this._generateRecommendations(this.specs);

        return { specs: this.specs, recommendations: this.recommendations };
    }

    _generateRecommendations(specs) {
        const isHighEnd = specs.ramGb >= 16 && specs.cpuCores >= 8;
        const isLowEnd = specs.ramGb <= 4 || specs.cpuCores <= 2;

        return {
            previewQuality: isHighEnd ? '1080p' : (isLowEnd ? '360p' : '720p'),
            exportThreads: Math.max(1, specs.cpuCores - 2), // Keep 2 cores free for OS
            whisperMode: isHighEnd ? 'Studio' : (isLowEnd ? 'Quick' : 'Balanced'),
            renderQuality: isHighEnd ? 'High' : (isLowEnd ? 'Draft' : 'Medium')
        };
    }
}

export const hardwareDetector = new HardwareDetector();
