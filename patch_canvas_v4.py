import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace AnimatedBackgroundRenderer body
start_str = "            let dynamicScale = 0;"
end_str = "            const totalScale = baseScale + dynamicScale;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find AnimatedBackgroundRenderer bounds")
    sys.exit(1)

new_component = """            let dynamicScale = 0;
            let dynamicX = 0;
            let dynamicY = 0;
            let dynamicRot = 0;
            
            const intensity = (props.bgDanceIntensity ?? 100) / 100;
            const reactLevel = (props.bgDanceReactLevel ?? 40) / 100;
            const impact = smoothedEnergy * reactLevel * intensity;
            
            if (props.bgDanceZoomEnable) {
                dynamicScale = impact * ((props.bgDanceZoomVal || 10) / 100);
            }

            if (props.bgDanceSwayLREnable) {
                const swayMult = props.bgDanceSwayLRVal !== undefined ? props.bgDanceSwayLRVal : 2.5;
                dynamicX = Math.sin(Date.now() / 1000) * impact * swayMult * 10;
            }

            if (props.bgDanceSwayUDEnable) {
                const swayMult = props.bgDanceSwayUDVal !== undefined ? props.bgDanceSwayUDVal : 1.8;
                dynamicY = Math.cos(Date.now() / 1200) * impact * swayMult * 10;
            }

            if (props.bgDanceRotateEnable) {
                const rotMult = props.bgDanceRotateVal !== undefined ? props.bgDanceRotateVal : 1.0;
                dynamicRot = Math.sin(Date.now() / 1500) * impact * rotMult * 5;
            }

            if (props.bgDanceShakeEnable) {
                const shakeMult = props.bgDanceShakeVal !== undefined ? props.bgDanceShakeVal : 8.0;
                dynamicX += (Math.random() - 0.5) * impact * shakeMult * 2;
                dynamicY += (Math.random() - 0.5) * impact * shakeMult * 2;
            }

            // We need a base zoom if we have dynamic movement, to prevent black borders from showing.
            const hasMovement = dynamicScale > 0 || Math.abs(dynamicX) > 0 || Math.abs(dynamicY) > 0 || Math.abs(dynamicRot) > 0;
            const baseScale = hasMovement ? 1.1 + (userZoom * 0.5) : 1.0 + (userZoom * 0.5);

"""

content = content[:start_idx] + new_component + content[end_idx:]

# Also update the transform line to include rotation
transform_old = "containerRef.current.style.transform = `translate(${totalX}px, ${totalY}px) scale(${totalScale})`;"
transform_new = "containerRef.current.style.transform = `translate(${totalX}px, ${totalY}px) scale(${totalScale}) rotate(${dynamicRot}deg)`;"

content = content.replace(transform_old, transform_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched for dynamic sliders")
