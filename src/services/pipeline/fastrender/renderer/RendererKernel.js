import { RendererState, RenderExecutionPlan } from '../contracts/RenderContracts.js';

export class RendererKernel {
    constructor(builder) {
        this.builder = builder;
        this.state = RendererState.INITIALIZED;
        this.logs = [];
    }
    
    log(msg) {
        this.logs.push(`[${new Date().toISOString()}] ${msg}`);
        
        if (RendererState[msg]) {
            this.state = RendererState[msg];
        } else if (msg.includes('Validation') || msg.includes('Renderer Started') || msg.includes('Renderer Ready') || msg.includes('Commands Generated') || msg.includes('Pipeline Loaded')) {
            // Just log
        }
    }
    
    async execute(pipelinePlan) {
        try {
            this.log('Renderer Started');
            this.log('READING_PIPELINE');
            this.log('Pipeline Loaded');
            
            const result = this.builder.build(pipelinePlan, (msg) => this.log(msg));
            this.log('Commands Generated');
            
            this.log('Validation Started');
            if (!result.validation.isValid) {
                this.log('Validation Failed');
                this.log('FAILED');
                throw new Error('Render Validation Failed: ' + result.validation.errors.join(', '));
            }
            this.log('Validation Success');
            
            const execPlan = new RenderExecutionPlan(
                '1.0.0',
                pipelinePlan.version,
                '1.0.0',
                result.metadata,
                result.stages,
                result.graph.getCommands(),
                { nodes: result.graph.getCommands(), edges: result.graph.getEdges() }
            );
            
            this.log('READY');
            this.log('Renderer Ready');
            return execPlan;
            
        } catch (e) {
            this.log('FAILED');
            throw e;
        }
    }
}
