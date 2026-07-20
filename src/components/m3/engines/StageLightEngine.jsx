import React, { useEffect, useRef, useState } from 'react';

/**
 * StageLightEngine: Draws moving spotlights using Canvas API for performance.
 */
export default function StageLightEngine({ config }) {
    const canvasRef = useRef(null);
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        if (!config || !config.enabled || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
        resizeObserver.observe(canvas.parentElement);

        let animationId;
        let p = 0;

        const renderLoop = () => {
            animationId = requestAnimationFrame(renderLoop);
            const width = canvas.width;
            const height = canvas.height;
            if (width === 0 || height === 0) return;

            // Base speed for lights
            p += (config.speed || 1) * 0.01;
            
            ctx.clearRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'screen';

            const lightCount = config.count || 2;
            const colors = config.colors || ['#ffffff'];

            for (let i = 0; i < lightCount; i++) {
                const color = colors[i % colors.length];
                
                // Calculate moving position
                const phaseOffset = i * (Math.PI * 2 / lightCount);
                const sweepX = width/2 + Math.sin(p + phaseOffset) * (width/3);
                
                // Draw spotlight cone
                ctx.beginPath();
                ctx.moveTo(sweepX, -50); // Origin at top
                ctx.lineTo(sweepX - 200, height);
                ctx.lineTo(sweepX + 200, height);
                ctx.closePath();

                // Gradient for the beam
                const gradient = ctx.createLinearGradient(sweepX, -50, sweepX, height);
                // Convert hex to rgb string for alpha manipulation is ideal, but let's just use hex with transparency string hack or globalAlpha
                ctx.globalAlpha = (config.intensity || 50) / 100;
                
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        };
        renderLoop();
        
        return () => cancelAnimationFrame(animationId);
    }, [config]);

    if (!config || !config.enabled) return null;

    return (
        <canvas 
            ref={canvasRef}
            className="mf-stage-light-engine"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 6
            }}
        />
    );
}
