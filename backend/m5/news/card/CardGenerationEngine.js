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