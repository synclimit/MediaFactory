import { CacheStrategy } from '../strategies/CacheStrategy.js';
import { ConcatStrategy } from '../strategies/ConcatStrategy.js';
import { TimelineStrategy } from '../strategies/TimelineStrategy.js';
import { HardwareEncodeStrategy } from '../strategies/HardwareEncodeStrategy.js';
import { RealtimeStrategy } from '../strategies/RealtimeStrategy.js';

export class StrategyProvider {
    constructor() {
        this.strategies = [];
        this.registerDefaultStrategies();
    }

    register(strategy) {
        this.strategies.push(strategy);
        // Sort by priority descending (highest priority evaluated first)
        this.strategies.sort((a, b) => b.priority - a.priority);
    }

    registerDefaultStrategies() {
        this.register(new CacheStrategy());
        this.register(new ConcatStrategy());
        this.register(new TimelineStrategy());
        this.register(new HardwareEncodeStrategy());
        this.register(new RealtimeStrategy());
    }

    resolveStrategy(descriptors, runtimeContext, hardwareProfile, projectContext) {
        for (const strategy of this.strategies) {
            if (strategy.isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext)) {
                return strategy.buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext);
            }
        }
        // Fallback default
        return {
            type: 'FULL_ENCODE',
            explanation: 'Default fallback strategy for unmatched features.',
            stages: ['Prepare', 'FullEncode', 'Export']
        };
    }
}
