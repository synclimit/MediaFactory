import re

# 1. Update backend/api/m5.js to add POST /api/v1/m5/queue/add
with open('backend/api/m5.js', 'r', encoding='utf-8') as f:
    backend_content = f.read()

old_get_queue = """// M5 Global Queue API
router.get('/api/v1/m5/queue', (req, res) => {
    res.json({ success: true, data: m5Queue });
});"""

new_get_queue = """// M5 Global Queue API
router.get('/api/v1/m5/queue', (req, res) => {
    res.json({ success: true, data: m5Queue });
});

router.post('/api/v1/m5/queue/add', (req, res) => {
    const job = req.body;
    m5Queue.push(job);
    broadcastSseEvent('queue_update', { action: 'add', job });
    res.json({ success: true, job });
});"""

if "router.post('/api/v1/m5/queue/add'" not in backend_content:
    backend_content = backend_content.replace(old_get_queue, new_get_queue)
    with open('backend/api/m5.js', 'w', encoding='utf-8') as f:
        f.write(backend_content)

# 2. Update M5NewsCreator.jsx for localStorage and backend fetch
with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    frontend_content = f.read()

# Update state initializers to use localStorage
old_global_settings = """  // --- GLOBAL SETTINGS ---
  const [links, setLinks] = useState("https://www.cnnindonesia.com/internasional/2024/05/23/presiden-as-joe-biden-kunjungi-vietnam");
  const [globalDuration, setGlobalDuration] = useState("30s");
  const [globalLang, setGlobalLang] = useState("Indonesia");
  const [globalRes, setGlobalRes] = useState("1080x1920 (9:16)");
  const [globalFPS, setGlobalFPS] = useState("30 FPS");
  
  const [bgFolder, setBgFolder] = useState("");
  const [audioFolder, setAudioFolder] = useState("");
  const [overlayFolder, setOverlayFolder] = useState("");"""

new_global_settings = """  // --- GLOBAL SETTINGS ---
  const [links, setLinks] = useState(() => localStorage.getItem('m5_news_links') || "https://www.cnnindonesia.com/internasional/2024/05/23/presiden-as-joe-biden-kunjungi-vietnam");
  const [globalDuration, setGlobalDuration] = useState(() => localStorage.getItem('m5_news_duration') || "30s");
  const [globalLang, setGlobalLang] = useState(() => localStorage.getItem('m5_news_lang') || "Indonesia");
  const [globalRes, setGlobalRes] = useState(() => localStorage.getItem('m5_news_res') || "1080x1920 (9:16)");
  const [globalFPS, setGlobalFPS] = useState(() => localStorage.getItem('m5_news_fps') || "30 FPS");
  
  const [bgFolder, setBgFolder] = useState(() => localStorage.getItem('m5_news_bgFolder') || "");
  const [audioFolder, setAudioFolder] = useState(() => localStorage.getItem('m5_news_audioFolder') || "");
  const [overlayFolder, setOverlayFolder] = useState(() => localStorage.getItem('m5_news_overlayFolder') || "");

  useEffect(() => {
    localStorage.setItem('m5_news_links', links);
    localStorage.setItem('m5_news_duration', globalDuration);
    localStorage.setItem('m5_news_lang', globalLang);
    localStorage.setItem('m5_news_res', globalRes);
    localStorage.setItem('m5_news_fps', globalFPS);
    localStorage.setItem('m5_news_bgFolder', bgFolder);
    localStorage.setItem('m5_news_audioFolder', audioFolder);
    localStorage.setItem('m5_news_overlayFolder', overlayFolder);
  }, [links, globalDuration, globalLang, globalRes, globalFPS, bgFolder, audioFolder, overlayFolder]);"""

if "localStorage.getItem('m5_news_links')" not in frontend_content:
    frontend_content = frontend_content.replace(old_global_settings, new_global_settings)

# Update handleAddToQueue
old_handler = """    setM5Queue(prev => [...prev, newJob]);
    window.dispatchEvent(new CustomEvent('OPEN_QUEUE_DRAWER'));
  };"""

new_handler = """    // Send to backend so it persists and doesn't get cleared by SSE
    fetch('/api/v1/m5/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
    }).catch(e => console.error("Failed to add to queue", e));
    
    // Also trigger drawer open immediately
    window.dispatchEvent(new CustomEvent('OPEN_QUEUE_DRAWER'));
  };"""

if "/api/v1/m5/queue/add" not in frontend_content:
    frontend_content = frontend_content.replace(old_handler, new_handler)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(frontend_content)

print("Backend API and LocalStorage patched successfully!")
