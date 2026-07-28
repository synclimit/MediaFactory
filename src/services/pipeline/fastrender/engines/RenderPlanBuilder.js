import { IRenderPlanBuilder } from '../interfaces/IEngines.js';
import { RenderPlan } from '../contracts/Descriptors.js';
import { ExecutionGraph, ExecutionNode } from '../core/ExecutionGraph.js';

export class RenderPlanBuilder extends IRenderPlanBuilder {
    buildContract(projectId, strategyContext, segments, duration, options = {}) {
        const stages = strategyContext.strategyDetails?.stages || ['Prepare', 'Process', 'Export'];
        
        // Construct ExecutionGraph
        const executionGraph = new ExecutionGraph();
        let previousNodeId = null;

        stages.forEach((stageName, idx) => {
            const nodeId = `node_${idx + 1}_${stageName.toLowerCase()}`;
            const node = new ExecutionNode(nodeId, stageName, stageName, null, {
                strategy: strategyContext.globalStrategy,
                stageIndex: idx
            });

            if (previousNodeId) {
                node.addDependency(previousNodeId);
            }
            executionGraph.addNode(node);
            previousNodeId = nodeId;
        });

        return new RenderPlan('2.0.0', projectId, strategyContext.globalStrategy, duration, segments, {
            executionGraph,
            decisionLog: options.decisionLog || [],
            runtimeCost: options.runtimeCost || 0,
            hardwareInfo: options.hardwareInfo || null,
            explanation: strategyContext.strategyDetails?.explanation || ''
        });
    }
}
