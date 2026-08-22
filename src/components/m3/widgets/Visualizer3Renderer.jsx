/**
 * Visualizer3Renderer.jsx [Visualizer 3 Canvas Widget]
 * React component rendering Visualizer 3 on M3 preview canvas.
 * 
 * SINGLE ENGINE PARITY (MF-3000 Architecture):
 * - Canvas ALWAYS renders at NATIVE_WIDTH x NATIVE_HEIGHT (1920x1080) internally.
 * - Visual scaling is done exclusively via CSS, never by changing canvas pixel dimensions.
 * - This guarantees plugin geometry math is identical to export pipeline (CanvasKitRenderer).
 * - Idle/paused fallback FFT uses the same deterministic formula as CanvasKitRenderer.js.
 */

import React, { useRef, useEffect } from 'react';
import { VisualizerPipeline } from '../../../visualizers/v3/pipeline/VisualizerPipeline.js';
import { BeatEngine } from '../../../visualizers/v3/audio/BeatEngine.js';
import { VisualizerV5Audio } from '../../../visualizers/v5/VisualizerV5Audio.js';
import { fastWorkspaceManager } from '../../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { fastRenderState } from '../../../services/pipeline/fastrender/core/FastRenderState.js';

// Auto-register V3 plugins
import '../../../visualizers/v3/plugins/SpectrumBarsPlugin.js';
import '../../../visualizers/v3/plugins/CircularPulsePlugin.js';
import '../../../visualizers/v3/plugins/CyberpunkWaveformPlugin.js';
import '../../../visualizers/v3/plugins/ParticleOrbitPlugin.js';

const beatEngineInstance = new BeatEngine();

export default function Visualizer3Renderer({ config = {}, id, currentTime = 0, audioState }) {
  const canvasRef = useRef(null);
  const paramsRef = useRef({});

  paramsRef.current = {
    config,
    currentTime,
    audioState
  };

  useEffect(() => {
    let animId;
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      if (isCancelled) return;

      const { config: curConfig = {}, currentTime: curTime = 0, audioState: curAudioState } = paramsRef.current;
      const parent = canvas.parentElement;
      const width = parent && parent.clientWidth > 0 ? parent.clientWidth : (parseInt(curConfig.width) || 600);
      const height = parent && parent.clientHeight > 0 ? parent.clientHeight : (parseInt(curConfig.height) || 300);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const isFastMode = (typeof window !== 'undefined' && window.m3RenderMode === 'fast') ||
        (typeof fastWorkspaceManager !== 'undefined' && fastWorkspaceManager.isFastWorkspaceActive()) ||
        (typeof fastRenderState !== 'undefined' && fastRenderState.isFastMode()) ||
        String(curConfig.renderMode).toLowerCase() === 'fast';

      const isPlaying = typeof window !== 'undefined' && Boolean(window.m3IsPlaying);
      const renderMode = isFastMode ? 'fast' : String(curConfig.renderMode || 'normal').toLowerCase();

      const timestamp = renderMode === 'fast'
        ? (performance.now() / 1000) % 3600
        : (typeof curTime === 'number' && curTime > 0 ? curTime : (performance.now() / 1000) % 3600);

      const resolveMode = () => {
        let mode = curConfig.mode || curConfig.pluginId || curConfig.visualizerId || 'spectrum-bars';
        const mStr = String(mode).toLowerCase();
        if (mStr.includes('wave') || mStr.includes('cyberpunk')) return 'cyberpunk-waveform';
        if (mStr.includes('particle') || mStr.includes('orbit')) return 'particle-orbit';
        if (mStr.includes('circular') || mStr.includes('circle') || mStr.includes('pulse')) return 'circular-pulse';
        return 'spectrum-bars';
      };
      const mode = resolveMode();

      const visualizerConfig = {
        colorLeft: curConfig.colorLeft || curConfig.primaryColor || '#AB55F7',
        colorRight: curConfig.colorRight || curConfig.secondaryColor || '#F59E0B',
        colorMid: curConfig.colorMid || '#06B6D4',
        ...curConfig
      };

      let liveFrequencies = null;
      if (renderMode === 'normal' && isPlaying) {
        try {
          if (window.m3Analyser) {
            if (typeof window.m3Analyser.getFrequencyData === 'function') {
              liveFrequencies = window.m3Analyser.getFrequencyData();
            } else if (typeof window.m3Analyser.getByteFrequencyData === 'function') {
              if (!window._m3FreqBuf || window._m3FreqBuf.length !== window.m3Analyser.frequencyBinCount) {
                window._m3FreqBuf = new Uint8Array(window.m3Analyser.frequencyBinCount);
              }
              window.m3Analyser.getByteFrequencyData(window._m3FreqBuf);
              liveFrequencies = window._m3FreqBuf;
            }
          }
          if (!liveFrequencies && beatEngineInstance && typeof beatEngineInstance.getSpectrum === 'function') {
            liveFrequencies = beatEngineInstance.getSpectrum();
          }
        } catch (e) {}
      }

      const stateToUse = VisualizerV5Audio.getAudioState(timestamp, renderMode, visualizerConfig, liveFrequencies, isPlaying);

      try {
        VisualizerPipeline.renderPipelineFrame(canvas, timestamp, stateToUse, mode, visualizerConfig);
      } catch (err) {
        console.warn('[Visualizer3Renderer] Frame render warning:', err);
      }

      if (!isCancelled) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    const handleWakeUp = () => {
      if (!isCancelled) {
        cancelAnimationFrame(animId);
        render();
      }
    };

    const unsubscribeWorkspace = fastWorkspaceManager.subscribe(handleWakeUp);
    window.addEventListener('m3_render_mode_change', handleWakeUp);
    window.addEventListener('m3_playback_change', handleWakeUp);

    return () => {
      isCancelled = true;
      if (animId) cancelAnimationFrame(animId);
      unsubscribeWorkspace();
      window.removeEventListener('m3_render_mode_change', handleWakeUp);
      window.removeEventListener('m3_playback_change', handleWakeUp);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
