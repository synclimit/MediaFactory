import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "            let rawEnergy = 0;"
end_str = "            // We need a base zoom if we have dynamic movement"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_component = """            let rawEnergy = 0;
            
            // To make it pulse (gerak jedag-jedug), we MUST use the transient (delta) of the frequency.
            // If we only use absolute value, sustained bass notes will cause the zoom to freeze at a zoomed-in state!
            if (source === 'Bass (Low)' || source === 'Kick / Bass') {
                const bassDelta = (bands.bass && bands.bass.delta > 0) ? bands.bass.delta : 0;
                rawEnergy = bassDelta * 10.0; // Multiply delta to make the spike prominent
                
                // Also add a little bit of the absolute energy that exceeds the threshold, for "body"
                const absolute = (bands.bass && bands.bass.value) ? bands.bass.value : 0;
                if (absolute > reactLevel) {
                    rawEnergy += (absolute - reactLevel) * 0.5;
                }
            } else if (source === 'Snare') {
                const midDelta = (bands.mid && bands.mid.delta > 0) ? bands.mid.delta : 0;
                rawEnergy = midDelta * 10.0;
            } else {
                // Whole song
                rawEnergy = d.detected ? 1.0 : 0;
            }
            
            // Smooth the energy. The `smoothing` parameter controls how fast the pulse decays.
            smoothedEnergy = smoothedEnergy * smoothing + rawEnergy * (1 - smoothing);
            
            const intensity = (props.bgDanceIntensity ?? 100) / 100;
            
            // The final impact is the smoothed transient energy multiplied by intensity.
            // We multiply by 1.5 to ensure the zoom is punchy and visible.
            const impact = smoothedEnergy * intensity * 1.5; 
            
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
                // Use sine wave for smooth sway, scaled by impact
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
print("Canvas BG patched for transient pulse")
