const EngineResult = require('../core/EngineResult');
const Logger = require('../core/Logger');
const { PipelineError, ErrorCodes } = require('../core/Errors');
const TranslatorRegistry = require('./registry/TranslatorRegistry');
const FilterGraphBuilder = require('./builders/FilterGraphBuilder');
const CommandBuilder = require('./builders/CommandBuilder');
const Engine = require('../core/Engine');

class FFmpegBuilder extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} renderGraph 
     */
    buildCommand(context, renderGraph) {
        return this.run(context, 'FFmpegBuilder', () => {
            // 1 & 2. Filter Graph Construction Phase
            const filterGraph = FilterGraphBuilder.build(renderGraph);

            // 3. Command Assembly Phase
            const cmdRes = CommandBuilder.build(
                renderGraph,
                filterGraph,
                renderGraph.metadata.optimizationPlan.preferredEncoder
            );

            return {
                command: cmdRes.command,
                args: cmdRes.args,
                cmdDetails: cmdRes,
                filterGraph
            };
        });
    }
}

module.exports = FFmpegBuilder;
