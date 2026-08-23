import { Scene, Camera } from 'three';
import TexturePass from './TexturePass';
import { createRenderTarget } from './common';

export default class WebGLBuffer {
  constructor(renderer) {
    this.renderer = renderer;

    this.buffer = createRenderTarget({ multisample: true });

    this.pass = new TexturePass(this.buffer.texture);

    this.scene = new Scene();
    this.camera = new Camera();
  }

  setSize(width, height) {
    this.buffer.setSize(width, height);
  }

  dispose() {
    this.buffer.dispose();
  }

  clear() {
    const { renderer, buffer, scene, camera } = this;

    renderer.setRenderTarget(buffer);
    renderer.clear();

    // HACK: Renderer clear does not work with multi-sample render target
    renderer.render(scene, camera);
  }

  render(scene, camera) {
    const { renderer, buffer } = this;

    renderer.setRenderTarget(buffer);
    renderer.render(scene, camera);
  }
}
