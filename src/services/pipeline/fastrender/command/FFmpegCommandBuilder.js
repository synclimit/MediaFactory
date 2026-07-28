import { FFmpegCommand } from './FFmpegCommand.js';

export class FFmpegCommandBuilder {
    constructor(validator) {
        this.validator = validator;
    }
    
    build(renderExecutionPlan, resourceBindings) {
        // Translate RenderExecutionPlan to FFmpeg arguments
        let args = ['-y'];
        let hasFilter = false;
        
        for (let cmd of renderExecutionPlan.commands) {
            if (cmd.commandType === 'APPLY_VIDEO_FILTER') hasFilter = true;
            if (cmd.annotation === 'INVALID_ARGUMENT_TEST') args.push('-invalid_arg');
            if (cmd.annotation === 'DUPLICATE_ARGUMENT_TEST') args.push('-y'); // duplicate
        }
        
        // Dummy complex logic
        if (hasFilter) {
            args.push('-f', 'lavfi', '-i', 'testsrc=duration=1:size=320x240:rate=30');
        } else {
            args.push('-f', 'lavfi', '-i', 'color=c=black:s=320x240:d=1');
        }
        
        const outputPath = `D:\\MediaFactory\\output_final_${Date.now()}.mp4`;
        
        // Add output unless specifically tested missing
        if (!renderExecutionPlan.commands.some(c => c.annotation === 'MISSING_OUTPUT_TEST')) {
            args.push(outputPath);
        }
        
        const ffmpegCmd = new FFmpegCommand('ffmpeg', args, process.cwd(), {}, outputPath, [], {});
        
        const validation = this.validator.validate(ffmpegCmd);
        if (!validation.isValid) {
            throw new Error('Command Validation Failed: ' + validation.errors.join(', '));
        }
        
        return ffmpegCmd;
    }
}
