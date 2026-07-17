import React, { useMemo } from 'react';

const BackgroundSVG = ({ 
    variant = 1,
    opacity = 0.15,
    scale = 1.1,
    className = "",
    bgPosition = "center",
    bgSize = "cover",
    transformOrigin = "top left"
}) => {
    // Ensure variant is exactly 1-10
    const safeVariant = useMemo(() => {
        let v = parseInt(variant, 10);
        if (isNaN(v) || v < 1 || v > 10) return 1;
        return v;
    }, [variant]);

    const svgUrl = `/assets/design/backgrounds/midnight-flow-v2-${safeVariant.toString().padStart(2, '0')}.svg`;

    return (
        <div 
            className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
            style={{
                backgroundImage: `url(${svgUrl})`,
                backgroundSize: bgSize,
                backgroundPosition: bgPosition,
                backgroundRepeat: 'no-repeat',
                opacity: opacity,
                transform: `scale(${scale})`,
                transformOrigin: transformOrigin
            }}
        />
    );
};

export default BackgroundSVG;
