/**
 * FFTVisualizer — high-performance, framework-agnostic WebGL spectrum analyzer.
 * From harmonics-audio/fft-visualizer
 * License: MIT
 */

import { resolveGradientStops, buildGradientLUT, GRADIENT_LUT_SIZE } from './gradients';
import {
  aggregateBins,
  aggregatePeaks,
  peakToUint8,
  applyNoiseFloor,
  applySmoothing,
  updatePeaks
} from './processing';

export const DEFAULTS = {
  mode: 'external',
  showPeaks: true,
  peakDecay: 0.997,
  bands: 80,
  ledBars: false,
  ledShape: 'segment',
  lumiBars: false,
  radial: false,
  radialInnerRadius: 0.35,
  barSpace: 0.25,
  reflexRatio: 0,
  reflexAlpha: 0.25,
  glow: 0,
  rotation: 0,
  gradient: 'classic',
  gradientDirection: 'vertical',
  colorMode: 'gradient',
  noiseFloor: 0,
  smoothing: 0,
  stereo: false,
  background: 'transparent',
  autoReconnect: false,
  debug: false
};

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_dpr; // device pixel ratio, for pixel-exact LED gaps
  uniform vec3 u_bgColor; // background / empty-area color
  uniform float u_bgAlpha; // 1 = opaque background; < 1 enables a transparent canvas
  uniform float u_bins;
  uniform bool u_showPeaks;
  uniform bool u_ledBars;
  uniform bool u_ledMeter;
  uniform bool u_lumiBars;
  uniform bool u_gradientHorizontal;
  uniform bool u_barLevelColor;
  uniform bool u_stereo;
  uniform bool u_radial;
  uniform float u_radialInner;
  uniform float u_barSpace;
  uniform float u_reflexRatio;
  uniform float u_reflexAlpha;
  uniform float u_glow;
  uniform float u_rotation; // clockwise quarter turns (0-3)
  uniform sampler2D u_fftData;
  uniform sampler2D u_peakData;
  uniform sampler2D u_fftDataRight;
  uniform sampler2D u_peakDataRight;
  uniform sampler2D u_gradientTex;

  vec3 getGradientColor(float t) {
    return texture2D(u_gradientTex, vec2(clamp(t, 0.0, 1.0), 0.5)).rgb;
  }

  // Render one channel in "column space": x = band axis (0-1), y = level axis (0-1).
  vec4 renderBars(float x, float y, float levelPx, float barWidthPx, sampler2D fftTex, sampler2D peakTex, float peakHalf) {
    vec4 bgColor = vec4(u_bgColor, u_bgAlpha);

    float barLocalX = fract(x * u_bins);
    if (barLocalX > (1.0 - u_barSpace)) {
      return bgColor;
    }

    float texCoord = (floor(x * u_bins) + 0.5) / u_bins;
    float fftValue = texture2D(fftTex, vec2(texCoord, 0.5)).r;
    float peakValue = texture2D(peakTex, vec2(texCoord, 0.5)).r;

    // LED gaps.
    float ledSpacing = 20.0 * u_dpr;
    float ledGapPx = 2.0 * u_dpr;
    if (u_ledMeter && barWidthPx > 0.0) {
      ledSpacing = barWidthPx * 0.5;
      ledGapPx = u_barSpace * ledSpacing;
    }
    bool inLedGap = u_ledBars && mod(levelPx, ledSpacing) < ledGapPx;

    if (u_lumiBars) {
      if (inLedGap) return bgColor;
      float gradientPos = u_barLevelColor ? fftValue : (u_gradientHorizontal ? x : y);
      vec3 color = getGradientColor(gradientPos);
      if (u_bgAlpha >= 1.0) return vec4(mix(bgColor.rgb, color, fftValue), 1.0);
      return vec4(color, fftValue);
    }

    if (y <= fftValue) {
      if (inLedGap) return bgColor;
      float gradientPos = u_barLevelColor ? fftValue : (u_gradientHorizontal ? x : y);
      return vec4(getGradientColor(gradientPos), 1.0);
    } else if (u_showPeaks && y >= peakValue - peakHalf && y <= peakValue + peakHalf) {
      float peakGradientPos = (u_barLevelColor || !u_gradientHorizontal) ? peakValue : x;
      return vec4(getGradientColor(peakGradientPos), 0.5);
    }

    if (u_glow > 0.0) {
      float g = u_glow * exp((fftValue - y) * 10.0) * smoothstep(0.0, 0.05, fftValue);
      vec3 glowColor = getGradientColor((u_barLevelColor || !u_gradientHorizontal) ? fftValue : x);
      if (u_bgAlpha >= 1.0) return vec4(mix(bgColor.rgb, glowColor, clamp(g, 0.0, 1.0)), 1.0);
      return vec4(glowColor, clamp(g, 0.0, 1.0));
    }
    return bgColor;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec4 bgColor = vec4(u_bgColor, u_bgAlpha);

    if (u_radial) {
      vec2 p = uv - 0.5;
      p.x *= u_resolution.x / u_resolution.y;
      float outerR = 0.5;
      float innerR = u_radialInner * outerR;
      float r = length(p);
      if (r > outerR) {
        gl_FragColor = bgColor;
        return;
      }

      float level;
      float levelPx;
      float radialDim = 1.0;
      if (r >= innerR) {
        level = (r - innerR) / (outerR - innerR);
        levelPx = (r - innerR) * u_resolution.y;
      } else if (u_reflexRatio > 0.0) {
        level = (innerR - r) / (outerR - innerR) / u_reflexRatio;
        levelPx = (innerR - r) * u_resolution.y;
        radialDim = u_reflexAlpha;
      } else {
        gl_FragColor = bgColor;
        return;
      }

      float angle = atan(p.x, p.y);
      angle = mod(angle - u_rotation * 1.5707963 + 3.14159265, 6.28318531) - 3.14159265;
      vec4 c;
      if (u_stereo) {
        float x = abs(angle) / 3.14159265;
        if (angle >= 0.0) {
          c = renderBars(x, level, levelPx, 0.0, u_fftData, u_peakData, 0.006);
        } else {
          c = renderBars(x, level, levelPx, 0.0, u_fftDataRight, u_peakDataRight, 0.006);
        }
      } else {
        float x = angle / 6.28318531 + 0.5;
        c = renderBars(x, level, levelPx, 0.0, u_fftData, u_peakData, 0.006);
      }
      if (u_bgAlpha >= 1.0) {
        gl_FragColor = vec4(mix(bgColor.rgb, c.rgb, radialDim), c.a);
      } else {
        gl_FragColor = vec4(c.rgb, c.a * radialDim);
      }
      return;
    }

    bool axisSwap = false;
    if (u_rotation > 2.5) {
      uv = vec2(uv.y, 1.0 - uv.x);
      axisSwap = true;
    } else if (u_rotation > 1.5) {
      uv = vec2(1.0 - uv.x, 1.0 - uv.y);
    } else if (u_rotation > 0.5) {
      uv = vec2(1.0 - uv.y, uv.x);
      axisSwap = true;
    }
    float levelRes = axisSwap ? u_resolution.x : u_resolution.y;
    float bandRes = axisSwap ? u_resolution.y : u_resolution.x;
    float barWidthPx = bandRes / u_bins;

    if (u_stereo) {
      if (uv.y >= 0.5) {
        gl_FragColor = renderBars(uv.x, (uv.y - 0.5) * 2.0, (uv.y - 0.5) * levelRes, barWidthPx, u_fftData, u_peakData, 0.006);
      } else {
        gl_FragColor = renderBars(uv.x, (0.5 - uv.y) * 2.0, (0.5 - uv.y) * levelRes, barWidthPx, u_fftDataRight, u_peakDataRight, 0.006);
      }
      return;
    }

    float y = uv.y;
    float levelPx = uv.y * levelRes;
    float dim = 1.0;
    if (u_reflexRatio > 0.0) {
      if (uv.y < u_reflexRatio) {
        y = (u_reflexRatio - uv.y) / u_reflexRatio;
        levelPx = (u_reflexRatio - uv.y) * levelRes;
        dim = u_reflexAlpha;
      } else {
        y = (uv.y - u_reflexRatio) / (1.0 - u_reflexRatio);
        levelPx = (uv.y - u_reflexRatio) * levelRes;
      }
    }
    vec4 c = renderBars(uv.x, y, levelPx, barWidthPx, u_fftData, u_peakData, 0.003);
    if (u_bgAlpha >= 1.0) {
      gl_FragColor = vec4(mix(bgColor.rgb, c.rgb, dim), c.a);
    } else {
      gl_FragColor = vec4(c.rgb, c.a * dim);
    }
  }
`;

export class FFTVisualizer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = { ...DEFAULTS, ...options };

    this.bgColorRgb = [0, 0, 0];
    this.bgAlpha = 0; // default transparent for layering

    this._isConnected = true;
    this._fps = 0;
    this.serverBins = 80;

    // Smoothing & peak state
    this.smoothedFftData = new Float32Array(80);
    this.peakData = new Float32Array(80);
    this.smoothedFftDataLeft = new Float32Array(80);
    this.peakDataLeft = new Float32Array(80);
    this.smoothedFftDataRight = new Float32Array(80);
    this.peakDataRight = new Float32Array(80);

    const bands = this.options.bands || 80;
    this.displayFftData = new Uint8Array(bands);
    this.displayPeakData = new Float32Array(bands);
    this.displayFftDataLeft = new Uint8Array(bands);
    this.displayPeakDataLeft = new Float32Array(bands);
    this.displayFftDataRight = new Uint8Array(bands);
    this.displayPeakDataRight = new Float32Array(bands);

    this.transparentMode = true;
    this.applyBackground(this.options.background);
    this.initWebGL();
  }

  get isConnected() {
    return this._isConnected;
  }

  setOptions(patch = {}) {
    const prev = this.options;
    this.options = { ...prev, ...patch };

    if (patch.background !== undefined && patch.background !== prev.background) {
      this.applyBackground(this.options.background);
    }
    if (patch.gradient !== undefined && patch.gradient !== prev.gradient) {
      this.uploadGradientTexture();
    }
    if (patch.bands !== undefined && patch.bands !== prev.bands) {
      this.reallocDisplay(patch.bands);
    }
  }

  feedData(data, left, right) {
    if (left && right) {
      if (left.length !== this.serverBins) this.initBuffers(left.length);
      this.processLeftData(new Uint8Array(left));
      this.processRightData(new Uint8Array(right));
    } else if (data) {
      if (data.length !== this.serverBins) this.initBuffers(data.length);
      this.processMonoData(new Uint8Array(data));
    }
  }

  destroy() {
    const gl = this.gl;
    if (gl) {
      if (this.fftTexture) gl.deleteTexture(this.fftTexture);
      if (this.peakTexture) gl.deleteTexture(this.peakTexture);
      if (this.fftTextureRight) gl.deleteTexture(this.fftTextureRight);
      if (this.peakTextureRight) gl.deleteTexture(this.peakTextureRight);
      if (this.gradientTexture) gl.deleteTexture(this.gradientTexture);
      if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
      if (this.program) gl.deleteProgram(this.program);
    }
  }

  applyBackground(color) {
    if (!color || color === 'transparent') {
      this.bgColorRgb = [0, 0, 0];
      this.bgAlpha = 0;
    } else {
      const [r, g, b, a] = parseCssColor(color);
      this.bgColorRgb = [r, g, b];
      this.bgAlpha = a;
    }
  }

  reallocDisplay(bands) {
    this.displayFftData = new Uint8Array(bands);
    this.displayPeakData = new Float32Array(bands);
    this.displayFftDataLeft = new Uint8Array(bands);
    this.displayPeakDataLeft = new Float32Array(bands);
    this.displayFftDataRight = new Uint8Array(bands);
    this.displayPeakDataRight = new Float32Array(bands);
  }

  createShader(glCtx, type, source) {
    const shader = glCtx.createShader(type);
    if (!shader) return null;
    glCtx.shaderSource(shader, source);
    glCtx.compileShader(shader);
    if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
      console.error('Harmonics Shader compile error:', glCtx.getShaderInfoLog(shader));
      glCtx.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createTexture(glCtx, nearest = false) {
    const texture = glCtx.createTexture();
    if (!texture) return null;
    const filter = nearest ? glCtx.NEAREST : glCtx.LINEAR;
    glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, filter);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, filter);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
    glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);
    return texture;
  }

  initWebGL() {
    const canvas = this.canvas;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true
    });

    if (!gl) {
      console.error('WebGL not supported for Harmonics Visualizer');
      return false;
    }
    this.gl = gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return false;

    const program = gl.createProgram();
    if (!program) return false;
    this.program = program;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return false;
    }

    gl.useProgram(program);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    this.uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    this.uDprLoc = gl.getUniformLocation(program, 'u_dpr');
    this.uBgColorLoc = gl.getUniformLocation(program, 'u_bgColor');
    this.uBgAlphaLoc = gl.getUniformLocation(program, 'u_bgAlpha');
    this.uBinsLoc = gl.getUniformLocation(program, 'u_bins');
    this.uShowPeaksLoc = gl.getUniformLocation(program, 'u_showPeaks');
    this.uLedBarsLoc = gl.getUniformLocation(program, 'u_ledBars');
    this.uLedMeterLoc = gl.getUniformLocation(program, 'u_ledMeter');
    this.uLumiBarsLoc = gl.getUniformLocation(program, 'u_lumiBars');
    this.uRadialLoc = gl.getUniformLocation(program, 'u_radial');
    this.uRadialInnerLoc = gl.getUniformLocation(program, 'u_radialInner');
    this.uBarSpaceLoc = gl.getUniformLocation(program, 'u_barSpace');
    this.uReflexRatioLoc = gl.getUniformLocation(program, 'u_reflexRatio');
    this.uReflexAlphaLoc = gl.getUniformLocation(program, 'u_reflexAlpha');
    this.uGlowLoc = gl.getUniformLocation(program, 'u_glow');
    this.uRotationLoc = gl.getUniformLocation(program, 'u_rotation');
    this.uGradientTexLoc = gl.getUniformLocation(program, 'u_gradientTex');
    this.uGradientHorizontalLoc = gl.getUniformLocation(program, 'u_gradientHorizontal');
    this.uBarLevelColorLoc = gl.getUniformLocation(program, 'u_barLevelColor');
    this.uStereoLoc = gl.getUniformLocation(program, 'u_stereo');
    this.uFftDataLoc = gl.getUniformLocation(program, 'u_fftData');
    this.uPeakDataLoc = gl.getUniformLocation(program, 'u_peakData');
    this.uFftDataRightLoc = gl.getUniformLocation(program, 'u_fftDataRight');
    this.uPeakDataRightLoc = gl.getUniformLocation(program, 'u_peakDataRight');

    gl.activeTexture(gl.TEXTURE0);
    this.fftTexture = this.createTexture(gl);
    gl.activeTexture(gl.TEXTURE1);
    this.peakTexture = this.createTexture(gl, true);
    gl.activeTexture(gl.TEXTURE2);
    this.fftTextureRight = this.createTexture(gl);
    gl.activeTexture(gl.TEXTURE3);
    this.peakTextureRight = this.createTexture(gl, true);
    gl.activeTexture(gl.TEXTURE4);
    this.gradientTexture = this.createTexture(gl);

    gl.uniform1i(this.uFftDataLoc, 0);
    gl.uniform1i(this.uPeakDataLoc, 1);
    gl.uniform1i(this.uFftDataRightLoc, 2);
    gl.uniform1i(this.uPeakDataRightLoc, 3);
    gl.uniform1i(this.uGradientTexLoc, 4);

    this.uploadGradientTexture();
    return true;
  }

  uploadGradientTexture() {
    const gl = this.gl;
    if (!gl || !this.gradientTexture) return;
    const lut = buildGradientLUT(resolveGradientStops(this.options.gradient));
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      GRADIENT_LUT_SIZE, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      lut
    );
  }

  processFFTData(newData, smoothed, peak, setDisplayFft, setDisplayPeak) {
    applyNoiseFloor(newData, this.options.noiseFloor);
    applySmoothing(newData, smoothed, this.options.smoothing);
    updatePeaks(peak, newData, this.options.peakDecay);

    setDisplayFft(aggregateBins(newData, this.options.bands));
    setDisplayPeak(aggregatePeaks(peak, this.options.bands));
  }

  processMonoData(newData) {
    this.processFFTData(
      newData, this.smoothedFftData, this.peakData,
      v => { this.displayFftData = v; },
      v => { this.displayPeakData = v; }
    );
    if (this.options.stereo) {
      this.displayFftDataLeft = this.displayFftData;
      this.displayPeakDataLeft = this.displayPeakData;
      this.displayFftDataRight = this.displayFftData;
      this.displayPeakDataRight = this.displayPeakData;
    }
  }

  processLeftData(newData) {
    this.processFFTData(
      newData, this.smoothedFftDataLeft, this.peakDataLeft,
      v => { this.displayFftDataLeft = v; },
      v => { this.displayPeakDataLeft = v; }
    );
  }

  processRightData(newData) {
    this.processFFTData(
      newData, this.smoothedFftDataRight, this.peakDataRight,
      v => { this.displayFftDataRight = v; },
      v => { this.displayPeakDataRight = v; }
    );
  }

  initBuffers(size) {
    this.serverBins = size;
    this.smoothedFftData = new Float32Array(size);
    this.peakData = new Float32Array(size);
    this.smoothedFftDataLeft = new Float32Array(size);
    this.peakDataLeft = new Float32Array(size);
    this.smoothedFftDataRight = new Float32Array(size);
    this.peakDataRight = new Float32Array(size);
    const bands = this.options.bands;
    this.displayFftData = new Uint8Array(bands);
    this.displayPeakData = new Float32Array(bands);
    this.displayFftDataLeft = new Uint8Array(bands);
    this.displayPeakDataLeft = new Float32Array(bands);
    this.displayFftDataRight = new Uint8Array(bands);
    this.displayPeakDataRight = new Float32Array(bands);
  }

  uploadTexture(unit, texture, data, numBins) {
    const gl = this.gl;
    if (!gl) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE,
      numBins, 1, 0,
      gl.LUMINANCE, gl.UNSIGNED_BYTE,
      data
    );
  }

  drawSpectrum() {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const canvas = this.canvas;
    const numBins = this.options.bands || 80;
    const isStereo = this.options.stereo;

    if (isStereo) {
      this.uploadTexture(0, this.fftTexture, this.displayFftDataLeft, numBins);
      this.uploadTexture(1, this.peakTexture, peakToUint8(this.displayPeakDataLeft, numBins), numBins);
      this.uploadTexture(2, this.fftTextureRight, this.displayFftDataRight, numBins);
      this.uploadTexture(3, this.peakTextureRight, peakToUint8(this.displayPeakDataRight, numBins), numBins);
    } else {
      this.uploadTexture(0, this.fftTexture, this.displayFftData, numBins);
      this.uploadTexture(1, this.peakTexture, peakToUint8(this.displayPeakData, numBins), numBins);
    }

    const o = this.options;
    gl.useProgram(this.program);

    gl.uniform2f(this.uResolutionLoc, canvas.width, canvas.height);
    gl.uniform1f(this.uDprLoc, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    gl.uniform3f(this.uBgColorLoc, this.bgColorRgb[0], this.bgColorRgb[1], this.bgColorRgb[2]);
    gl.uniform1f(this.uBgAlphaLoc, this.bgAlpha);
    gl.uniform1f(this.uBinsLoc, numBins);
    gl.uniform1i(this.uShowPeaksLoc, o.showPeaks ? 1 : 0);
    gl.uniform1i(this.uLedBarsLoc, o.ledBars ? 1 : 0);
    gl.uniform1i(this.uLedMeterLoc, o.ledShape === 'meter' ? 1 : 0);
    gl.uniform1i(this.uLumiBarsLoc, o.lumiBars ? 1 : 0);
    gl.uniform1i(this.uRadialLoc, o.radial ? 1 : 0);
    gl.uniform1f(this.uRadialInnerLoc, Math.min(0.9, Math.max(0, o.radialInnerRadius)));
    gl.uniform1f(this.uBarSpaceLoc, Math.min(0.9, Math.max(0, o.barSpace)));
    gl.uniform1f(this.uReflexRatioLoc, Math.min(0.7, Math.max(0, o.reflexRatio)));
    gl.uniform1f(this.uReflexAlphaLoc, Math.min(1, Math.max(0, o.reflexAlpha)));
    gl.uniform1f(this.uGlowLoc, Math.min(1, Math.max(0, o.glow)));
    gl.uniform1f(this.uRotationLoc, (Math.round((o.rotation || 0) / 90) % 4 + 4) % 4);
    gl.uniform1i(this.uGradientHorizontalLoc, o.gradientDirection === 'horizontal' ? 1 : 0);
    gl.uniform1i(this.uBarLevelColorLoc, o.colorMode === 'bar-level' ? 1 : 0);
    gl.uniform1i(this.uStereoLoc, isStereo ? 1 : 0);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

export function parseCssColor(color) {
  if (typeof document === 'undefined') return [0, 0, 0, 0];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [0, 0, 0, 0];
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255, a / 255];
}
