import { BaseStrategy } from './BaseStrategy.js';
import { PreferredStrategy, RealtimeMode } from '../contracts/Enums.js';

export class ConcatStrategy extends BaseStrategy {
    constructor() {
        super(PreferredStrategy.CONCAT, 800);
    }

    isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext) {
        if (!descriptors || descriptors.length === 0) return false;
        // Applicable if no feature requires realtime/full encode and all support composition/concat
        return descriptors.every(d => 
            d.capability.realtimeMode !== RealtimeMode.REQUIRED &&
            !d.capability.requiresFullEncode &&
            !d.capability.requiresBeatEngine
        );
    }

    buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext) {
        return {
            type: this.name,
            explanation: 'All features support direct stream concatenation and fast composition.',
            stages: ['PrepareChunks', 'ConcatStreams', 'Export']
        };
    }
}
