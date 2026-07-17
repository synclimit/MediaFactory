const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('NAMING_PATTERN_SELECTED') || 
        text.includes('RENDER_NAME_INPUT_TRACKS') || 
        text.includes('RENDER_NAME_RESULT') ||
        text.includes('PREVIEW_SOURCES') ||
        text.includes('BUILDMIX_INPUT') ||
        text.includes('BUILDMIX_RESULT')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:5175');
  
  // Wait for load
  await new Promise(r => setTimeout(r, 2000));

  // Switch to M2 tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a, div'));
    const m2Tab = tabs.find(t => t.textContent.trim() === 'M2');
    if (m2Tab) m2Tab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Generate Preview
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const genBtn = btns.find(b => b.textContent.includes('Generate Preview'));
    if (genBtn) genBtn.click();
  });

  // Wait for processing
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
