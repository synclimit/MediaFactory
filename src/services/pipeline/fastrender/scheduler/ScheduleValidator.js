export class ScheduleValidator {
    validate(executionTasks, renderPlan) {
        const taskIds = new Set();
        const errors = [];
        const warnings = [];
        
        // Missing Segment Rule
        if (!renderPlan.segments || renderPlan.segments.length === 0) {
            errors.push('RenderPlan contains no segments.');
        }

        if(executionTasks.length === 0) {
            errors.push('No execution tasks generated.');
        }

        executionTasks.forEach(task => {
            if (taskIds.has(task.taskId)) {
                errors.push(`Duplicate taskId detected: ${task.taskId}`);
            }
            taskIds.add(task.taskId);
            
            // Check dependencies
            task.dependencyIds.forEach(depId => {
                // If it depends on something not in the list (or self), and we haven't seen it
                if (!executionTasks.find(t => t.taskId === depId)) {
                    errors.push(`Invalid dependency: Task ${task.taskId} depends on unknown ${depId}`);
                }
            });
            
            if (task.executionOrder < 0) {
                errors.push(`Invalid executionOrder for task ${task.taskId}`);
            }
        });
        
        return { isValid: errors.length === 0, errors, warnings };
    }
}
