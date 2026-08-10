import React, { useRef, useEffect } from 'react';
import { renderPipelineFrame } from '../../../pipeline/v2/VisualizerPipeline.js';
import { beatEngine } from '../../../services/audio/BeatEngine.js';

export default function VisualizerRenderer({ config, id, currentTime, audioState }) {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let isRunning = true;

        const isDeterministic = typeof currentTime === 'number';

        const renderSingleFrame = (timestampMs) => {
            if (!canvas) return;

            const width = canvas.width || 1920;
            const height = canvas.height || 1080;

            ctx.clearRect(0, 0, width, height);

            let stateToUse = audioState;
            let time = isDeterministic ? currentTime : timestampMs / 1000;

            if (!stateToUse || Object.keys(stateToUse).length === 0) {
                if (beatEngine && typeof beatEngine.update === 'function') {
                    beatEngine.update(Boolean(window.m3IsPlaying));
                }

                const numBins = 64;
                const frequencies = new Float32Array(numBins);
                const waveform = new Float32Array(numBins);
                
                const bpm = 128;
                const beatPeriod = 60 / bpm;
                const beatPhase = (time % beatPeriod) / beatPeriod;
                const kickPulse = Math.max(0, 1 - beatPhase * 3);
                
                for (let i = 0; i < 10; i++) {
                  const bassBase = 0.3 + 0.7 * Math.sin(time * 2 + i * 0.5);
                  frequencies[i] = Math.min(1.0, bassBase + kickPulse * 0.6);
                }
                
                for (let i = 10; i < 40; i++) {
                  const midVal = 0.2 + 0.5 * Math.sin(time * 5 + i * 0.2) * Math.cos(time * 1.5);
                  frequencies[i] = Math.abs(midVal);
                }
                
                for (let i = 40; i < numBins; i++) {
                  const hiVal = 0.1 + 0.4 * Math.sin(time * 12 + i * 0.8) * (1 - beatPhase);
                  frequencies[i] = Math.max(0.05, hiVal);
                }

                for (let i = 0; i < numBins; i++) {
                  waveform[i] = Math.sin(time * 20 + (i / numBins) * Math.PI * 4) * 0.5;
                }

                let sum = 0;
                for (let i = 0; i < numBins; i++) sum += frequencies[i];
                const avg = sum / numBins;

                stateToUse = {
                  time,
                  subBass: frequencies[0],
                  bass: frequencies[2],
                  lowMid: frequencies[12],
                  mid: frequencies[25],
                  highMid: frequencies[40],
                  treble: frequencies[55],
                  energy: avg,
                  RMS: avg,
                  kick: kickPulse > 0.4,
                  snare: frequencies[35] > 0.4,
                  beatStrength: kickPulse,
                  spectralFlux: avg,
                  frequencies,
                  waveform
                };
            }

            let mode = config.mode;
            if (!mode && config.visualizerId) {
              const vid = String(config.visualizerId).toUpperCase();
              if (vid.includes('WAVE') || vid.includes('CYBERPUNK')) mode = 'CYBERPUNK_WAVEFORM';
              else if (vid.includes('BAR') || vid.includes('SPECTRUM')) mode = 'SPECTRUM_BARS';
              else if (vid.includes('PARTICLE') || vid.includes('ORBIT')) mode = 'PARTICLE_ORBIT';
              else if (vid.includes('CIRCULAR') || vid.includes('CIRCLE') || vid.includes('PULSE') || vid.includes('RING')) mode = 'CIRCULAR_PULSE';
            }
            if (!mode) mode = 'CIRCULAR_PULSE';

            const visualizerConfig = {
                primaryColor: config.primaryColor || (config.colorLeft ? (config.colorLeft.startsWith('#') ? config.colorLeft : `#${config.colorLeft}`) : '#00f2fe'),
                secondaryColor: config.secondaryColor || (config.colorRight ? (config.colorRight.startsWith('#') ? config.colorRight : `#${config.colorRight}`) : '#4facfe'),
                ...config
            };

            renderPipelineFrame(canvas, time, stateToUse, mode, visualizerConfig);
        };

        const isPausedSnapshot = typeof currentTime === 'number' && !window.m3IsPlaying;

        if (isPausedSnapshot) {
            renderSingleFrame(performance.now());
        } else {
            const renderLoop = (timestamp) => {
                if (!isRunning || !canvas) return;
                renderSingleFrame(timestamp);
                animationFrameRef.current = requestAnimationFrame(renderLoop);
            };
            animationFrameRef.current = requestAnimationFrame(renderLoop);
        }

        // Handle Resize Observer
        const resizeObserver = new ResizeObserver(entries => {
            if (!canvas || !canvas.parentElement) return;
            for (let entry of entries) {
                if (entry.target === canvas.parentElement) {
                    const { width, height } = entry.contentRect;
                    if (width > 0 && height > 0) {
                        canvas.width = width;
                        canvas.height = height;
                    }
                }
            }
        });

        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        return () => {
            isRunning = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            resizeObserver.disconnect();
        };
    }, [config?.visualizerId, config?.visualizerStyle, config, currentTime, audioState]);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
    );
}
