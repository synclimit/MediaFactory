import React, { useState } from 'react';
import { 
  ArrowLeft, Save, Download, Undo, Redo, ZoomIn, ZoomOut, Maximize,
  Layers, Lock, Eye, EyeOff, Copy, Trash2, 
  Type, Image as ImageIcon, Settings2, Sliders, Palette, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { useM5EditorStore } from '../../state/m5EditorStore.js';

export default function EditorUI() {
  const { 
    closeEditor, layers, selectedLayerId, setSelectedLayerId, updateLayer,
    headline, summary, category, date, sourceText,
    headlineFont, headlineSize, headlineColor,
    summaryFont, summarySize, summaryColor,
    colorPrimary, colorBackground, borderRadius,
    updateProperty, autoSaveStatus
  } = useM5EditorStore();

  const [zoom, setZoom] = useState(100);
  const [inspectorTab, setInspectorTab] = useState('json');

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col font-sans text-gray-300">
      
      {/* ─── TOOLBAR (TOP) ─── */}
      <div className="h-[50px] shrink-0 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={closeEditor} className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} /> <span className="text-[11px] font-bold tracking-widest uppercase">Back to Create</span>
          </button>
          <div className="w-px h-5 bg-white/10"></div>
          <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-white/5"><Save size={16} /></button>
          <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-white/5"><Undo size={16} /></button>
          <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-white/5"><Redo size={16} /></button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/50 rounded-lg px-2 border border-white/5">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="p-1.5 text-gray-400 hover:text-white"><ZoomOut size={14}/></button>
            <span className="text-[11px] font-mono w-[40px] text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 text-gray-400 hover:text-white"><ZoomIn size={14}/></button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => setZoom(100)} className="p-1.5 text-gray-400 hover:text-white"><Maximize size={14}/></button>
          </div>
          
          <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            <Download size={14} /> EXPORT
          </button>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT: LAYER PANEL */}
        <div className="w-[260px] shrink-0 border-r border-white/10 bg-[#0d0d0d] flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <Layers size={14} className="text-orange-500"/>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Layers</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {layers.map(layer => (
              <div 
                key={layer.id} 
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors ${
                  selectedLayerId === layer.id ? 'bg-orange-500/20 border border-orange-500/50 text-white' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                {layer.type === 'text' && <Type size={12} className="text-gray-500" />}
                {layer.type === 'image' || layer.type === 'background' && <ImageIcon size={12} className="text-gray-500" />}
                {layer.type === 'badge' && <ShieldAlert size={12} className="text-gray-500" />}
                
                <span className="text-[11px] flex-1 truncate select-none">{layer.name}</span>
                
                <div className="flex items-center gap-1 opacity-50 hover:opacity-100">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { hidden: !layer.hidden }); }}
                    className="p-1 hover:text-white"
                  >
                    {layer.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
                    className={`p-1 ${layer.locked ? 'text-red-400' : 'hover:text-white'}`}
                  >
                    <Lock size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: PREVIEW CANVAS */}
        <div className="flex-1 bg-[#111] overflow-auto flex items-center justify-center relative shadow-inner"
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          
          {/* Transform Container for Zoom */}
          <div style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.1s ease-out' }}>
            
            {/* The 390x844 Canvas */}
            <div className="w-[390px] h-[844px] bg-[#0f172a] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                 style={{ backgroundColor: colorBackground, borderRadius: `${borderRadius}px` }}>
              
              {/* Background Layer */}
              {!layers.find(l => l.id === 'bg')?.hidden && (
                <div className="absolute inset-0 z-0 h-[55%] bg-[#1a1c23] flex items-center justify-center">
                  <ImageIcon size={60} className="text-gray-700"/>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(15,23,42,1)]"
                       style={{ backgroundImage: `linear-gradient(to bottom, transparent 60%, ${colorBackground} 100%)` }}></div>
                </div>
              )}

              {/* Text Layer Group */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 pb-12 pointer-events-none">
                 
                 {!layers.find(l => l.id === 'category')?.hidden && (
                   <div className={`text-white text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm w-max mb-5 shadow-md pointer-events-auto cursor-pointer ${selectedLayerId === 'category' ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black/50' : ''}`}
                        style={{ backgroundColor: colorPrimary }}
                        onClick={() => setSelectedLayerId('category')}>
                     {category}
                   </div>
                 )}

                 {!layers.find(l => l.id === 'headline')?.hidden && (
                   <h2 className={`font-bold leading-[1.25] mb-4 drop-shadow-lg pointer-events-auto cursor-pointer ${selectedLayerId === 'headline' ? 'ring-2 ring-orange-500 rounded ring-offset-2 ring-offset-black/50 p-1 -m-1' : ''}`}
                       style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor }}
                       onClick={() => setSelectedLayerId('headline')}>
                     {headline}
                   </h2>
                 )}

                 {!layers.find(l => l.id === 'summary')?.hidden && (
                   <p className={`leading-relaxed mb-6 drop-shadow-md pointer-events-auto cursor-pointer ${selectedLayerId === 'summary' ? 'ring-2 ring-orange-500 rounded ring-offset-2 ring-offset-black/50 p-1 -m-1' : ''}`}
                      style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor }}
                      onClick={() => setSelectedLayerId('summary')}>
                     {summary}
                   </p>
                 )}

                 {!layers.find(l => l.id === 'source')?.hidden && (
                   <div className={`flex items-center gap-3 text-[11px] text-gray-400 font-mono border-t border-white/10 pt-4 pointer-events-auto cursor-pointer ${selectedLayerId === 'source' ? 'ring-2 ring-orange-500 rounded ring-offset-2 ring-offset-black/50 p-1 -m-1' : ''}`}
                        onClick={() => setSelectedLayerId('source')}>
                      <span>Sumber: {sourceText}</span>
                      <span>|</span>
                      <span>{date}</span>
                   </div>
                 )}
              </div>

              {/* Safe Area Guides */}
              <div className="absolute inset-0 z-50 pointer-events-none border border-red-500/30 m-[20px] rounded-[24px]"></div>

            </div>
          </div>
        </div>

        {/* RIGHT: PROPERTY & INSPECTOR */}
        <div className="w-[300px] shrink-0 border-l border-white/10 bg-[#0d0d0d] flex flex-col">
          
          {/* PROPERTY PANEL */}
          <div className="h-1/2 flex flex-col border-b border-white/10">
            <div className="p-3 border-b border-white/10 flex items-center gap-2">
              <Sliders size={14} className="text-orange-500"/>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">Properties</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {!selectedLayerId && (
                <div className="text-center text-gray-500 text-[10px] mt-10">Select a layer to edit properties</div>
              )}

              {selectedLayerId === 'headline' && (
                <>
                  <div>
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Text Content</label>
                    <textarea 
                      value={headline} 
                      onChange={e => updateProperty('headline', e.target.value)} 
                      className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none resize-none h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-400 uppercase font-bold">Font</label>
                      <select value={headlineFont} onChange={e => updateProperty('headlineFont', e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                        <option>Inter</option><option>Roboto</option><option>Montserrat</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 uppercase font-bold">Size (px)</label>
                      <input type="number" value={headlineSize} onChange={e => updateProperty('headlineSize', Number(e.target.value))} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                    <input type="color" value={headlineColor} onChange={e => updateProperty('headlineColor', e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                  </div>
                </>
              )}

              {selectedLayerId === 'summary' && (
                <>
                  <div>
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Text Content</label>
                    <textarea 
                      value={summary} 
                      onChange={e => updateProperty('summary', e.target.value)} 
                      className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none resize-none h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-400 uppercase font-bold">Font</label>
                      <select value={summaryFont} onChange={e => updateProperty('summaryFont', e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                        <option>Inter</option><option>Roboto</option><option>Lato</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 uppercase font-bold">Size (px)</label>
                      <input type="number" value={summarySize} onChange={e => updateProperty('summarySize', Number(e.target.value))} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                    <input type="color" value={summaryColor} onChange={e => updateProperty('summaryColor', e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                  </div>
                </>
              )}

              {selectedLayerId === 'category' && (
                <>
                  <div>
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Category Text</label>
                    <input type="text" value={category} onChange={e => updateProperty('category', e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none"/>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 uppercase font-bold">Badge Color</label>
                    <input type="color" value={colorPrimary} onChange={e => updateProperty('colorPrimary', e.target.value)} className="w-full h-[28px] mt-1 bg-[#1a1c23] border border-[#333] rounded p-0 cursor-pointer"/>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* INSPECTOR PANEL */}
          <div className="h-1/2 flex flex-col bg-[#080808]">
            <div className="flex border-b border-white/10 shrink-0">
              <button onClick={() => setInspectorTab('json')} className={`flex-1 p-2 text-[9px] font-bold uppercase tracking-widest ${inspectorTab==='json' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-white'}`}>Card JSON</button>
              <button onClick={() => setInspectorTab('ai')} className={`flex-1 p-2 text-[9px] font-bold uppercase tracking-widest ${inspectorTab==='ai' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-white'}`}>AI Draft</button>
            </div>
            
            <div className="flex-1 overflow-auto p-3 m5-scroll">
              {inspectorTab === 'json' && (
                <pre className="text-[9px] font-mono text-gray-400 leading-relaxed">
{JSON.stringify({
  theme: "Modern",
  dimensions: "1080x1920",
  fps: 30,
  layers: layers,
  data: { headline, summary, category, date, sourceText }
}, null, 2)}
                </pre>
              )}
              {inspectorTab === 'ai' && (
                <div className="text-[10px] text-gray-400 space-y-2">
                  <p><strong className="text-gray-300">Prompt:</strong> v4.2-news-vertical</p>
                  <p><strong className="text-gray-300">Tokens:</strong> 428</p>
                  <p><strong className="text-gray-300">Reasoning:</strong> Selected aggressive crop for portrait safety. Maintained active voice in headline.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── STATUS BAR (BOTTOM) ─── */}
      <div className="h-[24px] shrink-0 border-t border-white/10 bg-[#050505] flex items-center justify-between px-3">
        <div className="flex items-center gap-4 text-[9px] font-mono text-gray-500">
          <span>{zoom}%</span>
          <span>390 x 844</span>
          <span>30 FPS</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10}/> Draft Saved</span>
        </div>
      </div>

    </div>
  );
}
