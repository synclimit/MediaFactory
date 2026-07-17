import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the old auto-read mock
old_hook_code = """
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

new_state_code = """
  // --- CARD EDITOR STATE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(null);
  const [pipelineStages, setPipelineStages] = useState([]);
  const [editorReady, setEditorReady] = useState(false);

  // Connect to SSE for pipeline progress
  useEffect(() => {
    const sse = new EventSource('/api/v1/m5/stream');
    
    sse.addEventListener('news_progress', (e) => {
      const data = JSON.parse(e.data);
      if (data.stages) {
        setPipelineStages(data.stages);
        const activeStage = data.stages.find(s => s.status === 'RUNNING' || s.status === 'WAITING');
        if (activeStage) {
            setPipelineProgress(activeStage.name);
        }
      }
    });

    sse.addEventListener('news_draft_update', (e) => {
      const { module, data } = JSON.parse(e.data);
      if (module === 'reader') {
         setSource(new URL(data.url).hostname.replace('www.', ''));
      }
      if (module === 'ai') {
         setHeadline(data.headline);
         setSummary(data.summary);
         if (data.category) setCategory(data.category.toUpperCase());
         
         const today = new Date();
         setDate(`${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })} ${today.getFullYear()}`);
      }
      if (module === 'visual') {
         // Could update image here if we had an image state
      }
    });

    sse.addEventListener('news_pipeline_complete', (e) => {
      setIsProcessing(false);
      setPipelineProgress('Draft Ready');
    });
    
    sse.addEventListener('news_pipeline_error', (e) => {
      setIsProcessing(false);
      setPipelineProgress('Pipeline Error');
    });

    return () => sse.close();
  }, []);

  const handleStartPipeline = () => {
    if (!links || !links.trim().startsWith('http')) return;
    setIsProcessing(true);
    setPipelineProgress('Starting...');
    setEditorReady(false);
    
    fetch('/api/v1/m5/news/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: links.trim() })
    }).catch(e => {
        setIsProcessing(false);
        setPipelineProgress('Error connecting to backend');
    });
  };
"""
content = content.replace(old_hook_code, new_state_code)

# 2. Wire "Add to Queue" button
old_button = """<button className="text-[11px] bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded transition-all">
              Add to Queue
            </button>"""
new_button = """<button onClick={handleStartPipeline} disabled={isProcessing} className="text-[11px] bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded transition-all disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Add to Queue'}
            </button>"""
content = content.replace(old_button, new_button)

# 3. Fix the AI Draft processing text to show the real progress
old_draft_header = """            {isProcessing ? (
              <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase animate-pulse">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> Processing...
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                <CheckCircle2 size={12}/> Ready
              </div>
            )}"""

new_draft_header = """            {isProcessing ? (
              <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold uppercase animate-pulse">
                <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> {pipelineProgress || 'Processing...'}
              </div>
            ) : pipelineProgress === 'Draft Ready' ? (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase">
                <CheckCircle2 size={12}/> Draft Ready
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                Waiting for input...
              </div>
            )}"""
content = content.replace(old_draft_header, new_draft_header)

# 4. Generate Draft -> Open Editor Logic
old_generate = """        <button className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
            <Play size={18} className="fill-white"/> Generate
          </span>
          <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Output to Queue</span>
        </button>"""

new_generate = """        {!editorReady ? (
          <button onClick={() => setEditorReady(true)} disabled={pipelineProgress !== 'Draft Ready'} className={`bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] ${pipelineProgress !== 'Draft Ready' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
            <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={18} className="text-white"/> Generate Draft
            </span>
            <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Lock changes and prepare</span>
          </button>
        ) : (
          <button onClick={() => {
            import('../../state/m5EditorStore.js').then(m => {
               m.useM5EditorStore.getState().setEditorMode(true);
            });
          }} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
              <Layout size={18} className="text-white"/> Open Editor
            </span>
            <span className="text-[9px] text-blue-200 mt-1 uppercase tracking-widest">Launch Full Workspace</span>
          </button>
        )}"""
content = content.replace(old_generate, new_generate)


with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Frontend updated!")
