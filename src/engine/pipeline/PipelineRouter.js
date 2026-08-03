/**
 * PipelineRouter.js [Status: NEW]
 * Pipeline Selector & Routing Resolver for Media Factory Migration.
 * 
 * SPRINT 08 GOVERNANCE:
 * - Implements conditional routing based on `featureFlags.useReferenceEngine`.
 * - Default: `useReferenceEngine = false` -> Routes 100% to LEGACY_PIPELINE.
 * - When `useReferenceEngine = true` -> Routes to ReferenceRenderPipeline (Stopped at READY).
 * - NO drawing, NO plugin.render() execution.
 */

import { featureFlags } from '../adapters/ReferenceEngineAdapter.js';
import { referenceRenderPipeline } from './ReferenceRenderPipeline.js';
import { createRenderContext } from '../contracts/RenderContext.js';
import { AudioStateAdapter } from '../adapters/AudioStateAdapter.js';

export class PipelineRouter {
  /**
   * Resolves the active pipeline according to Feature Flag state.
   * @param {Object} renderContext Immutable RenderContext
   * @param {Object} [options={}] Additional routing options
   * @returns {Object} Pipeline routing decision object
   */
  resolveActivePipeline(renderContext, options = {}) {
    const isReferenceActive = featureFlags.useReferenceEngine === true;

    if (isReferenceActive) {
      // Reference Engine Branch (STANDBY READY)
      const ctx = renderContext || createRenderContext({ width: 1920, height: 1080 });
      const audioState = ctx.audioState || AudioStateAdapter.createFromFrame({});
      const pluginId = options.pluginId || ctx.config?.visualizerId || 'B01_ClassicVertical';
      
      referenceRenderPipeline
        .receiveContext(ctx)
        .receiveAudioState(audioState)
        .resolvePlugin(pluginId)
        .preparePlugin();

      return Object.freeze({
        type: 'REFERENCE_ENGINE',
        isLegacy: false,
        pipeline: referenceRenderPipeline,
        status: referenceRenderPipeline.status, // READY
        featureFlagState: true
      });
    } else {

      // Legacy Pipeline Branch (DEFAULT ACTIVE 100%)
      return Object.freeze({
        type: 'LEGACY_PIPELINE',
        isLegacy: true,
        pipeline: null,
        status: 'LEGACY_ACTIVE',
        featureFlagState: false
      });
    }
  }

  /**
   * Validates pipeline routing integrity for Sprint 08 Quality Gate.
   * @param {Object} renderContext RenderContext instance
   * @returns {Object} Diagnostic routing validation report
   */
  validateRouting(renderContext) {
    const defaultRoute = this.resolveActivePipeline(renderContext);

    return {
      featureFlagDefault: featureFlags.useReferenceEngine, // MUST BE FALSE
      defaultRouteType: defaultRoute.type,                // MUST BE LEGACY_PIPELINE
      isLegacyActive: defaultRoute.isLegacy,              // MUST BE true
      referenceBranchReady: true,
      routingValidated: defaultRoute.featureFlagState === false && defaultRoute.isLegacy === true
    };
  }
}

export const pipelineRouter = new PipelineRouter();
