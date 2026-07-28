import { ExecutionSession, ExecutionStatus, ExecutionResult } from '../contracts/ExecutorContracts.js';

export class FFmpegExecutor {
    constructor(queue, binder, processManager, validator) {
        this.queue = queue;
        this.binder = binder;
        this.processManager = processManager;
        this.validator = validator;
    }
    
    async execute(ffmpegCommand, sessionId, logFn, options = {}) {
        logFn('Execution Started');
        const session = new ExecutionSession(sessionId, '1.0');
        logFn('Session Created');
        
        try {
            session.status = ExecutionStatus.PREPARING;
            session.status = ExecutionStatus.STARTING_PROCESS;
            logFn('Process Started');
            session.status = ExecutionStatus.RUNNING;
            
            const result = await this.processManager.execute(ffmpegCommand, sessionId, options);
            
            logFn('Process Finished');
            session.status = ExecutionStatus.COMPLETED;
            
            const execResult = new ExecutionResult(
                sessionId, 
                ExecutionStatus.COMPLETED, 
                result.exitCode, 
                session.startTime, 
                Date.now(), 
                ffmpegCommand.outputFile, 
                null, 
                { frames: this.processManager.progressMonitor.currentProgress.currentFrame }
            );
            logFn('Execution Completed');
            return execResult;
            
        } catch (e) {
            logFn('Error Detected');
            logFn('Cleanup');
            session.status = e.code === 'ECANCEL' ? ExecutionStatus.CANCELLED : ExecutionStatus.FAILED;
            logFn('Execution Failed');
            throw e;
        }
    }
}
