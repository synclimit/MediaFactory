import sys

filepath = 'd:/MediaFactory/src/components/m3/M3ObjectInspector.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "  const renderReactiveInspector = () => {"
end_str = "  const renderBrandingInspector = () => ("

if start_str not in content:
    print("Could not find start string")
    sys.exit(1)

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if end_idx == -1:
    print("Could not find end string")
    sys.exit(1)

replacement = """  const renderReactiveInspector = () => {
    return (
      <>
        <SettingGroup title="Text Layout">
          <div className="flex justify-end mb-2">
            <button className="bg-[#a855f7] hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded">Save Preset</button>
          </div>
          
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Font</label>
                <div className="flex items-center bg-[#0c0d12] border border-[#2d3247] rounded px-2">
                    <select value={getProp('font', 'Segoe UI')} onChange={e => updateProp('font', e.target.value)} className="w-full bg-transparent text-[11px] text-white p-1.5 outline-none appearance-none">
                        <option value="Segoe UI">Segoe UI</option>
                        <option value="Arial">Arial</option>
                        <option value="Impact">Impact</option>
                    </select>
                </div>
            </div>
            <div className="shrink-0 pt-4">
                <button className="bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[10px] font-bold px-3 py-1.5 rounded">Browse...</button>
            </div>
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Weight</label>
                <select value={getProp('fontWeight', 'Extra-Bold')} onChange={e => updateProp('fontWeight', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-1.5 outline-none">
                    <option value="Normal">Normal</option>
                    <option value="Bold">Bold</option>
                    <option value="Extra-Bold">Extra-Bold</option>
                </select>
            </div>
          </div>

          <div className="flex gap-4 mb-3">
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Lines</label>
                <select value={getProp('lines', '1 Line')} onChange={e => updateProp('lines', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-1.5 outline-none">
                    <option value="1 Line">1 Line</option>
                    <option value="2 Lines">2 Lines</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Words / Line</label>
                <div className="flex bg-[#0c0d12] border border-[#2d3247] rounded overflow-hidden">
                    <input type="number" value={getProp('wordsPerLine', 8)} onChange={e => updateProp('wordsPerLine', Number(e.target.value))} className="w-full bg-transparent text-[11px] text-white p-1.5 text-center outline-none" />
                </div>
            </div>
          </div>

          <div className="flex gap-4 mb-3 mt-4">
              <ToggleRow label="Auto-shrink long lines" checked={getProp('autoShrink', true)} onChange={e => updateProp('autoShrink', e.target.checked)} />
              <ToggleRow label="Keep visible in gaps" checked={getProp('keepVisible', false)} onChange={e => updateProp('keepVisible', e.target.checked)} />
          </div>

          <div className="flex gap-4 mb-1 mt-4">
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Line Movement (Scroll)</label>
                <select value={getProp('lineMovement', 'None')} onChange={e => updateProp('lineMovement', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-1.5 outline-none">
                    <option value="None">None</option>
                    <option value="Up">Up</option>
                    <option value="Down">Down</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Layout Style</label>
                <select value={getProp('layoutStyle', 'Classic Centered')} onChange={e => updateProp('layoutStyle', e.target.value)} className="w-full bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-1.5 outline-none">
                    <option value="Classic Centered">Classic Centered</option>
                    <option value="Left Aligned">Left Aligned</option>
                </select>
            </div>
          </div>
        </SettingGroup>

        <SettingGroup title="Text Style">
          <div className="flex gap-4 mb-3">
            <div className="flex-1">
                <label className="block text-[10px] text-[#4b5563] font-bold mb-1">Color & Alignment</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={getProp('color', '#ffffff')} onChange={e => updateProp('color', e.target.value)} className="w-8 h-8 rounded bg-transparent border-none cursor-pointer" />
                    <select value={getProp('alignment', 'Center')} onChange={e => updateProp('alignment', e.target.value)} className="flex-1 bg-[#0c0d12] border border-[#2d3247] text-[11px] text-white rounded p-1 outline-none">
                        <option value="Center">Center</option>
                        <option value="Left">Left</option>
                        <option value="Right">Right</option>
                    </select>
                </div>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] text-[#4b5563] font-bold">Font Size</label>
                    <span className="text-[10px] text-[#a855f7] font-mono">{getProp('fontSize', 36)}</span>
                </div>
                <input type="range" min={10} max={100} value={getProp('fontSize', 36)} onChange={e => updateProp('fontSize', Number(e.target.value))} className="w-full accent-[#3b82f6]" />
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 mt-4">
              <div className="flex items-center gap-2">
                  <input type="checkbox" checked={getProp('stroke', true)} onChange={e => updateProp('stroke', e.target.checked)} className="accent-[#3b82f6]" />
                  <span className="text-[11px] text-gray-300 font-bold">Stroke</span>
              </div>
              <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#4b5563] w-4 text-right font-mono">{getProp('strokeWidth', 1)}</span>
                  <input type="color" value={getProp('strokeColor', '#000000')} onChange={e => updateProp('strokeColor', e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer" />
                  <input type="range" min={0} max={10} value={getProp('strokeWidth', 1)} onChange={e => updateProp('strokeWidth', Number(e.target.value))} className="w-16 accent-[#3b82f6]" />
              </div>
          </div>

          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <input type="checkbox" checked={getProp('glow', true)} onChange={e => updateProp('glow', e.target.checked)} className="accent-[#3b82f6]" />
                  <span className="text-[11px] text-gray-300 font-bold">Glow</span>
              </div>
              <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#4b5563] w-4 text-right font-mono">{getProp('glowWidth', 18)}</span>
                  <input type="color" value={getProp('glowColor', '#a855f7')} onChange={e => updateProp('glowColor', e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer" />
                  <input type="range" min={0} max={50} value={getProp('glowWidth', 18)} onChange={e => updateProp('glowWidth', Number(e.target.value))} className="w-16 accent-[#3b82f6]" />
              </div>
          </div>
        </SettingGroup>
      </>
    );
  };

"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Success")
