import React, { useState } from 'react';
import { Clapperboard, FileText } from 'lucide-react';
import M5VideoCreator from './M5VideoCreator';
import M5NewsCreator from './M5NewsCreator';

export default function M5CreateView({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {
  const [creatorMode, setCreatorMode] = useState('news');

  return (
    <div className="flex flex-col h-full font-sans min-h-0 pt-1 pb-1">
      
      {/* Sleek Floating Navigation Tabs (Cyberpunk Style) */}
      <div className="flex items-center justify-center mb-3 mt-1 shrink-0 relative">
        <div className="flex items-center gap-8 border-b border-[#2a2c33] px-8">
            <button 
              onClick={() => setCreatorMode('video')}
              className={`relative flex items-center justify-center gap-2 pb-2.5 transition-all duration-300 group ${
                creatorMode === 'video'
                  ? 'text-orange-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Clapperboard size={16} className={creatorMode === 'video' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'} />
                <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${creatorMode === 'video' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                  VIDEO CREATOR
                </span>
              </div>
              {creatorMode === 'video' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
              )}
            </button>

            {/* Futuristic Separator */}
            <div className="flex items-center gap-1 pb-2.5 opacity-50">
              <div className="w-1 h-1 bg-[#444] rotate-45"></div>
              <div className="w-1 h-1 bg-[#444] rotate-45"></div>
            </div>

            <button 
              onClick={() => setCreatorMode('news')}
              className={`relative flex items-center justify-center gap-2 pb-2.5 transition-all duration-300 group ${
                creatorMode === 'news'
                  ? 'text-orange-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <FileText size={16} className={creatorMode === 'news' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'} />
                <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${creatorMode === 'news' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                  NEWS CREATOR
                </span>
              </div>
              {creatorMode === 'news' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
              )}
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {creatorMode === 'video' && <M5VideoCreator m5Queue={m5Queue} setM5Queue={setM5Queue} activeWorkspace={activeWorkspace} />}
        {creatorMode === 'news' && <M5NewsCreator key={activeWorkspace} m5Queue={m5Queue} setM5Queue={setM5Queue} activeWorkspace={activeWorkspace} />}
      </div>
      
    </div>
  );
}
