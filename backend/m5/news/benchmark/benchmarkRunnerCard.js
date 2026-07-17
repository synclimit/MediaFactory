const fs = require('fs');
const path = require('path');
const CardGenerationEngine = require('../card/CardGenerationEngine');

async function runCardBenchmark() {
    console.log('--- STARTING SPRINT 4 CARD GENERATION BENCHMARK ---');
    const engine = new CardGenerationEngine();
    
    const totalRequests = 100;
    
    const results = {
        totalProcessed: 0,
        validationPass: 0,
        totalTimeMs: 0,
        totalOverflows: 0,
        templateUsage: {}
    };

    const dummyCategories = ['Politics', 'Economy', 'Sports', 'Technology', 'Entertainment'];
    
    for (let i = 0; i < totalRequests; i++) {
        const cat = dummyCategories[i % dummyCategories.length];
        
        const article = { domain: 'mocknews.com' };
        
        // Generate varying length headlines/summaries to trigger overflows
        const headline = i % 3 === 0 ? "This is an extremely long headline that will definitely cause an overflow because it is greater than eighty characters in total length." : "Short Headline";
        const summary = i % 5 === 0 ? "A".repeat(250) : "Short Summary";
        
        const aiDraft = {
            category: cat,
            headline: headline,
            summary: summary,
            keywords: ['news']
        };
        const visualDraft = {
            selectedImage: 'mock.jpg',
            fitMode: 'smart-crop',
            safeArea: {x:0, y:0, w:100, h:100}
        };
        
        const res = await engine.generate(article, aiDraft, visualDraft, { width: 390, height: 844 });
        
        results.totalProcessed++;
        results.totalTimeMs += res.timeMs;
        results.totalOverflows += res.overflowCount;
        
        if (res.validationPass) results.validationPass++;
        
        const tpl = res.cardState.layout;
        results.templateUsage[tpl] = (results.templateUsage[tpl] || 0) + 1;
        
        process.stdout.write(res.validationPass ? '.' : 'O');
        await new Promise(r => setTimeout(r, 5));
    }
    
    console.log('\n\nProcessing Complete!\n');
    
    const avgTime = results.totalTimeMs / results.totalProcessed;
    const passRate = (results.validationPass / results.totalProcessed) * 100;
    
    console.log('=== CARD GENERATION BENCHMARK REPORT ===');
    console.log(`Total Processed       : ${results.totalProcessed}`);
    console.log(`Validation Pass Rate  : ${passRate.toFixed(2)}%`);
    console.log(`Average Generation Time: ${avgTime.toFixed(2)} ms/card`);
    console.log(`Total Overflows Fixed : ${results.totalOverflows}`);
    
    console.log('\nTemplate Usage:');
    for (const [k, v] of Object.entries(results.templateUsage)) {
        console.log(`- ${k} : ${v}`);
    }
    console.log('========================================');
}

runCardBenchmark();