import sys

filepath = 'd:/MediaFactory/src/components/m3/M3PreviewCanvas.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert AnimatedBackgroundRenderer above M3PreviewCanvas
target_component_start = "export default function M3PreviewCanvas"
insert_idx = content.find(target_component_start)
if insert_idx == -1:
    print("Could not find M3PreviewCanvas")
    sys.exit(1)

animated_bg_component = """
const AnimatedBackgroundRenderer = ({ bg }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!bg) return;
        const props = bg.props || {};
        const mode = props.bgDanceMode || 'Ringan (Pixel) — cepat di CPU';
        
        const intensity = (props.bgDanceIntensity ?? 100) / 100;
        const reactLevel = (props.bgDanceReactLevel ?? 45) / 100;
        const smoothing = props.bgDanceSmoothing ?? 0.70;
        const style = props.bgDanceStyle || 'Subtle Sway';
        const source = props.bgDanceSource || 'Whole song';
        
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
            
            // Choose source
            let rawEnergy = 0;
            if (source === 'Kick / Bass') rawEnergy = audioFeatures.bass || 0;
            else if (source === 'Snare') rawEnergy = audioFeatures.mid || 0;
            else rawEnergy = audioFeatures.energy || 0;

            // Apply smoothing
            smoothedEnergy = smoothedEnergy * smoothing + rawEnergy * (1 - smoothing);

            // Calculate base transform
            const isActive = intensity > 0 && reactLevel > 0;
            const baseScale = isActive ? 1.05 + (userZoom * 0.5) : 1.0 + (userZoom * 0.5);
            
            // Calculate dynamic transform
            let dynamicScale = 0;
            let dynamicX = 0;
            let dynamicY = 0;

            if (isActive) {
                const impact = smoothedEnergy * reactLevel * intensity;
                if (style === 'Subtle Sway') {
                    dynamicScale = impact * 0.03; // max 3% zoom pulse
                    dynamicX = Math.sin(Date.now() / 1000) * impact * 10;
                    dynamicY = Math.cos(Date.now() / 1200) * impact * 10;
                } else if (style === 'Hard Bounce') {
                    dynamicScale = impact * 0.08;
                    dynamicY = impact * 20; // jump up
                } else if (style === 'Pulse Zoom') {
                    dynamicScale = impact * 0.15;
                }
            }

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
    
    // Scale mode classes
    let objectFit = 'object-contain';
    if (props.scaleMode === 'Fill') objectFit = 'object-cover';
    else if (props.scaleMode === 'Stretch') objectFit = 'object-fill';

    const overlayDarkness = props.overlayDarkness ?? 0;
    const overlayOpacity = overlayDarkness / 100;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center bg-black">
            <div ref={containerRef} className="w-full h-full relative flex items-center justify-center transition-transform duration-75">
                {bg.type === 'image' ? (
                    <img src={bg.preview} alt="bg" className={`w-full h-full ${objectFit} opacity-60`} />
                ) : bg.type === 'video' ? (
                    <video src={bg.preview} autoPlay loop muted className={`w-full h-full ${objectFit} opacity-60`} />
                ) : null}
            </div>
            {/* Custom Overlay */}
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

content = content[:insert_idx] + animated_bg_component + content[insert_idx:]

# 2. Replace static block with AnimatedBackgroundRenderer
start_replace_str = "          {/* Real Background Source */}"
end_replace_str = "          {/* Unified Render Pipeline */}"

start_rep_idx = content.find(start_replace_str)
end_rep_idx = content.find(end_replace_str)

if start_rep_idx == -1 or end_rep_idx == -1:
    print("Could not find replacement bounds")
    sys.exit(1)

replacement_jsx = """          {/* Real Background Source */}
          {m3BgPool && m3BgPool.length > 0 && (
              <AnimatedBackgroundRenderer bg={m3BgPool[0]} />
          )}

"""

content = content[:start_rep_idx] + replacement_jsx + content[end_rep_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
