import { ExecutionStep } from './ExecutionStep';

/**
 * ExecutionPlan
 * An immutable object storing the topologically sorted order of ExecutionSteps.
 * RenderPipeline reads this plan to execute the adapters.
 */
export class ExecutionPlan {
    /**
     * @param {Array<ExecutionStep>} steps The ordered list of steps
     * @param {number} registryVersion The version of the registry when this plan was created
     */
    constructor(steps, registryVersion) {
        this.steps = Object.freeze([...steps]);
        this.registryVersion = registryVersion;
        Object.freeze(this);
    }
}
