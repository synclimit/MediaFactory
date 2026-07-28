export class RuleRegistry {
    constructor() { this.rules = []; }
    register(rule) { this.rules.push(rule); }
    getRules() { return this.rules.sort((a,b) => b.getPriority() - a.getPriority()); }
}
