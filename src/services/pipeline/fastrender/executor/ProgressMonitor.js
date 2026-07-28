import { ExecutionProgress } from '../contracts/ExecutorContracts.js';

export class ProgressMonitor {
    constructor() {
        this.subscribers = [];
        this.currentProgress = new ExecutionProgress(0, 0, 0, '0kbits/s', '00:00:00', '00:00:00');
    }
    
    subscribe(callback) {
        this.subscribers.push(callback);
    }
    
    parseLine(stderrLine) {
        // Basic FFmpeg output parsing
        // Example: frame=  150 fps= 30 q=-1.0 size=    2048kB time=00:00:05.00 bitrate= 335.6kbits/s speed=1.5x
        if (stderrLine.includes('frame=') && stderrLine.includes('time=')) {
            const frameMatch = stderrLine.match(/frame=\s*(\d+)/);
            const fpsMatch = stderrLine.match(/fps=\s*(\d+)/);
            const speedMatch = stderrLine.match(/speed=\s*([\d\.]+)x/);
            const timeMatch = stderrLine.match(/time=\s*([\d:\.]+)/);
            const bitrateMatch = stderrLine.match(/bitrate=\s*([\d\.]+kbits\/s)/);
            
            this.currentProgress = new ExecutionProgress(
                frameMatch ? parseInt(frameMatch[1]) : 0,
                fpsMatch ? parseInt(fpsMatch[1]) : 0,
                speedMatch ? parseFloat(speedMatch[1]) : 1.0,
                bitrateMatch ? bitrateMatch[1] : '0kbits/s',
                timeMatch ? timeMatch[1] : '00:00:00',
                'Unknown'
            );
            
            for (let sub of this.subscribers) {
                sub(this.currentProgress);
            }
        }
    }
}
