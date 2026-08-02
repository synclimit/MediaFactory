/**
 * index.js (Fast Workspace Barrel Export)
 * MediaFactory M3 Fast Workspace Foundation (MF-1400)
 */

export { FastWorkspaceManager, fastWorkspaceManager } from './FastWorkspaceManager.js';
export { RenderingContext } from './RenderingContext.js';
export { WorkspaceRuntime, NormalWorkspaceRuntime, FastWorkspaceRuntime } from './runtime/WorkspaceRuntime.js';

export { ComposerProvider } from './providers/ComposerProvider.js';
export { PreviewProvider } from './providers/PreviewProvider.js';
export { TimelineProvider } from './providers/TimelineProvider.js';
export { InspectorProvider } from './providers/InspectorProvider.js';

export { LoopProvider, FastLoopProvider, inactiveLoopProvider, activeFastLoopProvider } from './extensions/LoopProvider.js';
export { LoopPreviewController, loopPreviewController } from './controllers/LoopPreviewController.js';
export { LoopCapabilityRegistry, loopCapabilityRegistry, LOOP_CLASSIFICATIONS } from './registry/LoopCapabilityRegistry.js';
export { ProceduralProvider, FastProceduralProvider, inactiveProceduralProvider, activeFastProceduralProvider } from './extensions/ProceduralProvider.js';
export { ValidationProvider, FastValidationProvider, inactiveValidationProvider, activeFastValidationProvider } from './extensions/ValidationProvider.js';
export { VALIDATION_SEVERITY } from './validation/ValidationSeverity.js';
export { ValidationReport } from './validation/ValidationReport.js';
export { ValidationEngine, validationEngine } from './validation/ValidationEngine.js';

export { AdaptationContext } from './adaptation/AdaptationContext.js';
export { AdaptationResult } from './adaptation/AdaptationResult.js';
export { ProceduralAdapter } from './adaptation/ProceduralAdapter.js';
export { StrategyRegistry, strategyRegistry } from './adaptation/StrategyRegistry.js';
export { AdaptationDispatcher, adaptationDispatcher } from './adaptation/AdaptationDispatcher.js';

export { TimelineComposer, timelineComposer } from './composition/TimelineComposer.js';
export { CompositionGraph } from './composition/CompositionGraph.js';
export { TimelineRouter, timelineRouter } from './composition/TimelineRouter.js';

export { PassThroughStrategy } from './adaptation/strategies/PassThroughStrategy.js';
export { SeededNoiseStrategy } from './adaptation/strategies/SeededNoiseStrategy.js';
export { PeriodicNoiseStrategy } from './adaptation/strategies/PeriodicNoiseStrategy.js';
export { FFTCacheStrategy } from './adaptation/strategies/FFTCacheStrategy.js';
export { ParticleCacheStrategy } from './adaptation/strategies/ParticleCacheStrategy.js';
export { PeriodicEnvelopeStrategy } from './adaptation/strategies/PeriodicEnvelopeStrategy.js';
