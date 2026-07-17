class SubtitleLayoutEngine {
    static calculate(parsedSubtitles, config) {
        const maxWidth = config.width || 800;
        const bottomMargin = config.bottomMargin !== undefined ? config.bottomMargin : 50;
        
        return {
            subtitles: parsedSubtitles,
            metrics: {
                maxWidth,
                bottomMargin
            }
        };
    }
}

export default SubtitleLayoutEngine;
