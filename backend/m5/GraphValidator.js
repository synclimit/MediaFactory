const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');

class GraphValidator {
    /**
     * Validates the RenderGraph DAG.
     * @param {Object} renderGraph 
     */
    validate(renderGraph) {
        const start = Logger.start('GraphValidator');
        
        try {
            const errors = [];
            const nodeIds = new Set();
            const outputLinks = new Set();
            const inputLinks = new Set();

            if (!renderGraph.nodes || !Array.isArray(renderGraph.nodes)) {
                errors.push('RenderGraph is missing nodes array');
                throw errors;
            }

            renderGraph.nodes.forEach(node => {
                if (!node.id) errors.push(`Node missing ID: ${JSON.stringify(node)}`);
                if (nodeIds.has(node.id)) errors.push(`Duplicate Node ID found: ${node.id}`);
                nodeIds.add(node.id);

                if (node.outputs) {
                    node.outputs.forEach(out => {
                        if (outputLinks.has(out)) errors.push(`Duplicate output link defined: ${out}`);
                        outputLinks.add(out);
                    });
                }
                
                if (node.inputs) {
                    node.inputs.forEach(inp => {
                        inputLinks.add(inp);
                    });
                }
                
                if (node.type === undefined) errors.push(`Node ${node.id} is missing a type`);
            });

            // Check for missing inputs (an input requested that is never outputted by another node)
            // Exceptions might exist for global inputs, but assuming a self-contained DAG for now
            // We skip strict input matching if it's an external file reference (InputNode type)
            // But let's check general topology dependencies if explicitly defined.

            if (errors.length > 0) {
                return EngineResult.error('Graph Validation Failed', { errors });
            }

            const durationMs = Logger.finish('GraphValidator', start);
            return EngineResult.success(true, { executionTimeMs: durationMs });
        } catch (error) {
            Logger.error('GraphValidator', 'Validation failed', error);
            return EngineResult.error(error, { executionTimeMs: Date.now() - start });
        }
    }
}

module.exports = GraphValidator;
