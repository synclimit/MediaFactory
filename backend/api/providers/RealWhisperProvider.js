const { spawn } = require('child_process');
const path = require('path');

/**
 * IWhisperProvider implementation using python faster-whisper
 */
class RealWhisperProvider {
    /**
     * Extracts subtitle and word timestamps using python faster-whisper
     * @param {string} audioPath 
     * @param {number} duration 
     * @param {object} options 
     * @returns {Promise<{srtContent: string, wordTimestamps: any[], detectedLanguage: string, confidence: number}>}
     */
    static async analyze(audioPath, duration, options = {}) {
        return new Promise((resolve, reject) => {
            const model = options.model || 'base';
            const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'whisper_bridge.py');
            
            // Spawn python process
            const pythonProcess = spawn('python', [
                scriptPath,
                audioPath,
                '--model', model
            ], { signal: options.signal });

            pythonProcess.on('error', (err) => {
                if (err.name === 'AbortError') {
                    reject(new Error('Aborted'));
                } else {
                    reject(err);
                }
            });

            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
                // We don't throw immediately because python might just log warnings/progress to stderr
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`Whisper process exited with code ${code}\nStderr: ${errorData}`));
                }

                try {
                    // Python bridge outputs exactly one JSON string to stdout at the very end
                    const result = JSON.parse(outputData.trim());
                    if (!result.success) {
                        return reject(new Error(`Whisper engine error: ${result.error}`));
                    }
                    resolve({
                        srtContent: result.srtContent,
                        wordTimestamps: result.wordTimestamps,
                        detectedLanguage: result.detectedLanguage,
                        confidence: result.confidence
                    });
                } catch (err) {
                    reject(new Error(`Failed to parse Whisper JSON output: ${err.message}\nOutput: ${outputData}`));
                }
            });
        });
    }
}

module.exports = { RealWhisperProvider };
