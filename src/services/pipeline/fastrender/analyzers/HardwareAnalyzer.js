import { IAnalyzer } from '../interfaces/IAnalyzer.js';
import { HardwareProfile } from '../hardware/HardwareProfile.js';

export class HardwareAnalyzer extends IAnalyzer {
    constructor(hardwareProfile = null) {
        super();
        this.hardwareProfile = hardwareProfile || new HardwareProfile();
    }

    analyze(projectData) {
        return this.hardwareProfile.getProfile();
    }
}
