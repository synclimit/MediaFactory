import React, { useEffect, useRef } from 'react';

const ChromaKeyVideo = ({ src, keyColor = '#00ff00', tolerance = 10, className, style, alt }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const reqRef = useRef(null);

    // Convert hex to rgb
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 };
    };

    const processFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.paused || video.ended) {
            reqRef.current = requestAnimationFrame(processFrame);
            return;
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        if (canvas.width === 0 || canvas.height === 0) {
            reqRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Use keyColor if provided, otherwise fallback to top-left pixel
        const targetColor = keyColor && keyColor !== 'auto' ? hexToRgb(keyColor) : { r: data[0], g: data[1], b: data[2] };
        
        const tol = (tolerance / 100) * 255;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 0) {
                const diffR = Math.abs(r - targetColor.r);
                const diffG = Math.abs(g - targetColor.g);
                const diffB = Math.abs(b - targetColor.b);
                
                const distance = Math.max(diffR, diffG, diffB); 

                if (distance <= tol) {
                    data[i + 3] = 0;
                } else if (distance <= tol * 1.5) {
                    const alphaRatio = (distance - tol) / (tol * 0.5);
                    data[i + 3] = Math.max(0, Math.min(255, a * alphaRatio));
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        reqRef.current = requestAnimationFrame(processFrame);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.addEventListener('play', () => {
                reqRef.current = requestAnimationFrame(processFrame);
            });
        }
        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [keyColor, tolerance]);

    return (
        <div className={className} style={style}>
            <video 
                ref={videoRef} 
                src={src} 
                crossOrigin="Anonymous" 
                autoPlay 
                loop 
                muted 
                playsInline
                style={{ display: 'none' }} 
            />
            <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
        </div>
    );
};

export default ChromaKeyVideo;
