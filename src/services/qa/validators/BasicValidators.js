import { BeatEngineValidator } from './BeatEngineValidator.js';
import { ReactiveRuntimeValidator } from './ReactiveRuntimeValidator.js';
import { VisualRuntimeValidator } from './VisualRuntimeValidator.js';
import { RenderPipelineValidator } from './RenderPipelineValidator.js';
import { SubtitleValidator } from './SubtitleValidator.js';
import { WhisperValidator } from './WhisperValidator.js';
import { ExportValidator } from './ExportValidator.js';
import { EngineRegistry } from '../EngineRegistry.js';
import { BaseValidator } from '../BaseValidator.js';

EngineRegistry.register(BeatEngineValidator);
EngineRegistry.register(ReactiveRuntimeValidator);
EngineRegistry.register(VisualRuntimeValidator);
EngineRegistry.register(RenderPipelineValidator);
EngineRegistry.register(SubtitleValidator);
EngineRegistry.register(WhisperValidator);
EngineRegistry.register(ExportValidator);

// ProjectManagerValidator can remain generic for now since it's not prioritized in the sprint
class ProjectManagerValidator extends BaseValidator {
    static engineName = "ProjectManager";
    static category = "Core";
    static supportedModes = ['Quick', 'Standard', 'Production', 'Stress', 'Endurance', 'Monitor'];
}
EngineRegistry.register(ProjectManagerValidator);

export {
    BeatEngineValidator,
    ReactiveRuntimeValidator,
    VisualRuntimeValidator,
    RenderPipelineValidator,
    SubtitleValidator,
    WhisperValidator,
    ExportValidator,
    ProjectManagerValidator
};
