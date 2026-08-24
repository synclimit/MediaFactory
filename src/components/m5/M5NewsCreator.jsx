import React, { useState, useEffect } from 'react';
import { 
  FileText, Trash2, CheckCircle2, ChevronRight, Zap, Play, Edit2, Clock, Globe, Video, Music, Bell, Plus, Image as ImageIcon, Type, Layout, Sliders, Palette, Settings2, ZoomIn, ZoomOut, Maximize,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, RotateCcw
} from 'lucide-react';


const getAnimClass = (animName) => {
    if (animName === "None") return "";
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
  const [links, setLinks] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_links`) || "https://www.cnnindonesia.com/internasional/2024/05/23/presiden-as-joe-biden-kunjungi-vietnam");
  const [globalDuration, setGlobalDuration] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_duration`) || "30s");
  const [globalLang, setGlobalLang] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_lang`) || "Indonesia");
  const [globalRes, setGlobalRes] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_res`) || "1080x1920 (9:16)");
  const [globalFPS, setGlobalFPS] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_fps`) || "30 FPS");
  
  const [bgFolder, setBgFolder] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_bgFolder`) || "");
  const [audioFolder, setAudioFolder] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_audioFolder`) || "");
  const [overlayFolder, setOverlayFolder] = useState(() => localStorage.getItem(`m5_${activeWorkspace}_news_overlayFolder`) || "");

  useEffect(() => {
    localStorage.setItem(`m5_${activeWorkspace}_news_links`, links);
    localStorage.setItem(`m5_${activeWorkspace}_news_duration`, globalDuration);
    localStorage.setItem(`m5_${activeWorkspace}_news_lang`, globalLang);
    localStorage.setItem(`m5_${activeWorkspace}_news_res`, globalRes);
    localStorage.setItem(`m5_${activeWorkspace}_news_fps`, globalFPS);
    localStorage.setItem(`m5_${activeWorkspace}_news_bgFolder`, bgFolder);
    localStorage.setItem(`m5_${activeWorkspace}_news_audioFolder`, audioFolder);
    localStorage.setItem(`m5_${activeWorkspace}_news_overlayFolder`, overlayFolder);
  }, [links, globalDuration, globalLang, globalRes, globalFPS, bgFolder, audioFolder, overlayFolder, activeWorkspace]);

  const handleBrowseFolder = async (setter) => {
      try {
          const res = await fetch('/api/v1/m5/dialog/folder', { method: 'POST' });
          const data = await res.json();
          if (data.path) setter(data.path);
      } catch(e) {}
  };

  const handleReplaceImage = async () => {
    try {
      const res = await fetch('/api/v1/m5/dialog/file', { method: 'POST' });
      const data = await res.json();
      if (data.path) {
        setImage(`/@fs/${data.path.replace(/\\/g, '/')}`);
      }
    } catch(e) {}
  };
  

  // --- CARD EDITOR STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(null);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editorReady, setEditorReady] = useState(false);

  // Connect to SSE for pipeline progress
  useEffect(() => {
    const sse = new EventSource('/api/v1/m5/stream');
    
    sse.addEventListener('news_progress', (e) => {
      const data = JSON.parse(e.data);
      if (data.stages) {
        setPipelineStages(data.stages);
        const activeStage = data.stages.find(s => s.status === 'RUNNING' || s.status === 'WAITING');
        if (activeStage) {
            setPipelineProgress(activeStage.name);
        }
      }
    });

    sse.addEventListener('news_draft_update', (e) => {
      const { module, data } = JSON.parse(e.data);
      if (module === 'reader') {
         try { setSource(new URL(data.url).hostname.replace('www.', '')); } catch(e) {}
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
      if (module === 'visual') {
         // Could update image here if we had an image state
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
      } catch(err) {}
      setPipelineProgress('Draft Ready');
    });
    
    sse.addEventListener('news_pipeline_error', (e) => {
      setIsProcessing(false);
      setPipelineProgress('Pipeline Error');
    });

    return () => sse.close();
  }, []);

  const handleStartPipeline = () => {
    if (!links || !links.trim().startsWith('http')) return;
    setIsProcessing(true);
    setPipelineProgress('Starting...');
    setEditorReady(false);
    
    fetch('/api/v1/m5/news/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: links.trim() })
    }).catch(e => {
        setIsProcessing(false);
        setPipelineProgress('Error connecting to backend');
    });
  };

  const [cardTheme, setCardTheme] = useWorkspaceState('cardTheme', 'Glass Box');
  const [colorPrimary, setColorPrimary] = useWorkspaceState('colorPrimary', '#ef4444');
  const [colorBackground, setColorBackground] = useWorkspaceState('colorBackground', '#0f172a');
  const [borderRadius, setBorderRadius] = useWorkspaceState('borderRadius', 12);
  
  const [headline, setHeadline] = useWorkspaceState('headline', 'Presiden AS Joe Biden Kunjungi Vietnam, Bahas Kerja Sama Ekonomi & Keamanan');
  const [headlineFont, setHeadlineFont] = useWorkspaceState('headlineFont', 'Inter');
  const [headlineSize, setHeadlineSize] = useWorkspaceState('headlineSize', 24);
  const [headlineColor, setHeadlineColor] = useWorkspaceState('headlineColor', '#ffffff');
  const [headlineAnim, setHeadlineAnim] = useWorkspaceState('headlineAnim', 'Fade In Up');
  const [headlineAlign, setHeadlineAlign] = useWorkspaceState('headlineAlign', 'left');
  const [headlineWeight, setHeadlineWeight] = useWorkspaceState('headlineWeight', 'bold');
  const [headlineItalic, setHeadlineItalic] = useWorkspaceState('headlineItalic', false);
  
  const [summary, setSummary] = useWorkspaceState('summary', 'Kunjungan ini menandai langkah baru dalam hubungan bilateral kedua negara yang semakin erat dalam beberapa tahun terakhir.');
  const [summaryFont, setSummaryFont] = useWorkspaceState('summaryFont', 'Inter');
  const [summarySize, setSummarySize] = useWorkspaceState('summarySize', 13);
  const [summaryColor, setSummaryColor] = useWorkspaceState('summaryColor', '#d1d5db');
  const [summaryAnim, setSummaryAnim] = useWorkspaceState('summaryAnim', 'Fade In Up');
  const [summaryAlign, setSummaryAlign] = useWorkspaceState('summaryAlign', 'left');
  const [summaryWeight, setSummaryWeight] = useWorkspaceState('summaryWeight', 'normal');
  const [summaryItalic, setSummaryItalic] = useWorkspaceState('summaryItalic', false);
  
  
  const [boxPos, setBoxPos] = useState(() => {
     try { const v = localStorage.getItem(`m5_${activeWorkspace}_news_boxPos`); return v ? JSON.parse(v) : { x: 0, y: 0 }; } catch(e) { return { x: 0, y: 0 }; }
  });
  useEffect(() => { localStorage.setItem(`m5_${activeWorkspace}_news_boxPos`, JSON.stringify(boxPos)); }, [boxPos, activeWorkspace]);

  const [boxScale, setBoxScale] = useWorkspaceState('boxScale', 100);
  const [boxWidth, setBoxWidth] = useWorkspaceState('boxWidth', 100);
  const [boxHeight, setBoxHeight] = useState(0);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [boxDragStart, setBoxDragStart] = useState({ x: 0, y: 0 });
  
  const [isResizingScale, setIsResizingScale] = useState(false);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, scale: 100, width: 100 });
  
  const [source, setSource] = useState('cnnindonesia.com');
  const [sourceEnabled, setSourceEnabled] = useState(true);
  
  const [category, setCategory] = useState('INTERNASIONAL');
  const [date, setDate] = useState('23 Mei 2024');
  
  const [imageScale, setImageScale] = useWorkspaceState('imageScale', 100);
  const [imagePosX, setImagePosX] = useWorkspaceState('imagePosX', 50);
  const [imagePosY, setImagePosY] = useWorkspaceState('imagePosY', 10);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0, posX: 50, posY: 10 });
  const [imgAspect, setImgAspect] = useState(1);

  // Global drag handler for image to bypass DOM bubbling issues
  useEffect(() => {
    if (!isDraggingImage) return;

    const handleMouseMove = (e) => {
        const dxScaled = (e.clientX - imageDragStart.x) / (zoom / 100);
        const dyScaled = (e.clientY - imageDragStart.y) / (zoom / 100);
        
        const C_W = 405 * 0.85;
        const C_H = 720;
        const I_W = C_W * (imageScale / 100);
        const I_H = I_W / (imgAspect || 1);
        
        const currentLeft = (C_W - I_W) * (imageDragStart.posX / 100);
        const currentTop = (C_H - I_H) * (imageDragStart.posY / 100);
        
        const newLeft = currentLeft + dxScaled;
        const newTop = currentTop + dyScaled;
        
        let newPosX = imageDragStart.posX;
        if (Math.abs(C_W - I_W) > 0.1) {
            newPosX = (newLeft / (C_W - I_W)) * 100;
        }
        let newPosY = imageDragStart.posY;
        if (Math.abs(C_H - I_H) > 0.1) {
            newPosY = (newTop / (C_H - I_H)) * 100;
        }
        
        setImagePosX(Math.max(0, Math.min(100, Math.round(newPosX))));
        setImagePosY(Math.max(0, Math.min(100, Math.round(newPosY))));
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
  }, [isDraggingImage, imageDragStart, imageScale, imgAspect, zoom]);

  // Editable Component Mode (What is currently being edited in the control panel)
  const [activeTab, setActiveTab] = useState('TEXT'); // TEXT, IMAGE, THEME

  const handleAddToQueue = () => {
    if (!setM5Queue) return;
    const newJob = {
      id: Date.now().toString(),
      type: 'render',
      status: 'Ready',
      progress: 0,
      workspaceName: activeWorkspace,
      formula: 'News Creator (M5)',
      duration: globalDuration,
      snapshot: {
        outPath: `Output/M5/News_${Date.now()}.mp4`,
        ffmpegCommand: 'Custom Live News Render',
        manifest: { 
          headline, summary, image, cardTheme, boxPos, boxScale, boxWidth, boxHeight,
          duration: globalDuration, bgFolder, audioFolder, overlayFolder, resolution: globalRes, fps: globalFPS,
          config: {
            headline: { size: headlineSize, color: headlineColor, font: headlineFont, align: headlineAlign, weight: headlineWeight, italic: headlineItalic, anim: headlineAnim },
            summary: { size: summarySize, color: summaryColor, font: summaryFont, align: summaryAlign, weight: summaryWeight, italic: summaryItalic, anim: summaryAnim },
            layout: { boxScale, boxWidth, boxHeight, imageScale, imagePosX, imagePosY },
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
    } catch(e) {}
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
    } catch(e) {
      setPipelineProgress('Error reading screenshot');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-4 h-full font-sans text-white min-h-0 pb-2">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        
        .anim-FadeIn { animation: fadeIn 0.8s ease-out forwards; }
        .anim-FadeInUp { animation: fadeInUp 0.8s ease-out forwards; }
        .anim-FadeInDown { animation: fadeInDown 0.8s ease-out forwards; }
        .anim-FadeInLeft { animation: fadeInLeft 0.8s ease-out forwards; }
        .anim-FadeInRight { animation: fadeInRight 0.8s ease-out forwards; }
      `}</style>
      
      {/* 40% LEFT: INPUT & SETTINGS */}
      <div className="w-[30%] min-w-[290px] flex flex-col gap-2.5 min-h-0 h-full">
        
        {/* INPUT SOURCE WITH 2 OPTIONS */}
        <div className="bg-[#14161f] border border-[#2e3346] hover:border-orange-500/40 rounded-xl p-3 flex flex-col gap-2 shadow-lg relative overflow-hidden transition-colors shrink-0">
          {/* Top Orange Hairline Accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

          <div className="flex items-center justify-between border-b border-[#252838] pb-1.5">
            <h3 className="text-[11.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-['Rajdhani']">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
              <Globe size={13} className="text-orange-400"/> NEWS SOURCE
            </h3>
          </div>

          {/* Mode Switcher Tabs */}
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
                className="w-full h-[68px] bg-[#0f1017] border border-[#2d3142] rounded-lg p-2 text-[10.5px] text-gray-200 font-mono resize-none focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30 transition-all shadow-inner"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                placeholder="Paste URL(s) or import from TXT..."
              />
              
              <div className="flex justify-between items-center">
                <button onClick={() => setLinks('')} className="text-[10px] text-gray-400 hover:text-red-400 px-1.5 py-0.5 rounded transition-all cursor-pointer">Clear</button>
                <button onClick={handleStartPipeline} disabled={isProcessing} className="text-[10.5px] bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold font-['Rajdhani'] uppercase tracking-wider px-3.5 py-1 rounded-lg transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(249,115,22,0.4)] border border-orange-400 cursor-pointer">
                  {isProcessing ? 'Processing...' : 'Fetch AI Draft'}
                </button>
              </div>
            </>
          ) : (
            <>
              {screenshotPath ? (
                <div className="flex flex-col gap-1.5">
                  <div className="relative rounded-lg overflow-hidden border border-[#2d3142] max-h-[90px] bg-black flex items-center justify-center">
                    <img src={`/@fs/${screenshotPath.replace(/\\/g, '/')}`} className="max-h-[90px] object-contain" />
                    <button 
                      onClick={() => setScreenshotPath('')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-0.5 rounded-full text-[9px] transition-colors"
                    >
                      <Trash2 size={11}/>
                    </button>
                  </div>
                  <div className="flex justify-between gap-1.5">
                    <button onClick={handleBrowseScreenshot} className="text-[9.5px] bg-[#1a1c27] hover:bg-[#252838] text-gray-200 font-bold px-2 py-1 rounded border border-[#2d3142] flex-1">
                      Change Screenshot
                    </button>
                    <button onClick={handleAnalyzeScreenshot} disabled={isProcessing} className="text-[9.5px] bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold px-2 py-1 rounded flex-1 disabled:opacity-50 shadow-[0_0_10px_rgba(249,115,22,0.4)] border border-orange-400">
                      {isProcessing ? 'Reading AI...' : '✨ Analyze with AI'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={handleBrowseScreenshot}
                  className="p-2.5 border-2 border-dashed border-[#2d3142] hover:border-orange-500/60 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer bg-black/30 hover:bg-orange-500/5 transition-all gap-1"
                >
                  <ImageIcon size={18} className="text-gray-500" />
                  <span className="text-[10px] text-gray-300 font-medium">Upload News Screenshot</span>
                  <span className="text-[8.5px] text-gray-500">PNG, JPG, WEBP format</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* GLOBAL SETTINGS - Fills remaining height cleanly */}
        <div className="bg-[#14161f] border border-[#2e3346] hover:border-orange-500/40 rounded-xl p-3 flex-1 flex flex-col justify-between shadow-lg relative overflow-hidden transition-colors min-h-0">
          {/* Top Orange Hairline Accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

          <div>
            <div className="flex items-center justify-between border-b border-[#252838] pb-1.5 mb-2">
              <h3 className="text-[11.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-['Rajdhani']">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
                <Settings2 size={13} className="text-orange-400"/> GLOBAL SETTINGS
              </h3>
              <span className="text-[8.5px] text-orange-400 font-mono font-bold">BATCH PRESETS</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8.5px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Duration</label>
                <select value={globalDuration} onChange={e => setGlobalDuration(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded-md px-2 py-1 text-[10px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner cursor-pointer h-[28px]">
                  <option value="Auto">Auto (Ikuti Panjang Audio)</option>
                  <option value="10s">10s</option>
                  <option value="15s">15s</option>
                  <option value="20s">20s</option>
                  <option value="25s">25s</option>
                  <option value="30s">30s</option>
                  <option value="45s">45s</option>
                  <option value="60s">60s</option>
                  <option value="90s">90s</option>
                </select>
              </div>
              <div>
                <label className="text-[8.5px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Language</label>
                <select value={globalLang} onChange={e => setGlobalLang(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded-md px-2 py-1 text-[10px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner cursor-pointer h-[28px]">
                  <option value="Indonesia">Indonesia</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div>
                <label className="text-[8.5px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Resolution</label>
                <select value={globalRes} onChange={e => setGlobalRes(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded-md px-2 py-1 text-[10px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner cursor-pointer h-[28px]">
                  <option value="1080x1920 (9:16)">1080x1920 (9:16)</option>
                </select>
              </div>
              <div>
                <label className="text-[8.5px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">FPS</label>
                <select value={globalFPS} onChange={e => setGlobalFPS(e.target.value)} className="w-full mt-0.5 bg-[#0f1017] border border-[#2d3142] rounded-md px-2 py-1 text-[10px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner cursor-pointer h-[28px]">
                  <option value="30 FPS">30 FPS</option>
                  <option value="60 FPS">60 FPS</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#252838]">
            <div>
              <label className="text-[8.5px] text-gray-400 uppercase font-bold flex items-center gap-1"><Video size={9.5} className="text-orange-400"/> Background Folder (Optional)</label>
              <div className="flex border border-[#2d3142] rounded-md overflow-hidden mt-0.5 bg-[#0f1017] focus-within:border-orange-500/60 shadow-inner h-[26px]">
                <input type="text" readOnly value={bgFolder} placeholder="Random file if empty" className="bg-transparent px-2 text-[9.5px] w-full border-none outline-none text-gray-300 font-mono"/>
                <button onClick={() => handleBrowseFolder(setBgFolder)} className="bg-[#1e212f] hover:bg-orange-600 hover:text-white px-2.5 text-[9.5px] text-orange-400 font-bold border-l border-[#2d3142] transition-colors cursor-pointer flex items-center">Browse</button>
              </div>
            </div>
            <div>
              <label className="text-[8.5px] text-gray-400 uppercase font-bold flex items-center gap-1"><Music size={9.5} className="text-orange-400"/> Audio Folder (Optional)</label>
              <div className="flex border border-[#2d3142] rounded-md overflow-hidden mt-0.5 bg-[#0f1017] focus-within:border-orange-500/60 shadow-inner h-[26px]">
                <input type="text" readOnly value={audioFolder} placeholder="Random file if empty" className="bg-transparent px-2 text-[9.5px] w-full border-none outline-none text-gray-300 font-mono"/>
                <button onClick={() => handleBrowseFolder(setAudioFolder)} className="bg-[#1e212f] hover:bg-orange-600 hover:text-white px-2.5 text-[9.5px] text-orange-400 font-bold border-l border-[#2d3142] transition-colors cursor-pointer flex items-center">Browse</button>
              </div>
            </div>
            <div>
              <label className="text-[8.5px] text-gray-400 uppercase font-bold flex items-center gap-1"><ImageIcon size={9.5} className="text-orange-400"/> Overlay Folder (Optional)</label>
              <div className="flex border border-[#2d3142] rounded-md overflow-hidden mt-0.5 bg-[#0f1017] focus-within:border-orange-500/60 shadow-inner h-[26px]">
                <input type="text" readOnly value={overlayFolder} placeholder="Random file if empty" className="bg-transparent px-2 text-[9.5px] w-full border-none outline-none text-gray-300 font-mono"/>
                <button onClick={() => handleBrowseFolder(setOverlayFolder)} className="bg-[#1e212f] hover:bg-orange-600 hover:text-white px-2.5 text-[9.5px] text-orange-400 font-bold border-l border-[#2d3142] transition-colors cursor-pointer flex items-center">Browse</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 40% CENTER: CARD EDITOR (Row Layout) */}
      <div className="flex-1 flex gap-3 min-w-[500px] h-full">
        {/* 9:16 LIVE PREVIEW CARD */}
        <div 
          className="flex-1 flex justify-center items-center h-full min-h-0 relative select-none"
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
            const newY = Math.max(-350, Math.min(20, e.clientY - boxDragStart.y));
            setBoxPos({ x: newX, y: newY });
            return;
          }
        }}
        onMouseUp={() => { setIsDraggingBox(false); setIsResizingScale(false); setIsResizingWidth(false); setIsDraggingImage(false); }}
        onMouseLeave={() => { setIsDraggingBox(false); setIsResizingScale(false); setIsResizingWidth(false); setIsDraggingImage(false); }}
      >
        {/* THE CARD ITSELF (9:16) */}
        <div 
          className="w-[405px] h-[720px] max-h-full aspect-[9/16] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/40 rounded-xl cursor-default group card-content shrink-0"
          style={{ backgroundColor: colorBackground }}
        >
          {/* Background Image Area (Always Full Height) */}
          <div className="absolute inset-0 z-0 h-full">
            <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-start justify-center">
               {image ? (
                  <>
                     <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110" style={{ backgroundImage: `url(${image})` }}></div>
                     <div className="w-[85%] mx-auto h-full relative group/img overflow-hidden cursor-move"
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
                          }}>
                       <img src={image} className="absolute z-10 max-w-none pointer-events-none" 
                            style={{ 
                                width: `${imageScale}%`, 
                                height: 'auto',
                                left: `${(100 - imageScale) * (imagePosX / 100)}%`,
                                top: `${(720 - ((405 * 0.85 * (imageScale / 100)) / (imgAspect || 1))) * (imagePosY / 100)}px`
                            }} 
                            draggable={false}
                            onLoad={(e) => setImgAspect(e.target.naturalWidth / e.target.naturalHeight)}
                       />
                       <div className="absolute top-2 left-2 z-20 bg-black/60 text-orange-300 text-[9px] px-2 py-1 rounded border border-orange-500/40 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none font-mono">Scroll to Zoom, Drag to Move</div>
                     </div>
                  </>
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
                    <ImageIcon size={40} className="text-orange-400"/>
                    <span className="text-xs font-mono text-gray-400">NO IMAGE LOADED</span>
                  </div>
               )}
            </div>
          </div>

          {/* Text Box Content Area (Safe Margins inside 9:16) */}
          <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col justify-end items-center pointer-events-none px-4">
             <div className="w-full relative flex flex-col justify-end">
             {/* Dynamic Theme Box Wrapper */}
             <div 
                className={`relative flex flex-col justify-end cursor-move group/box p-4 pointer-events-auto rounded-xl`}
                onMouseDown={(e) => {
                    if (e.target.tagName === 'H2' || e.target.tagName === 'P') return;
                    setIsDraggingBox(true);
                    setBoxDragStart({ x: e.clientX - boxPos.x, y: e.clientY - boxPos.y });
                    e.stopPropagation();
                }}
                style={{
                    width: `${boxWidth}%`,
                    height: boxHeight > 0 ? `${boxHeight}px` : 'auto',
                    margin: '0 auto',
                    transform: `translate(${boxPos.x}px, ${boxPos.y}px) scale(${boxScale / 100})`,
                    transformOrigin: 'bottom center',
                    boxSizing: 'border-box',
                    backgroundColor: cardTheme === 'Minimal Quote' ? 'transparent' : colorBackground,
                    backgroundImage: cardTheme === 'Gradient Overlay' ? `linear-gradient(to top, ${colorBackground} 10%, transparent 100%)` : 'none',
                    borderLeft: (cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote') ? `5px solid ${colorPrimary}` : 'none',
                    border: cardTheme === 'Bordered Box' ? `2px solid ${colorPrimary}` : (cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote') ? undefined : 'none',
                    borderRadius: cardTheme === 'Pill Shape' ? '24px' : '12px',
                    clipPath: cardTheme === 'Slanted Bottom' ? 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)' : 'none',
                    opacity: cardTheme === 'Glass Box' ? 0.88 : 1
                }}
             >
                 <h2 key={`head-${headlineAnim}`} className={`leading-[1.25] mb-2.5 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text break-words ${getAnimClass(headlineAnim)}`}
                     style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor, textAlign: headlineAlign, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal' }}
                     contentEditable suppressContentEditableWarning
                     onBlur={e => setHeadline(e.currentTarget.textContent)}>{headline}</h2>
                 
                 <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-0.5 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text break-words ${getAnimClass(summaryAnim)}`}
                    style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor, textAlign: summaryAlign, fontWeight: summaryWeight, fontStyle: summaryItalic ? 'italic' : 'normal' }}
                    contentEditable suppressContentEditableWarning
                    onBlur={e => setSummary(e.currentTarget.textContent)}>{summary}</p>

                 {/* Custom On-Canvas Resize Handles */}
                 <div 
                   className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full cursor-nwse-resize border-2 border-white shadow-md z-50 opacity-0 group-hover/box:opacity-100 transition-opacity"
                   onMouseDown={(e) => {
                       e.stopPropagation();
                       setIsResizingScale(true);
                       setResizeStart({ x: e.clientX, scale: boxScale, width: boxWidth });
                   }}
                 />
                 <div 
                   className="absolute top-1/2 -right-2 w-2 h-6 -translate-y-1/2 bg-orange-500 rounded-full cursor-ew-resize border border-white shadow-md z-50 opacity-0 group-hover/box:opacity-100 transition-opacity"
                   onMouseDown={(e) => {
                       e.stopPropagation();
                       setIsResizingWidth(true);
                       setResizeStart({ x: e.clientX, scale: boxScale, width: boxWidth });
                   }}
                 />
             </div>
             </div>
          </div>
          
          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white animate-pulse">Reading URL...</span>
            </div>
          )}

        </div>
      </div>

        {/* RIGHT SIDE: CONTROLS */}
        <div className="w-[240px] flex flex-col gap-3 h-full">
          {/* TOP TAB CONTROLS */}
          <div className="bg-[#14161f] border border-[#2e3346] rounded-xl p-1.5 flex gap-1 justify-center shadow-lg relative overflow-hidden">
            {/* Top Orange Accent */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent"></div>

            <button onClick={() => setActiveTab('TEXT')} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold font-['Rajdhani'] uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'TEXT' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] border border-orange-400' : 'hover:bg-white/5 text-gray-400'}`}>
              <Type size={12}/> Text
            </button>
            <button onClick={() => setActiveTab('IMAGE')} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold font-['Rajdhani'] uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'IMAGE' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] border border-orange-400' : 'hover:bg-white/5 text-gray-400'}`}>
              <ImageIcon size={12}/> Image
            </button>
            <button onClick={() => setActiveTab('THEME')} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold font-['Rajdhani'] uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'THEME' ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.4)] border border-orange-400' : 'hover:bg-white/5 text-gray-400'}`}>
              <Palette size={12}/> Theme
            </button>
          </div>

          {/* CONTEXTUAL CONTROLS */}
          <div className="flex-1 bg-[#14161f] border border-[#2e3346] rounded-xl p-3.5 overflow-y-auto m5-scroll shadow-lg relative overflow-hidden">
            {/* Top Orange Hairline */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

            {activeTab === 'TEXT' && (
              <div className="flex flex-col gap-3">
                 <div className="flex flex-col gap-2">
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Headline Font</label>
                     <select value={headlineFont} onChange={e => setHeadlineFont(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner">
                       <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                       <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                     </select>
                     
                     <div className="flex gap-1 mt-2">
                       <button onClick={() => setHeadlineAlign('left')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineAlign === 'left' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignLeft size={12}/></button>
                       <button onClick={() => setHeadlineAlign('center')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineAlign === 'center' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignCenter size={12}/></button>
                       <button onClick={() => setHeadlineAlign('right')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineAlign === 'right' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignRight size={12}/></button>
                       <div className="w-px bg-[#2d3142] mx-1 my-1"></div>
                       <button onClick={() => setHeadlineWeight(w => w === 'bold' ? 'normal' : 'bold')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineWeight === 'bold' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Bold size={12}/></button>
                       <button onClick={() => setHeadlineItalic(i => !i)} className={`flex-1 flex justify-center p-1.5 rounded ${headlineItalic ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Italic size={12}/></button>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Size</label>
                       <input type="number" value={headlineSize} onChange={e => setHeadlineSize(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner"/>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Color</label>
                       <input type="color" value={headlineColor} onChange={e => setHeadlineColor(e.target.value)} className="w-full h-[28px] mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg p-0 cursor-pointer"/>
                     </div>
                   </div>
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Animation</label>
                     <select value={headlineAnim} onChange={e => setHeadlineAnim(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner">
                       <option value="None">None</option>
                       <option value="Fade In">Fade In</option>
                       <option value="Fade In Up">Fade In Up</option>
                       <option value="Fade In Down">Fade In Down</option>
                       <option value="Fade In Left">Fade In Left</option>
                       <option value="Fade In Right">Fade In Right</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="flex flex-col gap-2 border-t border-[#252838] pt-3">
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Summary Font</label>
                     <select value={summaryFont} onChange={e => setSummaryFont(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner">
                       <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                       <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                     </select>
                     
                     <div className="flex gap-1 mt-2">
                       <button onClick={() => setSummaryAlign('left')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'left' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignLeft size={12}/></button>
                       <button onClick={() => setSummaryAlign('center')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'center' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignCenter size={12}/></button>
                       <button onClick={() => setSummaryAlign('right')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'right' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><AlignRight size={12}/></button>
                       <div className="w-px bg-[#2d3142] mx-1 my-1"></div>
                       <button onClick={() => setSummaryWeight(w => w === 'bold' ? 'normal' : 'bold')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryWeight === 'bold' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Bold size={12}/></button>
                       <button onClick={() => setSummaryItalic(i => !i)} className={`flex-1 flex justify-center p-1.5 rounded ${summaryItalic ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-[#0f1017] hover:bg-[#1a1c27] text-gray-400 border border-[#2d3142]'}`}><Italic size={12}/></button>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Size</label>
                       <input type="number" value={summarySize} onChange={e => setSummarySize(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner"/>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Color</label>
                       <input type="color" value={summaryColor} onChange={e => setSummaryColor(e.target.value)} className="w-full h-[28px] mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg p-0 cursor-pointer"/>
                     </div>
                   </div>
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Animation</label>
                     <select value={summaryAnim} onChange={e => setSummaryAnim(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner">
                       <option value="None">None</option>
                       <option value="Fade In">Fade In</option>
                       <option value="Fade In Up">Fade In Up</option>
                       <option value="Fade In Down">Fade In Down</option>
                       <option value="Fade In Left">Fade In Left</option>
                       <option value="Fade In Right">Fade In Right</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="pt-2 border-t border-[#252838] mt-1">
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 font-['Rajdhani'] tracking-wider"><span>Box Scale</span> <span className="text-orange-400 font-mono">{boxScale}%</span></label>
                   <input type="range" min="30" max="200" value={boxScale} onChange={e=>setBoxScale(e.target.value)} className="w-full accent-orange-500"/>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2 font-['Rajdhani'] tracking-wider"><span>Box Width</span> <span className="text-orange-400 font-mono">{boxWidth}%</span></label>
                   <input type="range" min="30" max="100" value={boxWidth} onChange={e=>setBoxWidth(e.target.value)} className="w-full accent-orange-500"/>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2 font-['Rajdhani'] tracking-wider"><span>Box Height</span> <span className="text-orange-400 font-mono">{boxHeight === 0 ? 'Auto' : boxHeight + 'px'}</span></label>
                   <input type="range" min="0" max="500" value={boxHeight} onChange={e=>setBoxHeight(Number(e.target.value))} className="w-full accent-orange-500"/>
                   
                   <button 
                      type="button" 
                      onClick={() => { setBoxPos({ x: 0, y: 0 }); setBoxScale(100); setBoxWidth(100); }} 
                      className="w-full mt-3 py-1.5 px-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-lg text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={11} /> Reset Posisi & Ukuran Box
                    </button>
                 </div>
               </div>
            )}

            {activeTab === 'IMAGE' && (
              <div className="flex flex-col gap-4">
                 <button onClick={handleReplaceImage} className="w-full py-2 bg-[#1a1c27] border border-[#2d3142] hover:border-orange-500/60 rounded-lg text-[11px] font-bold text-gray-200 transition-colors">Replace Image</button>
                 <div>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 font-['Rajdhani'] tracking-wider"><span>Scale</span> <span className="text-orange-400 font-mono">{imageScale}%</span></label>
                   <input type="range" min="50" max="300" value={imageScale} onChange={e=>setImageScale(Number(e.target.value))} className="w-full accent-orange-500"/>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2 font-['Rajdhani'] tracking-wider"><span>Pos X</span> <span className="text-orange-400 font-mono">{imagePosX}%</span></label>
                   <input type="range" min="0" max="100" value={imagePosX} onChange={e=>setImagePosX(Number(e.target.value))} className="w-full accent-orange-500"/>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2 font-['Rajdhani'] tracking-wider"><span>Pos Y</span> <span className="text-orange-400 font-mono">{imagePosY}%</span></label>
                   <input type="range" min="0" max="100" value={imagePosY} onChange={e=>setImagePosY(Number(e.target.value))} className="w-full accent-orange-500"/>
                 </div>
              </div>
            )}

            {activeTab === 'THEME' && (
              <div className="flex flex-col gap-3">
                 <div>
                   <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Card Theme</label>
                   <select value={cardTheme} onChange={e => setCardTheme(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 focus:border-orange-500/70 outline-none shadow-inner">
                     <option value="Solid Box">Solid Box</option>
                     <option value="Glass Box">Glass Box</option>
                     <option value="Accent Left">Accent Left</option>
                     <option value="Gradient Overlay">Gradient Overlay</option>
                     <option value="Bordered Box">Bordered Box</option>
                     <option value="Minimal Quote">Minimal Quote</option>
                     <option value="Slanted Bottom">Slanted Bottom</option>
                     <option value="Pill Shape">Pill Shape</option>
                   </select>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Primary</label>
                     <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)} className="w-full h-[28px] mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg p-0 cursor-pointer"/>
                   </div>
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Background</label>
                     <input type="color" value={colorBackground} onChange={e => setColorBackground(e.target.value)} className="w-full h-[28px] mt-1 bg-[#0f1017] border border-[#2d3142] rounded-lg p-0 cursor-pointer"/>
                   </div>
                 </div>
                 <div>
                   <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Border Radius ({borderRadius}px)</label>
                   <input type="range" min="0" max="32" value={borderRadius} onChange={e=>setBorderRadius(e.target.value)} className="w-full accent-orange-500 mt-1"/>
                 </div>
                 
                 <button 
                    type="button" 
                    onClick={() => { setBoxPos({ x: 0, y: 0 }); setBoxScale(100); setBoxWidth(100); }} 
                    className="w-full mt-2 py-1.5 px-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-lg text-[9.5px] font-bold font-['Rajdhani'] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset Posisi Box ke Tengah
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 25% RIGHT: AI DRAFT & ACTIONS */}
      <div className="w-[25%] min-w-[280px] flex flex-col gap-3">
        <div className="bg-[#14161f] border border-[#2e3346] hover:border-orange-500/40 rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 relative overflow-hidden transition-colors">
          {/* Top Orange Hairline */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500/70 to-transparent"></div>

          <div className="flex justify-between items-center mb-3 border-b border-[#252838] pb-2">
            <h3 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Rajdhani']">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,1)]"></span>
              <Zap size={14} className="text-orange-400"/> AI DRAFT
            </h3>
            {isProcessing ? (
              <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold uppercase animate-pulse">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> {pipelineProgress || 'Processing...'}
              </div>
            ) : pipelineProgress === 'Draft Ready' ? (
              <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold uppercase bg-orange-950/40 px-2 py-0.5 rounded border border-orange-500/40">
                <CheckCircle2 size={12}/> Draft Ready
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                Waiting for input...
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto m5-scroll pr-1 space-y-3">
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Headline (Editable)</label>
              <textarea value={headline} onChange={e => setHeadline(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/70 rounded-lg p-2.5 text-[11px] text-gray-200 resize-none h-[65px] outline-none shadow-inner leading-relaxed"/>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Summary (Editable)</label>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/70 rounded-lg p-2.5 text-[11px] text-gray-200 resize-none h-[85px] outline-none shadow-inner leading-relaxed"/>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold font-['Rajdhani'] tracking-wider">Source</label>
              <input value={source} onChange={e => setSource(e.target.value)} className="w-full mt-1 bg-[#0f1017] border border-[#2d3142] focus:border-orange-500/70 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-200 font-mono outline-none shadow-inner"/>
            </div>
          </div>
        </div>

        {/* Big Add to Queue Button */}
        <button onClick={handleAddToQueue} className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl py-3.5 flex flex-col items-center justify-center transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-400 cursor-pointer active:scale-[0.98]">
          <span className="font-black text-[15px] uppercase tracking-[0.2em] font-['Rajdhani'] flex items-center gap-2">
            <Plus size={18} className="text-white"/> ADD TO QUEUE
          </span>
          <span className="text-[9px] text-orange-100 font-bold uppercase tracking-widest">SEND TO RENDER ENGINE</span>
        </button>
      </div>

    </div>
  );
}
