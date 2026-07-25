import React, { useState, useEffect } from 'react';
import SourcePoolPanel from './SourcePoolPanel.jsx';
import MasteringPanel from './MasteringPanel.jsx';
import M2PlaybackBar from './M2PlaybackBar.jsx';
import RenderPlanPanel from './RenderPlanPanel.jsx';
import { MASTERING_PROFILES } from '../../entities/m2/MasteringProfileEntity.js';
import PlaylistSplitterPanel from './PlaylistSplitterPanel.jsx';
import AssetGeneratorPanel from './AssetGeneratorPanel.jsx';
import { Music, Scissors, Sparkles } from 'lucide-react';
// HMR FORCE UPDATE - Sync M2 Panel UI

export default function M2StudioPanel({
  isDevMode,
  addLog,
  addNotification,
  
  // Compilation Strategy Props
  m2Plans, setM2Plans,
  handleOpenReviewDialog,
  handleAddSelectedToPipeline,
  
  // Global M2 Status
  m2IsStale, setM2IsStale,
  m2SuccessMsg, setM2SuccessMsg
}) {
  const [masteringSettings, setMasteringSettings] = useState(MASTERING_PROFILES?.[0] || {
    id: 'standard', name: 'Standard (Neutral)', targetLufs: -14, outputGain: '0', compressor: true, limiter: true, stereoWidth: 100
  });

  // M2 State Machine (Local to UI)
  // EMPTY -> SOURCE_IMPORTED -> MASTERING_READY -> PROCESSING_READY -> CANDIDATES_GENERATED -> READY_FOR_QUEUE -> QUEUED
  const [m2State, setM2State] = useState('SOURCE_IMPORTED'); // Default to imported so UI is accessible for now
  
  const [subMode, setSubMode] = useState('Audio Compiler');

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden flex flex-col bg-transparent text-[#c9d1d9] relative">
      {/* Background Radial Glow (Subtle) like M6 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-900/10 blur-[120px] pointer-events-none rounded-full z-0"></div>
      
      {m2SuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-700/50 p-2 m-4 rounded flex justify-between items-center shrink-0 relative z-10">
          <span className="text-emerald-400 font-semibold text-[12px]">Configuration added successfully.</span>
          <div className="flex gap-2">
            <button
              onClick={() => {}}
              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px]"
            >
              Create New Configuration
            </button>
            <button
              onClick={() => setM2SuccessMsg(false)}
              className="px-2 py-0.5 bg-[#161822] hover:bg-[#1f2230] text-gray-300 rounded text-[10px] border border-[#2a2c33]"
            >
              Continue Editing
            </button>
          </div>
        </div>
      )}

      {/* Sleek Floating Navigation Tabs (Cyberpunk Style) */}
      <div className="flex items-center justify-center mb-1 mt-1 shrink-0 relative z-10">
        <div className="flex items-center gap-8 border-b border-[#2a2c33] px-8">
            <button 
              onClick={() => setSubMode('Audio Compiler')}
              className={`relative flex items-center justify-center gap-2 pb-2.5 transition-all duration-300 group ${
                subMode === 'Audio Compiler'
                  ? 'text-orange-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Music size={16} className={subMode === 'Audio Compiler' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'} />
                <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${subMode === 'Audio Compiler' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                  AUDIO COMPILER
                </span>
              </div>
              {subMode === 'Audio Compiler' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
              )}
            </button>

            {/* Futuristic Separator */}
            <div className="flex items-center gap-1 pb-2.5 opacity-50">
              <div className="w-1 h-1 bg-[#444] rotate-45"></div>
              <div className="w-1 h-1 bg-[#444] rotate-45"></div>
            </div>

            <button 
              onClick={() => setSubMode('Playlist Splitter')}
              className={`relative flex items-center justify-center gap-2 pb-2.5 transition-all duration-300 group ${
                subMode === 'Playlist Splitter'
                  ? 'text-orange-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Scissors size={16} className={subMode === 'Playlist Splitter' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'} />
                <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${subMode === 'Playlist Splitter' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                  PLAYLIST SPLITTER
                </span>
              </div>
              {subMode === 'Playlist Splitter' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
              )}
            </button>
            
            {/* Futuristic Separator */}
            <div className="flex items-center gap-1 pb-2.5 opacity-50">
              <div className="w-1 h-1 bg-[#444] rotate-45"></div>
              <div className="w-1 h-1 bg-[#444] rotate-45"></div>
            </div>

            <button 
              onClick={() => setSubMode('Asset Generator')}
              className={`relative flex items-center justify-center gap-2 pb-2.5 transition-all duration-300 group ${
                subMode === 'Asset Generator'
                  ? 'text-orange-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <div className="relative z-10 flex items-center gap-2">
                <Sparkles size={16} className={subMode === 'Asset Generator' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'} />
                <span className={`font-black text-[13px] tracking-[0.2em] uppercase transition-all ${subMode === 'Asset Generator' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] text-white' : ''}`}>
                  ASSET GENERATOR
                </span>
              </div>
              {subMode === 'Asset Generator' && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)] z-10"></div>
              )}
            </button>
        </div>
      </div>

      {subMode === 'Audio Compiler' && (
      <>
        {/* Progressive Dashboard Layout */}
        <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden bg-[#111318] z-10 relative">
        
        {/* LEFT COLUMN: Source Pool, Output Candidates */}
        <div className="col-span-12 xl:col-span-5 flex flex-col gap-3 overflow-hidden h-full">
          
          {/* Top Left: Source Pool (Now takes full height) */}
          <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex-1 overflow-hidden group z-10">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
            <div className="relative z-10 w-full h-full flex flex-col bg-transparent">
              <SourcePoolPanel 
                isDevMode={isDevMode} 
                addLog={addLog} 
                addNotification={addNotification} 
                onSourcesChanged={() => setM2IsStale(true)}
                onAddToQueue={handleAddSelectedToPipeline}
              />
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Mastering, Processing Strategy */}
        <div className="col-span-12 xl:col-span-7 flex flex-col gap-3 overflow-hidden h-full">
          
          {/* Top Right: Mastering */}
          <div className={`relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex-1 overflow-hidden group z-10 transition-all duration-[150ms] ${m2State === 'EMPTY' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
            <div className="relative z-10 w-full h-full flex flex-col bg-transparent">
              <MasteringPanel 
                masteringSettings={masteringSettings}
                setMasteringSettings={setMasteringSettings}
                isDevMode={isDevMode} 
                addLog={addLog} 
                addNotification={addNotification} 
              />
            </div>
          </div>

          {/* Bottom Right: Playback Monitor & Add to Queue Action */}
          <div className={`flex gap-3 flex-none shrink-0 min-h-[120px] max-h-[140px] transition-all duration-[150ms] ${m2State === 'EMPTY' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            {/* Playback Monitor */}
            <div className="relative flex-1 bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] overflow-hidden group z-10 flex flex-col">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
               <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
               <div className="relative z-10 w-full h-full flex flex-col bg-transparent">
                <M2PlaybackBar
                  masteringSettings={masteringSettings}
                  addLog={addLog}
                  addNotification={addNotification}
                />
              </div>
            </div>

            {/* Portal Target for Add To Queue Button */}
            <div id="m2-add-to-queue-portal-target" className="shrink-0 flex items-stretch"></div>
          </div>

        </div>
      </div>
      </>
      )}
      
      {subMode === 'Playlist Splitter' && (
        <PlaylistSplitterPanel isDevMode={isDevMode} addLog={addLog} addNotification={addNotification} />
      )}

      {subMode === 'Asset Generator' && (
        <AssetGeneratorPanel isDevMode={isDevMode} addLog={addLog} addNotification={addNotification} />
      )}
    </div>
  );
}
