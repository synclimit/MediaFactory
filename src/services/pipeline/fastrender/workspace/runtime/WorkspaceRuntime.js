/**
 * WorkspaceRuntime.js
 * Dedicated Workspace Runtime abstraction for MediaFactory M3.
 * Manages rendering providers (Composer, Preview, Timeline, Inspector) and future extension points
 * (LoopProvider, ProceduralProvider, ValidationProvider) for active workspace modes.
 */

import { RenderingContext } from '../RenderingContext.js';
import { ComposerProvider } from '../providers/ComposerProvider.js';
import { PreviewProvider } from '../providers/PreviewProvider.js';
import { TimelineProvider } from '../providers/TimelineProvider.js';
import { InspectorProvider } from '../providers/InspectorProvider.js';

import { inactiveLoopProvider, activeFastLoopProvider } from '../extensions/LoopProvider.js';
import { inactiveProceduralProvider, activeFastProceduralProvider } from '../extensions/ProceduralProvider.js';
import { inactiveValidationProvider, activeFastValidationProvider } from '../extensions/ValidationProvider.js';

export class WorkspaceRuntime {
    /**
     * @param {string} mode - 'NORMAL' | 'FAST'
     * @param {Object} [extensionsOverride]
     */
    constructor(mode = 'NORMAL', extensionsOverride = {}) {
        this.mode = mode;
        this.isFastMode = mode === 'FAST';

        // Initialize Rendering Providers
        this.providers = {
            composer: new ComposerProvider(mode),
            preview: new PreviewProvider(mode),
            timeline: new TimelineProvider(mode),
            inspector: new InspectorProvider(mode)
        };

        // Initialize Extension Points
        this.extensions = {
            loopProvider: extensionsOverride.loopProvider || inactiveLoopProvider,
            proceduralProvider: extensionsOverride.proceduralProvider || inactiveProceduralProvider,
            validationProvider: extensionsOverride.validationProvider || inactiveValidationProvider
        };
    }

    /**
     * Get active workspace mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Get rendering providers
     */
    getProviders() {
        return this.providers;
    }

    /**
     * Get extension points
     */
    getExtensions() {
        return this.extensions;
    }

    /**
     * Create unified Rendering Context for component dependency injection
     * @param {Object} [projectState] 
     * @param {number} [currentTimeSec] 
     * @returns {RenderingContext}
     */
    createRenderingContext(projectState = null, currentTimeSec = 0) {
        return new RenderingContext({
            workspaceMode: this.mode,
            providers: this.providers,
            extensions: this.extensions,
            projectState,
            currentTimeSec
        });
    }
}

export class NormalWorkspaceRuntime extends WorkspaceRuntime {
    constructor() {
        super('NORMAL', {
            loopProvider: inactiveLoopProvider,
            proceduralProvider: inactiveProceduralProvider
        });
    }
}

export class FastWorkspaceRuntime extends WorkspaceRuntime {
    constructor() {
        super('FAST', {
            loopProvider: activeFastLoopProvider,
            proceduralProvider: activeFastProceduralProvider,
            validationProvider: activeFastValidationProvider
        });
    }
}
