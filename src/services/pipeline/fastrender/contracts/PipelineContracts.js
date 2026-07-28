export const OperationType = Object.freeze({
    STREAM_COPY: 'STREAM_COPY',
    CONCAT: 'CONCAT',
    VIDEO_FILTER: 'VIDEO_FILTER',
    AUDIO_FILTER: 'AUDIO_FILTER',
    OVERLAY: 'OVERLAY',
    SUBTITLE: 'SUBTITLE',
    PLAYLIST: 'PLAYLIST',
    LYRICS: 'LYRICS',
    PARTICLE: 'PARTICLE',
    VISUALIZER: 'VISUALIZER',
    COLOR: 'COLOR',
    CACHE_REUSE: 'CACHE_REUSE',
    ENCODE: 'ENCODE'
});

export const PipelineState = Object.freeze({
    INITIALIZED: 'INITIALIZED',
    READING_SCHEDULE: 'READING_SCHEDULE',
    BUILDING_GRAPH: 'BUILDING_GRAPH',
    BUILDING_STAGE: 'BUILDING_STAGE',
    OPTIMIZING: 'OPTIMIZING',
    VALIDATING: 'VALIDATING',
    READY: 'READY',
    FAILED: 'FAILED'
});

export class PipelineMetadata {
    constructor() {
        this.estimatedComplexity = 0;
        this.estimatedDecodeCount = 0;
        this.estimatedEncodeCount = 0;
        this.estimatedCacheHit = 0;
        this.estimatedMemoryUsage = 0;
        this.estimatedGpuUsage = 0;
        this.estimatedDiskIo = 0;
        this.estimatedStreamCopy = 0;
        this.estimatedFilterCount = 0;
    }
}

export class PipelineNode {
    constructor(nodeId, operation, stageId, dependencyIds, resourceReference, status, annotation) {
        this.nodeId = nodeId;
        this.operation = operation;
        this.stageId = stageId;
        this.dependencyIds = dependencyIds || [];
        this.resourceReference = resourceReference;
        this.status = status || 'ACTIVE'; // ACTIVE, SKIPPED, MERGED
        this.annotation = annotation || '';
    }
}

export class PipelineEdge {
    constructor(sourceNode, targetNode, edgeType = 'DEPENDS_ON') {
        this.sourceNode = sourceNode;
        this.targetNode = targetNode;
        this.edgeType = edgeType;
    }
}

export class PipelinePlan {
    constructor(version, plannerVersion, schedulerVersion, pipelineVersion, metadata, stages, graph, nodes, edges) {
        this.version = version;
        this.plannerVersion = plannerVersion;
        this.schedulerVersion = schedulerVersion;
        this.pipelineVersion = pipelineVersion;
        this.metadata = metadata;
        this.stages = stages || [];
        this.graph = graph || {};
        this.nodes = nodes || [];
        this.edges = edges || [];
        Object.freeze(this);
    }
}
