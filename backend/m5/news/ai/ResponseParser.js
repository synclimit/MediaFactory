const DraftObject = require('./DraftObject');

class ResponseParser {
    parse(rawResponse, meta = {}) {
        try {
            const data = JSON.parse(rawResponse);
            return new DraftObject({
                headline: data.headline,
                summary: data.summary,
                category: data.category,
                keywords: data.keywords,
                mainEntity: data.mainEntity,
                recommendedLayout: data.recommendedLayout,
                confidence: data.confidence,
                language: data.language,
                tone: data.tone,
                provider: meta.provider,
                model: meta.model
            });
        } catch (e) {
            return null;
        }
    }
}
module.exports = ResponseParser;