/**
 * PrismRefractPlugin.js [Visualizer 3 Plugin]
 * Prism Refract — a single white light beam enters a prism and
 * splits into a full spectrum rainbow fan that pulses with audio.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class PrismRefractPlugin extends IVisualizerPlugin {
  constructor() {
    super('prism-refract', 'Prism Refract', 'White light splits through a prism into a pulsing full-spectrum rainbow fan');
    this.defaultConfig = {
      prismX: 0.35,
      prismY: 0.5,
      beamCount: 32,
      fanAngle: 60,
      maxBeamLength: 480,
      incomingAngle: 210,
      glowIntensity: 1.0
    };
  }

  hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(255 * c).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;

    ctx.clearRect(0, 0, width, height);

    const isFastMode = typeof window !== 'undefined' && window.fastRenderState ? window.fastRenderState.isFastMode() : false;
    const isLivePlaying = Boolean(window.m3IsPlaying) || isFastMode;
    const t = isLivePlaying ? timeline.timestamp : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;
    const treble = isLivePlaying ? (audioState?.treble || 0) : 0;

    // Prism apex position
    const px = width * (cfg.prismX || 0.35);
    const py = height * (cfg.prismY || 0.5);

    const beamCount = cfg.beamCount || 32;
    const fanAngle = (cfg.fanAngle || 60) * (Math.PI / 180);
    const fanHalf = fanAngle / 2;
    const maxBeamLen = cfg.maxBeamLength || 480;
    const incomingRad = ((cfg.incomingAngle || 210) * Math.PI) / 180;

    // Draw incoming white beam
    const incomingLen = width * 0.28 + energy * 40;
    const ibx = px + Math.cos(incomingRad) * incomingLen;
    const iby = py + Math.sin(incomingRad) * incomingLen;

    const incomingGrad = ctx.createLinearGradient(ibx, iby, px, py);
    incomingGrad.addColorStop(0, 'rgba(255,255,255,0)');
    incomingGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    incomingGrad.addColorStop(1, 'rgba(255,255,255,0.9)');

    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 20 + energy * 20;
    ctx.strokeStyle = incomingGrad;
    ctx.lineWidth = 3 + energy * 4;
    ctx.globalAlpha = 0.8 + energy * 0.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ibx, iby);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Draw prism triangle
    const prismSize = 55 + bass * 20;
    const prismAngle = Math.PI / 3;
    const p1x = px; const p1y = py - prismSize;
    const p2x = px - prismSize * Math.sin(prismAngle); const p2y = py + prismSize * 0.5;
    const p3x = px + prismSize * Math.sin(prismAngle); const p3y = py + prismSize * 0.5;

    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(200,220,255,0.7)';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(p3x, p3y);
    ctx.closePath();
    ctx.stroke();

    // Prism glass fill
    const prismFill = ctx.createLinearGradient(p2x, py, p3x, py);
    prismFill.addColorStop(0, 'rgba(100,150,255,0.15)');
    prismFill.addColorStop(1, 'rgba(200,100,255,0.15)');
    ctx.fillStyle = prismFill;
    ctx.fill();

    // Draw refracted rainbow beams
    const baseOutputAngle = -Math.PI * 0.1; // pointing right with spread
    for (let i = 0; i < beamCount; i++) {
      const beamProgress = i / (beamCount - 1);
      const angle = baseOutputAngle - fanHalf + beamProgress * fanAngle;
      const freqIdx = Math.floor(beamProgress * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const audioMod = beamProgress < 0.33 ? bass : (beamProgress < 0.66 ? energy : treble);

      const hue = beamProgress * 360;
      const color = this.hslToHex(hue, 100, 60);
      const beamLen = maxBeamLen * (0.3 + freqVal * 0.5 + audioMod * 0.2 + energy * 0.1);

      const bx = px + Math.cos(angle) * beamLen;
      const by = py + Math.sin(angle) * beamLen;

      const beamGrad = ctx.createLinearGradient(px, py, bx, by);
      beamGrad.addColorStop(0, color + 'FF');
      beamGrad.addColorStop(0.5, color + 'BB');
      beamGrad.addColorStop(1, color + '00');

      // Glow pass
      ctx.shadowColor = color;
      ctx.shadowBlur = (15 + freqVal * 25) * (cfg.glowIntensity || 1.0);
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 6 + freqVal * 6;
      ctx.globalAlpha = 0.15 + freqVal * 0.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Bright core beam
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5 + freqVal * 2;
      ctx.globalAlpha = 0.7 + freqVal * 0.3;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new PrismRefractPlugin());
