export class RenderValidator {
    validate(graph, stages) {
        const errors = [];
        
        if (stages.length === 0) {
            errors.push('Missing Stage');
            return { isValid: false, errors };
        }
        
        const commands = graph.getCommands();
        if (commands.length === 0) {
            errors.push('Invalid Graph: No Commands');
            return { isValid: false, errors };
        }
        
        const emptyStages = stages.filter(s => s.commands.length === 0);
        if (emptyStages.length > 0) {
            errors.push('Empty Stage: ' + emptyStages.map(s => s.stageId).join(', '));
        }
        
        const cmdSet = new Set(commands.map(c => c.commandId));
        let missingRoot = true;
        let missingTerminal = true;
        
        for (let cmd of commands) {
            // Broken Dependency
            for (let dep of cmd.dependencyIds) {
                if (!cmdSet.has(dep)) {
                    errors.push('Broken Dependency: ' + cmd.commandId + ' depends on ' + dep);
                }
            }
            if (cmd.executionOrder < 0) errors.push('Invalid Execution Order for ' + cmd.commandId);
            
            if (cmd.commandType === 'BEGIN_STREAM') missingRoot = false;
            if (cmd.commandType === 'END_STREAM') missingTerminal = false;
        }
        
        if (missingRoot) errors.push('Missing Root (BEGIN_STREAM)');
        if (missingTerminal) errors.push('Missing Terminal (END_STREAM)');
        
        return { isValid: errors.length === 0, errors };
    }
}
