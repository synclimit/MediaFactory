export class CircularDependencyException extends Error {
    constructor(cyclePath) {
        const cycleStr = Array.isArray(cyclePath) ? cyclePath.join(' -> ') : String(cyclePath);
        super(`Circular dependency detected in feature graph: [${cycleStr}]`);
        this.name = 'CircularDependencyException';
        this.cyclePath = cyclePath;
    }
}
