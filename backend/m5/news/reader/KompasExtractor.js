const cheerio = require('cheerio');
const ArticleSchema = require('./ArticleSchema');

class KompasExtractor {
    async extract(html, url) {
        const $ = cheerio.load(html);
        
        $('.video-container, .ads, .read__right, script, style, .photo__caption').remove();
        
        const title = $('meta[property="og:title"]').attr('content') || $('h1.read__title').text().trim();
        const publishDate = $('meta[name="content_pubdate"]').attr('content') || $('.read__time').text().trim();
        const author = $('meta[name="author"]').attr('content') || $('#penulis').text().trim();
        
        let bodyText = '';
        $('.read__content p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 20 && !text.includes('Baca juga:')) {
                bodyText += text + '\n\n';
            }
        });

        const images = [];
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) images.push({ url: ogImage, type: 'opengraph' });

        return new ArticleSchema({
            url,
            domain: 'kompas.com',
            source: 'Kompas',
            title,
            author,
            body: bodyText.trim(),
            publishDate,
            images,
            metadata: { method: 'KompasExtractor' }
        });
    }
}

module.exports = KompasExtractor;
