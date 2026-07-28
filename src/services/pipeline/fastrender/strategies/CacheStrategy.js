import { BaseStrategy } from './BaseStrategy.js';
import { PreferredStrategy } from '../contracts/Enums.js';

export class CacheStrategy extends BaseStrategy {
    constructor() {
        super(PreferredStrategy.CACHE_FIRST, 1000);
    }

    isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext) {
        if (!descriptors || descriptors.length === 0) return false;
        return descriptors.every(d => runtimeContext.isCached(d.id));
    }

    buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext) {
        return {
            type: this.name,
            explanation: 'All features hit valid pre-rendered cache assets. Bypassing encoding phase.',
            stages: ['FetchCache', 'AssembleOutput']
        };
    }
}
