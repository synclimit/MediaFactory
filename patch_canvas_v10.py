import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "            // Apply threshold (reactLevel). Anything below the threshold is ignored."
end_str = "            let dynamicScale = 0;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_component = """            // Apply threshold (reactLevel). Anything below the threshold is ignored.
            let effectiveEnergy = smoothedEnergy - reactLevel;
            if (effectiveEnergy < 0) effectiveEnergy = 0;
            
            // We removed the harsh division/normalization here so that the movement is much softer and less aggressive.
            
            // Gentle multiplier for a clean, non-earthquake zoom. Lowered to 0.8 for much softer feel.
            const impact = effectiveEnergy * intensity * 0.8; 
            
"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for softer zoom")
