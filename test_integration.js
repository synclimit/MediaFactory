import { PlannerFactory } from './src/services/pipeline/fastrender/factories/PlannerFactory.js';
import { SchedulerFactory } from './src/services/pipeline/fastrender/factories/SchedulerFactory.js';
import { ProjectContext } from './src/services/pipeline/fastrender/contracts/Contexts.js';

async function runIntegrationTest() {
    console.log('--- STARTING PLANNER -> SCHEDULER INTEGRATION TEST ---');
    
    // 1. Initialize Engines
    const planner = PlannerFactory.createPlanner();
    const scheduler = SchedulerFactory.createScheduler();
    
    // 2. Incoming Queue Request
    console.log('\\n[Step 1] Initializing Project...');
    const projectCtx = new ProjectContext({ id: 'proj_integration', durationMs: 15000, modules: ['SubtitleEngine'] });
    
    // 3. Planner Kernel runs
    console.log('[Step 2] Planner Running...');
    const plannerResult = await planner.execute(projectCtx);
    
    if (!plannerResult.validation.isValid) {
        throw new Error('Planner failed validation');
    }
    console.log('  -> RenderPlan Strategy:', plannerResult.plan.globalStrategy);
    console.log('  -> Total Segments:', plannerResult.plan.segments.length);
    
    // 4. Scheduler Kernel reads the RenderPlan
    console.log('\\n[Step 3] Scheduler Running...');
    const schedule = await scheduler.execute(plannerResult.plan);
    
    console.log('  -> Final Scheduler State:', scheduler.state);
    console.log('  -> Generated Execution Tasks:', schedule.executionTasks.length);
    console.log('  -> Sample Task 1: Layer =', schedule.executionTasks[0].layerId, '| Dependency =', schedule.executionTasks[0].dependencyIds);
    console.log('  -> Sample Task 2: Layer =', schedule.executionTasks[1].layerId, '| Dependency =', schedule.executionTasks[1].dependencyIds);
    
    console.log('\\n--- INTEGRATION SUCCESSFUL ---');
}

runIntegrationTest().catch(console.error);
