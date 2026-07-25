import { ValidationError } from './errors.js';
import { fxParameterRegistry } from './ParameterRegistry.js';

/**
 * PresetValidator
 * 
 * Melakukan validasi bertingkat terhadap data mentah:
 * 1. Schema Validation (struktur dasar dan tipe data)
 * 2. Registry Validation (memastikan parameter dikenal)
 */
export class PresetValidator {
    
    /**
     * Memvalidasi struktur skema dasar
     * @param {Object} rawData 
     * @throws {ValidationError}
     */
    static validateSchema(rawData) {
        const errors = [];

        if (!rawData || typeof rawData !== 'object') {
            throw new ValidationError('Preset data must be a valid JSON object');
        }

        // Cek field wajib metadata
        if (!rawData.id) errors.push('Missing required field: "id"');
        if (!rawData.name) errors.push('Missing required field: "name"');
        
        // Cek format applyScope (harus object)
        if (rawData.applyScope && typeof rawData.applyScope !== 'object') {
            errors.push('"applyScope" must be an object');
        }

        // Cek format parameters (harus object)
        if (rawData.parameters && typeof rawData.parameters !== 'object') {
            errors.push('"parameters" must be an object');
        }

        if (errors.length > 0) {
            throw new ValidationError('Schema validation failed', errors);
        }

        return true;
    }

    /**
     * Memvalidasi parameter berdasarkan registry
     * @param {Object} rawData 
     * @throws {ValidationError}
     */
    static validateRegistry(rawData) {
        const errors = [];
        const params = rawData.parameters || {};

        for (const [category, categoryParams] of Object.entries(params)) {
            if (typeof categoryParams !== 'object') {
                errors.push(`Category "${category}" inside parameters must be an object`);
                continue;
            }

            for (const [paramName, _] of Object.entries(categoryParams)) {
                if (!fxParameterRegistry.isParameterSupported(category, paramName)) {
                    errors.push(`Unknown parameter: "${paramName}" in category "${category}"`);
                }
            }
        }

        if (errors.length > 0) {
            throw new ValidationError('Registry validation failed', errors);
        }

        return true;
    }
}
