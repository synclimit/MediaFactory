import { SchedulerKernel } from '../scheduler/SchedulerKernel.js';
import { ScheduleBuilder } from '../scheduler/ScheduleBuilder.js';
import { ScheduleValidator } from '../scheduler/ScheduleValidator.js';
import { TimelineScheduler } from '../scheduler/TimelineScheduler.js';
import { LayerScheduler } from '../scheduler/LayerScheduler.js';
import { ResourceScheduler } from '../scheduler/ResourceScheduler.js';

export class SchedulerFactory {
    static createScheduler() {
        return new SchedulerKernel(
            new ScheduleBuilder(new TimelineScheduler(), new LayerScheduler(), new ResourceScheduler()),
            new ScheduleValidator()
        );
    }
}
