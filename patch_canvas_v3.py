import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace AnimatedBackgroundRenderer body
start_str = "const audioFeatures = (frame.debug && frame.debug.beat) ? frame.debug.beat : {};"
end_str = "smoothedEnergy = smoothedEnergy * smoothing + rawEnergy * (1 - smoothing);"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find AnimatedBackgroundRenderer bounds")
    sys.exit(1)

new_component = """const d = (frame.debug && frame.debug.beat && frame.debug.beat.debug) ? frame.debug.beat.debug : {};
            const bands = d.bands || {};
            
            let rawEnergy = 0;
            if (source === 'Bass (Low)' || source === 'Kick / Bass') {
                rawEnergy = (bands.bass && bands.bass.value) ? bands.bass.value : 0;
            } else if (source === 'Snare') {
                rawEnergy = (bands.mid && bands.mid.value) ? bands.mid.value : 0;
            } else {
                rawEnergy = d.energy || 0;
            }
            
            """

content = content[:start_idx] + new_component + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for audio variables")
