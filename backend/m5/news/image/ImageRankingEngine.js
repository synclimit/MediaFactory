class ImageRankingEngine {
    async rank(images, aiDraft) {
        if (!images || images.length === 0) return null;
        
        let bestScore = -1;
        let bestImage = null;
        
        const mainEntity = (aiDraft.mainEntity || '').toLowerCase();
        const keywords = (aiDraft.keywords || []).map(k => k.toLowerCase());
        
        for (const img of images) {
            let score = 0;
            let semanticMatch = false;
            
            // Resolution Base
            const res = img.width * img.height;
            if (res > 1000000) score += 30;
            else if (res > 500000) score += 20;
            else score += 10;
            
            // Semantic Image Ranking
            const altText = (img.alt || '').toLowerCase();
            const fileName = (img.url || '').toLowerCase();
            
            if (mainEntity && (altText.includes(mainEntity) || fileName.includes(mainEntity))) {
                score += 50;
                semanticMatch = true;
            }
            
            let kwMatches = 0;
            for (const kw of keywords) {
                if (altText.includes(kw) || fileName.includes(kw)) {
                    kwMatches++;
                }
            }
            score += (kwMatches * 10);
            if (kwMatches > 0) semanticMatch = true;
            
            // Image Source/Type
            if (img.type === 'opengraph') score += 40;
            if (img.type === 'figure') score += 30;
            if (img.type === 'picture') score += 20;
            if (img.type === 'lazy') score -= 10; // penalty for lazy generic images if possible
            
            // Image Position penalty (mocked via array index in reality, here just random)
            score += Math.floor(Math.random() * 5); 
            
            img.score = score;
            img.semanticMatch = semanticMatch;
            
            if (score > bestScore) {
                bestScore = score;
                bestImage = img;
            }
        }
        
        return bestImage;
    }
}
module.exports = ImageRankingEngine;