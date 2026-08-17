/**
 * NeuralNetworkPlugin.js [Visualizer 3 Plugin]
 * Neural Network — animated node-edge graph where nodes pulse
 * and connections glow in sync with audio frequency clusters.
 * Fully pure and deterministic implementation.
 */

import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { visualizerRegistryV3 } from '../registry/VisualizerRegistry.js';

export class NeuralNetworkPlugin extends IVisualizerPlugin {
  constructor() {
    super('neural-network', 'Neural Network', 'Animated AI neural network graph pulsing and transmitting signals with audio');
    this.defaultConfig = {
      colorNode: '#00F5FF',
      colorEdge: '#7B2FFF',
      colorSignal: '#FFD700',
      colorActive: '#FF006E',
      nodeCount: 28,
      maxConnectionDist: 260,
      speed: 0.5
    };
  }

  // Deterministic seeded value [0,1)
  seed(n) {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  render(renderContext) {
    const { ctx, viewport, audioState, timeline, config } = renderContext;
    const cfg = { ...this.defaultConfig, ...config };

    const width = viewport.width;
    const height = viewport.height;

    ctx.clearRect(0, 0, width, height);

    const isFastMode = typeof window !== 'undefined' && window.fastRenderState ? window.fastRenderState.isFastMode() : false;
    const isLivePlaying = Boolean(window.m3IsPlaying) || isFastMode;
    const t = isLivePlaying ? (timeline.timestamp * (cfg.speed || 0.5)) : 0;
    const freqs = audioState?.frequencies || new Float32Array(64);
    const bass = isLivePlaying ? (audioState?.bass || 0) : 0;
    const energy = isLivePlaying ? (audioState?.energy || 0) : 0;
    const treble = isLivePlaying ? (audioState?.treble || 0) : 0;

    const nodeCount = cfg.nodeCount || 28;
    const maxDist = cfg.maxConnectionDist || 260;

    // Build node positions (deterministic, slowly drifting with time)
    const nodes = [];
    const margin = 80;
    for (let i = 0; i < nodeCount; i++) {
      const baseX = margin + this.seed(i * 3.1) * (width - margin * 2);
      const baseY = margin + this.seed(i * 7.3) * (height - margin * 2);
      const driftSpeed = 0.15 + this.seed(i * 11.7) * 0.25;
      const driftAngle = this.seed(i * 5.9) * Math.PI * 2;
      const driftAmp = 20 + this.seed(i * 2.3) * 30;

      const freqIdx = Math.floor((i / nodeCount) * freqs.length);
      const freqVal = freqs[freqIdx] || 0.3;
      const audioDrift = 1.0 + (i % 3 === 0 ? bass : (i % 3 === 1 ? energy : treble)) * 0.5;

      const x = baseX + Math.cos(driftAngle + t * driftSpeed) * driftAmp * audioDrift;
      const y = baseY + Math.sin(driftAngle + t * driftSpeed * 1.3) * driftAmp * audioDrift;

      const size = 5 + freqVal * 10 + energy * 5;
      const isActive = freqVal > 0.55;

      nodes.push({ x, y, size, freqVal, isActive, freqIdx });
    }

    // Draw edges between nearby nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) continue;

        const proximity = 1.0 - dist / maxDist;
        const signalActive = nodes[i].isActive || nodes[j].isActive;
        const avgFreq = (nodes[i].freqVal + nodes[j].freqVal) * 0.5;

        // Animate signal pulse traveling along the edge
        const signalProgress = (t * 1.5 + this.seed(i * 31 + j * 17)) % 1.0;
        const signalX = nodes[i].x + (nodes[j].x - nodes[i].x) * signalProgress;
        const signalY = nodes[i].y + (nodes[j].y - nodes[i].y) * signalProgress;

        const edgeColor = signalActive ? (cfg.colorActive || '#FF006E') : (cfg.colorEdge || '#7B2FFF');
        const edgeAlpha = proximity * (0.2 + avgFreq * 0.4) * (signalActive ? 1.4 : 1.0);

        ctx.shadowColor = edgeColor;
        ctx.shadowBlur = 6 + avgFreq * 8;
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 0.8 + proximity * 2 + avgFreq * 1.5;
        ctx.globalAlpha = Math.min(1.0, edgeAlpha);
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();

        // Draw traveling signal dot
        if (signalActive && proximity > 0.5) {
          ctx.shadowColor = cfg.colorSignal || '#FFD700';
          ctx.shadowBlur = 15;
          ctx.fillStyle = cfg.colorSignal || '#FFD700';
          ctx.globalAlpha = proximity * 0.9;
          ctx.beginPath();
          ctx.arc(signalX, signalY, 3 + avgFreq * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw nodes on top
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i];
      const nodeColor = node.isActive ? (cfg.colorActive || '#FF006E') : (cfg.colorNode || '#00F5FF');

      // Glow halo
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 20 + node.freqVal * 25 + energy * 15;
      const nodeGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 2);
      nodeGrad.addColorStop(0, nodeColor + 'FF');
      nodeGrad.addColorStop(0.5, nodeColor + '80');
      nodeGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nodeGrad;
      ctx.globalAlpha = 0.4 + node.freqVal * 0.4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core node dot
      ctx.shadowBlur = 10;
      ctx.fillStyle = node.isActive ? '#FFFFFF' : nodeColor;
      ctx.globalAlpha = 0.85 + node.freqVal * 0.15;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}

visualizerRegistryV3.register(new NeuralNetworkPlugin());
