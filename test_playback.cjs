const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    
    // Capture console
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err));
    
    // Open localhost
    await page.goto('http://localhost:18888');
    
    // Wait for load
    await new Promise(r => setTimeout(r, 2000));
    
    // Go to M3
    const m3Tab = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, div')).filter(el => el.textContent && el.textContent.includes('M3 :'));
        if (tabs.length > 0) { tabs[0].click(); return true; }
        return false;
    });
    console.log('Clicked M3 Tab:', m3Tab);
    await new Promise(r => setTimeout(r, 1000));
    
    // Find and click Play button
    const playBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const play = btns.find(b => b.textContent.includes('▶ Play'));
        if (play) {
            play.click();
            return true;
        }
        return false;
    });
    console.log('Clicked Play:', playBtn);
    
    await new Promise(r => setTimeout(r, 3000));
    
    const isPlaying = await page.evaluate(() => window.m3IsPlaying);
    console.log('isPlaying state:', isPlaying);
    
    const audioSrc = await page.evaluate(() => {
        const aud = document.querySelector('audio');
        return aud ? aud.src : null;
    });
    console.log('Audio Src:', audioSrc);

    await browser.close();
})();
