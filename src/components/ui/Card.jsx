import React from 'react';
import BackgroundSVG from './BackgroundSVG';
import { BackgroundVariants } from './BackgroundVariants';

export default function Card({ 
    children, 
    className = '', 
    seed,
    onClick,
    onDoubleClick,
    selected = false
}) {
    return (
        <div 
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={`
                relative overflow-hidden cursor-pointer
                w-[340px] h-[190px] rounded-[24px] 
                transition-all duration-250 ease-out
                ${selected 
                    ? 'bg-[rgba(12,18,28,0.95)] border border-[rgba(50,216,255,0.4)] shadow-[0_0_20px_rgba(50,216,255,0.15)] transform -translate-y-1' 
                    : 'bg-[rgba(12,18,28,0.92)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1'
                }
                ${className}
            `}
        >
            <BackgroundSVG variant={BackgroundVariants.Default} opacity={0.05} />
            
            <div className="relative z-10 p-6 h-full flex flex-col">
                {children}
            </div>
        </div>
    );
}
