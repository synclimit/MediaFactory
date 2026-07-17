import React, { useState, useEffect } from 'react';
import { 
  FileText, Trash2, CheckCircle2, ChevronRight, Zap, Play, Edit2, Clock, Globe, Video, Music, Bell, Plus, Image as ImageIcon, Type, Layout, Sliders, Palette, Settings2, ZoomIn, ZoomOut, Maximize,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic
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
      <div className="w-[30%] min-w-[300px] flex flex-col gap-3 min-h-0 overflow-y-auto m5-scroll pr-1">
        
        {/* INPUT */}
        <div className="bg-[#111216] border border-[#2a2c33] rounded-xl p-4 flex flex-col gap-2 shadow-lg">
          <h3 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe size={14} className="text-orange-500"/> News Source
          </h3>
          <p className="text-[10px] text-gray-500">Paste URL(s) or import from TXT.</p>
          
          <textarea 
            className="w-full h-[100px] bg-[#1a1c23] border border-[#333] rounded-lg p-2 text-[11px] text-gray-300 font-mono resize-none focus:outline-none focus:border-orange-500 transition-colors"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="https://..."
          />
          
          <div className="flex justify-between items-center mt-1">
            <div className="flex gap-2">
              <button className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded transition-all">Import TXT</button>
              <button className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded transition-all">Clear</button>
            </div>
            <button onClick={handleStartPipeline} disabled={isProcessing} className="text-[11px] bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded transition-all disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Add to Queue'}
            </button>
          </div>
        </div>

        {/* SETTINGS */}
        <div className="bg-[#111216] border border-[#2a2c33] rounded-xl p-4 flex flex-col gap-3 shadow-lg flex-1">
          <h3 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings2 size={14} className="text-orange-500"/> Global Settings
          </h3>
          <p className="text-[10px] text-gray-500 mb-1">Set output properties for the batch.</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold">Duration</label>
              <select value={globalDuration} onChange={e => setGlobalDuration(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="30s">30s</option>
                <option value="60s">60s</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold">Language</label>
              <select value={globalLang} onChange={e => setGlobalLang(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="Indonesia">Indonesia</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold">Resolution</label>
              <select value={globalRes} onChange={e => setGlobalRes(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="1080x1920 (9:16)">1080x1920 (9:16)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold">FPS</label>
              <select value={globalFPS} onChange={e => setGlobalFPS(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="30 FPS">30 FPS</option>
                <option value="60 FPS">60 FPS</option>
              </select>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><Video size={10}/> Background Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly value={bgFolder} placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button onClick={() => handleBrowseFolder(setBgFolder)} className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><Music size={10}/> Audio Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly value={audioFolder} placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button onClick={() => handleBrowseFolder(setAudioFolder)} className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><ImageIcon size={10}/> Overlay Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly value={overlayFolder} placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button onClick={() => handleBrowseFolder(setOverlayFolder)} className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 40% CENTER: CARD EDITOR (Row Layout) */}
      <div className="flex-1 flex gap-3 min-w-[500px] h-full">
        
        {/* LEFT SIDE: VISUALIZER */}
        <div className={`flex-1 bg-[#111] border border-[#2a2c33] rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner group/canvas ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${pan.x}px ${pan.y}px` }}
             onMouseDown={(e) => {
               if (e.target.closest('.card-content') || e.target.closest('button')) return;
               setIsDragging(true);
               setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
             }}
             onMouseMove={(e) => {
               if (isResizingScale) {
                 const dx = e.clientX - resizeStart.x;
                 setBoxScale(Math.max(30, Math.min(300, resizeStart.scale + (dx * (100/zoom)))));
                 return;
               }
               if (isResizingWidth) {
                 const dx = e.clientX - resizeStart.x;
                 setBoxWidth(Math.max(30, Math.min(100, resizeStart.width + (dx * 0.5 * (100/zoom)))));
                 return;
               }
               if (isDraggingBox) {
                 setBoxPos({ x: (e.clientX - boxDragStart.x) * (100/zoom), y: (e.clientY - boxDragStart.y) * (100/zoom) });
                 return;
               }
               if (!isDragging) return;
               setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
             }}
             onMouseUp={() => { setIsDragging(false); setIsDraggingBox(false); setIsResizingScale(false); setIsResizingWidth(false); setIsDraggingImage(false); }}
             onMouseLeave={() => { setIsDragging(false); setIsDraggingBox(false); setIsResizingScale(false); setIsResizingWidth(false); setIsDraggingImage(false); }}>
             
          {/* Zoom Controls Overlay */}
          <div className="absolute top-3 right-3 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-lg px-2 border border-white/5 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="p-1.5 text-gray-400 hover:text-white"><ZoomOut size={14}/></button>
            <span className="text-[11px] font-mono w-[40px] text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 text-gray-400 hover:text-white"><ZoomIn size={14}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => setZoom(100)} className="p-1.5 text-gray-400 hover:text-white"><Maximize size={14}/></button>
          </div>
          
          <div className="absolute top-3 left-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">LIVE EDITOR</div>
          
          {/* Transform Container for Zoom/Pan */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
            
            {/* THE CARD ITSELF (9:16) */}
            <div className="w-[405px] h-[720px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 cursor-default group card-content"
                 style={{ backgroundColor: colorBackground }}>
            
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
                         <div className="absolute top-2 left-2 z-20 bg-black/50 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">Scroll to Zoom, Drag to Move</div>
                       </div>
                    </>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-gray-700"/></div>
                 )}
              </div>
            </div>

            {/* Text Box Content Area */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end items-center pointer-events-none">
               <div className="w-[85%] relative flex flex-col justify-end">
               {/* Dynamic Theme Box Wrapper */}
               <div 
                  className={`relative flex flex-col justify-end cursor-move group/box p-5 mb-10 pointer-events-auto`}
                  onMouseDown={(e) => {
                      if (e.target.tagName === 'H2' || e.target.tagName === 'P') return;
                      setIsDraggingBox(true);
                      setBoxDragStart({ x: e.clientX - (boxPos.x / (100/zoom)), y: e.clientY - (boxPos.y / (100/zoom)) });
                      e.stopPropagation();
                  }}
                  style={{
                      width: `${boxWidth}%`,
                      height: boxHeight > 0 ? `${boxHeight}px` : 'auto',
                      margin: boxWidth < 100 ? '0 auto' : undefined,
                      transform: `translate(${boxPos.x}px, ${boxPos.y}px) scale(${boxScale / 100})`,
                      transformOrigin: 'bottom center',
                      backgroundColor: cardTheme === 'Minimal Quote' ? 'transparent' : colorBackground,
                      backgroundImage: cardTheme === 'Gradient Overlay' ? `linear-gradient(to top, ${colorBackground} 10%, transparent 100%)` : 'none',
                      borderLeft: (cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote') ? `6px solid ${colorPrimary}` : 'none',
                      border: cardTheme === 'Bordered Box' ? `2px solid ${colorPrimary}` : (cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote') ? undefined : 'none',
                      borderRadius: cardTheme === 'Pill Shape' ? '9999px' : '0px',
                      clipPath: cardTheme === 'Slanted Bottom' ? 'polygon(0 15%, 100% 0, 100% 100%, 0 100%)' : 'none',
                      opacity: cardTheme === 'Glass Box' ? 0.8 : 1
                  }}
               >
                   <h2 key={`head-${headlineAnim}`} className={`leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(headlineAnim)}`}
                       style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor, textAlign: headlineAlign, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal' }}
                       contentEditable suppressContentEditableWarning
                       onBlur={e => setHeadline(e.currentTarget.textContent)}>{headline}</h2>
                   
                   <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-1 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(summaryAnim)}`}
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
        </div>

        {/* RIGHT SIDE: CONTROLS */}
        <div className="w-[240px] flex flex-col gap-3 h-full">
          {/* TOP TAB CONTROLS */}
          <div className="bg-[#111216] border border-[#2a2c33] rounded-xl p-2 flex gap-1 justify-center shadow-lg">
            <button onClick={() => setActiveTab('TEXT')} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'TEXT' ? 'bg-orange-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
              <Type size={12}/> Text
            </button>
            <button onClick={() => setActiveTab('IMAGE')} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'IMAGE' ? 'bg-orange-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
              <ImageIcon size={12}/> Image
            </button>
            <button onClick={() => setActiveTab('THEME')} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'THEME' ? 'bg-orange-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}>
              <Palette size={12}/> Theme
            </button>
          </div>

          {/* CONTEXTUAL CONTROLS */}
          <div className="flex-1 bg-[#111216] border border-[#2a2c33] rounded-xl p-3 overflow-y-auto m5-scroll shadow-lg">
            {activeTab === 'TEXT' && (
              <div className="flex flex-col gap-3">
                 <div className="flex flex-col gap-2">
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Headline Font</label>
                     <select value={headlineFont} onChange={e => setHeadlineFont(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                       <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                     </select>
                     
                     <div className="flex gap-1 mt-2">
                       <button onClick={() => setHeadlineAlign('left')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineAlign === 'left' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignLeft size={12}/></button>
                       <button onClick={() => setHeadlineAlign('center')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineAlign === 'center' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignCenter size={12}/></button>
                       <button onClick={() => setHeadlineAlign('right')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineAlign === 'right' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignRight size={12}/></button>
                       <div className="w-px bg-[#333] mx-1 my-1"></div>
                       <button onClick={() => setHeadlineWeight(w => w === 'bold' ? 'normal' : 'bold')} className={`flex-1 flex justify-center p-1.5 rounded ${headlineWeight === 'bold' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><Bold size={12}/></button>
                       <button onClick={() => setHeadlineItalic(i => !i)} className={`flex-1 flex justify-center p-1.5 rounded ${headlineItalic ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><Italic size={12}/></button>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold">Size</label>
                       <input type="number" value={headlineSize} onChange={e => setHeadlineSize(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none"/>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                       <input type="color" value={headlineColor} onChange={e => setHeadlineColor(e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                     </div>
                   </div>
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Animation</label>
                     <select value={headlineAnim} onChange={e => setHeadlineAnim(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option value="None">None</option>
                       <option value="Fade In">Fade In</option>
                       <option value="Fade In Up">Fade In Up</option>
                       <option value="Fade In Down">Fade In Down</option>
                       <option value="Fade In Left">Fade In Left</option>
                       <option value="Fade In Right">Fade In Right</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="flex flex-col gap-2 border-t border-[#333] pt-3">
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Summary Font</label>
                     <select value={summaryFont} onChange={e => setSummaryFont(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                       <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                     </select>
                     
                     <div className="flex gap-1 mt-2">
                       <button onClick={() => setSummaryAlign('left')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'left' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignLeft size={12}/></button>
                       <button onClick={() => setSummaryAlign('center')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'center' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignCenter size={12}/></button>
                       <button onClick={() => setSummaryAlign('right')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'right' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignRight size={12}/></button>
                       <div className="w-px bg-[#333] mx-1 my-1"></div>
                       <button onClick={() => setSummaryWeight(w => w === 'bold' ? 'normal' : 'bold')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryWeight === 'bold' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><Bold size={12}/></button>
                       <button onClick={() => setSummaryItalic(i => !i)} className={`flex-1 flex justify-center p-1.5 rounded ${summaryItalic ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><Italic size={12}/></button>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold">Size</label>
                       <input type="number" value={summarySize} onChange={e => setSummarySize(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none"/>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                       <input type="color" value={summaryColor} onChange={e => setSummaryColor(e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                     </div>
                   </div>
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Animation</label>
                     <select value={summaryAnim} onChange={e => setSummaryAnim(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option value="None">None</option>
                       <option value="Fade In">Fade In</option>
                       <option value="Fade In Up">Fade In Up</option>
                       <option value="Fade In Down">Fade In Down</option>
                       <option value="Fade In Left">Fade In Left</option>
                       <option value="Fade In Right">Fade In Right</option>
                     </select>
                   </div>
                   
                   <div className="pt-2 border-t border-[#333] mt-1">
                     <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1"><span>Box Scale</span> <span>{boxScale}%</span></label>
                     <input type="range" min="30" max="200" value={boxScale} onChange={e=>setBoxScale(e.target.value)} className="w-full accent-orange-500"/>
                     <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2"><span>Box Width</span> <span>{boxWidth}%</span></label>
                     <input type="range" min="30" max="100" value={boxWidth} onChange={e=>setBoxWidth(e.target.value)} className="w-full accent-orange-500"/>
                     <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2"><span>Box Height</span> <span>{boxHeight === 0 ? 'Auto' : boxHeight + 'px'}</span></label>
                     <input type="range" min="0" max="500" value={boxHeight} onChange={e=>setBoxHeight(Number(e.target.value))} className="w-full accent-orange-500"/>
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'IMAGE' && (
              <div className="flex flex-col gap-4">
                 <button onClick={handleReplaceImage} className="w-full py-2 bg-[#1a1c23] border border-[#333] hover:border-orange-500 rounded text-[11px] font-bold text-gray-300 transition-colors">Replace Image</button>
                 <div>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1"><span>Scale</span> <span>{imageScale}%</span></label>
                   <input type="range" min="50" max="300" value={imageScale} onChange={e=>setImageScale(Number(e.target.value))} className="w-full accent-orange-500"/>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2"><span>Pos X</span> <span>{imagePosX}%</span></label>
                   <input type="range" min="0" max="100" value={imagePosX} onChange={e=>setImagePosX(Number(e.target.value))} className="w-full accent-orange-500"/>
                   <label className="text-[9px] text-gray-400 flex justify-between uppercase font-bold mb-1 mt-2"><span>Pos Y</span> <span>{imagePosY}%</span></label>
                   <input type="range" min="0" max="100" value={imagePosY} onChange={e=>setImagePosY(Number(e.target.value))} className="w-full accent-orange-500"/>
                 </div>
              </div>
            )}

            {activeTab === 'THEME' && (
              <div className="flex flex-col gap-3">
                 <div>
                   <label className="text-[9px] text-gray-400 uppercase font-bold">Card Theme</label>
                   <select value={cardTheme} onChange={e => setCardTheme(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
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
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Primary</label>
                     <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                   </div>
                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Background</label>
                     <input type="color" value={colorBackground} onChange={e => setColorBackground(e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                   </div>
                 </div>
                 <div>
                   <label className="text-[9px] text-gray-400 uppercase font-bold">Border Radius ({borderRadius}px)</label>
                   <input type="range" min="0" max="32" value={borderRadius} onChange={e=>setBorderRadius(e.target.value)} className="w-full accent-orange-500 mt-1"/>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 25% RIGHT: AI DRAFT & ACTIONS */}
      <div className="w-[25%] min-w-[280px] flex flex-col gap-3">
        <div className="bg-[#111216] border border-[#2a2c33] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-orange-500"/> AI Draft
            </h3>
            {isProcessing ? (
              <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase animate-pulse">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> {pipelineProgress || 'Processing...'}
              </div>
            ) : pipelineProgress === 'Draft Ready' ? (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
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
              <label className="text-[9px] text-gray-400 uppercase font-bold">Headline (Editable)</label>
              <textarea value={headline} onChange={e => setHeadline(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded p-2 text-[11px] text-gray-300 resize-none h-[60px] focus:border-orange-500 outline-none"/>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold">Summary (Editable)</label>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded p-2 text-[11px] text-gray-300 resize-none h-[80px] focus:border-orange-500 outline-none"/>
            </div>
            <div>
              <label className="text-[9px] text-gray-400 uppercase font-bold">Source</label>
              <input value={source} onChange={e => setSource(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] text-gray-300 focus:border-orange-500 outline-none"/>
            </div>
          </div>
        </div>

        <button onClick={handleAddToQueue} className={`bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]`}>
          <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
            <Plus size={18} className="text-white"/> Add to Queue
          </span>
          <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Send to Render Engine</span>
        </button>
      </div>

    </div>
  );
}
