export class ExecutionSchedule {
    constructor(version, plannerVersion, segments, executionTasks, estimatedDuration, requiredResources, cacheCandidates) {
        this.version = version;
        this.plannerVersion = plannerVersion;
        this.segments = segments || [];
        this.executionTasks = executionTasks || [];
        this.estimatedDuration = estimatedDuration || 0;
        this.requiredResources = requiredResources || [];
        this.cacheCandidates = cacheCandidates || [];
    }
}

export class ExecutionTask {
    constructor(taskId, segmentId, layerId, startTime, endTime, operation, resourceReference, dependencyIds = [], executionOrder = 0) {
        this.taskId = taskId;
        this.segmentId = segmentId;
        this.layerId = layerId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.operation = operation;
        this.resourceReference = resourceReference;
        this.dependencyIds = dependencyIds;
        this.executionOrder = executionOrder;
        Object.freeze(this);
    }
}

export class ExecutionContext {
    constructor(renderPlan) {
        this.renderPlan = renderPlan;
        this.expandedTimeline = [];
        this.expandedLayers = [];
        this.tasks = [];
        this.dependencies = [];
    }
}
