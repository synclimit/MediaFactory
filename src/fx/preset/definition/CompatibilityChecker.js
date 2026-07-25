import { CompatibilityError } from './errors.js';

/**
 * CompatibilityChecker
 * 
 * Bertanggung jawab memastikan versi schema dari preset
 * bisa dibaca dan didukung oleh Media Factory engine saat ini.
 */
export class CompatibilityChecker {
    constructor() {
        // Anggap saat ini Media Factory mendukung skema versi 1.x.x
        this.currentEngineSchemaVersion = '1.0.0';
        
        // Asumsi semver sederhana untuk prototipe
        this.supportedMajorVersions = [1]; 
    }

    /**
     * Memeriksa kompatibilitas versi
     * @param {Object} rawData - Data preset mentah (setelah di-parse)
     * @throws {CompatibilityError} jika versi tidak didukung
     */
    checkCompatibility(rawData) {
        const presetSchemaVersion = rawData.schemaVersion || '1.0.0';
        
        const parts = presetSchemaVersion.split('.');
        const major = parseInt(parts[0], 10);

        if (!this.supportedMajorVersions.includes(major)) {
            throw new CompatibilityError(
                `Preset schema version ${presetSchemaVersion} is not supported by current engine (v${this.currentEngineSchemaVersion}).`,
                '1.x.x',
                presetSchemaVersion
            );
        }
        
        return true;
    }
}

export const compatibilityChecker = new CompatibilityChecker();
