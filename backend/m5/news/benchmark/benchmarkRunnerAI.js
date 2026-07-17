const fs = require('fs');
const path = require('path');
const NewsAIEngine = require('../ai/NewsAIEngine');

async function runAIBenchmark() {
    console.log('--- STARTING SPRINT 2.1 AI BENCHMARK ---');
    // Using devMode=true because we have a mock API key. 
    // In production, this would be false and require a real key.
    const engine = new NewsAIEngine('AQ.Ab8RN6IjhrhBH_KkLdK5JDloNKhchpt6MnQQRvRwxttvq_7v-Q', true);
    
    // We will generate 100 test requests from a generic dummy article body.
    const totalRequests = 100;
    
    const results = {
        totalProcessed: 0,
        success: 0,
        failed: 0,
        totalTimeMs: 0,
        totalTokens: 0,
        cacheHit: 0,
        cacheMiss: 0,
        totalRetries: 0,
        providerStats: {}
    };

    // To properly test Cache Hits vs Misses, we will use 5 unique bodies repeated 20 times.
    const bodies = [
        "Jokowi meresmikan bendungan baru di Jawa Barat hari ini...",
        "Timnas Indonesia menang melawan Vietnam dengan skor 2-0...",
        "IHSG ditutup menguat pada perdagangan akhir pekan...",
        "KPK melakukan operasi tangkap tangan terhadap bupati...",
        "Cuaca ekstrem melanda Jakarta dan sekitarnya mengakibatkan banjir..."
    ];

    for (let i = 0; i < totalRequests; i++) {
        const body = bodies[i % bodies.length];
        const res = await engine.processArticle({ body, url: 'test_' + (i % bodies.length) });
        
        results.totalProcessed++;
        
        if (res.success) {
            results.success++;
            if (!res.isCacheHit) {
                results.totalTimeMs += res.timeMs;
                results.totalTokens += res.tokens;
            }
            results.totalRetries += res.retries;
            
            if (res.isCacheHit) results.cacheHit++;
            else results.cacheMiss++;
            
            const provKey = `${res.draft.provider} (${res.draft.model})`;
            results.providerStats[provKey] = (results.providerStats[provKey] || 0) + 1;
            
            process.stdout.write(res.isCacheHit ? 'C' : 'A');
        } else {
            results.failed++;
            process.stdout.write('F');
        }
    }
    
    console.log('\nProcessing Complete!\n');
    
    const avgLatency = results.totalTimeMs / (results.cacheMiss || 1);
    const avgTokens = results.totalTokens / (results.cacheMiss || 1);
    const successRate = (results.success / results.totalProcessed) * 100;
    
    console.log('=== AI BENCHMARK REPORT ===');
    console.log(`Total Processed : ${results.totalProcessed}`);
    console.log(`Success Rate    : ${successRate.toFixed(2)}%`);
    console.log(`Latency (Avg)   : ${avgLatency.toFixed(2)} ms`);
    console.log(`Token Usage     : ${avgTokens.toFixed(0)} tokens/req`);
    console.log(`Cache Hits      : ${results.cacheHit}`);
    console.log(`Cache Misses    : ${results.cacheMiss}`);
    console.log(`Total Retries   : ${results.totalRetries}`);
    
    console.log('\nProvider Usage:');
    for (const [k, v] of Object.entries(results.providerStats)) {
        console.log(`- ${k} : ${v} requests`);
    }
    console.log('===========================');
}

runAIBenchmark();