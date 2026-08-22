import React, { useRef, useEffect } from 'react';
import { renderPipelineFrame } from '../../../pipeline/v2/VisualizerPipeline.js';
import { beatEngine } from '../../../services/audio/BeatEngine.js';
import { VisualizerV5Audio } from '../../../visualizers/v5/VisualizerV5Audio.js';
import { fastWorkspaceManager } from '../../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { fastRenderState } from '../../../services/pipeline/fastrender/core/FastRenderState.js';

export default function VisualizerRenderer({ config = {}, id, currentTime = 0, audioState }) {
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

      const { config: curConfig = {}, currentTime: curTime = 0 } = paramsRef.current;
      const parent = canvas.parentElement;
      const width = parent && parent.clientWidth > 0 ? parent.clientWidth : (curConfig.width || 600);
      const height = parent && parent.clientHeight > 0 ? parent.clientHeight : (curConfig.height || 300);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);

        const isFastMode = (typeof window !== 'undefined' && window.m3RenderMode === 'fast') ||
          (typeof fastWorkspaceManager !== 'undefined' && fastWorkspaceManager.isFastWorkspaceActive()) ||
          (typeof fastRenderState !== 'undefined' && fastRenderState.isFastMode()) ||
          String(curConfig.renderMode).toLowerCase() === 'fast';

        const renderMode = isFastMode ? 'fast' : String(curConfig.renderMode || 'normal').toLowerCase();
        const isPlaying = typeof window !== 'undefined' && Boolean(window.m3IsPlaying);

        const timestamp = renderMode === 'fast'
          ? (performance.now() / 1000) % 3600
          : (typeof curTime === 'number' && curTime > 0 ? curTime : (performance.now() / 1000) % 3600);

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
            if (!liveFrequencies && beatEngine && typeof beatEngine.getSpectrum === 'function') {
              liveFrequencies = beatEngine.getSpectrum();
            }
          } catch (e) {}
        }

        const stateToUse = VisualizerV5Audio.getAudioState(timestamp, renderMode, curConfig, liveFrequencies, isPlaying);

        let mode = curConfig.mode || curConfig.visualizerId;
        if (mode) {
          const mStr = String(mode).toUpperCase();
          if (mStr.includes('WAVE') || mStr.includes('CYBERPUNK')) mode = 'CYBERPUNK_WAVEFORM';
          else if (mStr.includes('BAR') || mStr.includes('SPECTRUM')) mode = 'SPECTRUM_BARS';
          else if (mStr.includes('PARTICLE') || mStr.includes('ORBIT')) mode = 'PARTICLE_ORBIT';
          else if (mStr.includes('CIRCULAR') || mStr.includes('CIRCLE') || mStr.includes('PULSE') || mStr.includes('RING')) mode = 'CIRCULAR_PULSE';
        }
        if (!mode) mode = 'CIRCULAR_PULSE';

        const visualizerConfig = {
          primaryColor: curConfig.primaryColor || (curConfig.colorLeft ? (curConfig.colorLeft.startsWith('#') ? curConfig.colorLeft : `#${curConfig.colorLeft}`) : '#00f2fe'),
          secondaryColor: curConfig.secondaryColor || (curConfig.colorRight ? (curConfig.colorRight.startsWith('#') ? curConfig.colorRight : `#${curConfig.colorRight}`) : '#4facfe'),
          ...curConfig
        };

        renderPipelineFrame(canvas, timestamp, stateToUse, mode, visualizerConfig);
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
