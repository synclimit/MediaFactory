import { FeatureRegistry } from '../FeatureRegistry.js';
import { ZoomPulseFeature } from './ZoomPulseFeature.js';
import { CameraShakeFeature } from './CameraShakeFeature.js';
import { SubtitleHighlightFeature } from './SubtitleHighlightFeature.js';
import { ExportFeature } from './ExportFeature.js';
import { BeatReactiveFeature } from './BeatReactiveFeature.js';

FeatureRegistry.register(ZoomPulseFeature);
FeatureRegistry.register(CameraShakeFeature);
FeatureRegistry.register(SubtitleHighlightFeature);
FeatureRegistry.register(ExportFeature);
FeatureRegistry.register(BeatReactiveFeature);
