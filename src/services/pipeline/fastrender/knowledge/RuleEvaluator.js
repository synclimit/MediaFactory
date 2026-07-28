import { StrategyDescriptor } from '../contracts/Descriptors.js';
export class RuleEvaluator {
    evaluateRules(rules, capabilityProfile, traceLog = []) {
        for(let rule of rules) {
            traceLog.push(`[EVAL] Checking ${rule.getIdentifier()} (P:${rule.getPriority()})`);
            const result = rule.evaluate(capabilityProfile);
            if(result.matched) {
                traceLog.push(`[MATCH] ${rule.getIdentifier()}: ${result.explanation}`);
                if(result.shortCircuit) {
                    traceLog.push('[HALT] Short-circuit flag triggered.');
                    return new StrategyDescriptor(result.strategy, result.explanation);
                }
            }
        }
        traceLog.push('[FALLBACK] No short-circuit rule matched. Defaulting to EVENT_DRIVEN_DUPLICATION.');
        return new StrategyDescriptor('EVENT_DRIVEN_DUPLICATION', 'Default fallback strategy.');
    }
}
