import React from 'react';

export default function Tooltip({ text }) {
  return (
    <div className="group relative inline-block ml-1 cursor-pointer">
      <span className="text-[9px] text-gray-500 bg-[#2d313d] hover:bg-[#3f4556] rounded-full w-3 h-3 inline-flex items-center justify-center font-bold">?</span>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-48 -translate-x-1/2 rounded bg-[#1e2230] border border-[#2d313d] p-2 text-[10px] text-gray-300 shadow-xl opacity-0 transition-opacity group-hover:opacity-100 leading-normal">
        {text}
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1e2230] border-r border-b border-[#2d313d]"></div>
      </div>
    </div>
  );
}
