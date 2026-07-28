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

function bootstrapBackend() {
    // Prevent double registration if already bootstrapped
    if (ServiceRegistry.services.size > 0) return;

    const cacheCleaner = new CacheCleanerService();
    cacheCleaner.start();
    ServiceRegistry.register('CacheCleanerService', cacheCleaner);

    ServiceRegistry.register('ConfigurationService', new ConfigurationService());
    ServiceRegistry.register('StorageService', new StorageService());
    ServiceRegistry.register('RuntimeService', new RuntimeService());
    ServiceRegistry.register('WorkspaceService', new WorkspaceService());
    ServiceRegistry.register('ValidationService', new ValidationService());
    ServiceRegistry.register('HardwareService', new HardwareService());
    ServiceRegistry.register('PluginService', new PluginService());
    ServiceRegistry.register('JobService', new JobService());
    ServiceRegistry.register('RecoveryService', new RecoveryService());
    ServiceRegistry.register('AssetService', new AssetService());
    ServiceRegistry.register('PresetManagerService', new PresetManagerService());

    // Register M3 Panel Services
    ServiceRegistry.register('BackgroundService', new BackgroundService());
    ServiceRegistry.register('PlaylistService', new PlaylistService());
    ServiceRegistry.register('VisualizerService', new VisualizerService());
    ServiceRegistry.register('EffectsService', new EffectsService());
    ServiceRegistry.register('OverlayService', new OverlayService());
    ServiceRegistry.register('TextService', new TextService());
    ServiceRegistry.register('ReactiveService', new ReactiveService());
    ServiceRegistry.register('BrandingService', new BrandingService());

    console.log('[MediaFactory] Backend services bootstrapped successfully.');
}

module.exports = bootstrapBackend;
