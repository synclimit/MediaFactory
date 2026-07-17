import React from 'react';

export default function M1QueueSummaryModal({ m1QueueSummary, setM1QueueSummary, handleResetModeForm }) {
  if (!m1QueueSummary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Heavy Blur Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl"></div>
      
      {/* Modal Container */}
      <div className="relative bg-black/60 border border-emerald-500/50 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col items-center text-center animate-fade-glow">
        
        {/* Glowing Decorative Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-emerald-500 rounded-b-full shadow-[0_0_20px_rgba(16,185,129,1)]"></div>
        
        {/* Big Success Icon */}
        <div className="w-24 h-24 bg-emerald-950/50 rounded-full flex items-center justify-center border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-6 animate-slide-down">
          <svg className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>

        <h2 className="text-3xl font-bold text-gray-100 mb-2 drop-shadow-md">Queue Authorized</h2>
        <p className="text-gray-400 text-sm font-mono uppercase tracking-widest mb-8">Pipeline Registration Complete</p>

        {/* Dashboard Stat Grid */}
        <div className="grid grid-cols-2 gap-6 w-full mb-10">
          <div className="bg-black/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center">
            <span className="text-5xl font-bold text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-2">
              {m1QueueSummary.queuedCount}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Render Jobs</span>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center">
            <span className="text-5xl font-bold text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] mb-2">
              {m1QueueSummary.skippedCount}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Skipped (Dupes)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button 
            onClick={() => setM1QueueSummary(null)}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-white/10 transition-colors"
          >
            Keep Working
          </button>
          <button 
            onClick={handleResetModeForm}
            className="flex-1 py-4 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] rounded-xl border border-emerald-500/50 hover:border-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
          >
            New Session
          </button>
        </div>

      </div>
    </div>
  );
}
