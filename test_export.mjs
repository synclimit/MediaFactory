import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Setup download path
    const downloadPath = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);
    
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });
    
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/m3', { waitUntil: 'networkidle2' });
    
    console.log("Waiting 3 seconds for load...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Pressing Ctrl+Alt+B to open BeatDebugOverlay...");
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('b');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Clicking REC JSON button...");
    // The button text contains 'REC JSON' or 'REC ('
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const recBtn = btns.find(b => b.innerText.includes('REC JSON') || b.innerText.includes('REC ('));
        if (recBtn) recBtn.click();
    });
    
    console.log("Recording for 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Clicking EXPORT button...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const recBtn = btns.find(b => b.innerText.includes('REC ('));
        if (recBtn) recBtn.click(); // Stop recording
        
        setTimeout(() => {
            const exportBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('EXPORT'));
            if (exportBtn) exportBtn.click(); // Download
        }, 500);
    });
    
    console.log("Waiting for download...");
    await new Promise(r => setTimeout(r, 3000));
    
    const files = fs.readdirSync(downloadPath);
    const jsonFile = files.find(f => f.startsWith('zoom_calibration_') && f.endsWith('.json'));
    
    if (jsonFile) {
        console.log(`Found downloaded file: ${jsonFile}`);
        const data = JSON.parse(fs.readFileSync(path.join(downloadPath, jsonFile), 'utf-8'));
        console.log(`Exported ${data.length} frames.`);
        if (data.length > 0) {
            console.log("Sample frame keys:", Object.keys(data[0]).join(', '));
            console.log("confidence value:", data[0].confidence);
            console.log("rawPunch value:", data[0].rawPunch);
        }
    } else {
        console.log("No JSON file found in downloads.");
    }
    
    await browser.close();
    console.log("Done.");
}

run().catch(console.error);
