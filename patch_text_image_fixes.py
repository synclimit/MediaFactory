import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Imports
old_imports = """import { 
  FileText, Trash2, CheckCircle2, ChevronRight, Zap, Play, Edit2, Clock, Globe, Video, Music, Bell, Plus, Image as ImageIcon, Type, Layout, Sliders, Palette, Settings2, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';"""
new_imports = """import { 
  FileText, Trash2, CheckCircle2, ChevronRight, Zap, Play, Edit2, Clock, Globe, Video, Music, Bell, Plus, Image as ImageIcon, Type, Layout, Sliders, Palette, Settings2, ZoomIn, ZoomOut, Maximize,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic
} from 'lucide-react';"""
content = content.replace(old_imports, new_imports)

# 2. Add New States
old_states = """  const [headlineAnim, setHeadlineAnim] = useState('Fade In Up');
  
  const [summary, setSummary] = useState('Kunjungan ini menandai langkah baru dalam hubungan bilateral kedua negara yang semakin erat dalam beberapa tahun terakhir.');"""
new_states = """  const [headlineAnim, setHeadlineAnim] = useState('Fade In Up');
  const [headlineAlign, setHeadlineAlign] = useState('left');
  const [headlineWeight, setHeadlineWeight] = useState('bold');
  const [headlineItalic, setHeadlineItalic] = useState(false);
  
  const [summary, setSummary] = useState('Kunjungan ini menandai langkah baru dalam hubungan bilateral kedua negara yang semakin erat dalam beberapa tahun terakhir.');"""
content = content.replace(old_states, new_states)

old_states2 = """  const [summaryAnim, setSummaryAnim] = useState('Fade In Up');
  
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0 });"""
new_states2 = """  const [summaryAnim, setSummaryAnim] = useState('Fade In Up');
  const [summaryAlign, setSummaryAlign] = useState('left');
  const [summaryWeight, setSummaryWeight] = useState('normal');
  const [summaryItalic, setSummaryItalic] = useState(false);
  
  const [boxPos, setBoxPos] = useState({ x: 0, y: 0 });"""
content = content.replace(old_states2, new_states2)

# 3. Update Canvas Rendering for Image & Text
old_image = """                       <img src={image} className="w-full h-auto max-h-full object-contain relative z-10" />"""
new_image = """                       <img src={image} className="w-full h-full object-contain relative z-10" 
                            style={{ 
                                objectPosition: `${imagePosX}% ${imagePosY}%`, 
                                transform: `scale(${imageScale / 100})` 
                            }} 
                       />"""
content = content.replace(old_image, new_image)

old_text = """                   <h2 key={`head-${headlineAnim}`} className={`font-bold leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(headlineAnim)}`}
                       style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor }}
                       contentEditable suppressContentEditableWarning
                       onBlur={e => setHeadline(e.currentTarget.textContent)}>{headline}</h2>
                   
                   <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-1 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(summaryAnim)}`}
                      style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor }}
                      contentEditable suppressContentEditableWarning
                      onBlur={e => setSummary(e.currentTarget.textContent)}>{summary}</p>"""
new_text = """                   <h2 key={`head-${headlineAnim}`} className={`leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(headlineAnim)}`}
                       style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor, textAlign: headlineAlign, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal' }}
                       contentEditable suppressContentEditableWarning
                       onBlur={e => setHeadline(e.currentTarget.textContent)}>{headline}</h2>
                   
                   <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-1 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(summaryAnim)}`}
                      style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor, textAlign: summaryAlign, fontWeight: summaryWeight, fontStyle: summaryItalic ? 'italic' : 'normal' }}
                      contentEditable suppressContentEditableWarning
                      onBlur={e => setSummary(e.currentTarget.textContent)}>{summary}</p>"""
content = content.replace(old_text, new_text)

# 4. Update TEXT Tab UI
old_text_ui_head = """                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Headline Font</label>
                     <select value={headlineFont} onChange={e => setHeadlineFont(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                     </select>
                   </div>"""
new_text_ui_head = """                   <div>
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
                   </div>"""
content = content.replace(old_text_ui_head, new_text_ui_head)

old_text_ui_sum = """                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Summary Font</label>
                     <select value={summaryFont} onChange={e => setSummaryFont(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option>Inter</option><option>Roboto</option><option>Lato</option>
                     </select>
                   </div>"""
new_text_ui_sum = """                   <div>
                     <label className="text-[9px] text-gray-400 uppercase font-bold">Summary Font</label>
                     <select value={summaryFont} onChange={e => setSummaryFont(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                       <option>Inter</option><option>Roboto</option><option>Montserrat</option><option>Merriweather</option>
                       <option>Poppins</option><option>Playfair Display</option><option>Oswald</option><option>Lato</option><option>Open Sans</option>
                     </select>
                     
                     <div className="flex gap-1 mt-2">
                       <button onClick={() => setSummaryAlign('left')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'left' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignLeft size={12}/></button>
                       <button onClick={() => setSummaryAlign('center')} className={`flex-1 flex justify-center p-1.5 rounded ${summary:Align === 'center' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignCenter size={12}/></button>
                       <button onClick={() => setSummaryAlign('right')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryAlign === 'right' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><AlignRight size={12}/></button>
                       <div className="w-px bg-[#333] mx-1 my-1"></div>
                       <button onClick={() => setSummaryWeight(w => w === 'bold' ? 'normal' : 'bold')} className={`flex-1 flex justify-center p-1.5 rounded ${summaryWeight === 'bold' ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><Bold size={12}/></button>
                       <button onClick={() => setSummaryItalic(i => !i)} className={`flex-1 flex justify-center p-1.5 rounded ${summaryItalic ? 'bg-white/20' : 'bg-[#1a1c23] hover:bg-[#333]'}`}><Italic size={12}/></button>
                     </div>
                   </div>"""
new_text_ui_sum = new_text_ui_sum.replace("summary:Align", "summaryAlign") # fix typo in code string
content = content.replace(old_text_ui_sum, new_text_ui_sum)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Text options and Image zoom patched successfully!")
