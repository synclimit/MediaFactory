const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'backend/m5/news/image');
const qualityDir = path.join(__dirname, 'backend/m5/news/quality');
const renderDir = path.join(__dirname, 'backend/m5/news/render');
const benchmarkDir = path.join(__dirname, 'backend/m5/news/benchmark');

[imageDir, qualityDir, renderDir, benchmarkDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const files = {
  [path.join(imageDir, 'VisualDraft.js')]: `
class VisualDraft {
    constructor(data = {}) {
        this.selectedImage = data.selectedImage || null;
        this.imageScore = data.imageScore || 0;
        this.portraitSafe = data.portraitSafe !== undefined ? data.portraitSafe : true;
        this.fitMode = data.fitMode || 'cover';
        this.recommendedTemplate = data.recommendedTemplate || 'Standard';
        this.reason = data.reason || '';
    }
}
module.exports = VisualDraft;
  `,

  [path.join(imageDir, 'ImageExtractionEngine.js')]: `
class ImageExtractionEngine {
    // In a real scenario, this parses the raw HTML again or relies on the Article Object
    // For Sprint 3, we assume the Article Object already captured raw images, 
    // or we simulate robust extraction from HTML string if provided.
    async extract(articleHTML, articleObject) {
        // Mocking advanced extraction (OpenGraph, Figure, Picture, IMG, Lazy, Srcset, CDN)
        // Never resize.
        let images = articleObject.images || [];
        
        // Ensure every image has baseline properties for ranking
        return images.map(img => {
            if (typeof img === 'string') return { url: img, type: 'img', width: 800, height: 600 };
            return {
                url: img.url,
                type: img.type || 'unknown',
                width: img.width || 800 + Math.floor(Math.random() * 400),
                height: img.height || 600 + Math.floor(Math.random() * 400),
                alt: img.alt || ''
            };
        });
    }
}
module.exports = ImageExtractionEngine;
  `,

  [path.join(qualityDir, 'FaceProvider.js')]: `
class FaceProvider {
    async detectFaces(imageUrl) {
        // Mock Face Detection to avoid native dependencies blocking Sprint 3
        // In production, this integrates with face-api.js or a Python OpenCV microservice
        const hasFace = Math.random() > 0.5; 
        if (!hasFace) return [];
        
        return [{
            box: { x: 100, y: 100, width: 200, height: 200 },
            confidence: 0.95
        }];
    }
}
module.exports = FaceProvider;
  `,

  [path.join(qualityDir, 'PortraitSafetyEngine.js')]: `
const FaceProvider = require('./FaceProvider');

class PortraitSafetyEngine {
    constructor() {
        this.faceProvider = new FaceProvider();
    }
    
    async checkSafety(image) {
        if (!image || !image.url) return { safe: true, faces: [] };
        
        const faces = await this.faceProvider.detectFaces(image.url);
        
        // Prevent Eye crop, Head crop, Chin crop
        // If faces exist, we mark it as needing 'contain' or smart cropping,
        // but for safety boolean, we say if it's safe to center-crop.
        const safe = faces.length === 0; // If there are faces, standard crop is NOT safe.
        
        return {
            safe,
            faces
        };
    }
}
module.exports = PortraitSafetyEngine;
  `,

  [path.join(imageDir, 'ImageRankingEngine.js')]: `
class ImageRankingEngine {
    async rank(images) {
        if (!images || images.length === 0) return null;
        
        let bestScore = -1;
        let bestImage = null;
        
        for (const img of images) {
            let score = 0;
            
            // Resolution
            const res = img.width * img.height;
            if (res > 1000000) score += 30;
            else if (res > 500000) score += 20;
            else score += 10;
            
            // Aspect Ratio (Prefer 16:9 or 9:16)
            const ratio = img.width / (img.height || 1);
            if (ratio > 1.5 || ratio < 0.7) score += 15;
            
            // OpenGraph / Figure priority
            if (img.type === 'opengraph') score += 25;
            if (img.type === 'figure') score += 20;
            
            // Mock Sharpness/Brightness heuristics
            score += Math.floor(Math.random() * 20); // random heuristic score
            
            img.score = score;
            
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

  [path.join(renderDir, 'MobileViewportEngine.js')]: `
class MobileViewportEngine {
    calculateFit(image, portraitSafeInfo) {
        // Assume 390x844 Mobile Composition
        const viewport = { width: 390, height: 844 };
        
        if (!image) return 'cover';
        
        if (!portraitSafeInfo.safe && portraitSafeInfo.faces.length > 0) {
            // Never crop human portraits by default
            return 'contain-blur'; 
        }
        
        // If landscape and safe
        const ratio = image.width / (image.height || 1);
        if (ratio > 1.2) return 'cover';
        
        return 'cover';
    }
}
module.exports = MobileViewportEngine;
  `,

  [path.join(imageDir, 'LayoutRecommendationEngine.js')]: `
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
        // 1. Extract Images
        const extractedImages = await this.extractor.extract(null, articleObject);
        
        // 2. Rank Images
        const bestImage = await this.ranker.rank(extractedImages);
        
        let portraitSafe = true;
        let fitMode = 'cover';
        let imageScore = 0;
        
        if (bestImage) {
            imageScore = bestImage.score;
            
            // 3. Portrait Safety
            const safetyInfo = await this.safety.checkSafety(bestImage);
            portraitSafe = safetyInfo.safe;
            
            // 4. Mobile Viewport Composition
            fitMode = this.viewport.calculateFit(bestImage, safetyInfo);
        }
        
        // 5. Layout Recommendation
        const recommendedTemplate = this.layout.recommend(aiDraft);
        
        return new VisualDraft({
            selectedImage: bestImage ? bestImage.url : null,
            imageScore,
            portraitSafe,
            fitMode,
            recommendedTemplate,
            reason: bestImage ? 'Highest ranked valid image.' : 'No suitable images found.'
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
    console.log('--- STARTING SPRINT 3 VISUAL INTELLIGENCE BENCHMARK ---');
    const engine = new VisualIntelligenceEngine();
    
    const totalRequests = 100;
    
    const results = {
        totalProcessed: 0,
        totalImagesProcessed: 0,
        totalScore: 0,
        portraitsDetected: 0,
        totalTimeMs: 0,
        templateDistribution: {}
    };

    const dummyCategories = ['Politics', 'Economy', 'Sports', 'Technology', 'Entertainment'];
    
    for (let i = 0; i < totalRequests; i++) {
        // Mock Article
        const article = {
            images: [
                { url: 'https://mock.com/img1.jpg', type: 'opengraph', width: 1200, height: 630 },
                { url: 'https://mock.com/img2.jpg', type: 'img', width: 400, height: 400 }
            ]
        };
        // Mock AI Draft
        const aiDraft = {
            category: dummyCategories[i % dummyCategories.length]
        };
        
        const start = Date.now();
        const visualDraft = await engine.process(article, aiDraft);
        const duration = Date.now() - start;
        
        results.totalProcessed++;
        results.totalImagesProcessed += article.images.length;
        results.totalScore += visualDraft.imageScore;
        results.totalTimeMs += duration;
        
        if (!visualDraft.portraitSafe) {
            results.portraitsDetected++;
        }
        
        const tpl = visualDraft.recommendedTemplate;
        results.templateDistribution[tpl] = (results.templateDistribution[tpl] || 0) + 1;
        
        process.stdout.write(visualDraft.portraitSafe ? 'S' : 'P');
        await new Promise(r => setTimeout(r, 10)); // tiny sleep
    }
    
    console.log('\\n\\nProcessing Complete!\\n');
    
    const avgImages = results.totalImagesProcessed / results.totalProcessed;
    const avgScore = results.totalScore / results.totalProcessed;
    const portraitRate = (results.portraitsDetected / results.totalProcessed) * 100;
    const avgTime = results.totalTimeMs / results.totalProcessed;
    
    console.log('=== VISUAL INTELLIGENCE BENCHMARK REPORT ===');
    console.log(\`Total Processed       : \${results.totalProcessed}\`);
    console.log(\`Average Images/Art    : \${avgImages.toFixed(1)}\`);
    console.log(\`Average Image Score   : \${avgScore.toFixed(1)}\`);
    console.log(\`Portrait Detect Rate  : \${portraitRate.toFixed(2)}%\`);
    console.log(\`Processing Time (Avg) : \${avgTime.toFixed(2)} ms/article\`);
    
    console.log('\\nTemplate Distribution:');
    for (const [k, v] of Object.entries(results.templateDistribution)) {
        console.log(\`- \${k} : \${v}\`);
    }
    console.log('============================================');
}

runVisualBenchmark();
  `
};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(filepath, content.trim());
}

console.log('Sprint 3 Visual Intelligence files created.');
