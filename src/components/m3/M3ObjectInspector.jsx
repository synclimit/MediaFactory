import React, { useState, useEffect, useRef } from 'react';
import { renderFrameStore } from '../../services/pipeline/runtime/RenderFrameStore';
import Surface from '../ui/Surface';
import { BackgroundVariants } from '../ui/BackgroundVariants';
import { emitRuntimeEvent } from '../../services/RuntimeClient';
import { fontLibrary } from '../../services/FontLibrary';
import PlaylistParser from '../../services/playlist/PlaylistParser';
import { TypographyThemes, getThemeById } from '../../services/typography/TypographyThemes';

const LiveAudioMeter = ({ source }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(64);

    const render = () => {
      animId = requestAnimationFrame(render);
      
      // Use formal renderFrameStore
      const frame = renderFrameStore.getFrame();
      const state = frame?.debug?.beat || {};
      
      let level = 0;
      if (source === 'Bass') level = state.bass;
      else if (source === 'Mid') level = state.mid;
      else if (source === 'Treble') level = state.treble;
      else level = state.peak;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e2230';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(0, 0, canvas.width * level, canvas.height);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [source]);

  return (
    <div className="flex items-center gap-2 mt-1 mb-2">
      <span className="text-[10px] text-gray-400 uppercase w-10">{source}</span>
      <canvas ref={canvasRef} width="200" height="8" className="w-full h-2 rounded bg-[#1e2230] overflow-hidden" />
    </div>
  );
};

// --- Helpers ---
function SettingGroup({ title, children }) {
  return (
    <div className="bg-[#12131a] border border-[#2d3247] rounded p-3 mb-3">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-[#21232d] pb-1">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center justify-between cursor-pointer text-[11px] transition-colors group ${disabled ? 'opacity-50 pointer-events-none' : 'text-gray-300 hover:text-white'}`}>
      <span>{label}</span>
      <div className="relative">
        <input type="checkbox" className="sr-only peer" checked={checked || false} onChange={onChange} disabled={disabled} />
        <div className="w-8 h-4 bg-[#181922] border border-[#2d3247] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-emerald-400 after:border-gray-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:border-emerald-500/50"></div>
      </div>
    </label>
  );
}

function SliderRow({ label, min = 0, max = 100, step, value = 50, onChange, disabled }) {
  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{label}</span>
        <span className="font-mono">{Number(value).toFixed(step && step < 1 ? 1 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className="w-full accent-[#2563eb] h-1.5 bg-[#181922] rounded-lg appearance-none cursor-pointer" />
    </div>
  );
}

function SelectRow({ label, options, value, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <span className="text-[11px] text-gray-300">{label}</span>
      <select className="bg-[#181922] border border-[#2d3247] text-[10px] text-gray-300 rounded px-2 py-1 outline-none w-28 focus:border-blue-500" value={value} onChange={onChange} disabled={disabled}>
        {options.map(opt => {
          if (typeof opt === 'object' && opt !== null) {
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          }
          return <option key={opt} value={opt}>{opt}</option>;
        })}
      </select>
    </div>
  );
}

function ButtonGroup({ label, options, active = options[0], onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-[11px] text-gray-300">{label}</span>}
      <div className="flex flex-wrap gap-1">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange && onChange(opt)} className={`px-2 py-1 text-[10px] rounded border transition-colors ${opt === active ? 'bg-[#2563eb] text-white border-blue-500 shadow-sm' : 'bg-[#181922] text-gray-400 border-[#2d3247] hover:bg-[#1e2230] hover:text-gray-200'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function M3ObjectInspector({ m3Objects = [], setM3Objects, m3SelectedObjectId, activeCategory, renderSettings = {}, setRenderSettings }) {
  const [demoState, setDemoState] = React.useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const updateProp = (key, value) => {
    if (m3SelectedObjectId && setM3Objects) {
      setM3Objects(prev => prev.map(o => o.id === m3SelectedObjectId ? { ...o, [key]: value } : o));
    } else {
      setDemoState(prev => ({...prev, [key]: value}));
    }
  };

  const getProp = (key, def) => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      return obj && obj[key] !== undefined ? obj[key] : def;
    }
    return demoState[key] !== undefined ? demoState[key] : def;
  };

  const renderBackgroundInspector = () => (
    <>
      <SettingGroup title="Transform">
        <SliderRow label="Position X" min={0} max={1920} value={getProp('x', 0)} onChange={e => updateProp('x', e.target.value)} />
        <SliderRow label="Position Y" min={0} max={1080} value={getProp('y', 0)} onChange={e => updateProp('y', e.target.value)} />
        <SliderRow label="Scale" min={10} max={200} value={getProp('scale', 100)} onChange={e => updateProp('scale', e.target.value)} />
        <SliderRow label="Rotation" min={0} max={360} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', e.target.value)} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', e.target.value)} />
      </SettingGroup>
      <SettingGroup title="Image Adjustments">
        <SliderRow label="Brightness" min={0} max={200} value={getProp('brightness', 100)} onChange={e => updateProp('brightness', e.target.value)} />
        <SliderRow label="Contrast" min={0} max={200} value={getProp('contrast', 100)} onChange={e => updateProp('contrast', e.target.value)} />
        <SliderRow label="Saturation" min={0} max={200} value={getProp('saturation', 100)} onChange={e => updateProp('saturation', e.target.value)} />
        <SliderRow label="Blur" min={0} max={50} value={getProp('blur', 0)} onChange={e => updateProp('blur', e.target.value)} />
        <SliderRow label="Crop" min={0} max={100} value={getProp('crop', 0)} onChange={e => updateProp('crop', e.target.value)} />
      </SettingGroup>
      <SettingGroup title="Playback & Animation">
        <SelectRow label="Loop Mode" options={['Normal', 'Seamless', 'Ping Pong', 'Reverse']} value={getProp('loopMode', 'Normal')} onChange={e => updateProp('loopMode', e.target.value)} />
        <SelectRow label="Animation" options={['None', 'Pan Left', 'Pan Right', 'Zoom In', 'Zoom Out']} value={getProp('animation', 'None')} onChange={e => updateProp('animation', e.target.value)} />
        <ToggleRow label="Parallax" checked={getProp('parallax', false)} onChange={e => updateProp('parallax', e.target.checked)} />
      </SettingGroup>
    </>
  );

  const renderPlaylistInspector = () => {
    const fonts = fontLibrary.getFonts();

    const handleImportText = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const tracks = await PlaylistParser.parseFile(file, 'txt');
        updateProp('tracks', tracks);
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const tracks = await PlaylistParser.parseFile(file, 'csv');
        updateProp('tracks', tracks);
    };

    const handlePaste = async () => {
        const tracks = await PlaylistParser.parseClipboard();
        if (tracks && tracks.length > 0) {
            updateProp('tracks', tracks);
        }
    };

    return (
    <>
      <SettingGroup title="Data Source">
        <div className="grid grid-cols-2 gap-2 mb-2">
            <label className="w-full bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] hover:border-emerald-500/50 text-gray-300 text-[10px] py-2 rounded flex flex-col items-center justify-center cursor-pointer transition-colors">
                <span className="text-lg">📄</span>
                <span>Import TXT</span>
                <input type="file" accept=".txt" className="hidden" onChange={handleImportText} />
            </label>
            <label className="w-full bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] hover:border-emerald-500/50 text-gray-300 text-[10px] py-2 rounded flex flex-col items-center justify-center cursor-pointer transition-colors">
                <span className="text-lg">📊</span>
                <span>Import CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
        </div>
        <button onClick={handlePaste} className="w-full bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] hover:border-emerald-500/50 text-gray-300 text-[10px] py-2 rounded flex items-center justify-center gap-2 transition-colors">
            <span className="text-lg">📋</span> Paste Playlist
        </button>
      </SettingGroup>

      <SettingGroup title="General">
        <SliderRow label="Position X" min={-1000} max={3000} value={getProp('x', 0)} onChange={e => updateProp('x', Number(e.target.value))} />
        <SliderRow label="Position Y" min={-1000} max={2000} value={getProp('y', 0)} onChange={e => updateProp('y', Number(e.target.value))} />
        <SliderRow label="Width" min={10} max={3840} value={getProp('width', 800)} onChange={e => updateProp('width', Number(e.target.value))} />
        <SliderRow label="Height" min={10} max={2160} value={getProp('height', 800)} onChange={e => updateProp('height', Number(e.target.value))} />
        <SliderRow label="Rotation" min={-180} max={180} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', Number(e.target.value))} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', Number(e.target.value))} />
        
        <div className="flex gap-2 justify-between mt-3">
            <ToggleRow label="Visible" checked={getProp('visible', true)} onChange={e => updateProp('visible', e.target.checked)} />
            <ToggleRow label="Locked" checked={getProp('locked', false)} onChange={e => updateProp('locked', e.target.checked)} />
        </div>
      </SettingGroup>

      <SettingGroup title="Typography">
        <SelectRow 
            label="Theme" 
            options={['custom', ...TypographyThemes.map(t => t.id)]} 
            value={getProp('typographyTheme', 'custom')} 
            onChange={e => {
                const themeId = e.target.value;
                if (themeId !== 'custom') {
                    const theme = getThemeById(themeId);
                    setM3Objects(prev => prev.map(o => {
                        if (o.id !== m3SelectedObjectId) return o;
                        return { 
                            ...o, 
                            typographyTheme: themeId,
                            font: theme.typography.fontFamily,
                            fontSize: theme.typography.fontSize,
                            color: theme.typography.color,
                            lineHeight: theme.typography.lineHeight,
                            fontWeight: theme.typography.fontWeight,
                            fontStyle: theme.typography.fontStyle,
                            letterSpacing: theme.typography.letterSpacing,
                            align: theme.typography.textAlign,
                            opacity: theme.typography.opacity
                        };
                    }));
                } else {
                    updateProp('typographyTheme', 'custom');
                }
            }} 
        />
        <SelectRow label="Font" options={fonts} value={getProp('font', 'Inter')} onChange={e => updateProp('font', e.target.value)} />
        <SliderRow label="Font Size" min={8} max={120} value={getProp('fontSize', 24)} onChange={e => updateProp('fontSize', Number(e.target.value))} />
        <SliderRow label="Line Height" min={0.5} max={3} step={0.1} value={getProp('lineHeight', 1.5)} onChange={e => updateProp('lineHeight', Number(e.target.value))} />
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2">
            <span>Color</span>
            <input type="color" value={getProp('color', '#ffffff')} onChange={e => updateProp('color', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
      </SettingGroup>

      <SettingGroup title="Layout">
        <SelectRow label="Layout Type" options={['single']} value={getProp('layout', 'single')} onChange={e => updateProp('layout', e.target.value)} />
        <SliderRow label="Columns" min={1} max={4} value={getProp('columns', 1)} onChange={e => updateProp('columns', Number(e.target.value))} />
        <SelectRow label="Alignment" options={['left', 'center', 'right']} value={getProp('align', 'left')} onChange={e => updateProp('align', e.target.value)} />
        <SliderRow label="Gap" min={0} max={200} value={getProp('gap', 20)} onChange={e => updateProp('gap', Number(e.target.value))} />
        <SliderRow label="Column Gap" min={0} max={400} value={getProp('columnGap', 100)} onChange={e => updateProp('columnGap', Number(e.target.value))} />
        <SelectRow label="Numbering" options={['normal', 'none', 'right-number']} value={getProp('numbering', 'normal')} onChange={e => updateProp('numbering', e.target.value)} />
      </SettingGroup>

      {getProp('columns', 1) > 0 && (
        <SettingGroup title="Transform (Left Column)">
            <SliderRow label="X Offset" min={-1000} max={1000} value={getProp('leftTransform', {}).x || 0} onChange={e => updateProp('leftTransform', { ...(getProp('leftTransform', {})), x: Number(e.target.value) })} />
            <SliderRow label="Y Offset" min={-1000} max={1000} value={getProp('leftTransform', {}).y || 0} onChange={e => updateProp('leftTransform', { ...(getProp('leftTransform', {})), y: Number(e.target.value) })} />
            <SliderRow label="Scale" min={0.1} max={3} step={0.1} value={getProp('leftTransform', {}).scale !== undefined ? getProp('leftTransform', {}).scale : 1} onChange={e => updateProp('leftTransform', { ...(getProp('leftTransform', {})), scale: Number(e.target.value) })} />
            <SliderRow label="Rotation" min={-180} max={180} value={getProp('leftTransform', {}).rotation || 0} onChange={e => updateProp('leftTransform', { ...(getProp('leftTransform', {})), rotation: Number(e.target.value) })} />
            <SliderRow label="Opacity" min={0} max={100} value={getProp('leftTransform', {}).opacity !== undefined ? getProp('leftTransform', {}).opacity : 100} onChange={e => updateProp('leftTransform', { ...(getProp('leftTransform', {})), opacity: Number(e.target.value) })} />
        </SettingGroup>
      )}

      {getProp('columns', 1) > 1 && (
        <SettingGroup title="Transform (Right Column)">
            <SliderRow label="X Offset" min={-1000} max={1000} value={getProp('rightTransform', {}).x || 0} onChange={e => updateProp('rightTransform', { ...(getProp('rightTransform', {})), x: Number(e.target.value) })} />
            <SliderRow label="Y Offset" min={-1000} max={1000} value={getProp('rightTransform', {}).y || 0} onChange={e => updateProp('rightTransform', { ...(getProp('rightTransform', {})), y: Number(e.target.value) })} />
            <SliderRow label="Scale" min={0.1} max={3} step={0.1} value={getProp('rightTransform', {}).scale !== undefined ? getProp('rightTransform', {}).scale : 1} onChange={e => updateProp('rightTransform', { ...(getProp('rightTransform', {})), scale: Number(e.target.value) })} />
            <SliderRow label="Rotation" min={-180} max={180} value={getProp('rightTransform', {}).rotation || 0} onChange={e => updateProp('rightTransform', { ...(getProp('rightTransform', {})), rotation: Number(e.target.value) })} />
            <SliderRow label="Opacity" min={0} max={100} value={getProp('rightTransform', {}).opacity !== undefined ? getProp('rightTransform', {}).opacity : 100} onChange={e => updateProp('rightTransform', { ...(getProp('rightTransform', {})), opacity: Number(e.target.value) })} />
        </SettingGroup>
      )}
      
      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete Playlist</button>
      </div>
    </>
  )};

  const renderSubtitleInspector = () => (
    <>
      <SettingGroup title="Subtitle Transform">
        <SliderRow label="Position X" min={-1000} max={3000} value={getProp('transform', {}).x !== undefined ? getProp('transform', {}).x : 400} onChange={e => updateProp('transform', { ...(getProp('transform', {})), x: Number(e.target.value) })} />
        <SliderRow label="Position Y" min={-1000} max={2000} value={getProp('transform', {}).y !== undefined ? getProp('transform', {}).y : 400} onChange={e => updateProp('transform', { ...(getProp('transform', {})), y: Number(e.target.value) })} />
        <SliderRow label="Scale" min={0.1} max={3} step={0.1} value={getProp('transform', {}).scale !== undefined ? getProp('transform', {}).scale : 1} onChange={e => updateProp('transform', { ...(getProp('transform', {})), scale: Number(e.target.value) })} />
        <SliderRow label="Rotation" min={-180} max={180} value={getProp('transform', {}).rotation || 0} onChange={e => updateProp('transform', { ...(getProp('transform', {})), rotation: Number(e.target.value) })} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('transform', {}).opacity !== undefined ? getProp('transform', {}).opacity : 100} onChange={e => updateProp('transform', { ...(getProp('transform', {})), opacity: Number(e.target.value) })} />
      </SettingGroup>

      <SettingGroup title="Subtitle Layout">
        <SliderRow label="Width" min={100} max={3840} value={getProp('width', 800)} onChange={e => updateProp('width', Number(e.target.value))} />
        <SliderRow label="Bottom Margin" min={0} max={500} value={getProp('bottomMargin', 50)} onChange={e => updateProp('bottomMargin', Number(e.target.value))} />
      </SettingGroup>

      <SettingGroup title="Typography">
        <SelectRow 
            label="Theme" 
            options={['custom', ...TypographyThemes.map(t => t.id)]} 
            value={getProp('typographyTheme', 'custom')} 
            onChange={e => {
                const themeId = e.target.value;
                if (themeId !== 'custom') {
                    const theme = getThemeById(themeId);
                    setM3Objects(prev => prev.map(o => {
                        if (o.id !== m3SelectedObjectId) return o;
                        return { 
                            ...o, 
                            typographyTheme: themeId,
                            font: theme.typography.fontFamily,
                            fontSize: theme.typography.fontSize,
                            color: theme.typography.color,
                            lineHeight: theme.typography.lineHeight,
                            fontWeight: theme.typography.fontWeight,
                            fontStyle: theme.typography.fontStyle,
                            letterSpacing: theme.typography.letterSpacing,
                            align: theme.typography.textAlign,
                            opacity: theme.typography.opacity
                        };
                    }));
                } else {
                    updateProp('typographyTheme', 'custom');
                }
            }} 
        />
        <SelectRow label="Font" options={fonts} value={getProp('font', 'Arial, sans-serif')} onChange={e => updateProp('font', e.target.value)} />
        <SliderRow label="Font Size" min={8} max={120} value={getProp('fontSize', 32)} onChange={e => updateProp('fontSize', Number(e.target.value))} />
        <SliderRow label="Line Height" min={0.5} max={3} step={0.1} value={getProp('lineHeight', 1.5)} onChange={e => updateProp('lineHeight', Number(e.target.value))} />
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2">
            <span>Color</span>
            <input type="color" value={getProp('color', '#ffffff')} onChange={e => updateProp('color', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
      </SettingGroup>

      <SettingGroup title="State">
        <div className="flex gap-2 justify-between">
            <ToggleRow label="Visible" checked={getProp('transform', {}).visible !== false} onChange={e => updateProp('transform', { ...(getProp('transform', {})), visible: e.target.checked })} />
            <ToggleRow label="Locked" checked={getProp('locked', false)} onChange={e => updateProp('locked', e.target.checked)} />
        </div>
      </SettingGroup>

      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete Subtitle</button>
      </div>
    </>
  );

  const renderVisualizerInspector = () => (
    <>
      <SettingGroup title="Audio Analysis">
        <SliderRow label="FFT Gain" min={0} max={200} value={getProp('fftGain', 100)} onChange={e => updateProp('fftGain', e.target.value)} />
        <SliderRow label="Sensitivity" min={0} max={100} value={getProp('sensitivity', 80)} onChange={e => updateProp('sensitivity', e.target.value)} />
        <SliderRow label="Bass Focus" min={0} max={100} value={getProp('bass', 100)} onChange={e => updateProp('bass', e.target.value)} />
        <SliderRow label="Mid Focus" min={0} max={100} value={getProp('mid', 50)} onChange={e => updateProp('mid', e.target.value)} />
        <SliderRow label="Treble Focus" min={0} max={100} value={getProp('treble', 30)} onChange={e => updateProp('treble', e.target.value)} />
      </SettingGroup>
      <SettingGroup title="Appearance">
        <ToggleRow label="Mirror" checked={getProp('mirror', false)} onChange={e => updateProp('mirror', e.target.checked)} />
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', e.target.value)} />
        <SliderRow label="Glow" min={0} max={100} value={getProp('glow', 50)} onChange={e => updateProp('glow', e.target.value)} />
        <SelectRow label="Gradient" options={['None', 'Linear', 'Radial', 'Angular']} value={getProp('gradient', 'Linear')} onChange={e => updateProp('gradient', e.target.value)} />
        <SliderRow label="Thickness" min={1} max={20} value={getProp('thickness', 4)} onChange={e => updateProp('thickness', e.target.value)} />
        <SliderRow label="Spacing" min={0} max={20} value={getProp('spacing', 2)} onChange={e => updateProp('spacing', e.target.value)} />
      </SettingGroup>
      <SettingGroup title="Transform">
        <SliderRow label="Scale" min={10} max={200} value={getProp('scale', 100)} onChange={e => updateProp('scale', e.target.value)} />
        <SliderRow label="Rotation" min={0} max={360} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', e.target.value)} />
      </SettingGroup>
    </>
  );

  const updateEffectProp = (key, value) => {
    if (m3SelectedObjectId && setM3Objects) {
      setM3Objects(prev => prev.map(o => o.id === m3SelectedObjectId ? { ...o, props: { ...o.props, [key]: Number(value) } } : o));
    }
  };

  const getEffectProp = (key, def) => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      return obj?.props?.[key] !== undefined ? obj.props[key] : def;
    }
    return def;
  };

  const updateAudioBinding = (index, key, value) => {
    if (m3SelectedObjectId && setM3Objects) {
      setM3Objects(prev => prev.map(o => {
        if (o.id === m3SelectedObjectId) {
          const newBindings = [...(o.audioBindings || [])];
          if (!newBindings[index]) {
             newBindings[index] = { enabled: true, parameter: Object.keys(o.props || {})[0] || '', source: 'Bass', sensitivity: 100, min: 0, max: 100, attack: 20, release: 180 };
          }
          newBindings[index] = { ...newBindings[index], [key]: key === 'parameter' || key === 'source' ? value : Number(value) };
          return { ...o, audioBindings: newBindings };
        }
        return o;
      }));
    }
  };

  const getAudioBinding = (index, key, def) => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      return obj?.audioBindings?.[index]?.[key] !== undefined ? obj.audioBindings[index][key] : def;
    }
    return def;
  };

  const getEffectIcon = (type) => {
    switch (type) {
      case 'camera': return '📷';
      case 'glow': return '🌟';
      case 'particles': return '✨';
      case 'color': return '🎨';
      case 'blur': return '💧';
      case 'distortion': return '🌀';
      case 'retro': return '📼';
      case 'reactive': return '🎵';
      default: return '⚙️';
    }
  };

  const renderEffectsInspector = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    if (!obj || obj.type !== 'effect') return null;

    const props = obj.props || {};
    const keys = Object.keys(props);

    // Dictionary for UI language translation
    const labelMap = {
      'intensity': 'Strength',
      'baseIntensity': 'Strength',
      'beatMultiplier': 'Music Impact',
      'attack': 'Reaction Speed',
      'release': 'Smoothness',
      'threshold': 'Beat Detection',
      'impulse': 'Music Impact',
      'maxOffset': 'Shake Amount',
      'maxScale': 'Zoom Amount',
      'count': 'Density'
    };

    const getLabel = (k) => labelMap[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    const renderRawProps = () => {
      if (keys.length === 0) return <div className="text-[10px] text-gray-500">No editable properties</div>;
      
      return keys.map(k => {
        let min = 0; let max = 100;
        if (k === 'amount') max = 300;
        if (k === 'count') { min = 10; max = 500; }
        if (k === 'redOffset' || k === 'greenOffset' || k === 'blueOffset') { min = -50; max = 50; }
        if (k === 'intensity' || k === 'baseIntensity') max = 200;
        if (k === 'radius') max = 200;
        if (k === 'beatMultiplier') max = 300;
        if (k === 'maxOffset') max = 200;
        if (k === 'maxScale') { min = 100; max = 150; }
        if (k === 'attack' || k === 'release') max = 1000;
        
        if (typeof props[k] === 'string') {
            if (k === 'color') {
                 return (
                    <div key={k} className="flex justify-between items-center text-[11px] text-gray-300 mt-2 mb-2">
                      <span className="capitalize">{getLabel(k)}</span>
                      <input type="color" value={props[k]} onChange={e => {
                           if (m3SelectedObjectId && setM3Objects) {
                               setM3Objects(prev => prev.map(o => o.id === m3SelectedObjectId ? { ...o, props: { ...o.props, [k]: e.target.value } } : o));
                           }
                      }} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                    </div>
                 );
            }
            return null;
        }

        return <SliderRow key={k} label={getLabel(k)} min={min} max={max} value={getEffectProp(k, 0)} onChange={e => updateEffectProp(k, e.target.value)} />;
      });
    };

    // Quick Controls mapped to real underlying properties based on category
    const renderQuickControls = () => {
      if (obj.presetId === 'camera-shake') {
        return (
          <SettingGroup title="Quick Controls">
            <div className="flex flex-col gap-2 mb-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Motion</span>
              <div className="flex gap-1">
                <button onClick={() => updateEffectProp('baseIntensity', 5)} className={`flex-1 py-1.5 text-xs rounded ${props.baseIntensity <= 5 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Soft</button>
                <button onClick={() => updateEffectProp('baseIntensity', 10)} className={`flex-1 py-1.5 text-xs rounded ${props.baseIntensity > 5 && props.baseIntensity <= 15 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Natural ⭐</button>
                <button onClick={() => updateEffectProp('baseIntensity', 40)} className={`flex-1 py-1.5 text-xs rounded ${props.baseIntensity > 15 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Strong</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Music Sync</span>
              <div className="flex gap-1">
                <button onClick={() => updateEffectProp('beatMultiplier', 20)} className={`flex-1 py-1.5 text-xs rounded ${props.beatMultiplier <= 50 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Relaxed</button>
                <button onClick={() => updateEffectProp('beatMultiplier', 100)} className={`flex-1 py-1.5 text-xs rounded ${props.beatMultiplier > 50 && props.beatMultiplier <= 120 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Natural ⭐</button>
                <button onClick={() => updateEffectProp('beatMultiplier', 200)} className={`flex-1 py-1.5 text-xs rounded ${props.beatMultiplier > 120 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Aggressive</button>
              </div>
            </div>
          </SettingGroup>
        );
      }
      if (obj.presetId === 'zoom-pulse') {
        return (
          <div className="flex flex-col">
            <SettingGroup title="Quick Controls">
              <SliderRow label="Strength" min={100} max={150} value={getEffectProp('maxScale', 102)} onChange={e => updateEffectProp('maxScale', e.target.value)} />
              <SliderRow label="Speed" min={0} max={100} value={getEffectProp('speed', 50)} onChange={e => updateEffectProp('speed', e.target.value)} />
              <SliderRow label="Music Sync" min={0} max={300} value={getEffectProp('beatMultiplier', 100)} onChange={e => updateEffectProp('beatMultiplier', e.target.value)} />
            </SettingGroup>

            {showAdvanced ? (
              <>
                <button onClick={() => setShowAdvanced(false)} className="text-[10px] text-gray-400 font-bold mb-3 hover:text-white self-start">▲ Hide Advanced</button>
                <SettingGroup title="Advanced Properties">
                  {renderRawProps()}
                </SettingGroup>
              </>
            ) : (
              <button onClick={() => setShowAdvanced(true)} className="text-[10px] text-gray-400 font-bold mb-3 hover:text-white self-start">▼ Advanced</button>
            )}
          </div>
        );
      }
      if (obj.presetId === 'glow') {
        return (
          <SettingGroup title="Quick Controls">
            <div className="flex flex-col gap-2 mb-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Brightness</span>
              <div className="flex gap-1">
                <button onClick={() => updateEffectProp('intensity', 30)} className={`flex-1 py-1.5 text-xs rounded ${props.intensity <= 40 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Low</button>
                <button onClick={() => updateEffectProp('intensity', 80)} className={`flex-1 py-1.5 text-xs rounded ${props.intensity > 40 && props.intensity <= 100 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Medium ⭐</button>
                <button onClick={() => updateEffectProp('intensity', 150)} className={`flex-1 py-1.5 text-xs rounded ${props.intensity > 100 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>High</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Radius</span>
              <div className="flex gap-1">
                <button onClick={() => updateEffectProp('radius', 10)} className={`flex-1 py-1.5 text-xs rounded ${props.radius <= 15 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Small</button>
                <button onClick={() => updateEffectProp('radius', 40)} className={`flex-1 py-1.5 text-xs rounded ${props.radius > 15 && props.radius <= 60 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Medium</button>
                <button onClick={() => updateEffectProp('radius', 100)} className={`flex-1 py-1.5 text-xs rounded ${props.radius > 60 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Large ⭐</button>
              </div>
            </div>
          </SettingGroup>
        );
      }
      if (obj.presetId === 'snow') {
        return (
          <SettingGroup title="Quick Controls">
            <div className="flex flex-col gap-2 mb-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Density</span>
              <div className="flex gap-1">
                <button onClick={() => updateEffectProp('count', 50)} className={`flex-1 py-1.5 text-xs rounded ${props.count <= 100 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Light</button>
                <button onClick={() => updateEffectProp('count', 200)} className={`flex-1 py-1.5 text-xs rounded ${props.count > 100 && props.count <= 300 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Normal ⭐</button>
                <button onClick={() => updateEffectProp('count', 500)} className={`flex-1 py-1.5 text-xs rounded ${props.count > 300 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Heavy</button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Wind</span>
              <div className="flex gap-1">
                <button onClick={() => updateEffectProp('wind', 2)} className={`flex-1 py-1.5 text-xs rounded ${props.wind <= 5 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Calm</button>
                <button onClick={() => updateEffectProp('wind', 15)} className={`flex-1 py-1.5 text-xs rounded ${props.wind > 5 && props.wind <= 30 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Natural ⭐</button>
                <button onClick={() => updateEffectProp('wind', 80)} className={`flex-1 py-1.5 text-xs rounded ${props.wind > 30 ? 'bg-purple-600 text-white' : 'bg-[#2d3247] text-gray-400'}`}>Storm</button>
              </div>
            </div>
          </SettingGroup>
        );
      }
      
      // Fallback for others: just show top 2 props as sliders, rest hidden
      const topKeys = keys.slice(0, 2);
      if (topKeys.length > 0) {
         return (
           <SettingGroup title="Quick Controls">
             {topKeys.map(k => (
               <SliderRow key={k} label={getLabel(k)} min={0} max={k==='amount'||k==='intensity'?200:100} value={getEffectProp(k, 0)} onChange={e => updateEffectProp(k, e.target.value)} />
             ))}
           </SettingGroup>
         );
      }
      return null;
    };

    return (
      <div className="flex flex-col gap-2">
        {/* Large Effect Preview Block */}
        <div className="p-4 bg-gradient-to-b from-[#2a2d3e] to-[#1e2230] border-b border-[#2d3247] flex gap-4 items-center">
            <div className="w-16 h-16 rounded bg-[#11131a] flex items-center justify-center text-3xl border border-white/10 shadow-inner shrink-0">
                {getEffectIcon(obj.category)}
            </div>
            <div className="flex flex-col">
                <span className="text-lg font-bold text-white">{obj.name}</span>
                <span className="text-xs text-gray-400 mt-1">{obj.presetId === 'camera-shake' ? 'Adds rhythmic motion to the scene.' : 'Visual effect layer.'}</span>
            </div>
        </div>

        {/* Quick Controls */}
        <div className="px-2">
           {renderQuickControls()}
        </div>

        {/* Advanced Accordion */}
        <div className="px-2 pb-4 mt-2">
            <details className="group bg-[#1a1d27] border border-[#2d3247] rounded overflow-hidden">
                <summary className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#2d3247] transition-colors flex justify-between items-center outline-none">
                    <span>Customize</span>
                    <span className="text-gray-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-3 bg-[#11131a] border-t border-[#2d3247]">
                    <SettingGroup title="Advanced Properties">
                      {renderRawProps()}
                    </SettingGroup>
                    
                    <SettingGroup title="Audio Reactive">
                      <ToggleRow label="Enable Audio Reactive" checked={getAudioBinding(0, 'enabled', false)} onChange={e => updateAudioBinding(0, 'enabled', e.target.checked)} />
                      {getAudioBinding(0, 'enabled', false) && (
                        <div className="mt-4 space-y-3 pt-3 border-t border-[#2d3247]">
                           <SelectRow label="Parameter" options={keys.map(k=>({value:k, label:getLabel(k)}))} value={getAudioBinding(0, 'parameter', keys[0] || '')} onChange={e => updateAudioBinding(0, 'parameter', e.target.value)} />
                           <SelectRow label="Source" options={['Peak', 'Bass', 'Mid', 'Treble']} value={getAudioBinding(0, 'source', 'Bass')} onChange={e => updateAudioBinding(0, 'source', e.target.value)} />
                           <LiveAudioMeter source={getAudioBinding(0, 'source', 'Bass')} />
                           <SliderRow label="Sensitivity" min={0} max={200} value={getAudioBinding(0, 'sensitivity', 100)} onChange={e => updateAudioBinding(0, 'sensitivity', e.target.value)} />
                           <SliderRow label="Min Value" min={0} max={500} value={getAudioBinding(0, 'min', 0)} onChange={e => updateAudioBinding(0, 'min', e.target.value)} />
                           <SliderRow label="Max Value" min={0} max={500} value={getAudioBinding(0, 'max', 100)} onChange={e => updateAudioBinding(0, 'max', e.target.value)} />
                           <SliderRow label="Reaction Speed" min={0} max={1000} value={getAudioBinding(0, 'attack', 20)} onChange={e => updateAudioBinding(0, 'attack', e.target.value)} />
                           <SliderRow label="Smoothness" min={0} max={1000} value={getAudioBinding(0, 'release', 180)} onChange={e => updateAudioBinding(0, 'release', e.target.value)} />
                        </div>
                      )}
                    </SettingGroup>
                </div>
            </details>
        </div>
      </div>
    );
  };

  const handleLayerMove = (direction) => {
    if (!m3SelectedObjectId || !setM3Objects) return;
    setM3Objects(prev => {
        let updated = [...prev];
        const idx = updated.findIndex(o => o.id === m3SelectedObjectId);
        if (idx === -1) return prev;
        
        if (direction === 'up' && idx < updated.length - 1) {
            const temp = updated[idx].layer;
            updated[idx].layer = updated[idx+1].layer;
            updated[idx+1].layer = temp;
        } else if (direction === 'down' && idx > 0) {
            const temp = updated[idx].layer;
            updated[idx].layer = updated[idx-1].layer;
            updated[idx-1].layer = temp;
        } else if (direction === 'top') {
            const maxLayer = Math.max(...updated.map(o => o.layer || 0));
            updated[idx].layer = maxLayer + 1;
        } else if (direction === 'bottom') {
            const minLayer = Math.min(...updated.map(o => o.layer || 0));
            updated[idx].layer = minLayer - 1;
        }
        return updated.sort((a,b) => a.layer - b.layer);
    });
  };

  const handleReplaceMedia = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    if (!obj) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    if (obj.mediaType === 'image') input.accept = 'image/png, image/jpeg, image/jpg, image/webp, image/svg+xml';
    else if (obj.mediaType === 'video') input.accept = 'video/mp4, video/webm, video/quicktime';
    else if (obj.mediaType === 'gif') input.accept = 'image/gif';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        updateProp('source', objectUrl);
        updateProp('name', file.name);
    };
    input.click();
  };

  const renderOverlayInspector = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    const mediaType = obj?.mediaType || 'image';

    return (
    <>
      <SettingGroup title="Transform">
        <SliderRow label="Position X" min={-1000} max={3000} value={getProp('x', 0)} onChange={e => updateProp('x', Number(e.target.value))} />
        <SliderRow label="Position Y" min={-1000} max={2000} value={getProp('y', 0)} onChange={e => updateProp('y', Number(e.target.value))} />
        <SliderRow label="Width" min={10} max={3840} value={getProp('width', 400)} onChange={e => updateProp('width', Number(e.target.value))} />
        <SliderRow label="Height" min={10} max={2160} value={getProp('height', 400)} onChange={e => updateProp('height', Number(e.target.value))} />
        <SliderRow label="Scale" min={0.1} max={5} step={0.1} value={getProp('scale', 1)} onChange={e => updateProp('scale', Number(e.target.value))} />
        <SliderRow label="Rotation" min={-180} max={180} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', Number(e.target.value))} />
      </SettingGroup>
      
      <SettingGroup title="Appearance & Layer">
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', Number(e.target.value))} />
        <SelectRow label="Blend Mode" options={['Normal', 'Multiply', 'Screen', 'Overlay']} value={getProp('blend', 'Normal')} onChange={e => updateProp('blend', e.target.value)} />
        <div className="flex gap-2 justify-between mt-3">
            <ToggleRow label="Visible" checked={getProp('visible', true)} onChange={e => updateProp('visible', e.target.checked)} />
            <ToggleRow label="Locked" checked={getProp('locked', false)} onChange={e => updateProp('locked', e.target.checked)} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => handleLayerMove('up')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Bring Forward</button>
            <button onClick={() => handleLayerMove('down')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Send Backward</button>
            <button onClick={() => handleLayerMove('top')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Bring to Front</button>
            <button onClick={() => handleLayerMove('bottom')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Send to Back</button>
        </div>
      </SettingGroup>

      <SettingGroup title="Media">
        <button onClick={handleReplaceMedia} className="w-full bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[11px] py-2 rounded mb-3">Replace Media</button>
        
        {(mediaType === 'video' || mediaType === 'gif') && (
            <div className="flex gap-2 justify-between mt-2">
                <ToggleRow label="Loop" checked={getProp('loop', true)} onChange={e => updateProp('loop', e.target.checked)} />
            </div>
        )}
        {mediaType === 'video' && (
            <div className="flex gap-2 justify-between mt-2">
                <ToggleRow label="Mute" checked={getProp('muted', false)} onChange={e => updateProp('muted', e.target.checked)} />
            </div>
        )}
        {(mediaType === 'video' || mediaType === 'gif') && (
            <div className="mt-2">
                <SliderRow label="Playback Speed" min={0.1} max={3} step={0.1} value={getProp('playbackRate', 1)} onChange={e => updateProp('playbackRate', Number(e.target.value))} />
            </div>
        )}
      </SettingGroup>
      
      <div className="mt-4 px-3">
        <button onClick={() => {
            setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
        }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete Object</button>
      </div>
    </>
  );
  };

  const renderTextInspector = () => (
    <>
      <SettingGroup title="Text Content">
        <textarea 
          className="w-full bg-[#0c0d12] border border-[#2d3247] rounded p-2 text-xs text-gray-300 font-mono focus:border-green-500 outline-none resize-y min-h-[60px]"
          value={getProp('name', 'Custom Text')}
          onChange={e => updateProp('name', e.target.value)}
          placeholder="Enter text here..."
        />
      </SettingGroup>
      <SettingGroup title="Typography">
        <SelectRow label="Font" options={['Inter', 'Roboto', 'Outfit', 'monospace']} value={getProp('fontFamily', 'Inter')} onChange={e => updateProp('fontFamily', e.target.value)} />
        <SelectRow label="Weight" options={['Light', 'Normal', 'Bold', 'Black']} value={getProp('fontWeight', 'Normal')} onChange={e => updateProp('fontWeight', e.target.value)} />
        <SliderRow label="Size" min={10} max={200} value={getProp('fontSize', 64)} onChange={e => updateProp('fontSize', e.target.value)} />
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2 mb-2">
          <span>Color</span>
          <input type="color" value={getProp('color', '#ffffff')} onChange={e => updateProp('color', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
        <SelectRow label="Alignment" options={['Left', 'Center', 'Right']} value={getProp('align', 'Left')} onChange={e => updateProp('align', e.target.value)} />
        <SliderRow label="Letter Spacing" min={-10} max={50} value={getProp('letterSpacing', 0)} onChange={e => updateProp('letterSpacing', e.target.value)} />
        <SliderRow label="Line Height" min={0.5} max={3} value={getProp('lineHeight', 1.5)} onChange={e => updateProp('lineHeight', e.target.value)} />
      </SettingGroup>
      <SettingGroup title="Styling & Container">
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', e.target.value)} />
        <div className="flex justify-between items-center text-[11px] text-gray-300 mb-2">
          <span>Background Color</span>
          <input type="color" value={getProp('backgroundColor', 'transparent')} onChange={e => updateProp('backgroundColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
        <ToggleRow label="Auto Size" checked={getProp('autoSize', true)} onChange={e => updateProp('autoSize', e.target.checked)} />
        <ToggleRow label="Word Wrap" checked={getProp('wordWrap', true)} onChange={e => updateProp('wordWrap', e.target.checked)} />
      </SettingGroup>
      <SettingGroup title="Effects">
        <SliderRow label="Stroke" min={0} max={20} value={getProp('stroke', 0)} onChange={e => updateProp('stroke', e.target.value)} />
        <SliderRow label="Shadow" min={0} max={100} value={getProp('shadow', 0)} onChange={e => updateProp('shadow', e.target.value)} />
        <SliderRow label="Glow" min={0} max={100} value={getProp('glow', 0)} onChange={e => updateProp('glow', e.target.value)} />
        <SelectRow label="Gradient" options={['None', 'Linear', 'Vertical']} value={getProp('gradient', 'None')} onChange={e => updateProp('gradient', e.target.value)} />
        <SelectRow label="Animation" options={['None', 'Typewriter', 'Fade Sequence', 'Wave']} value={getProp('animation', 'None')} onChange={e => updateProp('animation', e.target.value)} />
      </SettingGroup>
    </>
  );

  const renderReactiveInspector = () => {
    const sensitivityMode = getProp('sensitivityMode', 'Normal');
    
    // Apply preset values when changing mode
    const handleSensitivityModeChange = (mode) => {
        updateProp('sensitivityMode', mode);
        if (mode === 'Low') {
            updateProp('amplitude', 50); updateProp('threshold', 60); updateProp('attack', 50); updateProp('release', 300); updateProp('smoothness', 80);
        } else if (mode === 'Normal') {
            updateProp('amplitude', 100); updateProp('threshold', 35); updateProp('attack', 15); updateProp('release', 180); updateProp('smoothness', 60);
        } else if (mode === 'High') {
            updateProp('amplitude', 150); updateProp('threshold', 10); updateProp('attack', 5); updateProp('release', 100); updateProp('smoothness', 30);
        }
    };

    return (
    <>
      <SettingGroup title="Source & Operation">
        <div className="mb-2">
            <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Source Channel</label>
            <select 
                className="w-full bg-[#11131a] border border-[#2d3247] text-white text-[11px] rounded p-1 outline-none focus:border-blue-500"
                value={getProp('source', 'energy')}
                onChange={e => updateProp('source', e.target.value)}
            >
                <optgroup label="Beat">
                    <option value="beat">Beat</option>
                    <option value="beatStrength">Beat Strength</option>
                </optgroup>
                <optgroup label="Energy">
                    <option value="master">Master</option>
                    <option value="energy">Energy</option>
                </optgroup>
                <optgroup label="Frequency">
                    <option value="kick">Kick</option>
                    <option value="bass">Bass</option>
                    <option value="lowMid">Low Mid</option>
                    <option value="mid">Mid</option>
                    <option value="highMid">High Mid</option>
                    <option value="treble">Treble</option>
                    <option value="vocal">Vocal</option>
                </optgroup>
                <optgroup label="Tempo">
                    <option value="bpm">BPM</option>
                    <option value="confidence">Confidence</option>
                </optgroup>
            </select>
        </div>
        <SelectRow label="Operation" options={['multiply', 'add', 'subtract', 'clamp', 'invert', 'remap']} value={getProp('operation', 'multiply')} onChange={e => updateProp('operation', e.target.value)} />
        <SelectRow label="Curve" options={['linear', 'easeIn', 'easeOut', 'easeInOut', 'spring', 'impulse']} value={getProp('curve', 'easeOut')} onChange={e => updateProp('curve', e.target.value)} />
      </SettingGroup>

      <SettingGroup title="Sensitivity">
        <SelectRow label="Mode" options={['Low', 'Normal', 'High', 'Custom']} value={sensitivityMode} onChange={e => handleSensitivityModeChange(e.target.value)} />
        
        {sensitivityMode === 'Custom' && (
            <div className="mt-3 space-y-2 border-t border-[#2d3247] pt-3">
                <SliderRow label="Amplitude" min={0} max={300} value={getProp('amplitude', 100)} onChange={e => updateProp('amplitude', e.target.value)} />
                <SliderRow label="Threshold" min={0} max={100} value={getProp('threshold', 35)} onChange={e => updateProp('threshold', e.target.value)} />
                <SliderRow label="Attack (ms)" min={1} max={500} value={getProp('attack', 15)} onChange={e => updateProp('attack', e.target.value)} />
                <SliderRow label="Release (ms)" min={10} max={1000} value={getProp('release', 180)} onChange={e => updateProp('release', e.target.value)} />
                <SliderRow label="Smoothness" min={0} max={100} value={getProp('smoothness', 60)} onChange={e => updateProp('smoothness', e.target.value)} />
            </div>
        )}
      </SettingGroup>
    </>
  );
  };

  const renderBrandingInspector = () => (
    <>
      <SettingGroup title="Transform">
        <SelectRow label="Position" options={['Center', 'Top Left', 'Top Right', 'Bottom Left', 'Bottom Right']} value={getProp('position', 'Center')} onChange={e => updateProp('position', e.target.value)} />
        <SliderRow label="Scale" min={10} max={200} value={getProp('scale', 100)} onChange={e => updateProp('scale', e.target.value)} />
      </SettingGroup>
      <SettingGroup title="Appearance">
        <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', e.target.value)} />
        <SliderRow label="Shadow" min={0} max={100} value={getProp('shadow', 50)} onChange={e => updateProp('shadow', e.target.value)} />
        <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2">
          <span>Brand Color</span>
          <input type="color" value={getProp('brandColor', '#3b82f6')} onChange={e => updateProp('brandColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
        </div>
      </SettingGroup>
      <SettingGroup title="Animation">
        <SelectRow label="Animation" options={['None', 'Fade In', 'Slide Up', 'Pop']} value={getProp('animation', 'None')} onChange={e => updateProp('animation', e.target.value)} />
        <SliderRow label="Fade Opacity" min={0} max={100} value={getProp('fade', 0)} onChange={e => updateProp('fade', e.target.value)} />
      </SettingGroup>
    </>
  );

  const updateRenderSetting = (key, value) => {
    if (setRenderSettings) {
      setRenderSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleOutputNameChange = (val) => {
    updateRenderSetting('outputName', val);
  };

  const handleOutputNameBlur = () => {
    if (renderSettings.outputName && !renderSettings.outputName.endsWith('.mp4')) {
      updateRenderSetting('outputName', renderSettings.outputName + '.mp4');
    }
  };

  const renderRenderInspector = () => {
    const isCustom = renderSettings.videoQuality === 'Custom';

    const handleVideoQualityChange = (q) => {
      updateRenderSetting('videoQuality', q);
    };

    const handleAudioQualityChange = (q) => {
      updateRenderSetting('audioQuality', q);
    };

    return (
      <>
        <SettingGroup title="Output Name">
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Filename" 
              value={renderSettings.outputName || ''} 
              onChange={e => handleOutputNameChange(e.target.value)}
              onBlur={handleOutputNameBlur}
              className="w-full bg-[#11131a] border border-[#2d3247] rounded px-3 py-2 text-[12px] text-white font-bold outline-none focus:border-blue-500 transition-colors" 
            />
          </div>
        </SettingGroup>

        <SettingGroup title="Video">
          <SelectRow label="Resolution" options={['720p', '1080p', '1440p', '4K']} value={renderSettings.resolution || '1080p'} onChange={e => updateRenderSetting('resolution', e.target.value)} />
          <SelectRow label="FPS" options={['24', '30', '60']} value={renderSettings.fps || '60'} onChange={e => updateRenderSetting('fps', e.target.value)} />
          <SelectRow label="Quality" options={['Draft', 'Standard', 'High', 'Ultra', 'Custom']} value={renderSettings.videoQuality || 'High'} onChange={e => handleVideoQualityChange(e.target.value)} />
        </SettingGroup>
        
        <SettingGroup title="Audio">
          <SelectRow label="Quality" options={['Standard', 'High', 'Lossless']} value={renderSettings.audioQuality || 'High'} onChange={e => handleAudioQualityChange(e.target.value)} />
        </SettingGroup>

        <div className="px-2 pb-4 mt-2">
            <details className="group bg-[#1a1d27] border border-[#2d3247] rounded overflow-hidden">
                <summary className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#2d3247] transition-colors flex justify-between items-center outline-none">
                    <span>Advanced Encoder Settings</span>
                    <span className="text-gray-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-3 bg-[#11131a] border-t border-[#2d3247]">
                    <SettingGroup title="Encoder Profile">
                        {isCustom ? (
                          <>
                            <SelectRow label="Codec" options={['H264', 'H265', 'AV1']} value={renderSettings.codec || 'H264'} onChange={e => updateRenderSetting('codec', e.target.value)} />
                            <SliderRow label="Bitrate (Mbps)" min={1} max={100} value={renderSettings.bitrate || 15} onChange={e => updateRenderSetting('bitrate', e.target.value)} />
                            <SliderRow label="CRF" min={0} max={51} value={renderSettings.crf || 23} onChange={e => updateRenderSetting('crf', e.target.value)} />
                            <SelectRow label="Pixel Format" options={['yuv420p', 'yuv422p', 'yuv444p', 'yuv420p10le', 'yuv444p10le']} value={renderSettings.pixelFormat || 'yuv420p'} onChange={e => updateRenderSetting('pixelFormat', e.target.value)} />
                            <SelectRow label="Color Space" options={['bt709', 'bt2020']} value={renderSettings.colorSpace || 'bt709'} onChange={e => updateRenderSetting('colorSpace', e.target.value)} />
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Codec</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Bitrate</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>CRF</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Pixel Format</span><span>(auto)</span></div>
                            <div className="flex justify-between text-[11px] text-gray-500"><span>Color Space</span><span>(auto)</span></div>
                          </div>
                        )}
                    </SettingGroup>
                    <SettingGroup title="Hardware & Engine">
                        <SliderRow label="Threads" min={1} max={32} value={renderSettings.threads || 8} onChange={e => updateRenderSetting('threads', e.target.value)} />
                        <SelectRow label="Priority" options={['Low', 'Normal', 'High']} value={renderSettings.priority || 'Normal'} onChange={e => updateRenderSetting('priority', e.target.value)} />
                        <ToggleRow label="Hardware Encode" checked={renderSettings.hardwareEncode !== false} onChange={e => updateRenderSetting('hardwareEncode', e.target.checked)} />
                        <ToggleRow label="Hardware Decode" checked={renderSettings.hardwareDecode !== false} onChange={e => updateRenderSetting('hardwareDecode', e.target.checked)} />
                    </SettingGroup>
                </div>
            </details>
        </div>
      </>
    );
  };

  const renderSocialWidgetInspector = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
    if (!obj) return null;
    return (
      <>
        <SettingGroup title="Transform">
          <SliderRow label="Position X" min={-1000} max={3000} value={getProp('x', 0)} onChange={e => updateProp('x', Number(e.target.value))} />
          <SliderRow label="Position Y" min={-1000} max={2000} value={getProp('y', 0)} onChange={e => updateProp('y', Number(e.target.value))} />
          <SliderRow label="Scale" min={0.1} max={5} step={0.1} value={getProp('scale', 1)} onChange={e => updateProp('scale', Number(e.target.value))} />
          <SliderRow label="Rotation" min={-180} max={180} value={getProp('rotation', 0)} onChange={e => updateProp('rotation', Number(e.target.value))} />
        </SettingGroup>
        
        <SettingGroup title="Appearance & Layer">
          <SliderRow label="Opacity" min={0} max={100} value={getProp('opacity', 100)} onChange={e => updateProp('opacity', Number(e.target.value))} />
          <div className="flex gap-2 justify-between mt-3">
              <ToggleRow label="Visible" checked={getProp('visible', true)} onChange={e => updateProp('visible', e.target.checked)} />
              <ToggleRow label="Locked" checked={getProp('locked', false)} onChange={e => updateProp('locked', e.target.checked)} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => handleLayerMove('up')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Bring Forward</button>
              <button onClick={() => handleLayerMove('down')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Send Backward</button>
              <button onClick={() => handleLayerMove('top')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Bring to Front</button>
              <button onClick={() => handleLayerMove('bottom')} className="bg-[#181922] hover:bg-[#1e2230] border border-[#2d3247] text-gray-300 text-[10px] py-1 rounded">Send to Back</button>
          </div>
        </SettingGroup>

        <SettingGroup title="Media">
          <SliderRow label="Playback Speed" min={0.1} max={3} step={0.1} value={getProp('playbackRate', 1)} onChange={e => updateProp('playbackRate', Number(e.target.value))} />
          <div className="flex gap-2 justify-between mt-2">
              <ToggleRow label="Loop" checked={getProp('loop', true)} onChange={e => updateProp('loop', e.target.checked)} />
          </div>
        </SettingGroup>

        <SettingGroup title="Advanced (Chroma Key)">
            <ToggleRow label="Enable Chroma Key" checked={getProp('chromaKey', true)} onChange={e => {
                updateProp('chromaKey', e.target.checked);
                updateProp('alphaMode', e.target.checked ? 'chroma' : 'alpha');
            }} />
            
            {getProp('chromaKey', true) && (
                <>
                    <div className="flex justify-between items-center text-[11px] text-gray-300 mt-2 mb-2">
                        <span>Key Color</span>
                        <input type="color" value={getProp('keyColor', '#00FF00')} onChange={e => updateProp('keyColor', e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" />
                    </div>
                    <SliderRow label="Similarity" min={0} max={1} step={0.01} value={getProp('similarity', 0.22)} onChange={e => updateProp('similarity', Number(e.target.value))} />
                    <SliderRow label="Smoothness" min={0} max={1} step={0.01} value={getProp('smoothness', 0.08)} onChange={e => updateProp('smoothness', Number(e.target.value))} />
                    <SliderRow label="Spill Suppression" min={0} max={1} step={0.01} value={getProp('spill', 0.15)} onChange={e => updateProp('spill', Number(e.target.value))} />
                </>
            )}
        </SettingGroup>
        
        <div className="mt-4 px-3">
          <button onClick={() => {
              setM3Objects(prev => prev.filter(o => o.id !== m3SelectedObjectId));
          }} className="w-full bg-red-900/30 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[11px] py-2 rounded">Delete Widget</button>
        </div>
      </>
    );
  };

  const getInspectorCategory = () => {
    if (m3SelectedObjectId) {
      const obj = m3Objects.find(o => o.id === m3SelectedObjectId);
      if (obj) {
        if (obj.type === 'text') return 'Text Objects';
        if (obj.type === 'visualizer') return 'Visualizer';
        if (obj.type === 'image' || obj.type === 'widget' || obj.type === 'logo') return 'Overlay';
        if (obj.type === 'social-widget') return 'Social Widget';
        if (obj.type === 'background') return 'Background';
        if (obj.type === 'playlist' || obj.type === 'track_list_column') return 'Playlist Audio';
        if (obj.type === 'effect') return 'Effects';
        if (obj.type === 'reactive') return 'Audio Reactive';
        if (obj.type === 'subtitle') return 'Subtitle';
      }
    }
    return activeCategory;
  };

  const renderContent = () => {
    const categoryToRender = getInspectorCategory();
    switch (categoryToRender) {
      case 'Background': return renderBackgroundInspector();
      case 'Playlist Audio': return renderPlaylistInspector();
      case 'Visualizer': return renderVisualizerInspector();
      case 'Effects': return renderEffectsInspector();
      case 'Overlay': return renderOverlayInspector();
      case 'Social Widget': return renderSocialWidgetInspector();
      case 'Text Objects': return renderTextInspector();
      case 'Audio Reactive': return renderReactiveInspector();
      case 'Branding': return renderBrandingInspector();
      case 'Render': return renderRenderInspector();
      case 'Subtitle': return renderSubtitleInspector();
      default: return <div className="text-gray-500 text-[11px] p-4 italic text-center">Select a category to view properties.</div>;
    }
  };

  return (
    <Surface variant={BackgroundVariants.Inspector} className="w-[280px] shrink-0 border-r border-[#21232d] flex flex-col h-full overflow-hidden">
      <div className="bg-[rgba(12,18,26,0.5)] px-4 py-3 border-b border-[#21232d] shadow-sm flex items-center justify-between shrink-0 relative z-10">
        <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-wide">Inspector</span>
        <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-800 font-bold max-w-[120px] truncate uppercase">
          {getInspectorCategory() || 'Global'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="flex flex-col gap-1">
          {renderContent()}
        </div>
      </div>
    </Surface>
  );
}
