class ResponseValidator {
    validate(draft) {
        if (!draft) return { isValid: false, error: 'Draft is null' };
        
        const errors = [];
        let score = 100;
        
        if (!draft.headline || draft.headline.length < 10) { errors.push('Headline missing or too short'); score -= 25; }
        if (!draft.summary || draft.summary.length < 50) { errors.push('Summary missing or too short'); score -= 25; }
        if (!draft.category) { errors.push('Category missing'); score -= 10; }
        if (!Array.isArray(draft.keywords) || draft.keywords.length < 5) { errors.push('Keyword count < 5'); score -= 25; }
        if (typeof draft.confidence !== 'number') { errors.push('Confidence missing'); score -= 15; }
        
        return {
            isValid: score >= 75,
            score,
            error: errors.join(', ')
        };
    }
}
module.exports = ResponseValidator;