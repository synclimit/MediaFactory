import { IPlannerRule } from '../../interfaces/IPlannerRule.js';
export class HardwareRule extends IPlannerRule {
    getIdentifier() { return 'RULE_HARDWARE_RAM_LIMIT'; }
    getPriority() { return 1000; }
    evaluate(profile) {
        if (profile.capabilities.ram && profile.capabilities.ram < 4096) {
            return { matched: true, shortCircuit: true, strategy: 'NORMAL_ONLY', explanation: 'RAM below 4GB limits baking safety.' };
        }
        return { matched: false };
    }
}
