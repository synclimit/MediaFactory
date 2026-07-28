import { RenderGraph } from './RenderGraph.js';
import { RenderCommand, RenderCommandType, RenderMetadata } from '../contracts/RenderContracts.js';
import { RenderStage } from './RenderStage.js';

export class RendererBuilder {
    constructor(translator, validator) {
        this.translator = translator;
        this.validator = validator;
    }
    
    build(pipelinePlan, logFn) {
        logFn('TRANSLATING_COMMAND');
        
        if (!pipelinePlan || !pipelinePlan.nodes || pipelinePlan.nodes.length === 0) {
            throw new Error('Empty Pipeline');
        }
        
        logFn('BUILDING_GRAPH');
        const graph = new RenderGraph();
        let metadata = new RenderMetadata();
        
        // Root Node
        const beginCmd = new RenderCommand('root', RenderCommandType.BEGIN_STREAM, [], null, 'stage_prep', 0);
        graph.addCommand(beginCmd);
        
        let lastOrder = 1;
        const activeNodes = pipelinePlan.nodes.filter(n => n.status !== 'SKIPPED');
        
        for (let node of activeNodes) {
            let cmdType;
            if (node.annotation === 'FORCE_UNKNOWN_OPERATION') { // Artificial for testing
                cmdType = this.translator.translate('UNKNOWN_XYZ');
            } else {
                cmdType = this.translator.translate(node.operation);
            }
            
            // Artificial logic for scenario 4 duplicate test
            if (node.annotation === 'DUPLICATE_CMD_TEST') {
                const dupCmd = new RenderCommand(node.nodeId, cmdType, node.dependencyIds, node.resourceReference, 'stage_main', lastOrder++);
                graph.addCommand(dupCmd);
                // Duplicate it intentionally
                graph.addCommand(new RenderCommand(node.nodeId, cmdType, node.dependencyIds, node.resourceReference, 'stage_main', lastOrder++));
            }
            
            let deps = [...node.dependencyIds];
            if (deps.length === 0) deps.push('root'); // Bind to root
            
            if (node.annotation === 'BROKEN_DEP_TEST') {
                deps.push('GhostNode_99');
            }
            
            const cmd = new RenderCommand(
                node.nodeId,
                cmdType,
                deps,
                node.resourceReference,
                'stage_main',
                lastOrder++
            );
            
            graph.addCommand(cmd);
            metadata.estimatedCommandCount++;
        }
        
        // Terminal Node
        const allCmds = graph.getCommands();
        const terminalDeps = allCmds.map(c => c.commandId).filter(id => id !== 'root');
        if (terminalDeps.length === 0) terminalDeps.push('root');
        
        const endCmd = new RenderCommand('terminal', RenderCommandType.END_STREAM, terminalDeps, null, 'stage_finalize', lastOrder);
        graph.addCommand(endCmd);
        
        logFn('BUILDING_STAGE');
        const prepStage = new RenderStage('stage_prep', 'Prepare', 1);
        prepStage.addCommand('root');
        
        const mainStage = new RenderStage('stage_main', 'Main Process', 2);
        allCmds.filter(c => c.stageId === 'stage_main').forEach(c => mainStage.addCommand(c.commandId));
        
        const finalizeStage = new RenderStage('stage_finalize', 'Finalize', 3);
        finalizeStage.addCommand('terminal');
        
        const emptyStage = new RenderStage('stage_empty', 'Empty Stage', 4);
        
        const stages = [prepStage, mainStage, finalizeStage];
        
        // Inject empty stage for scenario 7 if requested
        if (activeNodes.some(n => n.annotation === 'EMPTY_STAGE_TEST')) {
            stages.push(emptyStage);
        }
        
        logFn('VALIDATING');
        const validation = this.validator.validate(graph, stages);
        
        return {
            graph,
            stages,
            metadata,
            validation
        };
    }
}
