class SubtitleCueEngine {
    static generateCues(subtitles) {
        if (!subtitles || !Array.isArray(subtitles)) return [];

        // Sort by start time to normalize ordering
        const sortedSubtitles = [...subtitles].sort((a, b) => a.start - b.start);

        return sortedSubtitles.map((sub, index) => {
            const start = sub.start || 0;
            const end = sub.end || 0;
            const duration = sub.duration || Math.max(0, end - start);

            return Object.freeze({
                id: `cue-${index}`,
                subtitleId: sub.id,
                start,
                end,
                duration,
                words: sub.words || [],
                active: false
            });
        });
    }
}

export default SubtitleCueEngine;
