const RenderPipeline = require('./m5/RenderPipeline');
const { PipelineEmitter, PipelineEvents } = require('./m5/core/Events');
const Logger = require('./m5/core/Logger');

async function runTest() {
    console.log("=== Starting M5 Pipeline Integration Test ===");
    
    // Listen to events
    Object.values(PipelineEvents).forEach(event => {
        PipelineEmitter.on(event, (data) => {
            console.log(`[EVENT] ${event}`, data ? `Job ID: ${data.jobId || data.libraryId}` : '');
        });
    });

    const mockJob = {
        id: 'test_job_123',
        libraryFolders: {
            videoA: [{ path: '/mock/videoA', name: 'MockLib_A' }],
            videoB: [{ path: '/mock/videoB', name: 'MockLib_B' }],
            hook: [{ path: '/mock/hook', name: 'MockLib_Hook' }],
            cta: [{ path: '/mock/cta', name: 'MockLib_CTA' }],
            background: [{ path: '/mock/bg', name: 'MockLib_BG' }]
        }
    };

    const configOverrides = {
        output: { targetResolution: '1080x1920', fps: 60 },
        variation: { level: 'QUALITY' },
        formula: { type: 'SHUFFLE' }
    };

    // Override the db fetch for testing isolated pipeline structure
    const dbEngine = require('./m5/Database');
    dbEngine.getDb = () => ({
        get: async () => ({ id: 'mock_id', name: 'mock_name' }),
        all: async () => ([{ 
            id: 'mock_item_id', path: '/mock/path.mp4', filename: 'path.mp4', 
            duration: 15, width: 1080, height: 1920, fps: 30 
        }]),
        run: async () => true
    });
    
    // We are only testing the Snapshot phase to verify object immutability and flow
    const snapshotRes = await RenderPipeline.queueJob(mockJob, configOverrides);
    
    if (snapshotRes.success) {
        console.log("Snapshot successfully created!");
        console.log(`Recipe Hash: ${snapshotRes.data.recipeHash}`);
        console.log(`FFmpeg Command generated: ${snapshotRes.data.ffmpegCommand.substring(0, 100)}...`);
    } else {
        console.error("Pipeline failed!", snapshotRes.errors);
    }
}

runTest();
