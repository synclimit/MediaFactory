const fs = require('fs');
let content = fs.readFileSync('src/components/m3/M3ObjectInspector.jsx', 'utf8');

const fxInspector = `
  const renderFxInspector = () => (
    <>
      <SettingGroup title="Color grade — look keseluruhan video">
        <div className="flex flex-wrap gap-2 mb-4">
            <button className="bg-purple-900 border border-purple-500 text-purple-200 text-[10px] px-3 py-1 rounded-full">Tanpa grade</button>
            <button className="bg-[#181922] hover:bg-white/5 border border-[#2d3247] text-gray-400 text-[10px] px-3 py-1 rounded-full">Hangat</button>
            <button className="bg-[#181922] hover:bg-white/5 border border-[#2d3247] text-gray-400 text-[10px] px-3 py-1 rounded-full">Dingin</button>
            <button className="bg-[#181922] hover:bg-white/5 border border-[#2d3247] text-gray-400 text-[10px] px-3 py-1 rounded-full">Vibrant</button>
            <button className="bg-[#181922] hover:bg-white/5 border border-[#2d3247] text-gray-400 text-[10px] px-3 py-1 rounded-full flex gap-1 items-center">Teal-orange <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1 rounded">Pro</span></button>
            <button className="bg-[#181922] hover:bg-white/5 border border-[#2d3247] text-gray-400 text-[10px] px-3 py-1 rounded-full flex gap-1 items-center">Noir <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1 rounded">Pro</span></button>
            <button className="bg-[#181922] hover:bg-white/5 border border-[#2d3247] text-gray-400 text-[10px] px-3 py-1 rounded-full flex gap-1 items-center">Vintage <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1 rounded">Pro</span></button>
        </div>
        <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-gray-300">Penyesuaian manual <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1 rounded ml-1">Pro</span></span>
            <button className="border border-white/10 text-[9px] px-2 py-0.5 rounded text-gray-400 hover:text-white">↺ Reset</button>
        </div>
        <SliderRow label="Eksposur (terang)" min={-100} max={100} value={0} onChange={() => {}} />
        <SliderRow label="Kontras" min={-100} max={100} value={0} onChange={() => {}} />
        <SliderRow label="Saturasi (warna)" min={-100} max={100} value={0} onChange={() => {}} />
      </SettingGroup>

      <SettingGroup title="Grain film">
        <div className="flex justify-between items-center mb-2">
            <ToggleRow label="" checked={true} onChange={() => {}} />
            <span className="bg-green-900/40 text-green-400 text-[8px] px-1.5 py-0.5 rounded border border-green-500/30">Free</span>
        </div>
        <SliderRow label="Kepekatan grain (40%)" min={0} max={100} value={40} onChange={() => {}} />
        <SelectRow label="Pemicu" options={['Selalu tampil', 'Mengikuti Beat']} value="Selalu tampil" onChange={() => {}} />
        <SelectRow label="Bentuk" options={['Halus', 'Kasar']} value="Halus" onChange={() => {}} />
        <SliderRow label="Ukuran (50%)" min={0} max={100} value={50} onChange={() => {}} />
        <SliderRow label="Kecepatan (1.00x)" min={0.1} max={3} step={0.1} value={1} onChange={() => {}} />
      </SettingGroup>

      <SettingGroup title="Guncang kamera">
        <div className="flex justify-between items-center mb-2">
            <ToggleRow label="" checked={true} onChange={() => {}} />
            <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1.5 py-0.5 rounded border border-purple-500/30">Pro</span>
        </div>
        <SliderRow label="Kekuatan guncang (20%)" min={0} max={100} value={20} onChange={() => {}} />
        <SelectRow label="Pemicu" options={['Ikuti Low (kick)', 'Selalu guncang']} value="Ikuti Low (kick)" onChange={() => {}} />
        <SelectRow label="Mode" options={['Ringan — cepat (disarankan)', 'Keras']} value="Ringan — cepat (disarankan)" onChange={() => {}} />
      </SettingGroup>

      <SettingGroup title="Beat FX — efek mengikuti irama">
        <ToggleRow label="Aktif" checked={true} onChange={() => {}} />
        <div className="mt-3 space-y-3">
            <SliderRow label="Intensitas keseluruhan (100%)" min={0} max={100} value={100} onChange={() => {}} />
            <ToggleRow label="Kurangi flashing (aman epilepsi)" checked={false} onChange={() => {}} />
            <ToggleRow label="Lindungi teks / lirik dari guncangan" checked={false} onChange={() => {}} />
        </div>
      </SettingGroup>

      <SettingGroup title="Rak efek (lanjutan)">
        <div className="space-y-3">
            {/* Scanline */}
            <div className="bg-[#14151c] border border-white/5 rounded p-3">
                <div className="flex justify-between items-center mb-3">
                    <ToggleRow label="Scanline" checked={true} onChange={() => {}} />
                    <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1.5 py-0.5 rounded border border-purple-500/30">Pro</span>
                </div>
                <SliderRow label="Kepekatan garis (50%)" min={0} max={100} value={50} onChange={() => {}} />
                <SelectRow label="Pemicu" options={['Selalu tampil', 'Beat']} value="Selalu tampil" onChange={() => {}} />
                <SelectRow label="Bentuk" options={['Turun', 'Naik']} value="Turun" onChange={() => {}} />
                <div className="flex justify-between text-[11px] text-gray-400 items-center my-2">
                    <span>Warna</span>
                    <div className="w-6 h-4 bg-white rounded border border-white/20"></div>
                </div>
                <SliderRow label="Ukuran (50%)" min={0} max={100} value={50} onChange={() => {}} />
                <SliderRow label="Kecepatan (1.00x)" min={0.1} max={3} step={0.1} value={1} onChange={() => {}} />
            </div>

            {/* Glitch */}
            <div className="bg-[#14151c] border border-white/5 rounded p-3">
                <div className="flex justify-between items-center mb-3">
                    <ToggleRow label="Glitch" checked={true} onChange={() => {}} />
                    <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1.5 py-0.5 rounded border border-purple-500/30">Pro</span>
                </div>
                <SliderRow label="Kekuatan glitch (35%)" min={0} max={100} value={35} onChange={() => {}} />
            </div>

            {/* Debu film tua */}
            <div className="bg-[#14151c] border border-white/5 rounded p-3">
                <div className="flex justify-between items-center mb-3">
                    <ToggleRow label="Debu film tua" checked={true} onChange={() => {}} />
                    <span className="bg-purple-900/40 text-purple-300 text-[8px] px-1.5 py-0.5 rounded border border-purple-500/30">Pro</span>
                </div>
                <SliderRow label="Kepekatan debu (40%)" min={0} max={100} value={40} onChange={() => {}} />
                <SelectRow label="Pemicu" options={['Selalu tampil', 'Beat']} value="Selalu tampil" onChange={() => {}} />
                <SliderRow label="Ukuran (50%)" min={0} max={100} value={50} onChange={() => {}} />
                <SliderRow label="Jumlah (50%)" min={0} max={100} value={50} onChange={() => {}} />
            </div>
        </div>
      </SettingGroup>
    </>
  );
`;

content = content.replace(
  '  const renderRenderInspector = () => {',
  fxInspector + '\n\n  const renderRenderInspector = () => {'
);

// Add it to the switch case
content = content.replace(
  "case 'Render': return renderRenderInspector();",
  "case 'Render': return renderRenderInspector();\n      case 'FX': return renderFxInspector();"
);

fs.writeFileSync('src/components/m3/M3ObjectInspector.jsx', content);
