export class TimelineScheduler {
    expand(renderPlan) {
        if (!renderPlan || !Array.isArray(renderPlan.segments)) return [];
        return renderPlan.segments.map(seg => ({
            segmentId: 'seg_' + seg.startMs + '_' + seg.endMs,
            startMs: seg.startMs,
            endMs: seg.endMs,
            strategy: seg.strategy
        }));
    }
}
