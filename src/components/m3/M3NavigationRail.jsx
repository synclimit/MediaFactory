import React from 'react';
import { Image, Music, Settings2, Star, MonitorPlay, Type, Layers, Zap, Subtitles } from 'lucide-react';

const CATEGORIES = [
  { id: 'Background', icon: <Image size={20} strokeWidth={1.75} />, label: 'Background' },
  { id: 'Playlist Audio', icon: <Music size={20} strokeWidth={1.75} />, label: 'Playlist' },
  { id: 'Lyrics', icon: <Subtitles size={20} strokeWidth={1.75} />, label: 'Lyrics' },
  { id: 'Visualizer', icon: <Settings2 size={20} strokeWidth={1.75} />, label: 'Visualizer' },
  { id: 'Particle', icon: <Star size={20} strokeWidth={1.75} />, label: 'Particle' },
  { id: 'Effects', icon: <Zap size={20} strokeWidth={1.75} />, label: 'Visual FX' },
  { id: 'Overlay', icon: <MonitorPlay size={20} strokeWidth={1.75} />, label: 'Overlay' },
  { id: 'Text Objects', icon: <Type size={20} strokeWidth={1.75} />, label: 'Text' },
  { id: 'Branding', icon: <Layers size={20} strokeWidth={1.75} />, label: 'Branding' },
];

export default function M3NavigationRail({ activeCategory, setActiveCategory }) {
  return (
    <div className="w-[64px] shrink-0 relative bg-transparent border-r border-[#21232d] flex flex-col h-full pt-2 pb-4 items-center overflow-y-auto custom-scrollbar select-none z-20">
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-0 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-1.5 w-full">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`group relative flex flex-col items-center justify-center w-[52px] h-[48px] rounded-lg transition-all duration-300 ${
              isActive 
                ? 'bg-gradient-to-b from-[#f97316]/20 via-[#f97316]/10 to-transparent text-white border border-[#f97316]/30 shadow-[0_4px_15px_rgba(249,115,22,0.15)]' 
                : 'bg-transparent hover:bg-white/[0.04] text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {/* Left Active Glow Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#f97316] rounded-r-full shadow-[0_0_8px_#f97316] transition-all"></div>
            )}

            <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-[#f97316] mb-1' : 'group-hover:scale-105 mb-0.5'}`}>
              {React.cloneElement(cat.icon, { size: 16 })}
            </div>
            
            <span className={`text-[8px] font-bold text-center leading-tight tracking-wider transition-colors duration-300 ${
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
