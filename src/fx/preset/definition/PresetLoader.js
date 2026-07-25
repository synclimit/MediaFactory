import { PresetValidator } from './PresetValidator.js';
import { compatibilityChecker } from './CompatibilityChecker.js';
import { PresetDefinition } from './PresetSchema.js';
import { FXPresetError } from './errors.js';
import { fxParameterRegistry } from './ParameterRegistry.js';

/**
 * PresetLoader
 * 
 * Orkestrator proses pemuatan preset.
 * Alur: Parse -> Validate Schema -> Check Compatibility -> Validate Registry -> Normalize -> Build
 */
export class PresetLoader {
    
    /**
     * Memuat preset dari JSON string
     * @param {string} jsonString 
     * @returns {PresetDefinition}
     */
    static loadFromJson(jsonString) {
        try {
            const rawObj = JSON.parse(jsonString);
            return this.loadFromObject(rawObj);
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new FXPresetError('Invalid JSON format');
            }
            throw error;
        }
    }

    /**
     * Memuat preset dari Javascript Object
     * @param {Object} rawObj 
     * @returns {PresetDefinition}
     */
    static loadFromObject(rawObj) {
        // 1. Schema Validation
        PresetValidator.validateSchema(rawObj);

        // 2. Compatibility Check
        compatibilityChecker.checkCompatibility(rawObj);

        // 3. Registry Validation
        PresetValidator.validateRegistry(rawObj);

        // 4. Normalize
        const normalizedData = this.normalize(rawObj);

        // 5. Build Definition
        return new PresetDefinition(normalizedData);
    }

    /**
     * Normalisasi data (mengisi default value, menangani konversi versi lawas)
     * @param {Object} validRawData 
     * @returns {Object}
     */
    static normalize(validRawData) {
        // Lakukan deep copy agar tidak memutasi rawData asli
        const normalized = JSON.parse(JSON.stringify(validRawData));
        
        // Pastikan block applyScope dan parameters selalu berupa object
        normalized.applyScope = normalized.applyScope || {};
        normalized.parameters = normalized.parameters || {};

        // Injeksi nilai default dari Registry jika belum didefinisikan secara spesifik oleh preset
        for (const [category, params] of Object.entries(normalized.parameters)) {
            const registryParams = fxParameterRegistry.getParametersByCategory(category);
            for (const paramDef of registryParams) {
                if (params[paramDef.name] === undefined) {
                    // Jika parameter tidak ada di raw data, set nilai default-nya
                    params[paramDef.name] = paramDef.defaultValue;
                }
            }
        }

        return normalized;
    }
}
