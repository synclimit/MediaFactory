import React from 'react';
import Surface from './Surface';
import { BackgroundVariants } from './BackgroundVariants';

export default function Modal({ 
    children, 
    isOpen, 
    onClose,
    title,
    subtitle,
    seed = 42,
    footer
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-8 transition-opacity duration-250 ease-out">
            <Surface 
                variant={BackgroundVariants.Modal}
                className="rounded-[24px] shadow-[0_25px_80px_rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.08)] w-full max-w-5xl h-full max-h-[800px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-250"
            >
                <div className="flex flex-col h-full">
                    <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-center">
                        <div>
                            <h2 className="text-[20px] font-bold text-white tracking-tight">{title}</h2>
                            {subtitle && <p className="text-[13px] text-[#32D8FF] font-mono mt-1">{subtitle}</p>}
                        </div>
                        {onClose && (
                            <button onClick={onClose} className="text-[#738091] hover:text-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden flex">
                        {children}
                    </div>

                    {footer && (
                        <div className="px-8 py-5 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.2)] flex justify-end gap-3 items-center">
                            {footer}
                        </div>
                    )}
                </div>
            </Surface>
        </div>
    );
}
