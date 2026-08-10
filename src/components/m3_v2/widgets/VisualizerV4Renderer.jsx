import React, { useRef, useEffect } from 'react';
import { VisualizerV4Core } from '../../../visualizers/v4/VisualizerV4Core.js';
import { VisualizerV4Audio } from '../../../visualizers/v4/VisualizerV4Audio.js';

export default function VisualizerV4Renderer({
  object = {},
  currentTimeSec = 0,
  analyser = null,
  width,
  height
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const renderWidth = width || (parent ? parent.clientWidth : 600);
    const renderHeight = height || (parent ? parent.clientHeight : 300);

    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let audioState = null;

    if (analyser && typeof analyser.getFrequencyData === 'function') {
      try {
        const freqs = analyser.getFrequencyData();
        const waveform = analyser.getWaveformData ? analyser.getWaveformData() : new Float32Array(freqs.length);
        let sum = 0;
        for (let i = 0; i < freqs.length; i++) sum += freqs[i];
        const energy = sum / freqs.length;

        audioState = {
          time: currentTimeSec,
          energy,
          RMS: energy,
          beatStrength: energy,
          bass: freqs[2] || 0,
          frequencies: freqs,
          waveform
        };
      } catch (e) {}
    }

    if (!audioState) {
      audioState = VisualizerV4Audio.generateSyntheticState(currentTimeSec || 1.0, 64);
    }

    VisualizerV4Core.renderFrame(ctx, renderWidth, renderHeight, audioState, object);
  }, [object, currentTimeSec, analyser, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none block"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
