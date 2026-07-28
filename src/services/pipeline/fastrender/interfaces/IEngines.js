export class ICompatibilityEngine {
    evaluate(analysisContext) { throw new Error('NotImplemented'); }
}
export class IStrategyResolver {
    resolve(capabilityProfile, knowledgeBase) { throw new Error('NotImplemented'); }
}
export class ISegmentBuilder {
    buildTimeBlocks(strategyContext, timelineContext) { throw new Error('NotImplemented'); }
}
export class IRenderPlanBuilder {
    buildContract(strategyContext, segments) { throw new Error('NotImplemented'); }
}
export class IValidationEngine {
    verify(renderPlan) { throw new Error('NotImplemented'); }
}
