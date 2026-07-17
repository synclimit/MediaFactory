import React, { useState } from 'react';

export default function M4PreviewCanvas({ m4BgVideo, m4Objects = [], setM4Objects, m4SelectedObjectId, setM4SelectedObjectId, canvasMode = 'composer' }) {
  const [dragState, setDragState] = useState({ isDragging: false, id: null, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [loopPreviewing, setLoopPreviewing] = useState(false);

  const handlePointerDown = (e, id) => {
    e.stopPropagation();
    setM4SelectedObjectId(id);
    const obj = m4Objects.find(o => o.id === id);
    if (obj && !obj.locked) {
      setDragState({ isDragging: true, id, startX: e.clientX, startY: e.clientY, origX: obj.x, origY: obj.y });
    }
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging || !dragState.id) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    setM4Objects(prev => prev.map(o => o.id === dragState.id ? { ...o, x: dragState.origX + dx, y: dragState.origY + dy } : o));
  };

  const handlePointerUp = () => {
    if (dragState.isDragging) setDragState({ isDragging: false, id: null, startX: 0, startY: 0, origX: 0, origY: 0 });
  };

  // Safe area lines
  const renderSafeAreas = () => (
    <>
      <div className="absolute inset-0 border border-red-500/30 pointer-events-none" style={{ margin: '5%' }}></div>
      <div className="absolute inset-0 border border-yellow-500/30 pointer-events-none" style={{ margin: '10%' }}></div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0 min-h-0 relative">
      
      {/* Preview Controls Header */}
      {canvasMode === 'composer' && (
        <div className="h-10 bg-[#12131a] border-b border-[#21232d] flex items-center px-4 justify-between shrink-0">
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 rounded text-[10px] uppercase font-bold border border-[#2d3247]">Play</button>
            <button className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 rounded text-[10px] uppercase font-bold border border-[#2d3247]">Pause</button>
            <button className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 rounded text-[10px] uppercase font-bold border border-[#2d3247]">Stop</button>
            <button className="px-3 py-1 bg-[#1e2230] hover:bg-[#2a2e3d] text-gray-300 rounded text-[10px] uppercase font-bold border border-[#2d3247]">Restart</button>
            <div className="w-px h-4 bg-[#2d3247] mx-2 self-center"></div>
            <button 
              onClick={() => setLoopPreviewing(!loopPreviewing)}
              className={`px-3 py-1 rounded text-[10px] uppercase font-bold border transition-colors ${loopPreviewing ? 'bg-amber-600 border-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'}`}
            >
              {loopPreviewing ? 'Stop Loop Preview' : 'Loop Preview'}
            </button>
          </div>
          <div className="flex gap-2 items-center text-[10px] text-gray-400">
            <span>Mode:</span>
            <select className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 text-gray-300">
              <option>Fit</option>
              <option>Fill</option>
              <option>100%</option>
              <option>200%</option>
            </select>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div 
        className="flex-1 relative overflow-hidden" 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        onPointerDown={() => setM4SelectedObjectId(null)}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div 
            className="relative bg-black shadow-2xl border border-[#21232d] pointer-events-auto"
            style={{ width: '100%', maxWidth: '800px', aspectRatio: '16/9' }}
          >
            {/* Background Render */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 overflow-hidden"
              style={{
                filter: `brightness(${m4BgVideo?.brightness || 100}%) contrast(${m4BgVideo?.contrast || 100}%) saturate(${m4BgVideo?.saturation || 100}%) blur(${m4BgVideo?.blur || 0}px)`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-30 text-2xl font-bold font-mono text-center flex-col gap-2">
                <div>{m4BgVideo?.filename}</div>
                <div className="text-sm text-gray-400">Loop Mode: {m4BgVideo?.loopMode}</div>
                {loopPreviewing && (
                  <div className="text-amber-400 text-xs mt-4 animate-pulse">
                    Simulating transition (-2s to +2s)
                  </div>
                )}
              </div>
            </div>

            {/* Objects Render */}
            {m4Objects.filter(o => o.canvasMode === canvasMode && o.type !== 'background').map(el => (
              <div 
                key={el.id}
                onPointerDown={(e) => handlePointerDown(e, el.id)}
                className={`absolute cursor-move select-none ${m4SelectedObjectId === el.id ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  left: el.x ? el.x + 'px' : 0,
                  top: el.y ? el.y + 'px' : 0,
                  width: el.width ? el.width + 'px' : 'auto',
                  height: el.height ? el.height + 'px' : 'auto',
                  opacity: (el.opacity || 100) / 100,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  backgroundColor: el.type === 'effect' ? 'rgba(0,0,0,0.5)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: el.type === 'image' || el.type === 'effect' ? '1px dashed rgba(255,255,255,0.2)' : 'none',
                  color: 'white'
                }}
              >
                {el.type === 'text' && (
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{el.name}</span>
                )}
                {el.type === 'effect' && (
                  <span className="text-sm opacity-50 text-emerald-400">✨ {el.name} Effect</span>
                )}
                {el.type === 'image' && (
                  <span className="text-sm opacity-50">{el.name}</span>
                )}
              </div>
            ))}
            
            {renderSafeAreas()}
          </div>
        </div>
      </div>
    </div>
  );
}
