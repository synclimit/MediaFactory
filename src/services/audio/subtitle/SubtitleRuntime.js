/**
 * MF-500A: Subtitle Runtime
 * Lightweight, zero-allocation runtime for reading active subtitles.
 * Uses a pre-allocated shared state object for rendering.
 */
class SubtitleRuntime {
    constructor() {
        this.document = null;
        
        // Zero-allocation shared state object.
        // Renderer and Debugger read this object every frame.
        this.state = {
            activeSegment: null,
            currentWord: null,
            previousWord: null,
            nextWord: null,
            segmentIndex: -1,
            wordIndex: -1,
            language: "unknown",
            confidence: 0.0,
            
            style: "Classic",
            opacity: 1.0,
            offsetX: 0,
            offsetY: 0,
            
            layoutState: {
                lines: [],
                align: 'Bottom Center',
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            
            animationState: {
                phase: 'idle', // 'enter', 'active', 'exit'
                progress: 0.0
            },
            
            styleState: {
                displayLines: [] // preallocated objects for rendering lines
            },
            
            // Reserved for future systems
            currentStyle: "default",
            highlightIndex: -1,
            highlightWordId: null,
            characterIndex: -1,
            
            // Line tracking
            currentLineIndex: -1,
            currentLine: null,
            previousLine: null,
            nextLine: null
        };

        // Diagnostics
        this.diagnostics = {
            lookupTimeMicroseconds: 0,
            layoutTimeMicroseconds: 0,
            animationTimeMicroseconds: 0,
            playbackSpeed: 1.0,
            lastTimestamp: 0
        };
    }

    /**
     * Loads a SubtitleDocument into the runtime.
     * @param {import('./SubtitleModels').SubtitleDocument} doc 
     */
    setDocument(doc) {
        this.document = doc;
        this.state.language = doc ? doc.language : "unknown";
        this.resetState();
    }

    resetState() {
        this.state.activeSegment = null;
        this.state.currentWord = null;
        this.state.previousWord = null;
        this.state.nextWord = null;
        this.state.segmentIndex = -1;
        this.state.wordIndex = -1;
        this.state.confidence = 0.0;
        this.state.highlightIndex = -1;
        this.state.highlightWordId = null;
        this.state.characterIndex = -1;
        this.state.layoutState.lines.length = 0; // Zero allocation clear
        
        this.state.currentLineIndex = -1;
        this.state.currentLine = null;
        this.state.previousLine = null;
        this.state.nextLine = null;
    }

    /**
     * Updates the runtime state based on the current timestamp.
     * ZERO ALLOCATIONS. Uses binary search for segments.
     * @param {number} timestamp Current audio playback time in seconds
     * @param {number} playbackSpeed Current playback speed modifier
     */
    update(timestamp, playbackSpeed = 1.0) {
        if (!this.document || !this.document.segments || this.document.segments.length === 0) {
            return;
        }

        const t0 = performance.now();
        
        this.diagnostics.playbackSpeed = playbackSpeed;
        this.diagnostics.lastTimestamp = timestamp;

        // Binary Search for Segment
        let left = 0;
        let right = this.document.segments.length - 1;
        let foundSegmentIdx = -1;

        while (left <= right) {
            const mid = (left + right) >> 1; // Bitwise floor for speed
            const seg = this.document.segments[mid];

            if (timestamp >= seg.start && timestamp <= seg.end) {
                foundSegmentIdx = mid;
                break;
            } else if (timestamp < seg.start) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        if (foundSegmentIdx !== -1) {
            const segment = this.document.segments[foundSegmentIdx];
            this.state.activeSegment = segment;
            this.state.segmentIndex = foundSegmentIdx;
            
            // Linear search for word (typically < 20 words per segment, so linear is fast enough)
            let foundWordIdx = -1;
            if (segment.words && segment.words.length > 0) {
                for (let i = 0; i < segment.words.length; i++) {
                    const w = segment.words[i];
                    if (timestamp >= w.start && timestamp <= w.end) {
                        foundWordIdx = i;
                        break;
                    }
                }
            }

            if (foundWordIdx !== -1) {
                this.state.currentWord = segment.words[foundWordIdx];
                this.state.previousWord = foundWordIdx > 0 ? segment.words[foundWordIdx - 1] : null;
                this.state.nextWord = foundWordIdx < segment.words.length - 1 ? segment.words[foundWordIdx + 1] : null;
                this.state.wordIndex = foundWordIdx;
                this.state.highlightIndex = foundWordIdx;
                this.state.highlightWordId = this.state.currentWord.id || `${foundSegmentIdx}-${foundWordIdx}`;
                this.state.confidence = this.state.currentWord.probability;
            } else {
                this.state.currentWord = null;
                this.state.previousWord = null;
                this.state.nextWord = null;
                this.state.wordIndex = -1;
                this.state.highlightIndex = -1;
                this.state.highlightWordId = null;
                // If no active word but active segment, use segment probability derived from logprob/nospeech
                this.state.confidence = 1.0 - segment.noSpeechProb; 
            }

        } else {
            this.resetState();
        }

        const t1 = performance.now();
        // Convert milliseconds to microseconds for high-precision diagnostic
        this.diagnostics.lookupTimeMicroseconds = (t1 - t0) * 1000;
    }

    /**
     * Gets the shared read-only state.
     */
    getState() {
        return this.state;
    }

    /**
     * Gets diagnostic information.
     */
    getDiagnostics() {
        return this.diagnostics;
    }
}

export const subtitleRuntime = new SubtitleRuntime();
export default SubtitleRuntime;
