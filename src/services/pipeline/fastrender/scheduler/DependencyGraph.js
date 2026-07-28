export class DependencyGraph {
    constructor() {
        this.nodes = new Map(); // taskId -> { deps: [], order: 0 }
    }
    
    addNode(taskId, dependencies = []) {
        this.nodes.set(taskId, { deps: dependencies, order: 0 });
    }
    
    detectCircularDependency() {
        const visited = new Set();
        const recursionStack = new Set();

        const isCyclic = (nodeId) => {
            if (!visited.has(nodeId)) {
                visited.add(nodeId);
                recursionStack.add(nodeId);
                
                const node = this.nodes.get(nodeId);
                if (node && node.deps) {
                    for (let depId of node.deps) {
                        if (!visited.has(depId) && isCyclic(depId)) return true;
                        else if (recursionStack.has(depId)) return true;
                    }
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };

        for (let [taskId] of this.nodes) {
            if (isCyclic(taskId)) return true;
        }
        return false;
    }
    
    calculateExecutionOrder() {
        if (this.detectCircularDependency()) {
            throw new Error('Circular dependency detected in tasks');
        }
        
        let changed = true;
        while(changed) {
            changed = false;
            for(let [taskId, node] of this.nodes) {
                let maxDepOrder = 0;
                for(let depId of node.deps) {
                    const depNode = this.nodes.get(depId);
                    if(!depNode) throw new Error(`Missing dependency task: ${depId}`);
                    if (depNode.order >= maxDepOrder) maxDepOrder = depNode.order + 1;
                }
                if (maxDepOrder > node.order) {
                    node.order = maxDepOrder;
                    changed = true;
                }
            }
        }
        return this.nodes;
    }
}
