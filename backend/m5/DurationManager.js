const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const Engine = require('./core/Engine');

class DurationManager extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} projectAsset 
     * @param {Object} layoutObj 
     */
    calculate(context, projectAsset, layoutObj) {
        return this.run(context, 'DurationManager', () => {
            let targetSeconds = 60;
            if (context.job?.snapshot?.config?.duration?.target) {
                const parsed = parseFloat(context.job.snapshot.config.duration.target);
                if (!isNaN(parsed) && parsed > 0) targetSeconds = parsed;
            } else if (context.job?.duration) {
                const parsed = parseFloat(context.job.duration);
                if (!isNaN(parsed) && parsed > 0) targetSeconds = parsed;
            }

            let hookRaw = projectAsset.hook ? (parseFloat(projectAsset.hook.duration) || 0) : 0;
            let ctaRaw = projectAsset.cta ? (parseFloat(projectAsset.cta.duration) || 0) : 0;

            const execSync = require('child_process').execSync;
            if (projectAsset.hook && projectAsset.hook.absolutePath) {
                try {
                    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${projectAsset.hook.absolutePath}"`);
                    hookRaw = parseFloat(out.toString().trim()) || hookRaw;
                } catch (err) { /* ignore */ }
            }
            if (projectAsset.cta && projectAsset.cta.absolutePath) {
                try {
                    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${projectAsset.cta.absolutePath}"`);
                    ctaRaw = parseFloat(out.toString().trim()) || ctaRaw;
                } catch (err) { /* ignore */ }
            }

            // Hook is capped to ~2s. CTA MUST preserve its original duration exactly (Rule #2).
            const hookDuration = hookRaw > 0 ? Number(Math.min(hookRaw, 2, targetSeconds * 0.15).toFixed(3)) : 0;
            const ctaDuration = ctaRaw > 0 ? Number(ctaRaw.toFixed(3)) : 0;
            
            // Main duration is automatically recalculated. Only Main expands/shrinks.
            const mainDuration = Number(Math.max(0, targetSeconds - hookDuration - ctaDuration).toFixed(3));
            const totalDuration = Number((hookDuration + mainDuration + ctaDuration).toFixed(3));

            Logger.info('DurationManager', `Calculated durations - Hook: ${hookDuration}s, Main: ${mainDuration}s, CTA: ${ctaDuration}s, Total: ${totalDuration}s (Target: ${targetSeconds}s)`);

            return {
                targetDuration: targetSeconds,
                hookDuration,
                mainDuration,
                ctaDuration,
                totalDuration
            };
        });
    }
}

module.exports = DurationManager;
