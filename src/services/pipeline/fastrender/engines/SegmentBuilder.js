import { ISegmentBuilder } from '../interfaces/IEngines.js';
import { SegmentDescriptor } from '../contracts/Descriptors.js';
export class SegmentBuilder extends ISegmentBuilder {
    buildTimeBlocks(strategyContext, timelineContext) {
        // Dummy logic: one segment for the whole duration
        return [new SegmentDescriptor(0, timelineContext.durationMs, strategyContext.globalStrategy, [])];
    }
}
