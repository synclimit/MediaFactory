import re

with open('src/components/m5/M5NewsCreator.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_render = """              <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-center justify-center">
                 {image ? (
                    <img src={image} className="w-full h-full object-cover" />
                 ) : ("""

new_render = """              <div className="w-full h-full bg-[#1a1c23] relative overflow-hidden flex items-start justify-center">
                 {image ? (
                    <>
                       {/* Blurred Background to fill the empty space */}
                       <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-125" style={{ backgroundImage: `url(${image})` }}></div>
                       {/* Main Image, fully visible, uncropped, aligned to top like mobile view */}
                       <img src={image} className="w-full h-auto max-h-full object-contain relative z-10" />
                    </>
                 ) : ("""

if old_render in content:
    content = content.replace(old_render, new_render)

with open('src/components/m5/M5NewsCreator.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fit Image Patched Successfully!")
