import React, { forwardRef } from 'react';
import BackgroundSVG from './BackgroundSVG';
import { BackgroundVariants } from './BackgroundVariants';

const Surface = forwardRef(({ 
    children, 
    variant = BackgroundVariants.Default,
    className = "",
    withGlow = true,
    glassOpacity = 0.45,
    blur = "20px",
    bgPosition = "center",
    svgOpacity = 0.35,
    bgSize = "cover",
    transformOrigin = "top left",
    svgClassName = "",
    contentClassName = "",
    ...props
}, ref) => {
    const positionClass = className.match(/\b(absolute|fixed|relative)\b/) ? '' : 'relative';
    return (
        <div ref={ref} className={`${positionClass} overflow-hidden ${className}`} {...props}>
            {/* Layer 1: Dark Base Gradient */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#020304_0%,#071016_50%,#030506_100%)] z-0"></div>

            {/* Layer 2: Official SVG Background */}
            <BackgroundSVG 
                variant={variant} 
                opacity={svgOpacity} 
                className={`z-[1] ${svgClassName}`} 
                bgPosition={variant === BackgroundVariants.Drawer ? '10% 80%' : bgPosition}
                bgSize={variant === BackgroundVariants.Drawer ? '1200px' : bgSize}
                transformOrigin={variant === BackgroundVariants.Drawer ? 'left center' : transformOrigin}
            />

            {/* Layer 3: Soft Radial Glow (GPU Accelerated) */}
            {withGlow && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]" style={{ transform: 'translateZ(0)', contain: 'strict' }}>
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(50,216,255,0.12),transparent_70%)] rounded-full blur-[80px]" style={{ transform: 'translateZ(0)' }}></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_center,rgba(50,216,255,0.08),transparent_70%)] rounded-full blur-[90px]" style={{ transform: 'translateZ(0)' }}></div>
                </div>
            )}

            {/* Layer 4: Base Overlay (No Blur) */}
            <div 
                className="absolute inset-0 border border-[rgba(255,255,255,0.05)] z-[3] pointer-events-none"
                style={{ backgroundColor: `rgba(8,12,18,${glassOpacity})` }}
            ></div>

            {/* Layer 5: UI Content */}
            <div className={`relative z-[4] w-full h-full flex flex-col ${contentClassName}`}>
                {children}
            </div>
        </div>
    );
});

export default Surface;
