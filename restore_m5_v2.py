import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_regex = r"(\s*// Global drag handler for image to bypass DOM bubbling issues\s*useEffect\(\(\) => \{\s*if \(\!isDraggingImage\) return;)\s*</div>\s*</>\s*\) : \("

replace_str = r"""\1

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
                 ) : ("""

new_content = re.sub(target_regex, replace_str, content)
if new_content != content:
    with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched successfully!")
else:
    print("Could not match regex.")
