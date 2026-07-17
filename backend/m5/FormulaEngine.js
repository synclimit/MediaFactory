const EngineResult = require('./core/EngineResult');
const Logger = require('./core/Logger');
const { PipelineError, ErrorCodes } = require('./core/Errors');
const Engine = require('./core/Engine');

class FormulaEngine extends Engine {
    /**
     * @param {PipelineContext} context 
     * @param {Object} job 
     */
    buildStory(context, job) {
        return this.run(context, 'FormulaEngine', () => {
            const formula = job.formula || 'generic_formula';
            
            if (formula === 'OVERLAY') {
                return {
                    formula: formula,
                    storySegments: [
                        { type: 'main', description: 'Main video runs continuously' }
                    ]
                };
            }

            return {
                formula: formula,
                storySegments: [
                    { type: 'hook', description: 'Initial hook to grab attention (0-2s)' },
                    { type: 'main', description: 'Core content intro (~10s)' },
                    { type: 'cta', description: 'Early CTA interruption (~2s at 10s mark)' },
                    { type: 'main', description: 'Core content continuation until finished' }
                ]
            };
        });
    }
}

module.exports = FormulaEngine;
