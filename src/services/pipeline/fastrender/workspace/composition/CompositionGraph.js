/**
 * CompositionGraph.js
 * Canonical playback model for Fast Workspace (MF-1404).
 * Provides a queryable graph of timeline segments with rich metadata.
 */

export class CompositionGraph {
    constructor() {
        this.segments = [];
        this.segmentMap = new Map();
    }

    /**
     * Add a segment to the composition graph.
     * @param {Object} segmentData - Segment metadata
     * @param {string} segmentData.id - Unique ID
     * @param {string} segmentData.type - e.g., 'Intro', 'Loop', 'Outro', 'Loop Preview'
     * @param {number} segmentData.startTime
     * @param {number} segmentData.endTime
     * @param {number} segmentData.duration
     * @param {boolean} segmentData.loopable
     * @param {Array} [segmentData.children] - Routed objects in this segment
     * @param {Object} [segmentData.metadata] - Extra metadata
     */
    addSegment(segmentData) {
        const segment = {
            id: segmentData.id,
            type: segmentData.type,
            startTime: segmentData.startTime,
            endTime: segmentData.endTime,
            duration: segmentData.duration,
            loopable: segmentData.loopable,
            children: segmentData.children || [],
            metadata: segmentData.metadata || {}
        };
        this.segments.push(segment);
        this.segmentMap.set(segment.id, segment);
        
        // Sort by start time to maintain playback order
        this.segments.sort((a, b) => a.startTime - b.startTime);
    }

    /**
     * Get a segment by its ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getSegmentById(id) {
        return this.segmentMap.get(id) || null;
    }

    /**
     * Get the segment corresponding to a specific timecode.
     * Overlapping segments prioritize Loop over Intro/Outro.
     * @param {number} timeSec 
     * @returns {Object|null}
     */
    getSegmentAtTime(timeSec) {
        // First check 'Loop' and 'Loop Preview' as they form the core
        const coreSegment = this.segments.find(s => 
            (s.type === 'Loop' || s.type === 'Loop Preview') && 
            timeSec >= s.startTime && timeSec <= s.endTime
        );
        if (coreSegment) return coreSegment;

        // Fallback to Intro/Outro
        return this.segments.find(s => timeSec >= s.startTime && timeSec <= s.endTime) || null;
    }

    /**
     * Get all ordered segments.
     * @returns {Array}
     */
    getSegments() {
        return this.segments;
    }
}
