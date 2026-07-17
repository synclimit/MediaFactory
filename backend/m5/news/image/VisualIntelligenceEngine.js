const ImageExtractionEngine = require('./ImageExtractionEngine');
const ImageRankingEngine = require('./ImageRankingEngine');
const PortraitSafetyEngine = require('../quality/PortraitSafetyEngine');
const MobileViewportEngine = require('../render/MobileViewportEngine');
const LayoutRecommendationEngine = require('./LayoutRecommendationEngine');
const VisualDraft = require('./VisualDraft');

class VisualIntelligenceEngine {
    constructor() {
        this.extractor = new ImageExtractionEngine();
        this.ranker = new ImageRankingEngine();
        this.safety = new PortraitSafetyEngine();
        this.viewport = new MobileViewportEngine();
        this.layout = new LayoutRecommendationEngine();
    }
    
    async process(articleObject, aiDraft) {
        const startTime = Date.now();
        
        // 1. Extract Images
        const extractedImages = await this.extractor.extract(null, articleObject);
        
        // 2. Rank Images
        const bestImage = await this.ranker.rank(extractedImages, aiDraft);
        
        let portraitDetected = false;
        let faceCount = 0;
        let safeArea = null;
        let fitMode = 'cover';
        let fallbackMode = 'none';
        let imageScore = 0;
        let semanticMatch = false;
        let imageSource = 'unknown';
        let viewport = { width: 390, height: 844 };
        
        if (bestImage) {
            imageScore = bestImage.score;
            semanticMatch = bestImage.semanticMatch || false;
            imageSource = bestImage.type || 'unknown';
            
            // 3. Portrait Safety
            const safetyInfo = await this.safety.checkSafety(bestImage);
            portraitDetected = !safetyInfo.safe && safetyInfo.faces.length > 0;
            faceCount = safetyInfo.faces.length;
            safeArea = safetyInfo.safeArea;
            
            // 4. Mobile Viewport Composition (Smart Crop Engine)
            const viewportInfo = this.viewport.calculateFit(bestImage, safetyInfo);
            fitMode = viewportInfo.fitMode;
            fallbackMode = viewportInfo.fallbackMode;
            viewport = viewportInfo.viewport;
        }
        
        // 5. Layout Recommendation
        const recommendedTemplate = this.layout.recommend(aiDraft);
        
        const processingTime = Date.now() - startTime;
        
        return new VisualDraft({
            selectedImage: bestImage ? bestImage.url : null,
            score: imageScore,
            reason: bestImage ? 'Ranked highest based on semantic match and resolution.' : 'No images available.',
            portraitDetected,
            faceCount,
            fitMode,
            fallbackMode,
            safeArea,
            recommendedTemplate,
            viewport,
            processingTime,
            semanticMatch,
            imageSource
        });
    }
}
module.exports = VisualIntelligenceEngine;