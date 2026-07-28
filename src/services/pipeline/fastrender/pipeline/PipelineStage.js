export class PipelineStage {
    constructor(stageId, name, order) {
        this.stageId = stageId;
        this.name = name;
        this.order = order;
        this.nodes = [];
    }
    
    addNode(nodeId) {
        this.nodes.push(nodeId);
    }
}
