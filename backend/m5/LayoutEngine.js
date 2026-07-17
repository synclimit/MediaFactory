const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const Engine = require('./core/Engine');

class LayoutEngine extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} projectAsset 
     */
    buildLayout(context, projectAsset) {
        return this.run(context, 'LayoutEngine', () => {
            const config = context.config || {};
            let canvasWidth = 1080;
            let canvasHeight = 1920;
            const targetRes = config.output?.targetResolution;
            if (typeof targetRes === 'string') {
                const parts = targetRes.split('x');
                if (parts.length === 2) {
                    canvasWidth = parseInt(parts[0], 10) || 1080;
                    canvasHeight = parseInt(parts[1], 10) || 1920;
                }
            } else if (targetRes) {
                canvasWidth = targetRes.width || 1080;
                canvasHeight = targetRes.height || 1920;
            }
            
            // LayoutEngine default LEFT_RIGHT per Rule #4 for Shorts. TOP_BOTTOM optional only.
            let layoutType = 'LEFT_RIGHT';
            if (context.job?.layout) {
                layoutType = context.job.layout.toUpperCase();
            } else if (config.layout) {
                layoutType = config.layout.toUpperCase();
            }
            if (layoutType !== 'TOP_BOTTOM') {
                layoutType = 'LEFT_RIGHT';
            }

            const layout = {
                type: layoutType,
                canvasWidth,
                canvasHeight,
                backgroundStyle: 'black'
            };

            Logger.info('LayoutEngine', `Selected constant layout for Main Scene: ${layoutType} (${canvasWidth}x${canvasHeight})`);

            return layout;
        });
    }
}

module.exports = LayoutEngine;
