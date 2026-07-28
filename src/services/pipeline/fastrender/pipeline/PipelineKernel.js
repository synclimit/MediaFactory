import { PipelineState, PipelinePlan } from '../contracts/PipelineContracts.js';

export class PipelineKernel {
    constructor(builder) {
        this.builder = builder;
        this.state = PipelineState.INITIALIZED;
        this.logs = [];
    }
    
    log(msg) {
        this.logs.push(`[${new Date().toISOString()}] ${msg}`);
        
        // Only update state if msg matches an Enum key for PipelineState
        if (PipelineState[msg]) {
            this.state = PipelineState[msg];
        } else if (msg === 'Optimization Started' || msg === 'Optimization Finished') {
            // Do not change state, just log
        } else if (msg.includes('Validation')) {
            // Do not change state, just log
        } else if (msg === 'Pipeline Started' || msg === 'Pipeline Ready') {
            // Just log
        }
    }
    
    async execute(executionSchedule) {
        try {
            this.log('Pipeline Started');
            this.log('READING_SCHEDULE');
            
            const result = this.builder.build(executionSchedule, (msg) => this.log(msg));
            
            this.log('Validation Started');
            if (!result.validation.isValid) {
                this.log('Validation Failed');
                this.log('FAILED');
                throw new Error('Pipeline Validation Failed: ' + result.validation.errors.join(', '));
            }
            this.log('Validation Success');
            
            const plan = new PipelinePlan(
                '1.0.0',
                executionSchedule.plannerVersion,
                executionSchedule.version,
                '1.0.0',
                result.metadata,
                result.stages,
                { type: 'DAG' }, // Simplified graph representation
                result.graph.getNodes(),
                result.graph.getEdges()
            );
            
            this.log('READY');
            this.log('Pipeline Ready');
            return plan;
            
        } catch (e) {
            this.log('FAILED');
            throw e;
        }
    }
}
