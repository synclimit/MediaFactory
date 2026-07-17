import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  page.on('response', response => {
    if (response.url().includes('/api/m2/dialog/folder')) {
      console.log('RESPONSE:', response.status(), response.url());
    }
  });

  try {
    await page.goto('http://localhost:5178/m5');
    console.log('Page loaded');
    await page.waitForSelector('button', { timeout: 5000 });
    
    // Find the button with text containing "Save Folder (GFolder)" or similar
    // Actually, just find any button that might be it.
    // The button doesn't have text, it just wraps an icon?
    // Wait, let's just evaluate a fetch directly in the page to see if it fails!
    const result = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/m2/dialog/folder', { method: 'POST' });
        return { ok: res.ok, status: res.status };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('Fetch result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
  
  await browser.close();
})();
