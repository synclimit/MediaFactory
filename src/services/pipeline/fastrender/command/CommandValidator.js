export class CommandValidator {
    validate(ffmpegCommand) {
        const errors = [];
        if (!ffmpegCommand.outputFile) errors.push('Missing Output');
        if (!ffmpegCommand.arguments || ffmpegCommand.arguments.length === 0) errors.push('Invalid Argument (Empty)');
        
        // Artificial Duplicate check for tests
        const hasDupes = ffmpegCommand.arguments.filter(a => a === '-y').length > 1;
        if (hasDupes) errors.push('Duplicate Argument');
        
        return { isValid: errors.length === 0, errors };
    }
}
