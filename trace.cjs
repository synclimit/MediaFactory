const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('YT_METADATA_RESPONSE') || 
        text.includes('METADATA_FETCH_RESULT') || 
        text.includes('SOURCE_BEFORE_SAVE') || 
        text.includes('SOURCE_AFTER_SAVE') || 
        text.includes('LOCALSTORAGE_WRITE') || 
        text.includes('LOCALSTORAGE_READ') ||
        text.includes('GENERATE_PREVIEW_SOURCE') ||
        text.includes('SOURCE_LOADED')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:5175');
  
  // Clear any existing
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  // Add URL via code instead of UI click
  await page.evaluate(async () => {
    await window.__MF_FOUNDATION__.sourceService.addYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { workspaceId: 'w1', userId: 'u1' });
  });

  // Wait 8 seconds for backend to process
  await new Promise(r => setTimeout(r, 8000));

  await browser.close();
})();
