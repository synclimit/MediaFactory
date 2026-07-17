import { SubtitleDocument } from './SubtitleWorkspaceModel';

class SubtitleParser {
    static parse(input) {
        if (!input) return new SubtitleDocument();
        
        // Handling MF-206E: If input is a TranscriptContract
        if (input.header && input.header.schemaType === 'transcript_contract') {
            const doc = SubtitleDocument.fromTranscriptContract(input);
            // Normalize segments to ensure they have duration, id, etc.
            doc.segments = doc.segments.map((seg, i) => {
                const start = seg.start || 0;
                const end = seg.end || 0;
                return {
                    id: seg.id || `sub-${i}`,
                    text: seg.text || '',
                    start,
                    end,
                    duration: seg.duration !== undefined ? seg.duration : Math.max(0, end - start),
                    confidence: seg.confidence || 0,
                    words: seg.words || []
                };
            });
            return doc;
        }
        
        // Legacy Handling
        if (Array.isArray(input)) {
            const doc = new SubtitleDocument();
            doc.segments = input.map((sub, i) => {
                const id = typeof sub === 'string' ? `sub-${i}` : (sub.id || `sub-${i}`);
                const text = typeof sub === 'string' ? sub : (sub.text || '');
                const start = typeof sub === 'string' ? 0 : (sub.start || 0);
                const end = typeof sub === 'string' ? 0 : (sub.end || 0);
                const duration = typeof sub === 'string' ? 0 : (sub.duration || Math.max(0, end - start));
                
                let words = [];
                if (typeof sub !== 'string' && Array.isArray(sub.words)) {
                    words = sub.words.map((w, wIdx) => ({
                        id: w.id || `${id}-w-${wIdx}`,
                        text: w.text || '',
                        start: w.start !== undefined ? w.start : start,
                        end: w.end !== undefined ? w.end : end
                    }));
                } else if (text.trim().length > 0) {
                    // Generate pseudo-words if missing, for compatibility
                    const splitText = text.trim().split(/\s+/);
                    words = splitText.map((w, wIdx) => ({
                        id: `${id}-w-${wIdx}`,
                        text: w,
                        start: start,
                        end: end
                    }));
                }

                return {
                    id,
                    text,
                    start,
                    end,
                    duration,
                    words
                };
            });
            return doc;
        }
        
        return new SubtitleDocument();
    }
}

export default SubtitleParser;
