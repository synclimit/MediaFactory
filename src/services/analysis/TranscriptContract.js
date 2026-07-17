/**
 * MF-206B: Transcript Contract
 * 
 * Defines the Transcript Contract, the official and universal blueprint 
 * for all transcription results within the MediaFactory ecosystem.
 */

export class TranscriptHeader {
    constructor(engineName = "Unknown", modelUsed = "Unknown", audioHash = "") {
        this.schemaVersion = "1.0.0";
        this.schemaType = "transcript_contract";
        this.engineName = engineName;
        this.modelUsed = modelUsed;
        this.audioHash = audioHash;
        this.createdAt = new Date().toISOString();
    }
}

export class TranscriptSummary {
    constructor() {
        this.duration = 0;
        this.segmentCount = 0;
        this.wordCount = 0;
        this.primaryLanguage = "unknown";
        this.overallConfidence = 0;
    }
}

export class TranscriptSegment {
    constructor(text = "", start = 0, end = 0, confidence = 0) {
        this.text = text;
        this.start = start;
        this.end = end;
        this.confidence = confidence;
    }
}

export class TranscriptWord {
    constructor(text = "", start = 0, end = 0, confidence = 0) {
        this.text = text;
        this.start = start;
        this.end = end;
        this.confidence = confidence;
    }
}

export class TranscriptAnalysis {
    constructor() {
        // Contextual and analytical metrics derived by the engine beyond raw text.
        this.vad = []; // Voice Activity Detection intervals
        this.diarization = []; // Speaker diarization info
        this.emotion = null;
    }
}

export class TranscriptMetadata {
    constructor() {
        // Additional auxiliary data required for routing, processing, or future extensibility
        this.rawOutput = null; 
    }
}

export class TranscriptContract {
    constructor(engineName = "Unknown", modelUsed = "Unknown", audioHash = "") {
        this.header = new TranscriptHeader(engineName, modelUsed, audioHash);
        this.summary = new TranscriptSummary();
        
        // Arrays to hold Segment and Word data
        this.segments = []; 
        this.words = []; 
        
        this.analysis = new TranscriptAnalysis();
        this.metadata = new TranscriptMetadata();
    }
}

export default {
    TranscriptHeader,
    TranscriptSummary,
    TranscriptSegment,
    TranscriptWord,
    TranscriptAnalysis,
    TranscriptMetadata,
    TranscriptContract
};
