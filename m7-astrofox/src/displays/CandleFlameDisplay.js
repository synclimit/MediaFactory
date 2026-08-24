/**
 * CandleFlameDisplay.js
 * Mode 7 (Astrofox) Animated Overlay Display Adapter — Prototype 01: Candle Flame
 * 
 * Adapted from SmokeGL (Luca Angioloni) under the MIT License:
 * https://github.com/LucaAngioloni/SmokeGL
 * 
 * Copyright (c) Luca Angioloni (Original Particle Physics & Shader Concept)
 * Copyright (c) MediaFactory (M7 Astrofox Integration & Deterministic Timeline Adapter)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
  Points,
  Color,
  Vector3,
  AdditiveBlending,
  NormalBlending,
  CustomBlending,
  AddEquation,
  SrcAlphaFactor,
  OneFactor,
} from 'three';
import WebGLDisplay from 'core/WebGLDisplay';

// --- GLSL Shaders adapted from SmokeGL ---

const vertexShader = `
  uniform float t;
  uniform float timeLife;
  uniform float speed;
  uniform float flameHeight;
  uniform float flameWidth;
  uniform float customOpacity;
  uniform vec3 flameColor;
  uniform vec3 coreColor;

  attribute float customSize;
  attribute float customAngle;
  attribute float timeOffset;
  attribute float isCore;

  varying vec4 vColor;

  highp float rand(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt = dot(co.xy, vec2(a, b));
    highp float sn = mod(dt, 3.14159265);
    return fract(sin(sn) * c);
  }

  void main() {
    vec3 p = position;
    float age = mod(t - timeOffset, timeLife);
    float progress = age / timeLife;

    float heightCorrection = (timeLife * speed * flameHeight) / 7.5;
    float widthCorrection = (timeLife * speed * flameWidth) / 25.0;

    // Upward convection calculation with Gaussian flame shape profile
    float upwardPos = age * speed * (flameHeight * 0.5);
    p.y += upwardPos;

    float normY = ((upwardPos / heightCorrection) - 2.890766);
    float r = 3.121378 * exp(-pow(normY, 2.0) / (2.0 * pow(1.363839, 2.0))) * widthCorrection;

    // Controlled micro-flicker noise
    r -= rand(vec2(t * 0.5, customAngle)) * 0.25 * r;

    p.x += cos(customAngle) * r;
    p.z += sin(customAngle) * r * 0.4; // 2.5D flat depth for video overlays

    // Color gradient across height: Blue root -> Amber core -> Golden tip
    vec3 col = mix(flameColor, coreColor, isCore * (1.0 - progress * 0.7));
    if (progress < 0.15) {
      // Blue base characteristic of natural candle combustion
      col = mix(vec3(0.12, 0.35, 0.95), col, progress / 0.15);
    }

    // Alpha decay as particle rises to flame tip
    float alpha = customOpacity * (1.0 - smoothstep(0.65, 1.0, progress));
    vColor = vec4(col, alpha);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = customSize * (1.0 - progress * 0.45) * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec4 vColor;

  void main() {
    // Soft radial particle circle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }

    // Soft Gaussian falloff from center of each flame particle
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 1.6);

    gl_FragColor = vec4(vColor.rgb * (1.0 + glow * 0.5), vColor.a * glow);
  }
`;

export default class CandleFlameDisplay extends WebGLDisplay {
  static config = {
    name: 'CandleFlameDisplay',
    description: 'Animated procedural candle flame overlay with physics turbulence and seamless looping (adapted from SmokeGL).',
    type: 'display',
    label: 'Candle Flame',
    defaultProperties: {
      x: 0,
      y: 0,
      scale: 100,
      rotation: 0,
      opacity: 100,
      speed: 1.0,
      flameHeight: 1.0,
      flameWidth: 1.0,
      blendMode: 'Additive',
      particleCount: 160,
      colorOuter: '#f59e0b',
      colorCore: '#fef08a',
      enabled: true,
    },
  };

  constructor(properties = {}) {
    super(CandleFlameDisplay, properties);

    this.time = 0;
    this.particleCount = Math.max(40, Math.min(400, properties.particleCount || 160));
    this.timeLife = 1.8;

    this.initFlameMesh();
  }

  initFlameMesh() {
    const count = this.particleCount;
    const geometry = new BufferGeometry();

    const positions = new Float32Array(count * 3);
    const customSizes = new Float32Array(count);
    const customAngles = new Float32Array(count);
    const timeOffsets = new Float32Array(count);
    const isCores = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Base origin around center with slight spread
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() * 4.0);

      positions[i * 3 + 0] = Math.cos(angle) * spread;
      positions[i * 3 + 1] = (Math.random() * 2.0) - 1.0;
      positions[i * 3 + 2] = Math.sin(angle) * spread * 0.3;

      customSizes[i] = 18.0 + Math.random() * 16.0;
      customAngles[i] = angle;
      // Staggered time offsets across loop duration
      timeOffsets[i] = (i / count) * this.timeLife + (Math.random() * 0.1);
      isCores[i] = i < (count * 0.45) ? 1.0 : 0.0;
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('customSize', new Float32BufferAttribute(customSizes, 1));
    geometry.setAttribute('customAngle', new Float32BufferAttribute(customAngles, 1));
    geometry.setAttribute('timeOffset', new Float32BufferAttribute(timeOffsets, 1));
    geometry.setAttribute('isCore', new Float32BufferAttribute(isCores, 1));

    this.uniforms = {
      t: { value: 0.0 },
      timeLife: { value: this.timeLife },
      speed: { value: 1.0 },
      flameHeight: { value: 1.0 },
      flameWidth: { value: 1.0 },
      customOpacity: { value: 1.0 },
      flameColor: { value: new Color(this.properties.colorOuter || '#f59e0b') },
      coreColor: { value: new Color(this.properties.colorCore || '#fef08a') },
    };

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: this.properties.blendMode === 'Normal' ? NormalBlending : AdditiveBlending,
    });

    this.mesh = new Points(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 20; // Layer 2 pass

    this.group = this.mesh;
  }

  update(properties = {}) {
    super.update(properties);

    if (this.uniforms) {
      if (properties.speed !== undefined) {
        this.uniforms.speed.value = Math.max(0.1, Number(properties.speed));
      }
      if (properties.flameHeight !== undefined) {
        this.uniforms.flameHeight.value = Math.max(0.1, Number(properties.flameHeight));
      }
      if (properties.flameWidth !== undefined) {
        this.uniforms.flameWidth.value = Math.max(0.1, Number(properties.flameWidth));
      }
      if (properties.opacity !== undefined) {
        const op = Math.max(0, Math.min(100, Number(properties.opacity)));
        this.uniforms.customOpacity.value = op / 100.0;
      }
      if (properties.colorOuter) {
        this.uniforms.flameColor.value.set(properties.colorOuter);
      }
      if (properties.colorCore) {
        this.uniforms.coreColor.value.set(properties.colorCore);
      }
      if (properties.blendMode) {
        this.material.blending = properties.blendMode === 'Normal' ? NormalBlending : AdditiveBlending;
        this.material.needsUpdate = true;
      }
    }

    if (this.mesh) {
      // Transform positioning: map screen coordinates (-960..960, -540..540) to 3D space
      const posX = properties.x !== undefined ? Number(properties.x) : (this.properties.x || 0);
      const posY = properties.y !== undefined ? Number(properties.y) : (this.properties.y || 0);
      const scalePct = properties.scale !== undefined ? Number(properties.scale) : (this.properties.scale || 100);
      const rotDeg = properties.rotation !== undefined ? Number(properties.rotation) : (this.properties.rotation || 0);

      // Astrofox standard WebGL camera coordinate scaling (1920x1080 stage mapping)
      this.mesh.position.set(posX * 0.55, -posY * 0.55, 0);
      const s = (scalePct / 100.0) * 1.5;
      this.mesh.scale.set(s, s, s);
      this.mesh.rotation.z = -(rotDeg * Math.PI) / 180.0;

      if (properties.enabled !== undefined) {
        this.mesh.visible = !!properties.enabled;
      }
    }
  }

  /**
   * Deterministic render frame callback.
   * Uses frameData.delta for exact time tracking across preview & offline render.
   */
  render(renderer) {
    if (!this.mesh || !this.mesh.visible || !this.properties.enabled) {
      return;
    }

    const frameData = renderer && renderer.frameData;
    const deltaMs = (frameData && frameData.delta > 0) ? frameData.delta : 16.666;
    const speed = this.properties.speed !== undefined ? Number(this.properties.speed) : 1.0;

    // Deterministic timeline accumulation
    this.time += (deltaMs / 1000.0) * speed;

    if (this.uniforms) {
      this.uniforms.t.value = this.time;
    }
  }

  dispose() {
    if (this.mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.material) this.material.dispose();
    }
  }
}
