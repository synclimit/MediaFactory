import { RendererFactory } from './src/services/pipeline/fastrender/factories/RendererFactory.js';
import { PipelinePlan, PipelineNode } from './src/services/pipeline/fastrender/contracts/PipelineContracts.js';
import { RenderCommandType } from './src/services/pipeline/fastrender/contracts/RenderContracts.js';

async function runTest() {
    console.log('--- STARTING RENDERER KERNEL TEST ---');
    
    // Scenario 1: Normal Schedule
    console.log('\\n[Scenario 1] Normal Schedule');
    const kernel1 = RendererFactory.createRenderer();
    try {
        const plan1 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
            new PipelineNode('n1', 'VIDEO_FILTER', 'stage_1', [], 'ref', 'ACTIVE', '')
        ], []);
        const result1 = await kernel1.execute(plan1);
        console.log('State:', kernel1.state);
        console.log('Total Commands:', result1.commands.length); // Should be Root + 1 + Terminal = 3
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 2: Empty Pipeline
    console.log('\\n[Scenario 2] Empty Pipeline');
    const kernel2 = RendererFactory.createRenderer();
    try {
        await kernel2.execute(new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [], []));
    } catch(e) { 
        console.log('State:', kernel2.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 3: Broken Dependency
    console.log('\\n[Scenario 3] Broken Dependency');
    const kernel3 = RendererFactory.createRenderer();
    try {
        const plan3 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
            new PipelineNode('n1', 'VIDEO_FILTER', 'stage_1', [], 'ref', 'ACTIVE', 'BROKEN_DEP_TEST')
        ], []);
        await kernel3.execute(plan3);
    } catch(e) { 
        console.log('State:', kernel3.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 4: Duplicate Command
    console.log('\\n[Scenario 4] Duplicate Command');
    const kernel4 = RendererFactory.createRenderer();
    try {
        const plan4 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
            new PipelineNode('n1', 'VIDEO_FILTER', 'stage_1', [], 'ref', 'ACTIVE', 'DUPLICATE_CMD_TEST')
        ], []);
        await kernel4.execute(plan4);
    } catch(e) { 
        console.log('State:', kernel4.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 5: Command Translation
    console.log('\\n[Scenario 5] Command Translation');
    const kernel5 = RendererFactory.createRenderer();
    try {
        const plan5 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
            new PipelineNode('n1', 'SUBTITLE', 'stage_1', [], 'ref', 'ACTIVE', '')
        ], []);
        const result5 = await kernel5.execute(plan5);
        console.log('State:', kernel5.state);
        const transCmd = result5.commands.find(c => c.commandId === 'n1');
        console.log('Translated Command:', transCmd.commandType);
    } catch(e) { console.error('Error:', e.message); }

    // Scenario 6: Deterministic Translation
    console.log('\\n[Scenario 6] Deterministic Translation');
    const kernel6a = RendererFactory.createRenderer();
    const kernel6b = RendererFactory.createRenderer();
    const plan6 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
        new PipelineNode('n1', 'COLOR', 'stage_1', [], 'ref', 'ACTIVE', '')
    ], []);
    const res6a = await kernel6a.execute(plan6);
    const res6b = await kernel6b.execute(plan6);
    console.log('Results Identical:', JSON.stringify(res6a) === JSON.stringify(res6b));

    // Scenario 7: Invalid Stage (Empty Stage test)
    console.log('\\n[Scenario 7] Invalid Stage');
    const kernel7 = RendererFactory.createRenderer();
    try {
        const plan7 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
            new PipelineNode('n1', 'VIDEO_FILTER', 'stage_1', [], 'ref', 'ACTIVE', 'EMPTY_STAGE_TEST')
        ], []);
        await kernel7.execute(plan7);
    } catch(e) { 
        console.log('State:', kernel7.state);
        console.log('Caught Error:', e.message); 
    }

    // Scenario 8: Invalid Graph (No Commands -> but has root/terminal?)
    // Note: To test this properly, we need to bypass builder injecting root/terminal, or test another invalid state.
    // For now, testing unknown operation type translation failure to simulate invalid node generation -> invalid graph.
    console.log('\\n[Scenario 8] Invalid Graph (Translation Failure)');
    const kernel8 = RendererFactory.createRenderer();
    try {
        const plan8 = new PipelinePlan('1.0', '1.0', '1.0', '1.0', {}, [], {}, [
            new PipelineNode('n1', 'UNKNOWN_XYZ', 'stage_1', [], 'ref', 'ACTIVE', 'FORCE_UNKNOWN_OPERATION')
        ], []);
        await kernel8.execute(plan8);
    } catch(e) { 
        console.log('State:', kernel8.state);
        console.log('Caught Error:', e.message); 
    }
}

runTest().catch(console.error);
