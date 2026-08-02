/**
 * TimelineComposer.js
 * Assembles the playback graph for Fast Workspace (MF-1404).
 * Orchestrates objects into segments without feature-specific conditionals.
 */

import { CompositionGraph } from './CompositionGraph.js';
import { timelineRouter } from './TimelineRouter.js';

export class TimelineComposer {
    /**
     * Build the canonical playback CompositionGraph.
     * @param {Object} projectState - The current project state
     * @param {Object} loopOverlayData - LoopProvider overlay info
     * @returns {CompositionGraph}
     */
    compose(projectState, loopOverlayData = null) {
        const graph = new CompositionGraph();

        const masterDuration = projectState.duration || 10.0;
        let loopStart = 0;
        let loopEnd = masterDuration;

        if (loopOverlayData) {
            if (loopOverlayData.loopStart !== undefined) loopStart = loopOverlayData.loopStart;
            if (loopOverlayData.loopEnd !== undefined) loopEnd = loopOverlayData.loopEnd;
        }

        const introDuration = Math.max(0, loopStart);
        const loopDuration = Math.max(0, loopEnd - loopStart);
        const outroDuration = Math.max(0, masterDuration - loopEnd);

        // Pre-create segments
        const segments = {
            'Intro': {
                id: 'segment-intro',
                type: 'Intro',
                startTime: 0,
                endTime: introDuration,
                duration: introDuration,
                loopable: false,
                children: [],
                metadata: { description: 'Pre-loop sequence' }
            },
            'Loop': {
                id: 'segment-loop',
                type: 'Loop',
                startTime: loopStart,
                endTime: loopEnd,
                duration: loopDuration,
                loopable: true,
                children: [],
                metadata: { description: 'Core repeating region' }
            },
            'Loop Preview': { // Loop preview sits functionally adjacent to Loop
                id: 'segment-loop-preview',
                type: 'Loop Preview',
                startTime: loopStart,
                endTime: loopEnd,
                duration: loopDuration,
                loopable: true,
                children: [],
                metadata: { description: 'Adapted visualization overlay' }
            },
            'Outro': {
                id: 'segment-outro',
                type: 'Outro',
                startTime: loopEnd,
                endTime: masterDuration,
                duration: outroDuration,
                loopable: false,
                children: [],
                metadata: { description: 'Post-loop sequence' }
            }
        };

        const objects = projectState.m3Objects || [];

        // Route objects and assign to segments
        objects.forEach(obj => {
            const routingDecision = timelineRouter.routeObject(obj);
            const enrichedObj = {
                ...obj,
                _composition: routingDecision
            };

            const route = routingDecision.route;
            let targetSegmentId = null;

            if (route === 'LOOP_REGION') {
                targetSegmentId = 'Loop';
            } else if (route === 'ADAPTATION_ENGINE') {
                targetSegmentId = 'Loop Preview';
            } else if (route === 'TIMELINE') {
                // Determine Intro or Outro based on object timing relative to loop boundaries
                const objStart = obj.startTime || 0;
                if (objStart >= loopEnd && outroDuration > 0) {
                    targetSegmentId = 'Outro';
                } else {
                    targetSegmentId = 'Intro';
                }
            } else if (route === 'VALIDATION_LAYER') {
                // Unsupported objects do not enter playback sequence
            }

            if (targetSegmentId && segments[targetSegmentId]) {
                segments[targetSegmentId].children.push(enrichedObj);
            }
        });

        // Add non-empty segments to graph, or structurally required segments
        if (segments['Intro'].duration > 0) graph.addSegment(segments['Intro']);
        graph.addSegment(segments['Loop']);
        graph.addSegment(segments['Loop Preview']);
        if (segments['Outro'].duration > 0) graph.addSegment(segments['Outro']);

        return graph;
    }
}

export const timelineComposer = new TimelineComposer();
