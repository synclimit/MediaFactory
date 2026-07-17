import React, { useState, useEffect } from 'react';
import { MASTERING_PROFILES } from '../../entities/m2/MasteringProfileEntity.js';

export default function MasteringPanel({ masteringSettings, setMasteringSettings }) {
  
  const handleProfileChange = (e) => {
    const profileId = e.target.value;
    const profile = MASTERING_PROFILES.find(p => p.id === profileId);
    if (profile) {
      setMasteringSettings({ ...profile });
    }
  };

  const getProcessingChain = () => {
    const chain = [];
    chain.push('loudnorm');
    if (masteringSettings.compressor) chain.push('compressor');
    if (masteringSettings.outputGain !== '0') chain.push('volume');
    if (masteringSettings.limiter) chain.push('limiter');
    return chain.join(' -> ');
  };

  return (
    <div className="bg-[#1e2230] rounded-xl border border-[#2d313d] flex flex-col h-full overflow-hidden shadow-2xl text-[11px] text-gray-300">
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] text-gray-500 mb-1">Mastering Profile</label>
            <select
              value={masteringSettings.id}
              onChange={handleProfileChange}
              className="w-full bg-[#181922] border border-[#2d313d] rounded p-1.5 text-gray-300"
            >
              {MASTERING_PROFILES.map(p => (
                <option key={p.id} value={p.id}>{p.name} (LUFS: {p.targetLufs})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Target LUFS</label>
            <input
              type="number"
              value={masteringSettings.targetLufs}
              onChange={(e) => setMasteringSettings({...masteringSettings, targetLufs: parseFloat(e.target.value)})}
              className="w-full bg-[#181922] border border-[#2d313d] rounded p-1.5 text-gray-300"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Output Gain (dB)</label>
            <input
              type="number"
              step="0.1"
              value={masteringSettings.outputGain}
              onChange={(e) => setMasteringSettings({...masteringSettings, outputGain: e.target.value})}
              className="w-full bg-[#181922] border border-[#2d313d] rounded p-1.5 text-gray-300"
            />
          </div>
          
          <div className="col-span-2 flex justify-between items-center bg-[#151822] p-2 rounded-lg border border-[#2d313d]">
            <span className="text-[10px] text-gray-500">Compressor</span>
            <input 
              type="checkbox" 
              checked={masteringSettings.compressor} 
              onChange={(e) => setMasteringSettings({...masteringSettings, compressor: e.target.checked})}
              className="accent-[#2563eb]"
            />
          </div>

          <div className="col-span-2 flex justify-between items-center bg-[#151822] p-2 rounded-lg border border-[#2d313d]">
            <span className="text-[10px] text-gray-500">Limiter</span>
            <input 
              type="checkbox" 
              checked={masteringSettings.limiter} 
              onChange={(e) => setMasteringSettings({...masteringSettings, limiter: e.target.checked})}
              className="accent-[#2563eb]"
            />
          </div>
          
          <div className="col-span-2">
             <label className="block text-[10px] text-gray-500 mb-1">Stereo Width (Not processed in V1)</label>
             <input
               type="range"
               min="0"
               max="200"
               value={masteringSettings.stereoWidth}
               onChange={(e) => setMasteringSettings({...masteringSettings, stereoWidth: parseInt(e.target.value)})}
               className="w-full"
             />
          </div>
        </div>

        <div className="mt-auto bg-[#151822] p-2.5 rounded-lg border border-[#2d313d] flex flex-col gap-1">
          <div className="text-[10px] font-bold text-gray-400 border-b border-[#2d313d] pb-1 mb-1">Live Summary</div>
          <div className="flex justify-between"><span className="text-gray-500">Profile:</span><span className="text-gray-300">{masteringSettings.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Target LUFS:</span><span className="text-blue-400">{masteringSettings.targetLufs}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Gain:</span><span className="text-amber-400">{masteringSettings.outputGain} dB</span></div>
          <div className="flex flex-col mt-1">
            <span className="text-gray-500">Processing Chain:</span>
            <span className="text-emerald-400 font-mono text-[9px] mt-0.5">{getProcessingChain()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
