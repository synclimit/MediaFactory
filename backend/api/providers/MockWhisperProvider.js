/**
 * IWhisperProvider interface concept:
 * async analyze(audioPath, duration) => { srtContent: string, wordTimestamps: object[], detectedLanguage: string, confidence: number }
 */
class MockWhisperProvider {
    /**
     * Simulates whisper subtitle extraction
     * @param {string} audioPath 
     * @param {number} duration 
     * @returns {Promise<{srtContent: string, wordTimestamps: any[], detectedLanguage: string, confidence: number}>}
     */
    static async analyze(audioPath, duration) {
        return new Promise((resolve) => {
            // Simulate processing time
            setTimeout(() => {
                const srtContent = `1
00:00:01,000 --> 00:00:04,500
Ini adalah lirik baris pertama.

2
00:00:05,000 --> 00:00:08,000
Ini adalah lirik baris kedua (Mock).`;

                const wordTimestamps = [
                    { word: "Ini", start: 1.0, end: 1.5, probability: 0.99 },
                    { word: "adalah", start: 1.5, end: 2.0, probability: 0.99 },
                    { word: "lirik", start: 2.0, end: 2.5, probability: 0.99 },
                    { word: "baris", start: 2.5, end: 3.0, probability: 0.99 },
                    { word: "pertama.", start: 3.0, end: 4.5, probability: 0.99 },
                    { word: "Ini", start: 5.0, end: 5.5, probability: 0.99 },
                    { word: "adalah", start: 5.5, end: 6.0, probability: 0.99 },
                    { word: "lirik", start: 6.0, end: 6.5, probability: 0.99 },
                    { word: "baris", start: 6.5, end: 7.0, probability: 0.99 },
                    { word: "kedua", start: 7.0, end: 7.5, probability: 0.99 },
                    { word: "(Mock).", start: 7.5, end: 8.0, probability: 0.99 }
                ];

                resolve({
                    srtContent,
                    wordTimestamps,
                    detectedLanguage: 'id',
                    confidence: 0.98
                });
            }, 3000); // 3 seconds simulation
        });
    }
}

module.exports = { MockWhisperProvider };
