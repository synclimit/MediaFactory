import React from 'react';

export default function M1Parameters({ 
  m1TargetSegment, 
  setM1TargetSegment, 
  m1Watermark, 
  setM1Watermark, 
  m1Subscribe, 
  setM1Subscribe,
  selectedVideo
}) {
  const [isCustomMode, setIsCustomMode] = React.useState(![5, 6, 7, 8, 9, 10].includes(m1TargetSegment));
  
  // Sync custom mode if target segment changes from outside
  React.useEffect(() => {
    setIsCustomMode(![5, 6, 7, 8, 9, 10].includes(m1TargetSegment));
  }, [m1TargetSegment]);

  const slotCount = selectedVideo?.metadata?.durationSec && m1TargetSegment > 0 ? Math.floor(selectedVideo.metadata.durationSec / (m1TargetSegment * 60)) : 0;

  return (
    <div className="flex-[0.3] min-w-0 flex flex-col justify-center pl-6 border-l border-white/5">
      <h2 className="text-white font-black text-[18px] tracking-widest mb-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">DURASI SEGMENT</h2>
      <p className="text-gray-400 font-medium text-[12px] mb-3">Tentukan durasi untuk setiap video pendek</p>
      
      <div className="grid grid-cols-3 gap-2 mb-1 w-full">
        {[5, 6, 7, 8, 9, 10].map((val) => {
          const isActive = !isCustomMode && m1TargetSegment === val;
          return (
            <button
              key={val}
              onClick={() => { setIsCustomMode(false); setM1TargetSegment(val); }}
              className={`relative py-1.5 h-[34px] rounded-lg font-black text-[12px] transition-all duration-200 border ${
                isActive
                  ? 'bg-gradient-to-br from-orange-600 to-orange-500 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)]'
                  : 'bg-black/60 border-[#333] text-gray-400 hover:border-orange-500/50 hover:text-gray-200 hover:bg-[#1a1311]'
              }`}
            >
              {val} MENIT
              
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                  <svg className="w-2.5 h-2.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* HORIZONTAL CUSTOM DURATION MODE */}
      <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between gap-3 w-full">
        
        {/* Label Left */}
        <label className="flex items-center gap-2.5 cursor-pointer group shrink-0 select-none">
          <div className={`w-4 h-4 border flex items-center justify-center rounded transition-colors ${isCustomMode ? 'bg-orange-500 border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-black/50 border-[#444] group-hover:border-orange-500/50'}`}>
            {isCustomMode && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
          </div>
          <span className={`text-[12px] font-black tracking-widest uppercase transition-colors ${isCustomMode ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-400 group-hover:text-gray-300'}`}>
            Custom Duration
          </span>
          <input 
            type="checkbox" 
            className="hidden" 
            checked={isCustomMode} 
            onChange={(e) => {
              const checked = e.target.checked;
              setIsCustomMode(checked);
              if (checked) {
                if ([5, 6, 7, 8, 9, 10].includes(m1TargetSegment)) {
                  setM1TargetSegment(15);
                }
              } else {
                setM1TargetSegment(10);
              }
            }} 
          />
        </label>

        {/* Stepper + Input Right */}
        <div className={`flex items-center gap-1 bg-[#111218] border rounded-lg p-1 shadow-inner transition-all h-[34px] shrink-0 ${
          isCustomMode ? 'border-orange-500/70 bg-[#161822] shadow-[0_0_12px_rgba(249,115,22,0.15)] opacity-100' : 'border-[#2d3142] opacity-40 grayscale pointer-events-none'
        }`}>
          <button
            type="button"
            disabled={!isCustomMode || m1TargetSegment <= 1}
            onClick={() => setM1TargetSegment(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
            className="w-6 h-6 rounded bg-[#222533] hover:bg-orange-600 text-gray-300 hover:text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 shrink-0"
          >
            -
          </button>

          <input 
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={m1TargetSegment}
            disabled={!isCustomMode}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^0-9]/g, '');
              const val = parseInt(cleaned);
              setM1TargetSegment(isNaN(val) ? '' : val);
            }}
            onBlur={() => {
              if (!m1TargetSegment || m1TargetSegment < 1) {
                setM1TargetSegment(1);
              }
            }}
            className="w-8 bg-transparent text-white font-mono font-black text-[13px] text-center outline-none px-0.5"
          />

          <button
            type="button"
            disabled={!isCustomMode}
            onClick={() => setM1TargetSegment(prev => (parseInt(prev) || 0) + 1)}
            className="w-6 h-6 rounded bg-[#222533] hover:bg-orange-600 text-gray-300 hover:text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            +
          </button>
        </div>
      </div>
      
      <p className="text-gray-400 font-medium text-[11px] mt-2">
        Video akan dibagi menjadi <span className="text-orange-500 font-black text-[14px] px-1 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">{slotCount}</span> segment
      </p>

    </div>
  );
}
