import re

with open('src/components/m5/M5VideoCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the function signature to accept activeWorkspace
content = content.replace("export default function M5VideoCreator({ m5Queue = [] }) {", 
                          "export default function M5VideoCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {")

# 2. Add useWorkspaceState hook
hook_code = """
  const useWorkspaceState = (key, initialValue) => {
    const [state, setState] = useState(() => {
      try {
        const item = window.localStorage.getItem(`m5_${activeWorkspace}_video_${key}`);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        return initialValue;
      }
    });

    React.useEffect(() => {
      try {
        window.localStorage.setItem(`m5_${activeWorkspace}_video_${key}`, JSON.stringify(state));
      } catch (error) {}
    }, [key, state, activeWorkspace]);

    return [state, setState];
  };

"""
content = content.replace("export default function M5VideoCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {\n", 
                          "export default function M5VideoCreator({ m5Queue = [], setM5Queue, activeWorkspace = 'default' }) {\n" + hook_code)

# 3. Replace all useState with useWorkspaceState
replacements = {
    "const [formula, setFormula] = useState(() => localStorage.getItem('m5_formula') || 'OVERLAY');": "const [formula, setFormula] = useWorkspaceState('formula', 'OVERLAY');",
    "const [duration, setDuration] = useState(() => localStorage.getItem('m5_duration') || '30 Detik (Short)');": "const [duration, setDuration] = useWorkspaceState('duration', '30 Detik (Short)');",
    "const [resolution, setResolution] = useState(() => localStorage.getItem('m5_resolution') || '1080x1920 (9:16)');": "const [resolution, setResolution] = useWorkspaceState('resolution', '1080x1920 (9:16)');",
    "const [fps, setFps] = useState(() => localStorage.getItem('m5_fps') || '30 FPS');": "const [fps, setFps] = useWorkspaceState('fps', '30 FPS');",
    "const [outputCount, setOutputCount] = useState(() => parseInt(localStorage.getItem('m5_outputCount')) || 10);": "const [outputCount, setOutputCount] = useWorkspaceState('outputCount', 10);",
    "const [ctaPreset, setCtaPreset] = useState(() => localStorage.getItem('m5_ctaPreset') || 'sayang_ibu');": "const [ctaPreset, setCtaPreset] = useWorkspaceState('ctaPreset', 'sayang_ibu');",
    "const [ctaText, setCtaText] = useState(() => localStorage.getItem('m5_ctaText') || 'Apakah kamu sayang ibu kamu?\\n\\nKalau iya...\\n\\nKlik Subscribe ❤️');": "const [ctaText, setCtaText] = useWorkspaceState('ctaText', 'Apakah kamu sayang ibu kamu?\\n\\nKalau iya...\\n\\nKlik Subscribe ❤️');",
}

for old, new_s in replacements.items():
    content = content.replace(old, new_s)

# 4. Replace libraryFolders state
library_old = """  const [libraryFolders, setLibraryFolders] = useState(() => {
    const val = localStorage.getItem('m5_libraryFolders');
    const parsed = val ? JSON.parse(val) : {};
    return {
      videoA: parsed.videoA || [],
      videoB: parsed.videoB || [],
      hook: parsed.hook || [],
      cta: parsed.cta || [],
      audio: parsed.audio || [],
      background: parsed.background || [],
      subscribe: parsed.subscribe || [],
      arrow: parsed.arrow || [],
      overlay: parsed.overlay || []
    };
  });"""

library_new = """  const [libraryFolders, setLibraryFolders] = useWorkspaceState('libraryFolders', {
      videoA: [],
      videoB: [],
      hook: [],
      cta: [],
      audio: [],
      background: [],
      subscribe: [],
      arrow: [],
      overlay: []
  });"""

content = content.replace(library_old, library_new)

# 5. Remove the massive useEffect that manually syncs localStorage
effect_regex = r"React\.useEffect\(\(\) => \{\s*localStorage\.setItem\('m5_formula'[^}]+\}?, \[formula, duration, resolution, fps, outputCount, ctaPreset, ctaText, libraryFolders\]\);"
content = re.sub(effect_regex, "", content)

# 6. Add "setM5Queue" usage in handleGenerateQueue ? Wait, it might be calling the backend and then the SSE updates the queue. But we should trigger the drawer open.
# The user wants 'setM5Queue' to be passed so the UI might be updated, but actually `handleGenerateQueue` in `M5VideoCreator` just calls fetch and relies on SSE.
# So we just leave it alone.

with open('src/components/m5/M5VideoCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("M5VideoCreator.jsx patched for workspace persistence successfully!")
