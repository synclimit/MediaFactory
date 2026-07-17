const fs = require('fs');
const path = require('path');

class TemplateManager {
    constructor() {
        this.templatesDir = path.join(__dirname, 'templates');
        this.cache = {};
    }
    
    load(layoutName) {
        if (this.cache[layoutName]) return this.cache[layoutName];
        
        const file = path.join(this.templatesDir, `${layoutName.toLowerCase()}.json`);
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