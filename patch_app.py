import sys

filepath = 'src/App.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const [m3BgPool, setM3BgPool] = useState([
    { id: 'bg1', type: 'image', filename: 'bg_image_1.webp', preview: 'bg_image_1.webp' }
  ]);
  const [m3ThumbnailSaved, setM3ThumbnailSaved] = useState(false);
  const [m3AudioTracks, setM3AudioTracks] = useState([
    { id: 'trk1', title: 'lofi_track_a', artist: 'Unknown', duration: '03:45', thumbnail: 'thumb.jpg', sourceType: 'file', sourcePath: 'lofi_track_a.mp3' },
    { id: 'trk2', title: 'lofi_track_b', artist: 'Unknown', duration: '02:30', thumbnail: 'thumb.jpg', sourceType: 'file', sourcePath: 'lofi_track_b.mp3' },
    { id: 'trk3', title: 'lofi_track_c', artist: 'Unknown', duration: '04:15', thumbnail: 'thumb.jpg', sourceType: 'file', sourcePath: 'lofi_track_c.mp3' }
  ]);
  const [m3Objects, setM3Objects] = useState([
    { id: 'bg-1', canvasMode: 'composer', type: 'background', name: 'Background', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
    { id: 'txt-1', canvasMode: 'composer', type: 'text', name: 'Playlist Title', x: 100, y: 100, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 },
    { id: 'txt-2', canvasMode: 'composer', type: 'text', name: 'Current Playing', x: 100, y: 250, width: 600, height: 50, rotation: 0, opacity: 100, visible: true, locked: false, layer: 2 },
    { id: 'img-1', canvasMode: 'composer', type: 'image', name: 'Watermark', x: 1700, y: 50, width: 150, height: 150, rotation: 0, opacity: 50, visible: true, locked: false, layer: 3 },
    { id: 'viz-1', canvasMode: 'composer', type: 'visualizer', name: 'Spectrum', x: 0, y: 900, width: 1920, height: 180, rotation: 0, opacity: 100, visible: true, locked: false, layer: 4 },
    { id: 'ply-1', canvasMode: 'composer', type: 'playlist', name: 'Playlist Overlay', x: 1400, y: 300, width: 400, height: 600, rotation: 0, opacity: 90, visible: true, locked: false, layer: 5 },
    { id: 't-bg-1', canvasMode: 'thumbnail', type: 'background', name: 'Thumbnail Background', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
    { id: 't-txt-1', canvasMode: 'thumbnail', type: 'text', name: 'Thumb Title', x: 150, y: 200, width: 1000, height: 200, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 },
    { id: 't-txt-2', canvasMode: 'thumbnail', type: 'text', name: 'Thumb Subtitle', x: 160, y: 450, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 2 }
  ]);"""

replacement = """  const [m3BgPool, setM3BgPool] = useState(() => {
    try { const saved = localStorage.getItem('m3BgPool'); if (saved) return JSON.parse(saved); } catch (e) {}
    return [
      { id: 'bg1', type: 'image', filename: 'bg_image_1.webp', preview: 'bg_image_1.webp' }
    ];
  });
  const [m3ThumbnailSaved, setM3ThumbnailSaved] = useState(false);
  const [m3AudioTracks, setM3AudioTracks] = useState(() => {
    try { const saved = localStorage.getItem('m3AudioTracks'); if (saved) return JSON.parse(saved); } catch (e) {}
    return [
      { id: 'trk1', title: 'lofi_track_a', artist: 'Unknown', duration: '03:45', thumbnail: 'thumb.jpg', sourceType: 'file', sourcePath: 'lofi_track_a.mp3' },
      { id: 'trk2', title: 'lofi_track_b', artist: 'Unknown', duration: '02:30', thumbnail: 'thumb.jpg', sourceType: 'file', sourcePath: 'lofi_track_b.mp3' },
      { id: 'trk3', title: 'lofi_track_c', artist: 'Unknown', duration: '04:15', thumbnail: 'thumb.jpg', sourceType: 'file', sourcePath: 'lofi_track_c.mp3' }
    ];
  });
  const [m3Objects, setM3Objects] = useState(() => {
    try { const saved = localStorage.getItem('m3Objects'); if (saved) return JSON.parse(saved); } catch (e) {}
    return [
      { id: 'bg-1', canvasMode: 'composer', type: 'background', name: 'Background', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
      { id: 'txt-1', canvasMode: 'composer', type: 'text', name: 'Playlist Title', x: 100, y: 100, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 },
      { id: 'txt-2', canvasMode: 'composer', type: 'text', name: 'Current Playing', x: 100, y: 250, width: 600, height: 50, rotation: 0, opacity: 100, visible: true, locked: false, layer: 2 },
      { id: 'img-1', canvasMode: 'composer', type: 'image', name: 'Watermark', x: 1700, y: 50, width: 150, height: 150, rotation: 0, opacity: 50, visible: true, locked: false, layer: 3 },
      { id: 'viz-1', canvasMode: 'composer', type: 'visualizer', name: 'Spectrum', x: 0, y: 900, width: 1920, height: 180, rotation: 0, opacity: 100, visible: true, locked: false, layer: 4 },
      { id: 'ply-1', canvasMode: 'composer', type: 'playlist', name: 'Playlist Overlay', x: 1400, y: 300, width: 400, height: 600, rotation: 0, opacity: 90, visible: true, locked: false, layer: 5 },
      { id: 't-bg-1', canvasMode: 'thumbnail', type: 'background', name: 'Thumbnail Background', x: 0, y: 0, width: 1920, height: 1080, rotation: 0, opacity: 100, visible: true, locked: true, layer: 0 },
      { id: 't-txt-1', canvasMode: 'thumbnail', type: 'text', name: 'Thumb Title', x: 150, y: 200, width: 1000, height: 200, rotation: 0, opacity: 100, visible: true, locked: false, layer: 1 },
      { id: 't-txt-2', canvasMode: 'thumbnail', type: 'text', name: 'Thumb Subtitle', x: 160, y: 450, width: 800, height: 100, rotation: 0, opacity: 100, visible: true, locked: false, layer: 2 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('m3BgPool', JSON.stringify(m3BgPool));
  }, [m3BgPool]);

  useEffect(() => {
    localStorage.setItem('m3AudioTracks', JSON.stringify(m3AudioTracks));
  }, [m3AudioTracks]);

  useEffect(() => {
    localStorage.setItem('m3Objects', JSON.stringify(m3Objects));
  }, [m3Objects]);
"""

if target in content:
    content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully.")
else:
    print("Target string not found!")
