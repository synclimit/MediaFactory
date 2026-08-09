import { IVisualizerPlugin } from '../contracts/IVisualizerPlugin.js';
import { ParticlePhysicsEngine } from '../engines/ParticlePhysicsEngine.js';

const particlePhysicsEngine = new ParticlePhysicsEngine();

export class ParticleOrbitPlugin extends IVisualizerPlugin {
  constructor() {
    super('PARTICLE_ORBIT', 'Particle Orbit Visualizer');
  }

  initialize(renderContext) {
    particlePhysicsEngine.initialize(renderContext);
  }

  render(renderContext) {
    const { audioState, config } = renderContext;
    return particlePhysicsEngine.render(renderContext, audioState, config);
  }

  dispose(renderContext) {
    particlePhysicsEngine.dispose(renderContext);
  }
}
