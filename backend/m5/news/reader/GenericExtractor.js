const cheerio = require('cheerio');
const ArticleSchema = require('./ArticleSchema');

class GenericExtractor {
    async extract(html, url) {
        const $ = cheerio.load(html);
        
        // Remove common noisy elements
        $('script, style, noscript, nav, header, footer, aside, .sidebar, .ads, #comments').remove();

        // Extract metadata
        const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        const publishDate = $('meta[property="article:published_time"]').attr('content') || null;
        
        // Naive body extraction
        let bodyText = '';
        $('article p, .article-content p, .entry-content p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 20) {
                bodyText += text + '\n\n';
            }
        });
        
        // Fallback body extraction
        if (!bodyText) {
            $('p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 50) {
                    bodyText += text + '\n\n';
                }
            });
        }

        // Basic image extraction for generic fallback
        const images = [];
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) images.push({ url: ogImage, type: 'opengraph' });

        return new ArticleSchema({
            url,
            domain: new URL(url).hostname,
            source: 'Generic',
            title,
            body: bodyText.trim(),
            publishDate,
            images,
            metadata: { method: 'GenericExtractor' }
        });
    }
}

module.exports = GenericExtractor;
