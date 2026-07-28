export class ExecutionNode {
    constructor(id, name, stage, handler = null, metadata = {}) {
        this.id = id;
        this.name = name;
        this.stage = stage;
        this.handler = handler;
        this.metadata = metadata;
        this.dependencies = [];
    }

    addDependency(nodeId) {
        if (!this.dependencies.includes(nodeId)) {
            this.dependencies.push(nodeId);
        }
    }
}

export class ExecutionGraph {
    constructor() {
        this.nodes = new Map();
    }

    addNode(node) {
        if (!(node instanceof ExecutionNode)) {
            node = new ExecutionNode(node.id, node.name, node.stage, node.handler, node.metadata);
        }
        this.nodes.set(node.id, node);
        return node;
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    toJSON() {
        const nodesArr = [];
        for (const node of this.nodes.values()) {
            nodesArr.push({
                id: node.id,
                name: node.name,
                stage: node.stage,
                dependencies: node.dependencies,
                metadata: node.metadata
            });
        }
        return {
            graphVersion: '2.0.0',
            nodeCount: nodesArr.length,
            nodes: nodesArr
        };
    }

    toDOT() {
        let dot = 'digraph ExecutionGraph {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=box, style=filled, fillcolor=lightskyblue, fontname="Helvetica"];\n';
        for (const node of this.nodes.values()) {
            dot += `  "${node.id}" [label="${node.name}\\n(${node.stage})"];\n`;
            for (const depId of node.dependencies) {
                dot += `  "${depId}" -> "${node.id}";\n`;
            }
        }
        dot += '}\n';
        return dot;
    }
}
