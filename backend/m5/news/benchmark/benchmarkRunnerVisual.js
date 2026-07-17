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
    
    console.log('\n\nProcessing Complete!\n');
    
    const avgFaces = results.totalFaces / results.totalProcessed;
    const smartCropPct = (results.smartCropUsage / results.totalProcessed) * 100;
    const containBlurPct = (results.containBlurUsage / results.totalProcessed) * 100;
    const semanticPct = (results.semanticMatchCount / results.totalProcessed) * 100;
    
    console.log('=== VISUAL HARDENING BENCHMARK REPORT ===');
    console.log(`Total Processed       : ${results.totalProcessed}`);
    console.log(`Average Face Count    : ${avgFaces.toFixed(2)} faces/art`);
    console.log(`Semantic Match Rate   : ${semanticPct.toFixed(2)}%`);
    console.log(`Smart Crop Usage      : ${smartCropPct.toFixed(2)}%`);
    console.log(`Contain Blur Usage    : ${containBlurPct.toFixed(2)}%`);
    
    console.log('\nImage Source Distribution:');
    for (const [k, v] of Object.entries(results.imageSources)) {
        console.log(`- ${k} : ${v}`);
    }
    console.log('=========================================');
}

runVisualBenchmark();