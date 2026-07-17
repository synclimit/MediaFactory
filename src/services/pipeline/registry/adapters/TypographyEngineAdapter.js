import { EngineAdapter } from '../EngineAdapter';
import { ExecutionResult } from '../../models/ExecutionResult';
import { ExecutionStatus } from '../../models/ExecutionStatus';
import TypographyEngine from '../../../typography/TypographyEngine';

export class TypographyEngineAdapter extends EngineAdapter {
    constructor() {
        super('TypographyEngine');
    }

    execute(context) {
        
        const frameInput = context.providers.get('frameInput');
        const inputs = frameInput ? frameInput.getInputs() : { textObjects: [] };
        
        const state = {};

        for (const config of inputs.textObjects) {
            const typographyData = TypographyEngine.normalize(config);
            state[config.id] = { typographyData };
        }
        
        return new ExecutionResult({
            status: ExecutionStatus.SUCCESS,
            state: state,
            metrics: {}
        });
    }

    defaultState() {
        return { activeFonts: [], textLayouts: {} };
    }

    reset() {
        if (TypographyEngine && typeof TypographyEngine.reset === 'function') {
            TypographyEngine.reset();
        }
    }

    getCapabilities() {
        return { provides: ['typographyLayouts'] };
    }
}
