import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--autoplay-policy=no-user-gesture-required'] 
    });
    
    const page = await browser.newPage();
    
    // Listen to console logs from the browser
    page.on('console', msg => {
        if (msg.text().startsWith('BEAT_DATA:')) {
            console.log(msg.text());
        }
    });

    console.log("Navigating to http://localhost:5173/");
    try {
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log("Page loaded. Injecting script to intercept beatEngine...");
        await page.evaluate(() => {
            if (window.beatEngine) {
                console.log("BEAT_DATA: Hooking into beatEngine...");
                let beatCount = 0;
                window.beatEngine.onBeat((ev) => {
                    beatCount++;
                    // Only log the first 20 beats to avoid spam
                    if (beatCount <= 20) {
                        console.log(`BEAT_DATA: Beat #${beatCount} - raw confidence from BeatEngine = ${ev.confidence}, type: ${ev.type}`);
                    }
                });
            } else {
                console.log("BEAT_DATA: window.beatEngine is not available on this page.");
            }
        });
        
        console.log("Waiting 10 seconds for user/app to play audio...");
        await new Promise(r => setTimeout(r, 10000));
        
    } catch (e) {
        console.log("Error navigating or evaluating:", e.message);
    } finally {
        await browser.close();
        console.log("Puppeteer closed.");
    }
})();
