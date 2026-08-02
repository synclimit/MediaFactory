/**
 * ValidationEngine.js
 * Visual Validation Engine for MediaFactory M3 Fast Workspace (MF-1405).
 * Consumes existing CompositionGraph and AdaptationResult metadata directly.
 * Read-only, deterministic, with separation of structural & continuity validation.
 */

import { ValidationReport } from './ValidationReport.js';
import { VALIDATION_SEVERITY } from './ValidationSeverity.js';

export class ValidationEngine {
    /**
     * Perform complete read-only visual validation.
     * @param {import('../composition/CompositionGraph.js').CompositionGraph} compositionGraph 
     * @param {Array<import('../adaptation/AdaptationResult.js').AdaptationResult>} [adaptationResults]
     * @returns {ValidationReport}
     */
    validate(compositionGraph, adaptationResults = []) {
        if (!compositionGraph) {
            return new ValidationReport({
                score: 0,
                errors: [{
                    code: 'ERR_NO_COMPOSITION_GRAPH',
                    severity: VALIDATION_SEVERITY.BLOCKING,
                    message: 'Missing canonical CompositionGraph for validation',
                    segmentId: null,
                    objectId: null
                }],
                affectedSegments: [],
                affectedObjects: []
            });
        }

        const warnings = [];
        const errors = [];
        const affectedSegmentsSet = new Set();
        const affectedObjectsSet = new Set();
        const boundaryContinuityResults = [];

        // --- 1. Structural Validation ---
        this._performStructuralValidation(compositionGraph, {
            warnings,
            errors,
            affectedSegmentsSet,
            affectedObjectsSet
        });

        // --- 2. Adaptation & Visual Continuity Validation ---
        this._performAdaptationValidation(compositionGraph, adaptationResults, {
            warnings,
            errors,
            affectedSegmentsSet,
            affectedObjectsSet,
            boundaryContinuityResults
        });

        // --- 3. Deterministic Score Calculation ---
        let score = 100;
        for (const err of errors) {
            if (err.severity === VALIDATION_SEVERITY.BLOCKING) {
                score -= 35;
            } else if (err.severity === VALIDATION_SEVERITY.ERROR) {
                score -= 20;
            }
        }
        for (const warn of warnings) {
            if (warn.severity === VALIDATION_SEVERITY.WARNING) {
                score -= 5;
            }
        }
        score = Math.max(0, Math.min(100, score));

        return new ValidationReport({
            score,
            warnings,
            errors,
            affectedSegments: Array.from(affectedSegmentsSet).sort(),
            affectedObjects: Array.from(affectedObjectsSet).sort(),
            boundaryContinuityResults,
            timestamp: 0 // Explicitly constant to maintain determinism
        });
    }

    /**
     * Internal structural validation checks on CompositionGraph
     */
    _performStructuralValidation(compositionGraph, ctx) {
        const segments = compositionGraph.getSegments() || [];

        const loopSegment = segments.find(s => s.type === 'Loop');
        if (!loopSegment) {
            ctx.errors.push({
                code: 'STRUCTURAL_MISSING_LOOP_SEGMENT',
                severity: VALIDATION_SEVERITY.BLOCKING,
                message: 'CompositionGraph is missing required Loop segment (segment-loop)',
                segmentId: null,
                objectId: null
            });
        } else if (loopSegment.duration <= 0) {
            ctx.errors.push({
                code: 'STRUCTURAL_INVALID_LOOP_DURATION',
                severity: VALIDATION_SEVERITY.BLOCKING,
                message: `Loop segment (${loopSegment.id}) has non-positive duration: ${loopSegment.duration}`,
                segmentId: loopSegment.id,
                objectId: null
            });
            ctx.affectedSegmentsSet.add(loopSegment.id);
        }

        // Validate Segment Ordering & Gaps
        let previousEndTime = 0;
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];

            // Ignore parallel Loop Preview segment for timeline continuity calculations
            if (seg.type === 'Loop Preview') continue;

            if (seg.startTime < previousEndTime - 0.001) {
                ctx.errors.push({
                    code: 'STRUCTURAL_SEGMENT_OVERLAP',
                    severity: VALIDATION_SEVERITY.ERROR,
                    message: `Segment ${seg.id} overlaps previous segment (start: ${seg.startTime}, previous end: ${previousEndTime})`,
                    segmentId: seg.id,
                    objectId: null
                });
                ctx.affectedSegmentsSet.add(seg.id);
            } else if (seg.startTime > previousEndTime + 0.001 && i > 0) {
                ctx.warnings.push({
                    code: 'STRUCTURAL_TIMELINE_GAP',
                    severity: VALIDATION_SEVERITY.WARNING,
                    message: `Timeline gap detected before segment ${seg.id} (${previousEndTime}s to ${seg.startTime}s)`,
                    segmentId: seg.id,
                    objectId: null
                });
                ctx.affectedSegmentsSet.add(seg.id);
            }

            previousEndTime = Math.max(previousEndTime, seg.endTime);

            // Check children for unsupported or misrouted objects
            (seg.children || []).forEach(obj => {
                if (obj._composition && obj._composition.route === 'VALIDATION_LAYER') {
                    ctx.errors.push({
                        code: 'STRUCTURAL_UNSUPPORTED_OBJECT',
                        severity: VALIDATION_SEVERITY.ERROR,
                        message: `Object ${obj.id || obj.type} is unsupported in Fast Workspace`,
                        segmentId: seg.id,
                        objectId: String(obj.id || obj.type)
                    });
                    ctx.affectedSegmentsSet.add(seg.id);
                    if (obj.id) ctx.affectedObjectsSet.add(String(obj.id));
                }
            });
        }
    }

    /**
     * Internal adaptation & visual continuity validation checks
     */
    _performAdaptationValidation(compositionGraph, adaptationResults, ctx) {
        if (!Array.isArray(adaptationResults)) return;

        adaptationResults.forEach(res => {
            if (!res || !res.adaptedObject) return;

            const objectId = String(res.adaptedObject.id || res.originalObject?.id || 'unknown');
            const hints = res.validationHints || {};
            const warnings = res.warnings || [];

            // 1. Process explicit warnings from AdaptationResult
            warnings.forEach(msg => {
                ctx.warnings.push({
                    code: 'ADAPTATION_WARNING',
                    severity: VALIDATION_SEVERITY.WARNING,
                    message: `Adaptation warning for object ${objectId}: ${msg}`,
                    segmentId: 'segment-loop-preview',
                    objectId
                });
                ctx.affectedSegmentsSet.add('segment-loop-preview');
                ctx.affectedObjectsSet.add(objectId);
            });

            // 2. Check periodicity / boundary deviation hints
            const deviation = typeof hints.boundaryDeviation === 'number' 
                ? hints.boundaryDeviation 
                : (hints.periodicityError || 0);

            const tolerance = typeof hints.tolerance === 'number' ? hints.tolerance : 0.05;
            const passed = hints.continuityOk !== false && deviation <= tolerance;

            // Establish explicit loop-boundary visual validation contract
            const boundaryContract = {
                objectId,
                boundaryContinuity: {
                    startSample: hints.startSample !== undefined ? hints.startSample : null,
                    endSample: hints.endSample !== undefined ? hints.endSample : null,
                    deviation,
                    tolerance,
                    passed
                }
            };
            ctx.boundaryContinuityResults.push(boundaryContract);

            if (!passed) {
                const isBlocking = hints.criticalDiscontinuity === true;
                const severity = isBlocking ? VALIDATION_SEVERITY.BLOCKING : VALIDATION_SEVERITY.WARNING;

                const issueRecord = {
                    code: 'VISUAL_BOUNDARY_DISCONTINUITY',
                    severity,
                    message: `Loop boundary visual discontinuity detected for object ${objectId} (deviation: ${deviation.toFixed(3)}, tolerance: ${tolerance})`,
                    segmentId: 'segment-loop-preview',
                    objectId
                };

                if (severity === VALIDATION_SEVERITY.BLOCKING) {
                    ctx.errors.push(issueRecord);
                } else {
                    ctx.warnings.push(issueRecord);
                }

                ctx.affectedSegmentsSet.add('segment-loop-preview');
                ctx.affectedObjectsSet.add(objectId);
            }
        });
    }
}

export const validationEngine = new ValidationEngine();
