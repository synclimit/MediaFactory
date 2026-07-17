import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add States
old_states = """  const [zoom, setZoom] = useState(100);
  const [editorReady, setEditorReady] = useState(false);"""
new_states = """  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editorReady, setEditorReady] = useState(false);"""
if old_states in content:
    content = content.replace(old_states, new_states)

# 2. Add Handlers to Container
old_container = """        <div className="flex-1 bg-[#111] border border-[#2a2c33] rounded-xl flex items-center justify-center relative overflow-auto shadow-inner group/canvas"
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>"""

new_container = """        <div className={`flex-1 bg-[#111] border border-[#2a2c33] rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner group/canvas ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${pan.x}px ${pan.y}px` }}
             onMouseDown={(e) => {
               if (e.target.closest('.card-content') || e.target.closest('button')) return;
               setIsDragging(true);
               setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
             }}
             onMouseMove={(e) => {
               if (!isDragging) return;
               setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
             }}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}>"""
if old_container in content:
    content = content.replace(old_container, new_container)

# 3. Add Transform + card-content class
old_transform = """          {/* Transform Container for Zoom/Pan */}
          <div style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.1s ease-out' }}>
            
            {/* THE CARD ITSELF (9:16) */}
            <div className="w-[300px] h-[533px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 cursor-pointer group"
                 style={{ backgroundColor: colorBackground, borderRadius: `${borderRadius}px` }}>"""

new_transform = """          {/* Transform Container for Zoom/Pan */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
            
            {/* THE CARD ITSELF (9:16) */}
            <div className="w-[300px] h-[533px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 cursor-default group card-content"
                 style={{ backgroundColor: colorBackground, borderRadius: `${borderRadius}px` }}>"""
if old_transform in content:
    content = content.replace(old_transform, new_transform)

# 4. Revert Generate Button
old_btn = """        {!editorReady ? (
          <button onClick={() => setEditorReady(true)} disabled={pipelineProgress !== 'Draft Ready'} className={`bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] ${pipelineProgress !== 'Draft Ready' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
            <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={18} className="text-white"/> Generate Draft
            </span>
            <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Lock changes and prepare</span>
          </button>
        ) : (
          <button onClick={() => {
            import('../../state/m5EditorStore.js').then(m => {
               m.useM5EditorStore.getState().setEditorMode(true);
            });
          }} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
              <Layout size={18} className="text-white"/> Open Editor
            </span>
            <span className="text-[9px] text-blue-200 mt-1 uppercase tracking-widest">Launch Full Workspace</span>
          </button>
        )}"""

new_btn = """        <button disabled={pipelineProgress !== 'Draft Ready'} className={`bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] ${pipelineProgress !== 'Draft Ready' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
          <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
            <Play size={18} className="fill-white"/> Generate to Queue
          </span>
          <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Output to Render Engine</span>
        </button>"""
if old_btn in content:
    content = content.replace(old_btn, new_btn)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas Patched Successfully!")
