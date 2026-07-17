class ProcessManager {
    constructor() {
        this.activeProcesses = new Map();
    }

    async execute(jobId, args, progressCallback) {
        // Spawns FFmpeg child process
        // Pipes stderr to progressCallback
        this.activeProcesses.set(jobId, { status: 'RUNNING', pid: 1234 }); // Stub
    }

    async pause(jobId) {
        // Sends SIGSTOP on Linux/Mac, or uses process suspending on Windows
    }

    async resume(jobId) {
        // Sends SIGCONT on Linux/Mac
    }

    async cancel(jobId) {
        // Sends SIGKILL
        this.activeProcesses.delete(jobId);
    }
}

module.exports = ProcessManager;
