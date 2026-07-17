import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update summary extraction
old_summary = "if (data.body) setSummary(data.body.substring(0, 150) + '...');"
new_summary = """if (data.body) {
             const sentences = data.body.match(/[^.!?]+[.!?]+/g) || [data.body];
             setSummary(sentences.slice(0, 2).join(' ').trim());
         }"""
content = content.replace(old_summary, new_summary)

# 2. Add folder states & handleBrowseFolder
old_states = """  const [globalDuration, setGlobalDuration] = useState("30s");
  const [globalLang, setGlobalLang] = useState("Indonesia");
  const [globalRes, setGlobalRes] = useState("1080p");
  const [globalFPS, setGlobalFPS] = useState("30");"""

new_states = """  const [globalDuration, setGlobalDuration] = useState("30s");
  const [globalLang, setGlobalLang] = useState("Indonesia");
  const [globalRes, setGlobalRes] = useState("1080x1920 (9:16)");
  const [globalFPS, setGlobalFPS] = useState("30 FPS");
  
  const [bgFolder, setBgFolder] = useState("");
  const [audioFolder, setAudioFolder] = useState("");
  const [overlayFolder, setOverlayFolder] = useState("");

  const handleBrowseFolder = async (setter) => {
      try {
          const res = await fetch('/api/v1/m5/dialog/folder', { method: 'POST' });
          const data = await res.json();
          if (data.path) setter(data.path);
      } catch(e) {}
  };"""
content = content.replace(old_states, new_states)

# 3. Update <select> tags
old_duration = """<select className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option>30s</option>
                <option>60s</option>
              </select>"""
new_duration = """<select value={globalDuration} onChange={e => setGlobalDuration(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="30s">30s</option>
                <option value="60s">60s</option>
              </select>"""
content = content.replace(old_duration, new_duration)

old_lang = """<select className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option>Indonesia</option>
                <option>English</option>
              </select>"""
new_lang = """<select value={globalLang} onChange={e => setGlobalLang(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="Indonesia">Indonesia</option>
                <option value="English">English</option>
              </select>"""
content = content.replace(old_lang, new_lang)

old_res = """<select className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option>1080x1920 (9:16)</option>
              </select>"""
new_res = """<select value={globalRes} onChange={e => setGlobalRes(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="1080x1920 (9:16)">1080x1920 (9:16)</option>
              </select>"""
content = content.replace(old_res, new_res)

old_fps = """<select className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option>30 FPS</option>
                <option>60 FPS</option>
              </select>"""
new_fps = """<select value={globalFPS} onChange={e => setGlobalFPS(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                <option value="30 FPS">30 FPS</option>
                <option value="60 FPS">60 FPS</option>
              </select>"""
content = content.replace(old_fps, new_fps)

# 4. Update Browse folders
old_bg_folder = """              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>"""
new_bg_folder = """              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly value={bgFolder} placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button onClick={() => handleBrowseFolder(setBgFolder)} className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>"""
content = content.replace(old_bg_folder, new_bg_folder)

old_audio_folder = """              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><Music size={10}/> Audio Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>"""
new_audio_folder = """              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><Music size={10}/> Audio Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly value={audioFolder} placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button onClick={() => handleBrowseFolder(setAudioFolder)} className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>"""
content = content.replace(old_audio_folder, new_audio_folder)

old_overlay_folder = """              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><ImageIcon size={10}/> Overlay Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>"""
new_overlay_folder = """              <label className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1"><ImageIcon size={10}/> Overlay Folder (Optional)</label>
              <div className="flex border border-[#333] rounded overflow-hidden mt-1">
                <input type="text" readOnly value={overlayFolder} placeholder="Random file if empty" className="bg-[#1a1c23] px-2 py-1 text-[10px] w-full border-none outline-none text-gray-400"/>
                <button onClick={() => handleBrowseFolder(setOverlayFolder)} className="bg-[#222] hover:bg-[#333] px-3 text-[10px] text-orange-500 font-bold border-l border-[#333]">Browse</button>
              </div>"""
content = content.replace(old_overlay_folder, new_overlay_folder)


with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Realtime patched successfully!")
