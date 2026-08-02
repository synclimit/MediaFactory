const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const AppPaths = require('../../system/AppPaths');

const MANIFEST_VERSION = 19;
const FINGERPRINT_VERSION = 1;

class FastRenderCacheManager {
  /**
   * Helper to compute SHA-256 hash of string or buffer
   * @param {string|Buffer} data 
   * @returns {string} sha256 hex string
   */
  static sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Compute SHA-256 of a file's content (reads first 1MB + size for ultra-fast deterministic fingerprinting)
   * @param {string} filePath 
   * @returns {Promise<string>}
   */
  static async computeSourceFingerprint(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const handle = await fs.open(filePath, 'r');
      const bytesToRead = Math.min(stats.size, 1024 * 1024); // 1MB sample
      const buffer = Buffer.alloc(bytesToRead);
      await handle.read(buffer, 0, bytesToRead, 0);
      await handle.close();

      const contentHash = this.sha256(buffer);
      return this.sha256(`v${FINGERPRINT_VERSION}:${contentHash}:${stats.size}`);
    } catch (err) {
      // Fallback: If file is virtual or generated, hash string identifier
      return this.sha256(`v${FINGERPRINT_VERSION}:${filePath}`);
    }
  }

  /**
   * Compute Processing Fingerprint
   * @param {Object} processingParams 
   * @returns {string}
   */
  static computeProcessingFingerprint(processingParams = {}) {
    const serialized = JSON.stringify(processingParams, Object.keys(processingParams).sort());
    return this.sha256(`v${FINGERPRINT_VERSION}:${serialized}`);
  }

  /**
   * Compute Output Fingerprint (Cache Identity)
   * @param {string} sourceFingerprint 
   * @param {string} processingFingerprint 
   * @returns {string}
   */
  static computeOutputFingerprint(sourceFingerprint, processingFingerprint) {
    return this.sha256(`v${FINGERPRINT_VERSION}:${sourceFingerprint}:${processingFingerprint}`);
  }

  /**
   * Get path to manifest file
   */
  static getManifestPath() {
    const cacheBase = AppPaths.getCacheBase();
    return path.join(cacheBase, 'fast_render_manifest.json');
  }

  /**
   * Load Manifest from disk
   * @returns {Promise<Object>}
   */
  static async loadManifest() {
    try {
      const manifestPath = this.getManifestPath();
      const raw = await fs.readFile(manifestPath, 'utf8');
      const data = JSON.parse(raw);
      if (data.ManifestVersion === MANIFEST_VERSION && data.assets) {
        return data;
      }
    } catch (e) {}

    return {
      ManifestVersion: MANIFEST_VERSION,
      FingerprintVersion: FINGERPRINT_VERSION,
      assets: {}
    };
  }

  /**
   * Save Manifest to disk
   * @param {Object} manifest 
   */
  static async saveManifest(manifest) {
    try {
      const manifestPath = this.getManifestPath();
      await fs.mkdir(path.dirname(manifestPath), { recursive: true });
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    } catch (e) {
      console.warn('[FastRenderCacheManager] Failed to save manifest:', e.message);
    }
  }

  /**
   * Lazy Validation Cache Lookup
   * Checks if an asset exists in manifest and is valid on disk.
   * Automatically invalidates entry if missing from disk.
   * @param {string} outputFingerprint 
   * @returns {Promise<Object|null>} asset entry or null
   */
  static async getCachedAsset(outputFingerprint) {
    const manifest = await this.loadManifest();
    const entry = manifest.assets[outputFingerprint];

    if (!entry) return null;

    // LAZY VALIDATION: Check file existence on disk right now
    try {
      const stats = await fs.stat(entry.AssetPath);
      if (stats.size > 0) {
        // Cache Hit! Update usage statistics
        entry.UsageCount = (entry.UsageCount || 0) + 1;
        entry.LastUsed = new Date().toISOString();
        entry.LastValidation = new Date().toISOString();
        entry.FileExists = true;
        entry.FileSize = stats.size;

        manifest.assets[outputFingerprint] = entry;
        await this.saveManifest(manifest);

        return { ...entry, outputFingerprint };
      }
    } catch (e) {
      // File missing on disk! Invalidate entry.
      console.log(`[FastRenderCacheManager] Lazy Validation Failed: File missing on disk (${entry.AssetPath}). Invalidating entry.`);
    }

    // Invalidate entry
    delete manifest.assets[outputFingerprint];
    await this.saveManifest(manifest);
    return null;
  }

  /**
   * Register a newly rendered asset in the manifest
   * @param {Object} assetData 
   */
  static async registerAsset({ outputFingerprint, sourceFingerprint, processingFingerprint, assetType, outputParams, filePath }) {
    try {
      const stats = await fs.stat(filePath);
      const manifest = await this.loadManifest();

      manifest.assets[outputFingerprint] = {
        Hash: outputFingerprint,
        SourceFingerprint: sourceFingerprint,
        ProcessingFingerprint: processingFingerprint,
        OutputFingerprint: outputFingerprint,
        AssetType: assetType,
        OutputParameters: outputParams,
        CreatedTime: new Date().toISOString(),
        LastUsed: new Date().toISOString(),
        UsageCount: 1,
        FileExists: true,
        FileSize: stats.size,
        LastValidation: new Date().toISOString(),
        AssetPath: filePath
      };

      await this.saveManifest(manifest);
    } catch (e) {
      console.warn('[FastRenderCacheManager] Failed to register asset:', e.message);
    }
  }
}

module.exports = FastRenderCacheManager;
