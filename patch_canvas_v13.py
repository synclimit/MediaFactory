import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Clean up the physics vars
var_search = """        let smoothedEnergy = 0;
        let pScale = 0, vScale = 0;
        let pX = 0, vX = 0;
        let pY = 0, vY = 0;
        let pRot = 0, vRot = 0;
"""
var_idx = content.find(var_search)
if var_idx != -1:
    content = content[:var_idx] + "        let smoothedEnergy = 0;\n" + content[var_idx + len(var_search):]
else:
    print("Could not find var block")


# 2. Replace the inner logic with Professional Envelope Follower
start_str = "            // Smooth the raw volume - using a much heavier internal smoothing"
end_str = "            const totalScale = baseScale + dynamicScale;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find inner bounds")
    sys.exit(1)

new_component = """            // --- PROFESSIONAL ENVELOPE FOLLOWER ---
            // Professional visualizers (like Trap Nation, Monstercat, BSPLabs) use an Attack/Decay Envelope.
            // When the beat hits (energy > current), it jumps up very quickly (Attack).
            // When the beat ends (energy < current), it glides down smoothly (Decay).
            
            // Apply threshold first
            let effectiveEnergy = rawEnergy - reactLevel;
            if (effectiveEnergy < 0) effectiveEnergy = 0;
            
            const attackFactor = 0.3; // Fast attack for punchy rhythm
            const decayFactor = 0.85 + (smoothing * 0.12); // User controls how long the "swing/glide" lasts
            
            if (effectiveEnergy > smoothedEnergy) {
                smoothedEnergy = smoothedEnergy * attackFactor + effectiveEnergy * (1 - attackFactor);
            } else {
                smoothedEnergy = smoothedEnergy * decayFactor + effectiveEnergy * (1 - decayFactor);
            }
            
            // The impact is now perfectly smooth and rhythmically accurate
            const impact = smoothedEnergy * intensity; 
            
            let dynamicScale = 0;
            let dynamicX = 0;
            let dynamicY = 0;
            let dynamicRot = 0;
            
            const zoomEnable = props.bgDanceZoomEnable !== false; 
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
            const hasMovement = Math.abs(dynamicScale) > 0 || Math.abs(dynamicX) > 0 || Math.abs(dynamicY) > 0 || Math.abs(dynamicRot) > 0;
            const baseScale = hasMovement ? 1.1 + (userZoom * 0.5) : 1.0 + (userZoom * 0.5);

            const totalScale = baseScale + dynamicScale;
"""

content = content[:start_idx] + new_component + content[end_idx + len("            const totalScale = baseScale + dynamicScale;"):]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for professional envelope")
