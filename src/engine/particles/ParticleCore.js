/**
 * ParticleCore.js
 * Unified Pure Deterministic Particle Engine for M3 Engine.
 * Shared 1:1 between Frontend (Live Editor Preview) and Backend (Export Video MP4).
 */

export class ParticleCore {
  /**
   * Deterministic PRNG helper based on seed index
   */
  static getSeed(index, offset = 0) {
    const val = Math.sin((index + offset) * 12.9898 + 78.233) * 43758.5453;
    return val - Math.floor(val);
  }

  /**
   * Render a frame of particles onto a 2D canvas context.
   * @param {CanvasRenderingContext2D} ctx    Canvas 2D Context
   * @param {number} width                    Canvas width
   * @param {number} height                   Canvas height
   * @param {number} timestamp                Current time in seconds
   * @param {Object} config                   Particle configuration
   * @param {Object} audioState               Audio FFT state (optional for beat reactivity)
   */
  static renderFrame(ctx, width, height, timestamp = 0, config = {}, audioState = {}) {
    if (!ctx || width <= 0 || height <= 0) return;

    const count = parseInt(config.count) || 50;
    const shape = config.shape || 'shape_circle';
    const flow = config.flow || 'flow_float';
    const trail = config.trail || 'trail_none';
    const fillColor = config.fillColor || config.color || '#ffffff';
    const strokeColor = config.strokeColor || '#000000';
    const strokeWidth = parseFloat(config.strokeWidth) || 0;
    const globalOpacity = (config.opacity !== undefined ? parseFloat(config.opacity) : 100) / 100;
    const scaleMult = parseFloat(config.scale) || 1.0;
    const speedMult = parseFloat(config.speedMultiplier) || 1.0;

    const scaleX = width / 1920;
    const scaleY = height / 1080;
    const baseScale = Math.min(scaleX, scaleY);

    // Trail handling
    if (trail === 'trail_fade') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // Beat Reactivity Scale Factor
    let beatScale = 1.0;
    if (config.beatReactive && audioState) {
      const bassVal = audioState.bass || audioState.energy || 0;
      const reactLevel = (config.beatReactLevel !== undefined ? parseFloat(config.beatReactLevel) : 40) / 100;
      beatScale = 1.0 + (bassVal * reactLevel);
    }

    ctx.save();
    ctx.globalAlpha = globalOpacity;
    const blendModeLower = (config.blendMode || 'Screen').toLowerCase();
    ctx.globalCompositeOperation = blendModeLower === 'screen' ? 'screen' : (blendModeLower === 'additive' ? 'lighter' : 'source-over');

    const t = timestamp || 0;

    for (let i = 0; i < count; i++) {
      const s1 = this.getSeed(i, 1.1);
      const s2 = this.getSeed(i, 2.3);
      const s3 = this.getSeed(i, 3.7);

      const baseParticleSize = (config.randomScale ? s1 * 8 + 2 : 5) * scaleMult;
      let px = 0;
      let py = 0;
      let pScale = 1.0;
      let pAlpha = 0.4 + 0.6 * Math.sin(t * 2.5 + s1 * 10.0);

      const speed = (25 + s2 * 35) * speedMult;

      if (flow === 'flow_float') {
        px = (s1 * width + Math.sin(t * 1.5 + s2 * 6.28) * (40 * scaleX) + width) % width;
        const totalTravel = height + 60 * scaleY;
        const offset = s2 * totalTravel;
        py = height + 30 * scaleY - ((t * speed * scaleY + offset) % totalTravel);
      } else if (flow === 'flow_rain') {
        px = (s1 * width + Math.sin(t * 2.0 + s2 * 6.28) * (30 * scaleX) + width) % width;
        const totalTravel = height + 60 * scaleY;
        const offset = s2 * totalTravel;
        py = ((t * speed * 3.0 * scaleY + offset) % totalTravel) - 30 * scaleY;
      } else if (flow === 'flow_snow') {
        px = (s1 * width + Math.sin(t * 1.2 + s2 * 6.28) * (50 * scaleX) + width) % width;
        const totalTravel = height + 60 * scaleY;
        const offset = s2 * totalTravel;
        py = ((t * speed * 1.2 * scaleY + offset) % totalTravel) - 30 * scaleY;
      } else if (flow === 'flow_wind_left') {
        const totalTravel = width + 60 * scaleX;
        const offset = s2 * totalTravel;
        px = width + 30 * scaleX - ((t * speed * 2.5 * scaleX + offset) % totalTravel);
        py = (s1 * height + Math.sin(t * 1.8 + s2 * 6.28) * (30 * scaleY) + height) % height;
      } else if (flow === 'flow_wind_right') {
        const totalTravel = width + 60 * scaleX;
        const offset = s2 * totalTravel;
        px = ((t * speed * 2.5 * scaleX + offset) % totalTravel) - 30 * scaleX;
        py = (s1 * height + Math.sin(t * 1.8 + s2 * 6.28) * (30 * scaleY) + height) % height;
      } else if (flow === 'flow_starfield') {
        const starAngle = s1 * Math.PI * 2;
        const starSpread = s2 * 0.8 + 0.2;
        const progress = ((t * 0.4 * speedMult + s3) % 1.0);
        const maxR = Math.sqrt(width * width + height * height) / 2;
        const r = progress * maxR * starSpread;
        px = (width / 2) + Math.cos(starAngle) * r;
        py = (height / 2) + Math.sin(starAngle) * r;
        pScale = 0.4 + (progress * 2.2);
        pAlpha = Math.max(0.35, Math.min(1.0, 0.2 + progress * 1.2));
      } else if (flow === 'flow_orbit') {
        const orbitAngle = s1 * Math.PI * 2 + t * (s2 - 0.5) * 2.5 * speedMult;
        const orbitRadius = (s3 * 0.35 + 0.1) * Math.min(width, height);
        px = width / 2 + Math.cos(orbitAngle) * orbitRadius;
        py = height / 2 + Math.sin(orbitAngle) * orbitRadius;
      } else if (flow === 'flow_explosion' || flow === 'flow_implosion') {
        const dir = flow === 'flow_explosion' ? 1 : -1;
        const angle = s1 * Math.PI * 2;
        const spd = (40 + s2 * 60) * speedMult * dir;
        const maxDist = Math.min(width, height) * 0.5;
        const dist = ((t * spd + s3 * maxDist) % maxDist + maxDist) % maxDist;
        px = width / 2 + Math.cos(angle) * dist;
        py = height / 2 + Math.sin(angle) * dist;
      } else if (flow === 'flow_drift' || flow === 'flow_swirl' || flow === 'flow_spiral') {
        const swirlAngle = t * 1.5 * speedMult + s1 * Math.PI * 2;
        px = (s1 * width + Math.sin(swirlAngle) * 40 * scaleX + width) % width;
        py = (s2 * height + Math.cos(swirlAngle) * 40 * scaleY + height) % height;
      } else {
        px = (s1 * width + Math.sin(t * 1.2 + s2 * 6.28) * 50 * scaleX + width) % width;
        py = (s2 * height + Math.cos(t * 1.2 + s2 * 6.28) * 50 * scaleY + height) % height;
      }

      const pAngle = config.randomRotation
        ? s1 * Math.PI * 2 + t * (s2 - 0.5) * 3 * speedMult
        : ((parseFloat(config.rotation) || 0) * Math.PI / 180);

      const computedSize = baseParticleSize * baseScale * beatScale * pScale;
      const drawSize = Math.max(3, computedSize);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pAngle);
      ctx.globalAlpha = Math.max(0.05, Math.min(1.0, globalOpacity * pAlpha * (0.8 + (audioState.energy || 0) * 0.4)));

      ctx.fillStyle = fillColor;
      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth * baseScale;
      }

      ctx.beginPath();
      this.drawShapePath(ctx, shape, drawSize);
      ctx.fill();
      if (strokeWidth > 0) ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw precise vector path for particle shapes
   */
  static drawShapePath(ctx, shape, s) {
    if (shape === 'shape_circle') {
      ctx.arc(0, 0, s, 0, Math.PI * 2);
    } else if (shape === 'shape_square' || shape === 'shape_pixel') {
      ctx.rect(-s, -s, s * 2, s * 2);
    } else if (shape === 'shape_triangle') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s, s);
      ctx.lineTo(-s, s);
      ctx.closePath();
    } else if (shape === 'shape_diamond') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
    } else if (shape === 'shape_star') {
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * s, -Math.sin((18 + i * 72) / 180 * Math.PI) * s);
        ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (s / 2), -Math.sin((54 + i * 72) / 180 * Math.PI) * (s / 2));
      }
      ctx.closePath();
    } else if (shape === 'shape_heart') {
      ctx.moveTo(0, s / 2);
      ctx.bezierCurveTo(0, -s / 2, -s, -s, -s, -s / 4);
      ctx.bezierCurveTo(-s, s / 2, 0, s / 2, 0, s);
      ctx.bezierCurveTo(0, s / 2, s, s / 2, s, -s / 4);
      ctx.bezierCurveTo(s, -s, 0, -s / 2, 0, s / 2);
    } else if (shape === 'shape_hexagon') {
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(s * Math.cos(i * Math.PI / 3), s * Math.sin(i * Math.PI / 3));
      }
      ctx.closePath();
    } else if (shape === 'shape_music_note') {
      ctx.arc(-s / 2, s / 2, s / 2, 0, Math.PI * 2);
      ctx.arc(s * 1.2, s / 2, s / 2, 0, Math.PI * 2);
      ctx.rect(0, -s, s / 4, s * 1.5);
      ctx.rect(s * 1.7, -s, s / 4, s * 1.5);
      ctx.rect(0, -s, s * 1.9, s / 3);
    } else if (shape === 'shape_lightning') {
      ctx.moveTo(s / 2, -s);
      ctx.lineTo(-s / 2, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(-s / 2, s);
      ctx.lineTo(s / 2, -s / 4);
      ctx.lineTo(0, -s / 4);
      ctx.closePath();
    } else if (shape === 'shape_flame' || shape === 'shape_droplet') {
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s, 0, s, s, 0, s);
      ctx.bezierCurveTo(-s, s, -s, 0, 0, -s);
    } else if (shape === 'shape_snowflake') {
      for (let i = 0; i < 6; i++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(s * Math.cos(i * Math.PI / 3), s * Math.sin(i * Math.PI / 3));
      }
    } else if (shape === 'shape_leaf') {
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s, -s / 2, 0, s);
      ctx.quadraticCurveTo(-s, -s / 2, 0, -s);
    } else if (shape === 'shape_feather') {
      ctx.moveTo(-s / 2, s);
      ctx.quadraticCurveTo(0, 0, s / 2, -s);
      ctx.quadraticCurveTo(-s / 4, -s / 4, -s / 2, s);
    } else if (shape === 'shape_bubble' || shape === 'shape_ring') {
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      if (shape === 'shape_bubble') {
        ctx.moveTo(-s / 3, -s / 3);
        ctx.arc(-s / 3, -s / 3, s / 4, 0, Math.PI / 2);
      }
    } else if (shape === 'shape_crystal') {
      ctx.moveTo(0, -s);
      ctx.lineTo(s / 2, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s / 2, 0);
      ctx.closePath();
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
    } else {
      // Default Circle
      ctx.arc(0, 0, s, 0, Math.PI * 2);
    }
  }
}
