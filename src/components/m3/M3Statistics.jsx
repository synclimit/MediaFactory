import React from 'react';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';

export default function M3Statistics({ m3TotalDurationSec = 0, m3EstRenderTimeSec = 0, m3EstStorageMb = 0 }) {
  return (
    <Surface variant={BackgroundVariants.Statistics} className="flex items-center justify-between gap-4 text-[10px] text-gray-400 font-mono border-t border-[#21232d] px-4 py-2 shrink-0">
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Duration</span>
          <span className="text-white">{Math.round(m3TotalDurationSec / 60)} mins</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Output</span>
          <span className="text-blue-300">1080p / 60 FPS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Bitrate</span>
          <span className="text-blue-300">320 kbps</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Encoder</span>
          <span className="text-emerald-400">NVENC H.264 (HW)</span>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Render Est.</span>
          <span className="text-emerald-400 font-bold">{Math.round(m3EstRenderTimeSec / 60) || '04:30'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Storage</span>
          <span className="text-white">{m3EstStorageMb || '1200'} MB</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase text-[9px] font-bold text-gray-500">Queue</span>
          <span className="text-yellow-400 font-bold">1</span>
        </div>
      </div>
    </Surface>
  );
}
