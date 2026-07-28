export class RenderStage {
    constructor(stageId, name, order) {
        this.stageId = stageId;
        this.name = name;
        this.order = order;
        this.commands = [];
    }
    
    addCommand(commandId) {
        this.commands.push(commandId);
    }
}
