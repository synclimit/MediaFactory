import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  try {
    await page.goto('http://localhost:5178/m5');
    console.log('Page loaded');
    
    // Evaluate a script to find the exact button with text "Save Folder (GFolder)" and click it
    const result = await page.evaluate(async () => {
      // Find the button
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent.includes('Save Folder (GFolder)'));
      if (!span) return 'Span not found';
      
      const btn = span.parentElement.querySelector('button');
      if (!btn) return 'Button not found';
      
      // Override alert to capture it
      window.capturedAlert = null;
      window.alert = (msg) => { window.capturedAlert = msg; };
      
      btn.click();
      
      // Wait for a bit
      await new Promise(r => setTimeout(r, 2000));
      return window.capturedAlert || 'No alert';
    });
    
    console.log('Click result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
  
  await browser.close();
})();
