import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "            const intensity = (props.bgDanceIntensity ?? 100) / 100;"
end_str = "            // We need a base zoom if we have dynamic movement"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_component = """            const intensity = (props.bgDanceIntensity ?? 100) / 100;
            const reactLevel = (props.bgDanceReactLevel ?? 40) / 100;
            
            let rawEnergy = 0;
            
            // Revert back to using pure absolute values from the Bass band (smooth swells).
            if (source === 'Bass (Low)' || source === 'Kick / Bass') {
                rawEnergy = (bands.bass && bands.bass.value) ? bands.bass.value : 0;
            } else if (source === 'Snare') {
                rawEnergy = (bands.mid && bands.mid.value) ? bands.mid.value : 0;
            } else {
                rawEnergy = d.energy || 0;
            }
            
            // Smooth the raw volume
            smoothedEnergy = smoothedEnergy * smoothing + rawEnergy * (1 - smoothing);

            // Apply threshold (reactLevel). Anything below the threshold is ignored.
            let effectiveEnergy = smoothedEnergy - reactLevel;
            if (effectiveEnergy < 0) effectiveEnergy = 0;
            else effectiveEnergy = effectiveEnergy / (1 - reactLevel + 0.001); // Normalize 0..1
            
            // Gentle multiplier for a clean, non-earthquake zoom
            const impact = effectiveEnergy * intensity * 1.5; 
            
            let dynamicScale = 0;
            let dynamicX = 0;
            let dynamicY = 0;
            let dynamicRot = 0;
            
            const zoomEnable = props.bgDanceZoomEnable !== false; // defaults to true
            if (zoomEnable) {
                dynamicScale = impact * ((props.bgDanceZoomVal !== undefined ? props.bgDanceZoomVal : 10) / 100);
            }

            const swayLREnable = props.bgDanceSwayLREnable === true;
            if (swayLREnable) {
                const swayMult = props.bgDanceSwayLRVal !== undefined ? props.bgDanceSwayLRVal : 2.5;
                dynamicX = Math.sin(Date.now() / 1000) * impact * swayMult * 10;
            }

            const swayUDEnable = props.bgDanceSwayUDEnable === true;
            if (swayUDEnable) {
                const swayMult = props.bgDanceSwayUDVal !== undefined ? props.bgDanceSwayUDVal : 1.8;
                dynamicY = Math.cos(Date.now() / 1200) * impact * swayMult * 10;
            }

            const rotateEnable = props.bgDanceRotateEnable === true;
            if (rotateEnable) {
                const rotMult = props.bgDanceRotateVal !== undefined ? props.bgDanceRotateVal : 1.0;
                dynamicRot = Math.sin(Date.now() / 1500) * impact * rotMult * 5;
            }

            const shakeEnable = props.bgDanceShakeEnable === true;
            if (shakeEnable) {
                const shakeMult = props.bgDanceShakeVal !== undefined ? props.bgDanceShakeVal : 8.0;
                dynamicX += (Math.random() - 0.5) * impact * shakeMult * 2;
                dynamicY += (Math.random() - 0.5) * impact * shakeMult * 2;
            }

"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for pure bass value (final v9)")
