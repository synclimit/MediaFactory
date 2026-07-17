import React from 'react';

export const ThumbnailCard = ({ title, icon, onClick, active, color = 'blue' }) => {
  const activeClasses = {
    blue: 'bg-blue-900/40 border-blue-500',
    purple: 'bg-purple-900/40 border-purple-500',
    orange: 'bg-orange-900/40 border-orange-500',
    cyan: 'bg-cyan-900/40 border-cyan-500',
    yellow: 'bg-yellow-900/40 border-yellow-500',
    red: 'bg-red-900/40 border-red-500',
    pink: 'bg-pink-900/40 border-pink-500',
    gray: 'bg-gray-800/60 border-gray-400'
  }[color];

  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${active ? activeClasses : 'bg-[#181922] hover:bg-[#1e2230] border-[#2d3247] hover:border-gray-500'}`}
    >
      <div className="w-10 h-10 shrink-0 rounded flex items-center justify-center text-xl bg-[#0c0d12] border border-[#21232d] overflow-hidden relative">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-gray-300 text-left leading-tight">{title}</span>
    </button>
  );
};

export const GridThumbnail = ({ title, preview, onClick, active, color = 'blue' }) => {
  const activeBorder = {
    blue: 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    purple: 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    orange: 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
    cyan: 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
    yellow: 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
    red: 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    pink: 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]',
    gray: 'border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.3)]'
  }[color];

  return (
    <button onClick={onClick} className="flex flex-col gap-1 w-full text-left group">
      <div className={`w-full aspect-video rounded border overflow-hidden relative flex items-center justify-center transition-all bg-[#12131a] ${active ? activeBorder : 'border-[#2d3247] group-hover:border-gray-500'}`}>
        {preview}
      </div>
      <span className="text-[9px] text-gray-400 font-bold px-1 truncate group-hover:text-gray-200">{title}</span>
    </button>
  );
};
