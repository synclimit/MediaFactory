import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update dropdown options
old_dropdown = """                   <select value={cardTheme} onChange={e => setCardTheme(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                     <option value="Glass">Glass</option>
                     <option value="Solid Box">Solid Box</option>
                     <option value="Slanted">Slanted</option>
                     <option value="Accent Border">Accent Border</option>
                   </select>"""
new_dropdown = """                   <select value={cardTheme} onChange={e => setCardTheme(e.target.value)} className="w-full mt-1 bg-[#1a1c23] border border-[#333] rounded px-2 py-1.5 text-[11px] focus:border-orange-500 outline-none">
                     <option value="Glass Box">Glass Box</option>
                     <option value="Solid Box">Solid Box</option>
                     <option value="Slanted Bottom">Slanted Bottom</option>
                     <option value="Accent Left">Accent Left</option>
                     <option value="Gradient Overlay">Gradient Overlay</option>
                   </select>"""
if old_dropdown in content:
    content = content.replace(old_dropdown, new_dropdown)
else:
    print("Dropdown not found!")

# 2. Update Canvas Render
old_canvas = """            {/* Background Image Area */}
            <div className="absolute inset-0 z-0"
                 style={{
                    height: (cardTheme === 'Solid Box' || cardTheme === 'Accent Border') ? '50%' : '55%',
                    clipPath: cardTheme === 'Slanted' ? 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' : 'none',
                    borderBottom: cardTheme === 'Accent Border' ? `6px solid ${colorPrimary}` : 'none'
                 }}>
              <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-start justify-center">
                 {image ? (
                    <>
                       {/* Blurred Background to fill the empty space */}
                       <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125" style={{ backgroundImage: `url(${image})` }}></div>
                       {/* Main Image, fully visible, uncropped, aligned to top like mobile view */}
                       <img src={image} className="w-full h-auto max-h-full object-contain relative z-10" />
                    </>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-gray-700"/></div>
                 )}
                 {/* Fake image gradient */}
                 {cardTheme === 'Glass' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent z-20 pointer-events-none"
                         style={{ backgroundImage: `linear-gradient(to bottom, transparent 60%, ${colorBackground} 100%)` }}></div>
                 )}
              </div>
            </div>

            {/* Text Content Area */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 pb-8">
               {/* Removed category badge per user request */}
               
               <h2 key={`head-${headlineAnim}`} className={`font-bold leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(headlineAnim)}`}
                   style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor }}
                   contentEditable suppressContentEditableWarning
                   onBlur={e => setHeadline(e.currentTarget.textContent)}>{headline}</h2>
               
               <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-4 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(summaryAnim)}`}
                  style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor }}
                  contentEditable suppressContentEditableWarning
                  onBlur={e => setSummary(e.currentTarget.textContent)}>{summary}</p>
               
               {/* Removed source and date per user request */}
            </div>"""

new_canvas = """            {/* Background Image Area (Always Full Height) */}
            <div className="absolute inset-0 z-0 h-full">
              <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-start justify-center">
                 {image ? (
                    <>
                       <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110" style={{ backgroundImage: `url(${image})` }}></div>
                       <img src={image} className="w-full h-auto max-h-full object-contain relative z-10" />
                    </>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-gray-700"/></div>
                 )}
              </div>
            </div>

            {/* Text Box Content Area */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end">
               {/* Dynamic Theme Box Wrapper */}
               <div 
                  className={`relative flex flex-col justify-end ${
                      cardTheme === 'Glass Box' ? 'mx-4 mb-6 p-5 backdrop-blur-xl bg-black/40 border border-white/20 shadow-2xl' : 
                      cardTheme === 'Solid Box' ? 'mx-4 mb-6 p-5 shadow-2xl' :
                      cardTheme === 'Slanted Bottom' ? 'w-full p-6 pt-12' :
                      cardTheme === 'Accent Left' ? 'mx-4 mb-6 p-5 pl-6 shadow-2xl' :
                      cardTheme === 'Gradient Overlay' ? 'w-full p-5 pt-20' : 'p-5'
                  }`}
                  style={{
                      backgroundColor: (cardTheme === 'Solid Box' || cardTheme === 'Slanted Bottom' || cardTheme === 'Accent Left') ? colorBackground : 'transparent',
                      backgroundImage: cardTheme === 'Gradient Overlay' ? `linear-gradient(to top, ${colorBackground} 10%, transparent 100%)` : 'none',
                      borderRadius: (cardTheme === 'Glass Box' || cardTheme === 'Solid Box' || cardTheme === 'Accent Left') ? `${borderRadius}px` : '0px',
                      clipPath: cardTheme === 'Slanted Bottom' ? 'polygon(0 15%, 100% 0, 100% 100%, 0 100%)' : 'none',
                      borderLeft: cardTheme === 'Accent Left' ? `6px solid ${colorPrimary}` : 'none'
                  }}
               >
                   <h2 key={`head-${headlineAnim}`} className={`font-bold leading-[1.25] mb-3 drop-shadow-lg outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(headlineAnim)}`}
                       style={{ fontFamily: headlineFont, fontSize: `${headlineSize}px`, color: headlineColor }}
                       contentEditable suppressContentEditableWarning
                       onBlur={e => setHeadline(e.currentTarget.textContent)}>{headline}</h2>
                   
                   <p key={`sum-${summaryAnim}`} className={`leading-relaxed mb-1 drop-shadow-md outline-none hover:ring-2 ring-orange-500/50 rounded-sm cursor-text ${getAnimClass(summaryAnim)}`}
                      style={{ fontFamily: summaryFont, fontSize: `${summarySize}px`, color: summaryColor }}
                      contentEditable suppressContentEditableWarning
                      onBlur={e => setSummary(e.currentTarget.textContent)}>{summary}</p>
               </div>
            </div>"""

if old_canvas in content:
    content = content.replace(old_canvas, new_canvas)
else:
    print("Canvas logic not found!")

# 3. Change default state from Glass to Glass Box
content = content.replace("useState('Glass')", "useState('Glass Box')")

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Themed Boxes Patched Successfully!")
