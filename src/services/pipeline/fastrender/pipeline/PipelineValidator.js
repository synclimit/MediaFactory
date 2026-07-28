export class PipelineValidator {
    validate(graph, stages) {
        const errors = [];
        const nodes = graph.getNodes();
        
        if (nodes.length === 0) {
            errors.push('Empty Graph');
            return { isValid: false, errors };
        }
        
        // Detect Circular Graph
        if (this.detectCircularGraph(graph)) {
            errors.push('Circular Graph Detected');
        }
        
        // Check Broken Dependencies
        const nodeIds = new Set(nodes.map(n => n.nodeId));
        for (let edge of graph.getEdges()) {
            if (!nodeIds.has(edge.sourceNode) || !nodeIds.has(edge.targetNode)) {
                errors.push('Invalid Dependency or Orphan Edge: ' + edge.sourceNode + ' -> ' + edge.targetNode);
            }
        }
        
        return { isValid: errors.length === 0, errors };
    }
    
    detectCircularGraph(graph) {
        const adj = new Map();
        for (let node of graph.getNodes()) adj.set(node.nodeId, []);
        for (let edge of graph.getEdges()) {
            if (adj.has(edge.sourceNode)) adj.get(edge.sourceNode).push(edge.targetNode);
        }
        
        const visited = new Set();
        const recursionStack = new Set();
        
        const isCyclic = (nodeId) => {
            if (!visited.has(nodeId)) {
                visited.add(nodeId);
                recursionStack.add(nodeId);
                
                const neighbors = adj.get(nodeId) || [];
                for (let neighbor of neighbors) {
                    if (!visited.has(neighbor) && isCyclic(neighbor)) return true;
                    else if (recursionStack.has(neighbor)) return true;
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };
        
        for (let node of graph.getNodes()) {
            if (isCyclic(node.nodeId)) return true;
        }
        return false;
    }
}
