import { PipelineFactory } from './src/services/pipeline/fastrender/factories/PipelineFactory.js';
import { ExecutionSchedule, ExecutionTask } from './src/services/pipeline/fastrender/contracts/ExecutionContracts.js';

async function runTest() {
    console.log('--- STARTING PIPELINE KERNEL TEST ---');
    
    // Scenario 1: ExecutionSchedule -> PipelinePlan -> READY
    console.log('\\n[Scenario 1] Normal Schedule');
    const kernel1 = PipelineFactory.createPipeline();
    try {
        const schedule1 = new ExecutionSchedule('1.0', '1.0', [], [
            new ExecutionTask('t1', 's1', 'l1', 0, 10, 'VIDEO_FILTER', 'ref1', [])
        ]);
        const result1 = await kernel1.execute(schedule1);
        console.log('State:', kernel1.state);
        console.log('Nodes generated:', result1.nodes.length);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 2: Empty Schedule
    console.log('\\n[Scenario 2] Empty Schedule');
    const kernel2 = PipelineFactory.createPipeline();
    try {
        await kernel2.execute(new ExecutionSchedule('1.0', '1.0', [], []));
    } catch(e) { 
        console.log('State:', kernel2.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 3: Circular Graph
    console.log('\\n[Scenario 3] Circular Graph');
    const kernel3 = PipelineFactory.createPipeline();
    try {
        const schedule3 = new ExecutionSchedule('1.0', '1.0', [], [
            new ExecutionTask('t1', 's1', 'l1', 0, 10, 'VIDEO_FILTER', 'ref1', ['t2']),
            new ExecutionTask('t2', 's1', 'l2', 0, 10, 'VIDEO_FILTER', 'ref2', ['t1'])
        ]);
        await kernel3.execute(schedule3);
    } catch(e) { 
        console.log('State:', kernel3.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 4: Duplicate Node -> Merged
    console.log('\\n[Scenario 4] Duplicate Node');
    const kernel4 = PipelineFactory.createPipeline();
    try {
        const schedule4 = new ExecutionSchedule('1.0', '1.0', [], [
            new ExecutionTask('t1', 's1', 'DuplicateTrigger', 0, 10, 'VIDEO_FILTER', 'same_ref', []),
            new ExecutionTask('t2', 's1', 'DuplicateTrigger', 0, 10, 'VIDEO_FILTER', 'same_ref', [])
        ]);
        const result4 = await kernel4.execute(schedule4);
        console.log('State:', kernel4.state);
        const skipped = result4.nodes.filter(n => n.status === 'SKIPPED');
        console.log('Nodes Merged (SKIPPED):', skipped.length);
        console.log('Annotation:', skipped[0]?.annotation);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 5: Cache Candidate -> CACHE_REUSE
    console.log('\\n[Scenario 5] Cache Candidate');
    const kernel5 = PipelineFactory.createPipeline();
    try {
        const schedule5 = new ExecutionSchedule('1.0', '1.0', [], [
            new ExecutionTask('t1', 's1', 'CacheCandidate', 0, 10, 'VIDEO_FILTER', 'ref', [])
        ]);
        const result5 = await kernel5.execute(schedule5);
        console.log('State:', kernel5.state);
        console.log('Operation:', result5.nodes[0].operation);
        console.log('Estimated Cache Hits:', result5.metadata.estimatedCacheHit);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 6: Broken Dependency
    console.log('\\n[Scenario 6] Broken Dependency');
    const kernel6 = PipelineFactory.createPipeline();
    try {
        const schedule6 = new ExecutionSchedule('1.0', '1.0', [], [
            new ExecutionTask('t1', 's1', 'BrokenDep', 0, 10, 'VIDEO_FILTER', 'ref', ['GhostTask_99']) 
        ]);
        await kernel6.execute(schedule6);
    } catch(e) { 
        console.log('State:', kernel6.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 7: Deterministic Output
    console.log('\\n[Scenario 7] Deterministic Success');
    const kernel7a = PipelineFactory.createPipeline();
    const kernel7b = PipelineFactory.createPipeline();
    const schedule7 = new ExecutionSchedule('1.0', '1.0', [], [
        new ExecutionTask('t1', 's1', 'l1', 0, 10, 'VIDEO_FILTER', 'ref', [])
    ]);
    const res7a = await kernel7a.execute(schedule7);
    const res7b = await kernel7b.execute(schedule7);
    console.log('Results Identical:', JSON.stringify(res7a) === JSON.stringify(res7b));

    // Scenario 8: Empty Stage -> Collapse
    console.log('\\n[Scenario 8] Empty Stage');
    const kernel8 = PipelineFactory.createPipeline();
    try {
        const schedule8 = new ExecutionSchedule('1.0', '1.0', [], [
            new ExecutionTask('t1', 's1', 'l1', 0, 10, 'VIDEO_FILTER', 'ref', [])
        ]);
        const result8 = await kernel8.execute(schedule8);
        console.log('State:', kernel8.state);
        console.log('Total Stages generated:', result8.stages.length); 
        // Our builder artificially created an empty stage to test if it collapses.
        // It should collapse, leaving only 1 stage.
    } catch(e) { console.error('Error:', e.message); }
}

runTest().catch(console.error);
