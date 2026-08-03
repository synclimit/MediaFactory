/**
 * ReferenceRenderPipeline.js [Status: NEW]
 * Production Reference Engine v1.0 Master Render Pipeline Lifecycle Container.
 * 
 * SPRINT 07 GOVERNANCE:
 * - Prepares execution flow: receive(RenderContext) -> receive(AudioState) -> resolvePlugin() -> preparePlugin() -> READY.
 * - MUST STOP at READY state.
 * - MUST NOT draw to canvas.
 * - MUST NOT call plugin.render().
 * - Feature Flag `useReferenceEngine` remains FALSE.
 * - Legacy VisualizerRuntime & CanvasKitRenderer remain 100% ACTIVE.
 */

import { VisualizerRegistry } from '../registry/VisualizerRegistry.js';
import { visualizerRegistryAdapter } from '../adapters/VisualizerRegistryAdapter.js';

export class ReferenceRenderPipeline {
  constructor() {
    this.currentContext = null;
    this.currentAudioState = null;
    this.currentPlugin = null;
    this.status = 'UNINITIALIZED'; // States: UNINITIALIZED, CONTEXT_RECEIVED, AUDIO_RECEIVED, PLUGIN_RESOLVED, READY
  }

  /**
   * 1. Receive RenderContext contract instance.
   * @param {Object} renderContext Immutable RenderContext
   * @returns {ReferenceRenderPipeline}
   */
  receiveContext(renderContext) {
    if (!renderContext) {
      throw new Error('[ReferenceRenderPipeline] Invalid RenderContext provided');
    }
    this.currentContext = renderContext;
    this.status = 'CONTEXT_RECEIVED';
    return this;
  }

  /**
   * 2. Receive AudioState contract instance.
   * @param {Object} audioState Immutable AudioState
   * @returns {ReferenceRenderPipeline}
   */
  receiveAudioState(audioState) {
    if (!audioState) {
      throw new Error('[ReferenceRenderPipeline] Invalid AudioState provided');
    }
    this.currentAudioState = audioState;
    this.status = 'AUDIO_RECEIVED';
    return this;
  }

  /**
   * 3. Resolve Visualizer Plugin by ID.
   * @param {string} pluginId Plugin ID (Legacy or Reference)
   * @returns {ReferenceRenderPipeline}
   */
  resolvePlugin(pluginId) {
    const refId = visualizerRegistryAdapter.getMappedReferenceId(pluginId);
    const plugin = VisualizerRegistry.getPlugin(refId) || VisualizerRegistry.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`[ReferenceRenderPipeline] Could not resolve plugin for ID: ${pluginId}`);
    }
    this.currentPlugin = plugin;
    this.status = 'PLUGIN_RESOLVED';
    return this;
  }

  /**
   * 4. Prepare plugin and set pipeline status to READY.
   * @returns {ReferenceRenderPipeline}
   */
  preparePlugin() {
    if (!this.currentPlugin) {
      throw new Error('[ReferenceRenderPipeline] Cannot prepare: No plugin resolved');
    }
    this.status = 'READY';
    return this;
  }

  /**
   * Validates pipeline readiness for Sprint 07 Quality Gate.
   * @returns {Object} Diagnostic status report
   */
  validatePipelineReady() {
    const isReady = this.status === 'READY' && Boolean(this.currentPlugin) && Boolean(this.currentContext);
    return {
      status: this.status,
      isReady,
      pluginId: this.currentPlugin?.id || null,
      pluginName: this.currentPlugin?.name || null,
      contextAvailable: Boolean(this.currentContext),
      audioStateAvailable: Boolean(this.currentAudioState),
      executionPrevented: true, // SPRINT 07 STRICTNESS: Execution stopped at READY
      canvasDrawPrevented: true
    };
  }
}

export const referenceRenderPipeline = new ReferenceRenderPipeline();
