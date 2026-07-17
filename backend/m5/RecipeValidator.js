const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');

class RecipeValidator {
    /**
     * @param {PipelineContext} context 
     * @param {Object} recipe 
     */
    validate(context, recipe) {
        const start = Logger.start('RecipeValidator');
        const warnings = [];
        
        try {
            if (!recipe || !recipe.recipeVersion || recipe.recipeVersion !== context.recipeVersion) {
                throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Recipe Version mismatch or missing.");
            }

            if (!recipe.timeline || !recipe.timeline.segments) {
                throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Recipe is missing timeline segments.");
            }

            const segments = recipe.timeline.segments;
            if (segments.length === 0) {
                throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, "Timeline has zero segments.");
            }

            // Gaps and Overlaps Validation
            let expectedStart = 0;
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const startTime = seg.startTime !== undefined ? seg.startTime : (seg.start || 0);
                const duration = seg.duration !== undefined ? seg.duration : ((seg.end || 0) - (seg.start || 0));

                const sTime = Number(startTime.toFixed(3));
                const eStart = Number(expectedStart.toFixed(3));

                if (sTime > eStart) {
                    warnings.push(`Timeline Gap detected at ${eStart} before segment ${i}`);
                } else if (sTime < eStart) {
                    throw new PipelineError(ErrorCodes.M5_INVALID_TIMELINE, `Timeline Overlap detected at ${sTime} for segment ${i}`);
                }
                expectedStart = sTime + duration;
                
                // Validate against forbidden effects
                const v = seg.variationReference?.visual;
                if (v) {
                    if (v.noise && v.noise > 0.05) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Forbidden Effect: Heavy Noise");
                    if (v.sharpen && v.sharpen > 0.5) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Forbidden Effect: Extreme Sharpen");
                    if (v.brightness && (v.brightness < 0.8 || v.brightness > 1.2)) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Forbidden Effect: Extreme Brightness");
                    // Assuming glitch/rgb split/etc are explicitly checked if they exist in schema
                    if (v.glitch || v.rgbSplit || v.lensDistortion || v.warp) {
                        throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Forbidden Effect: Cinematic/Glitch effects are strictly banned.");
                    }
                }
                const c = seg.variationReference?.camera;
                if (c) {
                    if (c.zoom && c.zoom > 1.05) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Forbidden Effect: Extreme Zoom");
                    if (c.rotate && Math.abs(c.rotate) > 1.0) throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Forbidden Effect: Extreme Rotate");
                }
            }

            // Duplicate Assets Check
            const usedAssets = new Set();
            segments.forEach(seg => {
                if (seg.assetReference) {
                    if (seg.assetReference.main) {
                        if (usedAssets.has(seg.assetReference.main.id)) warnings.push(`Duplicate asset detected: ${seg.assetReference.main.id}`);
                        usedAssets.add(seg.assetReference.main.id);
                    }
                }
            });

            // Bounds Validation
            if (recipe.output.fps > 60 || recipe.output.fps <= 0) {
                throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, `Invalid output FPS: ${recipe.output.fps}`);
            }

            if (recipe.layout.backgroundNeeded && !recipe.assets.background) {
                throw new PipelineError(ErrorCodes.M5_INVALID_LAYOUT, "Background needed by layout but missing in assets.");
            }

            if (recipe.storyDefinition.hookRule && !recipe.assets.hook) {
                throw new PipelineError(ErrorCodes.M5_INVALID_RECIPE, "Story requires hook but hook asset is missing.");
            }

            const durationMs = Logger.finish('RecipeValidator', start);
            return EngineResult.success(true, { executionTimeMs: durationMs, warningsCount: warnings.length });
        } catch (error) {
            Logger.error('RecipeValidator', 'Validation failed', error);
            return EngineResult.error(error, { executionTimeMs: Date.now() - start });
        }
    }
}

module.exports = RecipeValidator;
