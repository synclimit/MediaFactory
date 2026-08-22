/**
 * VisualizerV5Renderer.jsx (M3 Legacy & Parity Bridge)
 * React Live Editor Renderer Component for Visualizer V5.
 */

import React, { useRef, useEffect } from 'react';
import { VisualizerV5Core } from '../../visualizers/v5/VisualizerV5Core.js';
import { VisualizerV5Audio } from '../../visualizers/v5/VisualizerV5Audio.js';
import { beatEngine } from '../../services/audio/BeatEngine.js';
import { fastWorkspaceManager } from '../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { fastRenderState } from '../../services/pipeline/fastrender/core/FastRenderState.js';

export default function VisualizerV5Renderer({
  object = {},
  config = {},
  currentTimeSec = 0,
  width,
  height
}) {
  const canvasRef = useRef(null);
  const paramsRef = useRef({});

  // Keep latest props fresh on every render without tearing down the RAF loop
  paramsRef.current = {
    cfg: { ...object, ...config },
    currentTimeSec,
    width,
    height
  };

  useEffect(() => {
    let animId;
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      if (isCancelled) return;

      const { cfg = {}, currentTimeSec = 0, width: pWidth, height: pHeight } = paramsRef.current;
      const parent = canvas.parentElement;
      const renderWidth = pWidth || (parent && parent.clientWidth > 0 ? parent.clientWidth : (cfg.width || 600));
      const renderHeight = pHeight || (parent && parent.clientHeight > 0 ? parent.clientHeight : (cfg.height || 300));

      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, renderWidth, renderHeight);

        const isFastWorkspace = (typeof window !== 'undefined' && window.m3RenderMode === 'fast') ||
          (typeof fastWorkspaceManager !== 'undefined' && fastWorkspaceManager.isFastWorkspaceActive()) ||
          (typeof fastRenderState !== 'undefined' && fastRenderState.isFastMode()) ||
          String(cfg.renderMode).toLowerCase() === 'fast';

        const renderMode = isFastWorkspace ? 'fast' : String(cfg.renderMode || 'normal').toLowerCase();
        const isLivePlaying = Boolean(window.m3IsPlaying);

        // In FAST mode, always use continuous performance clock for butter-smooth 60fps animation
        const timestamp = renderMode === 'fast'
          ? (performance.now() / 1000) % 3600
          : (typeof currentTimeSec === 'number' && currentTimeSec > 0 ? currentTimeSec : (performance.now() / 1000) % 3600);

        // 1. Fetch live audio frequencies if mode is 'normal'
        let liveFrequencies = null;
        if (renderMode === 'normal' && isLivePlaying) {
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
            if (!liveFrequencies && beatEngine && typeof beatEngine.getSpectrum === 'function') {
              liveFrequencies = beatEngine.getSpectrum();
            }
          } catch (e) {}
        }

        // 2. Resolve Audio State (flat/still when paused in normal mode; continuous abstract math in fast mode)
        const audioState = VisualizerV5Audio.getAudioState(timestamp, renderMode, cfg, liveFrequencies, isLivePlaying);

        // 3. Render Frame via Core Single-Engine
        VisualizerV5Core.renderFrame(ctx, renderWidth, renderHeight, audioState, cfg);
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
        className="w-full h-full block"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
