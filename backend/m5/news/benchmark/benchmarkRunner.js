const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NewsReaderEngine = require('../reader/NewsReaderEngine');
const NewsAIEngine = require('../ai/NewsAIEngine');

async function runBenchmark() {
    const benchmarkDir = __dirname;
    const urlsPath = path.join(benchmarkDir, 'urls.txt');
    const outputDir = path.join(benchmarkDir, 'output');
    
    if (!fs.existsSync(urlsPath)) {
        console.error('urls.txt not found.');
        return;
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const rawUrls = fs.readFileSync(urlsPath, 'utf8').split('\n').filter(u => u.trim());
    const readerEngine = new NewsReaderEngine();
    
    // Inject the API key passed by user or fallback
    const aiEngine = new NewsAIEngine('AQ.Ab8RN6IjhrhBH_KkLdK5JDloNKhchpt6MnQQRvRwxttvq_7v-Q');
    
    const results = {
        totalProcessed: 0,
        readerSuccess: 0,
        aiSuccess: 0,
        aiFailed: 0,
        totalAITimeMs: 0,
        totalAITokens: 0,
        aiCacheHit: 0,
        aiCacheMiss: 0,
        totalRetries: 0,
        savedFiles: []
    };

    console.log(`Starting Sprint 2 Benchmark for ${rawUrls.length} URLs (Reader + AI)...`);

    for (let rawUrl of rawUrls) {
        let url = rawUrl.trim();
        const urlObj = new URL(url);
        const domainClean = urlObj.hostname.replace('www.', '').replace('news.', '').replace('nasional.', '').split('.')[0];
        const domainDir = path.join(outputDir, domainClean);
        if (!fs.existsSync(domainDir)) fs.mkdirSync(domainDir, { recursive: true });

        // 1. Reader
        const readRes = await readerEngine.read(url);
        
        if (readRes.success) {
            results.readerSuccess++;
            const art = readRes.article;
            
            // 2. AI Processing
            const aiRes = await aiEngine.processArticle(art);
            
            results.totalProcessed++;
            
            if (aiRes.success) {
                results.aiSuccess++;
                results.totalAITimeMs += aiRes.timeMs;
                results.totalAITokens += aiRes.tokens;
                results.totalRetries += aiRes.retries;
                if (aiRes.isCacheHit) results.aiCacheHit++;
                else results.aiCacheMiss++;
                
                // Merge AI Draft into Article Object Schema
                art.summary = aiRes.draft.summary;
                art.headline = aiRes.draft.headline;
                art.category = aiRes.draft.category;
                art.keywords = aiRes.draft.keywords;
                art.mainEntity = aiRes.draft.mainEntity;
                art.recommendedLayout = aiRes.draft.recommendedLayout;
                
                // Save JSON
                const hash = crypto.createHash('md5').update(url).digest('hex').substring(0,8);
                const fileName = `${hash}_ai.json`;
                const filePath = path.join(domainDir, fileName);
                fs.writeFileSync(filePath, JSON.stringify(art, null, 4), 'utf8');
                
                process.stdout.write(aiRes.isCacheHit ? 'C' : 'A');
            } else {
                results.aiFailed++;
                process.stdout.write('F');
                console.error('\nAI Error:', aiRes.error);
            }
        }
        
        await new Promise(r => setTimeout(r, 10)); // tiny sleep
    }
    console.log('\nProcessing Complete!');

    // Compute AI Averages
    const avgAITime = results.totalAITimeMs / (results.aiCacheMiss || 1); // Only count actual AI calls
    const avgAITokens = results.totalAITokens / (results.aiCacheMiss || 1);
    const aiSuccessRate = (results.aiSuccess / results.totalProcessed) * 100;

    console.log('\n=== SPRINT 2 AI BENCHMARK RESULTS ===');
    console.log(`Total Processed  : ${results.totalProcessed}`);
    console.log(`AI Success Rate  : ${aiSuccessRate.toFixed(2)}%`);
    console.log(`AI Failed        : ${results.aiFailed}`);
    console.log(`Average AI Time  : ${avgAITime.toFixed(2)} ms (per non-cache call)`);
    console.log(`Average Tokens   : ${avgAITokens.toFixed(0)}`);
    console.log(`Cache Hits       : ${results.aiCacheHit}`);
    console.log(`Cache Misses     : ${results.aiCacheMiss}`);
    console.log(`Total Retries    : ${results.totalRetries}`);
    console.log('=====================================\n');

}

runBenchmark();
