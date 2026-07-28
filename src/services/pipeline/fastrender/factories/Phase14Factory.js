import { FFmpegCommandBuilder } from '../command/FFmpegCommandBuilder.js';
import { CommandValidator } from '../command/CommandValidator.js';
import { HardwareDetector } from '../hardware/HardwareDetector.js';
import { BenchmarkEngine } from '../benchmark/BenchmarkEngine.js';
import { TelemetryCollector } from '../telemetry/TelemetryCollector.js';
import { ExecutorKernel } from '../executor/ExecutorKernel.js';
import { FFmpegExecutor } from '../executor/FFmpegExecutor.js';
import { ProcessManager } from '../executor/ProcessManager.js';
import { CancellationManager } from '../executor/CancellationManager.js';
import { ProgressMonitor } from '../executor/ProgressMonitor.js';

export class Phase14Factory {
    static createCommandBuilder() {
        return new FFmpegCommandBuilder(new CommandValidator());
    }
    static createHardwareDetector() {
        return new HardwareDetector();
    }
    static createBenchmark() {
        return new BenchmarkEngine();
    }
    static createTelemetry() {
        return new TelemetryCollector();
    }
    static createExecutor() {
        const cancelMgr = new CancellationManager();
        const progressMon = new ProgressMonitor();
        const processMgr = new ProcessManager(progressMon, cancelMgr);
        const executor = new FFmpegExecutor(processMgr);
        const kernel = new ExecutorKernel(executor);
        kernel.progressMonitor = progressMon;
        kernel.cancellationManager = cancelMgr;
        return kernel;
    }
}
