export class PlannerException extends Error {
    constructor(message) { super(message); this.name = 'PlannerException'; }
}
export class ValidationException extends PlannerException {
    constructor(message) { super(message); this.name = 'ValidationException'; }
}
export class StrategyException extends PlannerException {
    constructor(message) { super(message); this.name = 'StrategyException'; }
}
export class KnowledgeBaseException extends PlannerException {
    constructor(message) { super(message); this.name = 'KnowledgeBaseException'; }
}
export class SegmentException extends PlannerException {
    constructor(message) { super(message); this.name = 'SegmentException'; }
}
export class CompatibilityException extends PlannerException {
    constructor(message) { super(message); this.name = 'CompatibilityException'; }
}
