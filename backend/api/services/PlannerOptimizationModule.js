const path = require('path');
const RenderStrategy = require('./RenderStrategy');
const MediaCompatibilityValidator = require('./MediaCompatibilityValidator');
const FastRenderCacheManager = require('./FastRenderCacheManager');
const AppPaths = require('../../system/AppPaths');

class PlannerOptimizationModule {
  /**
   * Evaluates audio playlist optimization strategy and cache availability
   * @param {Array} playlist 
   * @param {Object} audioParams 
   * @returns {Promise<Object>} Audio optimization plan
   */
  static async evaluateAudioOptimization(playlist = [], audioParams = {}) {
    const trace = [];
    const metrics = {
      assetsReused: 0,
      assetsGenerated: 0,
      audioStreamCopy: 0,
      concatOperations: 0,
      fullEncodes: 0
    };

    if (!playlist || playlist.length === 0) {
      trace.push('Playlist Empty: YES');
      return {
        strategy: RenderStrategy.FULL_ENCODE,
        reason: 'Empty playlist provided.',
        decisionTrace: trace,
        metrics
      };
    }

    // 1. Compute Audio Fingerprints (SHA-256 - Path Independent)
    const trackFingerprints = [];
    const pathIndependentTracks = [];
    for (const track of playlist) {
      const sp = track.resolvedPath || track.uri || track.sourcePath;
      if (sp && !sp.startsWith('http')) {
        const srcFp = await FastRenderCacheManager.computeSourceFingerprint(sp);
        trackFingerprints.push({ path: sp, fp: srcFp, duration: track.durationSec || 0 });
        pathIndependentTracks.push({ fp: srcFp, duration: track.durationSec || 0 });
      } else {
        trackFingerprints.push({ uri: sp, title: track.title });
        pathIndependentTracks.push({ uri: sp, title: track.title, duration: track.durationSec || 0 });
      }
    }

    const sourceFp = FastRenderCacheManager.sha256(JSON.stringify(pathIndependentTracks));
    const processFp = FastRenderCacheManager.computeProcessingFingerprint(audioParams);
    const outputFp = FastRenderCacheManager.computeOutputFingerprint(sourceFp, processFp);

    // 2. Cache Lookup (Lazy Validation)
    const cachedAsset = await FastRenderCacheManager.getCachedAsset(outputFp);
    if (cachedAsset) {
      trace.push(`SHA-256 Output Fingerprint Match: YES (${outputFp.slice(0, 12)})`);
      trace.push('Lazy Validation File Exists: YES');
      trace.push('-> CACHE_HIT (Reuse existing compiled audio)');

      metrics.assetsReused = 1;
      return {
        strategy: RenderStrategy.CACHE_HIT,
        cachedPath: cachedAsset.AssetPath,
        outputFingerprint: outputFp,
        sourceFingerprint: sourceFp,
        processingFingerprint: processFp,
        confidence: 100,
        decisionTrace: trace,
        reason: 'Matching audio compilation found in cache. Zero audio work required.',
        metrics
      };
    }

    trace.push(`SHA-256 Output Fingerprint Match: NO (Cache Miss for ${outputFp.slice(0, 12)})`);

    // 3. Audio Stream Copy Validation
    let allTracksCompatible = true;
    for (const tf of trackFingerprints) {
      if (tf.path) {
        const val = await MediaCompatibilityValidator.validateAudioCompatibility(tf.path, 'mp4');
        if (val.decision !== RenderStrategy.STREAM_COPY) {
          allTracksCompatible = false;
          break;
        }
      }
    }

    const cacheBase = AppPaths.getCacheBase();
    const targetAudioPath = path.join(cacheBase, 'm3', `compiled_audio_${outputFp.slice(0, 16)}.m4a`);

    if (allTracksCompatible) {
      trace.push('Audio Tracks Codec Compatible: YES (AAC/MP3 stream copy eligible)');
      trace.push('-> STREAM_COPY (-c:a copy)');

      metrics.assetsGenerated = 1;
      metrics.audioStreamCopy = 1;
      metrics.concatOperations = 1;

      return {
        strategy: RenderStrategy.STREAM_COPY,
        targetAudioPath,
        outputFingerprint: outputFp,
        sourceFingerprint: sourceFp,
        processingFingerprint: processFp,
        confidence: 100,
        decisionTrace: trace,
        reason: 'Audio tracks compatible for fast concat stream copy without re-encoding.',
        metrics
      };
    } else {
      trace.push('Audio Tracks Codec Compatible: NO (Re-encode required)');
      trace.push('-> FULL_ENCODE (-c:a libmp3lame)');

      metrics.assetsGenerated = 1;
      metrics.fullEncodes = 1;

      return {
        strategy: RenderStrategy.FULL_ENCODE,
        targetAudioPath,
        outputFingerprint: outputFp,
        sourceFingerprint: sourceFp,
        processingFingerprint: processFp,
        confidence: 90,
        decisionTrace: trace,
        reason: 'Audio tracks require re-encoding to target audio format.',
        metrics
      };
    }
  }

  /**
   * Evaluates background media optimization strategy and cache availability
   * @param {string} bgPath 
   * @param {Object} targetSettings { targetWidth, targetHeight, fps, mode }
   * @param {Array} objects 
   * @returns {Promise<Object>} Background optimization plan
   */
  static async evaluateBackgroundOptimization(bgPath, targetSettings = {}, objects = []) {
    const trace = [];
    const metrics = {
      assetsReused: 0,
      assetsGenerated: 0,
      videoStreamCopy: 0,
      minimalEncodes: 0,
      fullEncodes: 0
    };

    const hasOverlays = objects && objects.some(o => o && (o.type === 'overlay' || o.type === 'image' || o.type === 'video' || o.type === 'visualizer') && o.visible !== false);
    const hasVisualizer = objects && objects.some(o => o && o.type === 'visualizer' && o.visible !== false);

    // 1. Compute SHA-256 Fingerprints
    const sourceFp = bgPath && !bgPath.startsWith('http') ? await FastRenderCacheManager.computeSourceFingerprint(bgPath) : FastRenderCacheManager.sha256('virtual_bg');
    const processFp = FastRenderCacheManager.computeProcessingFingerprint({
      targetSettings,
      objects
    });
    const outputFp = FastRenderCacheManager.computeOutputFingerprint(sourceFp, processFp);

    // 2. Cache Lookup (Lazy Validation) — Only if no audio-reactive visualizer
    if (!hasVisualizer) {
      const cachedAsset = await FastRenderCacheManager.getCachedAsset(outputFp);
      if (cachedAsset) {
        trace.push(`SHA-256 Output Fingerprint Match: YES (${outputFp.slice(0, 12)})`);
        trace.push('Lazy Validation File Exists: YES');
        trace.push('-> CACHE_HIT (Reuse existing pre-encoded background master)');

        metrics.assetsReused = 1;
        return {
          strategy: RenderStrategy.CACHE_HIT,
          cachedPath: cachedAsset.AssetPath,
          outputFingerprint: outputFp,
          sourceFingerprint: sourceFp,
          processingFingerprint: processFp,
          confidence: 100,
          decisionTrace: trace,
          reason: 'Matching pre-encoded background clip found in cache.',
          metrics
        };
      }
    }

    trace.push(`SHA-256 Output Fingerprint Match: NO (Cache Miss for ${outputFp.slice(0, 12)})`);

    // Audio-reactive visualizer or overlays force full-frame encoding
    if (hasVisualizer || hasOverlays) {
      trace.push('Audio Visualizer or Overlays Present: YES (Full-frame encoding required)');
      trace.push('-> FULL_ENCODE');
      metrics.assetsGenerated = 1;
      metrics.fullEncodes = 1;
      return {
        strategy: RenderStrategy.FULL_ENCODE,
        outputFingerprint: outputFp,
        sourceFingerprint: sourceFp,
        processingFingerprint: processFp,
        confidence: 100,
        decisionTrace: trace,
        reason: 'Audio-reactive visualizer or overlays active, performing full frame-by-frame encoding.',
        metrics
      };
    }

    // Still Image Background without overlays
    trace.push('Media Type: Image Background');
    if (targetSettings.mode === 'FAST') {
      trace.push('Overlay Present: NO');
      trace.push('-> MINIMAL_ENCODE (Pre-encode 5s master clip + stream-copy loop)');

      const cacheBase = AppPaths.getCacheBase();
      const targetBgPath = path.join(cacheBase, 'm3', `short_bg_${outputFp.slice(0, 16)}.mp4`);

      metrics.assetsGenerated = 1;
      metrics.minimalEncodes = 1;
      metrics.videoStreamCopy = 1;

      return {
        strategy: RenderStrategy.MINIMAL_ENCODE,
        targetBgPath,
        outputFingerprint: outputFp,
        sourceFingerprint: sourceFp,
        processingFingerprint: processFp,
        confidence: 90,
        decisionTrace: trace,
        reason: 'Pre-encode 5-second master background clip for ultra-fast stream copy muxing.',
        metrics
      };
    } else {
      trace.push('Render Mode: NORMAL (Full quality frame-by-frame encoding requested)');
      trace.push('-> FULL_ENCODE');

      metrics.assetsGenerated = 1;
      metrics.fullEncodes = 1;

      return {
        strategy: RenderStrategy.FULL_ENCODE,
        outputFingerprint: outputFp,
        sourceFingerprint: sourceFp,
        processingFingerprint: processFp,
        confidence: 100,
        decisionTrace: trace,
        reason: 'Normal mode selected by user.',
        metrics
      };
    }
  }
}

module.exports = PlannerOptimizationModule;
