import React from 'react';

export default function M1StatusIndicator({ status = 'idle', size = 'sm' }) {
  const isLarge = size === 'lg';
  const sizeClasses = isLarge ? 'w-3 h-3' : 'w-2 h-2';
  
  const colors = {
    idle: 'bg-gray-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]',
    active: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    success: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    error: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  };

  return (
    <div className={`rounded-full ${sizeClasses} ${colors[status]} ${status === 'active' ? 'animate-pulse' : ''} shrink-0`}></div>
  );
}
