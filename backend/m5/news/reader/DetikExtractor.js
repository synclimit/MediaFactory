const cheerio = require('cheerio');
const ArticleSchema = require('./ArticleSchema');

class DetikExtractor {
    async extract(html, url) {
        const $ = cheerio.load(html);
        
        // Remove Detik specific noise
        $('.detail__inline-video, .video-20sec, .paradetail, .box-embed, .detail__related, script, style').remove();
        
        const title = $('meta[property="og:title"]').attr('content') || $('h1.detail__title').text().trim();
        const publishDate = $('meta[name="publishdate"]').attr('content') || $('div.detail__date').text().trim();
        const author = $('meta[name="author"]').attr('content') || $('div.detail__author').text().trim();
        
        let bodyText = '';
        $('.detail__body-text p').each((i, el) => {
            const text = $(el).text().trim();
            // Skip bold prefixes like "Jakarta -"
            const cleanText = text.replace(/^([A-Za-z\s]+)\s?-\s?/, '');
            if (cleanText.length > 20 && !cleanText.includes('Baca juga:')) {
                bodyText += cleanText + '\n\n';
            }
        });

        const images = [];
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) images.push({ url: ogImage, type: 'opengraph' });

        return new ArticleSchema({
            url,
            domain: 'detik.com',
            source: 'Detik',
            title,
            author,
            body: bodyText.trim(),
            publishDate,
            images,
            metadata: { method: 'DetikExtractor' }
        });
    }
}

module.exports = DetikExtractor;
