import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add physics variables above loop
var_search = "        let smoothedEnergy = 0;"
var_idx = content.find(var_search)

if var_idx == -1:
    print("Could not find var bounds")
    sys.exit(1)

physics_vars = """        let smoothedEnergy = 0;
        let pScale = 0, vScale = 0;
        let pX = 0, vX = 0;
        let pY = 0, vY = 0;
        let pRot = 0, vRot = 0;
"""
content = content[:var_idx] + physics_vars + content[var_idx + len(var_search):]


# 2. Update the logic inside the loop
start_str = "            let dynamicScale = 0;"
end_str = "            const totalScale = baseScale + dynamicScale;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find inner bounds")
    sys.exit(1)

new_component = """            let targetScale = 0;
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
            
            // --- CUSTOM SPRING PHYSICS ENGINE ---
            // This guarantees the movement is EXTREMELY smooth ("empuk") and completely removes harsh/rough jumps.
            // The `smoothing` value from the UI controls the dampening (friction) of the spring.
            const spring = 0.12; 
            const friction = 0.70 + (smoothing * 0.25); // Higher smoothing = higher friction = softer stop
            
            vScale = (vScale + (targetScale - pScale) * spring) * friction;
            pScale += vScale;
            
            vX = (vX + (targetX - pX) * spring) * friction;
            pX += vX;
            
            vY = (vY + (targetY - pY) * spring) * friction;
            pY += vY;
            
            vRot = (vRot + (targetRot - pRot) * spring) * friction;
            pRot += vRot;
            
            let dynamicScale = pScale;
            let dynamicX = pX;
            let dynamicY = pY;
            let dynamicRot = pRot;

            // We need a base zoom if we have dynamic movement, to prevent black borders from showing.
            const hasMovement = Math.abs(targetScale) > 0 || Math.abs(targetX) > 0 || Math.abs(targetY) > 0 || Math.abs(targetRot) > 0;
            const baseScale = hasMovement ? 1.1 + (userZoom * 0.5) : 1.0 + (userZoom * 0.5);

            const totalScale = baseScale + dynamicScale;
"""

content = content[:start_idx] + new_component + content[end_idx + len("            const totalScale = baseScale + dynamicScale;"):]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for custom spring physics")
