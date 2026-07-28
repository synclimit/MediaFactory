import { IStrategyResolver } from '../interfaces/IEngines.js';
import { StrategyContext } from '../contracts/Contexts.js';
import { StrategyProvider } from './StrategyProvider.js';

export class StrategyResolver extends IStrategyResolver {
    constructor(strategyProvider = null) {
        super();
        this.strategyProvider = strategyProvider || new StrategyProvider();
    }

    resolve(capabilityProfile, runtimeContext, hardwareProfile, projectContext) {
        const descriptors = capabilityProfile.descriptors || [];
        const plan = this.strategyProvider.resolveStrategy(descriptors, runtimeContext, hardwareProfile, projectContext);
        
        return new StrategyContext(plan.type, {
            explanation: plan.explanation,
            stages: plan.stages || []
        });
    }
}
