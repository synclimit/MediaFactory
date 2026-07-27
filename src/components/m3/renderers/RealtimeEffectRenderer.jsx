import React, { useEffect, useRef } from 'react';
import { reactiveObjectProcessor } from '../../../services/audio/ReactiveObjectProcessor';
import { renderSurface } from '../../../services/pipeline/renderer/RenderSurface';
import { getDepthMap } from '../effects/DepthMapCache';
import { renderDepthScan } from '../effects/DepthScanRenderer';
import { renderFogDepth } from '../effects/FogDepthRenderer';
import { renderBokehDepth } from '../effects/BokehDepthRenderer';
import { renderFrameStore } from '../../../services/pipeline/runtime/RenderFrameStore';

// ============================================================
// RealtimeEffectRenderer — BSPLabs 18 Effects Canvas Engine
// ============================================================

let cachedGrainPattern = null;
let cachedGrainSize = null;

function getGrainPattern(ctx, size) {
    if (cachedGrainPattern && cachedGrainSize === size) return cachedGrainPattern;
    const off = document.createElement('canvas');
    off.width = 256;
    off.height = 256;
    const octx = off.getContext('2d');
    const idata = octx.createImageData(256, 256);
    const d32 = new Uint32Array(idata.data.buffer);
    for(let i=0; i<d32.length; i++) {
        // Luma noise (black and white specks) for overlay blending
        const val = Math.random() > 0.5 ? 200 : 55;
        // A B G R
        d32[i] = (255 << 24) | (val << 16) | (val << 8) | val; 
    }
    octx.putImageData(idata, 0, 0);
    
    if (size > 1) {
        const scaled = document.createElement('canvas');
        scaled.width = Math.floor(256 * size);
        scaled.height = Math.floor(256 * size);
        const sctx = scaled.getContext('2d');
        sctx.imageSmoothingEnabled = false;
        sctx.drawImage(off, 0, 0, scaled.width, scaled.height);
        cachedGrainPattern = ctx.createPattern(scaled, 'repeat');
    } else {
        cachedGrainPattern = ctx.createPattern(off, 'repeat');
    }
    
    cachedGrainSize = size;
    return cachedGrainPattern;
}

export default function RealtimeEffectRenderer({ effects, targetRef }) {
    const canvasRef = useRef(null);
    const letterboxRef = useRef(null);
    const effectStatesRef = useRef(new Map());
    
    const effectsRef = useRef(effects);
    useEffect(() => {
        effectsRef.current = effects;
    }, [effects]);

    useEffect(() => {
        if (!canvasRef.current || !targetRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const targetElement = targetRef.current;

        const resizeObserver = new ResizeObserver(() => {
            canvas.width = targetElement.offsetWidth;
            canvas.height = targetElement.offsetHeight;
        });
        resizeObserver.observe(targetElement);

        let animationId;
        const particleSystems = new Map();
        const smoothVals = new Map();

        let simulatedTime = 0;
        let lastTimestamp = performance.now();

        // --- Particle System Initializer ---
        const initParticles = (id, count, width, height) => {
            if (particleSystems.has(id)) return particleSystems.get(id);
            const particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    z: Math.random(),
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 5 + 1,
                    phase: Math.random() * Math.PI * 2,
                    life: Math.random(),
                    color: `hsl(${Math.random() * 360}, 80%, 60%)`
                });
            }
            particleSystems.set(id, particles);
            return particles;
        };

        // --- Color Resolver ---
        const getColor = (eff, time) => {
            const mode = eff.props?.colorMode || 'Warna kustom';
            if (mode === 'Pelangi') return `hsl(${(time / 10) % 360}, 100%, 50%)`;
            if (mode === 'Dinamis') return `hsl(${(time / 30 + (eff.id?.charCodeAt(0) || 0) * 10) % 360}, 80%, 60%)`;
            if (mode === 'Ikuti cover') return renderSurface.dominantColor || '#ffffff';
            return eff.props?.color || '#ffffff';
        };

        // --- Hex to RGBA helper ---
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16) || 255;
            const g = parseInt(hex.slice(3, 5), 16) || 255;
            const b = parseInt(hex.slice(5, 7), 16) || 255;
            return `rgba(${r},${g},${b},${alpha})`;
        };

        // ============================================================
        // Main Render Loop
        // ============================================================
        const renderLoop = (rawTime) => {
            animationId = requestAnimationFrame(renderLoop);
            const t0 = performance.now();
            
            const dt = t0 - lastTimestamp;
            lastTimestamp = t0;
            if (window.m3IsPlaying === true) {
                simulatedTime += dt;
            }
            const time = simulatedTime;

            const width = canvas.width;
            const height = canvas.height;
            if (width === 0 || height === 0) return;

            ctx.clearRect(0, 0, width, height);

            const frame = renderFrameStore.getFrame();
            const debugState = frame?.debug || {};
            const audioDrivenBeat = debugState.beat?.debug?.detected || false;

            // Accumulators for CSS properties
            let brightness = renderSurface.postProcess.brightness * 100;
            let contrast = renderSurface.postProcess.contrast * 100;
            let saturation = renderSurface.postProcess.saturation * 100;
            let blur = renderSurface.postProcess.blur;
            let hueRotate = 0;
            let boxShadow = '';
            let transformScale = 1;
            let translateX = 0;
            let translateY = 0;
            let letterboxTop = 0, letterboxSide = 0, letterboxColor = '';

            // Update Audio Reactive Object Processor
            reactiveObjectProcessor.update(effectsRef.current, dt / 1000, window.m3IsPlaying === true);

            effectsRef.current.forEach(eff => {
                if (eff.enabled === false) return;

                const source = eff.source || eff.props?.source || 'kick';
                const isAudioDriven = source !== 'none' && source !== 'Selalu tampil';
                let rawValue = source === 'none' ? 1.0 : reactiveObjectProcessor.getValue(eff.id);
                if (window.m3IsPlaying !== true && isAudioDriven) {
                    rawValue = 0;
                }

                // Smooth interpolation
                let prev = smoothVals.get(eff.id) || 0;
                if (window.m3IsPlaying !== true && isAudioDriven) {
                    prev = 0;
                }
                const smoothVal = prev + (rawValue - prev) * 0.6;
                smoothVals.set(eff.id, smoothVal);

                const type = eff.presetId;
                const p = eff.props || {};
                const speed = p.speed !== undefined ? p.speed : 1.0;

                if (window.m3IsPlaying !== true && ['camera-shake', 'zoom-hentak', 'strobe-light', 'red-alert', 'rgb-impact', 'glitch-digital', 'old-film-dust'].includes(type)) {
                    return;
                }

                // ========================================
                // 1. GUNCANG KAMERA (camera-shake)
                // ========================================
                if (type === 'camera-shake') {
                    const strength = (p.strength ?? 23) / 100;
                    const size = (p.size ?? 27) / 100;
                    const mode = p.mode || 'Ringan — cepat (disarankan)';
                    const shape = p.shape || 'Semua arah';

                    let amp = 40 * rawValue * strength * (0.5 + size);
                    if (mode.includes('Kasar')) amp *= 2.0;
                    if (mode.includes('Halus')) amp *= 0.4;

                    if (shape === 'Horizontal' || shape === 'Semua arah') {
                        translateX += (Math.random() - 0.5) * amp;
                    }
                    if (shape === 'Vertikal' || shape === 'Semua arah') {
                        translateY += (Math.random() - 0.5) * amp;
                    }
                }

                // ========================================
                // 2. ZOOM HENTAK (zoom-hentak)
                // ========================================
                else if (type === 'zoom-hentak') {
                    // Skala amplitudo dikembalikan ke /400 untuk pengujian terisolasi
                    const depth = (p.depth ?? 50) / 400;
                    const shape = p.shape || 'Masuk';
                    
                    let currentZoom = 0;
                    if (source === 'metronom') {
                        // M3: Use tempo-locked beat phase for a consistent clock-like pulse
                        const beatPhase = debugState.beat?.beatPhase || 0;
                        currentZoom = depth * Math.exp(-beatPhase * 4); // exponential decay over the beat
                    } else {
                        // Legacy: Use envelope trigger
                        if (!effectStatesRef.current.has(eff.id)) {
                            effectStatesRef.current.set(eff.id, { val: 0, time: 0 });
                        }
                        const env = effectStatesRef.current.get(eff.id);
                        
                        // Trigger envelope using beat detector
                        if (audioDrivenBeat && env.time > 0.1) {
                            env.val = depth;
                            env.time = 0;
                        }
                        
                        env.time += dt / 1000;
                        const decayProgress = Math.min(1.0, env.time / 0.25);
                        currentZoom = env.val * (1 - decayProgress);
                    }
                    
                    if (shape === 'Masuk') transformScale += currentZoom;
                    else if (shape === 'Keluar') transformScale -= currentZoom;
                    else transformScale += (Math.sin(time / 200) > 0 ? currentZoom : -currentZoom);
                }

                // ========================================
                // 3. KILAT / STROBE (strobe-flash)
                // ========================================
                else if (type === 'strobe-flash') {
                    const bright = (p.brightness ?? 50) / 100;
                    // Square rawValue for a sharp peak (flash effect)
                    const flashIntensity = Math.pow(rawValue, 2) * bright * 2.5;
                    
                    if (flashIntensity > 0.02) {
                        const color = getColor(eff, time);
                        const c = typeof color === 'string' && color.startsWith('#') ? color : '#ffffff';
                        
                        ctx.globalCompositeOperation = 'screen';
                        // Gradient from top to bottom for a dramatic lightning strike lighting
                        const grad = ctx.createLinearGradient(0, 0, 0, height);
                        const alpha = Math.min(1.0, flashIntensity);
                        grad.addColorStop(0, hexToRgba(c, alpha));
                        grad.addColorStop(1, hexToRgba(c, alpha * 0.1));
                        
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, width, height);
                        
                        ctx.globalAlpha = 1.0;
                        ctx.globalCompositeOperation = 'source-over';
                        
                        // Boost CSS brightness and contrast for a blinding effect
                        brightness += 150 * flashIntensity;
                        contrast += 50 * flashIntensity;
                    }
                }

                // ========================================
                // 4. LAMPU DISKO (disco-light)
                // ========================================
                else if (type === 'disco-light') {
                    const bright = (p.brightness ?? 50) / 100;
                    const count = p.count ?? 4;
                    const size = (p.size ?? 50) / 50;
                    const shape = p.shape || 'Kerucut sorot';
                    const color = getColor(eff, time);

                    ctx.globalCompositeOperation = 'screen';

                    for (let i = 0; i < count; i++) {
                        const angle = Math.sin(time / (1000 / speed) + i * 1.5) * 0.8;
                        const baseX = (width / (count + 1)) * (i + 1);
                        const topX = baseX + Math.sin(angle) * width * 0.8;
                        const topY = -50;

                        if (shape === 'Kerucut sorot') {
                            const spread = (150 + smoothVal * 120) * size;
                            ctx.beginPath();
                            ctx.moveTo(baseX, height);
                            ctx.lineTo(topX - spread, topY);
                            ctx.lineTo(topX + spread, topY);
                            ctx.closePath();
                            ctx.globalAlpha = (0.15 + smoothVal * 0.35) * bright;
                            ctx.fillStyle = color;
                            ctx.fill();
                        } else if (shape === 'Beam vertikal') {
                            const w = (20 + smoothVal * 30) * size;
                            ctx.globalAlpha = (0.2 + smoothVal * 0.5) * bright;
                            ctx.fillStyle = color;
                            ctx.fillRect(topX - w / 2, 0, w, height);
                        } else if (shape === 'Batang') {
                            const w = (30 + smoothVal * 20) * size;
                            ctx.globalAlpha = (0.15 + smoothVal * 0.4) * bright;
                            ctx.fillStyle = color;
                            ctx.fillRect(baseX - w / 2, 0, w, height);
                        } else if (shape === 'Bulatan' || shape === 'Bulatan balik') {
                            const r = (40 + smoothVal * 60) * size;
                            const posY = shape === 'Bulatan balik' ? height - r : r;
                            ctx.beginPath();
                            ctx.arc(topX, posY, r, 0, Math.PI * 2);
                            ctx.globalAlpha = (0.2 + smoothVal * 0.5) * bright;
                            ctx.fillStyle = color;
                            ctx.fill();
                            ctx.shadowBlur = r * 2;
                            ctx.shadowColor = color;
                        }
                    }
                    ctx.globalAlpha = 1.0;
                    ctx.shadowBlur = 0;
                    ctx.globalCompositeOperation = 'source-over';
                }

                // ========================================
                // 5. NEON KEDALAMAN (neon-depth)
                // ========================================
                else if (type === 'neon-depth') {
                    const bright = (p.brightness ?? 50) / 100;
                    const size = (p.size ?? 50) / 50;
                    const shape = p.shape || 'Garis lurus';
                    const color = getColor(eff, time);

                    ctx.globalCompositeOperation = 'screen';
                    ctx.strokeStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 20 + smoothVal * 40;
                    ctx.lineWidth = (3 + smoothVal * 5) * size;
                    ctx.globalAlpha = (0.3 + smoothVal * 0.7) * bright;

                    // Draw neon border traces
                    const offset = (time / (2000 / speed)) % 1;
                    const perimeter = 2 * width + 2 * height;

                    for (let layer = 0; layer < 2; layer++) {
                        const layerOffset = (offset + layer * 0.5) % 1;
                        const dist = layerOffset * perimeter;
                        const trailLen = perimeter * 0.3;

                        ctx.beginPath();
                        for (let t = 0; t < trailLen; t += 4) {
                            const d = (dist - t + perimeter) % perimeter;
                            let x, y;
                            if (d < width) { x = d; y = 0; }
                            else if (d < width + height) { x = width; y = d - width; }
                            else if (d < 2 * width + height) { x = width - (d - width - height); y = height; }
                            else { x = 0; y = height - (d - 2 * width - height); }

                            if (shape === 'Gelombang') {
                                x += Math.sin(d / 30 + time / 300) * 8;
                                y += Math.cos(d / 30 + time / 300) * 8;
                            } else if (shape === 'Zigzag') {
                                const zigPhase = ((d / 20) % 2 < 1) ? 1 : -1;
                                x += zigPhase * 6;
                                y += zigPhase * 6;
                            }

                            if (t === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }

                    ctx.globalAlpha = 1.0;
                    ctx.shadowBlur = 0;
                    ctx.globalCompositeOperation = 'source-over';
                }

                // ========================================
                // 6. LAMPU KEDALAMAN (deep-light)
                // ========================================
                else if (type === 'deep-light') {
                    const bright = (p.brightness ?? 50) / 100;
                    const split = (p.split ?? 50) / 100; // 0 to 1
                    const shape = p.shape || 'Ikuti beat';
                    const c1 = typeof p.color === 'string' && p.color.startsWith('#') ? p.color : '#ffffff';
                    const c2 = typeof p.color2 === 'string' && p.color2.startsWith('#') ? p.color2 : '#00ffff';
                    
                    ctx.globalCompositeOperation = 'screen';
                    
                    let iLeft = 1.0;
                    let iRight = 1.0;
                    
                    if (shape === 'Ikuti beat') {
                        iLeft = 0.2 + smoothVal * 0.8;
                        iRight = 0.2 + smoothVal * 0.8;
                    } else if (shape === 'Silih berganti') {
                        const cycle = Math.sin(time * 0.004 * speed);
                        iLeft = 0.2 + Math.max(0, cycle) * 0.8 * (0.3 + smoothVal*0.7);
                        iRight = 0.2 + Math.max(0, -cycle) * 0.8 * (0.3 + smoothVal*0.7);
                    } else { // Panggung
                        const breath = Math.sin(time * 0.001 * speed) * 0.1;
                        iLeft = 0.6 + breath + smoothVal * 0.2;
                        iRight = 0.6 - breath + smoothVal * 0.2;
                    }
                    
                    const drawFogLight = (isLeft, color, intensity) => {
                        const gradientSize = width * (0.1 + split * 0.9); 
                        
                        // 1. Linear edge fog
                        let grad = ctx.createLinearGradient(
                            isLeft ? 0 : width, 0, 
                            isLeft ? gradientSize : width - gradientSize, 0
                        );
                        const alpha = intensity * bright;
                        grad.addColorStop(0, hexToRgba(color, alpha * 0.6));
                        grad.addColorStop(0.5, hexToRgba(color, alpha * 0.2));
                        grad.addColorStop(1, 'rgba(0,0,0,0)');
                        
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, width, height);
                        
                        // 2. Radial core lamp glow
                        const cx = isLeft ? 0 : width;
                        const cy = height / 2;
                        const rRadius = Math.max(width, height) * (0.3 + split * 0.7);
                        let rGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rRadius);
                        rGrad.addColorStop(0, hexToRgba(color, alpha * 0.8));
                        rGrad.addColorStop(0.3, hexToRgba(color, alpha * 0.3));
                        rGrad.addColorStop(1, 'rgba(0,0,0,0)');
                        
                        ctx.fillStyle = rGrad;
                        ctx.fillRect(0, 0, width, height);
                    };
                    
                    drawFogLight(true, c1, iLeft);
                    drawFogLight(false, c2, iRight);
                    
                    ctx.globalCompositeOperation = 'source-over';
                }

                // ========================================
                // 7. SINAR KEDALAMAN (god-rays)
                // ========================================
                else if (type === 'god-rays') {
                    const strength = (p.strength ?? 50) / 100;
                    const size = (p.size ?? 50) / 50;
                    const count = Math.floor(1 + ((p.count ?? 50) / 100) * 30); // 1 to 31 rays
                    const depthLvl = (p.depthLevel ?? 80) / 100;
                    const dir = p.direction || 'Atas';
                    const color = getColor(eff, time);

                    let ox = width/2, oy = height/2;
                    let centerAngle = 0;
                    if (dir === 'Atas') { ox = width / 2; oy = 0; centerAngle = Math.PI / 2; }
                    else if (dir === 'Kanan-atas') { ox = width; oy = 0; centerAngle = Math.PI * 0.75; }
                    else if (dir === 'Kanan') { ox = width; oy = height / 2; centerAngle = Math.PI; }
                    else if (dir === 'Kanan-bawah') { ox = width; oy = height; centerAngle = Math.PI * -0.75; }
                    else if (dir === 'Bawah') { ox = width / 2; oy = height; centerAngle = -Math.PI / 2; }
                    else if (dir === 'Kiri-bawah') { ox = 0; oy = height; centerAngle = -Math.PI * 0.25; }
                    else if (dir === 'Kiri') { ox = 0; oy = height / 2; centerAngle = 0; }
                    else if (dir === 'Kiri-atas') { ox = 0; oy = 0; centerAngle = Math.PI * 0.25; }

                    ctx.globalCompositeOperation = 'screen';
                    ctx.save();
                    ctx.translate(ox, oy);
                    
                    const random = (i) => {
                        let x = Math.sin(i * 1.2345) * 10000;
                        return x - Math.floor(x);
                    };

                    const spread = Math.PI * 1.2; // 216 degrees spread
                    const c = typeof color === 'string' && color.startsWith('#') ? color : '#ffaa55';
                    
                    ctx.globalAlpha = depthLvl;

                    for (let i = 0; i < count; i++) {
                        const rayAngle = centerAngle - spread/2 + (i / count) * spread + (random(i) * 0.3) + Math.sin(time*0.0005*speed + i)*0.1;
                        const rayWidth = (20 + random(i+1)*80 + smoothVal*40) * size;
                        const rayLen = Math.max(width, height) * (1.0 + random(i+2)*1.0) * size;

                        ctx.save();
                        ctx.rotate(rayAngle);

                        const grad = ctx.createLinearGradient(0, 0, rayLen, 0);
                        const alpha = (0.1 + smoothVal * 0.4) * strength * (0.4 + random(i+3)*0.6);
                        
                        grad.addColorStop(0, hexToRgba(c, alpha));
                        grad.addColorStop(0.3, hexToRgba(c, alpha * 0.5));
                        grad.addColorStop(1, 'rgba(0,0,0,0)');

                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(rayLen, -rayWidth/2);
                        ctx.lineTo(rayLen, rayWidth/2);
                        ctx.fill();
                        
                        // Core beam
                        ctx.fillStyle = hexToRgba('#ffffff', alpha * 0.5);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(rayLen * 0.6, -rayWidth/8);
                        ctx.lineTo(rayLen * 0.6, rayWidth/8);
                        ctx.fill();

                        ctx.restore();
                    }
                    ctx.restore();
                    ctx.globalAlpha = 1.0;
                    ctx.globalCompositeOperation = 'source-over';
                }

                // ========================================
                // 8. BOKEH KEDALAMAN (depth-bokeh)
                // ========================================
                else if (type === 'depth-bokeh') {
                    const bright = (p.brightness ?? 50) / 100;
                    const count = (p.count ?? 30) / 100;
                    const size = (p.size ?? 50) / 100;
                    const depthLvl = (p.depthLevel ?? 80) / 100;
                    const color = getColor(eff, time);
                    const shape = p.shape || 'Melayang';

                    let bgImg = targetElement.querySelector('img, video');
                    if (bgImg && bgImg.src) {
                        const depthMapData = getDepthMap(bgImg, 480, 270);
                        if (depthMapData) {
                            renderBokehDepth(
                                ctx, width, height,
                                time, speed, shape,
                                bright, depthLvl, size, count, color,
                                depthMapData, smoothVal
                            );
                        }
                    }
                }
                             // ========================================
                // 9. PINDAI KEDALAMAN (depth-scan)
                // ========================================
                else if (type === 'depth-scan') {
                    const bright = (p.brightness ?? 50) / 100;
                    const size = (p.size ?? 50) / 100;
                    const shape = p.shape || 'Maju';
                    const color = getColor(eff, time);
                    const count = 1 + Math.floor(((p.count ?? 50) / 100) * 4);
                    
                    let bgImg = targetElement.querySelector('img, video');
                    if (bgImg && bgImg.src) {
                        const depthMapData = getDepthMap(bgImg, 480, 270);
                        if (depthMapData) {
                            renderDepthScan(
                                ctx, width, height, 
                                time, speed, shape, 
                                0.05 + size * 0.25, count, bright, color, 
                                depthMapData, smoothVal
                            );
                        }
                    }
                }
                // ========================================
                // 10. KABUT KEDALAMAN (depth-fog)
                // ========================================
                else if (type === 'depth-fog') {
                    const density = (p.density ?? 50) / 100;
                    const depthLvl = (p.depthLevel ?? 80) / 100;
                    const shape = p.shape || 'Tenang';
                    const color = getColor(eff, time);

                    let bgImg = targetElement.querySelector('img, video');
                    if (bgImg && bgImg.src) {
                        const depthMapData = getDepthMap(bgImg, 480, 270);
                        if (depthMapData) {
                            renderFogDepth(
                                ctx, width, height,
                                time, speed, shape,
                                density, depthLvl, color,
                                depthMapData, smoothVal
                            );
                        }
                    }
                }

                // ========================================
                // 11. GLITCH (glitch-digital)
                // ========================================
                else if (type === 'glitch-digital') {
                    const intensity = (p.intensity ?? 50) / 100;
                    const freq = (p.frequency ?? 50) / 100;
                    const shape = p.shape || 'RGB Split';

                    if (rawValue > (1 - freq) * 0.8) {
                        if (shape === 'RGB Split' || shape === 'Digital') {
                            const shift = (5 + rawValue * 20) * intensity;
                            ctx.globalCompositeOperation = 'screen';
                            ctx.fillStyle = `rgba(255,0,0,${0.15 * intensity})`;
                            ctx.fillRect(shift, 0, width, height);
                            ctx.fillStyle = `rgba(0,255,255,${0.15 * intensity})`;
                            ctx.fillRect(-shift, 0, width, height);
                            ctx.globalCompositeOperation = 'source-over';
                        }
                        if (shape === 'Block' || shape === 'Digital') {
                            const blockCount = Math.floor(3 + rawValue * 8 * intensity);
                            for (let i = 0; i < blockCount; i++) {
                                const bx = Math.random() * width;
                                const by = Math.random() * height;
                                const bw = 20 + Math.random() * 100;
                                const bh = 5 + Math.random() * 20;
                                ctx.globalCompositeOperation = 'difference';
                                ctx.fillStyle = '#ffffff';
                                ctx.globalAlpha = 0.2 * intensity;
                                ctx.fillRect(bx, by, bw, bh);
                                ctx.globalAlpha = 1.0;
                                ctx.globalCompositeOperation = 'source-over';
                            }
                        }
                        hueRotate += (Math.random() > 0.5 ? 60 : -60) * rawValue * intensity;
                    }
                }

                // ========================================
                // 12. DEBU FILM TUA (old-film-dust)
                // ========================================
                else if (type === 'old-film-dust') {
                    const density = (p.density ?? 50) / 100;
                    const shape = p.shape || 'Ringan';
                    const color = p.color || '#ffffff';

                    let dustCount = Math.floor(200 * density);
                    if (shape === 'Sedang') dustCount = Math.floor(400 * density);
                    if (shape === 'Berat') dustCount = Math.floor(800 * density);

                    ctx.fillStyle = hexToRgba(color, 0.3 + smoothVal * 0.3);
                    for (let i = 0; i < dustCount; i++) {
                        ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random(), 1 + Math.random());
                    }

                    // Vertical scratch lines
                    if (shape !== 'Ringan' && Math.random() > 0.7) {
                        ctx.fillStyle = hexToRgba(color, 0.15);
                        ctx.fillRect(Math.random() * width, 0, 1 + Math.random() * 2, height);
                    }

                    // Sepia tint
                    saturation -= 40 * density;
                    boxShadow += `inset 0 0 300px rgba(112,66,20,${0.2 * density}), `;
                }

                // ========================================
                // 13. GARIS KECEPATAN (speed-lines)
                // ========================================
                else if (type === 'speed-lines') {
                    const intensity = (p.intensity ?? 50) / 100;
                    const size = (p.size ?? 50) / 50;
                    const shape = p.shape || 'Radial';
                    const color = p.color || '#ffffff';
                    const count = p.count ?? 60;

                    ctx.globalCompositeOperation = 'screen';
                    ctx.strokeStyle = hexToRgba(color, (0.1 + smoothVal * 0.4) * intensity);
                    
                    const timeAngle = time * 0.002 * (smoothVal + 0.5);
                    const random = (i) => {
                        let x = Math.sin(i * 1.2345) * 10000;
                        return x - Math.floor(x);
                    };

                    for (let i = 0; i < count; i++) {
                        ctx.lineWidth = (0.5 + random(i) * 3) * size;
                        if (shape === 'Radial') {
                            const angle = random(i + count) * Math.PI * 2 + timeAngle;
                            const centerClearance = (80 + random(i + count*2) * 150) * (1.5 - smoothVal * 0.5);
                            const lineLength = (100 + random(i + count*3) * 500) * intensity * size;
                            
                            const innerR = centerClearance;
                            const outerR = innerR + lineLength + Math.max(width, height) / 2;
                            const cx = width / 2, cy = height / 2;
                            ctx.beginPath();
                            ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
                            ctx.lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
                            ctx.stroke();
                        } else if (shape === 'Horizontal') {
                            const y = (random(i) * height + time * 0.2 * (smoothVal + 1)) % height;
                            const len = (100 + random(i + count) * 800) * intensity * size;
                            const dir = random(i + count*2) > 0.5 ? 1 : -1;
                            const startX = dir > 0 ? -100 : width + 100;
                            const endX = startX + dir * len;
                            ctx.beginPath();
                            ctx.moveTo(startX, y);
                            ctx.lineTo(endX, y);
                            ctx.stroke();
                        } else { // Vertikal
                            const x = (random(i) * width + time * 0.2 * (smoothVal + 1)) % width;
                            const len = (100 + random(i + count) * 800) * intensity * size;
                            const dir = random(i + count*2) > 0.5 ? 1 : -1;
                            const startY = dir > 0 ? -100 : height + 100;
                            const endY = startY + dir * len;
                            ctx.beginPath();
                            ctx.moveTo(x, startY);
                            ctx.lineTo(x, endY);
                            ctx.stroke();
                        }
                    }
                    ctx.globalCompositeOperation = 'source-over';
                }

                // ========================================
                // 14. GRAIN FILM (film-grain)
                // ========================================
                else if (type === 'film-grain') {
                    const intensity = (p.intensity ?? 50) / 100;
                    const shape = p.shape || 'Halus';
                    const size = (p.size ?? 50) / 50;

                    let grainSize = Math.max(0.1, size);
                    if (shape === 'Kasar') { grainSize = Math.max(0.1, 2.5 * size); }
                    if (shape === 'Film 8mm') { grainSize = Math.max(0.1, 1.5 * size); saturation -= 50 * intensity; }

                    const pattern = getGrainPattern(ctx, grainSize);
                    
                    ctx.save();
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.globalAlpha = intensity * 0.4;
                    ctx.fillStyle = pattern;
                    if (window.m3IsPlaying === true) {
                        ctx.translate(Math.random() * 256, Math.random() * 256);
                    }
                    ctx.fillRect(-256, -256, width + 256, height + 256);
                    ctx.restore();

                    if (shape === 'Film 8mm') {
                        boxShadow += `inset 0 0 400px rgba(112,66,20,${0.3 * intensity}), `;
                    }
                }

                // ========================================
                // 15. VIGNETTE
                // ========================================
                else if (type === 'vignette') {
                    const darkness = (p.darkness ?? 50) / 100;
                    const size = (p.size ?? 50) / 100;
                    const shape = p.shape || 'Bulat';
                    const color = p.color || '#000000';

                    const vigSize = (200 + (1 - size) * 600) * (1 - darkness * 0.3);

                    if (shape === 'Bulat') {
                        const grad = ctx.createRadialGradient(width / 2, height / 2, vigSize * 0.3, width / 2, height / 2, vigSize);
                        grad.addColorStop(0, 'rgba(0,0,0,0)');
                        grad.addColorStop(1, hexToRgba(color, 0.4 + darkness * 0.6));
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, width, height);
                    } else { // Kotak
                        boxShadow += `inset 0 0 ${vigSize * darkness}px ${hexToRgba(color, 0.5 + darkness * 0.5)}, `;
                    }
                }

                // ========================================
                // 16. LETTERBOX
                // ========================================
                else if (type === 'letterbox') {
                    const barH = (p.height ?? 50) / 100;
                    const size = (p.size ?? 50) / 50; // 0 to 2.0
                    const color = p.color || '#000000';
                    
                    // Add subtle audio bounce if there's audio input
                    const bounce = 1.0 + smoothVal * 0.3;
                    const h = barH * height * 0.15 * bounce;
                    
                    letterboxTop = h;
                    letterboxColor = color;
                    
                    // Left and right bars (Pillarbox) - only visible if Ukuran > 50%
                    const sideW = Math.max(0, (size - 1.0)) * width * 0.15 * bounce;
                    if (sideW > 0) {
                        letterboxSide = sideW;
                    }
                }

                // ========================================
                // 17. SCANLINE
                // ========================================
                else if (type === 'scanline') {
                    const density = (p.density ?? 50) / 100;
                    const size = (p.size ?? 50) / 50;
                    const shape = p.shape || 'Turun';
                    const color = p.color || '#000000';

                    const lineSpacing = Math.max(2, Math.floor(6 / size));
                    const alpha = 0.1 + density * 0.4;

                    ctx.fillStyle = hexToRgba(color, alpha);
                    let yOffset = 0;
                    if (shape === 'Turun') yOffset = (time / (50 / speed)) % (lineSpacing * 2);
                    else if (shape === 'Naik') yOffset = -((time / (50 / speed)) % (lineSpacing * 2));

                    for (let y = yOffset; y < height; y += lineSpacing * 2) {
                        ctx.fillRect(0, y, width, lineSpacing);
                    }
                }

                // ========================================
                // 18. LIGHT LEAK
                // ========================================
                else if (type === 'light-leak') {
                    const strength = (p.strength ?? 50) / 100;
                    const size = (p.size ?? 50) / 50;
                    const shape = p.shape || 'Kanan-atas';
                    const color = getColor(eff, time);
                    const source = eff.source || eff.props?.source || 'kick';
                    const isAudioDriven = source !== 'none' && source !== 'Selalu tampil';

                    // Position based on shape
                    let cx, cy;
                    if (shape === 'Kanan-atas') { cx = width; cy = 0; }
                    else if (shape === 'Kiri-atas') { cx = 0; cy = 0; }
                    else if (shape === 'Kiri-bawah') { cx = 0; cy = height; }
                    else if (shape === 'Kanan-bawah') { cx = width; cy = height; }
                    else { cx = width / 2; cy = height / 2; }

                    const maxDim = Math.max(width, height);
                    const baseRadius = maxDim * (1.0 + smoothVal * 0.5) * size * (0.5 + strength * 0.5);
                    
                    // If triggered by audio, use rawValue (beat) for energetic expansion instead of an arbitrary timer
                    const dynamicPulse = (isAudioDriven && window.m3IsPlaying === true)
                        ? (rawValue * maxDim * 0.4 * strength)
                        : (window.m3IsPlaying === true ? Math.sin(time / (500 / speed)) * maxDim * 0.2 * strength : 0);
                        
                    const pulseRadius = baseRadius + dynamicPulse;

                    ctx.globalCompositeOperation = 'screen';
                    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
                    const baseColor = typeof color === 'string' && color.startsWith('#') ? color : '#ff8800';
                    
                    // Keep robust base visibility while allowing the beat to boost brightness
                    const alphaCenter = Math.min(1.0, (0.6 + (isAudioDriven ? rawValue : smoothVal) * 0.4) * strength);
                    const alphaMid = Math.min(1.0, (0.3 + (isAudioDriven ? rawValue : smoothVal) * 0.3) * strength);
                    const alphaEdge = Math.min(1.0, (0.1 + (isAudioDriven ? rawValue : smoothVal) * 0.1) * strength);
                    
                    grad.addColorStop(0, hexToRgba(baseColor, alphaCenter));
                    grad.addColorStop(0.5, hexToRgba(baseColor, alphaMid));
                    grad.addColorStop(0.8, hexToRgba(baseColor, alphaEdge));
                    grad.addColorStop(1, 'rgba(0,0,0,0)');

                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, width, height);

                    // Global brightness boost on beat hit only when playing
                    if (window.m3IsPlaying === true && isAudioDriven) {
                        brightness += 40 * (0.2 + smoothVal * 0.8) * strength;
                        contrast += 10 * (0.2 + smoothVal * 0.8) * strength;
                    }
                    ctx.globalCompositeOperation = 'source-over';
                }

                // ========================================
                // LEGACY: Keep old presetIds working
                // ========================================
                else if (type === 'border-bounce') {
                    const shape = p.shape || 'Masuk';
                    let zoomAmt = 0.08 * smoothVal * ((p.intensity ?? 50) / 100);
                    if (shape === 'Masuk') transformScale += zoomAmt;
                    else if (shape === 'Keluar') transformScale -= zoomAmt;
                    else transformScale += (Math.sin(time / 200) > 0 ? zoomAmt : -zoomAmt);
                }
                else if (type === 'moving-spotlights' || type === 'stage-lasers') {
                    // Legacy: redirect to disco-light renderer
                    const count = p.count || 4;
                    const color = getColor(eff, time);
                    ctx.globalCompositeOperation = 'screen';
                    for (let i = 0; i < count; i++) {
                        const angle = Math.sin(time / (1000 / speed) + i * 1.5) * 0.8;
                        const baseX = (width / (count + 1)) * (i + 1);
                        const topX = baseX + Math.sin(angle) * width * 0.8;
                        const spread = 150 + smoothVal * 120;
                        ctx.beginPath(); ctx.moveTo(baseX, height);
                        ctx.lineTo(topX - spread, -50); ctx.lineTo(topX + spread, -50);
                        ctx.closePath();
                        ctx.globalAlpha = (0.15 + smoothVal * 0.35) * ((p.intensity ?? 50) / 100);
                        ctx.fillStyle = color; ctx.fill();
                    }
                    ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
                }
                else if (type === 'edge-trace') {
                    const color = getColor(eff, time);
                    const perimeter = 2 * width + 2 * height;
                    const distance = ((time / (3000 / speed)) * perimeter) % perimeter;
                    let x = 0, y = 0;
                    if (distance < width) { x = distance; y = 0; }
                    else if (distance < width + height) { x = width; y = distance - width; }
                    else if (distance < 2 * width + height) { x = width - (distance - width - height); y = height; }
                    else { x = 0; y = height - (distance - 2 * width - height); }
                    ctx.shadowBlur = 30 + smoothVal * 50; ctx.shadowColor = color; ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(x, y, 10 + smoothVal * 15, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;
                }
                else if (type === 'strobe-light' || type === 'red-alert' || type === 'rgb-impact') {
                    if (rawValue > 0.5) {
                        if (type === 'strobe-light') {
                            brightness += 100 * rawValue * ((p.intensity ?? 50) / 100);
                            ctx.fillStyle = getColor(eff, time); ctx.globalAlpha = rawValue * ((p.intensity ?? 50) / 100);
                            ctx.fillRect(0,0,width,height); ctx.globalAlpha = 1.0;
                        } else if (type === 'red-alert') {
                            boxShadow += `inset 0 0 ${100 * rawValue}px rgba(255,0,0,${(p.intensity??50)/100}), `;
                        } else {
                            hueRotate += (Math.random() > 0.5 ? 90 : -90) * rawValue * ((p.intensity??50)/100);
                        }
                    }
                }
                else if (type === 'crt-scanlines') {
                    ctx.fillStyle = `rgba(0,0,0,${0.3 * ((p.intensity??50)/100)})`;
                    for (let i = 0; i < height; i += 4) ctx.fillRect(0, i, width, 2);
                }
                else if (type === 'cinemascope') {
                    const h = ((p.thickness||12) / 100) * height / 2;
                    ctx.fillStyle = '#000'; ctx.fillRect(0,0,width,h); ctx.fillRect(0,height-h,width,h);
                }
                else if (type === 'dreamy-bloom' || type === 'divine-light') {
                    brightness += smoothVal * 40 * ((p.intensity??50)/100);
                    blur += smoothVal * ((p.intensity??50)/100);
                }
            });

            // Apply accumulated CSS
            if (targetElement) {
                const newFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
                const newTransform = `scale(${transformScale}) translate(${translateX}px, ${translateY}px)`;
                
                if (targetElement.dataset.lastFilter !== newFilter) {
                    targetElement.style.filter = newFilter;
                    targetElement.dataset.lastFilter = newFilter;
                }
                
                if (targetElement.dataset.lastTransform !== newTransform) {
                    targetElement.style.transform = newTransform;
                    targetElement.dataset.lastTransform = newTransform;
                }
            }
            targetElement.style.boxShadow = boxShadow.length > 0 ? boxShadow.slice(0, -2) : '';
            targetElement.style.transition = 'filter 0.05s ease-out';

            if (letterboxRef.current) {
                if (letterboxTop > 0 || letterboxSide > 0) {
                    letterboxRef.current.style.borderStyle = 'solid';
                    letterboxRef.current.style.borderColor = letterboxColor;
                    letterboxRef.current.style.borderWidth = `${letterboxTop}px ${letterboxSide}px ${letterboxTop}px ${letterboxSide}px`;
                    letterboxRef.current.style.display = 'block';
                } else {
                    letterboxRef.current.style.display = 'none';
                }
            }

            const t1 = performance.now();
            window.m3Diagnostics = window.m3Diagnostics || {};
            window.m3Diagnostics.renderTime = t1 - t0;
            window.m3Diagnostics.domOutputs = { brightness, contrast, saturation, blur, hueRotate, transformScale, translateX, translateY };
        };

        renderLoop(performance.now());

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            targetElement.style.filter = '';
            targetElement.style.boxShadow = '';
            targetElement.style.transform = '';
        };
    }, [targetRef]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-[100] mix-blend-screen"
                style={{ width: '100%', height: '100%' }}
            />
            <div 
                ref={letterboxRef}
                className="absolute inset-0 pointer-events-none z-[101]"
                style={{ boxSizing: 'border-box', display: 'none' }}
            />
        </>
    );
}
