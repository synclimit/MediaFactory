import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useEffect
content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';")

# 2. Add isProcessing state and useEffect hook
hook_code = """
  // --- CARD EDITOR STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (links && links.trim().startsWith('http') && links !== "https://www.cnnindonesia.com/internasional/2024/05/23/presiden-as-joe-biden-kunjungi-vietnam") {
      setIsProcessing(true);
      
      const timer = setTimeout(() => {
        try {
          const urlObj = new URL(links);
          setSource(urlObj.hostname.replace('www.', ''));
        } catch(e) {}
        
        setHeadline('Apple Umumkan Visi Masa Depan di Event Tahunan');
        setSummary('Acara WWDC tahun ini membawa banyak kejutan besar, termasuk peluncuran sistem operasi yang terfokus penuh pada kecerdasan buatan.');
        setCategory('TEKNOLOGI');
        
        const today = new Date();
        setDate(`${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })} ${today.getFullYear()}`);
        
        setIsProcessing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [links]);
"""
content = content.replace("  // --- CARD EDITOR STATE ---", hook_code)

# 3. Add loading overlay on the visualizer card
card_end = """               {sourceEnabled && (
                 <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono border-t border-white/10 pt-3">
                    <span className="outline-none hover:ring-1 ring-orange-500/50" contentEditable suppressContentEditableWarning onBlur={e => setSource(e.currentTarget.textContent)}>Sumber: {source}</span>
                    <span>|</span>
                    <span className="outline-none hover:ring-1 ring-orange-500/50" contentEditable suppressContentEditableWarning onBlur={e => setDate(e.currentTarget.textContent)}>{date}</span>
                 </div>
               )}
            </div>"""

card_end_new = card_end + """
            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-white animate-pulse">Reading URL...</span>
              </div>
            )}
"""
content = content.replace(card_end, card_end_new)

# 4. Change AI Draft Ready to Processing
draft_header = """            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
              <CheckCircle2 size={12}/> Ready
            </div>"""
            
draft_header_new = """            {isProcessing ? (
              <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase animate-pulse">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> Processing...
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                <CheckCircle2 size={12}/> Ready
              </div>
            )}"""
content = content.replace(draft_header, draft_header_new)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("M5NewsCreator patched for auto-read!")
