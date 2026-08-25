import React, { useState, useEffect } from 'react';
import { 
  Trash2, CheckCircle2, Zap, Globe, Video, Music, Plus, Image as ImageIcon, Type, Palette, Settings2,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, RotateCcw, Sparkles, Volume2, Mic, Layers, Sliders, Radio, Activity
} from 'lucide-react';

const getAnimClass = (animName) => {
    if (!animName || animName === "None") return "";
    return `anim-${animName.replace(/ /g, "")}`;
};

export default function M5NewsCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {

  const useWorkspaceState = (key, initialValue) => {
    const fullKey = `m5_${activeWorkspace}_news_${key}`;
    const [state, setState] = useState(() => {
      const stored = localStorage.getItem(fullKey);
      return stored !== null ? stored : initialValue;
    });
    useEffect(() => {
      localStorage.setItem(fullKey, state);
    }, [state, fullKey]);
    return [state, setState];
  };

  // --- GLOBAL SETTINGS ---
  const [links, setLinks] = useWorkspaceState('links', "https://www.cnnindonesia.com/internasional/2024/05/23/presiden-as-joe-biden-kunjungi-vietnam");
  const [globalDuration, setGlobalDuration] = useWorkspaceState('duration', "30s");
  const [globalLang, setGlobalLang] = useWorkspaceState('lang', "Indonesia");
  const [globalRes, setGlobalRes] = useWorkspaceState('res', "1080x1920 (9:16)");
  const [globalFPS, setGlobalFPS] = useWorkspaceState('fps', "30 FPS");
  const [bgmVolume, setBgmVolume] = useWorkspaceState('bgmVolume', 25);
  const [voiceSpeed, setVoiceSpeed] = useWorkspaceState('voiceSpeed', "1.0x");
  const [voiceGender, setVoiceGender] = useWorkspaceState('voiceGender', "Female");
  
  const [bgFolder, setBgFolder] = useWorkspaceState('bgFolder', "");
  const [audioFolder, setAudioFolder] = useWorkspaceState('audioFolder', "");
  const [overlayFolder, setOverlayFolder] = useWorkspaceState('overlayFolder', "");

  const handleBrowseFolder = async (setter) => {
      try {
          const res = await fetch('/api/v1/m5/dialog/folder', { method: 'POST' });
          const data = await res.json();
          if (data.path) setter(data.path);
      } catch(err) {
          console.warn("Folder picker error", err);
      }
  };

  const handleReplaceImage = async () => {
    try {
      const res = await fetch('/api/v1/m5/dialog/file', { method: 'POST' });
      const data = await res.json();
      if (data.path) {
        setImage(`/@fs/${data.path.replace(/\\/g, '/')}`);
      }
    } catch(err) {
      console.warn("Image picker error", err);
    }
  };

  // --- CARD EDITOR STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(null);
  const [image, setImage] = useWorkspaceState('image', '');

  // Connect to SSE for pipeline progress
  useEffect(() => {
    const sse = new EventSource('/api/v1/m5/stream');
    
    sse.addEventListener('news_progress', (e) => {
      const data = JSON.parse(e.data);
      if (data.stages) {
        const activeStage = data.stages.find(s => s.status === 'RUNNING' || s.status === 'WAITING');
        if (activeStage) {
            setPipelineProgress(activeStage.name);
        }
      }
    });

    sse.addEventListener('news_draft_update', (e) => {
      const { module, data } = JSON.parse(e.data);
      if (module === 'reader') {
         try { setSource(new URL(data.url).hostname.replace('www.', '')); } catch(err) { console.warn(err); }
         if (data.title) setHeadline(data.title);
         if (data.body) {
             const sentences = data.body.match(/[^.!?]+[.!?]+/g) || [data.body];
             setSummary(sentences.slice(0, 2).join(' ').trim());
         }
         if (data.images && data.images.length > 0) setImage(data.images[0].url);
      }
      if (module === 'ai') {
         setHeadline(data.headline);
         setSummary(data.summary);
         if (data.category) setCategory(data.category.toUpperCase());
         
         const today = new Date();
         setDate(`${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })} ${today.getFullYear()}`);
      }
    });

    sse.addEventListener('news_pipeline_complete', (e) => {
      setIsProcessing(false);
      try {
          const result = JSON.parse(e.data);
          if (result && result.success === false) {
              setPipelineProgress('Pipeline Error: ' + (result.error || ''));
              return;
          }
      } catch(err) {
          console.warn(err);
      }
      setPipelineProgress('Draft Ready');
    });
    
    sse.addEventListener('news_pipeline_error', () => {
      setIsProcessing(false);
      setPipelineProgress('Pipeline Error');
    });

    return () => sse.close();
  }, [setImage]);

  const handleStartPipeline = () => {
    if (!links || !links.trim().startsWith('http')) return;
    setIsProcessing(true);
    setPipelineProgress('Fetching news...');
    
    fetch('/api/v1/m5/news/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: links.trim() })
    }).catch(err => {
        console.error(err);
        setIsProcessing(false);
        setPipelineProgress('Error connecting to backend');
    });
  };

  const [cardTheme, setCardTheme] = useWorkspaceState('cardTheme', 'Glass Box');
  const [colorPrimary, setColorPrimary] = useWorkspaceState('colorPrimary', '#f97316');
  const [colorBackground, setColorBackground] = useWorkspaceState('colorBackground', '#0f172a');
  const [borderRadius, setBorderRadius] = useWorkspaceState('borderRadius', 14);
  
  const [headline, setHeadline] = useWorkspaceState('headline', 'Presiden AS Joe Biden Kunjungi Vietnam, Bahas Kerja Sama Ekonomi & Keamanan');
  const [headlineFont, setHeadlineFont] = useWorkspaceState('headlineFont', 'Inter');
  const [headlineSize, setHeadlineSize] = useWorkspaceState('headlineSize', 16);
  const [headlineColor, setHeadlineColor] = useWorkspaceState('headlineColor', '#ffffff');
  const [headlineAnim, setHeadlineAnim] = useWorkspaceState('headlineAnim', 'Fade In Up');
  const [headlineAlign, setHeadlineAlign] = useWorkspaceState('headlineAlign', 'left');
  const [headlineWeight, setHeadlineWeight] = useWorkspaceState('headlineWeight', 'bold');
  const [headlineItalic, setHeadlineItalic] = useWorkspaceState('headlineItalic', false);
  
  const [summary, setSummary] = useWorkspaceState('summary', 'Kunjungan ini menandai langkah baru dalam hubungan bilateral kedua negara yang semakin erat dalam beberapa tahun terakhir.');
  const [summaryFont, setSummaryFont] = useWorkspaceState('summaryFont', 'Inter');
  const [summarySize, setSummarySize] = useWorkspaceState('summarySize', 11);
  const [summaryColor, setSummaryColor] = useWorkspaceState('summaryColor', '#d1d5db');
  const [summaryAnim, setSummaryAnim] = useWorkspaceState('summaryAnim', 'Fade In Up');
  const [summaryAlign, setSummaryAlign] = useWorkspaceState('summaryAlign', 'left');
  const [summaryWeight, setSummaryWeight] = useWorkspaceState('summaryWeight', 'normal');
  const [summaryItalic, setSummaryItalic] = useWorkspaceState('summaryItalic', false);
  
  const [boxPos, setBoxPos] = useState(() => {
     try { const v = localStorage.getItem(`m5_${activeWorkspace}_news_boxPos`); return v ? JSON.parse(v) : { x: 0, y: 0 }; } catch(err) { console.warn(err); return { x: 0, y: 0 }; }
  });
  useEffect(() => { localStorage.setItem(`m5_${activeWorkspace}_news_boxPos`, JSON.stringify(boxPos)); }, [boxPos, activeWorkspace]);

  const [boxScale, setBoxScale] = useWorkspaceState('boxScale', 100);
  const [boxWidth, setBoxWidth] = useWorkspaceState('boxWidth', 100);
  const [boxHeight] = useState(0);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [boxDragStart, setBoxDragStart] = useState({ x: 0, y: 0 });
  
  const [isResizingScale, setIsResizingScale] = useState(false);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, scale: 100, width: 100 });
  
  const [source, setSource] = useWorkspaceState('source', 'cnnindonesia.com');
  const [category, setCategory] = useWorkspaceState('category', 'INTERNASIONAL');
  const [date, setDate] = useWorkspaceState('date', '23 Mei 2024');
  
  const [imageScale, setImageScale] = useWorkspaceState('imageScale', 100);
  const [imagePosX, setImagePosX] = useWorkspaceState('imagePosX', 50);
  const [imagePosY, setImagePosY] = useWorkspaceState('imagePosY', 10);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0, posX: 50, posY: 10 });

  // Global drag handler for image inside canvas
  useEffect(() => {
    if (!isDraggingImage) return;

    const handleMouseMove = (e) => {
        const dx = e.clientX - imageDragStart.x;
        const dy = e.clientY - imageDragStart.y;
        
        const sensitivity = 0.4;
        const newPosX = Math.max(0, Math.min(100, Math.round(imageDragStart.posX + dx * sensitivity)));
        const newPosY = Math.max(0, Math.min(100, Math.round(imageDragStart.posY + dy * sensitivity)));
        
        setImagePosX(newPosX);
        setImagePosY(newPosY);
    };

    const handleMouseUp = () => {
        setIsDraggingImage(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingImage, imageDragStart, setImagePosX, setImagePosY]);

  // Editable Component Mode (Tabs in Right Column)
  const [activeTab, setActiveTab] = useState('TEXT'); // TEXT, IMAGE, THEME

  const handleAddToQueue = () => {
    if (!setM5Queue) return;
    const timestamp = Date.now();
    const newJob = {
      id: timestamp.toString(),
      type: 'render',
      status: 'Ready',
      progress: 0,
      workspaceName: activeWorkspace,
      formula: 'News Creator (M5)',
      duration: globalDuration,
      snapshot: {
        outPath: `Output/M5/News_${timestamp}.mp4`,
        ffmpegCommand: 'Custom Live News Render',
        manifest: { 
          headline, summary, image, cardTheme, boxPos, boxScale, boxWidth, boxHeight, category, source, date,
          duration: globalDuration, bgFolder, audioFolder, overlayFolder, resolution: globalRes, fps: globalFPS,
          config: {
            headline: { size: headlineSize, color: headlineColor, font: headlineFont, align: headlineAlign, weight: headlineWeight, italic: headlineItalic, anim: headlineAnim },
            summary: { size: summarySize, color: summaryColor, font: summaryFont, align: summaryAlign, weight: summaryWeight, italic: summaryItalic, anim: summaryAnim },
            layout: { boxScale, boxWidth, boxHeight, imageScale, imagePosX, imagePosY, boxPos },
            theme: { cardTheme, colorPrimary, colorBackground, borderRadius }
          }
        }
      }
    };
    fetch('/api/v1/m5/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
    }).catch(e => console.error("Failed to add to queue", e));
    
    window.dispatchEvent(new CustomEvent('OPEN_QUEUE_DRAWER'));
  };

  const [sourceMode, setSourceMode] = useState('LINK'); // 'LINK' | 'SCREENSHOT'
  const [screenshotPath, setScreenshotPath] = useState('');

  const handleBrowseScreenshot = async () => {
    try {
      const res = await fetch('/api/v1/m5/dialog/file', { method: 'POST' });
      const data = await res.json();
      if (data.path) {
        setScreenshotPath(data.path);
        setImage(`/@fs/${data.path.replace(/\\/g, '/')}`);
      }
    } catch(err) {
      console.warn("Screenshot picker error", err);
    }
  };

  const handleAnalyzeScreenshot = async () => {
    if (!screenshotPath) return;
    setIsProcessing(true);
    setPipelineProgress('Reading Screenshot with AI Vision...');
    try {
      const res = await fetch('/api/v1/m5/news/draft-from-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: screenshotPath, language: globalLang })
      });
      const data = await res.json();
      if (data.success && data.draft) {
        if (data.draft.headline) setHeadline(data.draft.headline);
        if (data.draft.summary) setSummary(data.draft.summary);
        if (data.draft.category) setCategory(data.draft.category.toUpperCase());
        setImage(`/@fs/${screenshotPath.replace(/\\/g, '/')}`);
        setPipelineProgress('Draft Ready from Screenshot');
      } else {
        setPipelineProgress('Failed to process screenshot');
      }
    } catch(err) {
      console.error(err);
      setPipelineProgress('Error reading screenshot');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-3 h-full font-sans text-white min-h-0 pb-1">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(15px); } to { opacity: 1; transform: translateX(0); } }
        
        .anim-FadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .anim-FadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
        .anim-FadeInDown { animation: fadeInDown 0.6s ease-out forwards; }
        .anim-FadeInLeft { animation: fadeInLeft 0.6s ease-out forwards; }
        .anim-FadeInRight { animation: fadeInRight 0.6s ease-out forwards; }
      `}</style>
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. LEFT COLUMN: NEWS SOURCE & GLOBAL SETTINGS (315px) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="w-[315px] min-w-[290px] max-w-[340px] flex flex-col gap-2.5 min-h-0 h-full shrink-0">
        
        {/* INPUT SOURCE */}
        <div className="bg-[#14161f] border border-[#2e3346] hover:border-orange-500/40 rounded-xl p-3 flex flex-col gap-2 shadow-lg relative overflow-hidden transition-colors shrink-0">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

          <div className="flex items-center justify-between border-b border-[#252838] pb-1.5">
            <h3 className="text-[11.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-['Rajdhani']">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
              <Globe size={13} className="text-orange-400"/> NEWS SOURCE
            </h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#0f1017] p-0.5 rounded-lg border border-[#2d3142]">
            <button 
              onClick={() => setSourceMode('LINK')}
              className={`flex-1 py-1 text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${sourceMode === 'LINK' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)] border border-orange-400' : 'text-gray-400 hover:text-white'}`}
            >
              <Globe size={11}/> From Link
            </button>
            <button 
              onClick={() => setSourceMode('SCREENSHOT')}
              className={`flex-1 py-1 text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${sourceMode === 'SCREENSHOT' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.5)] border border-orange-400' : 'text-gray-400 hover:text-white'}`}
            >
              <ImageIcon size={11}/> From Screenshot
            </button>
          </div>

          {sourceMode === 'LINK' ? (
            <>
              <textarea 
                className="w-full h-[58px] bg-[#0f1017] border border-[#2d3142] rounded-lg p-2 text-[10.5px] text-gray-200 font-mono resize-none focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all shadow-inner"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="Paste news URL..."
              />
              
              <div className="flex justify-between items-center">
                <button onClick={() => setLinks('')} className="text-[10px] text-gray-400 hover:text-red-400 px-1.5 py-0.5 rounded transition-all cursor-pointer">Clear</button>
                <button onClick={handleStartPipeline} disabled={isProcessing} className="text-[10px] bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold font-['Rajdhani'] uppercase tracking-wider px-3 py-1 rounded-lg transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(249,115,22,0.4)] border border-orange-400 cursor-pointer">
                  {isProcessing ? 'Processing...' : 'Fetch AI Draft'}
                </button>
              </div>
            </>
          ) : (
            <>
              {screenshotPath ? (
                <div className="flex flex-col gap-1.5">
                  <div className="relative rounded-lg overflow-hidden border border-[#2d3142] max-h-[75px] bg-black flex items-center justify-center">
                    <img src={`/@fs/${screenshotPath.replace(/\\/g, '/')}`} className="max-h-[75px] object-contain" />
                    <button 
                      onClick={() => setScreenshotPath('')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-0.5 rounded-full text-[9px] transition-colors"
                    >
                      <Trash2 size={11}/>
                    </button>
                  </div>
                  <div className="flex justify-between gap-1.5">
                    <button onClick={handleBrowseScreenshot} className="text-[9.5px] bg-[#1a1c27] hover:bg-[#252838] text-gray-200 font-bold px-2 py-1 rounded border border-[#2d3142] flex-1">
                      Change Image
                    </button>
                    <button onClick={handleAnalyzeScreenshot} disabled={isProcessing} className="text-[9.5px] bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold px-2 py-1 rounded flex-1 disabled:opacity-50 shadow-[0_0_10px_rgba(249,115,22,0.4)] border border-orange-400">
                      {isProcessing ? 'Analyzing...' : '✨ Analyze with AI'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={handleBrowseScreenshot}
                  className="p-2 border-2 border-dashed border-[#2d3142] hover:border-orange-500/60 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/30 hover:bg-orange-500/5 transition-all gap-1"
                >
                  <ImageIcon size={16} className="text-gray-500" />
                  <span className="text-[9.5px] text-gray-300 font-medium">Upload News Screenshot</span>
                  <span className="text-[8px] text-gray-500">PNG, JPG, WEBP</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* GLOBAL SETTINGS (STRUCTURED NO-DEAD-SPACE CARD) */}
        <div className="bg-[#14161f] border border-[#2e3346] hover:border-orange-500/40 rounded-xl p-3 shadow-lg flex-1 flex flex-col gap-2 min-h-0 relative overflow-hidden transition-colors">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

          <div className="flex items-center justify-between border-b border-[#252838] pb-1.5 shrink-0">
            <h3 className="text-[11.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-['Rajdhani']">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
              <Settings2 size={13} className="text-orange-400"/> GLOBAL SETTINGS
            </h3>
            <span className="text-[8.5px] text-orange-400 font-mono font-bold bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-500/30">BATCH PRESETS</span>
          </div>

          <div className="flex-1 overflow-y-auto m5-scroll pr-0.5 space-y-2">
            
            {/* Section 1: Video Engine Specs */}
            <div className="bg-[#0f1017]/70 border border-[#232635] p-2 rounded-lg space-y-1.5">
              <span className="text-[8.5px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider flex items-center gap-1">
                <Sliders size={10}/> Video Specs & Dimensions
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Duration</label>
                  <select value={globalDuration} onChange={e => setGlobalDuration(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[24px]">
                    <option value="Auto">Auto (Audio length)</option>
                    <option value="15s">15s</option>
                    <option value="20s">20s</option>
                    <option value="30s">30s</option>
                    <option value="45s">45s</option>
                    <option value="60s">60s</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Language</label>
                  <select value={globalLang} onChange={e => setGlobalLang(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[24px]">
                    <option value="Indonesia">Indonesia</option>
                    <option value="English">English</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Resolution</label>
                  <select value={globalRes} onChange={e => setGlobalRes(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[24px]">
                    <option value="1080x1920 (9:16)">1080x1920 (9:16)</option>
                    <option value="720x1280 (9:16)">720x1280 (9:16)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">FPS</label>
                  <select value={globalFPS} onChange={e => setGlobalFPS(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[24px]">
                    <option value="30 FPS">30 FPS</option>
                    <option value="60 FPS">60 FPS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Audio & Voice Mixer */}
            <div className="bg-[#0f1017]/70 border border-[#232635] p-2 rounded-lg space-y-1.5">
              <span className="text-[8.5px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider flex items-center gap-1">
                <Mic size={10}/> Voice & Audio Mixer
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Voice Speed</label>
                  <select value={voiceSpeed} onChange={e => setVoiceSpeed(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[24px]">
                    <option value="0.9x">0.9x (Slow)</option>
                    <option value="1.0x">1.0x (Normal)</option>
                    <option value="1.1x">1.1x (Fast)</option>
                    <option value="1.2x">1.2x (Ultra)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Voice Type</label>
                  <select value={voiceGender} onChange={e => setVoiceGender(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[24px]">
                    <option value="Female">Female (Natural)</option>
                    <option value="Male">Male (Deep)</option>
                  </select>
                </div>
              </div>
              <div className="pt-0.5">
                <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']">
                  <span className="flex items-center gap-1"><Volume2 size={9} className="text-orange-400"/> BGM Gain</span>
                  <span className="text-orange-400 font-mono">{bgmVolume}%</span>
                </label>
                <input type="range" min="0" max="100" value={bgmVolume} onChange={e => setBgmVolume(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
              </div>
            </div>

            {/* Section 3: Asset Storage Directories */}
            <div className="bg-[#0f1017]/70 border border-[#232635] p-2 rounded-lg space-y-1.5">
              <span className="text-[8.5px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider flex items-center gap-1">
                <Layers size={10}/> Automation Asset Folders
              </span>
              <div>
                <label className="text-[8px] text-gray-400 uppercase font-bold flex items-center gap-1"><Video size={9} className="text-orange-400"/> Background Folder (Optional)</label>
                <div className="flex border border-[#2d3142] rounded overflow-hidden mt-0.5 bg-[#0f1017] focus-within:border-orange-500/60 shadow-inner h-[22px]">
                  <input type="text" readOnly value={bgFolder} placeholder="Random video file if empty" className="bg-transparent px-1.5 text-[8.5px] w-full border-none outline-none text-gray-300 font-mono"/>
                  <button onClick={() => handleBrowseFolder(setBgFolder)} className="bg-[#1e212f] hover:bg-orange-600 hover:text-white px-2 text-[8.5px] text-orange-400 font-bold border-l border-[#2d3142] transition-colors cursor-pointer flex items-center">Browse</button>
                </div>
              </div>
              <div>
                <label className="text-[8px] text-gray-400 uppercase font-bold flex items-center gap-1"><Music size={9} className="text-orange-400"/> Audio / Voice Folder (Optional)</label>
                <div className="flex border border-[#2d3142] rounded overflow-hidden mt-0.5 bg-[#0f1017] focus-within:border-orange-500/60 shadow-inner h-[22px]">
                  <input type="text" readOnly value={audioFolder} placeholder="Random audio file if empty" className="bg-transparent px-1.5 text-[8.5px] w-full border-none outline-none text-gray-300 font-mono"/>
                  <button onClick={() => handleBrowseFolder(setAudioFolder)} className="bg-[#1e212f] hover:bg-orange-600 hover:text-white px-2 text-[8.5px] text-orange-400 font-bold border-l border-[#2d3142] transition-colors cursor-pointer flex items-center">Browse</button>
                </div>
              </div>
              <div>
                <label className="text-[8px] text-gray-400 uppercase font-bold flex items-center gap-1"><ImageIcon size={9} className="text-orange-400"/> Overlay Folder (Optional)</label>
                <div className="flex border border-[#2d3142] rounded overflow-hidden mt-0.5 bg-[#0f1017] focus-within:border-orange-500/60 shadow-inner h-[22px]">
                  <input type="text" readOnly value={overlayFolder} placeholder="Random overlay file if empty" className="bg-transparent px-1.5 text-[8.5px] w-full border-none outline-none text-gray-300 font-mono"/>
                  <button onClick={() => handleBrowseFolder(setOverlayFolder)} className="bg-[#1e212f] hover:bg-orange-600 hover:text-white px-2 text-[8.5px] text-orange-400 font-bold border-l border-[#2d3142] transition-colors cursor-pointer flex items-center">Browse</button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CENTER COLUMN: REFINED 9:16 LIVE CANVAS (BROADCAST QUALITY) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div 
        className="flex items-center justify-center h-full relative select-none shrink-0"
        onMouseMove={(e) => {
          if (isResizingScale) {
            const dx = e.clientX - resizeStart.x;
            setBoxScale(Math.max(30, Math.min(200, resizeStart.scale + dx)));
            return;
          }
          if (isResizingWidth) {
            const dx = e.clientX - resizeStart.x;
            setBoxWidth(Math.max(40, Math.min(100, resizeStart.width + dx * 0.5)));
            return;
          }
          if (isDraggingBox) {
            const newX = Math.max(-100, Math.min(100, e.clientX - boxDragStart.x));
            const newY = Math.max(-300, Math.min(30, e.clientY - boxDragStart.y));
            setBoxPos({ x: newX, y: newY });
            return;
          }
        }}
        onMouseUp={() => { setIsDraggingBox(false); setIsResizingScale(false); setIsResizingWidth(false); setIsDraggingImage(false); }}
        onMouseLeave={() => { setIsDraggingBox(false); setIsResizingScale(false); setIsResizingWidth(false); setIsDraggingImage(false); }}
      >
        {/* THE 9:16 CANVAS WITH SLICK DEVICE FRAME */}
        <div 
          className="h-full max-h-full aspect-[9/16] max-w-full w-auto relative rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(249,115,22,0.25)] ring-1 ring-[#3a3f58] hover:ring-orange-500/60 flex flex-col justify-between select-none shrink-0 transition-all border border-[#222533]"
          style={{ backgroundColor: colorBackground }}
        >
            
            {/* Background Image / Visual Layer */}
            <div className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-[#10121a]">
              {image ? (
                <>
                  {/* Blurry Ambient Background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-55 scale-125 pointer-events-none" 
                    style={{ backgroundImage: `url(${image})` }}
                  />
                  
                  {/* Draggable Foreground Image */}
                  <div 
                    className="w-[92%] mx-auto h-full relative group/img overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      setIsDraggingImage(true);
                      setImageDragStart({ x: e.clientX, y: e.clientY, posX: imagePosX, posY: imagePosY });
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImageScale(s => Math.max(50, Math.min(300, Number(s) + (e.deltaY > 0 ? -5 : 5))));
                    }}
                  >
                    <img 
                      src={image} 
                      className="absolute z-10 max-w-none pointer-events-none rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
                      style={{ 
                        width: `${imageScale}%`, 
                        height: 'auto',
                        left: `${(100 - imageScale) * (imagePosX / 100)}%`,
                        top: `${imagePosY * 0.7}%`
                      }} 
                      draggable={false}
                    />
                    
                    <div className="absolute top-2 left-2 z-20 bg-black/80 backdrop-blur-sm text-orange-300 text-[8px] px-2 py-0.5 rounded-full border border-orange-500/40 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none font-mono">
                      Scroll to Zoom • Drag to Move
                    </div>
                  </div>
                </>
              ) : (
                <div 
                  onClick={handleReplaceImage} 
                  className="w-full h-full flex flex-col items-center justify-center gap-2.5 opacity-40 hover:opacity-80 transition-opacity cursor-pointer p-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                    <ImageIcon size={28} className="text-orange-400"/>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-bold font-['Rajdhani'] uppercase tracking-widest text-orange-300 block">NO IMAGE LOADED</span>
                    <span className="text-[8px] font-mono text-gray-400">Click to upload or fetch draft</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Bar Header inside Canvas (Category Badge & Source Pill) */}
            <div className="relative z-20 flex items-center justify-between p-3.5 pointer-events-none">
              {category && (
                <span 
                  className="text-white text-[8.5px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg border border-white/20 font-['Rajdhani']"
                  style={{ backgroundColor: colorPrimary }}
                >
                  {category}
                </span>
              )}
              {source && (
                <span className="text-[8.5px] font-mono font-bold text-gray-200 bg-black/70 px-2.5 py-0.5 rounded-full border border-white/15 backdrop-blur-md shadow-md">
                  {source}
                </span>
              )}
            </div>

            {/* Bottom Safe Area: Broadcast News Card */}
            <div className="relative z-20 w-full p-3 flex flex-col justify-end pointer-events-none pb-4">
              <div 
                className={`relative flex flex-col justify-end cursor-move group/box p-3.5 pointer-events-auto shadow-[0_15px_35px_rgba(0,0,0,0.85)] transition-all`}
                onMouseDown={(e) => {
                  if (e.target.tagName === 'H2' || e.target.tagName === 'P') return;
                  setIsDraggingBox(true);
                  setBoxDragStart({ x: e.clientX - boxPos.x, y: e.clientY - boxPos.y });
                  e.stopPropagation();
                }}
                style={{
                  width: `${boxWidth}%`,
                  height: boxHeight > 0 ? `${boxHeight}px` : 'auto',
                  maxHeight: '65%',
                  margin: '0 auto',
                  transform: `translate(${boxPos.x}px, ${boxPos.y}px) scale(${boxScale / 100})`,
                  transformOrigin: 'bottom center',
                  boxSizing: 'border-box',
                  backgroundColor: cardTheme === 'Minimal Quote' ? 'transparent' : colorBackground,
                  backgroundImage: cardTheme === 'Gradient Overlay' ? `linear-gradient(to top, ${colorBackground} 20%, rgba(15,23,42,0.7) 100%)` : 'none',
                  borderLeft: (cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote') ? `4px solid ${colorPrimary}` : 'none',
                  border: cardTheme === 'Bordered Box' ? `2px solid ${colorPrimary}` : (cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote') ? undefined : 'none',
                  borderRadius: cardTheme === 'Pill Shape' ? '20px' : `${borderRadius}px`,
                  clipPath: cardTheme === 'Slanted Bottom' ? 'polygon(0 6%, 100% 0, 100% 100%, 0 100%)' : 'none',
                  backdropFilter: cardTheme === 'Glass Box' ? 'blur(14px)' : 'none',
                  opacity: cardTheme === 'Glass Box' ? 0.94 : 1
                }}
              >
                {/* Headline */}
                <h2 
                  key={`head-${headlineAnim}`} 
                  className={`leading-[1.25] mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] outline-none hover:ring-1 ring-orange-500/50 rounded-sm cursor-text break-words ${getAnimClass(headlineAnim)}`}
                  style={{ 
                    fontFamily: headlineFont, 
                    fontSize: `${headlineSize}px`, 
                    color: headlineColor, 
                    textAlign: headlineAlign, 
                    fontWeight: headlineWeight, 
                    fontStyle: headlineItalic ? 'italic' : 'normal' 
                  }}
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={e => setHeadline(e.currentTarget.textContent || '')}
                >
                  {headline}
                </h2>
                
                {/* Summary */}
                <p 
                  key={`sum-${summaryAnim}`} 
                  className={`leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] outline-none hover:ring-1 ring-orange-500/50 rounded-sm cursor-text break-words ${getAnimClass(summaryAnim)}`}
                  style={{ 
                    fontFamily: summaryFont, 
                    fontSize: `${summarySize}px`, 
                    color: summaryColor, 
                    textAlign: summaryAlign, 
                    fontWeight: summaryWeight, 
                    fontStyle: summaryItalic ? 'italic' : 'normal' 
                  }}
                  contentEditable 
                  suppressContentEditableWarning
                  onBlur={e => setSummary(e.currentTarget.textContent || '')}
                >
                  {summary}
                </p>

                {/* On-Canvas Resize Handles */}
                <div 
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full cursor-nwse-resize border-2 border-white shadow-md z-50 opacity-0 group-hover/box:opacity-100 transition-opacity"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizingScale(true);
                    setResizeStart({ x: e.clientX, scale: boxScale, width: boxWidth });
                  }}
                  title="Scale Box Size"
                />
                <div 
                  className="absolute top-1/2 -right-1 w-2 h-5 -translate-y-1/2 bg-orange-500 rounded-full cursor-ew-resize border border-white shadow-md z-50 opacity-0 group-hover/box:opacity-100 transition-opacity"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizingWidth(true);
                    setResizeStart({ x: e.clientX, scale: boxScale, width: boxWidth });
                  }}
                  title="Adjust Box Width"
                />
              </div>
            </div>
            
            {/* Loading Indicator */}
            {isProcessing && (
              <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[9.5px] font-bold tracking-widest uppercase text-white animate-pulse font-['Rajdhani']">Generating AI Draft...</span>
              </div>
            )}

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. RIGHT SECTION: SIDE-BY-SIDE (INSPECTOR FULL HEIGHT | AI DRAFT + QUEUE) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-[560px] flex gap-2.5 min-h-0 h-full">
        
        {/* SUBCOLUMN 1: TABS & INSPECTOR CONTROLS (TEXT / IMAGE / THEME) - EXTENDED FULL HEIGHT */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 h-full">
          {/* TOP TAB CONTROLS */}
          <div className="bg-[#14161f] border border-[#2e3346] rounded-xl p-1 flex gap-1 justify-center shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent"></div>

            <button onClick={() => setActiveTab('TEXT')} className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'TEXT' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] border border-orange-400' : 'hover:bg-white/5 text-gray-400'}`}>
              <Type size={11}/> Text
            </button>
            <button onClick={() => setActiveTab('IMAGE')} className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'IMAGE' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] border border-orange-400' : 'hover:bg-white/5 text-gray-400'}`}>
              <ImageIcon size={11}/> Image
            </button>
            <button onClick={() => setActiveTab('THEME')} className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'THEME' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] border border-orange-400' : 'hover:bg-white/5 text-gray-400'}`}>
              <Palette size={11}/> Theme
            </button>
          </div>

          {/* TAB INSPECTOR CONTROLS (COMPACT NO-SCROLL LAYOUT) */}
          <div className="flex-1 bg-[#14161f] border border-[#2e3346] rounded-xl p-2.5 overflow-y-auto m5-scroll shadow-lg relative min-h-0">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

            {/* TAB 1: TEXT CUSTOMIZATION */}
            {activeTab === 'TEXT' && (
              <div className="flex flex-col gap-2">
                 {/* Headline Typography */}
                 <div className="flex flex-col gap-1 bg-[#0f1017]/60 p-2 rounded-lg border border-[#232635]">
                   <div className="flex items-center justify-between border-b border-[#232635] pb-0.5">
                     <span className="text-[9px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider">
                       Headline Typography
                     </span>
                     <span className="text-[8px] text-gray-500 font-mono">{headlineSize}px</span>
                   </div>
                   
                   {/* Row 1: Font Family & Animation */}
                   <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                     <div>
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Font Family</label>
                       <select value={headlineFont} onChange={e => setHeadlineFont(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[23px]">
                         <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                         <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Animation</label>
                       <select value={headlineAnim} onChange={e => setHeadlineAnim(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[23px]">
                         <option value="None">None</option>
                         <option value="Fade In">Fade In</option>
                         <option value="Fade In Up">Fade In Up</option>
                         <option value="Fade In Down">Fade In Down</option>
                         <option value="Fade In Left">Fade In Left</option>
                         <option value="Fade In Right">Fade In Right</option>
                       </select>
                     </div>
                   </div>

                   {/* Row 2: Align / Style & Color */}
                   <div className="grid grid-cols-2 gap-1.5 items-center pt-0.5">
                     <div className="flex gap-0.5">
                       <button onClick={() => setHeadlineAlign('left')} title="Align Left" className={`p-1 rounded flex-1 flex justify-center ${headlineAlign === 'left' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignLeft size={10}/></button>
                       <button onClick={() => setHeadlineAlign('center')} title="Align Center" className={`p-1 rounded flex-1 flex justify-center ${headlineAlign === 'center' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignCenter size={10}/></button>
                       <button onClick={() => setHeadlineAlign('right')} title="Align Right" className={`p-1 rounded flex-1 flex justify-center ${headlineAlign === 'right' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignRight size={10}/></button>
                       <div className="w-px bg-[#2d3142] mx-0.5"></div>
                       <button onClick={() => setHeadlineWeight(w => w === 'bold' ? 'normal' : 'bold')} title="Bold" className={`p-1 rounded flex-1 flex justify-center ${headlineWeight === 'bold' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Bold size={10}/></button>
                       <button onClick={() => setHeadlineItalic(i => !i)} title="Italic" className={`p-1 rounded flex-1 flex justify-center ${headlineItalic ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Italic size={10}/></button>
                     </div>

                     <div className="flex items-center gap-1">
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] shrink-0">Color</label>
                       <input type="color" value={headlineColor} onChange={e => setHeadlineColor(e.target.value)} className="w-full h-[20px] bg-[#0f1017] border border-[#2d3142] rounded p-0 cursor-pointer"/>
                     </div>
                   </div>

                   {/* Row 3: Font Size slider */}
                   <div className="flex items-center gap-1.5 pt-0.5">
                     <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] shrink-0 w-[55px]">Size ({headlineSize}px)</label>
                     <input type="range" min="12" max="36" value={headlineSize} onChange={e => setHeadlineSize(Number(e.target.value))} className="w-full accent-orange-500 h-1 cursor-pointer"/>
                   </div>
                 </div>

                 {/* Summary Typography */}
                 <div className="flex flex-col gap-1 bg-[#0f1017]/60 p-2 rounded-lg border border-[#232635]">
                   <div className="flex items-center justify-between border-b border-[#232635] pb-0.5">
                     <span className="text-[9px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider">
                       Summary Typography
                     </span>
                     <span className="text-[8px] text-gray-500 font-mono">{summarySize}px</span>
                   </div>

                   {/* Row 1: Font Family & Animation */}
                   <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                     <div>
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Font Family</label>
                       <select value={summaryFont} onChange={e => setSummaryFont(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[23px]">
                         <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                         <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] block">Animation</label>
                       <select value={summaryAnim} onChange={e => setSummaryAnim(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none h-[23px]">
                         <option value="None">None</option>
                         <option value="Fade In">Fade In</option>
                         <option value="Fade In Up">Fade In Up</option>
                         <option value="Fade In Down">Fade In Down</option>
                         <option value="Fade In Left">Fade In Left</option>
                         <option value="Fade In Right">Fade In Right</option>
                       </select>
                     </div>
                   </div>

                   {/* Row 2: Align / Style & Color */}
                   <div className="grid grid-cols-2 gap-1.5 items-center pt-0.5">
                     <div className="flex gap-0.5">
                       <button onClick={() => setSummaryAlign('left')} title="Align Left" className={`p-1 rounded flex-1 flex justify-center ${summaryAlign === 'left' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignLeft size={10}/></button>
                       <button onClick={() => setSummaryAlign('center')} title="Align Center" className={`p-1 rounded flex-1 flex justify-center ${summaryAlign === 'center' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignCenter size={10}/></button>
                       <button onClick={() => setSummaryAlign('right')} title="Align Right" className={`p-1 rounded flex-1 flex justify-center ${summaryAlign === 'right' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignRight size={10}/></button>
                       <div className="w-px bg-[#2d3142] mx-0.5"></div>
                       <button onClick={() => setSummaryWeight(w => w === 'bold' ? 'normal' : 'bold')} title="Bold" className={`p-1 rounded flex-1 flex justify-center ${summaryWeight === 'bold' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Bold size={10}/></button>
                       <button onClick={() => setSummaryItalic(i => !i)} title="Italic" className={`p-1 rounded flex-1 flex justify-center ${summaryItalic ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Italic size={10}/></button>
                     </div>

                     <div className="flex items-center gap-1">
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] shrink-0">Color</label>
                       <input type="color" value={summaryColor} onChange={e => setSummaryColor(e.target.value)} className="w-full h-[20px] bg-[#0f1017] border border-[#2d3142] rounded p-0 cursor-pointer"/>
                     </div>
                   </div>

                   {/* Row 3: Font Size slider */}
                   <div className="flex items-center gap-1.5 pt-0.5">
                     <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] shrink-0 w-[55px]">Size ({summarySize}px)</label>
                     <input type="range" min="8" max="24" value={summarySize} onChange={e => setSummarySize(Number(e.target.value))} className="w-full accent-orange-500 h-1 cursor-pointer"/>
                   </div>
                 </div>

                 {/* Card Dimensions (Scale & Width Side by Side) */}
                 <div className="bg-[#0f1017]/60 p-2 rounded-lg border border-[#232635]">
                   <span className="text-[9px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider border-b border-[#232635] pb-0.5 block mb-1">
                     Card Size & Scale
                   </span>
                   <div className="grid grid-cols-2 gap-2 pt-0.5">
                     <div>
                       <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']"><span>Scale</span> <span className="text-orange-400 font-mono">{boxScale}%</span></label>
                       <input type="range" min="40" max="160" value={boxScale} onChange={e=>setBoxScale(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
                     </div>
                     <div>
                       <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']"><span>Width</span> <span className="text-orange-400 font-mono">{boxWidth}%</span></label>
                       <input type="range" min="40" max="100" value={boxWidth} onChange={e=>setBoxWidth(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
                     </div>
                   </div>
                 </div>
              </div>
            )}

            {/* TAB 2: IMAGE CUSTOMIZATION */}
            {activeTab === 'IMAGE' && (
              <div className="flex flex-col gap-2.5">
                 <button onClick={handleReplaceImage} className="w-full py-1.5 bg-[#1a1c27] border border-[#2d3142] hover:border-orange-500/60 rounded-lg text-[9.5px] font-bold text-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                   <ImageIcon size={12} className="text-orange-400"/> Replace Foreground Image
                 </button>

                 <div className="bg-[#0f1017]/60 p-2.5 rounded-lg border border-[#232635] space-y-2">
                   <div>
                     <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']"><span>Image Zoom</span> <span className="text-orange-400 font-mono">{imageScale}%</span></label>
                     <input type="range" min="50" max="300" value={imageScale} onChange={e=>setImageScale(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
                   </div>
                   <div>
                     <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']"><span>Pos X</span> <span className="text-orange-400 font-mono">{imagePosX}%</span></label>
                     <input type="range" min="0" max="100" value={imagePosX} onChange={e=>setImagePosX(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
                   </div>
                   <div>
                     <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']"><span>Pos Y</span> <span className="text-orange-400 font-mono">{imagePosY}%</span></label>
                     <input type="range" min="0" max="100" value={imagePosY} onChange={e=>setImagePosY(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
                   </div>
                 </div>
              </div>
            )}

            {/* TAB 3: THEME CUSTOMIZATION */}
            {activeTab === 'THEME' && (
              <div className="flex flex-col gap-2.5">
                 <div className="bg-[#0f1017]/60 p-2.5 rounded-lg border border-[#232635] space-y-2">
                   <div>
                     <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani']">Card Theme Preset</label>
                     <select value={cardTheme} onChange={e => setCardTheme(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded px-1.5 py-0.5 text-[9.5px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner h-[24px]">
                       <option value="Glass Box">Glass Box (Modern Blur)</option>
                       <option value="Solid Box">Solid Box (High Contrast)</option>
                       <option value="Accent Left">Accent Left (News Border)</option>
                       <option value="Gradient Overlay">Gradient Overlay (Seamless)</option>
                       <option value="Bordered Box">Bordered Box (Cyber Neon)</option>
                       <option value="Minimal Quote">Minimal Quote (Clean)</option>
                       <option value="Pill Shape">Pill Shape (Rounded)</option>
                       <option value="Slanted Bottom">Slanted Bottom (Futuristic)</option>
                     </select>
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani']">Primary Accent</label>
                       <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)} className="w-full h-[22px] mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded p-0 cursor-pointer"/>
                     </div>
                     <div>
                       <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani']">Card Background</label>
                       <input type="color" value={colorBackground} onChange={e => setColorBackground(e.target.value)} className="w-full h-[22px] mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded p-0 cursor-pointer"/>
                     </div>
                   </div>

                   <div>
                     <label className="text-[8px] text-gray-400 flex justify-between uppercase font-bold font-['Rajdhani']"><span>Corner Radius</span> <span className="text-orange-400 font-mono">{borderRadius}px</span></label>
                     <input type="range" min="0" max="28" value={borderRadius} onChange={e=>setBorderRadius(Number(e.target.value))} className="w-full accent-orange-500 mt-0.5 h-1 cursor-pointer"/>
                   </div>
                 </div>
              </div>
            )}

          </div>
        </div>

        {/* SUBCOLUMN 2: AI DRAFT + ADD TO QUEUE BUTTON (ENLARGED TEXTAREAS) */}
        <div className="flex-1 flex flex-col gap-2 min-h-0 h-full">
          {/* AI DRAFT PANEL */}
          <div className="flex-1 bg-[#14161f] border border-[#2e3346] hover:border-orange-500/40 rounded-xl p-3 shadow-lg flex flex-col min-h-0 relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

            <div className="flex justify-between items-center mb-2 border-b border-[#252838] pb-1.5 shrink-0">
              <h3 className="text-[11.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-['Rajdhani']">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
                <Zap size={13} className="text-orange-400"/> AI DRAFT
              </h3>
              {isProcessing ? (
                <div className="flex items-center gap-1 text-[9px] text-orange-400 font-bold uppercase animate-pulse">
                  <div className="w-2.5 h-2.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> {pipelineProgress || 'Working...'}
                </div>
              ) : pipelineProgress === 'Draft Ready' ? (
                <div className="flex items-center gap-1 text-[9px] text-orange-400 font-bold uppercase bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-500/40">
                  <CheckCircle2 size={10}/> Ready
                </div>
              ) : (
                <span className="text-[8.5px] text-gray-500 font-bold uppercase">Editable</span>
              )}
            </div>
            
            <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto m5-scroll pr-1">
              {/* ENLARGED HEADLINE */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider flex items-center gap-1">
                    <Type size={11}/> Headline
                  </label>
                  <span className="text-[8px] text-gray-500 font-mono">{headline.length} chars</span>
                </div>
                <textarea 
                  value={headline} 
                  onChange={e => setHeadline(e.target.value)} 
                  rows={4}
                  placeholder="Enter news headline..."
                  className="w-full bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 rounded-lg p-2.5 text-[12px] font-bold text-white resize-none outline-none shadow-inner leading-snug min-h-[85px] transition-all"
                />
              </div>
              
              {/* ENLARGED SUMMARY */}
              <div className="flex flex-col gap-1 flex-1 min-h-0">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-orange-400 uppercase font-black font-['Rajdhani'] tracking-wider flex items-center gap-1">
                    <Type size={11}/> Summary
                  </label>
                  <span className="text-[8px] text-gray-500 font-mono">{summary.length} chars</span>
                </div>
                <textarea 
                  value={summary} 
                  onChange={e => setSummary(e.target.value)} 
                  rows={7}
                  placeholder="Enter detailed summary..."
                  className="w-full flex-1 bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/30 rounded-lg p-2.5 text-[11.5px] text-gray-200 resize-none outline-none shadow-inner leading-relaxed min-h-[140px] transition-all"
                />
              </div>

              {/* CATEGORY & SOURCE */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#232635] shrink-0">
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider block mb-0.5">Category</label>
                  <input 
                    value={category} 
                    onChange={e => setCategory(e.target.value.toUpperCase())} 
                    placeholder="INTERNASIONAL"
                    className="w-full bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/70 rounded-lg px-2.5 py-1 text-[10.5px] text-gray-200 uppercase font-bold outline-none shadow-inner h-[28px]"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider block mb-0.5">Source</label>
                  <input 
                    value={source} 
                    onChange={e => setSource(e.target.value)} 
                    placeholder="cnnindonesia.com"
                    className="w-full bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/70 rounded-lg px-2.5 py-1 text-[10.5px] text-gray-200 font-mono outline-none shadow-inner h-[28px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEND TO QUEUE BUTTON (MATCHING AI DRAFT WIDTH) */}
          <button 
            onClick={handleAddToQueue} 
            className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl py-2.5 flex flex-col items-center justify-center transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-400 cursor-pointer active:scale-[0.98] shrink-0"
          >
            <span className="font-black text-[12.5px] uppercase tracking-[0.18em] font-['Rajdhani'] flex items-center gap-1.5">
              <Plus size={15} className="text-white"/> ADD TO QUEUE
            </span>
            <span className="text-[8px] text-orange-100 font-bold uppercase tracking-widest">SEND TO RENDER ENGINE</span>
          </button>
        </div>

      </div>

    </div>
  );
}
