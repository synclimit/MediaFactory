import { ExecutorFactory } from './src/services/pipeline/fastrender/factories/ExecutorFactory.js';
import { RenderExecutionPlan, RenderCommand } from './src/services/pipeline/fastrender/contracts/RenderContracts.js';

async function runTest() {
    console.log('--- STARTING EXECUTOR KERNEL TEST ---');
    
    // Scenario 1 & 4 & 8 & 9: Full Successful Execution
    console.log('\\n[Scenario 1, 4, 8, 9] FFmpeg Success & Progress & Session/Result');
    const kernel1 = ExecutorFactory.createExecutor();
    
    let progressUpdates = 0;
    kernel1.progressMonitor.subscribe((progress) => {
        progressUpdates++;
    });
    
    try {
        const plan1 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [
            new RenderCommand('cmd1', 'APPLY_VIDEO_FILTER', [], 'ref1', 'stage1', 1)
        ], {});
        const result1 = await kernel1.execute(plan1);
        console.log('Status:', result1.status);
        console.log('Exit Code:', result1.exitCode);
        console.log('Output File:', result1.outputFile);
        console.log('Progress Updates Received:', progressUpdates > 0);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 2: CommandQueue kosong
    console.log('\\n[Scenario 2] CommandQueue kosong');
    const kernel2 = ExecutorFactory.createExecutor();
    try {
        const plan2 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [], {});
        await kernel2.execute(plan2);
    } catch(e) { 
        console.log('Caught Error:', e.message); 
    }

    // Scenario 3: Missing Resource
    console.log('\\n[Scenario 3] Missing Resource');
    const kernel3 = ExecutorFactory.createExecutor();
    try {
        const plan3 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [
            new RenderCommand('cmd1', 'APPLY_VIDEO_FILTER', [], 'MISSING_RESOURCE_TEST', 'stage1', 1)
        ], {});
        await kernel3.execute(plan3);
    } catch(e) { 
        console.log('Caught Error:', e.message); 
    }

    // Scenario 5: Exit Code != 0
    console.log('\\n[Scenario 5] Exit Code != 0');
    const kernel5 = ExecutorFactory.createExecutor();
    try {
        const plan5 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [
            new RenderCommand('cmd1', 'APPLY_VIDEO_FILTER', [], 'ref1', 'stage1', 1)
        ], {});
        await kernel5.execute(plan5, { exitCodeTest: true });
    } catch(e) { 
        console.log('Caught Error:', e.message); 
    }

    // Scenario 6: Cancel Render
    console.log('\\n[Scenario 6] Cancel Render');
    const kernel6 = ExecutorFactory.createExecutor();
    try {
        const plan6 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [
            new RenderCommand('cmd1', 'APPLY_VIDEO_FILTER', [], 'ref1', 'stage1', 1)
        ], {});
        await kernel6.execute(plan6, { cancelTest: true });
    } catch(e) { 
        console.log('Caught Error:', e.message); 
    }

    // Scenario 7: Timeout -> Kill Process
    console.log('\\n[Scenario 7] Timeout -> Kill Process');
    const kernel7 = ExecutorFactory.createExecutor();
    try {
        const plan7 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [
            new RenderCommand('cmd1', 'APPLY_VIDEO_FILTER', [], 'ref1', 'stage1', 1)
        ], {});
        await kernel7.execute(plan7, { timeoutTest: true });
    } catch(e) { 
        console.log('Caught Error:', e.message); 
    }

    // Scenario 10: Deterministic Session (Executing identical schedules yields expected process execution)
    console.log('\\n[Scenario 10] Deterministic Session');
    const kernel10a = ExecutorFactory.createExecutor();
    const kernel10b = ExecutorFactory.createExecutor();
    
    const plan10 = new RenderExecutionPlan('1.0', '1.0', '1.0', {}, [], [
        new RenderCommand('cmd1', 'APPLY_VIDEO_FILTER', [], 'ref1', 'stage1', 1)
    ], {});
    
    const res10a = await kernel10a.execute(plan10);
    const res10b = await kernel10b.execute(plan10);
    // Ignore sessionId difference and output path difference for equality check
    console.log('Deterministic execution success:', res10a.status === res10b.status && res10a.exitCode === res10b.exitCode);
}

runTest().catch(console.error);
