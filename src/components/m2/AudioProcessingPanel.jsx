import React, { useState, useEffect } from 'react';
import { audioProcessingProfileRepo } from '../../repositories/m2/AudioProcessingProfileRepository.js';
import { AUDIO_PRESETS, AUDIO_CONTROLS } from '../../entities/m2/AudioProcessingProfile.js';

function Tooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1.5 cursor-pointer">
      <span className="text-[8px] text-gray-500 bg-[#21232d] hover:bg-[#2d3247] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-40 -translate-x-1/2 rounded bg-[#0f111a] border border-[#2d3247] p-1.5 text-[9px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-[#0f111a] border-r border-b border-[#2d3247]"></div>
      </div>
    </div>
  );
}

export default function AudioProcessingPanel({ isDevMode, addLog }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const globalProfile = await audioProcessingProfileRepo.getGlobalProfile();
      setProfile(globalProfile);
    } catch (e) {
      console.error('Failed to load global audio profile', e);
    }
    setIsLoading(false);
  };

  const updateProfile = async (changes, customLogMessage = null) => {
    const updated = await audioProcessingProfileRepo.updateGlobalProfile(changes);
    setProfile(updated);
    if (customLogMessage && addLog) {
      addLog(customLogMessage);
    }
  };

  const determinePresetName = (newProfile) => {
    for (const [pName, pValues] of Object.entries(AUDIO_PRESETS)) {
      if (
        newProfile.pitch === pValues.pitch &&
        newProfile.tempo === pValues.tempo &&
        newProfile.bass === pValues.bass &&
        newProfile.treble === pValues.treble &&
        newProfile.stereoWidth === pValues.stereoWidth &&
        newProfile.normalize === pValues.normalize
      ) {
        return pName;
      }
    }
    return 'Custom';
  };

  const handlePresetSelect = (presetName) => {
    const presetValues = AUDIO_PRESETS[presetName];
    if (presetValues) {
      updateProfile({ ...presetValues, presetName }, `Preset Selected: ${presetName}`);
    }
  };

  const handleSliderChange = (field, value) => {
    const numValue = parseFloat(value);
    const newProfile = { ...profile, [field]: numValue };
    const matchingPreset = determinePresetName(newProfile);
    
    updateProfile(
      { [field]: numValue, presetName: matchingPreset },
      `Processing Setting Changed: ${field} to ${numValue}`
    );
  };

  const handleNormalizeToggle = () => {
    const newValue = !profile.normalize;
    const newProfile = { ...profile, normalize: newValue };
    const matchingPreset = determinePresetName(newProfile);
    
    updateProfile(
      { normalize: newValue, presetName: matchingPreset },
      `Normalize Toggled: ${newValue ? 'ON' : 'OFF'}`
    );
  };

  if (isLoading || !profile) {
    return <div className="p-3 text-[9px] text-gray-500">Loading Audio Processing Profile...</div>;
  }

  return (
    <div className="bg-[#0b0c10] rounded-lg border border-[#21232d] overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#21232d] bg-[#0f111a] flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <span className="text-[14px] text-purple-400 mr-2 leading-none">③</span>
            <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide">
              AUDIO SETTINGS <span className="text-gray-400 ml-1.5">✓</span>
            </span>
          </div>
          <div className="text-[9px] text-gray-500 mt-0.5">
            Apply processing profile to all tracks
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wide mb-0.5">Current Preset</div>
          <div className="text-[9px] font-bold text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded border border-purple-700/30 inline-block">
            {profile.presetName}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col lg:flex-row gap-4 bg-[#0c0d12]">
        
        {/* Left Column: Sliders */}
        <div className="flex-1 space-y-3">
          
          {/* Pitch */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center">
                Pitch
                <Tooltip text="Changes how high or low the song sounds." />
              </label>
              <span className="text-[9px] font-mono text-purple-300 font-bold">{profile.pitch > 0 ? '+' : ''}{profile.pitch.toFixed(1)}</span>
            </div>
            <input 
              type="range" 
              min={AUDIO_CONTROLS.PITCH.min} max={AUDIO_CONTROLS.PITCH.max} step={AUDIO_CONTROLS.PITCH.step}
              value={profile.pitch}
              onChange={(e) => handleSliderChange('pitch', e.target.value)}
              className="w-full h-1 bg-[#21232d] rounded appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
              <span>-1.0</span>
              <span>0.0</span>
              <span>+1.0</span>
            </div>
          </div>

          {/* Tempo */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center">
                Tempo
                <Tooltip text="Changes playback speed without changing song length target." />
              </label>
              <span className="text-[9px] font-mono text-purple-300 font-bold">{profile.tempo.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min={AUDIO_CONTROLS.TEMPO.min} max={AUDIO_CONTROLS.TEMPO.max} step={AUDIO_CONTROLS.TEMPO.step}
              value={profile.tempo}
              onChange={(e) => handleSliderChange('tempo', e.target.value)}
              className="w-full h-1 bg-[#21232d] rounded appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
              <span>0.90x</span>
              <span>1.00x</span>
              <span>1.10x</span>
            </div>
          </div>

          {/* Bass */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center">
                Bass
                <Tooltip text="Adds or reduces low-frequency punch." />
              </label>
              <span className="text-[9px] font-mono text-purple-300 font-bold">{profile.bass > 0 ? '+' : ''}{profile.bass}</span>
            </div>
            <input 
              type="range" 
              min={AUDIO_CONTROLS.BASS.min} max={AUDIO_CONTROLS.BASS.max} step={AUDIO_CONTROLS.BASS.step}
              value={profile.bass}
              onChange={(e) => handleSliderChange('bass', e.target.value)}
              className="w-full h-1 bg-[#21232d] rounded appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
              <span>-10</span>
              <span>0</span>
              <span>+10</span>
            </div>
          </div>

          {/* Treble */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center">
                Treble
                <Tooltip text="Adds or reduces high-frequency clarity." />
              </label>
              <span className="text-[9px] font-mono text-purple-300 font-bold">{profile.treble > 0 ? '+' : ''}{profile.treble}</span>
            </div>
            <input 
              type="range" 
              min={AUDIO_CONTROLS.TREBLE.min} max={AUDIO_CONTROLS.TREBLE.max} step={AUDIO_CONTROLS.TREBLE.step}
              value={profile.treble}
              onChange={(e) => handleSliderChange('treble', e.target.value)}
              className="w-full h-1 bg-[#21232d] rounded appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
              <span>-10</span>
              <span>0</span>
              <span>+10</span>
            </div>
          </div>

          {/* Stereo Width */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center">
                Stereo Width
                <Tooltip text="Controls how wide the sound feels between left and right speakers." />
              </label>
              <span className="text-[9px] font-mono text-purple-300 font-bold">{profile.stereoWidth}%</span>
            </div>
            <input 
              type="range" 
              min={AUDIO_CONTROLS.STEREO_WIDTH.min} max={AUDIO_CONTROLS.STEREO_WIDTH.max} step={AUDIO_CONTROLS.STEREO_WIDTH.step}
              value={profile.stereoWidth}
              onChange={(e) => handleSliderChange('stereoWidth', e.target.value)}
              className="w-full h-1 bg-[#21232d] rounded appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[7px] text-gray-600 mt-0.5">
              <span>0%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>
          
          {/* Normalize Toggle */}
          <div className="flex items-center justify-between bg-[#13141a] px-2 py-1.5 rounded border border-[#2d3247]">
            <div className="flex items-center">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mr-2">Normalize</label>
              <Tooltip text="Automatically balances volume levels." />
            </div>
            <button 
              onClick={handleNormalizeToggle}
              className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${profile.normalize ? 'bg-purple-600' : 'bg-[#21232d]'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${profile.normalize ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

        </div>

        {/* Right Column: Presets & Summary */}
        <div className="w-full lg:w-48 flex flex-col gap-3">
          
          {/* Presets List */}
          <div className="bg-[#0a0a0e] rounded p-2 border border-[#21232d]">
            <h3 className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-1">
              {Object.keys(AUDIO_PRESETS).map(presetKey => (
                <button
                  key={presetKey}
                  onClick={() => handlePresetSelect(presetKey)}
                  className={`text-left px-2 py-1 text-[9px] rounded transition-colors ${
                    profile.presetName === presetKey 
                      ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50 font-bold' 
                      : 'bg-[#15161d] text-gray-400 border border-transparent hover:border-[#3d4157]'
                  }`}
                >
                  {presetKey}
                </button>
              ))}
              <div 
                className={`text-left px-2 py-1 text-[9px] rounded transition-colors ${
                  profile.presetName === 'Custom' 
                    ? 'bg-amber-900/30 text-amber-400 border border-amber-700/40 font-bold' 
                    : 'bg-transparent text-gray-600 border border-transparent'
                }`}
              >
                Custom {profile.presetName === 'Custom' && '✓'}
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="bg-[#0a0a0e] rounded p-2 border border-[#21232d] flex-grow">
            <h3 className="text-[8px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Summary</h3>
            <div className="text-[8px] font-mono text-gray-400 leading-tight bg-[#0f111a] p-1.5 rounded border border-[#21232d]">
              {profile.getSummaryString().split(' | ').map((part, i) => (
                <div key={i} className="mb-0.5 last:mb-0">
                  <span className="text-gray-600">{part.split(': ')[0]}: </span>
                  <span className="text-emerald-400 font-bold">{part.split(': ')[1]}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Developer Mode */}
      {isDevMode && (
        <div className="bg-[#0a0005] p-2 border-t border-red-900/30">
          <h4 className="text-[8px] uppercase text-red-400 font-bold tracking-wide mb-1 flex items-center">
            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
            Dev Stats — Audio Profile
          </h4>
          <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
            <div className="col-span-2 text-gray-500 truncate" title={JSON.stringify(profile)}>
              <span className="text-gray-600">Raw JSON:</span> {JSON.stringify(profile)}
            </div>
            <div>
              <span className="text-gray-600">Active Preset:</span> <span className="text-amber-400">{profile.presetName}</span>
            </div>
            <div>
              <span className="text-gray-600">Profile Hash:</span> <span className="text-blue-400">{profile.generateHash()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
