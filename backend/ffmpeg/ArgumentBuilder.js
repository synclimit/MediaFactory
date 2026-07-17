class ArgumentBuilder {
    constructor() {}

    build(config) {
        // Combines inputs, filter_complex, encoding flags, and output path
        return ['-y', '-i', 'input.mp4', '-c:v', 'h264_nvenc', 'output.mp4']; // Stub
    }
}

module.exports = ArgumentBuilder;
