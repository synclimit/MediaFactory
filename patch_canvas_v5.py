import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "            const intensity = (props.bgDanceIntensity ?? 100) / 100;"
end_str = "            const hasMovement ="

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find AnimatedBackgroundRenderer bounds")
    sys.exit(1)

new_component = """            const intensity = (props.bgDanceIntensity ?? 100) / 100;
            const reactLevel = (props.bgDanceReactLevel ?? 40) / 100;
            
            // React Level acts as a threshold. If smoothed energy is below reactLevel, it does not move.
            let effectiveEnergy = smoothedEnergy - reactLevel;
            if (effectiveEnergy < 0) effectiveEnergy = 0;
            else effectiveEnergy = effectiveEnergy / (1 - reactLevel + 0.001); // Normalize
            
            // Multiply by 2.0 to give it a more noticeable punch by default, matching BSPLabs feel
            const impact = effectiveEnergy * intensity * 2.0; 
            
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

            // We need a base zoom if we have dynamic movement, to prevent black borders from showing.
"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for defaults and math")
