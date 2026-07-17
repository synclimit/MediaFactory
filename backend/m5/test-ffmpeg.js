const { spawn } = require('child_process');
const fs = require('fs');
const RenderGraphBuilder = require('./ffmpeg/RenderGraphBuilder');
const FilterGraphBuilder = require('./ffmpeg/builders/FilterGraphBuilder');
const CommandBuilder = require('./ffmpeg/builders/CommandBuilder');

const recipe = {
    timeline: {
        segments: [
            { type: 'hook', duration: 5, visualEffects: [{ type: 'ScaleNode', params: { zoom: 1.1 } }] },
            { type: 'main', duration: 10, visualEffects: [] },
            { type: 'cta', duration: 5, visualEffects: [{ type: 'ScaleNode', params: { zoom: 1.1 } }] }
        ]
    },
    assets: {
        hook: { absolutePath: 'd:/MediaFactory/dummy_audio.mp4', assetId: '1', duration: 5 },
        main: { absolutePath: 'd:/MediaFactory/dummy_audio.mp4', assetId: '2', duration: 10 },
        cta: { absolutePath: 'd:/MediaFactory/dummy_audio.mp4', assetId: '3', duration: 5 }
    },
    output: { canvasWidth: 1080, canvasHeight: 1920 }
};

const optimizationPlan = {
    preferredEncoder: 'libx264',
    resolution: { width: 1080, height: 1920 }
};

const rgBuilder = new RenderGraphBuilder();
rgBuilder.run = (c, n, fn) => fn(); // mock run
const context = {};

try {
    const renderGraph = rgBuilder.buildGraph(context, recipe, optimizationPlan);
    const filterGraph = FilterGraphBuilder.build(renderGraph);
    const command = CommandBuilder.build(renderGraph, filterGraph, 'libx264');
    
    // Simulate Renderer split
    const args = command.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, ''));
    args.splice(1, 0, '-progress', 'pipe:1');
    args.push('-y', 'out.mp4');
    
    console.log("Running:", args.join(' '));
    const ffProc = spawn(args[0], args.slice(1));
    ffProc.stderr.on('data', d => process.stdout.write(d));
    ffProc.on('close', code => console.log('FFmpeg exited with code', code));

} catch (e) {
    console.error(e);
}
