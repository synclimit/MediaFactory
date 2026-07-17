import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Animation States
old_states = """  const [headlineColor, setHeadlineColor] = useState('#ffffff');"""
new_states = """  const [headlineColor, setHeadlineColor] = useState('#ffffff');
  const [headlineAnim, setHeadlineAnim] = useState('Fade In Up');"""
content = content.replace(old_states, new_states)

old_states2 = """  const [summaryColor, setSummaryColor] = useState('#d1d5db');"""
new_states2 = """  const [summaryColor, setSummaryColor] = useState('#d1d5db');
  const [summaryAnim, setSummaryAnim] = useState('Fade In Up');"""
content = content.replace(old_states2, new_states2)

# 2. Add Style Block & Helper
old_render = """export default function M5NewsCreator({ m5Queue = [] }) {"""
new_render = """
const getAnimClass = (animName) => {
    if (animName === "None") return "";
    return `anim-${animName.replace(/ /g, "")}`;
};

export default function M5NewsCreator({ m5Queue = [] }) {"""
content = content.replace(old_render, new_render)

old_return = """  return (
    <div className="flex gap-4 h-full font-sans text-white min-h-0 pb-2">"""
new_return = """  return (
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
      `}</style>"""
content = content.replace(old_return, new_return)

# 3. Apply to Headline & Summary
old_headline = """               <h2 className="font-bold leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text"
                   style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor }}"""
new_headline = """               <h2 key={`head-${headlineAnim}`} className={`font-bold leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(headlineAnim)}`}
                   style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor }}"""
content = content.replace(old_headline, new_headline)

old_summary = """               <p className="leading-relaxed mb-4 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text"
                  style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor }}"""
new_summary = """               <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-4 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(summaryAnim)}`}
                  style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor }}"""
content = content.replace(old_summary, new_summary)

# 4. Add UI Controls for Animation
old_ui_head = """                       <div className="flex-1">
                         <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                         <input type="color" value={headlineColor} onChange={e => setHeadlineColor(e.target.value)} className="w-full mt-1 h-[26px] bg-[#1a1c23] border border-[#333] rounded px-1 py-0 focus:border-orange-500 outline-none"/>
                       </div>
                     </div>
                   </div>
                   <div className="h-px bg-white/10 my-2"></div>
                   <div className="flex flex-col gap-2">"""
new_ui_head = """                       <div className="flex-1">
                         <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                         <input type="color" value={headlineColor} onChange={e => setHeadlineColor(e.target.value)} className="w-full mt-1 h-[26px] bg-[#1a1c23] border border-[#333] rounded px-1 py-0 focus:border-orange-500 outline-none"/>
                       </div>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold">Animation</label>
                       <select value={headlineAnim} onChange={e => setHeadlineAnim(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                         <option value="None">None</option><option value="Fade In">Fade In</option>
                         <option value="Fade In Up">Fade In Up</option><option value="Fade In Down">Fade In Down</option>
                         <option value="Fade In Left">Fade In Left</option><option value="Fade In Right">Fade In Right</option>
                       </select>
                     </div>
                   </div>
                   <div className="h-px bg-white/10 my-2"></div>
                   <div className="flex flex-col gap-2">"""
content = content.replace(old_ui_head, new_ui_head)

old_ui_sum = """                       <div className="flex-1">
                         <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                         <input type="color" value={summaryColor} onChange={e => setSummaryColor(e.target.value)} className="w-full mt-1 h-[26px] bg-[#1a1c23] border border-[#333] rounded px-1 py-0 focus:border-orange-500 outline-none"/>
                       </div>
                     </div>
                   </div>
              </div>
            )}"""
new_ui_sum = """                       <div className="flex-1">
                         <label className="text-[9px] text-gray-400 uppercase font-bold">Color</label>
                         <input type="color" value={summaryColor} onChange={e => setSummaryColor(e.target.value)} className="w-full mt-1 h-[26px] bg-[#1a1c23] border border-[#333] rounded px-1 py-0 focus:border-orange-500 outline-none"/>
                       </div>
                     </div>
                     <div>
                       <label className="text-[9px] text-gray-400 uppercase font-bold">Animation</label>
                       <select value={summaryAnim} onChange={e => setSummaryAnim(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                         <option value="None">None</option><option value="Fade In">Fade In</option>
                         <option value="Fade In Up">Fade In Up</option><option value="Fade In Down">Fade In Down</option>
                         <option value="Fade In Left">Fade In Left</option><option value="Fade In Right">Fade In Right</option>
                       </select>
                     </div>
                   </div>
              </div>
            )}"""
content = content.replace(old_ui_sum, new_ui_sum)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Animation Patched Successfully!")
