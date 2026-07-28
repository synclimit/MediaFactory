export class CommandQueue {
    constructor() {
        this.queue = [];
    }
    
    build(renderExecutionPlan) {
        if (!renderExecutionPlan || !renderExecutionPlan.commands || renderExecutionPlan.commands.length === 0) {
            throw new Error('CommandQueue kosong.');
        }
        // Simplified sort by execution order
        this.queue = [...renderExecutionPlan.commands].sort((a,b) => a.executionOrder - b.executionOrder);
    }
    
    hasNext() {
        return this.queue.length > 0;
    }
    
    next() {
        return this.queue.shift();
    }
    
    getAll() {
        return this.queue;
    }
}
