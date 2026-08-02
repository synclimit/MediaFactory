/**
 * RenderingContext.js
 * Unified Rendering Context passed to all editor components (Composer, Preview, Timeline, Inspector).
 * Eliminates scattered `if (fastMode)` condition checks across components by providing 
 * clean dependency-injected workspace providers, extension points, and capability flags.
 */

import { loopCapabilityRegistry } from './registry/LoopCapabilityRegistry.js';
import { timelineComposer } from './composition/TimelineComposer.js';
import { timelineRouter } from './composition/TimelineRouter.js';

export class RenderingContext {
    /**
     * @param {Object} config
     * @param {string} config.workspaceMode - 'NORMAL' | 'FAST'
     * @param {Object} config.providers - { composer, preview, timeline, inspector }
     * @param {Object} config.extensions - { loopProvider, proceduralProvider, validationProvider }
     * @param {Object} [config.projectState] - Current project state reference
     * @param {number} [config.currentTimeSec] - Current timecode in seconds
     */
    constructor(config = {}) {
        this.workspaceMode = config.workspaceMode || 'NORMAL';
        this.isFastWorkspace = this.workspaceMode === 'FAST';
        
        this.providers = {
            composer: config.providers?.composer || null,
            preview: config.providers?.preview || null,
            timeline: config.providers?.timeline || null,
            inspector: config.providers?.inspector || null
        };

        this.extensions = {
            loopProvider: config.extensions?.loopProvider || null,
            proceduralProvider: config.extensions?.proceduralProvider || null,
            validationProvider: config.extensions?.validationProvider || null
        };

        this.projectState = config.projectState || null;
        this.currentTimeSec = config.currentTimeSec || 0;
        this.timestamp = Date.now();

        // Initialize Composition Graph for Fast Workspace
        this.compositionGraph = null;
        if (this.isFastWorkspace && this.projectState) {
            const loopProv = this.getExtension('loopProvider');
            const overlayData = loopProv && typeof loopProv.getTimelineOverlayData === 'function' 
                ? loopProv.getTimelineOverlayData() 
                : null;
            this.compositionGraph = timelineComposer.compose(this.projectState, overlayData);
        }

        this.cachedValidationReport = null;
    }

    /**
     * Access specific provider
     * @param {'composer' | 'preview' | 'timeline' | 'inspector'} name 
     */
    getProvider(name) {
        return this.providers[name] || null;
    }

    /**
     * Access specific extension point placeholder
     * @param {'loopProvider' | 'proceduralProvider' | 'validationProvider'} name 
     */
    getExtension(name) {
        return this.extensions[name] || null;
    }

    /**
     * Get mapped playback timecode indicator for active workspace mode
     * @param {number} [timeSec]
     */
    getMappedTime(timeSec = this.currentTimeSec) {
        const loopProv = this.getExtension('loopProvider');
        if (loopProv && typeof loopProv.mapPreviewTime === 'function') {
            return loopProv.mapPreviewTime(timeSec);
        }
        return {
            mappedPlaybackTime: timeSec,
            formattedTime: String(timeSec),
            isPreBoundary: false,
            isPostBoundary: false,
            isInPreviewWindow: false,
            progressPercent: 0
        };
    }

    /**
     * Get Loop Preview state overlay data
     */
    getLoopPreviewState() {
        const loopProv = this.getExtension('loopProvider');
        return loopProv && typeof loopProv.getTimelineOverlayData === 'function' 
            ? loopProv.getTimelineOverlayData() 
            : null;
    }

    /**
     * Get Boundary Step Mode controls
     */
    getBoundaryStepControls() {
        const loopProv = this.getExtension('loopProvider');
        return loopProv && typeof loopProv.getBoundaryStepControls === 'function' 
            ? loopProv.getBoundaryStepControls() 
            : null;
    }

    /**
     * Get rich feature classification metadata for Fast Workspace
     * @param {string|Object} presetIdOrType 
     * @returns {Object} Rich classification record
     */
    getFeatureClassification(presetIdOrType) {
        return loopCapabilityRegistry.getClassification(presetIdOrType);
    }

    /**
     * Get the active CompositionGraph for Fast Workspace playback.
     */
    getCompositionGraph() {
        return this.compositionGraph;
    }

    /**
     * Get the current playback segment at the specified time.
     * @param {number} [timeSec] 
     */
    getCurrentSegment(timeSec = this.currentTimeSec) {
        if (!this.compositionGraph) return null;
        return this.compositionGraph.getSegmentAtTime(timeSec);
    }

    /**
     * Route an object through the Timeline Router.
     * @param {Object} object 
     */
    routeObject(object) {
        return timelineRouter.routeObject(object);
    }

    /**
     * Validate project visual quality using the active validationProvider extension.
     * UI -> RenderingContext -> FastValidationProvider -> ValidationEngine -> CompositionGraph + AdaptationResult -> ValidationReport
     * @param {Array} [adaptationResults] 
     * @returns {import('./validation/ValidationReport.js').ValidationReport}
     */
    validateProject(adaptationResults = []) {
        const valProv = this.getExtension('validationProvider');
        if (valProv && typeof valProv.validate === 'function') {
            this.cachedValidationReport = valProv.validate(this.compositionGraph, adaptationResults);
            return this.cachedValidationReport;
        }
        return null;
    }

    /**
     * Get the cached ValidationReport or run validation if not yet cached.
     * @returns {import('./validation/ValidationReport.js').ValidationReport|null}
     */
    getValidationReport() {
        if (!this.cachedValidationReport) {
            return this.validateProject([]);
        }
        return this.cachedValidationReport;
    }

    /**
     * WYSIWYG UI Gateway: Process visual objects for live preview.
     * In Fast Workspace, adapts objects procedurally and formats composer layer metadata.
     * In Normal Workspace, returns objects as-is (pass-through).
     * @param {Array} [objects] 
     * @param {number} [timeSec] 
     * @returns {Array} Processed visual objects ready for live canvas preview
     */
    getPreviewObjects(objects = this.projectState?.m3Objects || [], timeSec = this.currentTimeSec) {
        if (!Array.isArray(objects)) return [];
        if (!this.isFastWorkspace) return objects;

        const loopProv = this.getExtension('loopProvider');
        const masterLoopDuration = loopProv && typeof loopProv.getLoopDuration === 'function' && loopProv.getLoopDuration()
            ? loopProv.getLoopDuration()
            : 10.0;

        const adapted = this.adaptProjectObjects(objects, timeSec, masterLoopDuration);
        const composerProv = this.getProvider('composer');
        return composerProv ? composerProv.processComposition(adapted) : adapted;
    }

    /**
     * UI Gateway: Get inspection validation summary for a specific object.
     * @param {Object} object 
     * @returns {Object} Inspection validation metadata
     */
    getInspectorValidationSummary(object) {
        if (!object) return { supported: true, mode: this.workspaceMode };
        
        const classification = this.getFeatureClassification(object);
        const report = this.getValidationReport();
        const objectId = String(object.id || object.type || '');

        const objectErrors = report ? report.errors.filter(e => e.objectId === objectId) : [];
        const objectWarnings = report ? report.warnings.filter(w => w.objectId === objectId) : [];
        const boundaryResult = report ? report.boundaryContinuityResults.find(b => b.objectId === objectId) : null;

        const isSuspended = !this.isFastWorkspace ? false : (object.fastModeSuspended || classification.classification === 'Unsupported');

        return {
            mode: this.workspaceMode,
            isFastWorkspace: this.isFastWorkspace,
            supported: !isSuspended,
            isSuspended,
            classification,
            hasErrors: objectErrors.length > 0,
            hasWarnings: objectWarnings.length > 0,
            errors: objectErrors,
            warnings: objectWarnings,
            boundaryStatus: boundaryResult ? boundaryResult.boundaryContinuity : null,
            badge: isSuspended 
                ? '⚡ SUSPENDED IN FAST MODE' 
                : (this.isFastWorkspace ? `⚡ CLASSIFICATION: ${classification.classification.toUpperCase()}` : null),
            reason: isSuspended ? (classification.unsupportedReason || 'Unsupported in Fast Workspace') : null
        };
    }

    /**
     * UI Gateway: Get timeline composition summary for timeline panel visualization.
     * @returns {Object} Timeline composition summary
     */
    getTimelineCompositionSummary() {
        const graph = this.getCompositionGraph();
        const report = this.getValidationReport();
        const segments = graph ? graph.getSegments() : [];
        const activeSegment = this.getCurrentSegment();

        return {
            mode: this.workspaceMode,
            isFastWorkspace: this.isFastWorkspace,
            hasGraph: !!graph,
            segments,
            activeSegment,
            score: report ? report.score : 100,
            isValid: report ? report.isValid : true,
            statusLabel: this.isFastWorkspace 
                ? `Fast Workspace Timeline (${report ? report.score : 100}% Valid)` 
                : 'Normal Timeline',
            accentColor: this.isFastWorkspace ? '#f97316' : '#2563eb'
        };
    }

    /**
     * UI Gateway: Get boundary visual validation feedback for workspace indicators.
     * @returns {Object} Boundary feedback metadata
     */
    getBoundaryValidationFeedback() {
        const report = this.getValidationReport();
        return {
            isValid: report ? report.isValid : true,
            score: report ? report.score : 100,
            warningsCount: report ? report.warnings.length : 0,
            errorsCount: report ? report.errors.length : 0,
            boundaryResults: report ? report.boundaryContinuityResults : [],
            affectedSegments: report ? report.affectedSegments : [],
            affectedObjects: report ? report.affectedObjects : []
        };
    }

    /**
     * Adapt single visual object using active procedural provider
     * @param {Object} object 
     * @param {number} [timeSec] 
     * @param {number} [masterLoopDuration] 
     * @param {number} [seed] 
     */
    adaptObject(object, timeSec = this.currentTimeSec, masterLoopDuration = 10.0, seed = 1337) {
        if (!object) {
            return {
                adaptedObject: object,
                originalObject: object,
                strategyUsed: 'PassThrough',
                isAdapted: false
            };
        }
        const procProv = this.getExtension('proceduralProvider');
        if (procProv && typeof procProv.adaptObject === 'function') {
            return procProv.adaptObject(object, timeSec, masterLoopDuration, seed, this);
        }
        return {
            adaptedObject: object,
            originalObject: object,
            strategyUsed: 'PassThrough',
            isAdapted: false
        };
    }

    /**
     * Adapt array of project objects using active procedural provider
     * @param {Array} objects 
     * @param {number} [timeSec] 
     * @param {number} [masterLoopDuration] 
     * @param {number} [seed] 
     */
    adaptProjectObjects(objects = [], timeSec = this.currentTimeSec, masterLoopDuration = 10.0, seed = 1337) {
        if (!Array.isArray(objects)) return [];
        return objects.map(obj => this.adaptObject(obj, timeSec, masterLoopDuration, seed).adaptedObject);
    }

    /**
     * Create an updated clone of this context with modified timecode or state
     */
    withTime(timeSec) {
        return new RenderingContext({
            workspaceMode: this.workspaceMode,
            providers: this.providers,
            extensions: this.extensions,
            projectState: this.projectState,
            currentTimeSec: timeSec
        });
    }

    /**
     * Create an updated clone of this context with modified project state
     */
    withState(projectState) {
        return new RenderingContext({
            workspaceMode: this.workspaceMode,
            providers: this.providers,
            extensions: this.extensions,
            projectState: projectState,
            currentTimeSec: this.currentTimeSec
        });
    }
}
