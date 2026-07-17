const fs = require('fs');
const path = require('path');

class PromptBuilder {
    constructor(version = 'v1') {
        this.promptVersion = version;
        this.promptsDir = path.join(__dirname, 'prompts', version);
        this.systemPrompt = fs.readFileSync(path.join(this.promptsDir, 'system.txt'), 'utf8');
        this.summaryPrompt = fs.readFileSync(path.join(this.promptsDir, 'summary.txt'), 'utf8');
        this.schema = fs.readFileSync(path.join(this.promptsDir, 'schema.json'), 'utf8');
    }
    
    buildPrompt(articleText) {
        return {
            system: this.systemPrompt,
            user: `${this.summaryPrompt}\n\nSchema:\n${this.schema}\n\nArticle:\n${articleText}`,
            version: this.promptVersion
        };
    }
}
module.exports = PromptBuilder;