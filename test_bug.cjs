const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    await page.goto('http://localhost:18888');
    const result = await page.evaluate(() => {
        const audio = document.createElement('audio');
        const targetSrc = '/api/m2/stream?uri=C%3A%2Fsome%2Fpath.mp3';
        audio.src = targetSrc;
        return {
            assigned: targetSrc,
            propertySrc: audio.src,
            endsWithOriginal: audio.src.endsWith(targetSrc),
            getAttributeMatches: audio.getAttribute('src') === targetSrc
        };
    });
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
})();
