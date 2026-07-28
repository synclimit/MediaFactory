export class ExecutorKernel {
    constructor(ffmpegExecutor) {
        this.executor = ffmpegExecutor;
        this.logs = [];
    }
    
    log(msg) {
        this.logs.push(`[${new Date().toISOString()}] ${msg}`);
    }
    
    async execute(ffmpegCommand, sessionId = 'session_1', options = {}) {
        return this.executor.execute(ffmpegCommand, sessionId, (msg) => this.log(msg), options);
    }
}
