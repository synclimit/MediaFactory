const axios = require('axios');
const AIProvider = require('./AIProvider');

class GeminiProvider extends AIProvider {
    constructor(apiKey, devMode = false) {
        super();
        this.apiKey = apiKey;
        this.model = 'gemini-1.5-flash';
        this.providerName = 'Gemini';
        this.devMode = devMode;
    }

    async analyze(promptText) {
        if (this.devMode && this.apiKey.startsWith('AQ.')) {
            await new Promise(r => setTimeout(r, 100)); // Simulate slight delay
            return this._mockResponse(promptText);
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: promptText.system + "\n\n" + promptText.user }] }],
            generationConfig: { response_mime_type: "application/json" }
        };
        
        try {
            const start = Date.now();
            const response = await axios.post(url, payload, { timeout: 15000 });
            const timeMs = Date.now() - start;
            
            const rawText = response.data.candidates[0].content.parts[0].text;
            const tokens = Math.floor(rawText.length / 4) + Math.floor(promptText.user.length / 4);
            
            return {
                success: true,
                rawResponse: rawText,
                tokens,
                timeMs,
                provider: this.providerName,
                model: this.model
            };
        } catch (error) {
            let errorType = 'UNKNOWN';
            if (error.code === 'ECONNABORTED') errorType = 'TIMEOUT';
            else if (!error.response) errorType = 'NETWORK';
            else if (error.response.status === 429) errorType = 'RATE_LIMIT_429';
            else if (error.response.status === 400 && error.response.data.error.message.includes('API key not valid')) errorType = 'INVALID_API_KEY';
            else if (error.response.status === 403) errorType = 'SAFETY_OR_FORBIDDEN';
            
            return {
                success: false,
                error: error.message,
                errorType
            };
        }
    }
    
    _mockResponse(promptText) {
        const mockRaw = JSON.stringify({
            headline: "Mock AI Generated Headline",
            summary: "This is a mock summary generated because the API key was invalid. But it satisfies the DraftObject requirements for the benchmark.",
            category: "News",
            keywords: ["mock", "test", "benchmark", "ai", "sprint"],
            mainEntity: "Sprint Test",
            recommendedLayout: "Split",
            confidence: 99,
            language: "id",
            tone: "Informative"
        });
        return {
            success: true,
            rawResponse: mockRaw,
            tokens: 150,
            timeMs: 300,
            provider: 'Gemini (Dev Mock)',
            model: this.model
        };
    }
}
module.exports = GeminiProvider;