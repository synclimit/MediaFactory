import { PipelineKernel } from '../pipeline/PipelineKernel.js';
import { PipelineBuilder } from '../pipeline/PipelineBuilder.js';
import { PipelineOptimizer } from '../pipeline/PipelineOptimizer.js';
import { PipelineValidator } from '../pipeline/PipelineValidator.js';

export class PipelineFactory {
    static createPipeline() {
        return new PipelineKernel(
            new PipelineBuilder(new PipelineOptimizer(), new PipelineValidator())
        );
    }
}
