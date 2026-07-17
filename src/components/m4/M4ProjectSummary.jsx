import React from 'react';
import './m4-theme.css';
import { Video, Music, Settings2, Clock, Disc } from 'lucide-react';

export default function M4ProjectSummary({ m4BgVideo, m4AmbientAudio, m4RelaxMusic }) {
  
  const StatItem = ({ label, value, icon: Icon, active }) => (
    <div className={`flex flex-col gap-1 px-4 py-2 border-r border-[#222] min-w-[120px] ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className="flex items-center gap-1.5 text-gray-500">
        <Icon size={12} />
        <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      <span className={`text-[11px] font-mono truncate ${active ? 'text-white' : 'text-gray-600'}`}>
        {value || 'None'}
      </span>
    </div>
  );

  return (
    <div className="h-[60px] bg-gradient-to-br from-[#1b1d22] via-[#14151a] to-[#0d0e12] border-t border-[#2a2c33] flex items-center shrink-0 w-full z-20 relative overflow-hidden">
      
      {/* Mechanical Panel Grooves (Background Texture) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)`
      }}></div>

      <div className="flex-1 flex items-center h-full overflow-x-auto m4-scroll relative z-10">
        <StatItem label="Video" value={m4BgVideo?.name} icon={Video} active={!!m4BgVideo} />
        <StatItem label="Ambient" value={m4AmbientAudio?.name} icon={Settings2} active={!!m4AmbientAudio} />
        <StatItem label="Music" value={m4RelaxMusic?.name} icon={Music} active={!!m4RelaxMusic} />
        <StatItem label="Loop Mode" value="Seamless" icon={Disc} active={true} />
        <StatItem label="Resolution" value="1080p" icon={Settings2} active={true} />
        <StatItem label="Duration" value="01:00:00" icon={Clock} active={true} />
      </div>
      <div className="px-6 flex flex-col items-end justify-center h-full border-l border-[#222] bg-[#0a0a0a]">
         <span className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">READY</span>
         <span className="text-[9px] text-gray-500">No Render Queue</span>
      </div>
    </div>
  );
}
