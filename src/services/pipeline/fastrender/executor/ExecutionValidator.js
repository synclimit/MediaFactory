export class ExecutionValidator {
    validatePlan(renderExecutionPlan) {
        const errors = [];
        if (!renderExecutionPlan || !renderExecutionPlan.commands || renderExecutionPlan.commands.length === 0) {
            errors.push('Missing Command');
        }
        return { isValid: errors.length === 0, errors };
    }
}
