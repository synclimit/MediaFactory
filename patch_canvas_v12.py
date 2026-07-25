import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "            // Smooth the raw volume"
end_str = "            let dynamicScale = pScale;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find bounds")
    sys.exit(1)

new_component = """            // Smooth the raw volume - using a much heavier internal smoothing for a "swing/swell" feel
            // Map the UI smoothing (0-1) to an extremely slow internal curve (0.90 - 0.99)
            const internalSmoothing = 0.90 + (smoothing * 0.09);
            smoothedEnergy = smoothedEnergy * internalSmoothing + rawEnergy * (1 - internalSmoothing);

            // Apply threshold (reactLevel). Anything below the threshold is ignored.
            let effectiveEnergy = smoothedEnergy - reactLevel;
            if (effectiveEnergy < 0) effectiveEnergy = 0;
            
            // Gentle multiplier
            const impact = effectiveEnergy * intensity * 0.8; 
            
            let targetScale = 0;
            let targetX = 0;
            let targetY = 0;
            let targetRot = 0;
            
            const zoomEnable = props.bgDanceZoomEnable !== false; // defaults to true
            if (zoomEnable) {
                targetScale = impact * ((props.bgDanceZoomVal !== undefined ? props.bgDanceZoomVal : 10) / 100);
            }

            const swayLREnable = props.bgDanceSwayLREnable === true;
            if (swayLREnable) {
                const swayMult = props.bgDanceSwayLRVal !== undefined ? props.bgDanceSwayLRVal : 2.5;
                targetX = Math.sin(Date.now() / 1000) * impact * swayMult * 10;
            }

            const swayUDEnable = props.bgDanceSwayUDEnable === true;
            if (swayUDEnable) {
                const swayMult = props.bgDanceSwayUDVal !== undefined ? props.bgDanceSwayUDVal : 1.8;
                targetY = Math.cos(Date.now() / 1200) * impact * swayMult * 10;
            }

            const rotateEnable = props.bgDanceRotateEnable === true;
            if (rotateEnable) {
                const rotMult = props.bgDanceRotateVal !== undefined ? props.bgDanceRotateVal : 1.0;
                targetRot = Math.sin(Date.now() / 1500) * impact * rotMult * 5;
            }

            const shakeEnable = props.bgDanceShakeEnable === true;
            if (shakeEnable) {
                const shakeMult = props.bgDanceShakeVal !== undefined ? props.bgDanceShakeVal : 8.0;
                targetX += (Math.random() - 0.5) * impact * shakeMult * 2;
                targetY += (Math.random() - 0.5) * impact * shakeMult * 2;
            }
            
            // --- SWING PHYSICS ENGINE (AYUNAN) ---
            // To make it "berayun" (swing), we use an extremely weak spring (slow acceleration)
            // and very high friction (momentum) so it glides smoothly rather than snapping/jumping.
            const spring = 0.015; // Very slow pull
            const friction = 0.92; // Glides like a pendulum
            
            vScale = (vScale + (targetScale - pScale) * spring) * friction;
            pScale += vScale;
            
            vX = (vX + (targetX - pX) * spring) * friction;
            pX += vX;
            
            vY = (vY + (targetY - pY) * spring) * friction;
            pY += vY;
            
            vRot = (vRot + (targetRot - pRot) * spring) * friction;
            pRot += vRot;
            
"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for slow swing physics")
