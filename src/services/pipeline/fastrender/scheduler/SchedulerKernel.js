import { ExecutionSchedule } from '../contracts/ExecutionContracts.js';

export class SchedulerKernel {
    constructor(scheduleBuilder, scheduleValidator) {
        this.builder = scheduleBuilder;
        this.validator = scheduleValidator;
        this.state = 'INITIALIZED';
        this.logs = [];
    }
    
    log(msg) {
        this.logs.push(`[${new Date().toISOString()}] ${msg}`);
        this.state = msg; // Update state directly for ease in this architecture
    }
    
    async execute(renderPlan) {
        try {
            this.log('LOADING_PLAN');
            
            // Re-uses log function to log EXPANDING_TIMELINE, EXPANDING_LAYERS, BUILDING_DEPENDENCIES, BUILDING_TASKS
            const { segments, executionTasks } = this.builder.build(renderPlan, (state) => this.log(state));
            
            this.log('VALIDATING');
            const validationResult = this.validator.validate(executionTasks, renderPlan);
            
            if (!validationResult.isValid) {
                this.log('VALIDATION_FAILED');
                this.log('FAILED');
                throw new Error('Schedule Validation Failed: ' + validationResult.errors.join(', '));
            }
            
            this.log('VALIDATION_SUCCESS');
            this.log('READY');
            
            return new ExecutionSchedule(
                '1.0.0', 
                renderPlan.version, 
                segments, 
                executionTasks, 
                renderPlan.totalDurationMs, 
                [], 
                []
            );
        } catch (e) {
            this.log('FAILED');
            throw e;
        }
    }
    
    getLogs() {
        return this.logs;
    }
}
