import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import PlaylistLayoutEngine from '../../../playlist/PlaylistLayoutEngine';
import PlaylistTransformEngine from '../../../playlist/PlaylistTransformEngine';
import TypographyEngine from '../../../typography/TypographyEngine';

export class PlaylistEngineAdapter extends EngineAdapter {
    constructor() {
        super('PlaylistEngine');
    }

    execute(context) {
        
        const frameInput = context.providers.get('frameInput');
        const inputs = frameInput ? frameInput.getInputs() : { playlistObjects: [] };
        
        const state = {};

        for (const config of inputs.playlistObjects) {
            const tracksToRender = config.tracks || ['Track 01', 'Track 02', 'Track 03', 'Track 04'];
            const layoutData = PlaylistLayoutEngine.calculate(tracksToRender, config);
            const transformData = PlaylistTransformEngine.calculate(layoutData, config);
            const typographyData = TypographyEngine.normalize(config);
            
            state[config.id] = {
                layoutData,
                transformData,
                typographyData
            };
        }
        
        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });
    }

    defaultState() {
        return { tracks: [], currentTrackIndex: -1 };
    }

    reset() {
        if (PlaylistLayoutEngine && typeof PlaylistLayoutEngine.reset === 'function') {
            PlaylistLayoutEngine.reset();
        }
    }

    getCapabilities() {
        return { provides: ['playlistState'] };
    }
}
