/**
 * CaYatur Audio-Reactive Procedural Backgrounds Engine
 * Adapted from CaYatur/SoundVisualizer (MIT License)
 * Compatible with Astrofox / MediaFactory Canvas2D & WebGL rendering pipelines
 */

export const CAYATUR_BG_PRESETS = [
  { id: 'fluid', name: 'Fluid Mesh Gradient', type: 'fluid', description: 'Flowing multi-color mesh gradient with audio bursts' },
  { id: 'waveLayers', name: 'Ocean Wave Layers', type: 'waveLayers', description: 'Layered sine wave crests swelling to audio bass' },
  { id: 'network', name: 'Neural Network Mesh', type: 'network', description: 'Drifting neural nodes with proximity connection links' },
  { id: 'digitalRain', name: 'Cyber Matrix Rain', type: 'digitalRain', description: 'Falling luminous glyph trails reacting to tempo' },
  { id: 'bokeh', name: 'Bokeh Ambient Orbs', type: 'bokeh', description: 'Floating soft orbs with bass pulse & glow' },
  { id: 'pulseRings', name: 'Shockwave Pulse Rings', type: 'pulseRings', description: 'Concentric shockwave rings expanding on kick drums' },
  { id: 'aurora', name: 'Aurora Curtains', type: 'aurora', description: 'Undulating northern lights curtains' }
];

export class CaYaturBackgrounds {
  constructor() {
    this.time = 0;
    this.seed = 1337;

    // Network nodes
    this.nodes = [];
    this.initNetwork(60);

    // Bokeh particles
    this.bokehOrbs = [];
    this.initBokeh(45);

    // Matrix Rain columns
    this.rainColumns = [];
    this.initRain(55);

    // Pulse Rings
    this.rings = [];
  }

  initNetwork(count) {
    this.nodes = [];
    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0015,
        vy: (Math.random() - 0.5) * 0.0015,
        radius: 2 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  initBokeh(count) {
    this.bokehOrbs = [];
    for (let i = 0; i < count; i++) {
      this.bokehOrbs.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0008,
        vy: -0.0005 - Math.random() * 0.001,
        radius: 15 + Math.random() * 45,
        colorIdx: Math.floor(Math.random() * 5),
        alpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: 1 + Math.random() * 2
      });
    }
  }

  initRain(cols) {
    this.rainColumns = [];
    for (let i = 0; i < cols; i++) {
      this.rainColumns.push({
        x: i / cols,
        y: Math.random(),
        speed: 0.003 + Math.random() * 0.007,
        length: 8 + Math.floor(Math.random() * 16),
        charIdx: Math.floor(Math.random() * 100)
      });
    }
  }

  draw(type, ctx, width, height, audio = {}, dt = 0.016) {
    this.time += dt;
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const treble = audio.treble || 0;
    const rms = audio.rms || (bass * 0.5 + mid * 0.3 + treble * 0.2);

    switch (type) {
      case 'fluid':
        this.renderFluid(ctx, width, height, bass, mid, treble, rms);
        break;
      case 'waveLayers':
        this.renderWaveLayers(ctx, width, height, bass, mid, treble, rms);
        break;
      case 'network':
        this.renderNetwork(ctx, width, height, bass, mid, treble, rms);
        break;
      case 'digitalRain':
        this.renderDigitalRain(ctx, width, height, bass, mid, treble, rms);
        break;
      case 'bokeh':
        this.renderBokeh(ctx, width, height, bass, mid, treble, rms);
        break;
      case 'pulseRings':
        this.renderPulseRings(ctx, width, height, bass, mid, treble, rms);
        break;
      case 'aurora':
      default:
        this.renderAurora(ctx, width, height, bass, mid, treble, rms);
        break;
    }
  }

  renderFluid(ctx, w, h, bass, mid, treble, rms) {
    const t = this.time * 0.6;
    const cx = w / 2;
    const cy = h / 2;

    // Dark base
    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, w, h);

    const gradCount = 4;
    for (let i = 0; i < gradCount; i++) {
      const angle = t * 0.4 + (i * Math.PI * 2) / gradCount;
      const dist = Math.min(w, h) * (0.2 + 0.15 * Math.sin(t * 0.5 + i) + bass * 0.12);
      const gx = cx + Math.cos(angle) * dist;
      const gy = cy + Math.sin(angle) * dist;
      const r = Math.min(w, h) * (0.45 + 0.2 * Math.cos(t * 0.3 + i) + bass * 0.25);

      const radGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      if (i === 0) {
        radGrad.addColorStop(0, `rgba(249, 115, 22, ${0.45 + bass * 0.35})`); // Neon Orange
        radGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      } else if (i === 1) {
        radGrad.addColorStop(0, `rgba(14, 165, 233, ${0.4 + treble * 0.35})`); // Electric Cyan
        radGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      } else if (i === 2) {
        radGrad.addColorStop(0, `rgba(168, 85, 247, ${0.4 + mid * 0.35})`); // Purple Neon
        radGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      } else {
        radGrad.addColorStop(0, `rgba(160, 20, 240, ${0.35 + rms * 0.3})`); // Violet
        radGrad.addColorStop(1, 'rgba(160, 20, 240, 0)');
      }

      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  renderWaveLayers(ctx, w, h, bass, mid, treble, rms) {
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, w, h);

    const layers = 5;
    const t = this.time * 1.2;

    for (let l = 0; l < layers; l++) {
      const depth = l / (layers - 1);
      const yBase = h * (0.45 + depth * 0.45);
      const amp = (15 + depth * 35) * (1 + bass * (1.5 - depth * 0.5));
      const freq = 0.003 + (1 - depth) * 0.004;
      const speed = t * (0.8 + depth * 0.6);

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = yBase + Math.sin(x * freq + speed + l * 1.5) * amp + Math.cos(x * freq * 0.5 - speed * 0.7) * (amp * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      const alpha = 0.15 + depth * 0.35;
      const grad = ctx.createLinearGradient(0, yBase - amp, 0, h);
      if (l % 2 === 0) {
        grad.addColorStop(0, `rgba(14, 165, 233, ${alpha})`);
        grad.addColorStop(1, `rgba(2, 44, 84, ${alpha * 1.2})`);
      } else {
        grad.addColorStop(0, `rgba(249, 115, 22, ${alpha * 0.8})`);
        grad.addColorStop(1, `rgba(80, 20, 5, ${alpha})`);
      }

      ctx.fillStyle = grad;
      ctx.fill();

      // Glowing top crest line
      ctx.lineWidth = 1.5 + depth;
      ctx.strokeStyle = l % 2 === 0 ? `rgba(56, 189, 248, ${0.4 + bass * 0.5})` : `rgba(251, 146, 60, ${0.4 + bass * 0.5})`;
      ctx.stroke();
    }
  }

  renderNetwork(ctx, w, h, bass, mid, treble, rms) {
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, w, h);

    const maxDist = Math.min(w, h) * (0.18 + bass * 0.08);

    // Update nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.x += node.vx * (1 + bass * 1.5);
      node.y += node.vy * (1 + bass * 1.5);

      if (node.x < 0) node.x = 1;
      if (node.x > 1) node.x = 0;
      if (node.y < 0) node.y = 1;
      if (node.y > 1) node.y = 0;
    }

    // Draw links
    for (let i = 0; i < this.nodes.length; i++) {
      const ni = this.nodes[i];
      const px1 = ni.x * w;
      const py1 = ni.y * h;

      for (let j = i + 1; j < this.nodes.length; j++) {
        const nj = this.nodes[j];
        const px2 = nj.x * w;
        const py2 = nj.y * h;

        const dx = px2 - px1;
        const dy = py2 - py1;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * (0.25 + bass * 0.5);
          ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`;
          ctx.lineWidth = 1 + bass * 1.5;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
        }
      }

      // Draw node point
      const nodeR = ni.radius * (1 + bass * 0.6);
      ctx.fillStyle = `rgba(249, 115, 22, ${0.6 + bass * 0.4})`;
      ctx.beginPath();
      ctx.arc(px1, py1, nodeR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderDigitalRain(ctx, w, h, bass, mid, treble, rms) {
    ctx.fillStyle = 'rgba(4, 8, 14, 0.25)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '12px monospace';
    const glyphs = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';

    for (let i = 0; i < this.rainColumns.length; i++) {
      const col = this.rainColumns[i];
      col.y += col.speed * (1 + bass * 2.0);
      if (col.y > 1) {
        col.y = 0;
        col.length = 6 + Math.floor(Math.random() * 18);
      }

      const cx = col.x * w;
      const headY = col.y * h;

      for (let j = 0; j < col.length; j++) {
        const cy = headY - j * 14;
        if (cy < 0 || cy > h) continue;

        const alpha = (1 - j / col.length) * (0.5 + treble * 0.5);
        if (j === 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + bass * 0.1})`; // Bright white head
        } else {
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`; // Matrix green
        }

        const char = glyphs[(col.charIdx + j) % glyphs.length];
        ctx.fillText(char, cx, cy);
      }
    }
  }

  renderBokeh(ctx, w, h, bass, mid, treble, rms) {
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, w, h);

    const colors = [
      [249, 115, 22],  // Orange
      [14, 165, 233],  // Cyan
      [168, 85, 247],  // Purple
      [236, 72, 153],  // Pink
      [16, 185, 129]   // Emerald
    ];

    for (let i = 0; i < this.bokehOrbs.length; i++) {
      const orb = this.bokehOrbs[i];
      orb.y += orb.vy * (1 + bass * 1.5);
      orb.x += orb.vx;

      if (orb.y < -0.1) orb.y = 1.1;
      if (orb.x < -0.1) orb.x = 1.1;
      if (orb.x > 1.1) orb.x = -0.1;

      const px = orb.x * w;
      const py = orb.y * h;
      const pr = orb.radius * (1 + Math.sin(this.time * orb.pulseSpeed) * 0.15 + bass * 0.4);
      const c = colors[orb.colorIdx % colors.length];

      const grad = ctx.createRadialGradient(px, py, 0, px, py, pr);
      grad.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${orb.alpha + bass * 0.25})`);
      grad.addColorStop(0.7, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${orb.alpha * 0.3})`);
      grad.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderPulseRings(ctx, w, h, bass, mid, treble, rms) {
    ctx.fillStyle = '#04050a';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.max(w, h) * 0.75;

    // Spawn new shockwave ring on bass hit
    if (bass > 0.45 && (this.rings.length === 0 || this.rings[this.rings.length - 1].r > 40)) {
      this.rings.push({
        r: 10,
        speed: 2 + bass * 8,
        alpha: 0.9,
        colorIdx: Math.floor(Math.random() * 3)
      });
    }

    const ringColors = [
      [249, 115, 22],
      [14, 165, 233],
      [168, 85, 247]
    ];

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.r += ring.speed;
      ring.alpha = Math.max(0, 1 - ring.r / maxR);

      if (ring.r >= maxR || ring.alpha <= 0.01) {
        this.rings.splice(i, 1);
        continue;
      }

      const c = ringColors[ring.colorIdx % ringColors.length];
      ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${ring.alpha})`;
      ctx.lineWidth = 3 + (1 - ring.r / maxR) * 6;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderAurora(ctx, w, h, bass, mid, treble, rms) {
    ctx.fillStyle = '#04060f';
    ctx.fillRect(0, 0, w, h);

    const t = this.time * 0.8;
    const ribbons = 4;

    for (let i = 0; i < ribbons; i++) {
      const yMid = h * (0.35 + i * 0.12);
      const amp = (30 + i * 15) * (1 + bass * 0.8);

      ctx.beginPath();
      ctx.moveTo(0, yMid);
      for (let x = 0; x <= w; x += 12) {
        const y = yMid + Math.sin(x * 0.003 + t + i * 1.2) * amp + Math.cos(x * 0.006 - t * 0.8) * (amp * 0.5);
        ctx.lineTo(x, y);
      }

      ctx.lineWidth = 25 + i * 10 + treble * 20;
      const alpha = 0.15 + (1 - i / ribbons) * 0.25;
      if (i % 2 === 0) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${alpha + mid * 0.3})`; // Emerald Aurora
      } else {
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha + treble * 0.3})`; // Purple Aurora
      }

      ctx.stroke();
    }
  }
}
