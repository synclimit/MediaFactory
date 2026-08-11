import React, { useRef, useEffect } from 'react';
import { VisualizerV4Core } from '../../../visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from '../../../visualizers/v4/VisualizerV4Audio.js';
import { beatEngine } from '../../../services/audio/BeatEngine';

export default function VisualizerV4Renderer({
  object = {},
  currentTimeSec = 0,
  width,
  height
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const parent = canvas.parentElement;
      const renderWidth = width || (parent && parent.clientWidth > 0 ? parent.clientWidth : 900);
      const renderHeight = height || (parent && parent.clientHeight > 0 ? parent.clientHeight : 250);

      if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, renderWidth, renderHeight);
        // Read live frequencies or fall back to synthetic audio
        let freqs = null;
        try {
          if (window.m3Analyser && typeof window.m3Analyser.getFrequencyData === 'function') {
            freqs = window.m3Analyser.getFrequencyData();
          } else if (beatEngine && typeof beatEngine.getFrequencies === 'function') {
            freqs = beatEngine.getFrequencies();
          }
        } catch (e) {}

        const nowSec = performance.now() / 1000;
        let audioState = null;
        if (freqs && freqs.length > 0) {
          let sum = 0;
          for (let i = 0; i < freqs.length; i++) sum += freqs[i];
          const energy = sum / freqs.length;
          audioState = {
            time: nowSec,
            energy,
            RMS: energy,
            beatStrength: energy,
            bass: freqs[2] || 0.5,
            frequencies: freqs,
            waveform: new Float32Array(freqs.length)
          };
        } else {
          audioState = VisualizerV4Audio.generateSyntheticState(nowSec, 64);
        }

        VisualizerV4Core.renderFrame(ctx, renderWidth, renderHeight, audioState, object);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [object, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none block"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
