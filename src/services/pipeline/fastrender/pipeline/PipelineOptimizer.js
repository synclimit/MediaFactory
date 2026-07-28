import { OperationType } from '../contracts/PipelineContracts.js';

export class PipelineOptimizer {
    optimize(graph, stages, metadata, logFn) {
        logFn('Optimization Started');
        const nodes = graph.getNodes();
        
        // Scenario 4: Merge Duplicate Node
        // Dummy logic: if two nodes have same operation and resourceReference, merge them
        const seen = new Map();
        for (let node of nodes) {
            if (node.status === 'SKIPPED') continue;
            
            const key = node.operation + '_' + node.resourceReference;
            if (seen.has(key)) {
                node.status = 'SKIPPED';
                node.annotation = 'Merged with ' + seen.get(key).nodeId;
                metadata.estimatedFilterCount = Math.max(0, metadata.estimatedFilterCount - 1);
            } else {
                seen.set(key, node);
                if (node.operation === OperationType.VIDEO_FILTER || node.operation === OperationType.AUDIO_FILTER) {
                    metadata.estimatedFilterCount++;
                }
            }
        }
        
        // Scenario 5: Detect cache reuse candidate
        for (let node of nodes) {
            if (node.status === 'SKIPPED') continue;
            if (node.annotation.includes('CACHE_CANDIDATE')) {
                node.operation = OperationType.CACHE_REUSE;
                node.annotation = 'Optimized to Cache Reuse';
                metadata.estimatedCacheHit++;
            }
        }
        
        // Scenario 8: Collapse empty stage
        const activeStages = stages.filter(stage => {
            const hasActiveNodes = stage.nodes.some(nodeId => {
                const node = graph.nodes.get(nodeId);
                return node && node.status !== 'SKIPPED';
            });
            return hasActiveNodes; // Keep if it has active nodes
        });
        
        logFn('Optimization Finished');
        return { optimizedGraph: graph, optimizedStages: activeStages, optimizedMetadata: metadata };
    }
}
