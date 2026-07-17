const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'backend/m5/news/image');
const qualityDir = path.join(__dirname, 'backend/m5/news/quality');
const renderDir = path.join(__dirname, 'backend/m5/news/render');
const benchmarkDir = path.join(__dirname, 'backend/m5/news/benchmark');

const files = {
  [path.join(imageDir, 'VisualDraft.js')]: `
class VisualDraft {
    constructor(data = {}) {
        this.selectedImage = data.selectedImage || null;
        this.score = data.score || 0;
        this.reason = data.reason || '';
        this.portraitDetected = data.portraitDetected || false;
        this.faceCount = data.faceCount || 0;
        this.fitMode = data.fitMode || 'cover';
        this.fallbackMode = data.fallbackMode || 'none';
        this.safeArea = data.safeArea || null;
        this.recommendedTemplate = data.recommendedTemplate || 'Standard';
        this.viewport = data.viewport || { width: 390, height: 844 };
        this.processingTime = data.processingTime || 0;
        this.semanticMatch = data.semanticMatch || false;
        this.imageSource = data.imageSource || 'unknown';
    }
}
module.exports = VisualDraft;
  `,

  [path.join(imageDir, 'ImageRankingEngine.js')]: `
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
  `,

  [path.join(qualityDir, 'PortraitSafetyEngine.js')]: `
const FaceProvider = require('./FaceProvider');

class PortraitSafetyEngine {
    constructor() {
        this.faceProvider = new FaceProvider();
    }
    
    async checkSafety(image) {
        if (!image || !image.url) return { safe: true, faces: [], safeArea: null };
        
        const faces = await this.faceProvider.detectFaces(image.url);
        
        if (faces.length === 0) {
            return { safe: true, faces: [], safeArea: null };
        }
        
        // Calculate Safe Area encompassing all faces
        let minX = 99999, minY = 99999, maxX = 0, maxY = 0;
        faces.forEach(f => {
            if (f.box.x < minX) minX = f.box.x;
            if (f.box.y < minY) minY = f.box.y;
            if (f.box.x + f.box.width > maxX) maxX = f.box.x + f.box.width;
            if (f.box.y + f.box.height > maxY) maxY = f.box.y + f.box.height;
        });
        
        const padding = 50; // padding around faces
        const safeArea = {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: (maxX - minX) + (padding * 2),
            height: (maxY - minY) + (padding * 2)
        };
        
        return {
            safe: false, 
            faces,
            safeArea
        };
    }
}
module.exports = PortraitSafetyEngine;
  `,

  [path.join(renderDir, 'MobileViewportEngine.js')]: `
class MobileViewportEngine {
    calculateFit(image, portraitSafeInfo) {
        const viewport = { width: 390, height: 844 };
        const viewportRatio = viewport.width / viewport.height;
        
        if (!image) return { fitMode: 'cover', fallbackMode: 'none', viewport };
        
        const imgRatio = image.width / (image.height || 1);
        
        if (!portraitSafeInfo.safe && portraitSafeInfo.faces.length > 0) {
            // Smart Crop Engine Pipeline
            const safeArea = portraitSafeInfo.safeArea;
            
            // Can the safe area fit within the 9:16 crop box?
            // If the safe area width is wider than what the 9:16 crop can encompass, we must fallback.
            const maxCropWidthForHeight = image.height * viewportRatio;
            
            if (safeArea.width > maxCropWidthForHeight) {
                // Cannot smart-crop without cutting face or extending beyond image bounds
                return { fitMode: 'contain-blur', fallbackMode: 'contain-blur', viewport };
            }
            
            // Otherwise, we can use Smart Crop!
            return { fitMode: 'smart-crop', fallbackMode: 'contain-blur', viewport };
        }
        
        // No faces -> Safe to cover
        if (imgRatio > 1.8) {
            // Extremely wide panorama
            return { fitMode: 'contain-blur', fallbackMode: 'contain', viewport };
        }
        
        return { fitMode: 'cover', fallbackMode: 'none', viewport };
    }
}
module.exports = MobileViewportEngine;
  `,

  [path.join(imageDir, 'VisualIntelligenceEngine.js')]: `
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
  `,

  [path.join(benchmarkDir, 'benchmarkRunnerVisual.js')]: `
const fs = require('fs');
const path = require('path');
const VisualIntelligenceEngine = require('../image/VisualIntelligenceEngine');

async function runVisualBenchmark() {
    console.log('--- STARTING SPRINT 3.1 VISUAL HARDENING BENCHMARK ---');
    const engine = new VisualIntelligenceEngine();
    
    const totalRequests = 100;
    
    const results = {
        totalProcessed: 0,
        totalFaces: 0,
        smartCropUsage: 0,
        containBlurUsage: 0,
        semanticMatchCount: 0,
        totalTimeMs: 0,
        imageSources: {}
    };

    const dummyCategories = ['Politics', 'Economy', 'Sports', 'Technology', 'Entertainment'];
    const dummyEntities = ['Jokowi', 'IHSG', 'Timnas', 'Apple', 'Taylor Swift'];
    
    for (let i = 0; i < totalRequests; i++) {
        const ent = dummyEntities[i % dummyEntities.length];
        // Mock Article
        const article = {
            images: [
                { url: 'https://mock.com/img1.jpg', type: 'opengraph', width: 1200, height: 630, alt: ent + ' speech' },
                { url: 'https://mock.com/img2.jpg', type: 'img', width: 400, height: 400, alt: 'generic graphic' },
                { url: 'https://mock.com/img3.jpg', type: 'figure', width: 1920, height: 1080, alt: ent + ' background' }
            ]
        };
        // Mock AI Draft
        const aiDraft = {
            category: dummyCategories[i % dummyCategories.length],
            mainEntity: ent,
            keywords: [ent, 'news', 'update', 'latest', 'trending']
        };
        
        const visualDraft = await engine.process(article, aiDraft);
        
        results.totalProcessed++;
        results.totalFaces += visualDraft.faceCount;
        results.totalTimeMs += visualDraft.processingTime;
        
        if (visualDraft.fitMode === 'smart-crop') results.smartCropUsage++;
        if (visualDraft.fitMode === 'contain-blur') results.containBlurUsage++;
        if (visualDraft.semanticMatch) results.semanticMatchCount++;
        
        const src = visualDraft.imageSource;
        results.imageSources[src] = (results.imageSources[src] || 0) + 1;
        
        process.stdout.write(visualDraft.fitMode === 'smart-crop' ? 'S' : (visualDraft.fitMode === 'contain-blur' ? 'B' : 'C'));
        await new Promise(r => setTimeout(r, 10)); 
    }
    
    console.log('\\n\\nProcessing Complete!\\n');
    
    const avgFaces = results.totalFaces / results.totalProcessed;
    const smartCropPct = (results.smartCropUsage / results.totalProcessed) * 100;
    const containBlurPct = (results.containBlurUsage / results.totalProcessed) * 100;
    const semanticPct = (results.semanticMatchCount / results.totalProcessed) * 100;
    
    console.log('=== VISUAL HARDENING BENCHMARK REPORT ===');
    console.log(\`Total Processed       : \${results.totalProcessed}\`);
    console.log(\`Average Face Count    : \${avgFaces.toFixed(2)} faces/art\`);
    console.log(\`Semantic Match Rate   : \${semanticPct.toFixed(2)}%\`);
    console.log(\`Smart Crop Usage      : \${smartCropPct.toFixed(2)}%\`);
    console.log(\`Contain Blur Usage    : \${containBlurPct.toFixed(2)}%\`);
    
    console.log('\\nImage Source Distribution:');
    for (const [k, v] of Object.entries(results.imageSources)) {
        console.log(\`- \${k} : \${v}\`);
    }
    console.log('=========================================');
}

runVisualBenchmark();
  `
};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(filepath, content.trim());
}

console.log('Sprint 3.1 Visual Hardening files created.');
