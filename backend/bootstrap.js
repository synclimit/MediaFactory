const ServiceRegistry = require('./system/ServiceRegistry');

const ConfigurationService = require('./system/ConfigurationService');
const StorageService = require('./system/StorageService');
const RuntimeService = require('./system/RuntimeService');
const WorkspaceService = require('./system/WorkspaceService');
const ValidationService = require('./system/ValidationService');
const HardwareService = require('./system/HardwareService');
const PluginService = require('./system/PluginService');
const JobService = require('./system/JobService');
const RecoveryService = require('./system/RecoveryService');
const AssetService = require('./assets/AssetService');
const PresetManagerService = require('./system/PresetManagerService');
const CacheCleanerService = require('./system/CacheCleanerService');

// M3 Panel Services
const BackgroundService = require('./m3/background/BackgroundService');
const PlaylistService = require('./m3/playlist/PlaylistService');
const VisualizerService = require('./m3/visualizer/VisualizerService');
const EffectsService = require('./m3/effects/EffectsService');
const OverlayService = require('./m3/overlay/OverlayService');
const TextService = require('./m3/text/TextService');
const ReactiveService = require('./m3/reactive/ReactiveService');
const BrandingService = require('./m3/branding/BrandingService');

function safeRegister(name, factory) {
    try {
        const instance = typeof factory === 'function' ? factory() : factory;
        if (instance && typeof instance.start === 'function') {
            try { instance.start(); } catch(e) { console.error(`[ServiceRegistry] ${name}.start() warning:`, e); }
        }
        ServiceRegistry.register(name, instance);
    } catch (e) {
        console.error(`[ServiceRegistry] Failed to register service ${name}:`, e);
    }
}

function bootstrapBackend() {
    if (ServiceRegistry.services.size > 0) return;

    safeRegister('CacheCleanerService', () => new CacheCleanerService());
    safeRegister('ConfigurationService', () => new ConfigurationService());
    safeRegister('StorageService', () => new StorageService());
    safeRegister('RuntimeService', () => new RuntimeService());
    safeRegister('WorkspaceService', () => new WorkspaceService());
    safeRegister('ValidationService', () => new ValidationService());
    safeRegister('HardwareService', () => new HardwareService());
    safeRegister('PluginService', () => new PluginService());
    safeRegister('JobService', () => new JobService());
    safeRegister('RecoveryService', () => new RecoveryService());
    safeRegister('AssetService', () => new AssetService());
    safeRegister('PresetManagerService', () => new PresetManagerService());

    // Register M3 Panel Services
    safeRegister('BackgroundService', () => new BackgroundService());
    safeRegister('PlaylistService', () => new PlaylistService());
    safeRegister('VisualizerService', () => new VisualizerService());
    safeRegister('EffectsService', () => new EffectsService());
    safeRegister('OverlayService', () => new OverlayService());
    safeRegister('TextService', () => new TextService());
    safeRegister('ReactiveService', () => new ReactiveService());
    safeRegister('BrandingService', () => new BrandingService());

    console.log('[MediaFactory] Backend services bootstrapped successfully.');
}

module.exports = bootstrapBackend;
