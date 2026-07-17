const fs = require('fs');
const path = require('path');

const cardDir = path.join(__dirname, 'backend/m5/news/card');
const templatesDir = path.join(cardDir, 'templates');
const benchmarkDir = path.join(__dirname, 'backend/m5/news/benchmark');

[cardDir, templatesDir, benchmarkDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Create Template JSONs
const templates = ['Portrait', 'Business', 'Sports', 'Magazine', 'Minimal', 'Standard'];
templates.forEach(t => {
    const tpl = {
        name: t,
        version: "1.0",
        elements: [
            { type: "image", bind: "selectedImage", mode: "fitMode" },
            { type: "text", bind: "headline", role: "title" },
            { type: "text", bind: "summary", role: "body" },
            { type: "badge", bind: "category" }
        ],
        layoutConfig: {
            direction: t === 'Portrait' ? 'column' : 'row',
            alignment: 'center'
        }
    };
    fs.writeFileSync(path.join(templatesDir, `${t.toLowerCase()}.json`), JSON.stringify(tpl, null, 2));
});

const files = {
  [path.join(cardDir, 'CardState.js')]: `
class CardState {
    constructor(data = {}) {
        this.headline = data.headline || '';
        this.summary = data.summary || '';
        this.badge = data.badge || '';
        this.image = data.image || '';
        this.source = data.source || '';
        
        this.theme = data.theme || 'Light';
        this.colors = data.colors || {};
        this.typography = data.typography || {};
        this.spacing = data.spacing || {};
        this.shadow = data.shadow || '';
        this.radius = data.radius || '';
        
        this.safeArea = data.safeArea || null;
        this.viewport = data.viewport || { width: 390, height: 844 };
        this.imageMode = data.imageMode || 'cover';
        
        this.layout = data.layout || 'Standard';
        this.template = data.template || null;
        
        this.validationWarnings = data.validationWarnings || [];
        this.overflowCount = data.overflowCount || 0;
    }
}
module.exports = CardState;
  `,

  [path.join(cardDir, 'LayoutFactory.js')]: `
class LayoutFactory {
    determineLayout(aiDraft) {
        const cat = (aiDraft.category || '').toLowerCase();
        
        if (cat.includes('politi')) return 'Portrait';
        if (cat.includes('ekonomi') || cat.includes('bisnis')) return 'Business';
        if (cat.includes('sport') || cat.includes('bola')) return 'Sports';
        if (cat.includes('hiburan') || cat.includes('seleb')) return 'Magazine';
        if (cat.includes('tekno') || cat.includes('tech')) return 'Minimal';
        
        return 'Standard';
    }
}
module.exports = LayoutFactory;
  `,

  [path.join(cardDir, 'ThemeEngine.js')]: `
class ThemeEngine {
    applyTheme(themeName) {
        const themes = {
            'Dark': {
                colors: { bg: '#121212', text: '#ffffff', accent: '#3b82f6' },
                shadow: 'none', radius: '8px'
            },
            'Light': {
                colors: { bg: '#ffffff', text: '#111827', accent: '#2563eb' },
                shadow: '0 4px 6px rgba(0,0,0,0.1)', radius: '12px'
            },
            'Glass': {
                colors: { bg: 'rgba(255,255,255,0.2)', text: '#000000', accent: '#ffffff' },
                shadow: '0 8px 32px rgba(31,38,135,0.37)', radius: '16px'
            },
            'Breaking News': {
                colors: { bg: '#dc2626', text: '#ffffff', accent: '#ffffff' },
                shadow: '0 4px 6px rgba(0,0,0,0.3)', radius: '4px'
            }
        };
        
        const base = themes[themeName] || themes['Light'];
        return {
            theme: themeName,
            colors: base.colors,
            shadow: base.shadow,
            radius: base.radius,
            typography: { fontTitle: 'Inter, sans-serif', fontBody: 'Roboto, sans-serif' },
            spacing: { padding: '16px', margin: '8px' }
        };
    }
}
module.exports = ThemeEngine;
  `,

  [path.join(cardDir, 'TemplateManager.js')]: `
const fs = require('fs');
const path = require('path');

class TemplateManager {
    constructor() {
        this.templatesDir = path.join(__dirname, 'templates');
        this.cache = {};
    }
    
    load(layoutName) {
        if (this.cache[layoutName]) return this.cache[layoutName];
        
        const file = path.join(this.templatesDir, \`\${layoutName.toLowerCase()}.json\`);
        if (fs.existsSync(file)) {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            this.cache[layoutName] = data;
            return data;
        }
        
        // Fallback
        const fallback = path.join(this.templatesDir, 'standard.json');
        return JSON.parse(fs.readFileSync(fallback, 'utf8'));
    }
}
module.exports = TemplateManager;
  `,

  [path.join(cardDir, 'ResponsiveEngine.js')]: `
class ResponsiveEngine {
    scale(viewport, baseViewport = { width: 390, height: 844 }) {
        // Desktop, Tablet, Phone live scaling logic
        // For Card State generation, we calculate a scale factor based on width
        const scaleX = viewport.width / baseViewport.width;
        const scaleY = viewport.height / baseViewport.height;
        
        return {
            scaleX,
            scaleY,
            deviceType: viewport.width >= 1024 ? 'Desktop' : (viewport.width >= 768 ? 'Tablet' : 'Phone')
        };
    }
}
module.exports = ResponsiveEngine;
  `,

  [path.join(cardDir, 'CardValidator.js')]: `
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
  `,

  [path.join(cardDir, 'CardGenerationEngine.js')]: `
const LayoutFactory = require('./LayoutFactory');
const ThemeEngine = require('./ThemeEngine');
const TemplateManager = require('./TemplateManager');
const CardValidator = require('./CardValidator');
const ResponsiveEngine = require('./ResponsiveEngine');
const CardState = require('./CardState');

class CardGenerationEngine {
    constructor() {
        this.layoutFactory = new LayoutFactory();
        this.themeEngine = new ThemeEngine();
        this.templateManager = new TemplateManager();
        this.validator = new CardValidator();
        this.responsive = new ResponsiveEngine();
    }
    
    async generate(articleObject, aiDraft, visualDraft, targetViewport = { width: 390, height: 844 }) {
        const start = Date.now();
        
        // 1. Determine Layout
        const layout = this.layoutFactory.determineLayout(aiDraft);
        
        // 2. Load Template
        const templateDef = this.templateManager.load(layout);
        
        // 3. Select Theme (Mocking dynamic selection based on category or default)
        let themeName = 'Light';
        if (aiDraft.category === 'Technology') themeName = 'Dark';
        if (aiDraft.category === 'Entertainment') themeName = 'Glass';
        if ((aiDraft.keywords || []).includes('breaking')) themeName = 'Breaking News';
        
        const themeProps = this.themeEngine.applyTheme(themeName);
        
        // 4. Responsive Scaling
        const responsiveInfo = this.responsive.scale(targetViewport);
        
        // 5. Build Initial Card State
        let rawState = new CardState({
            headline: aiDraft.headline,
            summary: aiDraft.summary,
            badge: aiDraft.category,
            image: visualDraft.selectedImage,
            source: articleObject.source || articleObject.domain,
            
            theme: themeProps.theme,
            colors: themeProps.colors,
            typography: themeProps.typography,
            spacing: themeProps.spacing,
            shadow: themeProps.shadow,
            radius: themeProps.radius,
            
            safeArea: visualDraft.safeArea,
            viewport: targetViewport,
            imageMode: visualDraft.fitMode,
            
            layout: layout,
            template: templateDef
        });
        
        // 6. Validate & Self-Correct Overflows
        const validationResult = this.validator.validate(rawState);
        const finalState = validationResult.cardState;
        
        const duration = Date.now() - start;
        
        return {
            success: true,
            cardState: finalState,
            validationPass: validationResult.isValid,
            warnings: validationResult.warnings,
            overflowCount: validationResult.overflowCount,
            timeMs: duration
        };
    }
}
module.exports = CardGenerationEngine;
  `,

  [path.join(benchmarkDir, 'benchmarkRunnerCard.js')]: `
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
    
    console.log('\\n\\nProcessing Complete!\\n');
    
    const avgTime = results.totalTimeMs / results.totalProcessed;
    const passRate = (results.validationPass / results.totalProcessed) * 100;
    
    console.log('=== CARD GENERATION BENCHMARK REPORT ===');
    console.log(\`Total Processed       : \${results.totalProcessed}\`);
    console.log(\`Validation Pass Rate  : \${passRate.toFixed(2)}%\`);
    console.log(\`Average Generation Time: \${avgTime.toFixed(2)} ms/card\`);
    console.log(\`Total Overflows Fixed : \${results.totalOverflows}\`);
    
    console.log('\\nTemplate Usage:');
    for (const [k, v] of Object.entries(results.templateUsage)) {
        console.log(\`- \${k} : \${v}\`);
    }
    console.log('========================================');
}

runCardBenchmark();
  `
};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(filepath, content.trim());
}

console.log('Sprint 4 Card Engine files created.');
