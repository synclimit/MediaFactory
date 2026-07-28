import { IPlannerRule } from '../../interfaces/IPlannerRule.js';
export class TimelineRule extends IPlannerRule {
    getIdentifier() { return 'RULE_CONTINUOUS_REQUIREMENT'; }
    getPriority() { return 800; }
    evaluate(profile) {
        if (profile.capabilities.requiresContinuousTimeline) {
            return { matched: true, shortCircuit: true, strategy: 'NORMAL_ONLY', explanation: 'Visualizer requires continuous real-time sampling.' };
        }
        return { matched: false };
    }
}
