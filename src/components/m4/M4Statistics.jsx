import React from 'react';

export default function M4Statistics({ m4BgVideo, m4AmbientAudio, m4RelaxMusic }) {
  return (
    <div className="h-20 bg-[#12131a] border-t border-[#21232d] flex p-4 gap-6 shrink-0 text-xs text-gray-300">
      
      <div className="flex flex-col justify-center flex-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Durations</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Original Video:</span>
            <span className="font-mono text-blue-400 font-bold">{m4BgVideo?.duration}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Target Duration:</span>
            <span className="font-mono text-white font-bold">02:00:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Ambient:</span>
            <span className="font-mono text-emerald-400">{m4AmbientAudio?.length ? `${m4AmbientAudio.length} trx` : '0s'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Relax Music:</span>
            <span className="font-mono text-purple-400">{m4RelaxMusic?.[0]?.duration}s</span>
          </div>
        </div>
      </div>

      <div className="w-px bg-[#2d3247] h-full mx-2"></div>

      <div className="flex flex-col justify-center flex-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Loop Information</span>
        <div className="flex justify-between items-center bg-[#181922] border border-[#2d3247] rounded p-2">
          <span className="text-gray-400">Estimated Loop Count:</span>
          <span className="font-mono font-bold text-amber-400">720x</span>
        </div>
      </div>

      <div className="w-px bg-[#2d3247] h-full mx-2"></div>

      <div className="flex flex-col justify-center flex-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Render Estimate</span>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Profile:</span>
            <span className="text-white font-bold">Standard HD (1080p)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Output Size:</span>
            <span className="font-mono text-blue-400 font-bold">~2.1 GB</span>
          </div>
        </div>
      </div>

    </div>
  );
}
