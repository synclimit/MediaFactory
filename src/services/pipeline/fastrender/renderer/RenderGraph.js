export class RenderGraph {
    constructor() {
        this.commands = new Map();
        this.edges = [];
    }
    
    addCommand(cmd) {
        if (this.commands.has(cmd.commandId)) {
            throw new Error('Duplicate Command: ' + cmd.commandId);
        }
        this.commands.set(cmd.commandId, cmd);
    }
    
    addEdge(sourceId, targetId) {
        this.edges.push({ sourceId, targetId });
    }
    
    getCommands() {
        return Array.from(this.commands.values());
    }
    
    getEdges() {
        return this.edges;
    }
}
