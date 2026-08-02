/**
 * ProceduralProvider.js
 * Extension point for Fast Workspace procedural effect adaptation (MF-1403).
 * Inactive in Normal Workspace; Active in Fast Workspace via FastProceduralProvider.
 */

import { adaptationDispatcher } from '../adaptation/AdaptationDispatcher.js';

export class ProceduralProvider {
    constructor() {
        this.isActive = false;
    }

    adaptObject(object) {
        return {
            adaptedObject: object,
            originalObject: object,
            strategyUsed: 'PassThrough',
            isAdapted: false
        };
    }

    evaluateProceduralEffect(effectId, timeSec) {
        return null;
    }

    getSeededNoise(seed, timeSec) {
        return null;
    }
}

export class FastProceduralProvider extends ProceduralProvider {
    /**
     * @param {import('../adaptation/AdaptationDispatcher.js').AdaptationDispatcher} [dispatcher]
     */
    constructor(dispatcher = adaptationDispatcher) {
        super();
        this.isActive = true;
        this.dispatcher = dispatcher;
    }

    adaptObject(object, timeSec = 0.0, masterLoopDuration = 10.0, seed = 1337, renderingContext = null) {
        return this.dispatcher.dispatch(object, timeSec, masterLoopDuration, seed, renderingContext);
    }
}

export const inactiveProceduralProvider = new ProceduralProvider();
export const activeFastProceduralProvider = new FastProceduralProvider();
