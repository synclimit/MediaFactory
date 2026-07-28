export class TimelineScheduler {
    expand(renderPlan) {
        return renderPlan.segments.map(seg => ({
            segmentId: 'seg_' + seg.startMs + '_' + seg.endMs,
            startMs: seg.startMs,
            endMs: seg.endMs,
            strategy: seg.strategy
        }));
    }
}
