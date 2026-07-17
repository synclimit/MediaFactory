import re

with open('backend/api/m5.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure not to duplicate
if '/api/v1/m5/news/draft' not in content:
    imports = """
const PipelineManager = require('../m5/news/pipeline/PipelineManager');
const NewsReaderEngine = require('../m5/news/reader/NewsReaderEngine');
const NewsAIEngine = require('../m5/news/ai/NewsAIEngine');
const VisualIntelligenceEngine = require('../m5/news/image/VisualIntelligenceEngine');
const CardGenerationEngine = require('../m5/news/card/CardGenerationEngine');

// Instantiate engines
const readerEngine = new NewsReaderEngine();
// Use a mock API key for dev mode
const aiEngine = new NewsAIEngine('API_KEY', true); 
const visualEngine = new VisualIntelligenceEngine();
const cardEngine = new CardGenerationEngine();
"""
    # Insert imports after existing requires
    content = content.replace("const dbEngine = require('../m5/Database');", "const dbEngine = require('../m5/Database');\n" + imports)

    route_code = """
router.post('/api/v1/m5/news/draft', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[M5 News Pipeline] Starting pipeline for ${url}`);
    
    const pipeline = new PipelineManager();
    
    // Listen to progress updates by periodically polling the progress object, or just emitting when runner finishes
    // Actually PipelineManager updates its `progress` object synchronously inside runner.
    // We can poll it or just hook into the dependencies.
    
    const broadcastProgress = () => {
        broadcastSseEvent('news_progress', { stages: pipeline.progress.stages });
    };

    const mockDependencies = {
        reader: async (targetUrl) => {
            broadcastProgress();
            const res = await readerEngine.read(targetUrl);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'reader', data: res.article });
            return res.article;
        },
        ai: async (article) => {
            broadcastProgress();
            const res = await aiEngine.processArticle(article);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'ai', data: res.draft });
            return res.draft;
        },
        visual: async (article, aiDraft) => {
            broadcastProgress();
            const res = await visualEngine.process(article, aiDraft);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'visual', data: res.draft });
            return res.draft;
        },
        card: async (article, aiDraft, visualDraft) => {
            broadcastProgress();
            const res = await cardEngine.generate(article, aiDraft, visualDraft);
            if (!res.success) throw new Error(res.error);
            broadcastSseEvent('news_draft_update', { module: 'card', data: res.state });
            return res.state;
        },
        editor: async (cardState) => {
            broadcastProgress();
            // Trivial pass-through for editor engine
            return cardState;
        }
    };

    // Run asynchronously
    pipeline.startWorkflow(url, mockDependencies).then(result => {
        broadcastProgress();
        broadcastSseEvent('news_pipeline_complete', result);
    }).catch(err => {
        broadcastProgress();
        broadcastSseEvent('news_pipeline_error', { error: err.message });
    });

    res.json({ success: true, message: 'Pipeline started' });
});

module.exports = { router, broadcastSseEvent, m5Queue };
"""
    # Replace module.exports line with the new route
    content = content.replace("module.exports = { router, broadcastSseEvent, m5Queue };", route_code)

    with open('backend/api/m5.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Backend API updated!")
else:
    print("API already exists.")
