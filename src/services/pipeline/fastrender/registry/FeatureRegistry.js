import { FeatureDescriptor } from '../contracts/FeatureDescriptor.js';
import { RealtimeMode, RenderType, CacheMode, EncodeCost, PreferredStrategy } from '../contracts/Enums.js';

export class FeatureRegistry {
    constructor() {
        this.descriptors = new Map();
        this.registerBuiltInFeatures();
    }

    register(descriptor) {
        if (!(descriptor instanceof FeatureDescriptor)) {
            descriptor = new FeatureDescriptor(descriptor);
        }
        this.descriptors.set(descriptor.id, descriptor);
        return descriptor;
    }

    get(id) {
        return this.descriptors.get(id) || null;
    }

    getAll() {
        return Array.from(this.descriptors.values());
    }

    has(id) {
        return this.descriptors.has(id);
    }

    registerBuiltInFeatures() {
        // Built-in 1: SubtitleEngine
        this.register(new FeatureDescriptor({
            id: 'SubtitleEngine',
            name: 'Subtitle Engine',
            category: 'subtitle',
            capability: {
                realtimeMode: RealtimeMode.NONE,
                renderType: RenderType.TIMELINE,
                cacheMode: CacheMode.OPTIONAL,
                encodeCost: EncodeCost.LOW
            },
            plannerHint: {
                preferredStrategy: PreferredStrategy.TIMELINE,
                priority: 100
            }
        }));

        // Built-in 2: VisualizerEngine
        this.register(new FeatureDescriptor({
            id: 'VisualizerEngine',
            name: 'Beat Reactive Visualizer Engine',
            category: 'visualizer',
            capability: {
                realtimeMode: RealtimeMode.REQUIRED,
                renderType: RenderType.REALTIME,
                cacheMode: CacheMode.NONE,
                encodeCost: EncodeCost.HIGH,
                requiresAudioAnalysis: true,
                requiresBeatEngine: true,
                requiresFullEncode: true
            },
            plannerHint: {
                preferredStrategy: PreferredStrategy.FULL_ENCODE,
                priority: 900
            }
        }));

        // Built-in 3: OverlayEngine
        this.register(new FeatureDescriptor({
            id: 'OverlayEngine',
            name: 'Overlay Engine',
            category: 'overlay',
            capability: {
                realtimeMode: RealtimeMode.NONE,
                renderType: RenderType.TIMELINE,
                cacheMode: CacheMode.OPTIONAL,
                encodeCost: EncodeCost.LOW
            },
            plannerHint: {
                preferredStrategy: PreferredStrategy.TIMELINE,
                priority: 200
            }
        }));

        // Built-in 4: ParticleEngine
        this.register(new FeatureDescriptor({
            id: 'ParticleEngine',
            name: 'Particle Engine',
            category: 'particle',
            capability: {
                realtimeMode: RealtimeMode.OPTIONAL,
                renderType: RenderType.PRERENDER,
                cacheMode: CacheMode.REQUIRED,
                encodeCost: EncodeCost.MEDIUM,
                canPrerender: true
            },
            plannerHint: {
                preferredStrategy: PreferredStrategy.PRERENDER,
                priority: 400
            }
        }));

        // Built-in 5: CameraEngine
        this.register(new FeatureDescriptor({
            id: 'CameraEngine',
            name: 'Camera FX Engine',
            category: 'camera',
            capability: {
                realtimeMode: RealtimeMode.NONE,
                renderType: RenderType.COMPOSE,
                cacheMode: CacheMode.OPTIONAL,
                encodeCost: EncodeCost.LOW
            },
            plannerHint: {
                preferredStrategy: PreferredStrategy.CONCAT,
                priority: 300
            }
        }));

        // Built-in 6: TransitionEngine
        this.register(new FeatureDescriptor({
            id: 'TransitionEngine',
            name: 'Transition Engine',
            category: 'transition',
            capability: {
                realtimeMode: RealtimeMode.NONE,
                renderType: RenderType.COMPOSE,
                cacheMode: CacheMode.OPTIONAL,
                encodeCost: EncodeCost.LOW
            },
            plannerHint: {
                preferredStrategy: PreferredStrategy.MINIMAL_ENCODE,
                priority: 350
            }
        }));
    }
}
