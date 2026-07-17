import React from 'react';

function PropertyGroup({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] font-bold uppercase text-gray-500 mb-2 px-1">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function M4PropertiesPanel({ m4Objects = [], setM4Objects, m4SelectedObjectId }) {
  const selectedObj = m4Objects.find(o => o.id === m4SelectedObjectId);

  if (!selectedObj) {
    return (
      <div className="w-[20%] min-w-[250px] shrink-0 bg-[#0c0d12] border-l border-[#21232d] flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-[#21232d] bg-[#12131a]">
          <h2 className="text-xs font-bold text-gray-300">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-600 text-xs p-4 text-center">
          Select an object in the canvas to view and edit its properties.
        </div>
      </div>
    );
  }

  const updateProp = (key, value) => {
    if (!setM4Objects) return;
    setM4Objects(prev => prev.map(o => o.id === m4SelectedObjectId ? { ...o, [key]: value } : o));
  };

  const updateNumericProp = (key, valString) => {
    const val = parseFloat(valString);
    if (!isNaN(val)) updateProp(key, val);
  };

  const resetPosition = () => { updateProp('x', 0); updateProp('y', 0); };
  const resetScale = () => { updateProp('width', 300); updateProp('height', 100); };
  const centerObject = () => { updateProp('x', 960 - (selectedObj.width/2 || 150)); updateProp('y', 540 - (selectedObj.height/2 || 50)); };

  const handleBringForward = () => updateProp('layer', selectedObj.layer + 1);
  const handleSendBackward = () => updateProp('layer', Math.max(0, selectedObj.layer - 1));

  return (
    <div className="w-[20%] min-w-[250px] shrink-0 bg-[#0c0d12] border-l border-[#21232d] flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#21232d] bg-[#12131a]">
        <h2 className="text-xs font-bold text-gray-300">Properties</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="mb-4 pb-4 border-b border-[#21232d]">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Selected Object</div>
          <div className="text-xs text-blue-400 font-bold truncate">{selectedObj.name}</div>
        </div>

        <PropertyGroup title="Transform">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">X</span><input type="number" value={selectedObj.x} onChange={e => updateNumericProp('x', e.target.value)} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-16 text-right text-gray-300 font-mono" /></div>
            <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Y</span><input type="number" value={selectedObj.y} onChange={e => updateNumericProp('y', e.target.value)} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-16 text-right text-gray-300 font-mono" /></div>
            <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">W</span><input type="number" value={selectedObj.width} onChange={e => updateNumericProp('width', e.target.value)} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-16 text-right text-gray-300 font-mono" /></div>
            <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">H</span><input type="number" value={selectedObj.height} onChange={e => updateNumericProp('height', e.target.value)} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-16 text-right text-gray-300 font-mono" /></div>
            <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Rot</span><input type="number" value={selectedObj.rotation || 0} onChange={e => updateNumericProp('rotation', e.target.value)} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-16 text-right text-gray-300 font-mono" /></div>
          </div>
          <div className="flex gap-1 mt-2">
            <button onClick={resetPosition} className="flex-1 bg-[#1e2230] hover:bg-[#2a2e3d] border border-[#2d3247] rounded py-1 text-[9px] text-gray-300">Reset Pos</button>
            <button onClick={resetScale} className="flex-1 bg-[#1e2230] hover:bg-[#2a2e3d] border border-[#2d3247] rounded py-1 text-[9px] text-gray-300">Reset Scale</button>
            <button onClick={centerObject} className="flex-1 bg-[#1e2230] hover:bg-[#2a2e3d] border border-[#2d3247] rounded py-1 text-[9px] text-gray-300">Center</button>
          </div>
        </PropertyGroup>

        <PropertyGroup title="Appearance">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-400">Opacity</span>
              <input type="range" min="0" max="100" value={selectedObj.opacity || 100} onChange={e => updateNumericProp('opacity', e.target.value)} className="w-24 accent-[#2563eb]" />
            </div>
            {selectedObj.type === 'effect' && (
              <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Intensity</span><input type="range" min="0" max="100" defaultValue={50} className="w-24 accent-amber-500" /></div>
            )}
            <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Blend Mode</span><select className="bg-[#181922] border border-[#2d3247] rounded px-1 py-1 w-20 text-gray-300"><option>Normal</option><option>Screen</option><option>Add</option></select></div>
          </div>
        </PropertyGroup>

        {selectedObj.type === 'text' && (
          <PropertyGroup title="Text Options">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Text</span><input type="text" value={selectedObj.name} onChange={e => updateProp('name', e.target.value)} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-24 text-right text-gray-300" /></div>
              <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Font</span><select className="bg-[#181922] border border-[#2d3247] rounded px-1 py-1 w-24 text-gray-300"><option>Inter</option><option>Roboto</option></select></div>
              <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Size</span><input type="number" defaultValue={24} className="bg-[#181922] border border-[#2d3247] rounded px-2 py-1 w-16 text-right text-gray-300 font-mono" /></div>
              <div className="flex items-center justify-between text-[10px]"><span className="text-gray-400">Color</span><input type="color" defaultValue="#ffffff" className="bg-[#181922] border border-[#2d3247] rounded w-12 h-6" /></div>
            </div>
          </PropertyGroup>
        )}

        <PropertyGroup title="Layer & Visibility">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-400">Layer Order</span>
              <span className="text-gray-300 font-mono bg-[#181922] border border-[#2d3247] px-2 py-0.5 rounded">{selectedObj.layer}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleBringForward} className="flex-1 bg-[#1e2230] hover:bg-[#2a2e3d] border border-[#2d3247] rounded py-1 text-[10px] text-gray-300">Bring Forward</button>
              <button onClick={handleSendBackward} className="flex-1 bg-[#1e2230] hover:bg-[#2a2e3d] border border-[#2d3247] rounded py-1 text-[10px] text-gray-300">Send Backward</button>
            </div>
            
            <div className="pt-2 border-t border-[#21232d] mt-2 space-y-2">
              <label className="flex items-center justify-between cursor-pointer text-[10px] text-gray-300">
                <span>Visible</span>
                <input type="checkbox" checked={selectedObj.visible !== false} onChange={e => updateProp('visible', e.target.checked)} className="accent-[#2563eb]" />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-[10px] text-gray-300">
                <span>Locked</span>
                <input type="checkbox" checked={selectedObj.locked || false} onChange={e => updateProp('locked', e.target.checked)} className="accent-red-500" />
              </label>
            </div>
          </div>
        </PropertyGroup>
      </div>
    </div>
  );
}
