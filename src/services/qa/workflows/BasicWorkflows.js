import { WorkflowRegistry } from '../WorkflowRegistry.js';
import { PlaylistCreationWorkflow } from './PlaylistCreationWorkflow.js';
import { SubtitleWorkflow } from './SubtitleWorkflow.js';
import { VisualReactiveWorkflow } from './VisualReactiveWorkflow.js';
import { ExportWorkflow } from './ExportWorkflow.js';
import { ProjectWorkflow } from './ProjectWorkflow.js';

WorkflowRegistry.register(PlaylistCreationWorkflow);
WorkflowRegistry.register(SubtitleWorkflow);
WorkflowRegistry.register(VisualReactiveWorkflow);
WorkflowRegistry.register(ExportWorkflow);
WorkflowRegistry.register(ProjectWorkflow);
