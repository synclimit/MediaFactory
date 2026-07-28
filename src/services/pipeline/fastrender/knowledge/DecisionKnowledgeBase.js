export class DecisionKnowledgeBase {
    constructor(registry, evaluator) {
        this.registry = registry;
        this.evaluator = evaluator;
        this.decisionTrace = [];
    }
    queryStrategy(capabilityProfile) {
        this.decisionTrace = [];
        const rules = this.registry.getRules();
        return this.evaluator.evaluateRules(rules, capabilityProfile, this.decisionTrace);
    }
    getTrace() { return this.decisionTrace; }
}
