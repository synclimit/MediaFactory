import React from 'react';
import M1StatusIndicator from './M1StatusIndicator';

export default function M1SectionHeader({ title, status = 'idle', className = '' }) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${className}`}>
      <M1StatusIndicator status={status} />
      <h3 className="font-['Rajdhani'] font-bold text-[11px] uppercase tracking-[0.15em] text-[var(--m1-accent-orange)]">
        {title}
      </h3>
      {/* Circuit trace decoration */}
      <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--m1-border-primary)] to-transparent relative ml-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-[var(--m1-border-primary)] rotate-45"></div>
      </div>
    </div>
  );
}
