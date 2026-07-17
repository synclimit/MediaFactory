const RenderPipeline = require('./backend/m5/RenderPipeline');
const dbEngine = require('./backend/m5/Database');
const LibraryScanner = require('./backend/m5/LibraryScanner');
const path = require('path');

async function test() {
    await dbEngine.init();
    
    const mockFolder = path.resolve('d:/MediaFactory/mock').replace(/\\/g, '/');
    await LibraryScanner.scanFolder('mock', mockFolder, 'videoA');
    await LibraryScanner.scanFolder('mock', mockFolder, 'videoB');

    const job = {
        id: 999,
        type: 'render',
        formula: 'INTERRUPT',
        quality: 'Best Quality',
        duration: '60 Detik (Short)',
        resolution: '720x1280 (9:16)',
        fps: '30 FPS',
        variationLevel: 'Medium (Normal)',
        libraryFolders: {
            videoA: [{ name: 'mock', path: mockFolder }],
            videoB: [{ name: 'mock', path: mockFolder }]
        },
        hookFile: path.resolve('d:/MediaFactory/mock/hook.mp4').replace(/\\/g, '/'),
        ctaFile: path.resolve('d:/MediaFactory/mock/cta.mp4').replace(/\\/g, '/')
    };

    try {
        const snap = await RenderPipeline.prepareJobSnapshot(job);
        console.log("SUCCESS:", snap);
    } catch(e) {
        console.error("FAILED ERROR STACK:", e.stack);
    }
}
test();
