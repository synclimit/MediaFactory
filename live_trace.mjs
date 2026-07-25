import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function run() {
    console.log("Starting Vite dev server...");
    const vite = spawn('npm', ['run', 'dev'], { cwd: 'd:\\MediaFactory', shell: true });
    
    // Give Vite 3 seconds to start
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Add console listener
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/m3', { waitUntil: 'networkidle2' }); // Or just / depending on routing
    
    console.log("Waiting 5 seconds for M3PreviewCanvas to mount and run RAF loop...");
    await new Promise(r => setTimeout(r, 5000));
    
    console.log("Extracting live trace data...");
    const traceData = await page.evaluate(() => {
        return {
            rafLog: window.__liveLog || [],
            beatTrace: window.__liveBeatTrace || []
        };
    });
    
    console.log(`Extracted ${traceData.rafLog.length} RAF frames and ${traceData.beatTrace.length} BeatEngine updates.`);
    
    import('fs').then(fs => {
        fs.writeFileSync('C:\\Users\\Server Abal\\.gemini\\antigravity-ide\\brain\\c485a603-674e-48ed-b783-ecbaac45f185\\scratch\\live_trace_output.json', JSON.stringify(traceData, null, 2));
    });
    
    await browser.close();
    vite.kill();
    console.log("Done.");
}

run().catch(console.error);
