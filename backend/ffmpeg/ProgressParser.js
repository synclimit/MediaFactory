class ProgressParser {
    constructor() {}

    parse(stderrLine) {
        // Extracts frame=123 fps=60 time=00:01:23.45 bitrate=...
        return { percent: 0, time: "00:00:00" }; // Stub
    }
}

module.exports = ProgressParser;
