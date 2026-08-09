import React, { useRef, useEffect } from 'react';
import { renderPipelineFrame } from '../../../pipeline/v2/VisualizerPipeline.js';
import { beatEngine } from '../../../services/audio/BeatEngine.js';

export default function Visualizer2Renderer({ config, id, currentTime, audioState }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent && parent.clientWidth > 0 ? parent.clientWidth : (config.width || 600);
    const height = parent && parent.clientHeight > 0 ? parent.clientHeight : (config.height || 300);
    canvas.width = width;
    canvas.height = height;

    const isPausedSnapshot = typeof currentTime === 'number' && !window.m3IsPlaying;
    const timestamp = typeof currentTime === 'number' ? currentTime : (performance.now() / 1000) % 3600;

    const renderSingleFrame = (ts) => {
      if (beatEngine && typeof beatEngine.update === 'function') {
        beatEngine.update(Boolean(window.m3IsPlaying));
      }

      let stateToUse = audioState;
      if (!stateToUse || Object.keys(stateToUse).length === 0) {
        const b = beatEngine.getState() || { bass: 0, mid: 0, treble: 0, energy: 0, kick: false };
        const isLivePlaying = Boolean(window.m3IsPlaying);
        const hasRealAudio = isLivePlaying && b.energy > 0.005;

        const currentEnergy = hasRealAudio ? b.energy : (isLivePlaying ? 0.65 : 0.4);

        const generateFrequencies = (timeSec, baseEnergy) => {
          const arr = new Float32Array(64);
          for (let i = 0; i < 64; i++) {
            const wave1 = Math.sin(timeSec * 3.5 + i * 0.15);
            const wave2 = Math.cos(timeSec * 5.2 + i * 0.28);
            const val = Math.abs(wave1 * 0.6 + wave2 * 0.4) * (baseEnergy || 0.4);
            arr[i] = Math.min(1.0, Math.max(0.05, val));
          }
          return arr;
        };

        const generateWaveform = (timeSec, baseEnergy) => {
          const arr = new Float32Array(64);
          for (let i = 0; i < 64; i++) {
            arr[i] = Math.sin(timeSec * 6 + (i / 64) * Math.PI * 4) * (baseEnergy || 0.35);
          }
          return arr;
        };

        stateToUse = {
          time: ts,
          subBass: hasRealAudio ? b.bass : Math.abs(Math.sin(ts * 2.2)) * currentEnergy,
          bass: hasRealAudio ? b.bass : Math.abs(Math.sin(ts * 2.8)) * currentEnergy,
          lowMid: hasRealAudio ? b.mid : Math.abs(Math.cos(ts * 3.3)) * currentEnergy,
          mid: hasRealAudio ? b.mid : Math.abs(Math.sin(ts * 3.8)) * currentEnergy,
          highMid: hasRealAudio ? b.treble : Math.abs(Math.cos(ts * 4.2)) * currentEnergy,
          treble: hasRealAudio ? b.treble : Math.abs(Math.sin(ts * 4.8)) * currentEnergy,
          energy: currentEnergy,
          RMS: currentEnergy,
          kick: b.kick || Math.sin(ts * 5) > 0.6,
          snare: false,
          beatStrength: currentEnergy,
          spectralFlux: currentEnergy,
          frequencies: hasRealAudio && b.frequencies ? b.frequencies : generateFrequencies(ts, currentEnergy),
          waveform: hasRealAudio && b.waveform ? b.waveform : generateWaveform(ts, currentEnergy)
        };
      }

      let mode = config.mode || config.visualizerId;
      if (mode) {
        const mStr = String(mode).toUpperCase();
        if (mStr.includes('WAVE') || mStr.includes('CYBERPUNK')) mode = 'CYBERPUNK_WAVEFORM';
        else if (mStr.includes('BAR') || mStr.includes('SPECTRUM')) mode = 'SPECTRUM_BARS';
        else if (mStr.includes('PARTICLE') || mStr.includes('ORBIT')) mode = 'PARTICLE_ORBIT';
        else if (mStr.includes('CIRCULAR') || mStr.includes('CIRCLE') || mStr.includes('PULSE') || mStr.includes('RING')) mode = 'CIRCULAR_PULSE';
      }
      if (!mode) mode = 'CIRCULAR_PULSE';
      const visualizerConfig = {
        primaryColor: config.primaryColor || '#00f2fe',
        secondaryColor: config.secondaryColor || '#4facfe',
        ...config
      };

      renderPipelineFrame(canvas, ts, stateToUse, mode, visualizerConfig);
    };

    if (isPausedSnapshot) {
      renderSingleFrame(timestamp);
    } else {
      const renderLoop = () => {
        animId = requestAnimationFrame(renderLoop);
        const ts = (performance.now() / 1000) % 3600;
        renderSingleFrame(ts);
      };
      renderLoop();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [config, currentTime, audioState]);

  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
