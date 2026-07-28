import { PlannerFactory } from './src/services/pipeline/fastrender/factories/PlannerFactory.js';
import { SchedulerFactory } from './src/services/pipeline/fastrender/factories/SchedulerFactory.js';
import { PipelineFactory } from './src/services/pipeline/fastrender/factories/PipelineFactory.js';
import { RendererFactory } from './src/services/pipeline/fastrender/factories/RendererFactory.js';
import { ExecutorFactory } from './src/services/pipeline/fastrender/factories/ExecutorFactory.js';
import { ProjectContext } from './src/services/pipeline/fastrender/contracts/Contexts.js';

async function runIntegrationTest() {
    console.log('--- STARTING END-TO-END INTEGRATION TEST ---');
    
    const planner = PlannerFactory.createPlanner();
    const scheduler = SchedulerFactory.createScheduler();
    const pipelineBuilder = PipelineFactory.createPipeline();
    const renderer = RendererFactory.createRenderer();
    const executor = ExecutorFactory.createExecutor();
    
    console.log('\\n[Queue -> Planner]');
    const projectCtx = new ProjectContext({ id: 'proj_integration', durationMs: 15000, modules: ['SubtitleEngine', 'VisualizerEngine'] });
    const plannerResult = await planner.execute(projectCtx);
    console.log('  -> Strategy:', plannerResult.plan.globalStrategy); 
    
    console.log('\\n[Planner -> Scheduler]');
    const schedule = await scheduler.execute(plannerResult.plan);
    console.log('  -> Total Tasks:', schedule.executionTasks.length);
    
    console.log('\\n[Scheduler -> Pipeline Builder]');
    const pipelinePlan = await pipelineBuilder.execute(schedule);
    console.log('  -> Total Active Nodes:', pipelinePlan.nodes.filter(n => n.status !== 'SKIPPED').length);
    
    console.log('\\n[Pipeline Builder -> Renderer]');
    const execPlan = await renderer.execute(pipelinePlan);
    console.log('  -> Total Exec Commands:', execPlan.commands.length);
    
    console.log('\\n[Renderer -> FFmpeg Executor]');
    let progressCount = 0;
    executor.progressMonitor.subscribe((progress) => {
        progressCount++;
    });
    
    const result = await executor.execute(execPlan);
    console.log('  -> Execution Status:', result.status);
    console.log('  -> Exit Code:', result.exitCode);
    console.log('  -> Output File:', result.outputFile);
    console.log('  -> Duration (ms):', result.duration);
    console.log('  -> Progress Events Fired:', progressCount > 0);
    
    console.log('\\n--- INTEGRATION SUCCESSFUL ---');
}

runIntegrationTest().catch(console.error);
