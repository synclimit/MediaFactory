import React, { useState, useEffect, useRef } from 'react';

const ChromaKeyImage = ({ src, keyColor = '#00ff00', tolerance = 10, className, style, alt }) => {
    const [processedSrc, setProcessedSrc] = useState(src);
    const canvasRef = useRef(null);

    // Convert hex to rgb
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 255, b: 0 };
    };

    useEffect(() => {
        if (!src) return;
        
        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Auto-detect background color from the top-left pixel
            const targetColor = { r: data[0], g: data[1], b: data[2] };
            
            // Normalize tolerance from 0-100 to 0-255
            const tol = (tolerance / 100) * 255;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a > 0) {
                    // Calculate color distance (simple euclidean distance approximation)
                    const diffR = Math.abs(r - targetColor.r);
                    const diffG = Math.abs(g - targetColor.g);
                    const diffB = Math.abs(b - targetColor.b);
                    
                    const distance = Math.max(diffR, diffG, diffB); // Cheaper than sqrt

                    if (distance <= tol) {
                        // Exact or close match -> completely transparent
                        data[i + 3] = 0;
                    } else if (distance <= tol * 1.5) {
                        // Smooth edges for anti-aliasing (semi-transparent)
                        const alphaRatio = (distance - tol) / (tol * 0.5);
                        data[i + 3] = Math.max(0, Math.min(255, a * alphaRatio));
                    }
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            setProcessedSrc(canvas.toDataURL('image/png'));
        };

        // Allow fetching blob URIs generated locally or standard remote assets
        img.src = src;

    }, [src, keyColor, tolerance]);

    return (
        <>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <img src={processedSrc} className={className} style={style} alt={alt} />
        </>
    );
};

export default ChromaKeyImage;
