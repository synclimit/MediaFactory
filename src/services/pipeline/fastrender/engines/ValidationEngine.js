import { IValidationEngine } from '../interfaces/IEngines.js';
import { ValidationResult } from '../contracts/Descriptors.js';
export class ValidationEngine extends IValidationEngine {
    verify(renderPlan) {
        if (!renderPlan.segments || renderPlan.segments.length === 0) {
            return new ValidationResult(false, 'FATAL_ERROR', [], ['No segments found in plan.']);
        }
        if (renderPlan.totalDurationMs <= 0) {
            return new ValidationResult(false, 'FATAL_ERROR', [], ['Invalid total duration.']);
        }
        return new ValidationResult(true, 'SUCCESS', [], []);
    }
}
