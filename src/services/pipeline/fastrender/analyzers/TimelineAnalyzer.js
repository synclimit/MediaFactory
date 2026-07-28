import { IAnalyzer } from '../interfaces/IAnalyzer.js';
export class TimelineAnalyzer extends IAnalyzer {
    analyze(projectData) { return { durationMs: projectData.durationMs || 10000, cues: [] }; }
}
