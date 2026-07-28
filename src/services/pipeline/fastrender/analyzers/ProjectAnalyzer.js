import { IAnalyzer } from '../interfaces/IAnalyzer.js';
export class ProjectAnalyzer extends IAnalyzer {
    analyze(projectData) { return { resolution: '1080p', fps: 60 }; }
}
