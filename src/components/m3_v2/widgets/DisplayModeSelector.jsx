import React from 'react';

const DISPLAY_MODES = [
    { id: 'Static', label: 'Static', cost: '★★★★★', fps: 'Very Fast', target: 'Low-end PCs', desc: 'Display subtitle without animation.', experimental: false },
    { id: 'Fade', label: 'Fade', cost: '★★★★★', fps: 'Very Fast', target: 'Low-end PCs', desc: 'Subtitle fades out and in smoothly.', experimental: false },
    { id: 'Paragraph', label: 'Paragraph', cost: '★★★★★', fps: 'Very Fast', target: 'Low-end PCs', desc: 'Display one complete subtitle block until the next one arrives.', experimental: false },
    { id: 'Slide Up', label: 'Slide Up', cost: '★★★★☆', fps: 'Fast', target: 'Normal PCs', desc: 'Rolling subtitle lines upward as new subtitles appear.', experimental: false },
    { id: 'Progressive Words', label: 'Progressive Words', cost: '★★★☆☆', fps: 'Medium', target: 'Normal PCs', desc: 'Reveal words progressively as they are spoken.', experimental: false },
    { id: 'Typewriter', label: 'Typewriter', cost: '★★★☆☆', fps: 'Medium', target: 'Normal PCs', desc: 'Reveal characters progressively like a typewriter.', experimental: false },
    { id: 'Word Highlight', label: 'Word Highlight', cost: '★★☆☆☆', fps: 'Heavy', target: 'High-end PCs', desc: 'Highlight the active word while keeping the sentence layout stable.', experimental: false },
    { id: 'Karaoke Fill', label: 'Karaoke Fill', cost: '★☆☆☆☆', fps: 'Very Heavy', target: 'High-end PCs', desc: 'Traditional karaoke progressive fill effect over text.', experimental: true },
    { id: 'Character Highlight', label: 'Character Highlight', cost: '★☆☆☆☆', fps: 'Extremely Heavy', target: 'High-end PCs', desc: 'Independent highlighting per character (Advanced).', experimental: true },
];

export default function DisplayModeSelector({ value, onChange }) {
    // This is a rich dropdown selector implementation
    const [isOpen, setIsOpen] = React.useState(false);
    
    const selectedMode = DISPLAY_MODES.find(m => m.id === (value || 'Static')) || DISPLAY_MODES[0];

    return (
        <div className="relative w-full text-xs font-sans select-none">
            {/* Header / Selected Value */}
            <div 
                className="flex items-center justify-between w-full h-8 px-3 bg-[#11111a] border border-[#262736] rounded-md cursor-pointer hover:border-[#38394a]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-col">
                    <span className="text-[#e2e2e5]">{selectedMode.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[#a855f7] tracking-widest">{selectedMode.cost}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8c8d9e]">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#11111a] border border-[#262736] rounded-md shadow-2xl max-h-80 overflow-y-auto">
                    {DISPLAY_MODES.map((mode) => (
                        <div 
                            key={mode.id}
                            className={`flex flex-col p-3 border-b border-[#1a1b26] cursor-pointer hover:bg-[#1a1b26] ${mode.id === selectedMode.id ? 'bg-[#1a1b26]' : ''}`}
                            onClick={() => {
                                onChange(mode.id);
                                setIsOpen(false);
                            }}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[#e2e2e5]">{mode.label}</span>
                                    {mode.experimental && (
                                        <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-[#3f2c2c] text-[#fca5a5] rounded">Experimental</span>
                                    )}
                                </div>
                                <span className="text-[#a855f7] tracking-widest text-[10px]">{mode.cost}</span>
                            </div>
                            
                            <p className="text-[#8c8d9e] text-[10px] leading-tight mb-2">
                                {mode.desc}
                            </p>
                            
                            <div className="flex items-center justify-between text-[9px] text-[#5c5d73]">
                                <span>FPS Impact: <span className="text-[#8c8d9e]">{mode.fps}</span></span>
                                <span>Recommended: <span className="text-[#8c8d9e]">{mode.target}</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Click away listener overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
