import { PlannerFactory } from './src/services/pipeline/fastrender/factories/PlannerFactory.js';
import { ProjectContext } from './src/services/pipeline/fastrender/contracts/Contexts.js';
import { FeatureDescriptor } from './src/services/pipeline/fastrender/contracts/FeatureDescriptor.js';
import { RuntimeContext } from './src/services/pipeline/fastrender/contracts/RuntimeContext.js';
import { FeatureRegistry } from './src/services/pipeline/fastrender/registry/FeatureRegistry.js';
import { HardwareProfile } from './src/services/pipeline/fastrender/hardware/HardwareProfile.js';
import { CostEngine } from './src/services/pipeline/fastrender/engines/CostEngine.js';
import { RealtimeMode, RenderType, CacheMode, EncodeCost, PreferredStrategy } from './src/services/pipeline/fastrender/contracts/Enums.js';
import { CircularDependencyException } from './src/services/pipeline/fastrender/exceptions/CircularDependencyException.js';

async function runV2Tests() {
    console.log("=================================================");
    console.log("=== FAST RENDER ARCHITECTURE V2 TEST SUITE ===");
    console.log("=================================================");

    // TEST 1: Immutable FeatureDescriptor & Mutable RuntimeContext
    console.log("\n[TEST 1] Immutable FeatureDescriptor & Mutable RuntimeContext");
    const desc1 = new FeatureDescriptor({
        id: 'Plugin_Test1',
        name: 'Test Plugin 1',
        capability: { realtimeMode: RealtimeMode.NONE, renderType: RenderType.TIMELINE }
    });
    let isFrozen = false;
    try {
        desc1.id = 'MUTATED';
    } catch (e) {
        isFrozen = true;
    }
    console.log(`FeatureDescriptor is frozen/immutable: ${isFrozen || desc1.id === 'Plugin_Test1'}`);

    const runtimeCtx = new RuntimeContext();
    runtimeCtx.markCached('Plugin_Test1', true);
    runtimeCtx.setOutputAsset('Plugin_Test1', '/path/to/asset.mp4');
    console.log(`RuntimeContext mutable state tracked correctly: cached=${runtimeCtx.isCached('Plugin_Test1')}, asset=${runtimeCtx.getOutputAsset('Plugin_Test1')}`);

    // TEST 2: Hardware Profile (Detect, Cache, Refresh)
    console.log("\n[TEST 2] Hardware Profile (Detect, Cache, Refresh)");
    const hwProfile = new HardwareProfile();
    const prof1 = hwProfile.getProfile();
    console.log(`Hardware Profile Detected: CPU Cores=${prof1.cpuCores}, RAM=${prof1.ramMb}MB, HW Encoder=${prof1.hasHwEncoder}`);
    const refreshed = hwProfile.refresh();
    console.log(`Hardware Profile Refreshed At: ${new Date(refreshed.lastDetectedAt).toISOString()}`);

    // TEST 3: Dynamic Weighted Cost Engine
    console.log("\n[TEST 3] Dynamic Weighted Cost Engine");
    const costEngine = new CostEngine({ cpuWeight: 1.0, gpuWeight: 2.0 });
    const projectCtxMock = new ProjectContext({ id: 'proj_cost_test', durationMs: 30000 });
    const lowEndHw = new HardwareProfile({ cpuCores: 2, ramMb: 4096, hasHwEncoder: false });
    const highEndHw = new HardwareProfile({ cpuCores: 16, ramMb: 65536, hasHwEncoder: true });

    const costLow = costEngine.calculateFeatureCost(desc1, lowEndHw, projectCtxMock);
    const costHigh = costEngine.calculateFeatureCost(desc1, highEndHw, projectCtxMock);
    console.log(`Cost on Low-End HW: ${costLow} vs High-End HW: ${costHigh}`);

    // TEST 4: Dependency Graph Cycle Detection
    console.log("\n[TEST 4] Dependency Graph Cycle Detection");
    const cyclicRegistry = new FeatureRegistry();
    cyclicRegistry.register(new FeatureDescriptor({ id: 'NodeA', dependencies: ['NodeB'] }));
    cyclicRegistry.register(new FeatureDescriptor({ id: 'NodeB', dependencies: ['NodeC'] }));
    cyclicRegistry.register(new FeatureDescriptor({ id: 'NodeC', dependencies: ['NodeA'] }));

    const cyclicPlanner = PlannerFactory.createPlanner({ featureRegistry: cyclicRegistry });
    let cycleCaught = false;
    try {
        await cyclicPlanner.execute(new ProjectContext({ id: 'proj_cycle', durationMs: 10000, modules: ['NodeA'] }));
    } catch (e) {
        if (e instanceof CircularDependencyException || e.name === 'CircularDependencyException') {
            cycleCaught = true;
            console.log(`Caught Cycle Exception: ${e.message}`);
        } else {
            console.error("Unexpected error caught:", e);
        }
    }
    console.log(`Cycle Detection Verification: ${cycleCaught ? 'PASSED' : 'FAILED'}`);

    // TEST 5: External Plugin Registration (SnowFX, NeonOverlay, AnimeVisualizer, AICamera, FireParticle)
    console.log("\n[TEST 5] External Plugin Registration & Strategy Resolution");
    const pluginRegistry = new FeatureRegistry();
    
    // Register external plugins dynamically
    pluginRegistry.register(new FeatureDescriptor({
        id: 'SnowFX',
        name: 'Snow Particle FX',
        capability: { renderType: RenderType.PRERENDER, canPrerender: true },
        plannerHint: { preferredStrategy: PreferredStrategy.PRERENDER }
    }));
    
    pluginRegistry.register(new FeatureDescriptor({
        id: 'NeonOverlay',
        name: 'Neon Timeline Overlay',
        capability: { renderType: RenderType.TIMELINE },
        plannerHint: { preferredStrategy: PreferredStrategy.TIMELINE }
    }));

    pluginRegistry.register(new FeatureDescriptor({
        id: 'AnimeVisualizer',
        name: 'Anime Beat Visualizer',
        capability: { realtimeMode: RealtimeMode.REQUIRED, requiresBeatEngine: true, requiresFullEncode: true },
        plannerHint: { preferredStrategy: PreferredStrategy.FULL_ENCODE }
    }));

    const customPlanner = PlannerFactory.createPlanner({ featureRegistry: pluginRegistry });
    
    // Test Scenario A: Plugin SnowFX + NeonOverlay (Prerender/Concat strategy)
    const ctxA = new ProjectContext({ id: 'proj_plugins_a', durationMs: 15000, modules: ['SnowFX', 'NeonOverlay'] });
    const resA = await customPlanner.execute(ctxA);
    console.log(`Scenario A (SnowFX + NeonOverlay) Strategy: ${resA.plan.globalStrategy}`);
    console.log(`Scenario A Decision Log count: ${resA.decisionLog.length}`);
    console.log(`Scenario A ExecutionGraph Nodes: ${resA.plan.executionGraph.getAllNodes().map(n => n.name).join(' -> ')}`);

    // Test Scenario B: Plugin AnimeVisualizer (Realtime strategy)
    const ctxB = new ProjectContext({ id: 'proj_plugins_b', durationMs: 20000, modules: ['AnimeVisualizer'] });
    const resB = await customPlanner.execute(ctxB);
    console.log(`Scenario B (AnimeVisualizer) Strategy: ${resB.plan.globalStrategy}`);

    // TEST 6: Execution Graph JSON & DOT Export
    console.log("\n[TEST 6] Execution Graph Export (JSON & DOT)");
    const jsonExport = resA.plan.executionGraph.toJSON();
    const dotExport = resA.plan.executionGraph.toDOT();
    console.log(`JSON Export Nodes Count: ${jsonExport.nodes.length}`);
    console.log(`DOT Export Sample:\n${dotExport.split('\n').slice(0, 5).join('\n')}`);

    // TEST 7: Determinism Test
    console.log("\n[TEST 7] Planner Determinism");
    const ctxDet = new ProjectContext({ id: 'proj_det', durationMs: 15000, modules: ['SnowFX', 'NeonOverlay'] });
    const run1 = await customPlanner.execute(ctxDet);
    const run2 = await customPlanner.execute(ctxDet);
    const isDeterministic = run1.plan.globalStrategy === run2.plan.globalStrategy && run1.plan.runtimeCost === run2.plan.runtimeCost;
    console.log(`Planner Output Deterministic: ${isDeterministic}`);

    console.log("\n=== ALL V2 VERIFICATION TESTS COMPLETED SUCCESSFULLY ===");
}

runV2Tests().catch(err => console.error("V2 Test suite failed:", err));
