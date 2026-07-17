import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add States
old_states = """  const [summaryAnim, setSummaryAnim] = useState('Fade In Up');"""
new_states = """  const [summaryAnim, setSummaryAnim] = useState('Fade In Up');
  
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0 });
  const [boxScale, setBoxScale] = useState(100);
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [boxDragStart, setBoxDragStart] = useState({ x: 0, y: 0 });"""
content = content.replace(old_states, new_states)

# 2. Update Canvas Mouse Events
old_canvas_events = """             onMouseMove={(e) => {
               if (!isDragging) return;
               setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
             }}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}>"""
new_canvas_events = """             onMouseMove={(e) => {
               if (isDraggingBox) {
                 setBoxPos({ x: (e.clientX - boxDragStart.x) * (100/zoom), y: (e.clientY - boxDragStart.y) * (100/zoom) });
                 return;
               }
               if (!isDragging) return;
               setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
             }}
             onMouseUp={() => { setIsDragging(false); setIsDraggingBox(false); }}
             onMouseLeave={() => { setIsDragging(false); setIsDraggingBox(false); }}>"""
content = content.replace(old_canvas_events, new_canvas_events)

# 3. Update Box Wrapper Logic & Styles
old_box_wrapper = """               {/* Dynamic Theme Box Wrapper */}
               <div 
                  className={`relative flex flex-col justify-end ${
                      cardTheme === 'Glass Box' ? 'mx-4 mb-6 p-5 backdrop-blur-xl bg-black/40 border border-white/20 shadow-2xl' : 
                      cardTheme === 'Solid Box' ? 'mx-4 mb-6 p-5 shadow-2xl' :
                      cardTheme === 'Slanted Bottom' ? 'w-full p-6 pt-12' :
                      cardTheme === 'Accent Left' ? 'mx-4 mb-6 p-5 pl-6 shadow-2xl' :
                      cardTheme === 'Gradient Overlay' ? 'w-full p-5 pt-20' : 'p-5'
                  }`}
                  style={{
                      backgroundColor: (cardTheme === 'Solid Box' || cardTheme === 'Slanted Bottom' || cardTheme === 'Accent Left') ? colorBackground : 'transparent',
                      backgroundImage: cardTheme === 'Gradient Overlay' ? `linear-gradient(to top, ${colorBackground} 10%, transparent 100%)` : 'none',
                      borderRadius: (cardTheme === 'Glass Box' || cardTheme === 'Solid Box' || cardTheme === 'Accent Left') ? `${borderRadius}px` : '0px',
                      clipPath: cardTheme === 'Slanted Bottom' ? 'polygon(0 15%, 100% 0, 100% 100%, 0 100%)' : 'none',
                      borderLeft: cardTheme === 'Accent Left' ? `6px solid ${colorPrimary}` : 'none'
                  }}
               >"""
new_box_wrapper = """               {/* Dynamic Theme Box Wrapper */}
               <div 
                  className={`relative flex flex-col justify-end cursor-move ${
                      cardTheme === 'Glass Box' ? 'mx-4 mb-6 p-5 backdrop-blur-xl bg-black/40 border border-white/20 shadow-2xl' : 
                      cardTheme === 'Solid Box' ? 'mx-4 mb-6 p-5 shadow-2xl' :
                      cardTheme === 'Slanted Bottom' ? 'w-full p-6 pt-12' :
                      cardTheme === 'Accent Left' ? 'mx-4 mb-6 p-5 pl-6 shadow-2xl' :
                      cardTheme === 'Gradient Overlay' ? 'w-full p-5 pt-20' :
                      cardTheme === 'Pill Shape' ? 'mx-4 mb-6 p-6 shadow-2xl' :
                      cardTheme === 'Neon Glow' ? 'mx-4 mb-6 p-5 bg-black/60 shadow-[0_0_20px_var(--tw-shadow-color)] border' :
                      cardTheme === 'Minimal Quote' ? 'mx-6 mb-8 pl-4' : 'p-5'
                  }`}
                  onMouseDown={(e) => {
                      if (e.target.tagName === 'H2' || e.target.tagName === 'P') return;
                      setIsDraggingBox(true);
                      setBoxDragStart({ x: e.clientX - (boxPos.x / (100/zoom)), y: e.clientY - (boxPos.y / (100/zoom)) });
                      e.stopPropagation();
                  }}
                  style={{
                      transform: `translate(${boxPos.x}px, ${boxPos.y}px) scale(${boxScale / 100})`,
                      transformOrigin: 'bottom center',
                      backgroundColor: (cardTheme === 'Solid Box' || cardTheme === 'Slanted Bottom' || cardTheme === 'Accent Left' || cardTheme === 'Pill Shape') ? colorBackground : 'transparent',
                      backgroundImage: cardTheme === 'Gradient Overlay' ? `linear-gradient(to top, ${colorBackground} 10%, transparent 100%)` : 'none',
                      borderRadius: (cardTheme === 'Glass Box' || cardTheme === 'Solid Box' || cardTheme === 'Accent Left' || cardTheme === 'Neon Glow') ? `${borderRadius}px` : (cardTheme === 'Pill Shape' ? '9999px' : '0px'),
                      clipPath: cardTheme === 'Slanted Bottom' ? 'polygon(0 15%, 100% 0, 100% 100%, 0 100%)' : 'none',
                      borderLeft: cardTheme === 'Accent Left' || cardTheme === 'Minimal Quote' ? `6px solid ${colorPrimary}` : 'none',
                      '--tw-shadow-color': cardTheme === 'Neon Glow' ? colorPrimary : 'rgba(0,0,0,0)',
                      borderColor: cardTheme === 'Neon Glow' ? colorPrimary : 'transparent'
                  }}
               >"""
content = content.replace(old_box_wrapper, new_box_wrapper)

# 4. Add Box Scale slider & Update Dropdown Options
old_controls = """                   <div>
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
                 </div>
              </div>
            )}"""
new_controls = """                   <div>
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
                   </div>
                 </div>
              </div>
            )}"""
content = content.replace(old_controls, new_controls)

old_theme_dropdown = """                     <option value="Glass Box">Glass Box</option>
                     <option value="Solid Box">Solid Box</option>
                     <option value="Slanted Bottom">Slanted Bottom</option>
                     <option value="Accent Left">Accent Left</option>
                     <option value="Gradient Overlay">Gradient Overlay</option>"""
new_theme_dropdown = """                     <option value="Glass Box">Glass Box</option>
                     <option value="Solid Box">Solid Box</option>
                     <option value="Slanted Bottom">Slanted Bottom</option>
                     <option value="Accent Left">Accent Left</option>
                     <option value="Gradient Overlay">Gradient Overlay</option>
                     <option value="Pill Shape">Pill Shape</option>
                     <option value="Neon Glow">Neon Glow</option>
                     <option value="Minimal Quote">Minimal Quote</option>"""
content = content.replace(old_theme_dropdown, new_theme_dropdown)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Drag and Scale patched successfully!")
