import { BaseStrategy } from './BaseStrategy.js';
import { PreferredStrategy, RenderType, RealtimeMode } from '../contracts/Enums.js';

export class TimelineStrategy extends BaseStrategy {
    constructor() {
        super(PreferredStrategy.TIMELINE, 600);
    }

    isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext) {
        if (!descriptors || descriptors.length === 0) return false;
        return descriptors.every(d => 
            d.capability.renderType === RenderType.TIMELINE || 
            d.capability.renderType === RenderType.COMPOSE
        ) && descriptors.every(d => d.capability.realtimeMode !== RealtimeMode.REQUIRED);
    }

    buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext) {
        return {
            type: this.name,
            explanation: 'Project features are standard timeline overlays. Executing timeline multiplexing.',
            stages: ['PrepareTimeline', 'BuildOverlayFilter', 'Export']
        };
    }
}
