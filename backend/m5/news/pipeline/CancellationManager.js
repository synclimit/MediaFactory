class CancellationManager {
    constructor() {
        this.abortController = new AbortController();
    }
    
    cancel() {
        this.abortController.abort();
    }
    
    isCancelled() {
        return this.abortController.signal.aborted;
    }
    
    getSignal() {
        return this.abortController.signal;
    }
    
    reset() {
        this.abortController = new AbortController();
    }
}
module.exports = CancellationManager;