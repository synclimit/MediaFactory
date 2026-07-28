export const RendererState = Object.freeze({
    INITIALIZED: 'INITIALIZED',
    READING_PIPELINE: 'READING_PIPELINE',
    TRANSLATING_COMMAND: 'TRANSLATING_COMMAND',
    BUILDING_GRAPH: 'BUILDING_GRAPH',
    BUILDING_STAGE: 'BUILDING_STAGE',
    VALIDATING: 'VALIDATING',
    READY: 'READY',
    FAILED: 'FAILED'
});

export const RenderCommandType = Object.freeze({
    BEGIN_STREAM: 'BEGIN_STREAM',
    APPLY_VIDEO_FILTER: 'APPLY_VIDEO_FILTER',
    APPLY_AUDIO_FILTER: 'APPLY_AUDIO_FILTER',
    APPLY_OVERLAY: 'APPLY_OVERLAY',
    APPLY_SUBTITLE: 'APPLY_SUBTITLE',
    APPLY_COLOR: 'APPLY_COLOR',
    STREAM_COPY: 'STREAM_COPY',
    CACHE_REUSE: 'CACHE_REUSE',
    ENCODE: 'ENCODE',
    END_STREAM: 'END_STREAM'
});

export class RenderMetadata {
    constructor() {
        this.estimatedCommandCount = 0;
        this.estimatedFilterCount = 0;
        this.estimatedStreamCopy = 0;
        this.estimatedEncode = 0;
        this.estimatedDecode = 0;
        this.estimatedComplexity = 0;
        this.estimatedMemory = 0;
        this.estimatedGpu = 0;
        this.estimatedDiskIo = 0;
    }
}

export class RenderCommand {
    constructor(commandId, commandType, dependencyIds, resourceReference, stageId, executionOrder) {
        this.commandId = commandId;
        this.commandType = commandType;
        this.dependencyIds = dependencyIds || [];
        this.resourceReference = resourceReference;
        this.stageId = stageId;
        this.executionOrder = executionOrder || 0;
        Object.freeze(this);
    }
}

export class RenderExecutionPlan {
    constructor(version, pipelineVersion, rendererVersion, metadata, stages, commands, graph) {
        this.version = version;
        this.pipelineVersion = pipelineVersion;
        this.rendererVersion = rendererVersion;
        this.metadata = metadata;
        this.stages = stages || [];
        this.commands = commands || [];
        this.graph = graph || {};
        Object.freeze(this);
    }
}
