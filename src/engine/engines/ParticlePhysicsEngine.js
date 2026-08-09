/**
 * ParticlePhysicsEngine.js
 * Consolidated Core Engine 4 — Particle Physics Visualizer Renderer.
 * 
 * Handles 12 Presets:
 * - particle-explosion-burst, particle-rising-fireflies, particle-gravity-well, particle-audio-fountain
 * - particle-constellation-nodes, particle-wave-emitter, particle-orbital-dust, particle-starfield-warp
 * - galaxy-spiral-galaxy, galaxy-starfield-flight, galaxy-black-hole, abstract-chaotic-splatter
 */

import { ICoreEngine } from './ICoreEngine.js';

export class ParticlePhysicsEngine extends ICoreEngine {
  constructor() {
    super('ParticlePhysicsEngine', 'Particle Physics Core Engine');
    this.particles = [];
    this.maxParticles = 300;
  }

  initialize(renderContext) {
    const width = renderContext?.viewport?.width || 1920;
    const height = renderContext?.viewport?.height || 1080;
    this.particles = [];
    
    // Spawn initial pool
    for (let i = 0; i < 150; i++) {
      this.particles.push(this._createParticle(width, height));
    }
  }

  _createParticle(width, height, emitter = null) {
    const cx = width / 2;
    const cy = height / 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;

    return {
      x: emitter ? emitter.x : cx + (Math.random() - 0.5) * 200,
      y: emitter ? emitter.y : cy + (Math.random() - 0.5) * 200,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      alpha: 0.5 + Math.random() * 0.5,
      life: Math.random() * 100,
      maxLife: 80 + Math.random() * 60
    };
  }

  update(renderContext, audioState) {
    const viewport = renderContext?.viewport || { width: 1920, height: 1080 };
    const width = viewport.width || 1920;
    const height = viewport.height || 1080;
    const bass = audioState?.bass || 0;
    const impulse = 1.0 + bass * 2.0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * impulse;
      p.y += p.vy * impulse;
      p.life += 1;

      // Respawn dead particle
      if (p.life >= p.maxLife || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.particles[i] = this._createParticle(width, height);
      }
    }
  }

  /**
   * Universal render method for Particle Physics presets.
   * @param {Object} renderContext RenderContext
   * @param {Object} audioState AudioState
   * @param {Object} presetConfig Preset Configuration JSON
   * @returns {Object} Diagnostic render metrics
   */
  render(renderContext, audioState, presetConfig = {}) {
    const ctx = renderContext?.ctx;
    const viewport = renderContext?.viewport || { width: 1920, height: 1080 };
    const width = viewport.width || 1920;
    const height = viewport.height || 1080;

    const isConstellation = Boolean(presetConfig.connectDistance);
    const particleColor = presetConfig.color || presetConfig.colorLeft || '#00ffcc';
    const connectDist = presetConfig.connectDistance || 80;

    if (!this.particles.length) {
      this.initialize(renderContext);
    }

    this.update(renderContext, audioState);

    let activeParticles = 0;
    let connectionsDrawn = 0;

    if (ctx && typeof ctx.save === 'function') {
      ctx.save();
      ctx.fillStyle = particleColor;
      ctx.strokeStyle = particleColor;
    }

    // Render Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (ctx && typeof ctx.arc === 'function') {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (typeof ctx.fill === 'function') ctx.fill();
      }
      activeParticles++;

      // Constellation Connecting Lines
      if (isConstellation && ctx && typeof ctx.moveTo === 'function') {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDist) {
            ctx.globalAlpha = (1 - dist / connectDist) * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            if (typeof ctx.stroke === 'function') ctx.stroke();
            connectionsDrawn++;
          }
        }
      }
    }

    if (ctx && typeof ctx.restore === 'function') {
      ctx.restore();
    }

    return {
      engineId: this.id,
      presetId: presetConfig.id || 'default-particle',
      activeParticles,
      connectionsDrawn,
      status: 'RENDERED'
    };
  }

  dispose(renderContext) {
    this.particles = [];
  }
}
