import React from 'react';
import { Image, Music, Settings2, Star, MonitorPlay, Type, Layers, Zap, Subtitles, Activity, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { id: 'Background', icon: <Image size={18} strokeWidth={1.75} />, label: 'Background' },
  { id: 'Playlist Audio', icon: <Music size={18} strokeWidth={1.75} />, label: 'Playlist' },
  { id: 'Lyrics', icon: <Subtitles size={18} strokeWidth={1.75} />, label: 'Lyrics' },
  { id: 'Visualizer', icon: <Settings2 size={18} strokeWidth={1.75} />, label: 'Visualizer' },
  { id: 'Particle', icon: <Star size={18} strokeWidth={1.75} />, label: 'Particle' },
  { id: 'Effects', icon: <Zap size={18} strokeWidth={1.75} />, label: 'Visual FX' },
  { id: 'Overlay', icon: <MonitorPlay size={18} strokeWidth={1.75} />, label: 'Overlay' },
  { id: 'Text Objects', icon: <Type size={18} strokeWidth={1.75} />, label: 'Text' },
  { id: 'Branding', icon: <Layers size={18} strokeWidth={1.75} />, label: 'Branding' },
];

export default function M3NavigationRail({ activeCategory, setActiveCategory, isPanelOpen = true, setIsPanelOpen }) {
  const handleCategoryClick = (catId) => {
    if (activeCategory === catId) {
      if (setIsPanelOpen) {
        setIsPanelOpen(!isPanelOpen);
      }
    } else {
      setActiveCategory(catId);
      if (setIsPanelOpen) {
        setIsPanelOpen(true);
      }
    }
  };

  return (
    <div className="w-[72px] shrink-0 relative bg-[#0b0c10] border-r border-[#21232d] flex flex-col items-center h-full py-2 overflow-y-auto custom-scrollbar select-none z-20">
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-0 pointer-events-none"></div>
      
      {/* Header Badge */}
      <div className="px-1 py-1.5 mb-2 flex flex-col items-center border-b border-[#21232d]/60 shrink-0 w-full">
        <SlidersHorizontal size={14} className="text-orange-500 mb-0.5" />
        <span className="text-[9px] font-black tracking-widest text-orange-400 uppercase">M3</span>
      </div>

      <div className="relative z-10 flex flex-col gap-1 w-full px-1">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const isShowing = isActive && isPanelOpen;
        return (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`group relative flex flex-col items-center justify-center w-full py-2.5 px-1 rounded-lg transition-all duration-200 cursor-pointer ${
              isShowing 
                ? 'bg-gradient-to-b from-[#f97316]/30 via-[#f97316]/15 to-transparent text-white border border-[#f97316]/50 shadow-[0_4px_15px_rgba(249,115,22,0.2)]' 
                : isActive
                ? 'bg-white/[0.06] text-gray-200 border border-white/10'
                : 'bg-transparent hover:bg-white/[0.04] text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            {/* Left Active Glow Indicator */}
            {isShowing && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f97316] rounded-r-full shadow-[0_0_10px_#f97316]"></div>
            )}

            <div className={`transition-transform duration-200 shrink-0 mb-1 ${isShowing ? 'scale-110 text-[#f97316]' : 'group-hover:scale-105 text-gray-400 group-hover:text-gray-200'}`}>
              {React.cloneElement(cat.icon, { size: 16 })}
            </div>
            
            <span className={`text-[9px] font-bold leading-tight tracking-tight text-center transition-colors duration-200 truncate w-full ${
              isShowing ? 'text-white font-black' : 'text-gray-400 group-hover:text-white'
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

