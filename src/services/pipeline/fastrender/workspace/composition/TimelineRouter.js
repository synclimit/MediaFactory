/**
 * TimelineRouter.js
 * Central routing authority for Fast Workspace Timeline Composition (MF-1404).
 * Returns complete routing decisions based purely on LoopCapabilityRegistry metadata.
 * Contains NO feature-specific logic or conditionals.
 */

import { loopCapabilityRegistry, LOOP_CLASSIFICATIONS } from '../registry/LoopCapabilityRegistry.js';

export class TimelineRouter {
    /**
     * Route an object to its appropriate Fast Workspace subsystem.
     * @param {Object} object - M3 visual object
     * @returns {Object} Complete routing decision
     */
    routeObject(object) {
        const metadata = loopCapabilityRegistry.getClassification(object);

        let route = 'VALIDATION_LAYER';
        let targetSegment = null;

        switch (metadata.classification) {
            case LOOP_CLASSIFICATIONS.LOOP_NATIVE:
                route = 'LOOP_REGION';
                targetSegment = 'Loop';
                break;
            case LOOP_CLASSIFICATIONS.LOOP_ADAPTED:
                route = 'ADAPTATION_ENGINE';
                targetSegment = 'Loop';
                break;
            case LOOP_CLASSIFICATIONS.TIMELINE_ONLY:
                route = 'TIMELINE';
                targetSegment = 'Timeline'; // TimelineComposer will refine to Intro/Outro based on time
                break;
            case LOOP_CLASSIFICATIONS.UNSUPPORTED:
            default:
                route = 'VALIDATION_LAYER';
                targetSegment = null;
                break;
        }

        return {
            route,
            targetSegment,
            adaptationStrategy: metadata.adaptationStrategy,
            validationRequired: metadata.validationRequired,
            classification: metadata.classification
        };
    }
}

export const timelineRouter = new TimelineRouter();
