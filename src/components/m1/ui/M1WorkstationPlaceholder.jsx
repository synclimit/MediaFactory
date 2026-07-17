import React from 'react';

export default function M1WorkstationPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#030406] rounded-lg border border-[#1a1b23] shadow-inner">
      {/* Background technical grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* HUD Rings */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        <div className="absolute inset-0 border border-dashed border-gray-700 rounded-full animate-[spin_10s_linear_infinite]"></div>
        <div className="absolute inset-2 border border-gray-800 rounded-full"></div>
        <div className="absolute inset-4 border border-[var(--m1-border-primary)] rounded-full animate-[spin_6s_linear_infinite_reverse]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
        </div>
        
        {/* Core Icon */}
        <div className="w-10 h-10 bg-[#0a0c10] border border-[#2d3247] shadow-[inset_0_0_15px_rgba(0,0,0,1)] flex items-center justify-center rotate-45">
          <svg className="w-5 h-5 text-gray-600 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
      </div>
      
      {/* Engineering Text */}
      <h3 className="font-['Rajdhani'] text-[var(--m1-accent-orange)] font-bold text-[13px] tracking-[0.2em] uppercase mb-1">AWAITING PAYLOAD INJECTION</h3>
      <p className="font-['Roboto_Mono'] text-gray-500 text-[10px] uppercase tracking-widest">SCANNER IDLE // SYSTEM ONLINE</p>
    </div>
  );
}
