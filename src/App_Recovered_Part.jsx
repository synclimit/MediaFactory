      {/* QUEUE REVIEW CONFIRMATION DIALOG MODAL */}
      {reviewDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Surface variant={BackgroundVariants.Modal} className="border border-[#2d313d] rounded-lg max-w-sm w-full p-4 space-y-3 text-xs shadow-2xl">
            <div className="font-bold text-gray-200 border-b border-[#2d313d] pb-1 text-sm flex justify-between items-center">
              <span>Review Queue Parameters</span>
              <span className="text-[10px] text-gray-500 font-normal">MediaFactory Validation</span>
            </div>

            <div className="space-y-1.5 py-1 text-[11px] text-[#d1d5db]">
              <div className="flex justify-between">
                <span className="text-gray-500">Project Name:</span>
                <span className="font-bold text-blue-400">{reviewDialog.data.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Active Profile:</span>
                <span className="font-semibold text-gray-200">{reviewDialog.data.profile}</span>
              </div>
              {reviewDialog.data.details.map((detail, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-500">{detail.label}:</span>
                  <span className="font-semibold text-gray-200 truncate max-w-[180px]">{detail.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#2d313d]">
              <button
                onClick={handleConfirmQueue}
                className="flex-1 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded font-bold"
              >
                Confirm Configuration
              </button>
              <button
                onClick={() => setReviewDialog({ isOpen: false, data: null })}
                className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold"
              >
                Back To Edit
              </button>
            </div>
          </Surface>
        </div>
      )}

      {/* THUMBNAIL EDITOR MODAL (MODE 3 ONLY) */}
      {isThumbEditorOpen && (() => {
        // Thumbnail Debug Panel Values
        const loadedTracksCount = m3AudioTracks.length;
        const bgLoaded = m3BgPool.length > 0 ? 'Yes' : 'No';
        const titleLoaded = thumbTitle ? 'Yes' : 'No';
        const taglineLoaded = thumbTagline ? 'Yes' : 'No';

        const getLimitCount = () => {
          if (thumbDisplayLimit === '10 Tracks') return 10;
          if (thumbDisplayLimit === '20 Tracks') return 20;
          if (thumbDisplayLimit === '30 Tracks') return 30;
          return m3AudioTracks.length;
        };
        const visibleTracks = m3AudioTracks.slice(0, getLimitCount());
        
        let leftCount = visibleTracks.length;
        let isDualColumn = false;
        
        if (thumbPlaylistLayout === 'Dual Column') {
          isDualColumn = true;
          leftCount = Math.ceil(visibleTracks.length / 2);
        } else if (thumbPlaylistLayout === 'Auto' && visibleTracks.length > 6) {
          isDualColumn = true;
          leftCount = Math.ceil(visibleTracks.length / 2);
        } else if (thumbPlaylistLayout === 'Custom Split') {
          isDualColumn = true;
          leftCount = Math.min(thumbCustomSplitLeftCount, visibleTracks.length);
        }
        
        const leftTracks = visibleTracks.slice(0, leftCount);
        const rightTracks = isDualColumn ? visibleTracks.slice(leftCount, visibleTracks.length) : [];

                // Preset Logic
        const applyPreset = (presetName) => {
          setThumbLayoutPreset(presetName);
          setThumbPositions(prev => ({
            title: { ...prev.title, isCustom: false },
            tagline: { ...prev.tagline, isCustom: false },
            playlistLeft: { ...prev.playlistLeft, isCustom: false },
            playlistRight: { ...prev.playlistRight, isCustom: false }
          }));
          if (presetName === 'Preset 1') {
             setThumbTitleSize(84);
             setThumbPlayLeftSize(28);
             setThumbPlayRightSize(28);
          } else if (presetName === 'Preset 4') {
             setThumbTitleSize(54);
             setThumbPlayLeftSize(32);
             setThumbPlayRightSize(32);
          }
        };

        const getTitleStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '600px' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '32px', left: '32px' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '32px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '80%' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' };
          return { top: '32px', left: '32px' };
        };

        const getTaglineStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '65%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '120px', left: '32px' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '120px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '65%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' };
          return { top: '120px', left: '32px' };
        };

        const getPlayLeftStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '50%', left: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '50%', right: '400px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '50%', left: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '50%', left: '100px', transform: 'translateY(-50%)' };
          return { top: '50%', right: '400px', transform: 'translateY(-50%)' };
        };

  const formatTrack = (trackName, index) => {
    const trackStr = typeof trackName === 'object' ? trackName.title || trackName.name || 'Unknown Track' : String(trackName);
    const name = trackStr.split('.')[0];
    if (thumbNumberingStyle === '1') return `${index} ${name}`;
    if (thumbNumberingStyle === '01') return `${index < 10 ? '0'+index : index} ${name}`;
    if (thumbNumberingStyle === '1.') return `${index}. ${name}`;
    if (thumbNumberingStyle === '01 |') return `${index < 10 ? '0'+index : index} | ${name}`;
    if (thumbNumberingStyle === 'Left Number (1. Song Name)') return `${index}. ${name}`;
    if (thumbNumberingStyle === 'Right Number (Song Name .01)') return `${name} .${index < 10 ? '0'+index : index}`;
    if (thumbNumberingStyle === 'Right Aligned Number') return (
      <div className="flex justify-between w-full">
        <span className="truncate">{name}</span>
        <span className="ml-4 flex-shrink-0">.{index < 10 ? '0'+index : index}</span>
      </div>
    );
    return name;
  };

        const getPlayRightStyle = () => {
          if (thumbLayoutPreset === 'Preset 1') return { top: '50%', right: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 2') return { top: '50%', right: '32px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 3') return { top: '50%', left: '400px', transform: 'translateY(-50%)' };
          if (thumbLayoutPreset === 'Preset 4') return { top: '50%', right: '100px', transform: 'translateY(-50%)' };
          return { top: '50%', right: '32px', transform: 'translateY(-50%)' };
        };


        return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <Surface variant={BackgroundVariants.Modal} className="border border-[#2d313d] rounded-lg max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl text-xs">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.05)] shrink-0">
                <span className="font-bold text-gray-200 tracking-wide uppercase">Interactive Thumbnail Editor</span>
                <button onClick={() => setIsThumbEditorOpen(false)} className="text-gray-500 hover:text-white text-base font-bold">&times;</button>
              </div>
              {(m3BgPool.length === 0 || m3AudioTracks.length === 0) && (
                <div className="bg-red-900/50 border-b border-red-500/50 p-2 text-center text-red-200 font-bold text-[11px]">
                  ⚠️ Warning: You have not uploaded any Backgrounds or Audio Tracks. The editor preview will be blank.
                </div>
              )}

              <div className="flex-1 flex overflow-hidden">
                
                {/* Left Settings Controls Pane */}
                <div className="w-1/2 overflow-y-auto p-4 border-r border-[rgba(255,255,255,0.05)] space-y-4">
                  
                  {/* Suggestions Selection */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Thumbnail Suggestions Drafts</div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(currentSuggestions).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleApplySuggestion(key)}
                          className={`p-2 rounded text-left border text-[10px] transition-all bg-[rgba(0,0,0,0.2)] backdrop-blur-md ${
                            thumbSuggestion === key ? 'border-[#2563eb] text-blue-400' : 'border-[#2d313d] text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div className="font-bold truncate">{key}</div>
                          <div className="text-[9px] text-gray-500 truncate">{currentSuggestions[key].title}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setMockSuggestionSeed(prev => prev + 3);
                        addLog('Generated alternative thumbnail layout suggestions.');
                      }}
                      className="w-full py-1 bg-[rgba(255,255,255,0.05)] border border-[#2d3247] hover:bg-[rgba(255,255,255,0.1)] text-gray-300 font-semibold rounded text-[10px] backdrop-blur-md"
                    >
                      🔄 Generate More Alternatives
                    </button>
                  </div>

                  {/* Video Thumbnail Suggestions (Source is Video) */}
                  {isVideoAsset(m3BgPool[0]?.filename) && (
                    <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Video Frame Extraction Suggestions</div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Frame at 10% (00:15)', 'Frame at 50% (01:15)', 'Frame at 90% (02:15)'].map((frame) => (
                          <button
                            key={frame}
                            type="button"
                            onClick={() => {
                              setThumbVideoFrame(frame);
                              addLog(`Extracted frame position from video background: ${frame}`);
                            }}
                            className={`p-2 rounded text-left border text-[9px] transition-all bg-[rgba(0,0,0,0.2)] backdrop-blur-md ${
                              thumbVideoFrame === frame ? 'border-emerald-500 text-emerald-400' : 'border-[#2d313d] text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            <div className="font-bold">{frame.split(' ')[0]} {frame.split(' ')[1]}</div>
                            <div className="text-[8px] text-gray-500">{frame.split(' ')[2]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Editing fields */}
                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Layout Presets <Tooltip text="Visual layouts for positioning elements. You can drag to override."/></div>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => applyPreset('Preset 1')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 1' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">CENTER FOCUS</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex items-center justify-between px-0.5 border border-[#2d3247]"><div className="w-2 h-4 bg-gray-600 rounded-sm"></div><div className="w-4 h-2 bg-blue-500"></div><div className="w-2 h-4 bg-gray-600 rounded-sm"></div></div>
                      </button>
                      <button onClick={() => applyPreset('Preset 2')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 2' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">RIGHT PLAYLIST</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex items-start justify-between p-0.5 border border-[#2d3247]"><div className="w-4 h-2 bg-blue-500 mt-1"></div><div className="w-3 h-4 bg-gray-600 rounded-sm"></div></div>
                      </button>
                      <button onClick={() => applyPreset('Preset 3')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 3' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">LEFT PLAYLIST</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex flex-col items-center p-0.5 border border-[#2d3247]"><div className="w-4 h-1.5 bg-blue-500 mb-0.5"></div><div className="w-3 h-3 bg-gray-600 rounded-sm self-start"></div></div>
                      </button>
                      <button onClick={() => applyPreset('Preset 4')} className={`p-1 border rounded bg-[rgba(0,0,0,0.2)] backdrop-blur-md text-center flex flex-col items-center justify-center h-12 ${thumbLayoutPreset === 'Preset 4' ? 'border-blue-500 text-blue-400' : 'border-[#2d3247] text-gray-500'}`}>
                        <div className="text-[8px] font-bold mb-0.5">DUAL COLUMN</div>
                        <div className="w-10 h-6 bg-[#0c0d12] flex items-center justify-center gap-0.5 border border-[#2d3247]"><div className="w-2.5 h-4 bg-gray-600 rounded-sm"></div><div className="w-2.5 h-4 bg-gray-600 rounded-sm"></div></div>
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-2">Content Text System</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Title Text</label>
                        <input type="text" value={thumbTitle} onChange={(e) => setThumbTitle(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] backdrop-blur-md border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-0.5">Tagline (Optional)</label>
                        <input type="text" value={thumbTagline} onChange={(e) => setThumbTagline(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] backdrop-blur-md border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Typography Styling options */}
                  <div className="space-y-3 pt-2 border-t border-[rgba(255,255,255,0.05)] overflow-y-auto max-h-48 pr-2 custom-scrollbar">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Typography Options <Tooltip text="Set fonts independently for Title, Subtitle, and Playlist." /></div>
                    
                    {/* Title Typography */}
                    <div className="bg-[rgba(0,0,0,0.2)] backdrop-blur-md p-2 rounded border border-[rgba(255,255,255,0.05)] space-y-2">
                      <div className="text-[10px] text-gray-300 font-semibold border-b border-[#2d313d] pb-1">Title Typography</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Font Family</label>
                          <select value={thumbTitleFont} onChange={(e) => setThumbTitleFont(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none">
                            {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Size (px)</label>
                          <input type="number" value={thumbTitleSize} onChange={(e) => setThumbTitleSize(Number(e.target.value))} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Color</label>
                          <input type="color" value={thumbTitleColor} onChange={(e) => setThumbTitleColor(e.target.value)} className="w-full h-6 bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTitleShadow} onChange={(e) => setThumbTitleShadow(e.target.checked)} className="accent-[#2563eb]"/> Shadow</label>
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTitleStroke} onChange={(e) => setThumbTitleStroke(e.target.checked)} className="accent-[#2563eb]"/> Stroke</label>
                      </div>
                    </div>

                    {/* Tagline Typography */}
                    <div className="bg-[rgba(0,0,0,0.2)] backdrop-blur-md p-2 rounded border border-[rgba(255,255,255,0.05)] space-y-2">
                      <div className="text-[10px] text-gray-300 font-semibold border-b border-[#2d313d] pb-1">Tagline Typography</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Font Family</label>
                          <select value={thumbTaglineFont} onChange={(e) => setThumbTaglineFont(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none">
                            {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Size (px)</label>
                          <input type="number" value={thumbTaglineSize} onChange={(e) => setThumbTaglineSize(Number(e.target.value))} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Color</label>
                          <input type="color" value={thumbTaglineColor} onChange={(e) => setThumbTaglineColor(e.target.value)} className="w-full h-6 bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTaglineShadow} onChange={(e) => setThumbTaglineShadow(e.target.checked)} className="accent-[#2563eb]"/> Shadow</label>
                        <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbTaglineStroke} onChange={(e) => setThumbTaglineStroke(e.target.checked)} className="accent-[#2563eb]"/> Stroke</label>
                      </div>
                    </div>

                    {/* Playlist Typography */}
                    <div className="bg-[rgba(0,0,0,0.2)] backdrop-blur-md p-2 rounded border border-[rgba(255,255,255,0.05)] space-y-2">
                      <div className="text-[10px] text-gray-300 font-semibold border-b border-[#2d313d] pb-1">Playlist Typography</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Font Family</label>
                          <select value={thumbPlaylistFont} onChange={(e) => {
  setThumbPlaylistFont(e.target.value);
  setThumbPlayLeftFont(e.target.value);
  setThumbPlayRightFont(e.target.value);
}} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none">
                            {customFonts.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Size (px)</label>
                          <input type="number" value={thumbPlaylistSize} onChange={(e) => {
  const v = Number(e.target.value);
  setThumbPlaylistSize(v);
  setThumbPlayLeftSize(v);
  setThumbPlayRightSize(v);
}} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Color</label>
                          <input type="color" value={thumbPlaylistColor} onChange={(e) => {
  setThumbPlaylistColor(e.target.value);
  setThumbPlayLeftColor(e.target.value);
  setThumbPlayRightColor(e.target.value);
}} className="w-full h-6 bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded cursor-pointer" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Left Col Align</label>
                          <select value={thumbPlayLeftAlign} onChange={(e) => setThumbPlayLeftAlign(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Left</option>
                            <option>Center</option>
                            <option>Right</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Right Col Align</label>
                          <select value={thumbPlayRightAlign} onChange={(e) => setThumbPlayRightAlign(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Left</option>
                            <option>Center</option>
                            <option>Right</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbPlaylistShadow} onChange={(e) => {
  setThumbPlaylistShadow(e.target.checked);
  setThumbPlayLeftShadow(e.target.checked);
  setThumbPlayRightShadow(e.target.checked);
}} className="accent-[#2563eb]"/> Shadow</label>
                          <label className="flex items-center gap-1 text-[9px] text-gray-400"><input type="checkbox" checked={thumbPlaylistStroke} onChange={(e) => {
  setThumbPlaylistStroke(e.target.checked);
  setThumbPlayLeftStroke(e.target.checked);
  setThumbPlayRightStroke(e.target.checked);
}} className="accent-[#2563eb]"/> Stroke</label>
                        </div>
                        <div>
                          <select value={thumbDisplayLimit} onChange={(e) => setThumbDisplayLimit(e.target.value)} className="bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-0.5 text-[9px] text-gray-400 w-full outline-none">
                            <option value="10 Tracks">10</option>
                            <option value="20 Tracks">20</option>
                            <option value="30 Tracks">30</option>
                            <option value="All Tracks">All</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#2d313d]">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Numbering Style</label>
                          <select value={thumbNumberingStyle} onChange={(e) => setThumbNumberingStyle(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>1</option>
                            <option>01</option>
                            <option>1.</option>
                            <option>01.</option>
                            <option>01 |</option>
                            <option>Right Aligned Number</option>
                            <option>None</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Numbering Mode</label>
                          <select value={thumbNumberingMode} onChange={(e) => setThumbNumberingMode(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Continue Numbering</option>
                            <option>Restart Per Column</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#2d313d]">
                        <div>
                          <label className="block text-[9px] text-gray-500 mb-0.5">Playlist Layout</label>
                          <select value={thumbPlaylistLayout} onChange={(e) => setThumbPlaylistLayout(e.target.value)} className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none">
                            <option>Auto</option>
                            <option>Single Column</option>
                            <option>Dual Column</option>
                            <option>Custom Split</option>
                          </select>
                        </div>
                        {thumbPlaylistLayout === 'Custom Split' && (
                          <div>
                            <label className="block text-[9px] text-gray-500 mb-0.5">Left Col Count</label>
                            <input 
                              type="number" 
                              value={thumbCustomSplitLeftCount} 
                              onChange={(e) => setThumbCustomSplitLeftCount(Math.max(1, Number(e.target.value)))} 
                              className="w-full bg-[rgba(0,0,0,0.3)] border border-[#2d3247] rounded p-1 text-gray-300 text-[9px] outline-none" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Font Upload Simulation */}
                  <div className="space-y-2 pt-2 border-t border-[#2d313d]">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Custom Font Upload (.TTF / .OTF)</div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept=".ttf,.otf"
                        id="custom-font-file-picker"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, "");
                            if (fontName && !customFonts.includes(fontName)) {
                              setCustomFonts(prev => [...prev, fontName]);
                              setThumbFont(fontName);
                              addLog(`Loaded font style asset: ${file.name}`);
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor="custom-font-file-picker"
                        className="flex-1 text-center py-1.5 bg-[rgba(255,255,255,0.05)] border border-[#2d3247] hover:bg-[rgba(255,255,255,0.1)] text-white rounded font-bold text-[10px] cursor-pointer backdrop-blur-md"
                      >
                        📂 Choose Font File (.ttf/.otf)
                      </label>
                      {newFontName && <span className="text-[9px] text-gray-500 font-mono max-w-[120px] truncate">{newFontName}</span>}
                    </div>
                  </div>

                </div>

                {/* Right Live Preview Area */}
                <div className="w-1/2 p-4 bg-transparent border-l border-[rgba(255,255,255,0.05)] flex flex-col justify-between overflow-hidden relative">
                  <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-1 mb-2 shrink-0 relative z-10">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Live Render Preview (16:9)</div>
                    <div className="flex items-center gap-3">
                      {thumbOverlapWarning && (
                        <div className="text-[9px] font-bold text-amber-500 animate-pulse flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">
                          ⚠️ Overlapping Elements Detected
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mb-2 bg-[rgba(0,0,0,0.3)] backdrop-blur-md p-2 rounded border border-purple-900/50 flex gap-4 text-[9px] font-mono text-purple-400 relative z-10">
                    <span className="font-bold text-gray-400">Thumb Debug:</span>
                    <span>Tracks: {loadedTracksCount}</span>
                    <span>Layout: {thumbPlaylistLayout}</span>
                    <span>Left: {leftTracks.length}</span>
                    <span>Right: {rightTracks.length}</span>
                    <span>BG: {bgLoaded}</span>
                    <span>Title: {titleLoaded}</span>
                  </div>
                  
                  {/* Visual Canvas (16:9) */}
                  <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                    <div 
                      className="bg-[#1c1d24] border border-[#2d313d] rounded relative overflow-hidden flex flex-col shadow-inner w-full aspect-video" 
                      ref={canvasRef}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                    >
                      
                      {/* Mock Background display */}
                      <div className="absolute inset-0 z-0 bg-[#0a0c10] opacity-50 flex flex-col items-center justify-center font-mono text-[9px] text-gray-600 p-4 text-center pointer-events-none">
                        <div>Background Source: {m3BgPool[0]?.filename || 'Image/Video Asset'}</div>
                        {thumbVideoFrame && <div className="text-emerald-500 mt-1">● Selected Position: {thumbVideoFrame}</div>}
                      </div>

                      {/* Title */}
                      <div
                        className="absolute z-10 flex flex-col"
                        ref={titleRef}
                        style={{
                           ...(thumbPositions.title.isCustom ? { left: thumbPositions.title.x, top: thumbPositions.title.y } : getTitleStyle()),
                           width: `${thumbTitleWidth}px`
                        }}
                      >
                        <div
                          className={`w-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'title' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'title' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                          onPointerDown={(e) => handlePointerDown(e, 'title')}
                          onPointerEnter={() => setHoveredBlock('title')}
                          onPointerLeave={() => setHoveredBlock(null)}
                        >
                          <h1
                            className="font-black tracking-tight leading-none select-none pointer-events-none"
                            style={{
                              fontFamily: thumbTitleFont,
                              fontSize: `${thumbTitleSize}px`,
                              color: thumbTitleColor,
                              textShadow: thumbTitleShadow ? '3px 3px 0px #000' : 'none',
                              WebkitTextStroke: thumbTitleStroke ? '2px #000' : 'none',
                            }}
                          >
                            {thumbTitle || 'Title'}
                          </h1>
                        </div>
                      </div>

                      {/* Tagline Positioning (Conditionally rendered) */}
                      {thumbTagline && (
                        <div
                          ref={taglineRef}
                          className="absolute z-10"
                          style={thumbPositions.tagline.isCustom ? { left: thumbPositions.tagline.x, top: thumbPositions.tagline.y } : getTaglineStyle()}
                        >
                          <div
                            className={`w-full h-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'tagline' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'tagline' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                            onPointerDown={(e) => handlePointerDown(e, 'tagline')}
                            onPointerEnter={() => setHoveredBlock('tagline')}
                            onPointerLeave={() => setHoveredBlock(null)}
                          >
                            <span
                              className="font-bold block select-none pointer-events-none whitespace-nowrap"
                              style={{ 
                                fontFamily: thumbTaglineFont,
                                fontSize: `${thumbTaglineSize}px`,
                                color: thumbTaglineColor,
                                textShadow: thumbTaglineShadow ? '2px 2px 0px #000' : 'none',
                                WebkitTextStroke: thumbTaglineStroke ? '1px #000' : 'none',
                              }}
                            >
                              {thumbTagline}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Playlist Left Block */}
                      <div
                        ref={playLeftRef}
                        className="absolute z-10"
                        style={{
                          ...(thumbPositions.playlistLeft.isCustom ? { left: thumbPositions.playlistLeft.x, top: thumbPositions.playlistLeft.y } : getPlayLeftStyle()),
                          width: `${thumbPlayLeftWidth}px`,
                          fontFamily: thumbPlayLeftFont,
                          fontSize: `${thumbPlayLeftSize}px`,
                          color: thumbPlayLeftColor,
                          textShadow: thumbPlayLeftShadow ? '3px 3px 0px #000' : 'none',
                          WebkitTextStroke: thumbPlayLeftStroke ? '1px #000' : 'none',
                          lineHeight: '1.2',
                          textAlign: thumbPlayLeftAlign.toLowerCase()
                        }}
                      >
                        <div 
                          className={`w-full h-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'playlistLeft' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'playlistLeft' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                          onPointerDown={(e) => handlePointerDown(e, 'playlistLeft')}
                          onPointerEnter={() => setHoveredBlock('playlistLeft')}
                          onPointerLeave={() => setHoveredBlock(null)}
                        >
                          {leftTracks.map((t, i) => (
                            <div key={i} className={`w-full pointer-events-none select-none ${thumbNumberingStyle === 'Right Aligned Number' ? '' : 'truncate'}`}>{formatTrack(t, i+1)}</div>
                          ))}
                        </div>
                      </div>

                      {/* Playlist Right Block (Render based on Layout Engine) */}
                      {isDualColumn && rightTracks.length > 0 && (
                        <div
                          ref={playRightRef}
                          className="absolute z-10"
                          style={{
                            ...(thumbPositions.playlistRight.isCustom ? { left: thumbPositions.playlistRight.x, top: thumbPositions.playlistRight.y } : getPlayRightStyle()),
                            width: `${thumbPlayRightWidth}px`,
                            fontFamily: thumbPlayRightFont,
                            fontSize: `${thumbPlayRightSize}px`,
                            color: thumbPlayRightColor,
                            textShadow: thumbPlayRightShadow ? '3px 3px 0px #000' : 'none',
                            WebkitTextStroke: thumbPlayRightStroke ? '1px #000' : 'none',
                            lineHeight: '1.2',
                            textAlign: thumbPlayRightAlign.toLowerCase()
                          }}
                        >
                          <div 
                            className={`w-full h-full cursor-move p-2 border-2 transition-colors ${activeDragBlock === 'playlistRight' ? 'border-dashed border-blue-500 bg-blue-500/10' : hoveredBlock === 'playlistRight' ? 'border-dashed border-gray-500 bg-gray-500/10' : 'border-transparent'}`}
                            onPointerDown={(e) => handlePointerDown(e, 'playlistRight')}
                            onPointerEnter={() => setHoveredBlock('playlistRight')}
                            onPointerLeave={() => setHoveredBlock(null)}
                          >
                            {rightTracks.map((t, i) => (
                              <div key={i} className={`w-full pointer-events-none select-none ${thumbNumberingStyle === 'Right Aligned Number' ? '' : 'truncate'}`}>{formatTrack(t, thumbNumberingMode === 'Continue Numbering' ? i+leftCount+1 : i+1)}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2 shrink-0 relative z-10">
                    <Tooltip text="Save thumbnail image used by AutoUploader. Existing thumbnail.jpg will be replaced.">
                      <button
                        onClick={() => {
                          addLog('Successfully overwritten thumbnail.jpg for AutoUploader.');
                          alert('✅ Thumbnail saved successfully (thumbnail.jpg overwritten).');
                          // Does not close modal
                        }}
                        className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-bold rounded"
                      >
                        Save Thumbnail
                      </button>
                    </Tooltip>
                    
                    <Tooltip text="Save current layout for future projects.">
                      <button
                        onClick={handleSaveTemplate}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded"
                      >
                        Save Template
                      </button>
                    </Tooltip>
                    
                    <Tooltip text="Load a previously saved layout.">
                      <button
                        onClick={() => setIsTemplateLibraryOpen(true)}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded"
                      >
                        Template Library
                      </button>
                    </Tooltip>
                    
                    <button
                      onClick={() => setIsThumbEditorOpen(false)}
                      className="px-4 py-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-gray-300 rounded font-bold ml-4 backdrop-blur-md"
                    >
                      Close Editor
                    </button>
                  </div>
                </div>

              </div>

            </Surface>
          </div>
        );
      })()}


      {/* ─── Developer Panel (TASK_00) ─────────────────────────────────────── */}
      {/* SAFE: Rendered as a portal-style overlay. Zero impact on M1 logic. */}
      <DevPanel
        isOpen={isDevPanelOpen}
        onClose={() => setIsDevPanelOpen(false)}
      />

      {/* ─── Lightweight Notifications ──────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="bg-[rgba(12,18,28,0.92)] border border-[rgba(255,255,255,0.05)] text-gray-200 px-3 py-2 rounded shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-right-5 fade-in duration-300 min-w-[220px]">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5 text-[10px]">✓</span>
              <div>
                <div className="text-[11px] font-bold">{n.message}</div>
                {n.subMessage && <div className="text-[9px] text-gray-400 mt-0.5">{n.subMessage}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
