import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text, children, position = 'top' }) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -mt-1 -translate-x-1/2 border-r border-b',
    bottom: 'bottom-full left-1/2 -mb-1 -translate-x-1/2 border-l border-t',
    right: 'right-full top-1/2 -mr-1 -translate-y-1/2 border-b border-l',
    left: 'left-full top-1/2 -ml-1 -translate-y-1/2 border-t border-r'
  };

  return (
    <div 
      className="relative inline-flex items-center ml-1 cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children || (
        <span className="w-3.5 h-3.5 rounded-full bg-gray-800/80 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-[9px] font-bold flex items-center justify-center transition-all shrink-0">
          ?
        </span>
      )}
      {isHovered && (
        <div className={`pointer-events-none absolute ${positionClasses[position] || positionClasses.top} z-[9999] w-52 rounded-md bg-[#181a20] border border-orange-500/50 p-2.5 text-[10px] text-gray-200 shadow-[0_4px_25px_rgba(0,0,0,0.85)] leading-relaxed text-left whitespace-normal font-normal backdrop-blur-md`}>
          {text}
          <div className={`absolute ${arrowClasses[position] || arrowClasses.top} h-2 w-2 bg-[#181a20] border-orange-500/50 rotate-45`}></div>
        </div>
      )}
    </div>
  );
}

