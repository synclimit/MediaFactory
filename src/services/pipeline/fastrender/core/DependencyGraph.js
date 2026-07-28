import { CircularDependencyException } from '../exceptions/CircularDependencyException.js';

export class DependencyGraph {
    constructor() {
        this.nodes = new Map(); // id -> FeatureDescriptor
        this.adjList = new Map(); // id -> Set of dependency ids
    }

    addFeature(descriptor) {
        if (!descriptor || !descriptor.id) return;
        this.nodes.set(descriptor.id, descriptor);
        if (!this.adjList.has(descriptor.id)) {
            this.adjList.set(descriptor.id, new Set());
        }
        for (const depId of descriptor.dependencies) {
            this.adjList.get(descriptor.id).add(depId);
        }
    }

    detectCycle() {
        const visited = new Set();
        const recursionStack = new Set();
        const path = [];

        const dfs = (nodeId) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const neighbors = this.adjList.get(nodeId) || new Set();
            for (const neighborId of neighbors) {
                if (!visited.has(neighborId)) {
                    if (dfs(neighborId)) return true;
                } else if (recursionStack.has(neighborId)) {
                    path.push(neighborId);
                    const cycleStartIdx = path.indexOf(neighborId);
                    const cyclePath = path.slice(cycleStartIdx);
                    throw new CircularDependencyException(cyclePath);
                }
            }

            path.pop();
            recursionStack.delete(nodeId);
            return false;
        };

        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                dfs(nodeId);
            }
        }
        return false;
    }

    topologicalSort() {
        this.detectCycle(); // Fails fast if cycle exists

        const visited = new Set();
        const result = [];

        const visit = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const neighbors = this.adjList.get(nodeId) || new Set();
            for (const neighborId of neighbors) {
                if (this.nodes.has(neighborId)) {
                    visit(neighborId);
                }
            }
            result.push(this.nodes.get(nodeId));
        };

        for (const nodeId of this.nodes.keys()) {
            visit(nodeId);
        }

        return result; // Dependencies come first
    }
}
