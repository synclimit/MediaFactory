import os from 'os';

export class HardwareProfile {
    constructor(overrideData = null) {
        this.cache = null;
        if (overrideData) {
            this.cache = this.normalize(overrideData);
        } else {
            this.detect();
        }
    }

    detect() {
        const cpus = os.cpus() || [];
        const totalMemMb = Math.round((os.totalmem() || 8 * 1024 * 1024 * 1024) / (1024 * 1024));

        this.cache = {
            cpuCores: cpus.length || 4,
            cpuModel: cpus[0]?.model || 'Generic CPU',
            ramMb: totalMemMb,
            vramMb: totalMemMb >= 16384 ? 8192 : 2048,
            gpuModel: totalMemMb >= 16384 ? 'NVIDIA GeForce RTX' : 'Integrated Graphics',
            hasHwEncoder: totalMemMb >= 8192,
            supportedEncoders: totalMemMb >= 8192 ? ['h264_nvenc', 'hevc_nvenc', 'libx264'] : ['libx264'],
            storageType: 'SSD',
            lastDetectedAt: Date.now()
        };
        return this.cache;
    }

    refresh() {
        return this.detect();
    }

    normalize(data) {
        return {
            cpuCores: data.cpuCores || 4,
            cpuModel: data.cpuModel || 'Generic CPU',
            ramMb: data.ramMb || 8192,
            vramMb: data.vramMb || 2048,
            gpuModel: data.gpuModel || 'Generic GPU',
            hasHwEncoder: Boolean(data.hasHwEncoder),
            supportedEncoders: data.supportedEncoders || ['libx264'],
            storageType: data.storageType || 'SSD',
            lastDetectedAt: Date.now()
        };
    }

    getProfile() {
        if (!this.cache) this.detect();
        return this.cache;
    }
}
