const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');

class ManifestGenerator {
    /**
     * @param {Object} recipe 
     * @param {string} outPath 
     */
    generate(recipe, outPath) {
        const start = Logger.start('ManifestGenerator');
        
        try {
            const manifest = {
                recipeHash: recipe.recipeHash,
                renderSeed: recipe.renderSeed,
                engineVersions: recipe.engineVersions,
                pipelineVersion: recipe.pipelineVersion,
                schemaVersion: '1.0',
                MediaFactoryVersion: "M5 v1.0",
                outputChecksum: "PENDING_FILE_HASH",
                ffmpegVersion: "1.0",
                outputFile: outPath,
                outputDurationSec: recipe.duration?.totalDuration || 0,
                renderTimeSeconds: 0, // Populated post-render
                createdAt: new Date().toISOString()
            };

            const durationMs = Logger.finish('ManifestGenerator', start);
            return EngineResult.success(manifest, { executionTimeMs: durationMs });
        } catch (error) {
            Logger.error('ManifestGenerator', 'Manifest generation failed', error);
            return EngineResult.error(error, { executionTimeMs: Date.now() - start });
        }
    }
}

module.exports = ManifestGenerator;
