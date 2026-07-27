const fs = require('fs');
const file = 'd:/MediaFactory/src/components/m3/M3ObjectInspector.jsx';
let code = fs.readFileSync(file, 'utf8');

const startStr = "const renderReactiveInspector = () => {";
const endStr = "  };";

const start = code.indexOf(startStr);
// Find the closing brace of the function. We know it ends around line 1276.
const searchArea = code.substring(start, start + 10000);
// The function ends before `const renderBrandingInspector = () => {`
const end = code.indexOf("const renderBrandingInspector = () => {");
if(start === -1 || end === -1) {
    console.error("Could not find bounds");
    process.exit(1);
}

const replacement = `const renderReactiveInspector = () => {
    const obj = m3Objects.find(o => o.id === m3SelectedObjectId) || {};
    
    // UI Helpers specific to FX Inspector
    const renderTriggerDropdown = () => (
        <div className="mb-3">
            <label className="block text-[11px] text-gray-400 mb-1">Pemicu</label>
            <select 
                className="w-full bg-[#11131a] border border-[#2d3247] text-white text-[12px] rounded p-1.5 outline-none focus:border-blue-500"
                value={getProp('source', 'energy')}
                onChange={e => updateProp('source', e.target.value)}
            >
                <option value="none">Selalu tampil</option>
                <option value="kick">Ikuti Low (kick)</option>
                <option value="snare">Ikuti Mid (snare)</option>
                <option value="hihat">Ikuti High (hi-hat)</option>
                <option value="energy">Ikuti Energy</option>
            </select>
        </div>
    );

    const renderColorModeDropdown = (defaultMode = 'kustom') => (
        <div className="mb-3">
            <label className="block text-[11px] text-gray-400 mb-1">Mode warna</label>
            <select 
                className="w-full bg-[#11131a] border border-[#2d3247] text-white text-[12px] rounded p-1.5 outline-none focus:border-blue-500"
                value={getProp('colorMode', defaultMode)}
                onChange={e => updateProp('colorMode', e.target.value)}
            >
                <option value="kustom">Warna kustom</option>
                <option value="dinamis">Dinamis (siklus)</option>
                <option value="pelangi">Pelangi</option>
                <option value="cover">Ikuti palet cover</option>
            </select>
            {getProp('colorMode', defaultMode) === 'kustom' && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-gray-400">utama</span>
                    <input type="color" value={getProp('color', '#ffffff')} onChange={e => updateProp('color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#2d3247]" />
                </div>
            )}
        </div>
    );

    const pid = obj.presetId || '';

    // --- CUSTOM INSPECTORS PER EFFECT ---

    if (pid === 'moving-spotlights' || pid === 'stage-lasers') {
        return (
            <>
                <SettingGroup title={obj.name}>
                    <SliderRow label="Kecerahan lampu" min={0} max={100} value={getProp('intensity', 50)} onChange={e => updateProp('intensity', Number(e.target.value))} />
                    {renderTriggerDropdown()}
                    {renderColorModeDropdown('pelangi')}
                    <SelectRow label="Bentuk" options={['Kerucut sorot', 'Laser lurus', 'Lampu bulat']} value={getProp('shape', 'Kerucut sorot')} onChange={e => updateProp('shape', e.target.value)} />
                    <SliderRow label="Ukuran" min={10} max={100} value={getProp('size', 50)} onChange={e => updateProp('size', Number(e.target.value))} />
                    <SliderRow label="Jumlah" min={1} max={20} value={getProp('count', 4)} onChange={e => updateProp('count', Number(e.target.value))} />
                    <SliderRow label="Kecepatan" min={0.1} max={3.0} step={0.1} value={getProp('speed', 1.0)} onChange={e => updateProp('speed', Number(e.target.value))} />
                </SettingGroup>
            </>
        );
    }

    if (pid === 'border-bounce' || pid === 'camera-shake') {
        return (
            <>
                <SettingGroup title={obj.name}>
                    <SliderRow label="Kedalaman zoom" min={0} max={100} value={getProp('intensity', 40)} onChange={e => updateProp('intensity', Number(e.target.value))} />
                    {renderTriggerDropdown()}
                    <SelectRow label="Mode" options={['Ringan — cepat (disarankan)', 'Kasar — lambat', 'Halus — bergelombang']} value={getProp('mode', 'Ringan — cepat (disarankan)')} onChange={e => updateProp('mode', e.target.value)} />
                    <SelectRow label="Bentuk" options={['Masuk', 'Keluar', 'Bolak-balik']} value={getProp('shape', 'Masuk')} onChange={e => updateProp('shape', e.target.value)} />
                    <SliderRow label="Kecepatan (Recovery)" min={0.1} max={3.0} step={0.1} value={getProp('speed', 1.0)} onChange={e => updateProp('speed', Number(e.target.value))} />
                </SettingGroup>
            </>
        );
    }

    if (pid === 'strobe-light' || pid === 'red-alert' || pid === 'rgb-impact') {
        return (
            <>
                <SettingGroup title={obj.name}>
                    <SliderRow label="Terang kilat" min={0} max={100} value={getProp('intensity', 40)} onChange={e => updateProp('intensity', Number(e.target.value))} />
                    {renderTriggerDropdown()}
                    {renderColorModeDropdown('kustom')}
                    <SliderRow label="Kecepatan redaman" min={0.1} max={3.0} step={0.1} value={getProp('speed', 1.0)} onChange={e => updateProp('speed', Number(e.target.value))} />
                </SettingGroup>
            </>
        );
    }

    if (pid === 'stage-fog' || pid === 'confetti' || pid === 'cinematic-dust' || pid === 'space-particles' || pid === 'optical-bokeh' || pid === 'fireflies') {
        return (
            <>
                <SettingGroup title={obj.name}>
                    <SliderRow label="Kepadatan (Density)" min={10} max={200} value={getProp('density', 50)} onChange={e => updateProp('density', Number(e.target.value))} />
                    {renderTriggerDropdown()}
                    {renderColorModeDropdown('dinamis')}
                    <SliderRow label="Ukuran partikel" min={1} max={50} value={getProp('size', 10)} onChange={e => updateProp('size', Number(e.target.value))} />
                    <SliderRow label="Kecepatan angin" min={0.1} max={3.0} step={0.1} value={getProp('speed', 1.0)} onChange={e => updateProp('speed', Number(e.target.value))} />
                    <SliderRow label="Kedalaman (Z-Index)" min={0} max={100} value={getProp('depth', 80)} onChange={e => updateProp('depth', Number(e.target.value))} />
                </SettingGroup>
            </>
        );
    }

    if (pid === 'crt-scanlines' || pid === 'vhs-glitch' || pid === 'film-grain' || pid === 'vinyl-scratch' || pid === 'heatwave') {
        return (
            <>
                <SettingGroup title={obj.name}>
                    <SliderRow label="Intensitas distorsi" min={0} max={100} value={getProp('intensity', 50)} onChange={e => updateProp('intensity', Number(e.target.value))} />
                    {renderTriggerDropdown()}
                    <SliderRow label="Tingkat noise" min={0} max={100} value={getProp('noise', 60)} onChange={e => updateProp('noise', Number(e.target.value))} />
                    <SliderRow label="Garis warna" min={0} max={100} value={getProp('thickness', 10)} onChange={e => updateProp('thickness', Number(e.target.value))} />
                </SettingGroup>
            </>
        );
    }

    return (
        <>
            <SettingGroup title={obj.name || 'Pengaturan Efek'}>
                {renderTriggerDropdown()}
                <SliderRow label="Intensitas" min={0} max={100} value={getProp('intensity', 50)} onChange={e => updateProp('intensity', Number(e.target.value))} />
                <SliderRow label="Kecepatan" min={0.1} max={3.0} step={0.1} value={getProp('speed', 1.0)} onChange={e => updateProp('speed', Number(e.target.value))} />
                {renderColorModeDropdown('kustom')}
                
                {obj.props && Object.keys(obj.props).filter(k => !['intensity', 'speed', 'colorMode', 'color', 'source'].includes(k)).map(key => {
                    const val = obj.props[key];
                    if (typeof val === 'number') {
                        return <SliderRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} min={0} max={200} value={val} onChange={e => updateProps({ props: { ...obj.props, [key]: Number(e.target.value) } })} />;
                    }
                    return null;
                })}
            </SettingGroup>
        </>
    );
  };

  `;

code = code.substring(0, start) + replacement + code.substring(end);
fs.writeFileSync(file, code);
console.log('Patched M3ObjectInspector.jsx successfully');
