import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Upload, Plus, Eye, EyeOff, Key, Check, ChevronDown, ChevronUp, Type, AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import DisplayModeSelector from '../widgets/DisplayModeSelector';

export default function LyricsPanel({ addObject, m3Objects = [], setM3Objects, m3SelectedObjectId, setM3SelectedObjectId }) {
  const [activeTab, setActiveTab] = useState('Settings'); // 'Settings' | 'Presets'
  const [showOnTimeline, setShowOnTimeline] = useState(true);
  const [language, setLanguage] = useState('English');
  const [aiProvider, setAiProvider] = useState('groq'); // 'groq' | 'gemini'
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('mf_groq_api_key') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('mf_gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Find active or first subtitle object
  const activeSubtitle = m3Objects.find(o => o.id === m3SelectedObjectId && o.type === 'subtitle') 
                      || m3Objects.find(o => o.type === 'subtitle');

  useEffect(() => {
    if (activeSubtitle) {
      setShowOnTimeline(activeSubtitle.transform?.visible !== false);
      if (activeSubtitle.language) setLanguage(activeSubtitle.language);
    }
  }, [activeSubtitle]);

  const handleSaveKey = (val) => {
    setGroqKey(val);
    localStorage.setItem('mf_groq_api_key', val);
  };

  const handleSaveGeminiKey = (val) => {
    setGeminiKey(val);
    localStorage.setItem('mf_gemini_api_key', val);
  };

  const handleToggleTimeline = (checked) => {
    setShowOnTimeline(checked);
    if (!activeSubtitle && checked && addObject) {
      // Create default subtitle layer
      addObject({
        type: 'subtitle',
        name: 'Synced Lyrics',
        language: language,
        font: 'Segoe UI, sans-serif',
        fontSize: 36,
        fontWeight: 'Extra-Bold',
        color: '#ffffff',
        align: 'Center',
        lines: '1 Line',
        wordsPerLine: 8,
        autoShrink: true,
        keepInGaps: false,
        lineMovement: 'None',
        displayMode: 'Paragraph',
        strokeEnabled: true,
        strokeWidth: 1,
        strokeColor: '#000000',
        glowEnabled: false,
        glowColor: '#a855f7',
        glowBlur: 18,
        transform: { x: 960, y: 850, scale: 1, rotation: 0, opacity: 100, visible: true },
        subtitles: [
          { id: 'l-1', start: 0, end: 4, text: 'Welcome to MediaFactory Studio' },
          { id: 'l-2', start: 4, end: 8, text: 'Rich synced lyrics with dynamic animations' },
          { id: 'l-3', start: 8, end: 12, text: 'Customized layout and glow effects' }
        ]
      });
    } else if (activeSubtitle && setM3Objects) {
      setM3Objects(prev => prev.map(o => {
        if (o.id !== activeSubtitle.id) return o;
        return {
          ...o,
          transform: { ...(o.transform || {}), visible: checked }
        };
      }));
    }
  };

  const handleAddLyricsLayer = () => {
    if (!addObject) return;
    addObject({
      type: 'subtitle',
      name: 'Synced Lyrics Layer',
      language: language,
      font: 'Segoe UI, sans-serif',
      fontSize: 36,
      fontWeight: 'Extra-Bold',
      color: '#ffffff',
      align: 'Center',
      lines: '1 Line',
      wordsPerLine: 8,
      autoShrink: true,
      keepInGaps: false,
      lineMovement: 'None',
      displayMode: 'Paragraph',
      strokeEnabled: true,
      strokeWidth: 1,
      strokeColor: '#000000',
      glowEnabled: false,
      glowColor: '#a855f7',
      glowBlur: 18,
      transform: { x: 960, y: 850, scale: 1, rotation: 0, opacity: 100, visible: true },
      subtitles: [
        { id: 'l-1', start: 0, end: 4, text: 'Music playing in background...' },
        { id: 'l-2', start: 4, end: 8, text: 'Lyrics synchronizing in real-time' }
      ]
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      // Simple lines parser or fallback
      const lines = content.split('\n').filter(l => l.trim().length > 0).slice(0, 20);
      const subItems = lines.map((line, idx) => ({
        id: 'imported-' + idx,
        start: idx * 3,
        end: (idx + 1) * 3,
        text: line.replace(/\[.*?\]/g, '').trim() || 'Instrumental'
      }));

      if (activeSubtitle && setM3Objects) {
        setM3Objects(prev => prev.map(o => {
          if (o.id !== activeSubtitle.id) return o;
          return { ...o, subtitles: subItems };
        }));
        if (setM3SelectedObjectId) setM3SelectedObjectId(activeSubtitle.id);
      } else if (addObject) {
        addObject({
          type: 'subtitle',
          name: file.name,
          language: language,
          subtitles: subItems,
          transform: { x: 960, y: 850, scale: 1, rotation: 0, opacity: 100, visible: true }
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSimulateAI = () => {
    setIsGenerating(true);
    setSyncStatus('Initializing...');
    
    // Get the current keys string
    const currentKeysStr = aiProvider === 'groq' ? groqKey : geminiKey;
    // Parse into an array, splitting by comma and removing whitespace
    const keysArray = currentKeysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    // If no keys provided, simulate a generic connection
    if (keysArray.length === 0) {
      keysArray.push('SystemDefaultKey');
    }

    let attemptIndex = 0;

    const attemptKey = () => {
      if (attemptIndex >= keysArray.length) {
        setSyncStatus('All keys exhausted! Rate limit hit.');
        setTimeout(() => { setIsGenerating(false); setSyncStatus(''); }, 2000);
        return;
      }

      const currentKey = keysArray[attemptIndex];
      const isLastKey = attemptIndex === keysArray.length - 1;
      setSyncStatus(`Trying Key ${attemptIndex + 1} / ${keysArray.length}...`);

      setTimeout(() => {
        // Simulate fallback logic: fail all keys except the last one to show the router in action!
        if (!isLastKey) {
          setSyncStatus(`Key ${attemptIndex + 1} Limit Hit! Routing to next...`);
          attemptIndex++;
          setTimeout(attemptKey, 1000); // Try next key after 1s
        } else {
          // The last key (or the only key) succeeds!
          setSyncStatus(`Key ${attemptIndex + 1} Connected! Syncing Audio...`);
          
          setTimeout(() => {
            setIsGenerating(false);
            setSyncStatus('');
            
            const aiSubtitles = [
              { id: 'ai-1', start: 0, end: 3.5, text: `✨ (AI Router Synced via ${aiProvider.toUpperCase()})` },
              { id: 'ai-2', start: 3.5, end: 7.0, text: 'Drifting through the glowing city lights' },
              { id: 'ai-3', start: 7.0, end: 11.5, text: 'Every heartbeat matching the rhythm of the night' },
              { id: 'ai-4', start: 11.5, end: 15.0, text: 'Feel the bass vibrating through the soul' }
            ];
            
            if (activeSubtitle && setM3Objects) {
              setM3Objects(prev => prev.map(o => {
                if (o.id !== activeSubtitle.id) return o;
                return { ...o, subtitles: aiSubtitles };
              }));
              if (setM3SelectedObjectId) setM3SelectedObjectId(activeSubtitle.id);
            } else if (addObject) {
              addObject({
                type: 'subtitle',
                name: 'AI Router Synced Lyrics',
                language: language,
                subtitles: aiSubtitles,
                transform: { x: 960, y: 850, scale: 1, rotation: 0, opacity: 100, visible: true }
              });
            }
          }, 1500); // 1.5s simulating the actual transcription
        }
      }, 800); // 0.8s simulating API connection time
    };

    attemptKey();
  };

  const updateActiveProp = (key, val) => {
    if (!activeSubtitle || !setM3Objects) return;
    setM3Objects(prev => prev.map(o => {
      if (o.id !== activeSubtitle.id) return o;
      return { ...o, [key]: val };
    }));
  };

  return (
    <div className="flex flex-col gap-4 text-white pb-10">
      {/* Top Tab Navigation */}
      <div className="flex bg-[#11131a] p-1 rounded-lg border border-[#262938]">
        <button
          onClick={() => setActiveTab('Settings')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${
            activeTab === 'Settings' ? 'bg-[#2a2f42] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Lyrics Settings
        </button>
        <button
          onClick={() => setActiveTab('Presets')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${
            activeTab === 'Presets' ? 'bg-[#2a2f42] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Presets
        </button>
      </div>

      {activeTab === 'Presets' ? (
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Style Presets</span>
          {[
            { id: 'Classic Centered', desc: 'Standard bottom subtitles with crisp outline', style: { displayMode: 'Paragraph', font: 'Segoe UI, sans-serif', glowEnabled: false, strokeEnabled: true } },
            { id: 'Karaoke Highlight', desc: 'Dynamic word-by-word active coloring', style: { displayMode: 'Word Highlight', font: 'Inter, sans-serif', glowEnabled: true, glowColor: '#10b981' } },
            { id: 'Dynamic Word-by-Word', desc: 'Modern TikTok/Reels punchy typography', style: { displayMode: 'Progressive Words', font: 'Oswald, sans-serif', lines: '2 Lines', strokeEnabled: true } },
            { id: 'Cinematic Stack', desc: 'Elegant stacked typography with subtle glow', style: { displayMode: 'Slide Up', font: 'Great Vibes, cursive', glowEnabled: true, glowColor: '#a855f7' } },
          ].map(p => (
            <div
              key={p.id}
              onClick={() => {
                if (!activeSubtitle && addObject) {
                  handleAddLyricsLayer();
                } else if (activeSubtitle && setM3Objects) {
                  setM3Objects(prev => prev.map(o => o.id === activeSubtitle?.id ? { ...o, ...p.style } : o));
                }
              }}
              className="p-3 bg-[#151822] hover:bg-[#1f2333] border border-[#2d3247] hover:border-orange-500/50 rounded-lg cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 group-hover:text-orange-300">{p.id}</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-300">Apply</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Premium Feature Box (Reference Image 1) */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3b185f] via-[#241242] to-[#160c2e] p-4 border border-[#8b5cf6]/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-[#a855f7]/20 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/50 flex items-center justify-center shrink-0 shadow-inner">
                <Crown className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[11px] font-black tracking-wider text-purple-200 uppercase truncate">PREMIUM FEATURE</h4>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    PRO UNLOCKED
                  </span>
                </div>
                <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">
                  You can edit and preview synced lyrics, and export directly in this video studio without restrictions.
                </p>
              </div>
            </div>
          </div>

          {/* Show Lyrics on Timeline Toggle */}
          <div className="bg-[#151720] border border-[#262938] rounded-lg p-3 flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-gray-200">
              <input
                type="checkbox"
                checked={showOnTimeline}
                onChange={(e) => handleToggleTimeline(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-[#11131a] cursor-pointer"
              />
              <span>Show Lyrics on Timeline</span>
            </label>
            <span className="text-[10px] text-gray-400 font-mono">({activeSubtitle ? 'Active' : 'No Layer'})</span>
          </div>

          {/* Language Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-400">Language</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                if (activeSubtitle) updateActiveProp('language', e.target.value);
              }}
              className="w-full bg-[#151720] border border-[#2d3060] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 appearance-none font-medium cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Indonesian">Indonesian (Bahasa)</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Spanish">Spanish</option>
              <option value="Auto Detect">Auto Detect</option>
            </select>
          </div>

          {/* AI Engine Selection */}
          <div className="flex flex-col gap-1.5 mb-2 mt-2">
            <label className="text-[11px] font-medium text-gray-400">AI Engine</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full bg-[#151720] border border-[#2d3060] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 appearance-none font-medium cursor-pointer"
            >
              <option value="groq">Groq Cloud (Fast Whisper)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Pro)</option>
            </select>
          </div>

          {/* Dynamic API Key Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-400 flex items-center justify-between">
              <span>{aiProvider === 'groq' ? 'Groq API Key' : 'Gemini API Key'}</span>
              <span className={`text-[9px] font-mono ${aiProvider === 'groq' ? 'text-purple-400' : 'text-blue-400'}`}>
                {aiProvider === 'groq' ? 'Fast Whisper' : 'Audio Native'}
              </span>
            </label>
            <div className="relative flex items-center">
              <Key className="w-3.5 h-3.5 text-gray-500 absolute left-3 pointer-events-none" />
              <input
                type={showKey ? 'text' : 'password'}
                value={aiProvider === 'groq' ? groqKey : geminiKey}
                onChange={(e) => aiProvider === 'groq' ? handleSaveKey(e.target.value) : handleSaveGeminiKey(e.target.value)}
                placeholder={aiProvider === 'groq' ? "gsk_123, gsk_456, gsk_789 (comma sep)" : "AIzaSy1, AIzaSy2 (comma sep)"}
                className="w-full bg-[#151720] border border-[#2d3060] rounded-lg pl-9 pr-9 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 text-gray-400 hover:text-white p-1"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[9px] text-gray-500 italic mt-0.5">Input multiple keys separated by comma to enable auto-fallback router.</p>
          </div>

          {/* Sync Status Display */}
          {syncStatus && (
            <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-lg p-2 text-[10px] text-indigo-300 font-mono text-center flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              {syncStatus}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleSimulateAI}
              disabled={isGenerating}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] py-2.5 px-3 rounded-lg shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{isGenerating ? 'Syncing...' : 'AI Auto-Sync'}</span>
            </button>

            <label className="flex items-center justify-center gap-1.5 bg-[#1a1d27] hover:bg-[#252936] border border-[#2d3247] text-gray-200 font-bold text-[11px] py-2.5 px-3 rounded-lg cursor-pointer transition-colors text-center">
              <Upload className="w-3.5 h-3.5 text-orange-400" />
              <span>Import .SRT</span>
              <input type="file" accept=".srt,.lrc,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <button
            onClick={handleAddLyricsLayer}
            className="w-full flex items-center justify-center gap-2 bg-[#181a24] hover:bg-[#222533] border border-dashed border-[#3a3f58] text-gray-300 font-medium text-xs py-2.5 rounded-lg transition-colors mt-1"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Add New Lyrics Layer</span>
          </button>

          {/* Quick Styling Preview in Left Sidebar (Synchronized with Inspector) */}
          {activeSubtitle && (
            <div className="mt-4 pt-4 border-t border-[#262938] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-400 tracking-wider uppercase">Active Lyrics Layout</span>
                <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">{activeSubtitle.lines || '1 Line'}</span>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="bg-[#151720] p-2.5 rounded border border-[#262938]">
                  <span className="text-[10px] text-gray-400 block mb-1">Words / Line</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={activeSubtitle.wordsPerLine || 8}
                    onChange={(e) => updateActiveProp('wordsPerLine', Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white font-bold text-xs"
                  />
                </div>

                <div className="bg-[#151720] p-2.5 rounded border border-[#262938]">
                  <span className="text-[10px] text-gray-400 block mb-2">Display Mode</span>
                  <DisplayModeSelector 
                      value={activeSubtitle.displayMode || 'Static'} 
                      onChange={(val) => updateActiveProp('displayMode', val)} 
                  />
                </div>
              </div>

              <p className="text-[10px] text-gray-500 italic mt-1">
                💡 Untuk pengaturan font, stroke, dan glow lengkap, klik layer di kanvas dan lihat panel <b>Inspector</b> di kanan.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
