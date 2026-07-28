export class IPlannerRule {
    getIdentifier() { throw new Error('NotImplemented'); }
    getPriority() { throw new Error('NotImplemented'); }
    evaluate(capabilityProfile) { throw new Error('NotImplemented'); }
}
