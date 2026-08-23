import { Texture, LinearFilter } from 'three';
import Display from 'core/Display';
import ImagePass from 'graphics/ImagePass';
import { SHADER_PRESETS } from 'visualizer/pulseforge/shaders';

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export default class ShaderBackgroundDisplay extends Display {
  static config = {
    name: 'ShaderBackgroundDisplay',
    description: 'Displays an audio-reactive PulseForge GLSL shader background.',
    type: 'display',
    label: 'Dynamic Shader Background',
    defaultProperties: {
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      preset: 'retroGrid',
      speed: 1.0,
      scale: 1.0,
      audioReactivity: 1.0,
      color1: [0.98, 0.25, 0.55],
      color2: [0.0, 0.9, 1.0],
      rotation: 0,
      opacity: 1.0,
    },
  };

  constructor(properties = {}) {
    super(ShaderBackgroundDisplay, properties);

    const { width = 1920, height = 1080 } = this.properties;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    this.gl = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true
    });

    this.currentPreset = null;
    this.program = null;
    this.uniforms = {};
    this.startTime = Date.now();

    this.initGL();

    // Three.js Texture and ImagePass for Layer 1 Composer integration
    this.texture = new Texture(this.canvas);
    this.texture.minFilter = LinearFilter;
    this.texture.magFilter = LinearFilter;
    this.pass = new ImagePass(this.texture, { width, height });
  }

  initGL() {
    const gl = this.gl;
    if (!gl) return;

    // Full screen quad buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    this.positionBuffer = buffer;
    this.applyPreset(this.properties.preset || 'retroGrid');
  }

  applyPreset(presetKey) {
    const gl = this.gl;
    if (!gl) return;

    const preset = SHADER_PRESETS[presetKey] || SHADER_PRESETS.retroGrid;
    this.currentPreset = presetKey;
    this.properties.preset = presetKey;

    if (preset.color1 && (!this.properties.color1 || this.properties.color1 === ShaderBackgroundDisplay.config.defaultProperties.color1)) {
      this.properties.color1 = preset.color1;
    }
    if (preset.color2 && (!this.properties.color2 || this.properties.color2 === ShaderBackgroundDisplay.config.defaultProperties.color2)) {
      this.properties.color2 = preset.color2;
    }

    // Compile vertex shader
    const vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert, VERTEX_SHADER);
    gl.compileShader(vert);

    // Compile fragment shader
    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag, preset.frag);
    gl.compileShader(frag);

    if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
      console.error('[ShaderBackgroundDisplay] Fragment shader error:', gl.getShaderInfoLog(frag));
      return;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);

    this.program = prog;
    gl.useProgram(prog);

    // Uniform locations cache
    this.uniforms = {
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uResolution: gl.getUniformLocation(prog, 'uResolution'),
      uAudioReactivity: gl.getUniformLocation(prog, 'uAudioReactivity'),
      uBass: gl.getUniformLocation(prog, 'uBass'),
      uMid: gl.getUniformLocation(prog, 'uMid'),
      uTreble: gl.getUniformLocation(prog, 'uTreble'),
      uRms: gl.getUniformLocation(prog, 'uRms'),
      uColor1: gl.getUniformLocation(prog, 'uColor1'),
      uColor2: gl.getUniformLocation(prog, 'uColor2'),
      uSpeed: gl.getUniformLocation(prog, 'uSpeed'),
      uScale: gl.getUniformLocation(prog, 'uScale'),
      aPosition: gl.getAttribLocation(prog, 'aPosition'),
    };
  }

  addToScene({ getSize }) {
    const size = getSize ? getSize() : { width: 1920, height: 1080 };
    const width = size.width || 1920;
    const height = size.height || 1080;
    this.setSize(width, height);
  }

  setSize(width, height) {
    if (this.canvas && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.gl) this.gl.viewport(0, 0, width, height);
    }
    if (this.pass) {
      this.pass.camera.aspect = width / height;
      this.pass.camera.updateProjectionMatrix();
    }
  }

  update(properties = {}) {
    const changed = super.update(properties);
    if (properties.preset && properties.preset !== this.currentPreset) {
      this.applyPreset(properties.preset);
    }
    if (this.pass && properties.opacity !== undefined) {
      this.pass.material.opacity = properties.opacity;
    }
    if (this.pass && properties.zoom !== undefined) {
      this.pass.camera.zoom = properties.zoom;
      this.pass.camera.updateProjectionMatrix();
    }
    return changed;
  }

  render(scene, frameData = {}) {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const { width = 1920, height = 1080 } = this.properties;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    gl.useProgram(this.program);

    // Compute band energies from FFT
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let rms = 0;

    const fft = frameData.fft;
    if (fft && fft.length > 0) {
      const len = fft.length;
      const bEnd = Math.floor(len * 0.1);
      const mEnd = Math.floor(len * 0.45);

      let bSum = 0;
      for (let i = 0; i < bEnd; i++) bSum += fft[i];
      bass = bSum / (bEnd || 1) / 255;

      let mSum = 0;
      for (let i = bEnd; i < mEnd; i++) mSum += fft[i];
      mid = mSum / ((mEnd - bEnd) || 1) / 255;

      let tSum = 0;
      for (let i = mEnd; i < len; i++) tSum += fft[i];
      treble = tSum / ((len - mEnd) || 1) / 255;

      rms = (bass * 0.5 + mid * 0.35 + treble * 0.15);
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    const speed = parseFloat(this.properties.speed || 1.0);
    const scale = parseFloat(this.properties.scale || 1.0);
    const reactivity = parseFloat(this.properties.audioReactivity || 1.0);
    const c1 = this.properties.color1 || [0.98, 0.25, 0.55];
    const c2 = this.properties.color2 || [0.0, 0.9, 1.0];

    // Pass uniforms
    if (this.uniforms.uTime) gl.uniform1f(this.uniforms.uTime, elapsed);
    if (this.uniforms.uResolution) gl.uniform2f(this.uniforms.uResolution, width, height);
    if (this.uniforms.uAudioReactivity) gl.uniform1f(this.uniforms.uAudioReactivity, reactivity);
    if (this.uniforms.uBass) gl.uniform1f(this.uniforms.uBass, bass);
    if (this.uniforms.uMid) gl.uniform1f(this.uniforms.uMid, mid);
    if (this.uniforms.uTreble) gl.uniform1f(this.uniforms.uTreble, treble);
    if (this.uniforms.uRms) gl.uniform1f(this.uniforms.uRms, rms);
    if (this.uniforms.uColor1) gl.uniform3f(this.uniforms.uColor1, c1[0], c1[1], c1[2]);
    if (this.uniforms.uColor2) gl.uniform3f(this.uniforms.uColor2, c2[0], c2[1], c2[2]);
    if (this.uniforms.uSpeed) gl.uniform1f(this.uniforms.uSpeed, speed);
    if (this.uniforms.uScale) gl.uniform1f(this.uniforms.uScale, scale);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.uniforms.aPosition);
    gl.vertexAttribPointer(this.uniforms.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Flag Three.js texture for Layer 1 composer update
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }
}
