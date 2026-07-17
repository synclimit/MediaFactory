import re

# 1. Update App.jsx to listen to OPEN_QUEUE_DRAWER event
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

old_use_effect = """  useEffect(() => {
    // Check initial queue status
    const hasM4Eligible = queue.some(q => q.status === 'Ready' || q.status === 'Waiting' || q.status === 'Failed');
"""
new_use_effect = """  useEffect(() => {
    // Listen for custom drawer events
    const openDrawer = () => setPipelineDrawerCollapsed(false);
    window.addEventListener('OPEN_QUEUE_DRAWER', openDrawer);
    return () => window.removeEventListener('OPEN_QUEUE_DRAWER', openDrawer);
  }, []);

  useEffect(() => {
    // Check initial queue status
    const hasM4Eligible = queue.some(q => q.status === 'Ready' || q.status === 'Waiting' || q.status === 'Failed');
"""
if "window.addEventListener('OPEN_QUEUE_DRAWER'" not in app_content:
    app_content = app_content.replace(old_use_effect, new_use_effect)
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(app_content)

# 2. Update M5NewsCreator.jsx
with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update props
old_props = "export default function M5NewsCreator({ m5Queue = [] }) {"
new_props = "export default function M5NewsCreator({ m5Queue = [], setM5Queue }) {"
content = content.replace(old_props, new_props)

# Add handler before return
handler = """
  const handleAddToQueue = () => {
    if (!setM5Queue) return;
    const newJob = {
      id: Date.now().toString(),
      type: 'render',
      status: 'Ready',
      progress: 0,
      formula: 'News Creator (M5)',
      snapshot: {
        outPath: `Output/M5/News_${Date.now()}.mp4`,
        ffmpegCommand: 'Custom Live News Render',
        manifest: { headline, summary, image, cardTheme, boxPos, boxScale, boxWidth, boxHeight }
      }
    };
    setM5Queue(prev => [...prev, newJob]);
    window.dispatchEvent(new CustomEvent('OPEN_QUEUE_DRAWER'));
  };

  return (
"""
content = content.replace("  return (\n", handler)

# Update button
old_btn = """        <button disabled={pipelineProgress !== 'Draft Ready'} className={`bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] ${pipelineProgress !== 'Draft Ready' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
          <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
            <Play size={18} className="fill-white"/> Generate
          </span>
          <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Output to Render Engine</span>
        </button>"""
new_btn = """        <button onClick={handleAddToQueue} className={`bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)]`}>
          <span className="font-black text-[16px] uppercase tracking-widest flex items-center gap-2">
            <Plus size={18} className="text-white"/> Add to Queue
          </span>
          <span className="text-[9px] text-orange-200 mt-1 uppercase tracking-widest">Send to Render Engine</span>
        </button>"""
content = content.replace(old_btn, new_btn)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Add to Queue button patched successfully!")
