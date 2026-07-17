const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const ServiceRegistry = require('./ServiceRegistry');

class HardwareService {
    constructor() {
        this.cache = null;
    }

    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    async scan() {
        if (this.cache) return this.cache;
        
        const runtime = this._getRuntime();
        runtime.emit('System.HardwareScanned', { status: 'started' });

        const hardware = {
            cpu: os.cpus()[0].model,
            cores: os.cpus().length,
            ramGb: Math.round(os.totalmem() / 1024 / 1024 / 1024),
            encoders: [],
            ffmpegAvailable: false,
            gpu: 'Unknown'
        };

        try {
            if (process.platform === 'win32') {
                const { stdout } = await execAsync('wmic path win32_VideoController get name');
                const gpus = stdout.split('\n').slice(1).map(l => l.trim()).filter(l => l);
                if (gpus.length > 0) hardware.gpu = gpus[0];
            }
        } catch (e) { /* ignore wmic errors */ }

        try {
            const { stdout } = await execAsync('ffmpeg -encoders');
            hardware.ffmpegAvailable = true;
            
            if (stdout.includes('h264_nvenc')) hardware.encoders.push('h264_nvenc');
            if (stdout.includes('hevc_nvenc')) hardware.encoders.push('hevc_nvenc');
            if (stdout.includes('h264_amf')) hardware.encoders.push('h264_amf');
            if (stdout.includes('h264_qsv')) hardware.encoders.push('h264_qsv');
            if (stdout.includes('libx264')) hardware.encoders.push('libx264');
        } catch (e) {
            hardware.ffmpegAvailable = false;
        }

        this.cache = hardware;
        runtime.emit('System.HardwareScanned', { status: 'completed', hardware });
        return hardware;
    }

    async refresh() {
        this.cache = null;
        return await this.scan();
    }

    async getCache() {
        if (!this.cache) return await this.scan();
        return this.cache;
    }
}

module.exports = HardwareService;
