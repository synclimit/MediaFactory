/**
 * MF-206E: Subtitle Workspace
 * 
 * Defines the editable layer on top of TranscriptContract.
 * This model ensures that the original TranscriptContract remains immutable.
 * All user edits, timing overrides, and style adjustments are recorded here 
 * to generate the final SubtitleDocument consumed by the Subtitle Engine.
 */

/**
 * Represents the final structured document consumed by Subtitle Engine.
 * Modifiable by the user without altering the original TranscriptContract.
 */
export class SubtitleDocument {
    constructor() {
        this.segments = [];         // Array of edited or finalized subtitle segments
        this.words = [];            // Optional granular word-level edits (for karaoke, highlight)
        this.styleReferences = {};  // Global or local style overrides (colors, fonts, positions)
        this.timingOverrides = {};  // Specific time adjustments (shift, offset)
    }

    /**
     * Helper to initialize or clone from a pristine TranscriptContract
     * without mutating it.
     * @param {Object} transcriptContract - The original TranscriptContract object
     */
    static fromTranscriptContract(transcriptContract) {
        const doc = new SubtitleDocument();
        if (transcriptContract) {
            // Deep clone segments and words to prevent mutation of the original contract
            doc.segments = JSON.parse(JSON.stringify(transcriptContract.segments || []));
            doc.words = JSON.parse(JSON.stringify(transcriptContract.words || []));
        }
        return doc;
    }
}

/**
 * Represents a user session or persistent workspace for editing subtitles.
 */
export class SubtitleWorkspace {
    /**
     * @param {string} workspaceId - Unique ID for this workspace session
     * @param {string} transcriptId - The ID/Hash linking to the pristine TranscriptContract
     */
    constructor(workspaceId = "default-ws", transcriptId = null) {
        this.workspaceId = workspaceId;
        this.transcriptId = transcriptId;
        this.subtitleDocument = new SubtitleDocument();
        
        // Auxiliary metadata regarding the workspace (e.g., last edited time, editor version)
        this.metadata = {
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        // Placeholder for Undo/Redo logic in future sprints
        this.history = {
            past: [],
            future: []
        };
    }
}

export default {
    SubtitleDocument,
    SubtitleWorkspace
};
