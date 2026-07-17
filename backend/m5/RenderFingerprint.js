const crypto = require('crypto');
const Logger = require('./core/Logger');

class RenderFingerprint {
    /**
     * Generates a unique hash fingerprint to guarantee cache correctness.
     * @param {Object} recipe 
     * @param {Object} renderGraph 
     * @param {Object} encoderProfile 
     * @param {Object} outputResolution 
     * @param {string} rendererVersion 
     * @param {string} pipelineVersion 
     */
    static generate(recipe, renderGraph, encoderProfile, outputResolution, rendererVersion, pipelineVersion) {
        const start = Logger.start('RenderFingerprint');
        
        try {
            const signature = {
                recipeHash: recipe.recipeHash,
                graphHash: this._hashObject(renderGraph),
                encoderProfile: encoderProfile,
                resolution: outputResolution,
                rendererVersion: rendererVersion,
                pipelineVersion: pipelineVersion
            };

            const fingerprint = this._hashObject(signature);
            Logger.finish('RenderFingerprint', start);
            return fingerprint;
        } catch (error) {
            Logger.error('RenderFingerprint', 'Generation failed', error);
            throw error;
        }
    }

    static _hashObject(obj) {
        const str = JSON.stringify(obj, Object.keys(obj).sort());
        return crypto.createHash('sha256').update(str).digest('hex');
    }
}

module.exports = RenderFingerprint;
