export class PlannerKernel {
    constructor(orchestrator, knowledgeBase) {
        this.orchestrator = orchestrator;
        this.knowledgeBase = knowledgeBase;
        this.state = 'INITIALIZED';
    }
    
    async execute(projectContext, runtimeContext = null) {
        this.state = 'ANALYZING';
        try {
            const { renderPlan, validation, decisionLog } = await this.orchestrator.buildPlan(projectContext, this.knowledgeBase, runtimeContext);
            this.state = validation.isValid ? 'READY' : 'FAILED';
            return { 
                plan: renderPlan, 
                validation, 
                decisionLog: decisionLog || renderPlan.decisionLog || [],
                trace: this.knowledgeBase ? this.knowledgeBase.getTrace() : [] 
            };
        } catch(e) {
            this.state = 'FAILED';
            throw e;
        }
    }
}
