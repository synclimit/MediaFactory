/**
 * ReferenceEngineAdapter.js
 * Bridge Adapter & Dependency Injection Container for Media Factory.
 * 
 * SPRINT 01 GOVERNANCE:
 * - Feature Flag `useReferenceEngine` is set to FALSE by default.
 * - Legacy rendering pipeline remains 100% active and unmodified.
 * - Reference Engine contracts & registry are loaded in coexistence mode.
 */

import { createRenderContext } from '../contracts/RenderContext.js';
import { createAudioState } from '../audio/AudioState.js';
import { VisualizerRegistry } from '../registry/VisualizerRegistry.js';

export const featureFlags = {
  useReferenceEngine: false,
  enableStrictRenderContext: false,
  enableValidationEngine: false
};

export class ReferenceEngineAdapter {
  constructor() {
    this.isInitialized = false;
    this.registry = VisualizerRegistry;
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
    return this.registry.getPlugin(pluginId);
  }

  isReferenceEngineActive() {
    return featureFlags.useReferenceEngine === true;
  }
}

export const referenceEngineAdapter = new ReferenceEngineAdapter();
