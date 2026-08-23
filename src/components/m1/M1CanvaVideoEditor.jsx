import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function M1CanvaVideoEditor({
  selectedVideo,
  transform = { x: 0, y: 0, scale: 100, rotation: 0, flipH: false, flipV: false, aspectRatio: '16:9' },
  onTransformChange,
  m1VideoRotation = 0,
  handleRotateVideo,
  handleNativeDialog
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeHandle, setActiveHandle] = useState(null); // 'move' | 'rotate' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, origX: 0, origY: 0, origScale: 100, origRotation: 0 });

  // Merge default values with incoming transform
  const currentTransform = {
    x: transform?.x ?? 0,
    y: transform?.y ?? 0,
    scale: transform?.scale ?? 100,
    rotation: transform?.rotation ?? 0,
    flipH: transform?.flipH ?? false,
    flipV: transform?.flipV ?? false,
    aspectRatio: transform?.aspectRatio ?? '16:9'
  };

  const updateTransform = useCallback((updates) => {
    if (onTransformChange) {
      onTransformChange({ ...currentTransform, ...updates });
    }
  }, [currentTransform, onTransformChange]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Switch Aspect Ratio & automatically fit-zoom full
  const handleSetAspectRatio = (ratio) => {
    updateTransform({
      aspectRatio: ratio,
      x: 0,
      y: 0,
      scale: 100,
      rotation: 0
    });
  };

  // Reset to 100% Fit Full Cover
  const handleResetFit = () => {
    updateTransform({
      x: 0,
      y: 0,
      scale: 100,
      rotation: 0
    });
  };

  // Mouse Down Handlers
  const handleStartAction = (action, e) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(action);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      origX: currentTransform.x,
      origY: currentTransform.y,
      origScale: currentTransform.scale,
      origRotation: currentTransform.rotation
    });
  };

  // Global Mouse Move & Up
  useEffect(() => {
    if (!activeHandle) return;

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStart.mouseX;
      const dy = e.clientY - dragStart.mouseY;

      if (activeHandle === 'move') {
        updateTransform({
          x: Math.round(dragStart.origX + dx),
          y: Math.round(dragStart.origY + dy)
        });
      } else if (activeHandle === 'rotate') {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 + currentTransform.x;
        const centerY = rect.top + rect.height / 2 + currentTransform.y;
        
        let rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let deg = Math.round(rad * (180 / Math.PI) + 90);
        if (deg < 0) deg += 360;
        deg = deg % 360;

        // Snap points at 0, 90, 180, 270, 360 (within 4 deg)
        [0, 90, 180, 270, 360].forEach((snap) => {
          if (Math.abs(deg - snap) < 4) deg = snap % 360;
        });

        updateTransform({ rotation: deg });
      } else {
        // Handle Resize (Corner & Edge)
        const scaleFactor = (dx + dy) / 2;
        let nextScale = dragStart.origScale;

        if (['se', 'e', 's'].includes(activeHandle)) {
          nextScale = Math.max(10, Math.min(300, Math.round(dragStart.origScale + scaleFactor / 2)));
        } else if (['nw', 'w', 'n'].includes(activeHandle)) {
          nextScale = Math.max(10, Math.min(300, Math.round(dragStart.origScale - scaleFactor / 2)));
        } else if (['ne'].includes(activeHandle)) {
          nextScale = Math.max(10, Math.min(300, Math.round(dragStart.origScale + (dx - dy) / 4)));
        } else if (['sw'].includes(activeHandle)) {
          nextScale = Math.max(10, Math.min(300, Math.round(dragStart.origScale + (-dx + dy) / 4)));
        }

        updateTransform({ scale: nextScale });
      }
    };

    const handleMouseUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, dragStart, currentTransform, updateTransform]);

  // Canvas aspect ratio classes (viewport frame)
  const getCanvasAspectClass = () => {
    switch (currentTransform.aspectRatio) {
      case '9:16': return 'aspect-[9/16] h-[270px] max-h-[270px] w-auto';
      case '1:1': return 'aspect-square h-[270px] max-h-[270px] w-auto';
      case '4:5': return 'aspect-[4/5] h-[270px] max-h-[270px] w-auto';
      default: return 'aspect-video w-full max-h-[270px]';
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 animate-fade-in">
      
      {/* CANVAS STAGE (Viewport Box - Sesuai Rasio & Fit Presisi) */}
      <div 
        ref={containerRef}
        className={`relative bg-[#090a0d] rounded-xl border border-orange-500/40 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.9)] flex items-center justify-center select-none ${getCanvasAspectClass()} mx-auto transition-all duration-300`}
      >
        {/* Mecha Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.06] z-0"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Center Crosshair Guidelines */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-40">
          <div className="w-full h-px bg-orange-500/20" />
          <div className="h-full w-px bg-orange-500/20 absolute" />
          <div className="w-3 h-3 rounded-full border border-orange-500/40 absolute" />
        </div>

        {/* TRANSFORM CONTAINER (Fills 100% frame & contains Video + Bounding Box) */}
        <div
          className="w-full h-full absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 z-10"
          style={{
            transform: `translate(${currentTransform.x}px, ${currentTransform.y}px) rotate(${currentTransform.rotation}deg) scale(${
              (currentTransform.scale / 100) * (currentTransform.flipH ? -1 : 1)
            }, ${(currentTransform.scale / 100) * (currentTransform.flipV ? -1 : 1)})`,
            transformOrigin: 'center center'
          }}
          onMouseDown={(e) => handleStartAction('move', e)}
        >
          {/* Real Video Element - Always object-cover to fit full without black bars */}
          {selectedVideo?.previewUrl ? (
            <video
              ref={videoRef}
              src={selectedVideo.previewUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{ transform: `rotate(${m1VideoRotation}deg)` }}
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500 font-mono text-xs border border-gray-800">
              NO VIDEO SOURCE
            </div>
          )}

          {/* CANVA BOUNDING BOX OVERLAY */}
          <div className="absolute inset-0 border-2 border-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.5)] pointer-events-none rounded">
            
            {/* Top Rotation Stem & Handle */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
              <div 
                className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-[0_0_10px_rgba(249,115,22,1)] cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center"
                onMouseDown={(e) => handleStartAction('rotate', e)}
                title="Rotate 360°"
              >
                <svg className="w-3 h-3 text-black font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="w-0.5 h-3 bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
            </div>

            {/* Corner Resize Handles */}
            <div 
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-sm cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('nw', e)}
            />
            <div 
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-sm cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('ne', e)}
            />
            <div 
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-sm cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('sw', e)}
            />
            <div 
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-orange-500 rounded-sm cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('se', e)}
            />

            {/* Edge Midpoint Resize Handles */}
            <div 
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border-2 border-orange-500 rounded-sm cursor-ns-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('n', e)}
            />
            <div 
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-white border-2 border-orange-500 rounded-sm cursor-ns-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('s', e)}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-4 bg-white border-2 border-orange-500 rounded-sm cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('w', e)}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-4 bg-white border-2 border-orange-500 rounded-sm cursor-ew-resize pointer-events-auto hover:scale-125 transition-transform shadow-md"
              onMouseDown={(e) => handleStartAction('e', e)}
            />
          </div>
        </div>

        {/* Floating Angle & Scale Badge */}
        <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md border border-orange-500/40 px-2 py-1 rounded text-[10px] font-mono text-orange-400 font-bold shadow-lg pointer-events-none flex items-center gap-2 z-20">
          <span>🎯 X: {currentTransform.x}px</span>
          <span>Y: {currentTransform.y}px</span>
          <span>🔍 {currentTransform.scale}%</span>
          <span>🔄 {currentTransform.rotation}°</span>
        </div>

        {/* Floating Play / Pause Overlay Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-2 right-2 bg-black/85 hover:bg-orange-600 backdrop-blur-md border border-white/20 text-white p-1.5 rounded-lg transition-all shadow-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer z-20"
        >
          {isPlaying ? (
            <>
              <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <span>PLAY</span>
            </>
          )}
        </button>

        {/* Aspect Ratio Switcher, Auto-Fit, Rotate & Change Video Toolbar */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          {/* Aspect Ratio Switcher Pills */}
          <div className="flex bg-black/85 backdrop-blur-md p-0.5 rounded-lg border border-white/20 shadow-lg">
            {['16:9', '9:16', '1:1'].map((ratio) => {
              const isActive = currentTransform.aspectRatio === ratio;
              return (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => handleSetAspectRatio(ratio)}
                  className={`px-2 py-0.5 text-[10px] font-black rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Ganti rasio layar ${ratio} (Fit & Zoom Full)`}
                >
                  {ratio}
                </button>
              );
            })}
          </div>

          {/* Fit Full / Reset Zoom Button */}
          <button
            onClick={handleResetFit}
            type="button"
            className="bg-orange-600/90 hover:bg-orange-500 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-orange-400/60 transition-all shadow-lg flex items-center gap-1 cursor-pointer active:scale-95"
            title="Auto Fit & Zoom Full (Hilangkan Black Bars)"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>FIT FULL</span>
          </button>

          {/* Rotate 90 Button */}
          <button
            onClick={handleRotateVideo}
            type="button"
            className="bg-black/85 hover:bg-orange-600 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20 hover:border-orange-400 transition-all shadow-lg flex items-center gap-1 cursor-pointer"
            title="Rotate Video 90°"
          >
            <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{m1VideoRotation ? `${m1VideoRotation}°` : '90°'}</span>
          </button>
          
          {/* Replace Video Button */}
          {handleNativeDialog && (
            <button
              onClick={handleNativeDialog}
              type="button"
              className="bg-black/85 hover:bg-orange-600 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20 hover:border-orange-400 transition-all shadow-lg flex items-center gap-1 cursor-pointer"
            >
              GANTI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
