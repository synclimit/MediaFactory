const crypto = require('crypto');
const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const Engine = require('./core/Engine');

class RecipeBuilder extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} projectAsset 
     * @param {Object} storyDef 
     * @param {Object} editingPlan 
     * @param {Object} layoutObj 
     * @param {Object} timelineObj 
     * @param {Object} durationObj 
     */
    buildRecipe(context, projectAsset, storyDef, editingPlan, layoutObj, timelineObj, durationObj) {
        return this.run(context, 'RecipeBuilder', () => {
            const rawData = JSON.stringify({ projectAsset, layoutObj, durationObj, editingPlan, storyDef, timelineObj });
            const recipeHash = crypto.createHash('sha256').update(rawData).digest('hex');

            const recipe = {
                recipeId: crypto.randomUUID(),
                recipeVersion: context.recipeVersion,
                pipelineVersion: context.pipelineVersion,
                engineVersions: {
                    AssetEngine: '1.0',
                    LayoutEngine: '1.0',
                    DurationManager: '1.0',
                    VariationEngine: '1.0',
                    FormulaEngine: '1.0',
                    TimelineBuilder: '1.0'
                },
                renderSeed: context.renderSeed,
                createdAt: context.clock.now(),
                
                // Business Objects
                storyDefinition: storyDef,
                editingPlan: editingPlan,
                layout: layoutObj,
                timeline: timelineObj,
                duration: durationObj,
                assets: projectAsset,
                
                output: {
                    canvasWidth: layoutObj.canvasWidth,
                    canvasHeight: layoutObj.canvasHeight,
                    fps: context.config?.output?.fps || 30
                },
                metadata: {
                    jobId: context.jobId,
                    formulaId: storyDef.formula,
                    recipeHash: recipeHash,
                    ctaText: context.job?.ctaText || ''
                }
            };

            return recipe;
        });
    }
}

module.exports = RecipeBuilder;
