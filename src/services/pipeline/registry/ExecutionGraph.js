import { ExecutionPlan } from './ExecutionPlan';
import { ExecutionStep } from './ExecutionStep';

/**
 * ExecutionGraph
 * Resolves dependencies using Topological Sort to produce an immutable ExecutionPlan.
 * Caches the plan based on the registryVersion.
 */
export class ExecutionGraph {
    constructor(registry) {
        this.registry = registry;
        this._cachedPlan = null;
    }

    /**
     * Generates or retrieves the cached ExecutionPlan.
     * @returns {ExecutionPlan}
     */
    getPlan() {
        if (this._cachedPlan && this._cachedPlan.registryVersion === this.registry.registryVersion) {
            return this._cachedPlan;
        }

        const nodes = this.registry.getAllNodes().filter(n => n.enabled);
        const sortedNodes = this._topologicalSort(nodes);
        
        const steps = sortedNodes.map(node => new ExecutionStep({
            id: node.id,
            adapter: node.adapter
        }));

        this._cachedPlan = new ExecutionPlan(steps, this.registry.registryVersion);
        return this._cachedPlan;
    }

    _topologicalSort(nodes) {
        const inDegree = new Map();
        const adjList = new Map();
        const nodeMap = new Map();

        // Initialize structures
        nodes.forEach(node => {
            inDegree.set(node.id, 0);
            adjList.set(node.id, []);
            nodeMap.set(node.id, node);
        });

        // Build graph
        nodes.forEach(node => {
            node.dependencies.forEach(depId => {
                if (adjList.has(depId)) {
                    adjList.get(depId).push(node.id);
                    inDegree.set(node.id, inDegree.get(node.id) + 1);
                }
            });
        });

        // Queue for zero in-degree nodes (sorted by priority for tie-breaking)
        const zeroInDegree = [];
        for (const [id, degree] of inDegree.entries()) {
            if (degree === 0) zeroInDegree.push(nodeMap.get(id));
        }
        
        // Sort initial queue by priority descending
        zeroInDegree.sort((a, b) => b.priority - a.priority);

        const sorted = [];

        while (zeroInDegree.length > 0) {
            const current = zeroInDegree.shift();
            sorted.push(current);

            const neighbors = adjList.get(current.id) || [];
            
            // Collect new zero in-degree neighbors to sort them by priority
            const newZeroes = [];
            for (const neighborId of neighbors) {
                inDegree.set(neighborId, inDegree.get(neighborId) - 1);
                if (inDegree.get(neighborId) === 0) {
                    newZeroes.push(nodeMap.get(neighborId));
                }
            }

            // Sort new zeroes by priority and add to the front of queue or maintain priority queue
            newZeroes.sort((a, b) => b.priority - a.priority);
            zeroInDegree.push(...newZeroes);
            zeroInDegree.sort((a, b) => b.priority - a.priority);
        }

        if (sorted.length !== nodes.length) {
            throw new Error("ExecutionGraph detected a circular dependency in the Engine adapters.");
        }

        return sorted;
    }
}
