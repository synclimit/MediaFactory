import { PlannerFactory } from './src/services/pipeline/fastrender/factories/PlannerFactory.js';
import { SchedulerFactory } from './src/services/pipeline/fastrender/factories/SchedulerFactory.js';
import { PipelineFactory } from './src/services/pipeline/fastrender/factories/PipelineFactory.js';
import { RendererFactory } from './src/services/pipeline/fastrender/factories/RendererFactory.js';
import { ProjectContext } from './src/services/pipeline/fastrender/contracts/Contexts.js';

async function runIntegrationTest() {
    console.log('--- STARTING RENDERER INTEGRATION TEST ---');
    
    // 1. Initialize Engines
    const planner = PlannerFactory.createPlanner();
    const scheduler = SchedulerFactory.createScheduler();
    const pipelineBuilder = PipelineFactory.createPipeline();
    const renderer = RendererFactory.createRenderer();
    
    // 2. Incoming Queue Request
    console.log('\\n[Queue -> Planner]');
    const projectCtx = new ProjectContext({ id: 'proj_integration', durationMs: 15000, modules: ['SubtitleEngine', 'VisualizerEngine'] });
    const plannerResult = await planner.execute(projectCtx);
    console.log('  -> Strategy:', plannerResult.plan.globalStrategy); 
    
    // 3. Scheduler Kernel runs
    console.log('\\n[Planner -> Scheduler]');
    const schedule = await scheduler.execute(plannerResult.plan);
    console.log('  -> Total Tasks:', schedule.executionTasks.length);
    
    // 4. Pipeline Kernel runs
    console.log('\\n[Scheduler -> Pipeline Builder]');
    const pipelinePlan = await pipelineBuilder.execute(schedule);
    console.log('  -> Total Active Nodes:', pipelinePlan.nodes.filter(n => n.status !== 'SKIPPED').length);
    
    // 5. Renderer Kernel runs
    console.log('\\n[Pipeline Builder -> Renderer]');
    const execPlan = await renderer.execute(pipelinePlan);
    
    console.log('  -> Renderer State:', renderer.state);
    console.log('  -> Total Exec Commands:', execPlan.commands.length);
    console.log('  -> Total Stages:', execPlan.stages.length);
    console.log('  -> Pipeline Version:', execPlan.pipelineVersion);
    console.log('  -> Root Command:', execPlan.commands.find(c => c.commandId === 'root').commandType);
    console.log('  -> Terminal Command:', execPlan.commands.find(c => c.commandId === 'terminal').commandType);
    
    console.log('\\n--- INTEGRATION SUCCESSFUL ---');
}

runIntegrationTest().catch(console.error);
