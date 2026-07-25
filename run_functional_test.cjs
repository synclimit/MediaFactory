const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const results = {
    navigation: {},
    isolatedRender: {},
  };

  try {
    // 1. Test Isolated Mount
    await page.goto('http://localhost:5176/test_mount.html', { waitUntil: 'networkidle0' });
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('BROWSER_ERROR:', msg.text());
    });
    
    const isolatedState = await page.evaluate(() => window.__TEST_RESULTS__);
    results.isolatedRender = isolatedState || { renderSuccess: false, error: 'No results object found, script might have failed to load.' };

    // 2. Test Main App
    await page.goto('http://localhost:5176', { waitUntil: 'networkidle0' });
    const appState = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('*')).map(el => el.textContent || '');
      const fullText = texts.join(' ');
      return {
        hasNavigation: !!document.querySelector('nav') || fullText.includes('VISUALIZER'),
        hasFXPresetTab: fullText.includes('FX Preset'),
        hasInspector: fullText.includes('INSPECTOR'),
        hasEngines: fullText.includes('Atmosphere') || typeof window.__VUE__ !== 'undefined' // checking for hints
      };
    });
    results.navigation = appState;

  } catch (err) {
    results.error = err.message;
  }
  
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
