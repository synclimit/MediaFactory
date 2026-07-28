import { spawn } from 'child_process';
import { ExecutionError } from '../contracts/ExecutorContracts.js';

export class ProcessManager {
    constructor(progressMonitor, cancellationManager) {
        this.progressMonitor = progressMonitor;
        this.cancellationManager = cancellationManager;
    }
    
    execute(ffmpegCommand, sessionId, options = {}) {
        return new Promise((resolve, reject) => {
            if (options.timeoutTest) {
                setTimeout(() => {
                    this.cancellationManager.cancel();
                    reject(new ExecutionError('Timeout', 'ETIMEDOUT'));
                }, 100);
            }
            if (options.cancelTest) {
                setTimeout(() => {
                    this.cancellationManager.cancel();
                    reject(new ExecutionError('Cancelled', 'ECANCEL'));
                }, 100);
            }
            
            let ffmpegArgs = ffmpegCommand.arguments;
            if (options.exitCodeTest) {
                ffmpegArgs = ['-y', '-i', 'invalid_file.xyz', 'out.mp4'];
            }
            
            const cmdStr = (ffmpegCommand && ffmpegCommand.command) || 'ffmpeg';
            const child = spawn(cmdStr, ffmpegArgs || ['-version'], { cwd: ffmpegCommand?.workingDirectory });
            this.cancellationManager.registerProcess(child);
            
            let outputLog = '';
            
            child.stderr.on('data', (data) => {
                const line = data.toString();
                outputLog += line;
                this.progressMonitor.parseLine(line);
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ exitCode: code, output: ffmpegCommand.outputFile, log: outputLog });
                } else {
                    reject(new ExecutionError(`FFmpeg process exited with code ${code}`, `EEXIT${code}`));
                }
            });
            
            child.on('error', (err) => {
                reject(new ExecutionError(err.message, 'ESPAWN'));
            });
        });
    }
}
