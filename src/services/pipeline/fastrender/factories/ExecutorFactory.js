import { ExecutorKernel } from '../executor/ExecutorKernel.js';
import { FFmpegExecutor } from '../executor/FFmpegExecutor.js';
import { CommandQueue } from '../executor/CommandQueue.js';
import { ResourceBinder } from '../executor/ResourceBinder.js';
import { ProcessManager } from '../executor/ProcessManager.js';
import { CancellationManager } from '../executor/CancellationManager.js';
import { ProgressMonitor } from '../executor/ProgressMonitor.js';
import { ExecutionValidator } from '../executor/ExecutionValidator.js';

export class ExecutorFactory {
    static createExecutor() {
        const queue = new CommandQueue();
        const binder = new ResourceBinder();
        const cancelMgr = new CancellationManager();
        const progressMon = new ProgressMonitor();
        const processMgr = new ProcessManager(progressMon, cancelMgr);
        const validator = new ExecutionValidator();
        const executor = new FFmpegExecutor(queue, binder, processMgr, validator);
        
        const kernel = new ExecutorKernel(executor);
        // Expose components for testing
        kernel.progressMonitor = progressMon;
        kernel.cancellationManager = cancelMgr;
        
        return kernel;
    }
}
