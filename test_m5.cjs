const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  try {
    console.log("Connecting to localhost:18888...");
    // We launch a new browser to hit the local server.
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: "new",
      defaultViewport: { width: 1366, height: 768 }
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:18888');
    
    console.log("Waiting for WorkspacePicker...");
    // Let's click the workspace "TEST 1" or whatever is there
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Evaluate to click the "TEST 1" workspace specifically, or just double click it
    await page.evaluate(() => {
       const w = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('TEST 1') || el.textContent.includes('TEST'));
       if (w) w.closest('div.group').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));
    });
    
    console.log("Waiting for main dashboard (M5 CREATE)...");
    const delay = ms => new Promise(r => setTimeout(r, ms));
    await delay(1000);
    // Click M5 CREATE tab
    await page.evaluate(() => {
       const tab = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('M5 :'));
       if (tab) tab.click();
    });
    
    await delay(1000);
    
    // Click GENERATE QUEUE button
    console.log("Clicking GENERATE QUEUE...");
    await page.evaluate(() => {
       const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('GENERATE QUEUE'));
       if (btn) btn.click();
    });
    
    // Click START RENDERING button
    console.log("Clicking START RENDERING...");
    await page.evaluate(() => {
       const renderBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('START RENDERING'));
       if (renderBtn) renderBtn.click();
    });
    
    console.log("Waiting 15 seconds for render to complete...");
    await delay(15000); // 15 seconds wait
    
    const screenshotPath = 'C:\\Users\\Server Abal\\.gemini\\antigravity-ide\\brain\\557fa218-5dd2-442e-95b9-8394aab7736d\\render_proof_cta.png';
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved to: " + screenshotPath);
    
    await browser.close();
    
  } catch (err) {
    console.error(err);
  }
})();
