export class CancellationManager {
    constructor() {
        this.process = null;
    }
    
    registerProcess(process) {
        this.process = process;
    }
    
    cancel() {
        if (this.process) {
            this.process.kill('SIGTERM');
            // Mock force kill after timeout
            setTimeout(() => {
                try { this.process.kill('SIGKILL'); } catch(e){}
            }, 3000);
            return true;
        }
        return false;
    }
}
