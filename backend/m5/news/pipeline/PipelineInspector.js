class PipelineInspector {
    constructor() {
        this.data = {
            reader: null,
            ai: null,
            visual: null,
            card: null,
            editor: null
        };
    }
    
    update(stage, data) {
        this.data[stage] = data;
    }
    
    getRawData() {
        return this.data;
    }
}
module.exports = PipelineInspector;