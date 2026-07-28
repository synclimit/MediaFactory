import { SchedulerFactory } from './src/services/pipeline/fastrender/factories/SchedulerFactory.js';
import { RenderPlan } from './src/services/pipeline/fastrender/contracts/Descriptors.js';

async function runSchedulerTest() {
    console.log('--- STARTING SCHEDULER KERNEL TEST ---');
    
    // Helper to create a dummy RenderPlan
    const createPlan = (segments) => {
        return new RenderPlan('1.0.0', 'proj_1', 'STATIC_BAKE', 10000, segments);
    };

    // Scenario 1: Fast Project
    console.log('\\n[Scenario 1] Fast Project');
    const kernel1 = SchedulerFactory.createScheduler();
    try {
        const plan1 = createPlan([{ startMs: 0, endMs: 10000, strategy: 'BAKE' }]);
        const result1 = await kernel1.execute(plan1);
        console.log('Final State:', kernel1.state);
        console.log('Tasks Generated:', result1.executionTasks.length);
        console.log('First Task Order:', result1.executionTasks[0].executionOrder);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 2: Empty segment
    console.log('\\n[Scenario 2] Empty Segment');
    const kernel2 = SchedulerFactory.createScheduler();
    try {
        const plan2 = createPlan([]);
        await kernel2.execute(plan2);
    } catch(e) { 
        console.log('Final State:', kernel2.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 4: 20 Segments
    console.log('\\n[Scenario 4] 20 Segments');
    const kernel4 = SchedulerFactory.createScheduler();
    try {
        const segments = [];
        for (let i = 0; i < 20; i++) segments.push({ startMs: i*1000, endMs: (i+1)*1000, strategy: 'BAKE' });
        const plan4 = createPlan(segments);
        const result4 = await kernel4.execute(plan4);
        console.log('Final State:', kernel4.state);
        console.log('Total Segments:', result4.segments.length);
        console.log('Tasks Generated:', result4.executionTasks.length);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 5: Deterministic Check
    console.log('\\n[Scenario 5] Deterministic Check');
    const kernel5a = SchedulerFactory.createScheduler();
    const kernel5b = SchedulerFactory.createScheduler();
    const plan5 = createPlan([{ startMs: 0, endMs: 5000, strategy: 'BAKE' }]);
    const res5a = await kernel5a.execute(plan5);
    const res5b = await kernel5b.execute(plan5);
    const deterministic = JSON.stringify(res5a) === JSON.stringify(res5b);
    console.log('Results Identical:', deterministic);

    // Scenario 6: Dependency Chain
    console.log('\\n[Scenario 6] Dependency Chain');
    const kernel6 = SchedulerFactory.createScheduler();
    try {
        const plan6 = createPlan([{ startMs: 0, endMs: 1000, strategy: 'BAKE' }]);
        const result6 = await kernel6.execute(plan6);
        console.log('Final State:', kernel6.state);
        
        // Print execution order for first 3 layers
        result6.executionTasks.slice(0, 3).forEach(t => {
            console.log("Task: " + t.taskId + " | Order: " + t.executionOrder + " | Deps: " + t.dependencyIds.join(','));
        });
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 7: Circular Dependency -> Duplicate/Validation
    // I simulate a circular dependency by putting 'TriggerCircular' as a layer.
    console.log('\\n[Scenario 7] Circular Dependency');
    const kernel7 = SchedulerFactory.createScheduler();
    try {
        const plan7 = createPlan([{ startMs: 0, endMs: 1000, strategy: 'BAKE', segmentId: 'seg_circular' }]);
        // To trigger it, I override standard order in LayerScheduler mock
        kernel7.builder.layerScheduler.getStandardOrder = () => ['TriggerCircular'];
        await kernel7.execute(plan7);
    } catch(e) { 
        console.log('Final State:', kernel7.state);
        console.log('Caught Error:', e.message); 
    }
}

runSchedulerTest().catch(console.error);
