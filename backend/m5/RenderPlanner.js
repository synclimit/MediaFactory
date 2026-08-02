const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const Engine = require('./core/Engine');
const PlannerOptimizationModule = require('../api/services/PlannerOptimizationModule');
const RenderStrategy = require('../api/services/RenderStrategy');

class RenderPlanner extends Engine {
    /**
     * Legacy recipe planner method
     * @param {PipelineContext} context 
     * @param {Object} recipe 
     */
    plan(context, recipe) {
        return this.run(context, 'RenderPlanner', () => {
            const config = context.config || {};
            
            let preferredEncoder = 'libx264';
            let priority = 'normal';

            if (config.output?.renderer === 'FFMPEG') {
                if (config.performance?.hardwareAcceleration) {
                    preferredEncoder = 'h264_nvenc';
                }
            }

            const optimizationPlan = {
                preferredEncoder: preferredEncoder,
                executionPriority: priority,
                memoryConstraint: config.performance?.budget || 1024,
                resolution: {
                    width: recipe.output ? recipe.output.canvasWidth : 1920,
                    height: recipe.output ? recipe.output.canvasHeight : 1080
                }
            };

            return optimizationPlan;
        });
    }

    /**
     * Single Decision Authority method for M1, M2, and M3 job rendering
     * @param {Object} payload 
     * @returns {Promise<Object>} Complete Execution Strategy Plan
     */
    async createJobPlan(payload = {}) {
        const metadata = payload.metadata || {};
        const playlist = payload.playlist || payload.m3AudioTracks || [];
        const background = payload.background || {};
        const objects = payload.objects || (payload.composer && payload.composer.objects) || [];

        const mode = (metadata.renderMode || 'FAST').toUpperCase();
        let targetWidth = 1920;
        let targetHeight = 1080;
        const res = metadata.resolution || 'SD';
        if (res === 'SD' || res === '480p') {
            targetWidth = 854;
            targetHeight = 480;
        } else if (res === '720p') {
            targetWidth = 1280;
            targetHeight = 720;
        } else if (res === '1080p') {
            targetWidth = 1920;
            targetHeight = 1080;
        }

        const fps = parseInt(metadata.fps) || 30;
        const targetSettings = { targetWidth, targetHeight, fps, mode };

        // 1. Evaluate Audio Playlist Plan
        const audioPlan = await PlannerOptimizationModule.evaluateAudioOptimization(playlist, metadata);

        // 2. Evaluate Background Media Plan
        const bgPath = background.filename || background.sourcePath || background.source || '';
        const bgPlan = await PlannerOptimizationModule.evaluateBackgroundOptimization(bgPath, targetSettings, objects);

        // 3. Aggregate Performance Metrics
        const metrics = {
            assetsReused: (audioPlan.metrics?.assetsReused || 0) + (bgPlan.metrics?.assetsReused || 0),
            assetsGenerated: (audioPlan.metrics?.assetsGenerated || 0) + (bgPlan.metrics?.assetsGenerated || 0),
            videoStreamCopy: bgPlan.metrics?.videoStreamCopy || 0,
            audioStreamCopy: audioPlan.metrics?.audioStreamCopy || 0,
            concatOperations: (audioPlan.metrics?.concatOperations || 0) + (bgPlan.metrics?.concatOperations || 0),
            minimalEncodes: bgPlan.metrics?.minimalEncodes || 0,
            fullEncodes: (audioPlan.metrics?.fullEncodes || 0) + (bgPlan.metrics?.fullEncodes || 0),
            cacheHitRate: 0,
            cacheMissRate: 0
        };

        const totalAssets = metrics.assetsReused + metrics.assetsGenerated;
        if (totalAssets > 0) {
            metrics.cacheHitRate = Math.round((metrics.assetsReused / totalAssets) * 100);
            metrics.cacheMissRate = 100 - metrics.cacheHitRate;
        }

        return {
            targetSettings,
            audioPlan,
            bgPlan,
            metrics,
            strategyEnum: RenderStrategy
        };
    }
}

module.exports = RenderPlanner;

