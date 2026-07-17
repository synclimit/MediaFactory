const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class MetadataExtractor {
    constructor() {}

    async extract(filePath) {
        // Invokes ffprobe and returns JSON metadata
        return { duration: 0, resolution: "1920x1080", codec: "h264" }; // Stub
    }
}

module.exports = MetadataExtractor;
