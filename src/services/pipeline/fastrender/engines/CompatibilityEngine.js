import { ICompatibilityEngine } from '../interfaces/IEngines.js';
import { CapabilityProfile } from '../contracts/Descriptors.js';
import { DependencyGraph } from '../core/DependencyGraph.js';

export class CompatibilityEngine extends ICompatibilityEngine {
    evaluate(analysisContext) {
        const featureDescriptors = analysisContext.moduleFacts || [];
        
        // Build dependency graph and detect cycles
        const graph = new DependencyGraph();
        for (const desc of featureDescriptors) {
            graph.addFeature(desc);
        }

        // Fails fast if circular dependency exists
        const sortedDescriptors = graph.topologicalSort();

        const aggregatedCapabilities = {
            ram: analysisContext.hardware?.ram || 8192,
            hasHwEncoder: Boolean(analysisContext.hardware?.hasHwEncoder),
            requiresRealtime: sortedDescriptors.some(d => d.capability.realtimeMode === 'REQUIRED' || d.capability.requiresBeatEngine),
            requiresFullEncode: sortedDescriptors.some(d => d.capability.requiresFullEncode),
            canPrerender: sortedDescriptors.every(d => d.capability.canPrerender || d.capability.renderType === 'TIMELINE'),
            supportsBaking: true
        };

        return new CapabilityProfile(aggregatedCapabilities, sortedDescriptors, sortedDescriptors.map(d => d.id));
    }
}
