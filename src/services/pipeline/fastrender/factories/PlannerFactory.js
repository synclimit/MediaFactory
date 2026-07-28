import { PlannerKernel } from '../core/PlannerKernel.js';
import { PlannerOrchestrator } from '../core/PlannerOrchestrator.js';
import { ProjectAnalyzer } from '../analyzers/ProjectAnalyzer.js';
import { TimelineAnalyzer } from '../analyzers/TimelineAnalyzer.js';
import { HardwareAnalyzer } from '../analyzers/HardwareAnalyzer.js';
import { ModuleAnalyzer } from '../analyzers/ModuleAnalyzer.js';
import { CompatibilityEngine } from '../engines/CompatibilityEngine.js';
import { StrategyResolver } from '../engines/StrategyResolver.js';
import { StrategyProvider } from '../engines/StrategyProvider.js';
import { SegmentBuilder } from '../engines/SegmentBuilder.js';
import { RenderPlanBuilder } from '../engines/RenderPlanBuilder.js';
import { ValidationEngine } from '../engines/ValidationEngine.js';
import { DecisionKnowledgeBase } from '../knowledge/DecisionKnowledgeBase.js';
import { RuleRegistry } from '../registry/RuleRegistry.js';
import { RuleEvaluator } from '../knowledge/RuleEvaluator.js';
import { HardwareRule } from '../knowledge/rules/HardwareRule.js';
import { TimelineRule } from '../knowledge/rules/TimelineRule.js';
import { FeatureRegistry } from '../registry/FeatureRegistry.js';
import { HardwareProfile } from '../hardware/HardwareProfile.js';
import { CostEngine } from '../engines/CostEngine.js';

export class PlannerFactory {
    static createPlanner(options = {}) {
        const featureRegistry = options.featureRegistry || new FeatureRegistry();
        const hardwareProfile = options.hardwareProfile || new HardwareProfile();
        const costEngine = options.costEngine || new CostEngine();
        const strategyProvider = options.strategyProvider || new StrategyProvider();

        const ruleRegistry = new RuleRegistry();
        ruleRegistry.register(new HardwareRule());
        ruleRegistry.register(new TimelineRule());
        
        const dkb = new DecisionKnowledgeBase(ruleRegistry, new RuleEvaluator());
        const analyzers = {
            project: new ProjectAnalyzer(),
            timeline: new TimelineAnalyzer(),
            hardware: new HardwareAnalyzer(hardwareProfile),
            module: new ModuleAnalyzer(featureRegistry)
        };
        const orchestrator = new PlannerOrchestrator(
            analyzers,
            new CompatibilityEngine(),
            new StrategyResolver(strategyProvider),
            new SegmentBuilder(),
            new RenderPlanBuilder(),
            new ValidationEngine(),
            costEngine,
            hardwareProfile
        );
        return new PlannerKernel(orchestrator, dkb);
    }
}
