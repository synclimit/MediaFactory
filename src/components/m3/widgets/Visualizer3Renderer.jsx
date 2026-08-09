/**
 * Visualizer3Renderer.jsx [Visualizer 3 Canvas Widget]
 * React component rendering Visualizer 3 on M3 preview canvas.
 * 
 * 100% Powered by Single Pipeline Entrypoint (VisualizerPipeline.js V3).
 */

import React, { useRef, useEffect } from 'react';
import { VisualizerPipeline } from '../../../visualizers/v3/pipeline/VisualizerPipeline.js';
import { BeatEngine } from '../../../visualizers/v3/audio/BeatEngine.js';

// Auto-register V3 plugins
import '../../../visualizers/v3/plugins/SpectrumBarsPlugin.js';
import '../../../visualizers/v3/plugins/CircularPulsePlugin.js';
import '../../../visualizers/v3/plugins/CyberpunkWaveformPlugin.js';
import '../../../visualizers/v3/plugins/ParticleOrbitPlugin.js';

const beatEngineInstance = new BeatEngine();

export default function Visualizer3Renderer({ config, id, currentTime, audioState }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    let width = parent && parent.clientWidth > 0 ? parent.clientWidth : (config.width || 600);
    let height = parent && parent.clientHeight > 0 ? parent.clientHeight : (config.height || 300);
    if (width <= 0) width = 600;
    if (height <= 0) height = 300;
    canvas.width = width;
    canvas.height = height;

    const isPausedSnapshot = typeof currentTime === 'number' && !window.m3IsPlaying;
    const timestamp = typeof currentTime === 'number' ? currentTime : (performance.now() / 1000) % 3600;

    const renderSingleFrame = (ts) => {
      let stateToUse = audioState;
      if (!stateToUse || !stateToUse.frequencies || stateToUse.frequencies.length === 0) {
        const rawFreqs = new Uint8Array(64);
        const rawWave = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
          const w = Math.sin(ts * 4 + i * 0.2);
          rawFreqs[i] = Math.min(255, Math.max(0, Math.floor(Math.abs(w) * 200)));
          rawWave[i] = Math.min(255, Math.max(0, Math.floor(128 + w * 100)));
        }
        stateToUse = beatEngineInstance.processFrame(ts, rawFreqs, rawWave, 44100);
      }

      let mode = config.mode || config.pluginId || 'spectrum-bars';
      const mStr = String(mode).toLowerCase();
      if (mStr.includes('wave') || mStr.includes('cyberpunk')) mode = 'cyberpunk-waveform';
      else if (mStr.includes('bar') || mStr.includes('spectrum')) mode = 'spectrum-bars';
      else if (mStr.includes('particle') || mStr.includes('orbit')) mode = 'particle-orbit';
      else if (mStr.includes('circular') || mStr.includes('circle') || mStr.includes('pulse')) mode = 'circular-pulse';

      const visualizerConfig = {
        colorLeft: config.colorLeft || config.primaryColor || '#AB55F7',
        colorRight: config.colorRight || config.secondaryColor || '#F59E0B',
        colorMid: config.colorMid || '#06B6D4',
        ...config
      };

      try {
        VisualizerPipeline.renderPipelineFrame(canvas, ts, stateToUse, mode, visualizerConfig);
      } catch (err) {
        console.warn('[Visualizer3Renderer] Frame render warning:', err);
      }
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
