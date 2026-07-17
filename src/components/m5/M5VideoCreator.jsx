import React, { useState } from 'react';
import { 
  Folder, PlayCircle, Sliders, Volume2, Shuffle, 
  Eye, Rocket, Lightbulb, CheckCircle2, Clapperboard, Settings2, Plus, RefreshCw, Trash2,
  FileText, Check, Clock, Globe, Video, Music, Bell, Play, Zap, ArrowUpRight, CheckSquare, RefreshCcw, Layers,
  ChevronDown, HelpCircle, Info, Sparkles, Image as ImageIcon, Activity, Disc
} from 'lucide-react';

export default function M5VideoCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {

  const useWorkspaceState = (key, initialValue) => {
    const [state, setState] = useState(() => {
      try {
        const item = window.localStorage.getItem(`m5_${activeWorkspace}_video_${key}`);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        return initialValue;
      }
    });

    React.useEffect(() => {
      try {
        window.localStorage.setItem(`m5_${activeWorkspace}_video_${key}`, JSON.stringify(state));
      } catch (error) {}
    }, [key, state, activeWorkspace]);

    return [state, setState];
  };

  const [formula, setFormula] = useWorkspaceState('formula', 'OVERLAY');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [duration, setDuration] = useWorkspaceState('duration', '30 Detik (Short)');
  const [resolution, setResolution] = useWorkspaceState('resolution', '1080x1920 (9:16)');
  const [fps, setFps] = useWorkspaceState('fps', '30 FPS');
  const [outputCount, setOutputCount] = useWorkspaceState('outputCount', 10);
  
  const [ctaPreset, setCtaPreset] = useWorkspaceState('ctaPreset', 'sayang_ibu');
  const [ctaText, setCtaText] = useWorkspaceState('ctaText', 'Apakah kamu sayang ibu kamu?\n\nKalau iya...\n\nKlik Subscribe ❤️');

  const ctaPresets = [
    { label: '❤️ Sayang Ibu', value: 'sayang_ibu', text: 'Apakah kamu sayang ibu kamu?\n\nKalau iya...\n\nKlik Subscribe ❤️' },
    { label: '👍 Subscribe', value: 'subscribe_reminder', text: 'Video ini dibikin dengan usaha keras...\n\nJangan lupa bantu klik Subscribe ya! 👍' },
    { label: '🚀 Dukung Channel', value: 'support_channel', text: 'Dukung channel ini berkembang dengan cara:\n\nLike, Comment & Subscribe! 🚀' },
    { label: '📰 Breaking News', value: 'breaking_news', text: 'INFO PENTING!\n\nSimak video ini sampai habis dan jangan lupa Subscribe!' },
    { label: '🎬 Konten Menarik', value: 'more_content', text: 'Mau konten menarik lainnya setiap hari?\n\nKlik tombol Subscribe di bawah ini!' },
    { label: '✨ Custom', value: 'custom', text: '' }
  ];

  const [libraryFoldersByMode, setLibraryFoldersByMode] = useWorkspaceState('libraryFoldersByMode', {
    INTERRUPT: {
      videoA: [],
      videoB: [],
      hook: [],
      cta: [],
      audio: [],
      background: [],
      subscribe: [],
      arrow: []
    },
    OVERLAY: {
      videoA: [], // Used for main video
      cta: [],    // Used for overlay text? No, overlay text is just state
      audio: [],
      background: [],
      subscribe: [],
      arrow: []
    }
  });

  const libraryFolders = libraryFoldersByMode[formula] || libraryFoldersByMode.INTERRUPT || {};

  const [outputNamePrefix, setOutputNamePrefix] = useWorkspaceState('outputNamePrefix', '');

  // Migration for old state format
  React.useEffect(() => {
    if (libraryFoldersByMode && !libraryFoldersByMode.INTERRUPT && !libraryFoldersByMode.OVERLAY && Object.keys(libraryFoldersByMode).length > 0) {
      setLibraryFoldersByMode({
        INTERRUPT: libraryFoldersByMode,
        OVERLAY: libraryFoldersByMode
      });
    }
  }, []);

  

  const handleChipClick = (val, text) => {
    setCtaPreset(val);
    if (val !== 'custom') {
      setCtaText(text);
    }
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setCtaText(newText);
    const match = ctaPresets.find(p => p.text === newText);
    setCtaPreset(match ? match.value : 'custom');
  };

  const handleAddLibrary = async (type) => {
    try {
      const res = await fetch('/api/v1/m5/dialog/folder', { method: 'POST' });
      if (res.ok) {
        const { path, count } = await res.json();
        if (path) {
          const formattedPath = path.replace(/\\/g, '/');
          const parts = formattedPath.split('/');
          const folderName = parts[parts.length - 1] || 'Library';
          
          setLibraryFoldersByMode(prev => ({
            ...prev,
            [formula]: {
              ...(prev[formula] || {}),
              [type]: [{ name: folderName, count: count || 0, path: formattedPath }]
            }
          }));
          return;
        }
      }
    } catch (err) {
      console.error("Failed to browse folder via API:", err);
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.directory = true;
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      let fileCount = 0;
      let folderName = 'Library';
      
      let folderPath = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const name = file.name.toLowerCase();
        if (name.match(/\.(mp4|mov|avi|mkv|webm|png|jpg|jpeg|gif|mp3|wav|aac|m4a)$/)) {
          fileCount++;
        }
        if (i === 0 && file.webkitRelativePath) {
           const parts = file.webkitRelativePath.split('/');
           if (parts.length > 0) folderName = parts[0];
           if (file.path) {
             const relativeLength = file.webkitRelativePath.length;
             folderPath = file.path.substring(0, file.path.length - relativeLength) + folderName;
             folderPath = folderPath.replace(/\\/g, '/');
           }
        }
      }

      setLibraryFoldersByMode(prev => ({
        ...prev,
        [formula]: {
          ...(prev[formula] || {}),
          [type]: [{ name: folderName, count: fileCount, path: folderPath }]
        }
      }));
    };
    
    input.click();
  };

  const handleRemoveLibrary = (type, indexToRemove) => {
    setLibraryFoldersByMode(prev => ({
      ...prev,
      [formula]: {
        ...(prev[formula] || {}),
        [type]: ((prev[formula] || {})[type] || []).filter((_, idx) => idx !== indexToRemove)
      }
    }));
  };

  const handleClearAllLibraries = (type) => {
    setLibraryFoldersByMode(prev => ({
      ...prev,
      [formula]: {
        ...(prev[formula] || {}),
        [type]: []
      }
    }));
  };

  const handleResetAllLibraries = () => {
    setLibraryFoldersByMode(prev => ({
      ...prev,
      [formula]: {
        videoA: [],
        videoB: [],
        hook: [],
        cta: [],
        audio: [],
        background: [],
        subscribe: [],
        arrow: []
      }
    }));
    if (formula === 'OVERLAY') {
      setCtaPreset('sayang_ibu');
      setCtaText('Apakah kamu sayang ibu kamu?\n\nKalau iya...\n\nKlik Subscribe ❤️');
    }
  };

  const handleGenerateQueue = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const payload = {
        workspaceName: activeWorkspace,
        formula,
        quality: 'Best Quality',
        duration: duration.split(' ')[0],
        resolution: resolution.split(' ')[0],
        fps: fps.split(' ')[0],
        outputCount,
        outputNamePrefix,
        ctaText,
        libraryFolders
      };
      await fetch('/api/v1/m5/generate-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      window.dispatchEvent(new CustomEvent('OPEN_QUEUE_DRAWER'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // M1 Industrial Style Card
  const renderAssetCard = (title, subtitle, type, isRequired = false) => {
    const items = libraryFolders[type] || [];
    const hasItems = items.length > 0;
    
    // Border color: Orange for required, grey for optional
    const borderColor = isRequired ? 'border-orange-500/50' : 'border-[#444] group-hover/card:border-gray-500/50';

    return (
      <div className={`relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-md flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.5)] border ${borderColor} z-10 p-2.5 h-full flex-1 overflow-hidden transition-all group/card`}>
        {/* Metal Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)` }}></div>
        {/* Screws */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>

        <div className="flex flex-col mb-2 relative z-10 pl-1.5">
          <span className="text-[10.5px] font-black text-white tracking-[0.1em] uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{title}</span>
          {subtitle && <span className="text-[8px] font-mono text-gray-400 mt-0.5">{subtitle}</span>}
        </div>
        
        <div className="flex items-center gap-2 mb-2.5 relative z-10 bg-black/20 p-1.5 rounded border border-black/50 shadow-inner min-h-[38px]">
          <div className="text-gray-400 shrink-0">
            <Folder size={20} strokeWidth={1.5} className={hasItems ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.4)]' : 'text-gray-600'} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-gray-200 truncate leading-tight" title={hasItems ? items[0].path : ''}>
              {hasItems ? items[0].name : 'EMPTY'}
            </span>
            <span className="text-[8.5px] font-mono text-gray-500 mt-0.5 leading-none">
              {hasItems ? `${items[0].count} FILES` : '0 FILES'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => handleAddLibrary(type)}
          className="w-full py-1.5 rounded bg-gradient-to-b from-[#2a2c33] to-[#111216] hover:from-orange-600/30 hover:to-orange-500/20 border border-[#444] hover:border-orange-500/50 text-gray-300 hover:text-white text-[9.5px] font-black tracking-widest uppercase transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.5)] relative z-10"
        >
          BROWSE
        </button>
      </div>
    );
  };

  // M1 Industrial CTA Text Panel
  const renderCtaTextPanel = () => {
    return (
      <div className={`relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-md flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.5)] border border-orange-500/50 z-10 p-2.5 h-full flex-1 overflow-hidden transition-all col-span-1`}>
        {/* Metal Texture & Screws */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)` }}></div>
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gradient-to-b from-[#444] to-[#111] border border-[#000] z-20"><div className="w-[0.5px] h-1 bg-black/60 rotate-45 mx-auto"></div></div>

        <div className="flex flex-col mb-1.5 relative z-10 pl-1.5">
          <span className="text-[10.5px] font-black text-white tracking-[0.1em] uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">CTA TEXT</span>
          <span className="text-[8px] font-mono text-gray-400 mt-0.5">OVERLAY MESSAGE</span>
        </div>
        
        <textarea 
          rows={2}
          maxLength={200}
          value={ctaText}
          onChange={handleTextChange}
          placeholder="Enter text..."
          className="w-full bg-[#0a0c10]/60 backdrop-blur-sm border border-[#2d3247] hover:border-gray-500/50 focus:border-orange-500 rounded p-1.5 text-[10px] font-mono text-gray-200 focus:outline-none resize-none m5-scroll flex-1 mb-2 relative z-10 shadow-inner"
        />

        <select 
          value={ctaPreset}
          onChange={(e) => {
            const val = e.target.value;
            const match = ctaPresets.find(p => p.value === val);
            if (match) handleChipClick(val, match.text);
          }}
          className="w-full py-1.5 px-1.5 rounded bg-gradient-to-b from-[#2a2c33] to-[#111216] border border-[#444] text-gray-300 hover:text-white text-[9.5px] font-black tracking-widest uppercase transition-colors focus:outline-none appearance-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.5)] relative z-10"
        >
          {ctaPresets.map(p => (
             <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="flex gap-3 h-full font-sans text-white min-h-0 select-none p-3 pt-2 w-full">
      
      {/* LEFT COLUMN */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        
        {/* RENDER MODE (Mecha/Industrial Control) */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#1a1c23] to-[#0e1017] p-2 rounded-md shadow-[inset_0_2px_10px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)] border border-[#2a2c33] relative overflow-hidden shrink-0 mb-1 z-20">
          {/* Metal Texture Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)` }}></div>
          
          {/* Warning Stripes */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500"></div>
          <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-orange-500"></div>

          {/* Screws */}
          <div className="absolute top-1.5 left-2 w-1.5 h-1.5 rounded-full bg-[#111] border border-[#333] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>
          <div className="absolute bottom-1.5 left-2 w-1.5 h-1.5 rounded-full bg-[#111] border border-[#333] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>
          <div className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#111] border border-[#333] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>
          <div className="absolute bottom-1.5 right-2 w-1.5 h-1.5 rounded-full bg-[#111] border border-[#333] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"></div>

          <div className="flex items-center gap-4 relative z-10 pl-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">RENDER MODE</span>
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-orange-500/50 to-transparent mt-0.5"></div>
              </div>
              
              {/* Mecha Switch */}
              <div className="flex bg-[#050608] border-2 border-[#1a1c23] rounded p-0.5 shadow-[inset_0_5px_15px_rgba(0,0,0,1)] gap-0.5 relative">
                <button 
                  onClick={() => setFormula('INTERRUPT')}
                  className={`relative flex items-center justify-center min-w-[120px] py-1.5 rounded-sm text-[9.5px] font-black tracking-[0.15em] uppercase transition-all duration-300 overflow-hidden ${
                    formula === 'INTERRUPT' 
                    ? 'text-white' 
                    : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {formula === 'INTERRUPT' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-600 border border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.6)] rounded-sm"></div>
                  )}
                  <span className="relative z-10">Interrupt</span>
                </button>
                
                <button 
                  onClick={() => setFormula('OVERLAY')}
                  className={`relative flex items-center justify-center min-w-[120px] py-1.5 rounded-sm text-[9.5px] font-black tracking-[0.15em] uppercase transition-all duration-300 overflow-hidden ${
                    formula === 'OVERLAY' 
                    ? 'text-white' 
                    : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {formula === 'OVERLAY' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-600 border border-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.6)] rounded-sm"></div>
                  )}
                  <span className="relative z-10">Overlay</span>
                </button>
              </div>
          </div>
          
        </div>

        {/* WORKFLOW FORMULA (Very Compact) */}
        <div className="flex flex-col shrink-0 px-1 mt-[-2px]">
          <div className="flex items-center gap-1.5 w-full">
            {formula === 'INTERRUPT' ? (
              <>
                <div className="flex-1 bg-gradient-to-r from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded px-2 py-1.5 flex flex-col justify-center items-center text-purple-400 font-bold text-[9px] text-center uppercase tracking-widest shadow-inner">
                  HOOK
                </div>
                <div className="text-gray-600 font-bold text-[8px]">▶</div>
                <div className="flex-[1.5] bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded px-2 py-1.5 flex flex-col justify-center items-center text-orange-400 font-bold text-[9px] text-center uppercase tracking-widest shadow-inner">
                  MAIN <span className="text-[7px] text-orange-400/60 font-mono tracking-normal leading-none mt-0.5">(VID A+B)</span>
                </div>
                <div className="text-gray-600 font-bold text-[8px]">▶</div>
                <div className="flex-1 bg-gradient-to-r from-red-500/20 to-red-500/5 border border-red-500/30 rounded px-2 py-1.5 flex flex-col justify-center items-center text-red-400 font-bold text-[9px] text-center uppercase tracking-widest shadow-inner">
                  CTA <span className="text-[7px] text-red-400/60 font-mono tracking-normal leading-none mt-0.5">(INT)</span>
                </div>
                <div className="text-gray-600 font-bold text-[8px]">▶</div>
                <div className="flex-[1.5] bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded px-2 py-1.5 flex flex-col justify-center items-center text-emerald-400 font-bold text-[9px] text-center uppercase tracking-widest shadow-inner">
                  CONTINUE
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded px-2 py-1.5 flex justify-center items-center text-orange-400 font-bold text-[10px] text-center uppercase tracking-widest shadow-inner">MAIN</div>
                <div className="text-gray-600 font-bold text-[8px]">▶</div>
                <div className="flex-1 bg-gradient-to-r from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded px-2 py-1.5 flex justify-center items-center text-blue-400 font-bold text-[10px] text-center uppercase tracking-widest shadow-inner">OVERLAY CTA</div>
                <div className="text-gray-600 font-bold text-[8px]">▶</div>
                <div className="flex-1 bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded px-2 py-1.5 flex justify-center items-center text-emerald-400 font-bold text-[10px] text-center uppercase tracking-widest shadow-inner">CONTINUE</div>
              </>
            )}
          </div>
        </div>

        {/* CONTENT SOURCE */}
        <div className="flex flex-col flex-1 min-h-0 gap-2 mt-1">
          <div className="flex items-center gap-2 border-b border-[#333] pb-1.5 px-1 shrink-0">
            <span className="text-[11px] font-black text-white tracking-[0.1em] uppercase">CONTENT SOURCE</span>
            <span className="text-[9px] font-mono text-orange-500/80 tracking-wider">/ REQUIRED</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 h-full min-h-0">
            {formula === 'INTERRUPT' ? (
              <>
                {renderAssetCard('Video A', 'Left 50%', 'videoA', true)}
                {renderAssetCard('Video B', 'Right 50%', 'videoB', true)}
                {renderAssetCard('Hook', '0s-3s', 'hook', true)}
                {renderAssetCard('CTA', 'At 10s', 'cta', true)}
              </>
            ) : (
              <>
                {renderAssetCard('Video', 'Main', 'videoA', true)}
                {renderCtaTextPanel()}
              </>
            )}
          </div>
        </div>

        {/* ENHANCEMENT */}
        <div className="flex flex-col flex-1 min-h-0 gap-2 mt-1">
          <div className="flex items-center gap-2 border-b border-[#333] pb-1.5 px-1 shrink-0">
            <span className="text-[11px] font-black text-white tracking-[0.1em] uppercase">ENHANCEMENT</span>
            <span className="text-[9px] font-mono text-gray-500 tracking-wider">/ OPTIONAL</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 h-full min-h-0">
            {renderAssetCard('Background', 'Fallback', 'background', false)}
            {renderAssetCard('Audio', 'Vol 20%', 'audio', false)}
            {renderAssetCard('Subscribe', 'Animation', 'subscribe', false)}
            {renderAssetCard('Arrow', 'Animation', 'arrow', false)}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN - OUTPUT PANEL (M1 Hardware Style) */}
      <div className="w-[240px] shrink-0 flex flex-col min-h-0 bg-[#0e1017] border border-[#2a2c33] rounded-lg p-3 shadow-sm justify-between relative overflow-hidden">
        {/* Metal Base for Output Panel */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)` }}></div>
        
        <div className="flex flex-col gap-4 relative z-10 min-h-0">
           <div className="flex items-center justify-between border-b-2 border-black/80 bg-black/20 p-2 shadow-inner mx-[-12px] mt-[-12px] px-4 rounded-t-lg shrink-0">
             <span className="text-[12px] font-black text-white tracking-[0.1em] uppercase">OUTPUT</span>
             <span className="text-[9px] font-mono text-orange-500 tracking-widest border border-orange-500/30 px-1 py-0.5 rounded">M5</span>
           </div>
           
           <div className="flex flex-col gap-3 px-1 mt-1 overflow-y-auto m5-scroll">
             {/* Durasi */}
             <div className="flex flex-col gap-1.5">
               <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-[0.1em]">Duration</span>
               <select className="bg-[#0a0c10]/80 border border-[#333] rounded px-2.5 py-1.5 text-[11px] font-mono font-bold text-white focus:outline-none focus:border-orange-500 transition-colors shadow-inner" value={duration} onChange={e=>setDuration(e.target.value)}>
                 <option>10 Detik (Short)</option>
                 <option>15 Detik (Short)</option>
                 <option>30 Detik (Short)</option>
                 <option>60 Detik (Short)</option>
               </select>
             </div>

             {/* Resolusi */}
             <div className="flex flex-col gap-1.5">
               <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-[0.1em]">Resolution</span>
               <select className="bg-[#0a0c10]/80 border border-[#333] rounded px-2.5 py-1.5 text-[11px] font-mono font-bold text-white focus:outline-none focus:border-orange-500 transition-colors shadow-inner" value={resolution} onChange={e=>setResolution(e.target.value)}>
                 <option>1080x1920 (9:16)</option>
                 <option>720x1280 (9:16)</option>
               </select>
             </div>

             {/* FPS */}
             <div className="flex flex-col gap-1.5">
               <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-[0.1em]">FPS</span>
               <select className="bg-[#0a0c10]/80 border border-[#333] rounded px-2.5 py-1.5 text-[11px] font-mono font-bold text-white focus:outline-none focus:border-orange-500 transition-colors shadow-inner" value={fps} onChange={e=>setFps(e.target.value)}>
                 <option>30 FPS</option>
                 <option>60 FPS</option>
               </select>
             </div>

             {/* Output Count */}
             <div className="flex flex-col gap-1.5">
               <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-[0.1em]">Variation</span>
               <div className="flex items-center bg-[#0a0c10]/80 border border-[#333] rounded overflow-hidden transition-colors shadow-inner">
                 <button 
                   onClick={() => setOutputCount(Math.max(1, outputCount - 1))}
                   className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-[12px] border-r border-[#333] bg-[#161824]"
                 >-</button>
                 <input 
                   type="number" 
                   min="1" 
                   max="999" 
                   value={outputCount} 
                   onChange={(e) => setOutputCount(Math.max(1, parseInt(e.target.value) || 1))}
                   className="w-full bg-transparent text-center font-mono font-bold text-[13px] text-orange-500 focus:outline-none"
                 />
                 <button 
                   onClick={() => setOutputCount(outputCount + 1)}
                   className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-[12px] border-l border-[#333] bg-[#161824]"
                 >+</button>
               </div>
             </div>

             {/* Output Name */}
             <div className="flex flex-col gap-1.5 mt-2 border-t border-[#333] pt-3">
               <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-[0.1em]">Output Name (Optional)</span>
               <input 
                 type="text" 
                 value={outputNamePrefix}
                 onChange={(e) => setOutputNamePrefix(e.target.value)}
                 placeholder="e.g. MyVideo"
                 className="w-full bg-[#0a0c10]/80 border border-[#333] rounded px-2.5 py-1.5 text-[11px] font-mono font-bold text-white focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
               />
               <span className="text-[8px] text-gray-500 font-mono">Generates: MyVideo_#1.mp4, MyVideo_#2.mp4</span>
             </div>
           </div>
        </div>
        
        <div className="pt-3 mt-auto relative z-10 shrink-0">
          <button 
            onClick={handleGenerateQueue}
            disabled={isGenerating}
            className={`w-full py-3 ${isGenerating ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-gradient-to-b from-orange-600/90 to-orange-500/70 hover:from-orange-500 hover:to-orange-400 hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]'} border border-orange-500 text-white rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_15px_rgba(249,115,22,0.4)] flex items-center justify-center transition-all font-black text-[13px] uppercase tracking-widest`}
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE QUEUE'}
          </button>
        </div>
      </div>
    </div>
  );
}
