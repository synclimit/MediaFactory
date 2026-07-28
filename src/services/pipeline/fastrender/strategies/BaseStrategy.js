export class BaseStrategy {
    constructor(name, priority) {
        this.name = name;
        this.priority = priority;
    }

    isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext) {
        throw new Error("isApplicable() must be implemented by strategy.");
    }

    buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext) {
        throw new Error("buildExecutionPlan() must be implemented by strategy.");
    }
}
