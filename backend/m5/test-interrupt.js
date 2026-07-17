const { spawn } = require('child_process');
const fs = require('fs');
const RenderGraphBuilder = require('./ffmpeg/RenderGraphBuilder');
const FilterGraphBuilder = require('./ffmpeg/builders/FilterGraphBuilder');
const CommandBuilder = require('./ffmpeg/builders/CommandBuilder');

const recipe = {
    timeline: {
        segments: [
            { type: 'hook', start: 0, end: 2, duration: 2, trimStart: 0, trimEnd: 2, visualEffects: [] },
            { type: 'main', start: 2, end: 10, duration: 8, trimStart: 0, trimEnd: 8, visualEffects: [] },
            { type: 'cta', start: 10, end: 12, duration: 2, trimStart: 0, trimEnd: 2, visualEffects: [] },
            { type: 'main', start: 12, end: 30, duration: 18, trimStart: 8, trimEnd: 26, visualEffects: [] }
        ]
    },
    assets: {
        hook: { absolutePath: 'd:/MediaFactory/test_bg.mp4', assetId: '1', duration: 10, type: 'video' },
        videoA: { absolutePath: 'd:/MediaFactory/test_bg.mp4', assetId: '2', duration: 30, type: 'video' },
        cta: { absolutePath: 'd:/MediaFactory/test_bg.mp4', assetId: '3', duration: 88, type: 'video' }
    },
    layout: { type: 'INTERRUPT' },
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
    
    console.log("Filter Complex:");
    console.log(filterGraph.compile());
    
    const args = command.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/^"|"$/g, ''));
    
    console.log("\nCommand:");
    console.log(args.join(' '));

} catch (e) {
    console.error(e);
}
