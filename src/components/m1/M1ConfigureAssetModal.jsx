import React from 'react';
import M1WindowFrame from './ui/M1WindowFrame';
import M1MechanicalPanel from './ui/M1MechanicalPanel';
import M1SectionHeader from './ui/M1SectionHeader';
import M1Button from './ui/M1Button';
import M1Input from './ui/M1Input';
import { getApiUrl } from '../../utils/apiUrl';
import { downloadYoutubeThumbnail } from '../../utils/thumbnailDownloader';

// ─── CYBER TOGGLE SWITCH ───
function CyberToggle({ label, checked, onChange, title }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="flex items-center gap-1.5 cursor-pointer select-none group py-0.5"
      title={title || label}
    >
      <div
        className={`w-7 h-4 rounded-full transition-all duration-200 relative p-0.5 border ${
          checked
            ? 'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
            : 'bg-black/70 border-[#444] group-hover:border-gray-400'
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full transition-transform duration-200 ${
            checked
              ? 'translate-x-3 bg-white shadow-sm'
              : 'translate-x-0 bg-gray-400'
          }`}
        />
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider font-['Rajdhani'] transition-colors ${
          checked ? 'text-white drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]' : 'text-gray-400 group-hover:text-gray-300'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── UTILITIES ───
const cleanBaseFilename = (str) => {
  return (str || '').replace(/[^a-zA-Z0-9\s_-]/g, '_').replace(/\s+/g, ' ').trim();
};

const normalizeYoutubeUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.has('v')) {
      const videoId = parsed.searchParams.get('v');
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\//, '');
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

export default function M1ConfigureAssetModal({ slot, idx, updateM1Slot, closeModal }) {
  // AI Rephrase State
  const [isRephrasing, setIsRephrasing] = React.useState(false);
  const [rephraseStyle, setRephraseStyle] = React.useState('clean_rephrase');
  const [aiNotice, setAiNotice] = React.useState('');
  const [originalDescBackup, setOriginalDescBackup] = React.useState(null);
  const [isDownloadingThumb, setIsDownloadingThumb] = React.useState(false);
  const [thumbNotice, setThumbNotice] = React.useState('');

  if (!slot) return null;

  // Determine Active Thumbnail Source
  const isReady = slot?.isFetched || (slot?.sourceType === 'Audio File' && slot?.audio);
  let activeThumbnail = null;
  if (slot?.manualThumbnail) {
    activeThumbnail = slot.manualThumbnail;
  } else if (slot?.thumbnailPath && slot?.videoId) {
    activeThumbnail = getApiUrl(`/api/m1/thumbnail/view/${slot.videoId}`);
  } else if (slot?.thumbnailUrl) {
    activeThumbnail = slot.thumbnailUrl.startsWith('/') ? getApiUrl(slot.thumbnailUrl) : slot.thumbnailUrl;
  } else if (slot?.sourceType === 'YouTube URL' && (slot?.videoId || slot?.isFetched)) {
    activeThumbnail = getApiUrl(`/api/m1/thumbnail/view/${slot.videoId}`);
  }

  const handleDownloadThumbnail = async () => {
    if (!activeThumbnail) {
      alert('Belum ada thumbnail untuk diunduh. Silakan fetch link YouTube terlebih dahulu.');
      return;
    }
    setIsDownloadingThumb(true);
    setThumbNotice('');
    try {
      await downloadYoutubeThumbnail({
        videoId: slot?.videoId,
        thumbnailUrl: activeThumbnail,
        title: slot?.videoTitle || slot?.outputName,
        outputName: slot?.outputName
      });
      setThumbNotice('✅ Thumbnail berhasil diunduh!');
      setTimeout(() => setThumbNotice(''), 4000);
    } catch (e) {
      alert('Gagal mengunduh thumbnail: ' + e.message);
    } finally {
      setIsDownloadingThumb(false);
    }
  };

  const handleAiRephrase = async () => {
    const currentDesc = slot?.originalDesc || slot?.cleanedDesc;
    if (!currentDesc || currentDesc.trim() === '') {
      alert('Deskripsi masih kosong. Silakan fetch video atau ketik deskripsi terlebih dahulu.');
      return;
    }
    setIsRephrasing(true);
    setAiNotice('');
    try {
      if (!originalDescBackup) {
        setOriginalDescBackup(currentDesc);
      }
      const res = await fetch(getApiUrl('/api/v1/ai/rephrase'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentDesc,
          promptStyle: rephraseStyle || 'clean_rephrase',
          tone: 'engaging, informative, professional',
          maxLength: 800
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.result) {
        updateM1Slot(idx, 'cleanedDesc', data.result);
        setAiNotice('✨ Deskripsi berhasil di-rephrase dengan AI!');
        setTimeout(() => setAiNotice(''), 4000);
      } else {
        throw new Error(data.error || 'Gagal merephrase deskripsi.');
      }
    } catch (err) {
      alert('Gagal AI rephrase: ' + err.message);
    } finally {
      setIsRephrasing(false);
    }
  };

  const handleRevertDesc = () => {
    if (originalDescBackup) {
      updateM1Slot(idx, 'originalDesc', originalDescBackup);
      updateM1Slot(idx, 'cleanedDesc', originalDescBackup);
      setOriginalDescBackup(null);
      setAiNotice('↩ Teks asli dipulihkan');
      setTimeout(() => setAiNotice(''), 3000);
    }
  };

  const handleFetchYoutube = async () => {
    if (!slot?.youtubeUrl) {
      alert('Silakan masukkan link YouTube terlebih dahulu.');
      return;
    }
    const cleanUrl = normalizeYoutubeUrl(slot.youtubeUrl);
    updateM1Slot(idx, 'youtubeUrl', cleanUrl);
    updateM1Slot(idx, 'isFetching', true);
    updateM1Slot(idx, 'fetchStatusText', 'CONNECTING...');
    try {
      const targetApiUrl = getApiUrl('/api/m1/youtube/fetch');
      const res = await fetch(targetApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Server backend error (${res.statusText || 'Endpoint unavailable'})`);
      }
      if (!res.body) {
        throw new Error('Streaming response body is unavailable.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.error) {
                alert('YouTube Fetch Error:\n\n' + data.error);
                break;
              }
              if (data.statusText) updateM1Slot(idx, 'fetchStatusText', data.statusText);
              if (data.progress !== undefined) updateM1Slot(idx, 'fetchProgress', data.progress);
              if (data.metadata || data.done || data.videoId || data.title) {
                const meta = data.metadata || data;
                const vId = meta.videoId || data.videoId || slot?.videoId;
                const rawTitle = meta.title || data.title || vId || `Slot_${idx + 1}_Audio`;
                const cleanTitle = cleanBaseFilename(rawTitle);

                const allUpdates = {
                  videoTitle: rawTitle,
                  channelName: meta.channelName || meta.uploader || meta.channel || 'YouTube Source',
                  videoId: vId,
                  thumbnailUrl: (meta.thumbnailUrl && !meta.thumbnailUrl.startsWith('http') ? getApiUrl(meta.thumbnailUrl) : meta.thumbnailUrl) || (vId ? getApiUrl(`/api/m1/thumbnail/view/${vId}`) : null),
                  originalDesc: meta.description || data.description || "Metadata Fetched automatically via backend integration.",
                  cleanedDesc: meta.description || data.description || "Metadata Fetched automatically via backend integration.",
                  duration: meta.durationDisplay || data.durationDisplay || "0m 00s",
                  outputName: `${cleanTitle}.mp4`,
                  isFetched: true,
                  isApproved: true
                };

                if (data.audioPath || meta.audioPath) {
                  allUpdates.audio = data.audioPath || meta.audioPath;
                }
                if (data.thumbnailPath || meta.thumbnailPath) {
                  allUpdates.thumbnailPath = data.thumbnailPath || meta.thumbnailPath;
                }

                updateM1Slot(idx, allUpdates);
              }
            } catch (e) {
              if (e.message && !e.message.startsWith('Unexpected end')) {
                console.error(e);
              }
            }
          }
        }
      }
    } catch (e) {
      alert('Fetch Error:\n\n' + e.message);
    } finally {
      updateM1Slot(idx, 'isFetching', false);
      updateM1Slot(idx, 'fetchProgress', 0);
      updateM1Slot(idx, 'fetchStatusText', '');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[60px]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={closeModal}></div>

      <M1WindowFrame className="w-[96vw] max-w-[1360px] h-[88vh] max-h-[760px] animate-fade-in flex flex-col shadow-2xl border border-[#3b3f54] relative overflow-hidden bg-[#161822]">
        
        {/* Top Orange Laser Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/20 via-orange-500 to-orange-600/20 shadow-[0_0_12px_rgba(249,115,22,0.8)] z-30 pointer-events-none"></div>

        {/* WORKSTATION HEADER */}
        <div className="flex items-center justify-between px-6 h-[54px] shrink-0 border-b border-[#2d3142] relative z-20 bg-[#1c1e29] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] animate-pulse shrink-0"></div>
            <h2 className="font-['Rajdhani'] font-bold text-base uppercase tracking-[0.2em] text-white flex items-center gap-2">
              ASSET CONFIGURATION <span className="text-gray-600">/</span> <span className="text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]">UPLINK SLOT {String(idx + 1).padStart(2, '0')}</span>
            </h2>
            <div className="hidden lg:flex items-center gap-1.5 ml-4 opacity-60">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-orange-500"></div>
              <div className="w-1.5 h-1.5 bg-orange-500 rotate-45 shadow-[0_0_6px_rgba(249,115,22,1)]"></div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-orange-500 to-transparent"></div>
            </div>
          </div>
          <button onClick={closeModal} className="text-gray-400 hover:text-orange-400 transition-colors p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* WORKSTATION BODY (2-Column Sleek Layout with Crisp Accent Details) */}
        <div className="flex flex-row flex-1 min-h-0 relative z-10 bg-[#14151e] overflow-hidden">
          
          {/* LEFT PANEL: SOURCE PARAMETERS, 4 OVERLAYS & EMBEDDED DESCRIPTION */}
          <M1MechanicalPanel className="w-[47%] h-full flex flex-col p-6 gap-3.5 overflow-hidden border-r border-[#262938]">
            <M1SectionHeader title="SOURCE PARAMETERS & METADATA" status="active" />
            
            <div className="flex flex-col flex-1 gap-3.5 min-h-0">
              
              {/* Source Type Toggle with Accent Borders */}
              <div className="flex bg-[#0f1016] p-1 rounded-lg border border-[#2d3142] h-[36px] shrink-0 relative">
                {['YouTube URL', 'Audio File'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`flex-1 font-['Rajdhani'] font-bold text-[11px] uppercase tracking-widest rounded transition-all duration-150 relative z-10 cursor-pointer ${
                      (slot?.sourceType || 'YouTube URL') === type 
                        ? 'bg-[#252838] text-orange-400 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                    }`}
                    onClick={() => {
                      if ((slot?.sourceType || 'YouTube URL') === type) return;
                      updateM1Slot(idx, 'sourceType', type);
                      if (type === 'Audio File') {
                        updateM1Slot(idx, 'youtubeUrl', '');
                        updateM1Slot(idx, 'isFetched', false);
                      } else {
                        updateM1Slot(idx, 'audio', '');
                      }
                    }}
                  >
                    {type === 'YouTube URL' ? 'YouTube Source' : 'Audio File'}
                  </button>
                ))}
              </div>

              {/* Source Input Row */}
              <div className="shrink-0">
                {slot?.sourceType === 'Audio File' ? (
                  <div className="flex gap-2 items-end">
                    <M1Input 
                      label="LOCAL AUDIO SOURCE FILE" 
                      value={slot?.audio || ''} 
                      onChange={(e) => updateM1Slot(idx, 'audio', e.target.value)} 
                      placeholder="e.g. D:\Audio\track.mp3" 
                      className="flex-1"
                    />
                    <input
                      type="file"
                      accept="audio/*"
                      id={`single-audio-browse-${idx}`}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const filePath = file.path || file.name;
                          updateM1Slot(idx, 'audio', filePath);
                          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                          const cleanBase = cleanBaseFilename(baseName);
                          updateM1Slot(idx, 'outputName', `${cleanBase}.mp4`);
                          updateM1Slot(idx, 'videoTitle', baseName);
                          updateM1Slot(idx, 'isApproved', true);

                          try {
                            const probeRes = await fetch(getApiUrl('/api/m1/audio/probe'), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: filePath })
                            });
                            const probeData = await probeRes.json();
                            if (probeData.durationDisplay) updateM1Slot(idx, 'duration', probeData.durationDisplay);
                          } catch {
                            // ignore probe failure
                          }
                        }
                      }}
                    />
                    <M1Button
                      variant="secondary"
                      onClick={() => document.getElementById(`single-audio-browse-${idx}`)?.click()}
                      className="!px-5 shrink-0"
                    >
                      BROWSE
                    </M1Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-end">
                    <M1Input 
                      label="SOURCE YOUTUBE URL" 
                      value={slot?.youtubeUrl || ''} 
                      onChange={(e) => {
                        updateM1Slot(idx, 'youtubeUrl', e.target.value);
                        updateM1Slot(idx, 'isFetched', false);
                      }} 
                      placeholder="https://youtube.com/watch?v=..." 
                      className="flex-1"
                    />
                    <M1Button
                      variant="primary"
                      disabled={slot?.isFetching || !slot?.youtubeUrl}
                      onClick={handleFetchYoutube}
                      className="!px-5 shrink-0"
                    >
                      {slot?.isFetching ? 'FETCHING...' : 'FETCH'}
                    </M1Button>
                  </div>
                )}
              </div>

              {/* 4 WORKSPACE OVERLAYS TOGGLE SUBPANEL (With Orange Accent Border) */}
              <div className="bg-[#181a24] p-3 rounded-lg border border-[#2d3142] hover:border-orange-500/30 shrink-0 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-colors">
                <div className="flex items-center justify-between border-b border-[#252838] pb-1.5">
                  <span className="font-['Rajdhani'] font-bold text-[10px] uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-sm shadow-[0_0_6px_rgba(249,115,22,1)]"></span>
                    DEFAULT WORKSPACE OVERLAYS
                  </span>
                  <span className="font-['Roboto_Mono'] text-[9px] text-gray-500 uppercase">
                    BRANDING ASSETS
                  </span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                  <CyberToggle
                    label="Subscribe"
                    checked={Boolean(slot?.useSubscribe)}
                    onChange={(val) => updateM1Slot(idx, 'useSubscribe', val)}
                    title="Animasi subscribe dari workspace settings"
                  />
                  <CyberToggle
                    label="Overlay"
                    checked={Boolean(slot?.useOverlay)}
                    onChange={(val) => updateM1Slot(idx, 'useOverlay', val)}
                    title="Template overlay frame dari workspace settings"
                  />
                  <CyberToggle
                    label="Logo"
                    checked={Boolean(slot?.useLogoChannel)}
                    onChange={(val) => updateM1Slot(idx, 'useLogoChannel', val)}
                    title="Logo channel dari workspace settings"
                  />
                  <CyberToggle
                    label="Watermark"
                    checked={Boolean(slot?.useWatermark)}
                    onChange={(val) => updateM1Slot(idx, 'useWatermark', val)}
                    title="Watermark dari workspace settings"
                  />
                </div>
              </div>

              {/* DIRECT EMBEDDED DESCRIPTION TERMINAL */}
              <div className="flex-1 flex flex-col min-h-[220px] bg-[#0f1017] border border-[#2d3142] hover:border-orange-500/30 rounded-lg p-3.5 shadow-inner relative overflow-hidden transition-colors">
                <div className="flex items-center justify-between border-b border-[#252838] pb-2 mb-2 shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-['Rajdhani'] font-bold text-[11px] uppercase tracking-widest text-orange-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,1)]"></span>
                      METADATA DESCRIPTION
                    </span>
                    {aiNotice && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded shadow-sm animate-pulse">
                        {aiNotice}
                      </span>
                    )}
                  </div>

                  {/* AI REPHRASE CONTROLS */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={rephraseStyle}
                      onChange={(e) => setRephraseStyle(e.target.value)}
                      disabled={isRephrasing}
                      className="bg-[#181a24] border border-[#33384c] text-gray-300 hover:text-white text-[10px] font-bold rounded px-2 py-1 outline-none cursor-pointer focus:border-orange-500/50"
                      title="Gaya Rephrase AI"
                    >
                      <option value="clean_rephrase">✨ Clean & Polish (Smart)</option>
                      <option value="seo_rich">🚀 SEO & Hashtag Boost</option>
                      <option value="short_catchy">⚡ Ringkas & Catchy</option>
                      <option value="translate_id">🇮🇩 Terjemah Bahasa Indo</option>
                      <option value="translate_en">🇬🇧 Translate to English</option>
                    </select>

                    <button
                      type="button"
                      disabled={isRephrasing || !(slot?.originalDesc || slot?.cleanedDesc)}
                      onClick={handleAiRephrase}
                      className="bg-gradient-to-r from-purple-600 via-orange-500 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-[10px] tracking-wider uppercase px-3 py-1 rounded shadow-[0_0_12px_rgba(249,115,22,0.4)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-white/20"
                      title="Rephrase deskripsi menggunakan AI cerdas"
                    >
                      {isRephrasing ? (
                        <>
                          <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>REPHRASING...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>AI REPHRASE</span>
                        </>
                      )}
                    </button>

                    {originalDescBackup && (
                      <button
                        type="button"
                        onClick={handleRevertDesc}
                        className="bg-[#1f2230] hover:bg-[#2a2e40] text-gray-300 hover:text-white text-[10px] font-bold px-2 py-1 rounded border border-[#33384c] transition-colors cursor-pointer"
                        title="Kembalikan ke deskripsi sebelum di-rephrase"
                      >
                        ↩ Original
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={slot?.originalDesc || slot?.cleanedDesc || ''}
                  onChange={(e) => {
                    updateM1Slot(idx, 'originalDesc', e.target.value);
                    updateM1Slot(idx, 'cleanedDesc', e.target.value);
                  }}
                  placeholder="Deskripsi metadata video akan otomatis muncul di sini setelah fetch, atau ketik langsung di sini..."
                  className="flex-1 w-full min-h-[160px] bg-transparent text-gray-200 font-['Inter'] text-xs p-1 outline-none resize-none leading-relaxed custom-scroll placeholder-gray-600 selection:bg-orange-500/30"
                />
              </div>

            </div>
          </M1MechanicalPanel>

          {/* DELICATE VERTICAL DIVIDER WITH ORANGE ACCENT */}
          <div className="w-[1px] bg-gradient-to-b from-transparent via-orange-500/40 to-transparent relative z-20 shrink-0"></div>

          {/* RIGHT PANEL: OUTPUT PREVIEW & IDENTITY */}
          <M1MechanicalPanel className="w-[53%] h-full flex flex-col p-6 overflow-hidden">
            <M1SectionHeader title="OUTPUT PREVIEW" status={isReady ? 'active' : 'idle'} />

            {/* INDUSTRIAL CONTAINER */}
            <div className="flex flex-col flex-1 bg-[#1a1c27] border border-[#2e3347] p-5 rounded-lg shadow-inner justify-between min-h-0 gap-4 relative overflow-hidden">
              
              {/* ZONE 1: ASSET IDENTITY (Big 16:9 Thumbnail Monitor + Meta Info) */}
              <div className="flex gap-5 shrink-0 min-h-[175px]">
                
                {/* Large 310px 16:9 Thumbnail Monitor Frame */}
                <div className={`w-[310px] h-[175px] shrink-0 bg-[#0d0e14] rounded relative overflow-hidden flex items-center justify-center shadow-inner group border transition-all ${
                  isReady ? 'border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-[#2d3142]'
                }`}>
                  {activeThumbnail ? (
                    <img 
                      src={activeThumbnail} 
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        if (slot?.videoId && !e.target.src.includes('hqdefault')) {
                          e.target.src = `https://i.ytimg.com/vi/${slot.videoId}/hqdefault.jpg`;
                        }
                      }}
                      className="w-full h-full object-cover relative z-10" 
                      alt="Thumbnail" 
                    />
                  ) : (
                    <div className="flex flex-col items-center opacity-30 relative z-10">
                      <svg className="w-8 h-8 text-orange-400 mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <span className="font-['Rajdhani'] font-bold text-gray-400 tracking-[0.2em] uppercase text-xs">NO THUMBNAIL</span>
                    </div>
                  )}
                  
                  {/* Subtle Scanline Overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-10" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>

                  {/* HD Badge in Top Left */}
                  {activeThumbnail && (
                    <div className="absolute top-2 left-2 z-20 bg-black/80 backdrop-blur-sm border border-orange-500/40 text-orange-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      HD THUMBNAIL
                    </div>
                  )}

                  {/* Replace Thumbnail & Download Thumbnail Hover Overlay */}
                  <input
                    id={`single-thumb-upload-${idx}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        updateM1Slot(idx, 'manualThumbnail', url);
                      }
                    }}
                  />
                  <div className="absolute inset-0 z-30 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                    {activeThumbnail && (
                      <button
                        type="button"
                        onClick={handleDownloadThumbnail}
                        disabled={isDownloadingThumb}
                        className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-['Rajdhani'] font-bold text-[11px] uppercase tracking-wider rounded shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-300/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        title="Download thumbnail resolusi tinggi ke komputer"
                      >
                        {isDownloadingThumb ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>DOWNLOADING...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <span>DOWNLOAD THUMBNAIL</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => document.getElementById(`single-thumb-upload-${idx}`)?.click()}
                      className="w-full py-1.5 px-3 bg-[#222634] hover:bg-orange-600 text-white text-[11px] font-['Rajdhani'] font-bold tracking-wider rounded border border-[#3b4054] hover:border-orange-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      <span>GANTI THUMBNAIL</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Details */}
                <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-['Rajdhani'] block text-[10px] text-orange-400 font-bold tracking-widest uppercase">
                        {slot?.sourceType === 'Audio File' ? 'AUDIO SOURCE TITLE' : 'YOUTUBE VIDEO TITLE'}
                      </span>
                      {thumbNotice && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded shadow-sm animate-pulse truncate max-w-[180px]">
                          {thumbNotice}
                        </span>
                      )}
                    </div>
                    <span className={`font-['Rajdhani'] font-bold text-lg leading-snug line-clamp-2 uppercase ${isReady ? 'text-white drop-shadow-sm' : 'text-gray-500'}`}>
                      {isReady ? (slot?.sourceType === 'Audio File' ? slot.audio.split(/[\\/]/).pop() : (slot?.videoTitle || slot?.outputName || 'YouTube Video')) : 'WAITING FOR METADATA...'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#2d3142]">
                    <span className="font-['Roboto_Mono'] text-gray-400 text-[11px] truncate uppercase flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500/70 rounded-sm"></span>
                      CH: <strong className="text-gray-200 font-bold">{isReady ? (slot?.sourceType === 'Audio File' ? 'Local Storage' : slot?.channelName) : '---'}</strong>
                    </span>
                    <span className={`font-['Roboto_Mono'] text-xs font-bold flex items-center gap-2 ${isReady ? 'text-orange-400' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-sm ${isReady ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,1)]' : 'bg-gray-600'}`}></span>
                      DUR: {isReady ? slot?.duration : '--:--'}
                    </span>

                    {/* Direct Download Button */}
                    {activeThumbnail && (
                      <button
                        type="button"
                        onClick={handleDownloadThumbnail}
                        disabled={isDownloadingThumb}
                        className="mt-1 w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-['Rajdhani'] font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_12px_rgba(16,185,129,0.3)] border border-emerald-400/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                        title="Download YouTube Thumbnail resolusi tinggi (HD / MaxRes)"
                      >
                        {isDownloadingThumb ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>DOWNLOADING...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <span>DOWNLOAD THUMBNAIL (HD)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SEPARATOR */}
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent shrink-0"></div>

              {/* ZONE 2: OUTPUT FILE NAME */}
              <div className="flex flex-col shrink-0">
                <M1Input 
                  label="OUTPUT FILENAME (.MP4)"
                  value={slot?.outputName || ''} 
                  onChange={(e) => updateM1Slot(idx, 'outputName', e.target.value)} 
                  placeholder="Nama_Video_Output.mp4" 
                />
              </div>

              {/* SEPARATOR */}
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent shrink-0"></div>

              {/* ZONE 3: STATUS & APPROVAL CONTROL */}
              <div className="flex items-center justify-between shrink-0 bg-[#12131b] p-4 border border-[#2d3142] rounded-lg shadow-inner">
                <div className="flex flex-col">
                  <span className="font-['Rajdhani'] font-bold text-[10px] uppercase text-gray-400 tracking-widest mb-0.5">STATUS MODULE</span>
                  <span className={`font-['Roboto_Mono'] text-xs font-bold ${slot?.isApproved ? 'text-orange-400 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]' : 'text-yellow-400'}`}>
                    {slot?.isApproved ? 'APPROVED & READY' : 'WAITING APPROVAL'}
                  </span>
                </div>

                <M1Button
                  variant="primary"
                  disabled={!isReady}
                  onClick={() => updateM1Slot(idx, 'isApproved', !slot?.isApproved)}
                  className={`!h-[40px] !px-8 shadow ${slot?.isApproved ? '!border-orange-400 !text-white bg-gradient-to-r from-orange-600 to-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]' : ''}`}
                >
                  {slot?.isApproved ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      APPROVED ✓
                    </span>
                  ) : (
                    'APPROVE & LOCK'
                  )}
                </M1Button>
              </div>

            </div>
          </M1MechanicalPanel>
        </div>
        
        {/* MACHINE BASE (Footer) */}
        <div className="flex items-center justify-between px-6 h-[54px] shrink-0 border-t border-[#2d3142] relative z-20 bg-[#1c1e29]">
          <div className="flex items-center gap-4 opacity-70">
            <div className="flex gap-[2px] h-4">
              {[1,3,1,1,2,1,4,1,2,1,1,3].map((w, i) => <div key={i} className="bg-orange-500" style={{width: `${w}px`}}></div>)}
            </div>
            <span className="font-['Roboto_Mono'] text-[9px] text-orange-400/80 tracking-widest uppercase">MF-ENG-V2.44 // SLOT {String(idx + 1).padStart(2, '0')}</span>
          </div>
          <div className="flex items-center gap-4">
            <M1Button variant="secondary" onClick={closeModal} className="!px-8">
              BATAL
            </M1Button>
            <M1Button 
              variant="primary" 
              onClick={() => {
                if (isReady && !slot?.outputName) {
                  const fallback = `Segment_${String(idx + 1).padStart(2, '0')}.mp4`;
                  updateM1Slot(idx, 'outputName', fallback);
                }
                updateM1Slot(idx, 'isApproved', true);
                closeModal();
              }} 
              className="!px-10 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              SIMPAN & KELUAR
            </M1Button>
          </div>
        </div>

      </M1WindowFrame>
    </div>
  );
}
