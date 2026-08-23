import {
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneBufferGeometry,
} from 'three';
import Pass from './Pass';

export default class ImagePass extends Pass {
  constructor(texture, resolution = { width: 1920, height: 1080 }) {
    super();

    const width = resolution.width || 1920;
    const height = resolution.height || 1080;
    const img = texture ? texture.image : null;
    const naturalWidth = img ? (img.naturalWidth || img.videoWidth || img.width || width) : width;
    const naturalHeight = img ? (img.naturalHeight || img.videoHeight || img.height || height) : height;

    this.texture = texture;

    const material = new MeshBasicMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    const camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0, 1);
    const geometry = new PlaneBufferGeometry(naturalWidth, naturalHeight);

    this.setFullscreen(material, geometry, camera);
  }

  render(renderer, inputBuffer) {
    if (this.texture && (this.texture.image instanceof HTMLVideoElement || this.texture.image instanceof HTMLCanvasElement)) {
      this.texture.needsUpdate = true;
    }
    const { scene, camera } = this;

    super.render(renderer, scene, camera, inputBuffer);
  }
}
