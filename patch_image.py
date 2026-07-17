import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add image state
old_states = """  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });"""
new_states = """  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState('');"""
if old_states in content:
    content = content.replace(old_states, new_states)

# 2. Update reader event handler to grab image
old_reader = """         if (data.body) setSummary(data.body.substring(0, 150) + '...');
      }"""
new_reader = """         if (data.body) setSummary(data.body.substring(0, 150) + '...');
         if (data.images && data.images.length > 0) setImage(data.images[0].url);
      }"""
if old_reader in content:
    content = content.replace(old_reader, new_reader)

# 3. Render image in the card
old_render = """              <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-center justify-center">
                 <ImageIcon size={40} className="text-gray-700"/>
                 {/* Fake image gradient */}"""
new_render = """              <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-center justify-center">
                 {image ? (
                    <img src={image} className="w-full h-full object-cover" />
                 ) : (
                    <ImageIcon size={40} className="text-gray-700"/>
                 )}
                 {/* Fake image gradient */}"""
if old_render in content:
    content = content.replace(old_render, new_render)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Image Patched Successfully!")
