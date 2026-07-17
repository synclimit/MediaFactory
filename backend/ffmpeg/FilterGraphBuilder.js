class FilterGraphBuilder {
    constructor() {
        this.nodes = [];
    }

    addNode(filterNode) {
        // Example filterNode: { inputs: ['[0:v]'], filter: 'scale=1920:1080', outputs: ['[v1]'] }
        this.nodes.push(filterNode);
    }

    build() {
        if (this.nodes.length === 0) return '';
        
        // Assembles the -filter_complex string
        // The ONLY class allowed to generate this graph logic.
        const graphString = this.nodes.map(node => {
            const inputs = node.inputs ? node.inputs.join('') : '';
            const outputs = node.outputs ? node.outputs.join('') : '';
            return `${inputs}${node.filter}${outputs}`;
        }).join(';');

        return graphString;
    }

    clear() {
        this.nodes = [];
    }
}

module.exports = FilterGraphBuilder;
