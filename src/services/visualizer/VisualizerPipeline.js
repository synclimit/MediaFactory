/**
 * VisualizerPipeline.js
 * MF-4000 Single Shared Visualizer Pipeline
 * Manages active visualizer plugin instance, shared state, deterministic seed, and invokes plugin.generateGeometry().
 */

import { sharedAudioAnalysisEngine } from '../audio/SharedAudioAnalysisEngine.js';

export class VisualizerPipeline {
  constructor() {
    this.activePlugin = null;
    this.activePluginId = 'bars-classic-vertical';
    this.sharedState = {};
    this.projectSeed = 1337;
  }

  /**
   * Register and load plugin into the shared pipeline singleton.
   */
  async loadPlugin(plugin) {
    if (!plugin) return false;
    this.activePlugin = plugin;
    this.activePluginId = plugin.metadata?.id || 'bars-classic-vertical';
    this.sharedState = {
      animationProgress: 0,
      peakHistory: new Array(128).fill(0),
      colorStep: 0
    };
    return true;
  }

  /**
   * Set active plugin directly.
   */
  setActivePlugin(plugin) {
    this.activePlugin = plugin;
  }

  /**
   * Deterministic Pseudo-Random Generator (Seeded)
   */
  seededRandom(seed = 1337) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Single Entry Point for Generating GeometryPrimitives for any Frame.
   */
  renderFrame(frameIndex = 0, audioKey = 'default_audio', viewport = { width: 1920, height: 1080 }, config = {}) {
    // 1. Fetch deterministic FFT from Shared Audio Analysis Engine
    const fftFrame = sharedAudioAnalysisEngine.getFrame(audioKey, frameIndex);

    // 2. Fallback plugin geometry calculation if no plugin loaded
    if (!this.activePlugin || typeof this.activePlugin.generateGeometry !== 'function') {
      return this.generateDefaultBarPrimitives(fftFrame, viewport, config);
    }

    // 3. Update Shared State deterministically per frame
    this.sharedState.animationProgress = (frameIndex / 60) % 1.0;
    this.sharedState.colorStep = (frameIndex % 360);

    // 4. Single Source Geometry Generation
    const primitives = this.activePlugin.generateGeometry(fftFrame, viewport, config, this.sharedState);

    if (frameIndex === 100) {
      console.log('=== [RUNTIME DEBUG FRAME 100 - PIPELINE] ===');
      console.log('1. Active Plugin ID:', this.activePluginId || this.activePlugin?.metadata?.id);
      console.log('2. FFT Spectrum:', fftFrame.spectrum.length, fftFrame.spectrum[0], fftFrame.spectrum[1], fftFrame.spectrum[2]);
      console.log('3. Geometry Primitives Count:', primitives ? primitives.length : 0);
      console.log('4. First Primitive:', primitives ? primitives[0] : null);
    }

    return primitives;
  }

  /**
   * Pure Primitive Fallback Generator (Default Bars)
   */
  generateDefaultBarPrimitives(fftFrame, viewport, config) {
    const barCount = config?.barCount || 64;
    const spacing = config?.spacing || 4;
    const vizHeight = config?.height || 250;
    const vizWidth = viewport.width;
    const barWidth = (vizWidth - (barCount - 1) * spacing) / barCount;
    const primitives = [];

    const colorLeft = config?.colorLeft || '#AB55F7';
    const colorRight = config?.colorRight || '#F59E0B';

    for (let i = 0; i < barCount; i++) {
      const fftVal = fftFrame.spectrum[i % fftFrame.spectrum.length] / 255;
      const h = Math.max(4, Math.round(fftVal * vizHeight * 0.85));
      const x = Math.round(i * (barWidth + spacing));
      const y = Math.round(viewport.height - h - (config?.paddingBottom || 40));

      const ratio = i / barCount;
      const fillColor = ratio < 0.5 ? colorLeft : colorRight;

      primitives.push({
        type: 'rect',
        x,
        y,
        width: Math.round(barWidth),
        height: h,
        fillColor,
        cornerRadius: config?.cornerRadius || 4
      });
    }

    return primitives;
  }
}

export const sharedVisualizerPipeline = new VisualizerPipeline();
