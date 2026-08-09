/**
 * ReferenceEngineAdapter.js
 * Bridge Adapter & Dependency Injection Container for Media Factory.
 * 
 * SPRINT 25 GOVERNANCE:
 * - Feature Flag `useReferenceEngine` is ENABLED (true) for development/testing.
 * - Live Preview drives 100% via ReferencePreviewDriver -> ReferenceRenderPipeline -> Core Engine -> Canvas2D Adapter.
 */

import { createRenderContext } from '../contracts/RenderContext.js';
import { createAudioState } from '../audio/AudioState.js';
import { VisualizerRegistry } from '../registry/VisualizerRegistry.js';
import { visualizerRegistryAdapter } from './VisualizerRegistryAdapter.js';
import { referenceRenderPipeline } from '../pipeline/ReferenceRenderPipeline.js';
import { pipelineRouter } from '../pipeline/PipelineRouter.js';
import { cutoverValidator } from '../pipeline/CutoverValidator.js';
import { referencePreviewDriver } from '../pipeline/ReferencePreviewDriver.js';

export const featureFlags = {
  useReferenceEngine: true,
  showReferencePreview: false,
  enableStrictRenderContext: true,
  enableValidationEngine: false
};

export class ReferenceEngineAdapter {
  constructor() {
    this.isInitialized = false;
    this.registry = VisualizerRegistry;
    this.registryAdapter = visualizerRegistryAdapter;
    this.pipeline = referenceRenderPipeline;
  }

  get router() {
    return pipelineRouter;
  }

  get validator() {
    return cutoverValidator;
  }

  get driver() {
    return referencePreviewDriver;
  }

  initialize() {
    if (this.isInitialized) return true;
    this.isInitialized = true;
    return true;
  }

  createRenderContext(params) {
    return createRenderContext(params);
  }

  createAudioState(params) {
    return createAudioState(params);
  }

  getPlugin(pluginId) {
    const mappedId = this.registryAdapter.getMappedReferenceId(pluginId);
    return this.registry.getPlugin(mappedId) || this.registry.getPlugin(pluginId);
  }

  isReferenceEngineActive() {
    return featureFlags.useReferenceEngine === true;
  }
}

export const referenceEngineAdapter = new ReferenceEngineAdapter();
