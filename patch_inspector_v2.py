import sys

filepath_inspector = 'd:/MediaFactory/src/components/m3/M3ObjectInspector.jsx'

with open(filepath_inspector, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace signature
old_sig = "export default function M3ObjectInspector({ m3Objects = [], setM3Objects, m3SelectedObjectId, activeCategory, renderSettings = {}, setRenderSettings }) {"
new_sig = "export default function M3ObjectInspector({ m3BgPool = [], setM3BgPool, m3Objects = [], setM3Objects, m3SelectedObjectId, activeCategory, renderSettings = {}, setRenderSettings }) {"

content = content.replace(old_sig, new_sig)

# Insert bgProp functions
bg_funcs = """
  const updateBgProp = (key, value) => {
    if (setM3BgPool && m3BgPool.length > 0) {
      setM3BgPool(prev => {
        const newPool = [...prev];
        newPool[0] = { ...newPool[0], props: { ...(newPool[0].props || {}), [key]: value } };
        return newPool;
      });
    }
  };

  const getBgProp = (key, def) => {
    if (m3BgPool && m3BgPool.length > 0) {
      const props = m3BgPool[0].props || {};
      return props[key] !== undefined ? props[key] : def;
    }
    return def;
  };
"""

insert_idx = content.find("  const updateProp =")
if insert_idx != -1:
    content = content[:insert_idx] + bg_funcs + content[insert_idx:]

# Replace renderBackgroundInspector
start_str = "  const renderBackgroundInspector = () => ("
end_str = "  const renderPlaylistInspector = () => {"
start_rep_idx = content.find(start_str)
end_rep_idx = content.find(end_str)

replacement_jsx = """  const renderBackgroundInspector = () => (
    <>
      <SettingGroup title="BG Dance">
        <div className="mb-3">
            <label className="block text-[10px] text-gray-500 mb-1">Mode gerak latar</label>
            <select value={getBgProp('bgDanceMode', 'Ringan (Pixel) — cepat di CPU')} onChange={e => updateBgProp('bgDanceMode', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Ringan (Pixel) — cepat di CPU">Ringan (Pixel) — cepat di CPU</option>
                <option value="Penuh (3D) — lambat di CPU">Penuh (3D) — lambat di CPU</option>
            </select>
            <p className="text-[9px] text-[#4b5563] mt-2 leading-relaxed">
                Ringan: latar di-bake jadi gambar lalu disalin — cepat, tanpa putar. Penuh: semua gerakan (termasuk putar), tapi dihitung ulang tiap frame (berat di CPU export, mulus di GPU).
            </p>
        </div>
        
        <div className="mb-4">
            <label className="block text-[10px] text-gray-500 mb-1">Style</label>
            <select value={getBgProp('bgDanceStyle', 'Custom')} onChange={e => updateBgProp('bgDanceStyle', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Subtle Sway">Subtle Sway</option>
                <option value="Bass Zoom">Bass Zoom</option>
                <option value="Dance">Dance</option>
                <option value="Energetic">Energetic</option>
                <option value="Zoom Only">Zoom Only</option>
                <option value="Custom">Custom</option>
            </select>
        </div>

        <div className="mb-4 mt-2">
            <select value={getBgProp('bgDanceSource', 'Bass (Low)')} onChange={e => updateBgProp('bgDanceSource', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-[#a855f7] rounded p-2 outline-none appearance-none font-bold">
                <option value="Bass (Low)">Bass (Low)</option>
                <option value="Whole song">Whole song</option>
                <option value="Snare">Snare</option>
            </select>
        </div>

        <div className="flex justify-between items-center mb-1 mt-4">
            <label className="text-[10px] text-gray-500">Smoothing</label>
            <span className="text-[10px] text-[#a855f7] font-mono">{Number(getBgProp('bgDanceSmoothing', 0.70)).toFixed(2)}</span>
        </div>
        <input 
            type="range" min={0} max={1} step={0.01} value={getBgProp('bgDanceSmoothing', 0.70)} 
            onChange={e => updateBgProp('bgDanceSmoothing', Number(e.target.value))} 
            className="w-full accent-[#3b82f6] mb-4" 
        />
        
        {getBgProp('bgDanceStyle', 'Custom') === 'Custom' && (
            <>
                <div className="flex items-center gap-2 mb-2 mt-2">
                    <input type="checkbox" checked={getBgProp('bgDanceZoomEnable', false)} onChange={e => updateBgProp('bgDanceZoomEnable', e.target.checked)} className="accent-[#a855f7] cursor-pointer" />
                    <label className="text-[10px] text-gray-300 flex-1">Zoom</label>
                    <span className="text-[10px] text-[#a855f7] font-mono w-6 text-right">{getBgProp('bgDanceZoomVal', 10)}</span>
                </div>
                <input type="range" min={0} max={50} value={getBgProp('bgDanceZoomVal', 10)} onChange={e => updateBgProp('bgDanceZoomVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceZoomEnable', false)} />

                <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={getBgProp('bgDanceSwayEnable', true)} onChange={e => updateBgProp('bgDanceSwayEnable', e.target.checked)} className="accent-[#a855f7] cursor-pointer" />
                    <label className="text-[10px] text-gray-300 flex-1">Sway L/R</label>
                    <span className="text-[10px] text-[#a855f7] font-mono w-8 text-right">{Number(getBgProp('bgDanceSwayVal', 1.8)).toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={10} step={0.1} value={getBgProp('bgDanceSwayVal', 1.8)} onChange={e => updateBgProp('bgDanceSwayVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceSwayEnable', true)} />
            </>
        )}
      </SettingGroup>
    </>
  );

"""
if start_rep_idx != -1 and end_rep_idx != -1:
    content = content[:start_rep_idx] + replacement_jsx + content[end_rep_idx:]
    with open(filepath_inspector, 'w', encoding='utf-8') as f:
        f.write(content)
    print("M3ObjectInspector patched")
else:
    print("Failed to find bounds in M3ObjectInspector")
