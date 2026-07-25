import sys

filepath_inspector = 'd:/MediaFactory/src/components/m3/M3ObjectInspector.jsx'

with open(filepath_inspector, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace renderBackgroundInspector
start_str = "  const renderBackgroundInspector = () => ("
end_str = "  const renderPlaylistInspector = () => {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_inspector = """  const handleStyleChange = (newStyle) => {
    updateBgProp('bgDanceStyle', newStyle);
    
    // Apply Presets
    if (newStyle === 'Bass Zoom') {
        updateBgProp('bgDanceSmoothing', 0.40);
        updateBgProp('bgDanceZoomEnable', true); updateBgProp('bgDanceZoomVal', 12);
        updateBgProp('bgDanceSwayLREnable', false); updateBgProp('bgDanceSwayLRVal', 1.8);
        updateBgProp('bgDanceSwayUDEnable', false); updateBgProp('bgDanceSwayUDVal', 1.8);
        updateBgProp('bgDanceRotateEnable', false); updateBgProp('bgDanceRotateVal', 1.0);
        updateBgProp('bgDanceShakeEnable', false); updateBgProp('bgDanceShakeVal', 8.0);
    } else if (newStyle === 'Dance') {
        updateBgProp('bgDanceSmoothing', 0.50);
        updateBgProp('bgDanceZoomEnable', true); updateBgProp('bgDanceZoomVal', 8);
        updateBgProp('bgDanceSwayLREnable', true); updateBgProp('bgDanceSwayLRVal', 2.5);
        updateBgProp('bgDanceSwayUDEnable', false); updateBgProp('bgDanceSwayUDVal', 1.8);
        updateBgProp('bgDanceRotateEnable', false); updateBgProp('bgDanceRotateVal', 1.0);
        updateBgProp('bgDanceShakeEnable', false); updateBgProp('bgDanceShakeVal', 8.0);
    } else if (newStyle === 'Zoom Only') {
        updateBgProp('bgDanceSmoothing', 0.50);
        updateBgProp('bgDanceZoomEnable', true); updateBgProp('bgDanceZoomVal', 10);
        updateBgProp('bgDanceSwayLREnable', false); updateBgProp('bgDanceSwayLRVal', 2.5);
        updateBgProp('bgDanceSwayUDEnable', false); updateBgProp('bgDanceSwayUDVal', 1.8);
        updateBgProp('bgDanceRotateEnable', false); updateBgProp('bgDanceRotateVal', 1.0);
        updateBgProp('bgDanceShakeEnable', false); updateBgProp('bgDanceShakeVal', 8.0);
    } else if (newStyle === 'Energetic') {
        updateBgProp('bgDanceSmoothing', 0.35);
        updateBgProp('bgDanceZoomEnable', true); updateBgProp('bgDanceZoomVal', 14);
        updateBgProp('bgDanceSwayLREnable', true); updateBgProp('bgDanceSwayLRVal', 3.5);
        updateBgProp('bgDanceSwayUDEnable', true); updateBgProp('bgDanceSwayUDVal', 1.8);
        updateBgProp('bgDanceRotateEnable', false); updateBgProp('bgDanceRotateVal', 1.0);
        updateBgProp('bgDanceShakeEnable', false); updateBgProp('bgDanceShakeVal', 8.0);
    } else if (newStyle === 'Subtle Sway') {
        updateBgProp('bgDanceSmoothing', 0.70);
        updateBgProp('bgDanceZoomEnable', true); updateBgProp('bgDanceZoomVal', 4);
        updateBgProp('bgDanceSwayLREnable', true); updateBgProp('bgDanceSwayLRVal', 1.5);
        updateBgProp('bgDanceSwayUDEnable', true); updateBgProp('bgDanceSwayUDVal', 1.0);
        updateBgProp('bgDanceRotateEnable', false); updateBgProp('bgDanceRotateVal', 1.0);
        updateBgProp('bgDanceShakeEnable', false); updateBgProp('bgDanceShakeVal', 8.0);
    }
  };

  const renderBackgroundInspector = () => (
    <>
      <SettingGroup title="BG Dance">
        <div className="mb-3">
            <label className="block text-[10px] text-gray-500 mb-1">Mode gerak latar</label>
            <select value={getBgProp('bgDanceMode', 'Ringan (Pixel) — cepat di CPU')} onChange={e => updateBgProp('bgDanceMode', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Ringan (Pixel) — cepat di CPU">Ringan (Pixel) — cepat di CPU</option>
                <option value="Penuh (3D) — lambat di CPU">Penuh (3D) — lambat di CPU</option>
            </select>
        </div>
        
        <div className="mb-4">
            <label className="block text-[10px] text-gray-500 mb-1">Style</label>
            <select value={getBgProp('bgDanceStyle', 'Custom')} onChange={e => handleStyleChange(e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-2 outline-none appearance-none">
                <option value="Subtle Sway">Subtle Sway</option>
                <option value="Bass Zoom">Bass Zoom</option>
                <option value="Dance">Dance</option>
                <option value="Energetic">Energetic</option>
                <option value="Zoom Only">Zoom Only</option>
                <option value="Custom">Custom</option>
            </select>
        </div>

        <SliderRow label="Overall Intensity" min={0} max={200} value={getBgProp('bgDanceIntensity', 100)} onChange={e => updateBgProp('bgDanceIntensity', Number(e.target.value))} />
        <SliderRow label="React Level (bass)" min={0} max={100} value={getBgProp('bgDanceReactLevel', 40)} onChange={e => updateBgProp('bgDanceReactLevel', Number(e.target.value))} />

        <div className="mb-4 mt-4">
            <label className="block text-[10px] text-gray-500 mb-1">Reacts to</label>
            <select value={getBgProp('bgDanceSource', 'Bass (Low)')} onChange={e => updateBgProp('bgDanceSource', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-[#a855f7] rounded p-2 outline-none appearance-none font-bold">
                <option value="Bass (Low)">Bass (Low)</option>
                <option value="Whole song">Whole song</option>
                <option value="Snare">Snare</option>
            </select>
        </div>

        <div className="flex justify-between items-center mb-1 mt-4">
            <label className="text-[10px] text-gray-500">Smoothing</label>
            <span className="text-[10px] text-[#a855f7] font-mono">{Number(getBgProp('bgDanceSmoothing', 0.50)).toFixed(2)}</span>
        </div>
        <input 
            type="range" min={0} max={1} step={0.01} value={getBgProp('bgDanceSmoothing', 0.50)} 
            onChange={e => updateBgProp('bgDanceSmoothing', Number(e.target.value))} 
            className="w-full accent-[#3b82f6] mb-4" 
        />
        
        {/* Sliders */}
        <div className="flex items-center gap-2 mb-2 mt-2">
            <input type="checkbox" checked={getBgProp('bgDanceZoomEnable', true)} onChange={e => updateBgProp('bgDanceZoomEnable', e.target.checked)} className="accent-[#3b82f6] cursor-pointer" />
            <label className="text-[10px] text-gray-300 flex-1">Zoom</label>
            <span className="text-[10px] text-[#a855f7] font-mono w-6 text-right">{getBgProp('bgDanceZoomVal', 10)}</span>
        </div>
        <input type="range" min={0} max={50} value={getBgProp('bgDanceZoomVal', 10)} onChange={e => updateBgProp('bgDanceZoomVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceZoomEnable', true)} />

        <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={getBgProp('bgDanceSwayLREnable', false)} onChange={e => updateBgProp('bgDanceSwayLREnable', e.target.checked)} className="accent-[#3b82f6] cursor-pointer" />
            <label className="text-[10px] text-gray-300 flex-1">Sway L/R</label>
            <span className="text-[10px] text-[#a855f7] font-mono w-8 text-right">{Number(getBgProp('bgDanceSwayLRVal', 2.5)).toFixed(1)}</span>
        </div>
        <input type="range" min={0} max={10} step={0.1} value={getBgProp('bgDanceSwayLRVal', 2.5)} onChange={e => updateBgProp('bgDanceSwayLRVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceSwayLREnable', false)} />
        
        <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={getBgProp('bgDanceSwayUDEnable', false)} onChange={e => updateBgProp('bgDanceSwayUDEnable', e.target.checked)} className="accent-[#3b82f6] cursor-pointer" />
            <label className="text-[10px] text-gray-300 flex-1">Sway Up/Down</label>
            <span className="text-[10px] text-[#a855f7] font-mono w-8 text-right">{Number(getBgProp('bgDanceSwayUDVal', 1.8)).toFixed(1)}</span>
        </div>
        <input type="range" min={0} max={10} step={0.1} value={getBgProp('bgDanceSwayUDVal', 1.8)} onChange={e => updateBgProp('bgDanceSwayUDVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceSwayUDEnable', false)} />

        <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={getBgProp('bgDanceRotateEnable', false)} onChange={e => updateBgProp('bgDanceRotateEnable', e.target.checked)} className="accent-[#3b82f6] cursor-pointer" />
            <label className="text-[10px] text-gray-300 flex-1">Rotate</label>
            <span className="text-[10px] text-[#a855f7] font-mono w-8 text-right">{Number(getBgProp('bgDanceRotateVal', 1.0)).toFixed(1)}</span>
        </div>
        <input type="range" min={0} max={10} step={0.1} value={getBgProp('bgDanceRotateVal', 1.0)} onChange={e => updateBgProp('bgDanceRotateVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceRotateEnable', false)} />

        <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={getBgProp('bgDanceShakeEnable', false)} onChange={e => updateBgProp('bgDanceShakeEnable', e.target.checked)} className="accent-[#3b82f6] cursor-pointer" />
            <label className="text-[10px] text-gray-300 flex-1">Shake</label>
            <span className="text-[10px] text-[#a855f7] font-mono w-8 text-right">{Number(getBgProp('bgDanceShakeVal', 8.0)).toFixed(1)}</span>
        </div>
        <input type="range" min={0} max={20} step={0.1} value={getBgProp('bgDanceShakeVal', 8.0)} onChange={e => updateBgProp('bgDanceShakeVal', Number(e.target.value))} className="w-full accent-[#3b82f6] mb-4" disabled={!getBgProp('bgDanceShakeEnable', false)} />

      </SettingGroup>
    </>
  );
"""

content = content[:start_idx] + new_inspector + content[end_idx:]

with open(filepath_inspector, 'w', encoding='utf-8') as f:
    f.write(content)
print("Inspector UI updated with new controls")
