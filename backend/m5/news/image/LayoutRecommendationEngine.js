class LayoutRecommendationEngine {
    recommend(aiDraft) {
        const cat = (aiDraft.category || '').toLowerCase();
        
        if (cat.includes('politi')) return 'Portrait';
        if (cat.includes('ekonomi') || cat.includes('bisnis') || cat.includes('econom') || cat.includes('business')) return 'Business';
        if (cat.includes('sport') || cat.includes('bola') || cat.includes('olahraga')) return 'Sports';
        if (cat.includes('tekno') || cat.includes('tech')) return 'Minimal';
        if (cat.includes('hiburan') || cat.includes('entertainment') || cat.includes('seleb')) return 'Magazine';
        
        return 'Standard';
    }
}
module.exports = LayoutRecommendationEngine;