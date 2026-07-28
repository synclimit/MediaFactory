import { QueueService } from './src/services/QueueService.js';
import { QUEUE_JOB_STATUS } from './src/entities/index.js';

class MockRepo {
    async insert(job) { return job; }
}
class MockActivity {
    async log(data) {}
}

async function runQueueTest() {
    console.log('--- STARTING QUEUE INTEGRATION TEST ---');
    const queue = new QueueService(new MockRepo(), new MockActivity());
    
    // Scenario 1: Fast Compatible Project
    console.log('\\n[Scenario 1] Fast Compatible Project');
    const job1 = await queue.register({
        workspaceId: 'ws_1', createdBy: 'user_1', mode: 'FAST',
        payload: { id: 'proj_1', durationMs: 15000, modules: ['SubtitleEngine'] }
    });
    console.log('Job Mode:', job1.mode);
    console.log('Planner Status:', job1.plannerStatus);
    console.log('Queue Status:', job1.status);

    // Scenario 2: Beat Reactive Visualizer (Fallback)
    console.log('\\n[Scenario 2] Beat Reactive Visualizer');
    const job2 = await queue.register({
        workspaceId: 'ws_1', createdBy: 'user_1', mode: 'FAST',
        payload: { id: 'proj_2', durationMs: 20000, modules: ['SubtitleEngine', 'VisualizerEngine'] }
    });
    console.log('Job Mode:', job2.mode);
    console.log('Planner Status:', job2.plannerStatus);
    console.log('Queue Status:', job2.status);
    console.log('Warnings:', job2.plannerWarnings);
    
    // Scenario 3: Planner Error
    console.log('\\n[Scenario 3] Planner Error');
    const job3 = await queue.register({
        workspaceId: 'ws_1', createdBy: 'user_1', mode: 'FAST',
        payload: { id: 'proj_3', durationMs: -5000, modules: [] }
    });
    console.log('Job Mode:', job3.mode);
    console.log('Planner Status:', job3.plannerStatus);
    console.log('Queue Status:', job3.status);
    console.log('Errors:', job3.plannerErrors);
}

runQueueTest().catch(console.error);
