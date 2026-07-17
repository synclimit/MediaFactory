import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5178');
    const result = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/m2/dialog/folder', { method: 'POST' });
        return { ok: res.ok, status: res.status };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    });
    console.log('Fetch result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
  
  await browser.close();
})();
