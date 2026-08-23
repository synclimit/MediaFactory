/**
 * PulseForge Audio-Reactive GLSL Shaders
 * Ported from TheAwaken1/PulseForge (MIT License)
 * Adapted for WebGL rendering in MediaFactory M7
 */

export const SHADER_PRESETS = {
  retroGrid: {
    name: 'Retro Grid (80s Synthwave)',
    color1: [0.98, 0.25, 0.55], // Magenta
    color2: [0.0, 0.9, 1.0],     // Cyan
    speed: 1.0,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform float uRms;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        vec2 p = uv;
        p.x = (p.x - 0.5) * aspect;
        
        float t = uTime * uSpeed;
        float ar = uAudioReactivity;
        vec3 color = vec3(0.02, 0.02, 0.05);

        // Perspective Horizon Grid (bottom half)
        float horizon = 0.5;
        if (uv.y < horizon) {
          float perspective = (horizon - uv.y) / horizon;
          float depth = 1.0 / (perspective + 0.02);

          float gridX = p.x * depth * uScale * 3.5;
          float gridZ = depth * uScale * 2.0 + t * 4.0;

          float lineX = smoothstep(0.08, 0.0, abs(fract(gridX) - 0.5));
          float lineZ = smoothstep(0.08, 0.0, abs(fract(gridZ) - 0.5));
          float grid = max(lineX, lineZ) * smoothstep(0.0, 0.25, perspective);

          vec3 gridColor = mix(uColor1, uColor2, perspective);
          gridColor *= 1.0 + uBass * ar * 3.5;
          color += gridColor * grid * 1.2;
          color += uColor1 * 0.15 * perspective * (1.0 + uBass * ar);
        } else {
          // Top half: Retro Glowing Sun & Starry sky
          vec2 sunP = vec2(p.x, (uv.y - horizon) * 2.0);
          float sunDist = length(sunP - vec2(0.0, 0.35));
          float sun = smoothstep(0.28, 0.26, sunDist);
          
          // Sun scanline cuts
          if (sun > 0.0) {
            float cut = fract((uv.y - horizon) * 25.0);
            if (cut > 0.65 && uv.y < 0.8) {
              sun = 0.0;
            }
          }
          vec3 sunColor = mix(vec3(1.0, 0.9, 0.1), uColor1, (uv.y - horizon) * 2.0);
          sunColor *= 1.0 + uMid * ar * 1.5;
          color += sunColor * sun;

          // Glowing aura around horizon
          float aura = exp(-abs(uv.y - horizon) * 8.0);
          color += uColor1 * aura * 0.4 * (1.0 + uBass * ar * 2.0);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `
  },

  tunnel: {
    name: 'Warp Speed Tunnel',
    color1: [0.0, 0.85, 1.0],
    color2: [0.65, 0.1, 1.0],
    speed: 1.2,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0);
        uv.x *= uResolution.x / uResolution.y;

        float t = uTime * uSpeed;
        float ar = uAudioReactivity;
        float bassB = uBass * ar * 2.0;

        float dist = length(uv);
        float angle = atan(uv.y, uv.x);

        float z = 1.0 / (dist + 0.08);
        float forward = z * uScale * 2.0 - t * 4.0;
        float spin = angle / 3.14159265 * 4.0 + t * 0.3;

        // Tunnel wall pattern
        float pattern = sin(forward * 3.0) * cos(spin * 3.14159);
        pattern = smoothstep(0.1, 0.7, abs(pattern));

        // Color based on depth and rotation
        vec3 col = mix(uColor1, uColor2, sin(forward * 0.5 + t) * 0.5 + 0.5);
        col *= pattern * (1.0 + bassB);

        // Core light beam
        float core = 0.03 / (dist + 0.01) * (1.0 + uTreble * ar * 3.0);
        col += mix(uColor1, vec3(1.0), 0.7) * core;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  },

  aurora: {
    name: 'Aurora Borealis',
    color1: [0.0, 1.0, 0.65],
    color2: [0.6, 0.2, 1.0],
    speed: 0.8,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = vUv;
        float t = uTime * uSpeed;
        float ar = uAudioReactivity;

        vec3 col = vec3(0.01, 0.02, 0.06);

        for (float i = 1.0; i <= 3.0; i++) {
          float wave = sin(uv.x * (3.0 * i * uScale) + t * (0.8 * i) + i * 1.5) * 0.15;
          wave += cos(uv.x * (5.0 * i * uScale) - t * 0.5) * 0.08;
          
          float targetY = 0.45 + wave + (i * 0.1) * sin(t * 0.3);
          float intensity = exp(-abs(uv.y - targetY) * (12.0 / i));
          
          vec3 layerCol = mix(uColor1, uColor2, sin(uv.x * 2.0 + i + t) * 0.5 + 0.5);
          layerCol *= 1.0 + (i == 1.0 ? uBass : (i == 2.0 ? uMid : uTreble)) * ar * 2.5;

          col += layerCol * intensity * (0.6 / i);
        }

        // Top atmospheric gradient
        col += uColor2 * 0.15 * uv.y * (1.0 + uMid * ar);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  },

  nebula: {
    name: 'Cosmic Fluid Nebula',
    color1: [0.85, 0.15, 0.75],
    color2: [0.1, 0.5, 1.0],
    speed: 0.9,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0);
        uv.x *= uResolution.x / uResolution.y;

        float t = uTime * uSpeed * 0.4;
        float ar = uAudioReactivity;

        vec2 p = uv * uScale;
        float f = 0.0;
        p += vec2(sin(t + p.y * 1.5), cos(t + p.x * 1.5)) * 0.4;
        f += sin(p.x * 3.0 + t) * sin(p.y * 3.0 - t);
        f += sin(p.x * 6.0 - t * 2.0) * sin(p.y * 6.0 + t * 2.0) * 0.5;

        vec3 col = mix(uColor1, uColor2, f * 0.5 + 0.5);
        col *= (1.0 + uBass * ar * 2.0);

        // Core deep space glow
        float d = length(uv);
        col += vec3(0.1, 0.05, 0.2) * (1.0 - d * 0.5);
        col += uColor1 * 0.3 * (1.0 + uTreble * ar * 2.5) * exp(-d * 3.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  },

  plasma: {
    name: 'Electric Plasma Fluid',
    color1: [1.0, 0.3, 0.0],
    color2: [0.0, 0.8, 1.0],
    speed: 1.1,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = vUv * 4.0 * uScale;
        float t = uTime * uSpeed;
        float ar = uAudioReactivity;

        float v1 = sin(uv.x + t);
        float v2 = sin(uv.y + t);
        float v3 = sin(uv.x + uv.y + t);
        float v4 = sin(length(uv - vec2(2.0)) + t * 1.5);
        float v = (v1 + v2 + v3 + v4) * 0.25;

        vec3 col = mix(uColor1, uColor2, sin(v * 3.14159) * 0.5 + 0.5);
        col *= 1.0 + (uBass + uMid) * ar * 1.5;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  },

  starfield: {
    name: 'Hyperspace Starfield',
    color1: [0.4, 0.8, 1.0],
    color2: [1.0, 0.9, 0.7],
    speed: 1.5,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uTreble;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0);
        uv.x *= uResolution.x / uResolution.y;

        float t = uTime * (uSpeed + uBass * uAudioReactivity * 3.0);
        vec3 col = vec3(0.01, 0.01, 0.03);

        for (float i = 1.0; i <= 3.0; i++) {
          vec2 p = uv * (i * 2.5);
          float angle = atan(p.y, p.x);
          float r = length(p);

          float z = fract(0.1 * t + i * 0.33);
          float size = smoothstep(0.0, 0.8, z) * (1.0 - z);

          vec2 grid = fract(vec2(angle * 4.0, 1.0 / (r * z + 0.01) + t * 0.5)) - 0.5;
          float star = smoothstep(0.08 * size, 0.0, length(grid));

          vec3 starCol = mix(uColor1, uColor2, fract(i * 0.4));
          col += starCol * star * (1.0 + uTreble * uAudioReactivity * 2.0);
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `
  },

  pulseRings: {
    name: 'Concentric Pulse Shockwaves',
    color1: [1.0, 0.2, 0.4],
    color2: [0.2, 0.6, 1.0],
    speed: 1.0,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0);
        uv.x *= uResolution.x / uResolution.y;

        float dist = length(uv) * uScale;
        float t = uTime * uSpeed;
        float ar = uAudioReactivity;

        float rings = sin(dist * 18.0 - t * 6.0 - uBass * ar * 4.0);
        rings = smoothstep(0.6, 0.95, rings) * exp(-dist * 1.8);

        vec3 col = mix(uColor1, uColor2, dist);
        col *= rings * (1.5 + uBass * ar * 3.0);
        col += uColor1 * 0.2 * exp(-dist * 4.0) * (1.0 + uBass * ar * 2.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  },

  vortex: {
    name: 'Psychedelic Neon Vortex',
    color1: [0.95, 0.1, 0.5],
    color2: [0.1, 0.95, 0.7],
    speed: 1.0,
    scale: 1.0,
    frag: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uAudioReactivity;
      uniform float uBass;
      uniform float uMid;
      uniform float uTreble;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uSpeed;
      uniform float uScale;

      void main() {
        vec2 uv = (vUv * 2.0 - 1.0);
        uv.x *= uResolution.x / uResolution.y;

        float dist = length(uv) * uScale;
        float angle = atan(uv.y, uv.x);
        float t = uTime * uSpeed;
        float ar = uAudioReactivity;

        float spiral = sin(angle * 6.0 + dist * 10.0 - t * 3.0 - uBass * ar * 3.0);
        spiral = smoothstep(0.2, 0.8, spiral);

        vec3 col = mix(uColor1, uColor2, sin(dist * 4.0 - t) * 0.5 + 0.5);
        col *= spiral * (1.0 + uMid * ar * 2.0);
        col += uColor2 * 0.15 / (dist + 0.05) * (1.0 + uTreble * ar);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  }
};
