/**
 * VisualizerRegistryAdapter.js [Status: NEW]
 * Adapter for mapping and unifying Legacy Media Factory Visualizer Registry with Production Reference Engine v1.0 Registry.
 * 
 * SPRINT 05 GOVERNANCE:
 * - Maps Legacy Plugin IDs to Reference Engine Plugin IDs.
 * - Legacy `visualizerRegistry` remains 100% ACTIVE as the primary driver.
 * - Reference Engine `VisualizerRegistry` is loaded in Standby Coexistence Mode.
 * - Feature Flag `useReferenceEngine` remains FALSE.
 */

import { visualizerRegistry as legacyRegistry } from '../../visualizers/registry/VisualizerRegistry.js';
import { VisualizerRegistry as referenceRegistry } from '../registry/VisualizerRegistry.js';

// Bidirectional ID Mapping Table between Legacy Media Factory & Reference Engine v1.0
export const PLUGIN_ID_MAP = {
  // Legacy Media Factory ID -> Reference Engine ID
  'B01_ClassicVertical': 'SPECTRUM_BARS',
  'B02_StaggeredCenter': 'SPECTRUM_BARS',
  'B03_MirrorBars': 'SPECTRUM_BARS',
  'B04_SplitDual': 'SPECTRUM_BARS',
  'B05_RoundedPillBars': 'SPECTRUM_BARS',
  'B06_HorizontalBars': 'SPECTRUM_BARS',
  'W01_Oscilloscope': 'CYBERPUNK_WAVEFORM',
  'W02_FilledSine': 'CYBERPUNK_WAVEFORM',
  'W03_SymmetricalDual': 'CYBERPUNK_WAVEFORM',
  'W04_BezierSpline': 'CYBERPUNK_WAVEFORM',
  'W05_DotMatrixWave': 'CYBERPUNK_WAVEFORM',
  'C01_BasicCircular': 'CIRCULAR_PULSE',
  'P01_ParticleOrbit': 'PARTICLE_ORBIT'
};

export class VisualizerRegistryAdapter {
  constructor() {
    this.legacyRegistry = legacyRegistry;
    this.referenceRegistry = referenceRegistry;
    this.idMap = { ...PLUGIN_ID_MAP };
  }

  /**
   * Translates a legacy visualizer plugin ID to Reference Engine plugin ID.
   * @param {string} pluginId Legacy plugin ID (e.g. B01_ClassicVertical) or Reference ID
   * @returns {string} Reference Engine plugin ID (e.g. SPECTRUM_BARS)
   */
  getMappedReferenceId(pluginId) {
    if (this.idMap[pluginId]) {
      return this.idMap[pluginId];
    }
    if (this.referenceRegistry.getPlugin(pluginId)) {
      return pluginId;
    }
    return 'SPECTRUM_BARS';
  }


  /**
   * Retrieves plugin metadata from both registries.
   * @param {string} pluginId Legacy or Reference plugin ID
   * @returns {Object} Unified plugin metadata representation
   */
  getPluginMetadata(pluginId) {
    const legacyPlugin = this.legacyRegistry.get(pluginId);
    const refId = this.getMappedReferenceId(pluginId);
    const refPlugin = this.referenceRegistry.getPlugin(refId);

    return {
      id: pluginId,
      referenceId: refId,
      name: legacyPlugin?.metadata?.name || refPlugin?.name || pluginId,
      category: legacyPlugin?.metadata?.category || 'Bars',
      isReferenceAvailable: Boolean(refPlugin),
      legacyActive: true
    };
  }

  /**
   * Validates coexistence of both registries without breaking execution.
   * @returns {Object} Coexistence diagnostic status
   */
  validateCoexistence() {
    const legacyCount = this.legacyRegistry.getAll().length;
    const referenceCount = this.referenceRegistry.getAllPlugins().length;

    return {
      status: 'COEXISTENCE_ACTIVE',
      legacyPluginCount: legacyCount,
      referencePluginCount: referenceCount,
      featureFlagUseReferenceEngine: false
    };
  }
}

export const visualizerRegistryAdapter = new VisualizerRegistryAdapter();
