/**
 * MF-500A: Subtitle Models
 * Immutable data models representing the Whisper JSON parsed transcript.
 */

export class SubtitleWord {
    /**
     * @param {Object} rawWord Raw word object from Whisper JSON
     */
    constructor(rawWord) {
        this.word = rawWord.word || rawWord.text || "";
        this.start = typeof rawWord.start === 'number' ? rawWord.start : 0;
        this.end = typeof rawWord.end === 'number' ? rawWord.end : 0;
        this.probability = typeof rawWord.probability === 'number' ? rawWord.probability : 1.0;
        Object.freeze(this);
    }
}

export class SubtitleSegment {
    /**
     * @param {Object} rawSegment Raw segment object from Whisper JSON
     */
    constructor(rawSegment) {
        this.id = typeof rawSegment.id === 'number' ? rawSegment.id : 0;
        this.seek = typeof rawSegment.seek === 'number' ? rawSegment.seek : 0;
        this.start = typeof rawSegment.start === 'number' ? rawSegment.start : 0;
        this.end = typeof rawSegment.end === 'number' ? rawSegment.end : 0;
        this.text = rawSegment.text || "";
        this.temperature = typeof rawSegment.temperature === 'number' ? rawSegment.temperature : 0.0;
        this.avgLogprob = typeof rawSegment.avg_logprob === 'number' ? rawSegment.avg_logprob : 0.0;
        this.compressionRatio = typeof rawSegment.compression_ratio === 'number' ? rawSegment.compression_ratio : 0.0;
        this.noSpeechProb = typeof rawSegment.no_speech_prob === 'number' ? rawSegment.no_speech_prob : 0.0;
        
        this.words = Array.isArray(rawSegment.words) 
            ? rawSegment.words.map(w => new SubtitleWord(w)) 
            : [];
            
        Object.freeze(this.words);
        Object.freeze(this);
    }
}

export class SubtitleDocument {
    /**
     * @param {Object} whisperJson Full Whisper JSON object
     */
    constructor(whisperJson) {
        this.text = whisperJson.text || "";
        this.language = whisperJson.language || "unknown";
        
        this.segments = Array.isArray(whisperJson.segments) 
            ? whisperJson.segments.map(s => new SubtitleSegment(s)) 
            : [];
            
        // Calculate duration based on the last segment's end time
        if (this.segments.length > 0) {
            this.duration = this.segments[this.segments.length - 1].end;
        } else {
            this.duration = whisperJson.duration || 0;
        }
        
        Object.freeze(this.segments);
        Object.freeze(this);
    }
}
