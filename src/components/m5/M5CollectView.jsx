import React, { useState } from 'react';
import { 
  Music, Link, 
  Trash2, Lightbulb, FolderOpen, Rocket, Download, CheckCircle2, 
  ArrowDownCircle, Play, ExternalLink, RefreshCw, ClipboardList, Pause, Sparkles
} from 'lucide-react';

export default function M5CollectView({ m5Queue = [], extConnected = false }) {
  const [linksText, setLinksText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [quality, setQuality] = useState('Best Quality');
  const [downloadFolder, setDownloadFolderState] = useState(() => {
    return localStorage.getItem('m5_download_folder') || 'C:\\Users\\Public\\Downloads';
  });
  const setDownloadFolder = (val) => {
    setDownloadFolderState(val);
    if (val) localStorage.setItem('m5_download_folder', val);
  };

  const downloadQueue = m5Queue.filter(j => j.type === 'download');
  const totalVideos = downloadQueue.length;
  const downloadingCount = downloadQueue.filter(j => j.status === 'Downloading').length;
  const readyCount = downloadQueue.filter(j => j.status === 'Ready').length;
  const completedCount = m5Queue.filter(j => j.status === 'Completed' || (j.type === 'download' && j.status === 'Ready')).length;

  const getSourceIcon = (source) => {
    switch (source) {
      case 'TikTok': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
      case 'Facebook': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
      case 'Instagram': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
      case 'YouTube': return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
      default: return <Link size={14} className="text-gray-400" />;
    }
  };

  const renderStatus = (item) => {
    if (item.status === 'Ready') return (
      <span className="text-emerald-400 font-medium flex items-center gap-2 text-[13px]">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ready
      </span>
    );
    if (item.status === 'Pending') return (
      <span className="text-gray-400 font-medium flex items-center gap-2 text-[13px]">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div> Pending
      </span>
    );
    if (item.status === 'Downloading') return (
      <div className="flex flex-col gap-1 w-full max-w-[120px]">
        <div className="flex justify-between text-[12px] font-medium text-orange-400 mb-0.5">
          <span>Downloading</span>
          <span>{item.progress}%</span>
        </div>
        <div className="h-1 bg-[#1b1d22] rounded-full overflow-hidden">
          <div className="h-full bg-orange-500" style={{ width: `${item.progress}%` }}></div>
        </div>
      </div>
    );
    if (item.status === 'Failed') return (
      <span className="text-red-500 font-medium flex items-center gap-1.5 text-[12px]" title={item.error}>
        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Failed
      </span>
    );
  };

  const renderAction = (item) => {
    return (
      <button 
        onClick={() => {
          fetch(`/api/v1/m5/queue/${item.id}`, { method: 'DELETE' })
            .catch(err => console.error("Failed to delete", err));
        }}
        className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
        title="Hapus dari antrean"
      >
        <Trash2 size={16} />
      </button>
    );
  };

  return (
    <div className="flex gap-3 h-full font-sans fade-in min-h-0 pt-0 pb-0">
      
      {/* LEFT COLUMN: Content Area */}
      <div className="flex-1 flex flex-col gap-2.5 min-w-0">
        
        {/* Box 1: Download Dari Link */}
        <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 flex flex-col justify-between shrink-0 h-[155px] overflow-hidden group z-10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
          
          <div className="flex justify-between items-center">
            <h3 className="text-[13px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
              DOWNLOAD DARI LINK (COPY & PASTE)
            </h3>
            <span className="text-[11px] text-orange-400/90 font-mono pr-2">MAX: 100 LINKS</span>
          </div>
          
          <textarea 
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            className="w-full flex-1 my-1.5 bg-[#161822]/90 border border-orange-500/20 rounded-lg p-2.5 text-[12px] text-gray-300 resize-none focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-500 font-mono"
            placeholder="Tempel link video di sini (bisa banyak link sekaligus, satu link per baris)..."
          ></textarea>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-gray-400 text-[11px] font-medium">
              <Sparkles size={14} className="text-orange-500" /> Siap menunggu link...
            </div>
            <button 
              onClick={() => {
                if (isAdding || !linksText.trim()) return;
                setIsAdding(true);
                const links = linksText.split('\n').map(l => l.trim()).filter(Boolean);
                
                fetch('/api/v1/m5/download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ links, quality, downloadFolder, autoStart: autoDetect })
                })
                .then(async res => {
                  if (!res.ok) throw new Error("Server returned " + res.status);
                  try {
                    return await res.json();
                  } catch (e) {
                    throw new Error("Server backend M5 belum direstart. Tolong restart server Node/Vite Anda di terminal.");
                  }
                })
                .then(data => {
                   if (data && data.success) {
                     setLinksText(''); // Clear input
                   }
                })
                .catch(err => {
                   alert(err.message);
                })
                .finally(() => setIsAdding(false));
              }}
              className={`bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-400 text-white font-bold text-[12px] px-5 h-[32px] rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all flex items-center gap-2 border border-orange-400/50 ${isAdding ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isAdding ? <RefreshCw size={15} className="animate-spin" /> : <ClipboardList size={15} />} 
              {isAdding ? 'Menambahkan...' : 'Add to Queue'}
            </button>
          </div>
        </div>

        {/* Box 2: Queue Download */}
        <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] flex flex-col flex-1 overflow-hidden min-h-0 group z-10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-20 pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
          
          <div className="p-3 px-4 border-b border-[#2a2c33] flex justify-between items-center shrink-0 relative z-10 bg-black/20">
            <h3 className="text-[13px] font-bold text-white tracking-wide uppercase flex items-center gap-2 m5-white-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              QUEUE DOWNLOAD ({totalVideos})
            </h3>
            <div className="flex items-center gap-3 pr-2">
              <label className="flex items-center gap-2 text-[12px] text-gray-300 cursor-pointer font-medium hover:text-white transition-colors">
                Auto Detect
                <div className={`w-8 h-[16px] rounded-full p-0.5 transition-colors shadow-inner ${autoDetect ? 'bg-orange-500' : 'bg-[#2a2c33]'}`} onClick={() => setAutoDetect(!autoDetect)}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoDetect ? 'translate-x-[16px]' : 'translate-x-0'}`}></div>
                </div>
              </label>
              <button 
                onClick={() => {
                  fetch('/api/v1/m5/start-downloads', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ downloadFolder })
                  }).catch(console.error);
                }}
                className="text-white hover:text-white border border-emerald-500/60 bg-emerald-600/80 hover:bg-emerald-500 px-3 h-[28px] rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20"
              >
                <Download size={14} /> Download Semua
              </button>
              <button 
                onClick={() => {
                  fetch('/api/v1/m5/queue?type=download', { method: 'DELETE' }).catch(console.error);
                }}
                className="text-orange-400 hover:text-orange-300 border border-orange-500/40 bg-orange-950/30 px-3 h-[28px] rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Trash2 size={14} /> Bersihkan
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto m5-scroll">
            <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
              <thead className="sticky top-0 bg-[#161822] text-[11px] uppercase tracking-wider text-orange-400/80 border-b border-orange-500/20 z-10 shadow-sm h-[32px]">
                <tr>
                  <th className="p-1.5 px-3 w-[45px] text-center font-bold">#</th>
                  <th className="p-1.5 px-3 w-[65px] font-bold">PREVIEW</th>
                  <th className="p-1.5 px-3 w-[105px] font-bold">SUMBER</th>
                  <th className="p-1.5 px-3 font-bold">JUDUL</th>
                  <th className="p-1.5 px-3 w-[85px] font-bold">DURASI</th>
                  <th className="p-1.5 px-3 w-[85px] font-bold">SIZE</th>
                  <th className="p-1.5 px-3 w-[115px] font-bold">STATUS</th>
                  <th className="p-1.5 px-3 w-[55px] text-center font-bold">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-gray-300">
                {m5Queue.map((item) => (
                  <tr key={item.id} className="h-[40px] border-b border-[#1c1f2e] hover:bg-[#181b2a] transition-colors group">
                    <td className="p-1.5 px-3 text-center text-gray-500 font-bold">{item.id}</td>
                    <td className="p-1.5 px-3">
                      <div 
                        className="w-[36px] h-[26px] bg-cover bg-center rounded border border-white/10 relative overflow-hidden shadow-sm group-hover:border-orange-500/50 transition-colors bg-[#1f2230]"
                        style={item.preview ? { backgroundImage: `url("${item.preview}")` } : {}}
                      >
                      </div>
                    </td>
                    <td className="p-1.5 px-3">
                      <div className="flex items-center gap-2 font-medium">
                        <div className="scale-100 origin-left">
                           {getSourceIcon(item.source)}
                        </div>
                        <span className="truncate w-16 ml-1 text-[12px]">{item.source}</span>
                      </div>
                    </td>
                    <td className="p-1.5 px-3 truncate text-gray-200 text-[12px]" title={item.title}>{item.title}</td>
                    <td className="p-1.5 px-3 text-gray-400 text-[11px] font-mono">{item.duration}</td>
                    <td className="p-1.5 px-3 text-gray-400 text-[11px] font-mono">{item.size}</td>
                    <td className="p-1.5 px-3">
                      {renderStatus(item)}
                    </td>
                    <td className="p-1.5 px-3 text-center">
                      {renderAction(item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2 px-4 border-t border-orange-500/20 bg-[#0e1018] flex justify-between items-center shrink-0">
             <span className="text-[12px] text-gray-400 font-mono">TOTAL: <strong className="text-orange-400">{totalVideos} VIDEOS</strong></span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Sidebar Stats & Settings */}
      <div className="w-[300px] flex flex-col justify-between gap-3 shrink-0 overflow-hidden pr-0.5 pb-0 h-full">
        
        {/* Box 1: Extension Status (Compact & Clean) */}
        <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 flex flex-col justify-between shrink-0 overflow-hidden group z-10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
          
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[11px] font-bold text-white tracking-wide uppercase flex items-center gap-1.5 m5-white-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              EXTENSION STATUS
            </h3>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${extConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{extConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          
          <div className="flex items-center justify-between gap-2 pt-1">
             <div className="flex items-center gap-2.5 min-w-0">
               <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${extConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
               <div className="min-w-0 truncate">
                  <div className={`${extConnected ? 'text-emerald-400' : 'text-red-400'} font-bold text-[11px] leading-none truncate`}>{extConnected ? 'CONNECTED' : 'DISCONNECTED'}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate">{extConnected ? 'Siap digunakan' : 'Menunggu koneksi browser...'}</div>
               </div>
             </div>
             <button className="bg-[#161822] hover:bg-orange-950/40 text-orange-400 font-bold text-[11px] px-2.5 h-[28px] rounded-lg border border-orange-500/30 hover:border-orange-500 transition-all flex items-center gap-1.5 shrink-0 shadow-sm">
               <RefreshCw size={12} /> Refresh
             </button>
          </div>
        </div>

        {/* Box 2: Statistik (Spaciously Balanced) */}
        <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 flex-1 flex flex-col justify-center gap-2.5 overflow-hidden min-h-0 group z-10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
          
          <h3 className="text-[11px] font-bold text-white tracking-wide uppercase m5-white-glow">STATISTIK</h3>
          
          <div className="grid grid-cols-2 gap-2.5 my-auto">
            <div className="bg-[#161822]/80 border border-orange-500/20 p-2.5 rounded-lg flex items-center gap-2.5 shadow-inner">
               <div className="w-7 h-7 rounded-md border border-orange-500/40 text-orange-500 flex items-center justify-center bg-orange-950/30 shrink-0">
                  <Download size={14} />
               </div>
               <div>
                 <div className="text-[15px] font-extrabold text-orange-400 leading-none mb-0.5">{totalVideos}</div>
                 <div className="text-[10px] text-gray-400 leading-tight">Video di Queue</div>
               </div>
            </div>
            
            <div className="bg-[#161822]/80 border border-orange-500/20 p-2.5 rounded-lg flex items-center gap-2.5 shadow-inner">
               <div className="w-7 h-7 rounded-md border border-orange-500/40 text-orange-500 flex items-center justify-center bg-orange-950/30 shrink-0">
                  <CheckCircle2 size={14} />
               </div>
               <div>
                 <div className="text-[15px] font-extrabold text-orange-400 leading-none mb-0.5">{readyCount}</div>
                 <div className="text-[10px] text-gray-400 leading-tight">Siap Download</div>
               </div>
            </div>

            <div className="bg-[#161822]/80 border border-orange-500/20 p-2.5 rounded-lg flex items-center gap-2.5 shadow-inner">
               <div className="w-7 h-7 rounded-md border border-orange-500/40 text-orange-500 flex items-center justify-center bg-orange-950/30 shrink-0">
                  <ArrowDownCircle size={14} />
               </div>
               <div>
                 <div className="text-[15px] font-extrabold text-orange-400 leading-none mb-0.5">{downloadingCount}</div>
                 <div className="text-[10px] text-gray-400 leading-tight">Downloading</div>
               </div>
            </div>

            <div className="bg-[#161822]/80 border border-orange-500/20 p-2.5 rounded-lg flex items-center gap-2.5 shadow-inner">
               <div className="w-7 h-7 rounded-md border border-orange-500/40 text-orange-500 flex items-center justify-center bg-orange-950/30 shrink-0">
                  <CheckCircle2 size={14} />
               </div>
               <div>
                 <div className="text-[15px] font-extrabold text-orange-400 leading-none mb-0.5">{completedCount}</div>
                 <div className="text-[10px] text-gray-400 leading-tight">Selesai</div>
               </div>
            </div>
          </div>

          <div className="mt-auto pt-2.5 border-t border-orange-500/10 flex items-center gap-2.5">
            <div className="relative shrink-0">
               <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[6px]"></div>
               <Rocket size={16} className="text-orange-500 relative z-10 m5-icon-glow" strokeWidth={1.5} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-white mb-0 tracking-wide m5-white-glow leading-none">TIPS</p>
               <p className="text-[9px] text-gray-400 leading-tight mt-0.5">Koneksi internet stabil = kecepatan download maksimal</p>
            </div>
          </div>
        </div>
        {/* Box 3: Download Settings */}
        <div className="relative bg-gradient-to-br from-[#2a2c33] to-[#111216] rounded-xl border border-[#2a2c33] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_2px_rgba(0,0,0,0.5)] p-4 flex flex-col gap-2.5 shrink-0 overflow-hidden group z-10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600/50 via-orange-500 to-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.6)] z-0 pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)'}}></div>
          
          <h3 className="text-[11px] font-bold text-white tracking-wide uppercase m5-white-glow">DOWNLOAD SETTINGS</h3>
          
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-300 font-medium">Quality</span>
            <div className="relative">
               <select 
                 className="bg-[#161822] border border-orange-500/20 rounded-lg px-2 h-[28px] text-[11px] text-white focus:outline-none focus:border-orange-500 appearance-none pr-7 w-[115px] font-medium cursor-pointer hover:bg-[#1b1d28] transition-colors"
                 value={quality} onChange={e => setQuality(e.target.value)}
               >
                 <option>Best Quality</option>
                 <option>1080p</option>
                 <option>720p</option>
               </select>
               <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                 <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
               </div>
            </div>
          </div>
          
          {/* Download Path */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-orange-500/20">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5" title="Folder tujuan penyimpanan hasil download">
                <FolderOpen size={12} className="text-orange-400" /> Save Folder
              </span>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/m2/dialog/folder', { method: 'POST' });
                    if (res.ok) {
                      const { path } = await res.json();
                      if (path) setDownloadFolder(path);
                    }
                  } catch (err) {
                    alert("Gagal membuka dialog folder: " + err.message);
                  }
                }}
                className="text-[10px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
              >
                Browse Folder
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-[#161822] border border-orange-500/30 rounded-lg px-2.5 h-[28px] text-[11px] font-mono text-gray-200 shadow-inner focus-within:border-orange-500">
               <span className="text-orange-500 font-bold shrink-0 text-[10px]">DIR:</span>
               <input 
                 type="text"
                 className="bg-transparent w-full focus:outline-none text-white font-mono text-[10px] truncate"
                 value={downloadFolder}
                 onChange={(e) => setDownloadFolder(e.target.value)}
                 placeholder="C:\Users\Public\Downloads"
               />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
