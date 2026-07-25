/**
 * IBeatProvider interface concept:
 * async analyze(audioPath, duration) => { bpm: number, beatTimeline: number[] }
 */
class MockBeatProvider {
    /**
     * Simulates beat analysis
     * @param {string} audioPath 
     * @param {number} duration in seconds
     * @returns {Promise<{bpm: number, beatTimeline: number[]}>}
     */
    static async analyze(audioPath, duration) {
        return new Promise((resolve) => {
            // Simulate processing time (e.g., 2 seconds)
            setTimeout(() => {
                const simulatedBPM = 120;
                const beatTimeline = [];
                const interval = 60 / simulatedBPM;
                
                // Generate dummy beat timeline every 0.5s up to duration
                const safeDuration = duration || 60;
                for (let t = 0; t < safeDuration; t += interval) {
                    beatTimeline.push(Number(t.toFixed(2)));
                }

                resolve({
                    bpm: simulatedBPM,
                    beatTimeline
                });
            }, 2000);
        });
    }
}

module.exports = { MockBeatProvider };
