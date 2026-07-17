import React, { useEffect, useRef } from 'react';
import { reactiveObjectProcessor } from '../../../services/audio/ReactiveObjectProcessor';
import { renderSurface } from '../../../services/pipeline/renderer/RenderSurface';

// Central engine for processing realtime visual overlays and DOM modifiers
export default function RealtimeEffectRenderer({ effects, targetRef }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !targetRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const targetElement = targetRef.current;

        const resizeObserver = new ResizeObserver(() => {
            canvas.width = targetElement.offsetWidth;
            canvas.height = targetElement.offsetHeight;
        });
        resizeObserver.observe(targetElement);

        let animationId;
        
        // State for particle systems
        const particleSystems = new Map();

        const initializeEffect = (eff, width, height) => {
            if (eff.category === 'particles' || eff.effect === 'particles') {
                if (!particleSystems.has(eff.id)) {
                    const count = eff.count || 100;
                    const particles = [];
                    for (let i = 0; i < count; i++) {
                        particles.push({
                            x: Math.random() * width,
                            y: Math.random() * height,
                            size: Math.random() * (eff.size || 50) / 10 + 1,
                            speedY: Math.random() * (eff.gravity || 50) / 10 + 1,
                            speedX: (Math.random() - 0.5) * (eff.wind || 0) / 10,
                            phase: Math.random() * Math.PI * 2
                        });
                    }
                    particleSystems.set(eff.id, particles);
                }
            }
        };

        const renderLoop = (time) => {
            animationId = requestAnimationFrame(renderLoop);
            const t0 = performance.now();

            const width = canvas.width;
            const height = canvas.height;
            if (width === 0 || height === 0) return;

            ctx.clearRect(0, 0, width, height);

            // Accumulators for global DOM modifiers
            let brightness = renderSurface.postProcess.brightness * 100;
            let contrast = renderSurface.postProcess.contrast * 100;
            let saturation = renderSurface.postProcess.saturation * 100;
            let blur = renderSurface.postProcess.blur;
            let hueRotate = 0;
            
            // Render Reactive Effects
            // Effects array contains objects with type === 'reactive' (and legacy 'effect')
            effects.forEach(eff => {
                initializeEffect(eff, width, height);
                
                // Get the processed reactive value from Layer 3 (ReactiveObjectProcessor)
                // This value already has threshold, attack, release, smoothing, curve, and amplitude applied.
                const reactiveValue = reactiveObjectProcessor.getValue(eff.id);

                // Apply to DOM modifiers based on effect type
                const type = eff.effect || eff.category || eff.presetId;
                
                if (type === 'zoom' || type === 'zoom-pulse' || type === 'Scale Pulse' || type === 'Zoom Pulse') {
                    // Zoom is now driven by VisualComposition via RenderSurface
                    // No legacy logic applied here.
                } else if (type === 'camera' || type === 'camera-shake' || type === 'Camera Shake') {
                    // Camera is now driven by PreviewRoot via VisualComposition
                    // No legacy logic applied here.
                } else if (type === 'brightness' || type === 'beat-flash' || type === 'Beat Flash' || type === 'Brightness Pulse') {
                    // Additive brightness
                    brightness += reactiveValue * 100;
                } else if (type === 'blur') {
                    blur += reactiveValue * 10; // Max 10px blur per 1.0 unit
                } else if (type === 'color') {
                    // For legacy non-reactive color effects
                    if (eff.presetId === 'brightness') brightness = eff.props?.amount || 100;
                    if (eff.presetId === 'contrast') contrast = eff.props?.amount || 100;
                    if (eff.presetId === 'saturation') saturation = eff.props?.amount || 100;
                }

                // --- Canvas Overlays ---
                if (type === 'particles' || eff.category === 'particles') {
                    const particles = particleSystems.get(eff.id);
                    if (particles) {
                        ctx.fillStyle = eff.presetId === 'snow' ? 'rgba(255,255,255,0.8)' : 
                                        eff.presetId === 'rain' ? 'rgba(150,200,255,0.6)' : 'rgba(255,255,255,0.5)';
                        
                        // Modulate speed with reactive value
                        const speedMult = 1 + reactiveValue * 2;

                        particles.forEach(p => {
                            p.x += p.speedX * speedMult + (eff.presetId === 'snow' ? Math.sin(time/500 + p.phase) : 0);
                            p.y += p.speedY * speedMult;
                            
                            if (p.y > height) {
                                p.y = 0;
                                p.x = Math.random() * width;
                            }
                            if (p.x > width) p.x = 0;
                            if (p.x < 0) p.x = width;

                            if (eff.presetId === 'rain') {
                                ctx.fillRect(p.x, p.y, 1, p.size * 5);
                            } else {
                                ctx.beginPath();
                                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        });
                    }
                } else if (type === 'retro' || eff.category === 'retro') {
                    if (eff.presetId === 'vhs') {
                        // Modulate VHS noise with reactive value
                        const intensity = 0.1 + reactiveValue * 0.3;
                        ctx.fillStyle = `rgba(0,0,0,${intensity})`;
                        for(let i=0; i<height; i+=4) {
                            ctx.fillRect(0, i, width, 1);
                        }
                    }
                }
            });

            // Apply all accumulated DOM modifiers to the target element
            // transform is now handled by PreviewRoot. RealtimeEffectRenderer only handles filters.
            targetElement.style.filter = `brightness(${brightness}%) contrast(${contrast}%) saturation(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
            
            // Add a subtle transition to prevent tearing if frame drops, but keep it low for responsiveness.
            targetElement.style.transition = 'filter 0.05s linear';

            const t1 = performance.now();

            // Telemetry export
            window.m3Diagnostics = window.m3Diagnostics || {};
            window.m3Diagnostics.renderTime = t1 - t0;
            window.m3Diagnostics.domOutputs = {
                brightness,
                contrast,
                saturation,
                blur,
                hueRotate,
                filter: targetElement.style.filter
            };
        };
        
        renderLoop(performance.now());

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            targetElement.style.filter = '';
            targetElement.style.transition = '';
        };
    }, [effects, targetRef]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-50 mix-blend-screen"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
