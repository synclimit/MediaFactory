export class AnalyzerRegistry {
    constructor() { this.analyzers = []; }
    register(analyzer) { throw new Error('NotImplemented'); }
    getAnalyzers() { throw new Error('NotImplemented'); }
}
