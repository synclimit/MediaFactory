import sys
import re

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace AnimatedBackgroundRenderer body
start_str = "const AnimatedBackgroundRenderer = ({ bg }) => {"
end_str = "export default function M3PreviewCanvas"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find AnimatedBackgroundRenderer bounds")
    sys.exit(1)

new_component = """const AnimatedBackgroundRenderer = ({ bg }) => {
    const containerRef = useRef(null);
    const imgVideoRef = useRef(null);

    useEffect(() => {
        if (!bg) return;
        const props = bg.props || {};
        
        const style = props.bgDanceStyle || 'Custom';
        const source = props.bgDanceSource || 'Bass (Low)';
        const smoothing = props.bgDanceSmoothing !== undefined ? props.bgDanceSmoothing : 0.70;
        
        const userZoom = (props.bgZoom || 0) / 100;
        const userX = (props.x || 0);
        const userY = (props.y || 0);

        let animId;
        let smoothedEnergy = 0;

        const loop = () => {
            animId = requestAnimationFrame(loop);
            const frame = renderFrameStore.getFrame();
            if (!frame) return;
            
            const audioFeatures = frame.features || {};
            
            let rawEnergy = 0;
            if (source === 'Bass (Low)' || source === 'Kick / Bass') rawEnergy = audioFeatures.bass || 0;
            else if (source === 'Snare') rawEnergy = audioFeatures.mid || 0;
            else rawEnergy = audioFeatures.energy || 0;

            smoothedEnergy = smoothedEnergy * smoothing + rawEnergy * (1 - smoothing);
            
            let dynamicScale = 0;
            let dynamicX = 0;
            let dynamicY = 0;
            
            const impact = smoothedEnergy;
            
            if (style === 'Subtle Sway') {
                dynamicScale = impact * 0.02;
                dynamicX = Math.sin(Date.now() / 1500) * impact * 5;
                dynamicY = Math.cos(Date.now() / 1800) * impact * 3;
            } else if (style === 'Bass Zoom') {
                dynamicScale = impact * 0.10; // heavy zoom
            } else if (style === 'Dance') {
                dynamicScale = impact * 0.05;
                dynamicX = Math.sin(Date.now() / 800) * impact * 15;
                dynamicY = Math.cos(Date.now() / 900) * impact * 15;
            } else if (style === 'Energetic') {
                dynamicScale = impact * 0.12;
                dynamicX = (Math.random() - 0.5) * impact * 20;
                dynamicY = (Math.random() - 0.5) * impact * 20;
            } else if (style === 'Zoom Only') {
                dynamicScale = impact * 0.05;
            } else if (style === 'Custom') {
                if (props.bgDanceZoomEnable) {
                    dynamicScale = impact * ((props.bgDanceZoomVal || 10) / 100);
                }
                if (props.bgDanceSwayEnable) {
                    const swayMult = props.bgDanceSwayVal !== undefined ? props.bgDanceSwayVal : 1.8;
                    dynamicX = Math.sin(Date.now() / 1000) * impact * swayMult * 10;
                    dynamicY = Math.cos(Date.now() / 1200) * impact * swayMult * 10;
                }
            }

            // We need a base zoom if we have dynamic movement, to prevent black borders from showing.
            const hasMovement = dynamicScale > 0 || Math.abs(dynamicX) > 0 || Math.abs(dynamicY) > 0;
            const baseScale = hasMovement ? 1.1 + (userZoom * 0.5) : 1.0 + (userZoom * 0.5);

            const totalScale = baseScale + dynamicScale;
            const totalX = userX + dynamicX;
            const totalY = userY + dynamicY;

            if (containerRef.current) {
                containerRef.current.style.transform = `translate(${totalX}px, ${totalY}px) scale(${totalScale})`;
                if (props.blurAmount) {
                     containerRef.current.style.filter = `blur(${props.blurAmount}px)`;
                } else {
                     containerRef.current.style.filter = 'none';
                }
            }
        };
        loop();
        return () => cancelAnimationFrame(animId);
    }, [bg]);

    if (!bg) return null;
    const props = bg.props || {};
    
    let objectFit = 'object-contain';
    if (props.scaleMode === 'Fill') objectFit = 'object-cover';
    else if (props.scaleMode === 'Stretch') objectFit = 'object-fill';

    const overlayDarkness = props.overlayDarkness ?? 0;
    const overlayOpacity = overlayDarkness / 100;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center bg-black">
            <div ref={containerRef} className="w-full h-full relative flex items-center justify-center transition-transform duration-75">
                {bg.type === 'image' ? (
                    <img ref={imgVideoRef} src={bg.preview} alt="bg" className={`w-full h-full ${objectFit} opacity-60`} />
                ) : bg.type === 'video' ? (
                    <video ref={imgVideoRef} src={bg.preview} autoPlay loop muted className={`w-full h-full ${objectFit} opacity-60`} />
                ) : null}
            </div>
            {overlayOpacity > 0 && (
                <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: overlayOpacity }}></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 mix-blend-overlay pointer-events-none"></div>
            <span className="absolute bottom-2 left-2 text-white/20 text-[10px] font-mono font-bold tracking-wider z-0 drop-shadow-md pointer-events-none">
                [SRC] {bg.filename}
            </span>
        </div>
    );
};

"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Canvas BG patched")
