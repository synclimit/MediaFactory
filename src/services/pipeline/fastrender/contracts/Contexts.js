export class ProjectContext {
    constructor(data) { this.data = data; }
}
export class TimelineContext {
    constructor(durationMs, cues) { this.durationMs = durationMs; this.cues = cues || []; }
}
export class HardwareContext {
    constructor(ram, gpu) { this.ram = ram; this.gpu = gpu; }
}
export class AnalysisContext {
    constructor(project, timeline, hardware, moduleFacts) {
        this.project = project;
        this.timeline = timeline;
        this.hardware = hardware;
        this.moduleFacts = moduleFacts || [];
    }
}
export class StrategyContext {
    constructor(globalStrategy, tactics) {
        this.globalStrategy = globalStrategy;
        this.tactics = tactics || {};
    }
}
