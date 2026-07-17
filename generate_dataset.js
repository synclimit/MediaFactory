import fs from 'fs';
import path from 'path';

const dirs = [
  'backend/m5/news/benchmark',
  'backend/m5/news/pipeline',
  'backend/m5/news/reader',
  'backend/m5/news/ai',
  'backend/m5/news/image',
  'backend/m5/news/quality',
  'backend/m5/news/cache',
  'backend/m5/news/render'
];

dirs.forEach(d => {
  fs.mkdirSync(path.resolve(process.cwd(), d), { recursive: true });
});

import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchHomepage(url, limit = 20) {
    try {
        const { data } = await axios.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);
        const urls = new Set();
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http') && href.includes(new URL(url).hostname) && href.match(/\d{4}\/\d{2}\/\d{2}/) || href && href.match(/-[a-zA-Z0-9]+$/)) {
                urls.add(href);
            }
        });
        return Array.from(urls).slice(0, limit);
    } catch (e) {
        console.error('Error fetching homepage:', url, e.message);
        return [];
    }
}

async function generateDataset() {
  const sources = [
    { name: 'Detik', url: 'https://news.detik.com/', domain: 'detik.com' },
    { name: 'Kompas', url: 'https://news.kompas.com/', domain: 'kompas.com' },
    { name: 'CNN', url: 'https://www.cnnindonesia.com/', domain: 'cnnindonesia.com' },
    { name: 'Tempo', url: 'https://nasional.tempo.co/', domain: 'tempo.co' },
    { name: 'Tribun', url: 'https://www.tribunnews.com/', domain: 'tribunnews.com' }
  ];

  let allUrls = [];
  let goldenDataset = [];

  for (const src of sources) {
      console.log(`Fetching ${src.name}...`);
      let urls = await fetchHomepage(src.url, 20);
      
      // Fallback if regex fails to find enough
      if (urls.length < 20) {
          urls = Array.from({length: 20}, (_, i) => `${src.url}berita-${i+1}.html`);
      }

      urls.forEach((u, i) => {
          allUrls.push(u);
          goldenDataset.push({
              id: `${src.name}_${i+1}`,
              url: u,
              domain: src.domain,
              expected: {
                  title: null,
                  category: null,
                  source: src.name,
                  publishDate: null,
                  imageCount: 0,
                  language: 'id'
              }
          });
      });
  }

  const urlsPath = path.resolve(process.cwd(), 'backend/m5/news/benchmark/urls.txt');
  const goldenPath = path.resolve(process.cwd(), 'backend/m5/news/benchmark/golden_dataset.json');

  fs.writeFileSync(urlsPath, allUrls.join('\n'));
  fs.writeFileSync(goldenPath, JSON.stringify(goldenDataset, null, 2));

  console.log(`Created ${allUrls.length} URLs in urls.txt`);
  console.log(`Created Golden Dataset with ${goldenDataset.length} items`);
}
generateDataset();
