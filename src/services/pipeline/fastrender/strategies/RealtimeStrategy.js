import { BaseStrategy } from './BaseStrategy.js';
import { PreferredStrategy, RealtimeMode } from '../contracts/Enums.js';

export class RealtimeStrategy extends BaseStrategy {
    constructor() {
        super(PreferredStrategy.FULL_ENCODE, 100); // Fallback for realtime features
    }

    isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext) {
        if (!descriptors || descriptors.length === 0) return false;
        return descriptors.some(d => 
            d.capability.realtimeMode === RealtimeMode.REQUIRED || 
            d.capability.requiresBeatEngine || 
            d.capability.requiresFullEncode
        );
    }

    buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext) {
        return {
            type: this.name,
            explanation: 'Realtime beat-reactive continuous audio sampling required. Executing Full Encode pipeline.',
            stages: ['AudioAnalysis', 'FrameByFrameRender', 'FullEncode', 'Export']
        };
    }
}
