const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const ServiceRegistry = require('./ServiceRegistry');

class HardwareService {
    constructor() {
        this.cache = null;
        this.telemetryCache = { cpu: 0, ram: 0, gpu: 0 };
        this.lastCpuInfo = null;
        
        // Start polling telemetry every second
        setInterval(() => this._pollTelemetry(), 1000);
    }

    _pollTelemetry() {
        try {
            // RAM calculation
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            this.telemetryCache.ram = Math.round((usedMem / totalMem) * 100);

            // CPU calculation
            const currentCpuInfo = os.cpus();
            if (this.lastCpuInfo) {
                let totalUser = 0;
                let totalSys = 0;
                let totalIdle = 0;

                for (let i = 0; i < currentCpuInfo.length; i++) {
                    const c = currentCpuInfo[i].times;
                    const l = this.lastCpuInfo[i].times;
                    totalUser += (c.user - l.user);
                    totalSys += (c.sys - l.sys);
                    totalIdle += (c.idle - l.idle);
                }

                const total = totalUser + totalSys + totalIdle;
                const percent = (total === 0) ? 0 : ((totalUser + totalSys) / total) * 100;
                this.telemetryCache.cpu = Math.round(percent);
            }
            this.lastCpuInfo = currentCpuInfo;

            // GPU calculation (Mock for performance, gently oscillates between 10-35%)
            if (this.telemetryCache.gpu === 0) {
                this.telemetryCache.gpu = 10 + Math.random() * 20;
            } else {
                const fluctuation = (Math.random() - 0.5) * 4; 
                this.telemetryCache.gpu = Math.max(0, Math.min(100, this.telemetryCache.gpu + fluctuation));
            }

        } catch (e) {
            console.error('[HardwareService] Telemetry error:', e);
        }
    }

    getTelemetry() {
        return {
            cpu: this.telemetryCache.cpu,
            ram: this.telemetryCache.ram,
            gpu: Math.round(this.telemetryCache.gpu)
        };
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
