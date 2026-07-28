export const ExecutionStatus = Object.freeze({
    INITIALIZED: 'INITIALIZED',
    PREPARING: 'PREPARING',
    RESOURCE_BINDING: 'RESOURCE_BINDING',
    STARTING_PROCESS: 'STARTING_PROCESS',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
});

export class ExecutionSession {
    constructor(sessionId, renderPlanReference) {
        this.sessionId = sessionId;
        this.rendererVersion = '1.0.0';
        this.executorVersion = '1.0.0';
        this.startTime = Date.now();
        this.status = ExecutionStatus.INITIALIZED;
        this.renderPlanReference = renderPlanReference;
        this.commandQueue = [];
        this.resourceBindings = {};
        this.metadata = {};
    }
}

export class ExecutionResult {
    constructor(sessionId, status, exitCode, startTime, endTime, outputFile, error, statistics) {
        this.sessionId = sessionId;
        this.status = status;
        this.exitCode = exitCode;
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = endTime - startTime;
        this.outputFile = outputFile;
        this.error = error;
        this.statistics = statistics;
        Object.freeze(this);
    }
}

export class ExecutionProgress {
    constructor(currentFrame, fps, speed, bitrate, elapsedTime, estimatedRemaining) {
        this.currentFrame = currentFrame;
        this.fps = fps;
        this.speed = speed;
        this.bitrate = bitrate;
        this.elapsedTime = elapsedTime;
        this.estimatedRemaining = estimatedRemaining;
    }
}

export class ExecutionError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
