export class FFmpegCommand {
    constructor(command, args, workingDirectory, environment, outputFile, temporaryFiles, metadata) {
        this.command = command || 'ffmpeg';
        this.arguments = args || [];
        this.workingDirectory = workingDirectory || process.cwd();
        this.environment = environment || {};
        this.outputFile = outputFile;
        this.temporaryFiles = temporaryFiles || [];
        this.metadata = metadata || {};
        Object.freeze(this);
    }
}
