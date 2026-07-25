import React from 'react';
import { Image, Music, Settings2, Star, Wand2, MonitorPlay, Type, Layers } from 'lucide-react';

const CATEGORIES = [
  { id: 'Background', icon: <Image size={20} strokeWidth={1.75} />, label: 'Background' },
  { id: 'Playlist Audio', icon: <Music size={20} strokeWidth={1.75} />, label: 'Playlist' },
  { id: 'Visualizer', icon: <Settings2 size={20} strokeWidth={1.75} />, label: 'Visualizer' },
  { id: 'Particle', icon: <Star size={20} strokeWidth={1.75} />, label: 'Particle' },
  { id: 'FX Preset', icon: <Wand2 size={20} strokeWidth={1.75} />, label: 'Presets' },
  { id: 'Overlay', icon: <MonitorPlay size={20} strokeWidth={1.75} />, label: 'Overlay' },
  { id: 'Text Objects', icon: <Type size={20} strokeWidth={1.75} />, label: 'Text' },
  { id: 'Branding', icon: <Layers size={20} strokeWidth={1.75} />, label: 'Branding' },
];

export default function M3NavigationRail({ activeCategory, setActiveCategory }) {
  return (
    <div className="w-[88px] shrink-0 relative bg-gradient-to-b from-[#2a2c33] to-[#111216] border-r border-[#2a2c33] flex flex-col h-full py-5 items-center gap-2 overflow-y-auto custom-scrollbar select-none z-20 shadow-[15px_0_40px_rgba(0,0,0,0.5)]">
      <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
      
      <div className="relative z-10 flex flex-col w-full items-center gap-2">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`group relative w-[72px] h-[64px] flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-gradient-to-b from-[#f97316]/20 via-[#f97316]/10 to-transparent text-white border border-[#f97316]/30 shadow-[0_4px_20px_rgba(249,115,22,0.15)]' 
                : 'bg-transparent hover:bg-white/[0.04] text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {/* Left Active Glow Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#f97316] rounded-r-full shadow-[0_0_10px_#f97316] transition-all"></div>
            )}

            <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-[#f97316] mb-1.5' : 'group-hover:scale-105 mb-1'}`}>
              {cat.icon}
            </div>
            
            <span className={`text-[10px] font-semibold tracking-wider transition-colors duration-300 ${
              isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
            }`}>
              {cat.label}
            </span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
