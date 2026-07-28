import { PipelineEdge } from '../contracts/PipelineContracts.js';

export class PipelineGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }
    
    addNode(node) {
        if (this.nodes.has(node.nodeId)) return false; // Duplicate
        this.nodes.set(node.nodeId, node);
        return true;
    }
    
    addEdge(sourceId, targetId, edgeType = 'DEPENDS_ON') {
        this.edges.push(new PipelineEdge(sourceId, targetId, edgeType));
        return true;
    }
    
    getNodes() {
        return Array.from(this.nodes.values());
    }
    
    getEdges() {
        return this.edges;
    }
}
