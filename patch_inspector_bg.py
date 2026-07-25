import sys

filepath = 'd:/MediaFactory/src/components/m3/M3ObjectInspector.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "  const renderBackgroundInspector = () => ("
end_str = "  const renderPlaylistInspector = () => {"

if start_str not in content:
    print("Could not find start string")
    sys.exit(1)

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if end_idx == -1:
    print("Could not find end string")
    sys.exit(1)

replacement = """  const renderBackgroundInspector = () => (
    <>
      <SettingGroup title="BG Dance">
        <div className="mb-3">
            <label className="block text-[10px] text-gray-500 mb-1">Mode gerak latar</label>
            <select value={getProp('bgDanceMode', 'Ringan (Pixel) — cepat di CPU')} onChange={e => updateProp('bgDanceMode', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Ringan (Pixel) — cepat di CPU">Ringan (Pixel) — cepat di CPU</option>
                <option value="Penuh (3D) — lambat di CPU">Penuh (3D) — lambat di CPU</option>
            </select>
            <p className="text-[9px] text-[#4b5563] mt-2 leading-relaxed">
                Ringan: latar di-bake jadi gambar lalu disalin — cepat, tanpa putar. Penuh: semua gerakan (termasuk putar), tapi dihitung ulang tiap frame (berat di CPU export, mulus di GPU).
            </p>
        </div>
        
        <div className="mb-4">
            <label className="block text-[10px] text-gray-500 mb-1">Style</label>
            <select value={getProp('bgDanceStyle', 'Subtle Sway')} onChange={e => updateProp('bgDanceStyle', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Subtle Sway">Subtle Sway</option>
                <option value="Hard Bounce">Hard Bounce</option>
                <option value="Pulse Zoom">Pulse Zoom</option>
            </select>
        </div>

        <SliderRow label="Overall Intensity" min={0} max={200} value={getProp('bgDanceIntensity', 100)} onChange={e => updateProp('bgDanceIntensity', Number(e.target.value))} />
        <SliderRow label="React Level (bass)" min={0} max={100} value={getProp('bgDanceReactLevel', 45)} onChange={e => updateProp('bgDanceReactLevel', Number(e.target.value))} />

        <div className="mb-4 mt-4">
            <label className="block text-[10px] text-gray-500 mb-1">Reacts to</label>
            <select value={getProp('bgDanceSource', 'Whole song')} onChange={e => updateProp('bgDanceSource', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Whole song">Whole song</option>
                <option value="Kick / Bass">Kick / Bass</option>
                <option value="Snare">Snare</option>
            </select>
        </div>

        <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] text-gray-500">Smoothing</label>
            <span className="text-[10px] text-[#a855f7] font-mono">{Number(getProp('bgDanceSmoothing', 0.70)).toFixed(2)}</span>
        </div>
        <input 
            type="range" min={0} max={1} step={0.01} value={getProp('bgDanceSmoothing', 0.70)} 
            onChange={e => updateProp('bgDanceSmoothing', Number(e.target.value))} 
            className="w-full accent-[#3b82f6] mb-4" 
        />
      </SettingGroup>
    </>
  );

"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success")
