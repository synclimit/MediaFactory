import React from 'react';
import Surface from './Surface';
import { BackgroundVariants } from './BackgroundVariants';

export default function Drawer({ 
    children, 
    isOpen, 
    onClose,
    seed = 99
}) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-250 ease-out"
                onClick={onClose}
            />

            {/* Drawer Container */}
            <Surface 
                variant={BackgroundVariants.Drawer}
                blur="2px"
                glassOpacity={0.1}
                svgOpacity={1.0}
                svgClassName="brightness-[2.0] contrast-[1.5] hue-rotate-[-30deg] saturate-[2.0]"
                className={`
                    fixed top-0 right-0 z-50 h-full w-[340px]
                    rounded-l-[28px]
                    shadow-[0_0_80px_rgba(0,0,0,0.6)]
                    transform transition-transform duration-250 ease-out
                `}
            >
                {/* Layer 5: UI Components */}
                <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden p-0 custom-scrollbar">
                    {children}
                </div>
            </Surface>
        </>
    );
}
