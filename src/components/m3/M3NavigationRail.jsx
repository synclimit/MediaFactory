import React from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { Layers, Image, Settings2, MonitorPlay, Type, Music, PlaySquare, Sparkles, Hash } from 'lucide-react';

const CATEGORIES = [
  { id: 'Background', icon: <Image size={24} />, label: 'Background', color: 'blue' },
  { id: 'Playlist Audio', icon: <Music size={24} />, label: 'Playlist', color: 'green' },
  { id: 'Visualizer', icon: <Settings2 size={24} />, label: 'Visualizer', color: 'purple' },
  { id: 'Effects', icon: <Sparkles size={24} />, label: 'Effects', color: 'orange' },
  { id: 'Overlay', icon: <MonitorPlay size={24} />, label: 'Overlay', color: 'cyan' },
  { id: 'Text Objects', icon: <Type size={24} />, label: 'Text', color: 'yellow' },
  { id: 'Audio Reactive', icon: <Hash size={24} />, label: 'Reactive', color: 'red' },
  { id: 'Branding', icon: <Layers size={24} />, label: 'Branding', color: 'pink' },
  { id: 'Render', icon: <PlaySquare size={24} />, label: 'Render', color: 'gray' },
];

const getColorClasses = (color, isActive) => {
  const map = {
    blue: { active: 'bg-blue-900/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]', text: 'text-blue-400' },
    green: { active: 'bg-green-900/40 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]', text: 'text-green-400' },
    purple: { active: 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]', text: 'text-purple-400' },
    orange: { active: 'bg-orange-900/40 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]', text: 'text-orange-400' },
    cyan: { active: 'bg-cyan-900/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]', text: 'text-cyan-400' },
    yellow: { active: 'bg-yellow-900/40 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]', text: 'text-yellow-400' },
    red: { active: 'bg-red-900/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]', text: 'text-red-400' },
    pink: { active: 'bg-pink-900/40 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]', text: 'text-pink-400' },
    gray: { active: 'bg-gray-800/60 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.3)]', text: 'text-gray-300' },
  };
  const c = map[color] || map.blue;
  return isActive ? `${c.active} ${c.text}` : `bg-[#12131a] hover:bg-[#1e2230] border-transparent opacity-60 hover:opacity-100 ${c.text}`;
};

export default function M3NavigationRail({ activeCategory, setActiveCategory }) {
  return (
    <Surface variant={BackgroundVariants.NavigationRail} className="w-[80px] shrink-0 border-r border-[#21232d] flex flex-col h-full py-4 items-center gap-3 overflow-y-auto custom-scrollbar">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const colorClasses = getColorClasses(cat.color, isActive);
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`w-[64px] h-[64px] flex flex-col items-center justify-center rounded-xl border transition-all duration-300 ${colorClasses}`}
          >
            <span className="mb-1">{cat.icon}</span>
            <span className="text-[9px] font-bold tracking-wider uppercase">{cat.label}</span>
          </button>
        );
      })}
    </Surface>
  );
}
