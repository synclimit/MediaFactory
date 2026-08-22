import React, { useRef, useEffect } from 'react';
import { VisualizerV4Core } from '../../../visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from '../../../visualizers/v4/VisualizerV4Audio.js';
import { beatEngine } from '../../../services/audio/BeatEngine';
import { fastWorkspaceManager } from '../../../services/pipeline/fastrender/workspace/FastWorkspaceManager.js';
import { fastRenderState } from '../../../services/pipeline/fastrender/core/FastRenderState.js';

export default function VisualizerV4Renderer({
  object = {},
  currentTimeSec = 0,
  width,
  height
}) {
  const canvasRef = useRef(null);
  const paramsRef = useRef({});

  // Keep latest props fresh on every render without tearing down the RAF loop
  paramsRef.current = {
    object,
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
      const { object = {}, currentTimeSec = 0, width: pWidth, height: pHeight } = paramsRef.current;
      const parent = canvas.parentElement;
      const renderWidth = pWidth || (parent && parent.clientWidth > 0 ? parent.clientWidth : 900);
      const renderHeight = pHeight || (parent && parent.clientHeight > 0 ? parent.clientHeight : 250);

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
          String(object.renderMode).toLowerCase() === 'fast';

        const renderMode = isFastWorkspace ? 'fast' : String(object.renderMode || 'normal').toLowerCase();
        const isLivePlaying = Boolean(window.m3IsPlaying);
        const nowSec = renderMode === 'fast'
          ? (performance.now() / 1000) % 3600
          : (typeof currentTimeSec === 'number' && currentTimeSec > 0 ? currentTimeSec : (performance.now() / 1000) % 3600);

        let audioState = null;

        if (renderMode === 'fast') {
          audioState = VisualizerV4Audio.generateSyntheticState(nowSec, 64);
        } else if (!isLivePlaying) {
          const freqs = new Float32Array(64);
          freqs.fill(0.02);
          audioState = {
            time: nowSec,
            energy: 0,
            RMS: 0,
            beatStrength: 0,
            bass: 0,
            frequencies: freqs,
            waveform: new Float32Array(64)
          };
        } else {
          // Normal mode while playing
          let freqs = null;
          try {
            if (window.m3Analyser && typeof window.m3Analyser.getFrequencyData === 'function') {
              freqs = window.m3Analyser.getFrequencyData();
            } else if (beatEngine && typeof beatEngine.getSpectrum === 'function') {
              freqs = beatEngine.getSpectrum();
            }
          } catch (e) {}

          if (freqs && freqs.length > 0) {
            let sum = 0;
            for (let i = 0; i < freqs.length; i++) sum += freqs[i];
            const energy = sum / (freqs.length * 255);
            const normFreqs = new Float32Array(freqs.length);
            for (let i = 0; i < freqs.length; i++) normFreqs[i] = freqs[i] > 1 ? freqs[i] / 255 : freqs[i];

            audioState = {
              time: nowSec,
              energy,
              RMS: energy,
              beatStrength: energy,
              bass: normFreqs[2] || 0.5,
              frequencies: normFreqs,
              waveform: new Float32Array(freqs.length)
            };
          } else {
            audioState = VisualizerV4Audio.generateSyntheticState(nowSec, 64);
          }
        }

        VisualizerV4Core.renderFrame(ctx, renderWidth, renderHeight, audioState, object);
      }

      const activeObj = paramsRef.current.object || {};
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
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none block"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
