import React from 'react';

export default function M1Divider() {
  return (
    <div className="w-[12px] h-full shrink-0 bg-[#07090c] border-x border-[#1a1b23] shadow-inner flex flex-col items-center py-8 relative">
      {/* Structural mounting bolts */}
      <div className="w-[4px] h-[4px] rounded-full bg-[#2d3247] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] mb-8"></div>
      <div className="w-[4px] h-[4px] rounded-full bg-[#2d3247] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] mb-auto"></div>
      
      {/* Recessed orange indicator track */}
      <div className="w-[2px] flex-1 bg-[#030406] rounded-full shadow-[inset_0_0_5px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center py-4">
        <div className="w-[2px] h-[30%] bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] opacity-50"></div>
      </div>
      
      <div className="w-[4px] h-[4px] rounded-full bg-[#2d3247] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] mt-auto"></div>
      <div className="w-[4px] h-[4px] rounded-full bg-[#2d3247] shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)] mt-8"></div>
    </div>
  );
}
