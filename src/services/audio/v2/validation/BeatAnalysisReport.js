export class BeatAnalysisReport {
    constructor(data = {}) {
        this.audio = Object.freeze({ ...data.audio });
        this.algorithm = Object.freeze({ ...data.algorithm });
        this.parameters = Object.freeze({ ...data.parameters });
        this.metrics = Object.freeze({ ...data.metrics });
        this.diagnostics = Object.freeze([ ...(data.diagnostics || []) ]);
        this.summary = Object.freeze({ ...data.summary });

        Object.freeze(this);
    }
}
