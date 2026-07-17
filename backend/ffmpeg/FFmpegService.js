const ServiceRegistry = require('../system/ServiceRegistry');
const ProcessManager = require('./ProcessManager');
const ArgumentBuilder = require('./ArgumentBuilder');
const MetadataExtractor = require('./MetadataExtractor');
const ProgressParser = require('./ProgressParser');
const EncoderDetector = require('./EncoderDetector');
const OutputVerifier = require('./OutputVerifier');

class FFmpegService {
    constructor() {
        this.processManager = new ProcessManager();
        this.argumentBuilder = new ArgumentBuilder();
        this.metadataExtractor = new MetadataExtractor();
        this.progressParser = new ProgressParser();
        this.encoderDetector = new EncoderDetector();
        this.outputVerifier = new OutputVerifier();
    }

    _getRuntime() { return ServiceRegistry.resolve('RuntimeService'); }

    async execute(jobId, config) {
        const runtime = this._getRuntime();
        runtime.emit('FFmpeg.Started', { jobId });
        
        try {
            const args = this.argumentBuilder.build(config);
            await this.processManager.execute(jobId, args, (progress) => {
                this.progressParser.parse(progress);
                runtime.emit('FFmpeg.Progress', { jobId, progress });
            });
            
            await this.outputVerifier.verify(config.outputPath);
            runtime.emit('FFmpeg.Completed', { jobId });
        } catch (error) {
            runtime.emit('FFmpeg.Failed', { jobId, error: error.message });
            throw error;
        }
    }

    async pause(jobId) { await this.processManager.pause(jobId); }
    async resume(jobId) { await this.processManager.resume(jobId); }
    async cancel(jobId) { await this.processManager.cancel(jobId); }
    
    async estimate(jobId) {
        // Hardware-based estimation calculation
    }
}

module.exports = FFmpegService;
