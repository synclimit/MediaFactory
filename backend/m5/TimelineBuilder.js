const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const Engine = require('./core/Engine');

class TimelineBuilder extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} storyDef 
     * @param {Object} editingPlan 
     * @param {Object} layoutObj 
     * @param {Object} durationObj 
     */
    buildTimeline(context, storyDef, editingPlan, layoutObj, durationObj) {
        return this.run(context, 'TimelineBuilder', () => {
            const planSegments = [...((editingPlan?.segments?.length > 0) 
                ? editingPlan.segments 
                : (storyDef?.storySegments || []).map((s, idx) => ({ id: `seg_${idx}`, segmentType: s.type, visualEffects: [] })))];

            // Enforce Rule #1: CTA is an interruption, never an ending. Ensure a 'main' continuation follows CTA if CTA is last.
            if (planSegments.length > 0 && (planSegments[planSegments.length - 1].segmentType || planSegments[planSegments.length - 1].type || '').toLowerCase() === 'cta') {
                planSegments.push({ id: `seg_after_cta`, segmentType: 'main', visualEffects: [] });
            }

            const mainCount = planSegments.filter(s => (s.segmentType || s.type || '').toLowerCase() === 'main').length || 1;
            const totalMainDur = durationObj.mainDuration || 0;
            
            // Human editing style: CTA interrupts early around 10~12s.
            // For 60s video with Hook(2s), first Main is set to ~8s so CTA interrupts at 10s.
            let firstMainDur = totalMainDur / mainCount;
            if (mainCount > 1 && totalMainDur > 12) {
                const hookDur = durationObj.hookDuration || 0;
                // Target total time before CTA is 10s
                const targetFirstMain = Math.max(2, 10 - hookDur);
                firstMainDur = Number(targetFirstMain.toFixed(3));
            }
            const remainingMainDur = Number(Math.max(0, totalMainDur - firstMainDur).toFixed(3));
            const subsequentMainDur = mainCount > 1 ? Number((remainingMainDur / (mainCount - 1)).toFixed(3)) : 0;

            const assetOffset = { hook: 0, main: 0, cta: 0 };
            const rawSegments = [];
            let mainIndex = 0;

            planSegments.forEach((seg, idx) => {
                const segType = (seg.segmentType || seg.type || 'main').toLowerCase();
                let segDur = 0;
                if (segType === 'hook') segDur = durationObj.hookDuration || 0;
                else if (segType === 'cta') segDur = durationObj.ctaDuration || 0;
                else {
                    if (mainIndex === 0 && mainCount > 1) segDur = firstMainDur;
                    else if (mainCount > 1) segDur = subsequentMainDur;
                    else segDur = totalMainDur;
                    mainIndex++;
                }

                if (segDur > 0.001) {
                    rawSegments.push({ seg, segType, segDur });
                }
            });

            let currentStart = 0;
            const segments = rawSegments.map((item, idx) => {
                const isLast = (idx === rawSegments.length - 1);
                let dur = item.segDur;
                if (isLast) {
                    dur = Math.max(0.001, (durationObj.targetDuration || 60) - currentStart);
                }
                dur = Number(dur.toFixed(3));

                const trimStart = Number((assetOffset[item.segType] || 0).toFixed(3));
                const trimEnd = Number((trimStart + dur).toFixed(3));
                assetOffset[item.segType] = trimEnd;

                const startObj = {
                    id: item.seg.id || `seg_${idx}`,
                    type: item.segType,
                    start: Number(currentStart.toFixed(3)),
                    end: Number((currentStart + dur).toFixed(3)),
                    duration: dur,
                    trimStart: trimStart,
                    trimEnd: trimEnd,
                    visualEffects: item.seg.visualEffects || []
                };

                currentStart = Number((currentStart + dur).toFixed(3));
                return startObj;
            });

            Logger.info('TimelineBuilder', `Built ${segments.length} timeline segments. Total duration: ${currentStart}s`);

            return {
                totalDuration: durationObj.targetDuration || currentStart,
                segments
            };
        });
    }
}

module.exports = TimelineBuilder;
