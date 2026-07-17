import React from 'react';

export default function M4Timeline() {
  const tracks = [
    { name: 'Video', color: 'bg-blue-500' },
    { name: 'Ambient', color: 'bg-emerald-500' },
    { name: 'Music', color: 'bg-purple-500' },
    { name: 'Effect', color: 'bg-amber-500' },
    { name: 'Overlay', color: 'bg-gray-400' },
    { name: 'Text', color: 'bg-gray-300' }
  ];

  return (
    <div className="h-48 bg-[#0c0d12] flex flex-col shrink-0">
      {/* Header Controls */}
      <div className="h-8 border-b border-[#21232d] bg-[#12131a] flex items-center px-4 justify-between shrink-0 text-[10px] font-bold uppercase text-gray-400">
        <div className="flex gap-4">
          <button className="hover:text-white transition-colors">▶ Play</button>
          <button className="hover:text-white transition-colors">⏸ Pause</button>
          <button className="hover:text-white transition-colors">⏹ Stop</button>
          <button className="hover:text-white transition-colors">🔄 Restart</button>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-blue-400">Loop Mode: Seamless</span>
          <span className="text-gray-500 font-mono">00:00:15 / 02:00:00</span>
        </div>
      </div>

      {/* Time Ruler */}
      <div className="h-6 border-b border-[#21232d] bg-[#181922] flex relative shrink-0">
        <div className="w-40 border-r border-[#21232d] shrink-0 bg-[#12131a]"></div>
        <div className="flex-1 relative overflow-hidden text-[9px] text-gray-500 flex items-end pb-1 font-mono">
          <div className="absolute left-[0%] px-1">00:00</div>
          <div className="absolute left-[20%] px-1 border-l border-gray-600 h-2">05:00</div>
          <div className="absolute left-[40%] px-1 border-l border-gray-600 h-2">10:00</div>
          <div className="absolute left-[60%] px-1 border-l border-gray-600 h-2">15:00</div>
          <div className="absolute left-[80%] px-1 border-l border-gray-600 h-2">20:00</div>
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {tracks.map((track, i) => (
          <div key={i} className="flex h-10 border-b border-[#21232d] hover:bg-[#12131a] transition-colors group">
            {/* Track Header */}
            <div className="w-40 bg-[#0c0d12] border-r border-[#21232d] shrink-0 flex items-center px-4 justify-between">
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-200">{track.name}</span>
              <div className="flex gap-1 opacity-50">
                <div className="w-2 h-2 rounded-full bg-gray-600 cursor-pointer hover:bg-white" title="Mute"></div>
                <div className="w-2 h-2 rounded-full bg-gray-600 cursor-pointer hover:bg-white" title="Solo"></div>
              </div>
            </div>
            {/* Track Content (Dummy Block) */}
            <div className="flex-1 relative p-1">
              <div className={`absolute top-1 bottom-1 left-4 right-12 rounded opacity-50 ${track.color}`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
