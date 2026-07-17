class CardValidator {
    validate(cardState) {
        let warnings = [];
        let overflowCount = 0;
        let modifiedCard = { ...cardState };
        
        // Headline overflow -> Resize strategy (mocking font size adjustment)
        if (modifiedCard.headline && modifiedCard.headline.length > 80) {
            warnings.push('Headline overflow detected. Applying Resize strategy.');
            overflowCount++;
            modifiedCard.typography.fontTitleSize = 'smaller';
        }
        
        // Summary overflow -> Clamp strategy
        if (modifiedCard.summary && modifiedCard.summary.length > 200) {
            warnings.push('Summary overflow detected. Applying Clamp strategy.');
            overflowCount++;
            modifiedCard.summary = modifiedCard.summary.substring(0, 197) + '...';
        }
        
        // Image invalid -> Warning
        if (!modifiedCard.image) {
            warnings.push('Image invalid or missing.');
        }
        
        modifiedCard.validationWarnings = warnings;
        modifiedCard.overflowCount = overflowCount;
        
        return {
            isValid: warnings.length === 0,
            warnings,
            overflowCount,
            cardState: modifiedCard
        };
    }
}
module.exports = CardValidator;