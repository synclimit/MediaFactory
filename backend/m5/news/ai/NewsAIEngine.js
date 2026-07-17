const PromptBuilder = require('./PromptBuilder');
const GeminiProvider = require('./GeminiProvider');
const ResponseParser = require('./ResponseParser');
const ResponseValidator = require('./ResponseValidator');
const AICache = require('../cache/AICache');

class NewsAIEngine {
    constructor(apiKey, devMode = false) {
        this.provider = new GeminiProvider(apiKey, devMode);
        this.promptBuilder = new PromptBuilder();
        this.parser = new ResponseParser();
        this.validator = new ResponseValidator();
        this.cache = new AICache();
    }

    async processArticle(article) {
        const hash = this.cache.generateHash(article.url || article.body);
        
        // 1. Cache Check
        const cached = this.cache.get(hash);
        if (cached) {
            cached.cached = true;
            return {
                success: true,
                draft: cached,
                isCacheHit: true,
                timeMs: 0,
                tokens: 0,
                retries: 0
            };
        }

        // 2. Build Prompt
        const prompt = this.promptBuilder.buildPrompt(article.body || article.title);
        
        let retries = 0;
        let lastError = '';
        const maxRetries = 1;

        while (retries <= maxRetries) {
            // 3. AI Provider Call
            const res = await this.provider.analyze(prompt);
            
            // Handle AI Call Errors with specific strategies
            if (!res.success) {
                lastError = res.error;
                
                if (res.errorType === 'INVALID_API_KEY' || res.errorType === 'SAFETY_OR_FORBIDDEN') {
                    break; // Fatal, don't retry
                }
                
                if (res.errorType === 'RATE_LIMIT_429') {
                    await new Promise(r => setTimeout(r, 2000)); // Sleep before retry
                }
                
                retries++;
                continue;
            }

            // 4. Parse Response
            const draft = this.parser.parse(res.rawResponse, { 
                provider: res.provider, 
                model: res.model,
                promptVersion: prompt.version,
                latencyMs: res.timeMs,
                tokenUsage: res.tokens,
                retryCount: retries
            });
            
            if (!draft) {
                lastError = 'INVALID_JSON';
                retries++;
                continue;
            }
            
            // 5. Validate Quality
            const validation = this.validator.validate(draft);
            if (!validation.isValid) {
                lastError = 'QUALITY_FAILED: ' + validation.error;
                retries++;
                continue;
            }

            // 6. Save Cache
            this.cache.set(hash, draft);

            return {
                success: true,
                draft: draft,
                isCacheHit: false,
                timeMs: res.timeMs,
                tokens: res.tokens,
                retries: retries
            };
        }

        return {
            success: false,
            error: lastError,
            retries
        };
    }
}
module.exports = NewsAIEngine;