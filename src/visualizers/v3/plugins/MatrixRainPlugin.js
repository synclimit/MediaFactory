/**
 * MatrixRainPlugin.js [Visualizer 3 Plugin]
 * Matrix Rain — glowing digital code rain (inspired by The Matrix)
 * where column rainfall density and speed are driven by audio frequencies.
 * Fully pure and deterministic implementation — NO random state.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class MatrixRainPlugin extends IVisualizerPlugin {
  constructor() {
    super('matrix-rain', 'Matrix Rain', 'Glowing digital code rain columns whose intensity follows audio frequency energy');
    this.defaultConfig = {
      colorPrimary: '#00FF41',
      colorBright: '#CCFFCC',
      colorFade: '#003B00',
      colorAccent: '#00F5FF',
      columnCount: 40,
      fontSize: 16,
      speed: 1.0,
      dropLength: 22
    };
  }

  // Deterministic hash for character/position seeding
  hash(n) {
    let x = Math.sin(n + 1.0) * 43758.5453123;
    return x - Math.floor(x);
  }

  // Get a character from hash
  getChar(seed) {
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF<>{}|!@#$%';
    const idx = Math.floor(this.hash(seed) * chars.length);
    return chars[idx] || '0';
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;

    // Matrix rain transparent background
    ctx.clearRect(0, 0, width, height);

    const isFastMode = typeof window !== 'undefined' && window.fastRenderState ? window.fastRenderState.isFastMode() : false;
    const isLivePlaying = Boolean(window.m3IsPlaying) || isFastMode;
    const t = isLivePlaying ? (timeline.timestamp * (cfg.speed || 1.0)) : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;

    const colCount = cfg.columnCount || 40;
    const fontSize = cfg.fontSize || 16;
    const dropLen = cfg.dropLength || 22;

    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';

    for (let col = 0; col < colCount; col++) {
      const colX = ((col + 0.5) / colCount) * width;
      const freqIdx = Math.floor((col / colCount) * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const audioSpeed = 0.4 + freqVal * 1.5 + bass * 0.8;

      // Deterministic drop head position using hash + timestamp
      const colSeed = col * 17.31;
      const dropOffset = this.hash(colSeed * 3.7) * height;
      const dropHeadY = ((t * audioSpeed * height * 0.35 + dropOffset) % (height + dropLen * fontSize)) - dropLen * fontSize;

      // Draw the drop column top-to-bottom
      for (let row = 0; row < dropLen; row++) {
        const charY = dropHeadY + row * fontSize;
        if (charY < -fontSize || charY > height + fontSize) continue;

        const rowProgress = row / (dropLen - 1); // 0 (head) to 1 (tail)
        const isBright = row === 0;

        // Color: bright head → green body → dark fade
        let color, alpha;
        if (isBright) {
          color = cfg.colorBright || '#CCFFCC';
          alpha = 0.95 + energy * 0.05;
          ctx.shadowColor = cfg.colorBright || '#CCFFCC';
          ctx.shadowBlur = 15 + energy * 15;
        } else if (rowProgress < 0.15) {
          color = cfg.colorAccent || '#00F5FF';
          alpha = 0.7 + freqVal * 0.25;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
        } else {
          color = cfg.colorPrimary || '#00FF41';
          alpha = Math.max(0.05, (1.0 - rowProgress) * (0.6 + freqVal * 0.3));
          ctx.shadowColor = cfg.colorPrimary || '#00FF41';
          ctx.shadowBlur = 4 + freqVal * 6;
        }

        // Change character over time (deterministic)
        const charSeed = colSeed + row * 3.14 + Math.floor(t * 4 + row * 0.5);
        const char = this.getChar(charSeed);

        ctx.fillStyle = color;
        ctx.globalAlpha = Math.min(1.0, alpha);
        ctx.fillText(char, colX, charY);
      }
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new MatrixRainPlugin());
