import { BaseStrategy } from './BaseStrategy.js';
import { PreferredStrategy } from '../contracts/Enums.js';

export class HardwareEncodeStrategy extends BaseStrategy {
    constructor() {
        super(PreferredStrategy.MINIMAL_ENCODE, 500);
    }

    isApplicable(descriptors, runtimeContext, hardwareProfile, projectContext) {
        const hw = hardwareProfile.getProfile();
        // Applicable if hardware has HW encoder and any feature needs full encoding
        return hw.hasHwEncoder && descriptors.some(d => d.capability.requiresFullEncode || d.capability.requiresBeatEngine);
    }

    buildExecutionPlan(descriptors, runtimeContext, hardwareProfile, projectContext) {
        const hw = hardwareProfile.getProfile();
        const encoder = hw.supportedEncoders[0] || 'h264_nvenc';
        return {
            type: this.name,
            explanation: `Features require full rendering. Acceleration enabled via Hardware Encoder (${encoder}).`,
            stages: ['PrepareAudio', 'GPUFrameGeneration', 'HardwareEncode', 'Export']
        };
    }
}
