import { RenderCommandType } from '../contracts/RenderContracts.js';

export class CommandTranslator {
    translate(operationType) {
        switch (operationType) {
            case 'VIDEO_FILTER': return RenderCommandType.APPLY_VIDEO_FILTER;
            case 'AUDIO_FILTER': return RenderCommandType.APPLY_AUDIO_FILTER;
            case 'STREAM_COPY': return RenderCommandType.STREAM_COPY;
            case 'OVERLAY': return RenderCommandType.APPLY_OVERLAY;
            case 'SUBTITLE': return RenderCommandType.APPLY_SUBTITLE;
            case 'COLOR': return RenderCommandType.APPLY_COLOR;
            case 'CACHE_REUSE': return RenderCommandType.CACHE_REUSE;
            case 'ENCODE': return RenderCommandType.ENCODE;
            case 'CONCAT': return RenderCommandType.APPLY_VIDEO_FILTER;
            case 'PLAYLIST': return RenderCommandType.APPLY_VIDEO_FILTER;
            case 'LYRICS': return RenderCommandType.APPLY_SUBTITLE;
            case 'PARTICLE': return RenderCommandType.APPLY_OVERLAY;
            case 'VISUALIZER': return RenderCommandType.APPLY_VIDEO_FILTER;
            default:
                throw new Error(`Unknown operation type: ${operationType}`);
        }
    }
}
