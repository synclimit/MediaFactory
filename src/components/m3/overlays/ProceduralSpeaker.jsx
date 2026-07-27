import React, { useRef, useEffect } from "react";
import { beatEngine } from "../../../services/audio/BeatEngine";

export function ProceduralSpeaker({ 
  opacity = 1, 
  speed = 1.0, 
  color = "#00ffcc", 
  rings = 0, 
  model = "studio",
  pumpIntensity = 2.5,
  audioReactive = true,
  width = 700,
  height = 700,
  className = "absolute inset-0 w-full h-full pointer-events-none",
  style = {}
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let animationId;

    const normOpacity = opacity > 1 ? opacity / 100 : opacity;
    let smoothedCore = 0;

    const resize = () => {
      if (!canvas) return;
      const parentW = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
      const parentH = canvas.parentElement ? canvas.parentElement.clientHeight : 0;
      
      const targetW = parentW > 0 ? parentW : (width || 700);
      const targetH = parentH > 0 ? parentH : (height || 700);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };
    
    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // SEMUA MODEL MURNI NUANSA HITAM & ABU-ABU MEKANIKAL (PERBEDAAN HANYA PADA BENTUK/STRUKTUR GEOMETRI)
    const getModelTheme = (modelName) => {
      const m = (modelName || 'studio').toLowerCase();
      switch (m) {
        case 'inverted': // 2. Inverted Concave & 8 Bolts (Charcoal)
          return {
            frame: ["#161616", "#2c2c2c", "#1a1a1a", "#080808"],
            frameEdge: "#4a4a4a",
            surround: ["#080808", "#1e1e1e", "#444444", "#181818", "#040404"],
            cone: ["#0a0a0a", "#1b1b1b", "#2e2e2e", "#141414"],
            coneRibs: "rgba(255, 255, 255, 0.05)",
            dome: ["#111111", "#1e1e1e", "#2a2a2a", "#111111", "#050505"],
            bolt: ["#aaaaaa", "#555555", "#1c1c1c"],
            boltCount: 8,
            type: "inverted"
          };
        case 'carbon': // 3. Hex Carbon Fiber & Rivets (Graphite)
          return {
            frame: ["#181818", "#333333", "#222222", "#0a0a0a"],
            frameEdge: "#555555",
            surround: ["#050505", "#1c1c1c", "#4c4c4c", "#171717", "#020202"],
            cone: ["#111111", "#222222", "#353535", "#181818"],
            coneRibs: "rgba(255, 255, 255, 0.12)",
            dome: ["#5e5e5e", "#2e2e2e", "#181818", "#0c0c0c", "#040404"],
            bolt: ["#d4d4d4", "#777777", "#222222"],
            boltCount: 12,
            type: "carbon"
          };
        case 'dual': // 4. Dual-Surround Extreme Excursion (Deep Black)
          return {
            frame: ["#0d0d0d", "#222222", "#151515", "#050505"],
            frameEdge: "#333333",
            surround: ["#020202", "#181818", "#3d3d3d", "#121212", "#000000"],
            cone: ["#050505", "#121212", "#1f1f1f", "#0a0a0a"],
            coneRibs: "rgba(255, 255, 255, 0.03)",
            dome: ["#444444", "#222222", "#111111", "#060606", "#020202"],
            bolt: ["#888888", "#444444", "#111111"],
            boltCount: 4,
            type: "dual"
          };
        case 'flat': // 5. Flat-Piston Honeycomb Disc (Matte Black)
          return {
            frame: ["#121212", "#2a2a2a", "#1a1a1a", "#080808"],
            frameEdge: "#666666",
            surround: ["#050505", "#1c1c1c", "#454545", "#171717", "#030303"],
            cone: ["#151515", "#1f1f1f", "#262626", "#141414"],
            coneRibs: "rgba(0, 0, 0, 0.4)",
            dome: ["#2d2d2d", "#222222", "#1a1a1a", "#0f0f0f", "#080808"],
            bolt: ["#cccccc", "#666666", "#222222"],
            boltCount: 6,
            type: "flat"
          };
        case 'turbofan': // 6. Turbofan Spoked Heavy-Duty (Gunmetal)
          return {
            frame: ["#141618", "#2c3036", "#1f2226", "#0a0b0d"],
            frameEdge: "#555b66",
            surround: ["#060708", "#1c1e22", "#484d57", "#17191c", "#030405"],
            cone: ["#0c0d0e", "#1b1e22", "#2e333a", "#14161a"],
            coneRibs: "rgba(255, 255, 255, 0.08)",
            dome: ["#666c75", "#33373d", "#1c1e22", "#0f1012", "#050607"],
            bolt: ["#dbe0e8", "#777d87", "#22252b"],
            boltCount: 8,
            type: "turbofan"
          };
        case 'rgb_ring': // 7. RGB LED Ring (Cyberpunk)
          return {
            frame: ["#050505", "#151515", "#0a0a0a", "#020202"],
            frameEdge: "#222222",
            surround: ["#040404", "#111111", "#333333", "#080808", "#020202"],
            cone: ["#050505", "#111111", "#1a1a1a", "#050505"],
            coneRibs: "rgba(255, 255, 255, 0.02)",
            dome: ["#333333", "#1a1a1a", "#0a0a0a", "#050505", "#000000"],
            bolt: ["#888888", "#444444", "#111111"],
            boltCount: 6,
            type: "rgb_ring"
          };
        case 'neon_white': // 8. Glowing White Neon (Clean & Bright)
          return {
            frame: ["#111111", "#222222", "#181818", "#050505"],
            frameEdge: "#444444",
            surround: ["#080808", "#222222", "#444444", "#111111", "#050505"],
            cone: ["#0a0a0a", "#161616", "#252525", "#0a0a0a"],
            coneRibs: "rgba(255, 255, 255, 0.06)",
            dome: ["#dddddd", "#888888", "#333333", "#111111", "#050505"],
            bolt: ["#ffffff", "#aaaaaa", "#333333"],
            boltCount: 8,
            type: "neon_white"
          };
        case 'studio': // 1. Studio Reference (Classic Dome) default
        default:
          return {
            frame: ["#111111", "#282828", "#1d1d1d", "#080808"],
            frameEdge: "#383838",
            surround: ["#060606", "#1f1f1f", "#4a4a4a", "#171717", "#030303"],
            cone: ["#080808", "#161616", "#2a2a2a", "#101010"],
            coneRibs: "rgba(255, 255, 255, 0.04)",
            dome: ["#6e6e6e", "#363636", "#1a1a1a", "#0a0a0a", "#040404"],
            bolt: ["#d4d4d4", "#666666", "#1c1c1c"],
            boltCount: 6,
            type: "studio"
          };
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      const maxR = Math.min(canvas.width, canvas.height) * 0.46;
      const theme = getModelTheme(model);

      // 1. Ambil Data Analisis Audio Real-Time
      const audioState = beatEngine ? beatEngine.getState() : null;
      const isAudioActive = audioReactive && audioState && audioState.isPlaying && audioState.energy > 0.005;

      let bass = 0, mid = 0, treble = 0, kick = 0, beatStrength = 0;
      if (isAudioActive) {
        bass = audioState.bass || 0;
        mid = audioState.mid || 0;
        treble = audioState.treble || 0;
        kick = audioState.kick || 0;
        beatStrength = audioState.beatStrength || 0;
      }

      // Hitung tendangan fisik subwoofer (KEMPANG-KEMPIS KECIL & TERKONTROL)
      const intensity = pumpIntensity !== undefined ? pumpIntensity : 2.5;
      const targetDisplacement = isAudioActive 
        ? Math.min(0.08, (kick * 0.04 + bass * 0.03 + beatStrength * 0.015) * (intensity / 2.5))
        : (Math.sin(frame * 0.08 * speed) + 1) * 0.006 * (intensity / 2.5);
      
      // Attack snappy agar getaran berasa menendang rapi (tidak berlebihan)
      smoothedCore += (targetDisplacement - smoothedCore) * 0.45;
      const pump = smoothedCore; 

      ctx.globalAlpha = normOpacity;

      // =========================================================================
      // LAYER 1: RANGKA LOGAM LUAR (Chassis Rim) - STATIS KOKOH TIDAK KEMPANG-KEMPIS
      // =========================================================================
      const frameOuterR = maxR;
      const frameInnerR = maxR * 0.82;
      
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;

      const frameGrad = ctx.createRadialGradient(cx, cy, frameInnerR, cx, cy, frameOuterR);
      frameGrad.addColorStop(0, theme.frame[0]);
      frameGrad.addColorStop(0.3, theme.frame[1]);
      frameGrad.addColorStop(0.7, theme.frame[2]);
      frameGrad.addColorStop(1, theme.frame[3]);

      ctx.beginPath();
      ctx.arc(cx, cy, frameOuterR, 0, Math.PI * 2);
      ctx.fillStyle = frameGrad;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Bevel highlight tepi luar rangka
      ctx.beginPath();
      ctx.arc(cx, cy, frameOuterR, 0, Math.PI * 2);
      ctx.strokeStyle = theme.frameEdge;
      ctx.lineWidth = theme.type === 'dual' ? 3.5 : 2;
      ctx.stroke();

      // Rim shadow tepi dalam rangka
      ctx.beginPath();
      ctx.arc(cx, cy, frameInnerR, 0, Math.PI * 2);
      ctx.strokeStyle = "#030303";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // =========================================================================
      // RGB ATAU NEON GLOW RING (khusus model rgb_ring & neon_white)
      // =========================================================================
      if (theme.type === 'rgb_ring' || theme.type === 'neon_white') {
        const ringR = frameInnerR + (frameOuterR - frameInnerR) * 0.5; // di tengah-tengah frame
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.lineWidth = maxR * 0.05;
        
        const glowPulse = isAudioActive ? Math.min(1.0, kick * 1.5 + bass * 0.8 + 0.3) : (Math.sin(frame * 0.05 * speed) + 1) * 0.2 + 0.4;
        
        if (theme.type === 'rgb_ring') {
          // Putaran RGB Cyberpunk
          const time = frame * 0.02 * speed;
          // Note: createConicGradient is available in most modern canvas implementations
          if (ctx.createConicGradient) {
            const rgbGrad = ctx.createConicGradient(time, cx, cy);
            rgbGrad.addColorStop(0, `rgba(255, 50, 50, ${glowPulse})`);
            rgbGrad.addColorStop(0.33, `rgba(50, 255, 50, ${glowPulse})`);
            rgbGrad.addColorStop(0.66, `rgba(50, 100, 255, ${glowPulse})`);
            rgbGrad.addColorStop(1, `rgba(255, 50, 50, ${glowPulse})`);
            ctx.strokeStyle = rgbGrad;
          } else {
            ctx.strokeStyle = `rgba(0, 255, 255, ${glowPulse})`; // Fallback
          }
          ctx.shadowColor = `rgba(255, 255, 255, ${glowPulse * 0.8})`;
        } else {
          // Neon White Bright Glow
          ctx.strokeStyle = `rgba(255, 255, 255, ${glowPulse})`;
          ctx.shadowColor = `rgba(255, 255, 255, ${glowPulse})`;
        }
        
        ctx.shadowBlur = 20 * glowPulse;
        ctx.stroke();
        
        // Inner white core
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.lineWidth = maxR * 0.02;
        ctx.strokeStyle = `rgba(255, 255, 255, ${glowPulse * 0.9})`;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      }

      // =========================================================================
      // LAYER 2: BAUT / SKRUP / RIVETS / CLAMPS
      // =========================================================================
      const boltCount = theme.boltCount || 6;
      const boltRadius = maxR * 0.91;
      for (let b = 0; b < boltCount; b++) {
        const angle = (b * Math.PI * 2) / boltCount + Math.PI / boltCount;
        const bx = cx + Math.cos(angle) * boltRadius;
        const by = cy + Math.sin(angle) * boltRadius;
        const boltSize = maxR * (boltCount > 8 ? 0.025 : 0.035);

        if (theme.type === 'dual') {
          // 4 Heavy Clamp Blocks (Balok Penjepit Subwoofer Excursion Tinggi)
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(angle);
          ctx.fillStyle = "#1e1e1e";
          ctx.fillRect(-boltSize * 1.5, -boltSize * 0.8, boltSize * 3, boltSize * 1.6);
          ctx.strokeStyle = "#555555";
          ctx.lineWidth = 1;
          ctx.strokeRect(-boltSize * 1.5, -boltSize * 0.8, boltSize * 3, boltSize * 1.6);
          ctx.restore();
        } else {
          // Lubang reses hitam baut
          ctx.beginPath();
          ctx.arc(bx, by, boltSize * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = "#040404";
          ctx.fill();

          // Kepala baut metallic
          const boltGrad = ctx.createRadialGradient(bx - boltSize*0.3, by - boltSize*0.3, 0, bx, by, boltSize);
          boltGrad.addColorStop(0, theme.bolt[0]);
          boltGrad.addColorStop(0.5, theme.bolt[1]);
          boltGrad.addColorStop(1, theme.bolt[2]);

          ctx.beginPath();
          ctx.arc(bx, by, boltSize, 0, Math.PI * 2);
          ctx.fillStyle = boltGrad;
          ctx.fill();

          // Socket hex tengah baut
          ctx.beginPath();
          ctx.arc(bx, by, boltSize * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = "#080808";
          ctx.fill();
        }
      }

      // =========================================================================
      // LAYER KEMPANG-KEMPIS (Surround Karet, Cone, & Dust Cap memantul ke depan/belakang)
      // =========================================================================
      ctx.save();
      // Clip ke batas dalam rangka logam (frameInnerR * 0.99) agar bagian yang bergerak TIDAK AKAN PERNAH keluar atau memotong lingkaran asli/luar!
      ctx.beginPath();
      ctx.arc(cx, cy, frameInnerR * 0.99, 0, Math.PI * 2);
      ctx.clip();

      ctx.translate(cx, cy);
      const currentScale = 1.0 + pump; 
      ctx.scale(currentScale, currentScale);

      // 3. RUBBER ROLL SURROUND (Karet Suspensi Roll)
      const surroundOuterR = frameInnerR;
      const surroundInnerR = maxR * 0.62;
      const surroundMidR = (surroundOuterR + surroundInnerR) * 0.52;

      if (theme.type === 'dual') {
        // Dual Roll Surround (Dua cincin suspensi konsentris untuk Extreme Bass)
        const midPointR = (surroundOuterR + surroundInnerR) / 2;
        
        // Roll Luar
        const grad1 = ctx.createRadialGradient(0, 0, midPointR, 0, 0, surroundOuterR);
        grad1.addColorStop(0, "#020202");
        grad1.addColorStop(0.5, "#383838");
        grad1.addColorStop(1, "#020202");
        ctx.beginPath();
        ctx.arc(0, 0, surroundOuterR, 0, Math.PI * 2);
        ctx.fillStyle = grad1;
        ctx.fill();

        // Roll Dalam
        const grad2 = ctx.createRadialGradient(0, 0, surroundInnerR, 0, 0, midPointR);
        grad2.addColorStop(0, "#020202");
        grad2.addColorStop(0.5, "#383838");
        grad2.addColorStop(1, "#020202");
        ctx.beginPath();
        ctx.arc(0, 0, midPointR, 0, Math.PI * 2);
        ctx.fillStyle = grad2;
        ctx.fill();
      } else {
        // Standard Single High-Gloss Roll
        const surroundGrad = ctx.createRadialGradient(0, 0, surroundInnerR, 0, 0, surroundOuterR);
        surroundGrad.addColorStop(0, theme.surround[0]);
        surroundGrad.addColorStop(0.25, theme.surround[1]);
        surroundGrad.addColorStop(0.48, theme.surround[2]); // Puncak kilau karet
        surroundGrad.addColorStop(0.75, theme.surround[3]);
        surroundGrad.addColorStop(1, theme.surround[4]);

        ctx.beginPath();
        ctx.arc(0, 0, surroundOuterR, 0, Math.PI * 2);
        ctx.fillStyle = surroundGrad;
        ctx.fill();
      }

      // 4. SPEAKER CONE (Diaphragma Kerucut)
      const coneOuterR = surroundInnerR;
      const coneInnerR = maxR * 0.28;

      const coneGrad = ctx.createRadialGradient(-maxR * 0.08, -maxR * 0.08, coneInnerR, 0, 0, coneOuterR);
      coneGrad.addColorStop(0, theme.cone[0]);
      coneGrad.addColorStop(0.35, theme.cone[1]);
      coneGrad.addColorStop(0.7, theme.cone[2]);
      coneGrad.addColorStop(1, theme.cone[3]);

      ctx.beginPath();
      ctx.arc(0, 0, coneOuterR, 0, Math.PI * 2);
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // Struktur khusus pada permukaan kerucut
      if (theme.type === 'carbon') {
        // Anyaman Serat Carbon Fiber (Diagonal cross-hatch lines)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        for (let i = -coneOuterR; i < coneOuterR; i += 15) {
          ctx.beginPath();
          ctx.moveTo(i, -coneOuterR);
          ctx.lineTo(i + coneOuterR, coneOuterR);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-i, -coneOuterR);
          ctx.lineTo(-i - coneOuterR, coneOuterR);
          ctx.stroke();
        }
      } else if (theme.type === 'turbofan') {
        // 8 Structural Reinforcing Spokes (Jari-jari penopang kerucut)
        ctx.strokeStyle = "#25282e";
        ctx.lineWidth = 6;
        for (let s = 0; s < 8; s++) {
          const ang = (s * Math.PI * 2) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * coneInnerR, Math.sin(ang) * coneInnerR);
          ctx.lineTo(Math.cos(ang) * coneOuterR, Math.sin(ang) * coneOuterR);
          ctx.stroke();
        }
      } else if (theme.type === 'flat') {
        // Honeycomb grid disc pattern
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 2;
        for (let r = coneInnerR; r < coneOuterR; r += 12) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Standard Concentric Ribs
        const ridgeCount = 4;
        ctx.strokeStyle = theme.coneRibs;
        ctx.lineWidth = 1.5;
        for (let r = 1; r <= ridgeCount; r++) {
          const ridgeR = coneInnerR + (coneOuterR - coneInnerR) * (r / (ridgeCount + 1));
          ctx.beginPath();
          ctx.arc(0, 0, ridgeR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 5. DUST CAP / CENTER DOME
      const domeR = coneInnerR;
      
      if (theme.type === 'inverted') {
        // Inverted Concave Dome (Kubah cekung ke dalam seperti mangkuk)
        ctx.shadowColor = "rgba(255, 255, 255, 0.1)";
        ctx.shadowBlur = 5;
        
        const invGrad = ctx.createRadialGradient(domeR * 0.2, domeR * 0.2, 0, 0, 0, domeR);
        invGrad.addColorStop(0, "#050505"); // Pusat cekung sangat gelap
        invGrad.addColorStop(0.6, "#141414");
        invGrad.addColorStop(0.9, "#2a2a2a");
        invGrad.addColorStop(1, "#080808");

        ctx.beginPath();
        ctx.arc(0, 0, domeR, 0, Math.PI * 2);
        ctx.fillStyle = invGrad;
        ctx.fill();
      } else if (theme.type === 'flat') {
        // Seamless Flat Center Disc
        ctx.fillStyle = "#161616";
        ctx.beginPath();
        ctx.arc(0, 0, domeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#444444";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Protruding 3D Specular Dome
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;

        const domeGrad = ctx.createRadialGradient(-domeR * 0.28, -domeR * 0.28, 0, 0, 0, domeR);
        domeGrad.addColorStop(0, theme.dome[0]);   // Specular highlight utama
        domeGrad.addColorStop(0.25, theme.dome[1]);
        domeGrad.addColorStop(0.65, theme.dome[2]);
        domeGrad.addColorStop(0.92, theme.dome[3]);
        domeGrad.addColorStop(1, theme.dome[4]);

        ctx.beginPath();
        ctx.arc(0, 0, domeR, 0, Math.PI * 2);
        ctx.fillStyle = domeGrad;
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.restore(); // Akhiri sesi transform moving parts

      frame++;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [opacity, speed, color, rings, model, pumpIntensity, audioReactive, width, height]);

  return <canvas ref={canvasRef} width={width || 700} height={height || 700} className={className} style={{ ...style, width: '100%', height: '100%' }} />;
}

export default ProceduralSpeaker;
