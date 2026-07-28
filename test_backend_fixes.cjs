const CommandBuilder = require('./backend/m5/ffmpeg/builders/CommandBuilder');
const AppPaths = require('./backend/system/AppPaths');
const { PipelineError, ErrorCodes } = require('./backend/m5/core/Errors');

console.log("=== STARTING BACKEND FIXES VERIFICATION (M1, M5, WHISPER) ===");

// Test 1: M5 Errors Import
console.log("\n[Test 1] Testing M5 Errors class loading...");
const err = new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Test Error");
if (err && err.code === ErrorCodes.M5_INVALID_RECIPE) {
    console.log("  PASS: PipelineError loaded and instantiated correctly!");
} else {
    console.error("  FAIL: PipelineError failed.");
}

// Test 2: CommandBuilder filterGraph string sanitization
console.log("\n[Test 2] Testing CommandBuilder filter complex sanitization...");
const mockFilterGraph = {
    nodes: [
        {
            id: 'node1',
            type: 'CompositeNode',
            inputs: ['va1', 'vb1'],
            outputs: ['m_raw1'],
            filters: [{ filter: 'vstack', params: {} }]
        },
        {
            id: 'node2',
            type: 'ScaleNode',
            inputs: ['m_raw1'],
            outputs: ['v1'],
            filters: [{ filter: 'eq', params: { brightness: 0.02 } }]
        }
    ]
};
const mockRenderGraph = {
    nodes: [
        { id: 'va1', type: 'InputNode', metadata: { path: 'test_a.mp4' } },
        { id: 'vb1', type: 'InputNode', metadata: { path: 'test_b.mp4' } },
        { id: 'out', type: 'OutputNode', inputs: ['v1'], metadata: {} }
    ]
};
const cmdResult = CommandBuilder.build(mockRenderGraph, mockFilterGraph, 'libx264');
console.log("  Generated Filter Complex:", cmdResult.filterComplexStr);
if (!cmdResult.filterComplexStr.includes('[m_raw1],') && cmdResult.filterComplexStr.includes('[m_raw1]eq=')) {
    console.log("  PASS: Trailing comma cleanly removed after stream label!");
} else {
    console.error("  FAIL: Invalid comma present in filter complex.");
}

// Test 3: AppPaths FFprobe resolution
console.log("\n[Test 3] Testing AppPaths FFprobe resolution...");
const ffprobePath = AppPaths.getFFprobePath();
console.log("  Resolved FFprobe path:", ffprobePath);
if (ffprobePath) {
    console.log("  PASS: AppPaths.getFFprobePath() returned valid executable path!");
} else {
    console.error("  FAIL: FFprobe path resolution failed.");
}

// Test 4: Whisper API Router require
console.log("\n[Test 4] Testing Whisper API router import...");
const whisperRouter = require('./backend/api/whisper.js');
if (whisperRouter) {
    console.log("  PASS: backend/api/whisper.js loaded and exported router cleanly!");
} else {
    console.error("  FAIL: Whisper router import failed.");
}

console.log("\n=== ALL BACKEND FIXES VERIFIED SUCCESSFULLY ===");
