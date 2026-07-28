import { PlannerFactory } from './src/services/pipeline/fastrender/factories/PlannerFactory.js';
import { ProjectContext } from './src/services/pipeline/fastrender/contracts/Contexts.js';

async function runTest() {
    console.log('--- STARTING PLANNER KERNEL TEST ---');
    const kernel = PlannerFactory.createPlanner();
    
    // Scenario 1: Dummy Fast Compatible Project
    console.log('\\n[Scenario 1] Fast Compatible Project');
    const ctx1 = new ProjectContext({ id: 'proj_1', durationMs: 15000, modules: ['SubtitleEngine'] });
    const result1 = await kernel.execute(ctx1);
    console.log('Final State:', kernel.state);
    console.log('Validation:', result1.validation.status);
    console.log('Strategy:', result1.plan.globalStrategy);
    console.log('Trace:');
    result1.trace.forEach(t => console.log('  ' + t));

    // Scenario 2: Project with Visualizer (requires continuous)
    console.log('\\n[Scenario 2] Beat Reactive Visualizer');
    const ctx2 = new ProjectContext({ id: 'proj_2', durationMs: 20000, modules: ['SubtitleEngine', 'VisualizerEngine'] });
    const result2 = await kernel.execute(ctx2);
    console.log('Final State:', kernel.state);
    console.log('Validation:', result2.validation.status);
    console.log('Strategy:', result2.plan.globalStrategy);
    console.log('Trace:');
    result2.trace.forEach(t => console.log('  ' + t));
    
    // Scenario 3: Bad project duration
    console.log('\\n[Scenario 3] Bad Project Duration');
    const ctx3 = new ProjectContext({ id: 'proj_3', durationMs: -5000, modules: [] });
    const result3 = await kernel.execute(ctx3);
    console.log('Final State:', kernel.state);
    console.log('Validation:', result3.validation.status);
    console.log('Errors:', result3.validation.errors);
}

runTest().catch(console.error);
