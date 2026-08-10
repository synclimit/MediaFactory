import React, { useEffect, useRef } from 'react';

/**
 * LaserEngine: Draws moving laser beams.
 */
export default function LaserEngine({ config }) {
    const canvasRef = useRef(null);

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

            p += (config.speed || 1) * 0.05; // Lasers move faster
            
            // Trailing effect by fading instead of clearRect
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.globalCompositeOperation = 'screen';

            const count = config.count || 4;
            const color = config.color || '#00ff00';
            const originY = config.origin === 'bottom' ? height : 0;

            for (let i = 0; i < count; i++) {
                const phaseOffset = i * (Math.PI / count);
                const sweepX = width/2 + Math.sin(p + phaseOffset) * (width/1.5);
                
                ctx.beginPath();
                ctx.moveTo(width/2, originY); // Lasers often originate from center
                ctx.lineTo(sweepX, originY === 0 ? height : 0);
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
                ctx.stroke();
            }
            
            // Reset for next frame
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0;
        };
        renderLoop();
        
        return () => cancelAnimationFrame(animationId);
    }, [config]);

    if (!config || !config.enabled) return null;

    return (
        <canvas 
            ref={canvasRef}
            className="mf-laser-engine"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 7,
                mixBlendMode: 'screen'
            }}
        />
    );
}
