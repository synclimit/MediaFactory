import { AnalysisContext } from '../contracts/Contexts.js';
import { RuntimeContext } from '../contracts/RuntimeContext.js';
import { HardwareProfile } from '../hardware/HardwareProfile.js';
import { CostEngine } from '../engines/CostEngine.js';

export class PlannerOrchestrator {
    constructor(analyzers, compatibilityEngine, strategyResolver, segmentBuilder, planBuilder, validationEngine, costEngine = null, hardwareProfile = null) {
        this.analyzers = analyzers;
        this.compatibilityEngine = compatibilityEngine;
        this.strategyResolver = strategyResolver;
        this.segmentBuilder = segmentBuilder;
        this.planBuilder = planBuilder;
        this.validationEngine = validationEngine;
        this.costEngine = costEngine || new CostEngine();
        this.hardwareProfile = hardwareProfile || new HardwareProfile();
    }

    async buildPlan(projectContext, knowledgeBase, runtimeContext = null) {
        const decisionLog = [];
        const runtimeCtx = runtimeContext || new RuntimeContext();
        const hwProfile = this.hardwareProfile;

        decisionLog.push(`[INIT] Project ID: ${projectContext.data?.id || 'unknown'}, Duration: ${projectContext.data?.durationMs || 0}ms`);

        // 1. Analyze
        const projectFacts = this.analyzers.project.analyze(projectContext.data);
        const timelineFacts = this.analyzers.timeline.analyze(projectContext.data);
        const moduleFacts = this.analyzers.module.analyze(projectContext.data);
        const hardwareFacts = this.analyzers.hardware ? this.analyzers.hardware.analyze(projectContext.data) : hwProfile.getProfile();
        
        decisionLog.push(`[ANALYZE] Resolved ${moduleFacts.length} feature descriptors.`);
        for (const desc of moduleFacts) {
            decisionLog.push(`  - Feature: ${desc.id} (Category: ${desc.category}, Realtime: ${desc.capability.realtimeMode}, RenderType: ${desc.capability.renderType})`);
        }

        const analysisCtx = new AnalysisContext(projectFacts, timelineFacts, hardwareFacts, moduleFacts);

        // 2. Compatibility & Graph Order
        const capabilityProfile = this.compatibilityEngine.evaluate(analysisCtx);
        decisionLog.push(`[GRAPH] Topological execution order: [${capabilityProfile.dependencyOrder.join(' -> ')}]`);

        // 3. Dynamic Cost Engine
        const costResult = this.costEngine.calculateTotalProjectCost(capabilityProfile.descriptors, hwProfile, projectContext);
        decisionLog.push(`[COST] Computed total project runtime cost: ${costResult.totalCost}`);

        // 4. Resolve Strategy
        const strategyCtx = this.strategyResolver.resolve(capabilityProfile, runtimeCtx, hwProfile, projectContext);
        decisionLog.push(`[STRATEGY] Selected Strategy: ${strategyCtx.globalStrategy}`);
        decisionLog.push(`[REASON] ${strategyCtx.strategyDetails?.explanation || 'Optimal strategy chosen.'}`);

        // 5. Build Segments
        const segments = this.segmentBuilder.buildTimeBlocks(strategyCtx, timelineFacts);

        // 6. Build Contract & ExecutionGraph
        const renderPlan = this.planBuilder.buildContract(
            projectContext.data.id || 'unknown', 
            strategyCtx, 
            segments, 
            timelineFacts.durationMs,
            {
                decisionLog,
                runtimeCost: costResult.totalCost,
                hardwareInfo: hardwareFacts
            }
        );

        // 7. Validate
        const validation = this.validationEngine.verify(renderPlan);
        decisionLog.push(`[VALIDATION] Status: ${validation.status}, Valid: ${validation.isValid}`);

        return { renderPlan, validation, decisionLog };
    }
}
