export class CapabilityProfile {
    constructor(capabilities = {}, descriptors = [], dependencyOrder = []) { 
        this.capabilities = capabilities;
        this.descriptors = descriptors;
        this.dependencyOrder = dependencyOrder;
    }
}

export class StrategyDescriptor {
    constructor(type, description) { 
        this.type = type; 
        this.description = description; 
    }
}

export class SegmentDescriptor {
    constructor(startMs, endMs, strategy, layers = []) {
        this.startMs = startMs;
        this.endMs = endMs;
        this.strategy = strategy;
        this.layers = layers;
    }
}

export class RenderPlan {
    constructor(version, projectId, globalStrategy, totalDurationMs, segments = [], options = {}) {
        this.version = version || '2.0.0';
        this.projectId = projectId;
        this.globalStrategy = globalStrategy;
        this.totalDurationMs = totalDurationMs;
        this.segments = segments;
        this.executionGraph = options.executionGraph || null;
        this.decisionLog = options.decisionLog || [];
        this.runtimeCost = options.runtimeCost || 0;
        this.hardwareInfo = options.hardwareInfo || null;
        this.explanation = options.explanation || '';
    }
}

export class ValidationResult {
    constructor(isValid, status, warnings = [], errors = []) {
        this.isValid = isValid;
        this.status = status;
        this.warnings = warnings;
        this.errors = errors;
    }
}
