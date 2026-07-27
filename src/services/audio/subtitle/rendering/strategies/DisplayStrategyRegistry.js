/**
 * Subtitle Display Modes V2 - Data Models
 * 
 * @typedef {Object} SubtitleWord
 * @property {number} index
 * @property {string} text
 * @property {number} start
 * @property {number} end
 * 
 * @typedef {Object} SubtitleLine
 * @property {number} lineIndex
 * @property {string} text
 * @property {SubtitleWord[]} words
 * 
 * @typedef {Object} SubtitleFrame
 * @property {string} segmentId
 * @property {number} start
 * @property {number} end
 * @property {string} text
 * @property {SubtitleLine[]} lines
 * 
 * @typedef {Object} RenderContext
 * @property {number} currentTime
 * @property {number} canvasWidth
 * @property {number} canvasHeight
 * @property {SubtitleFrame} subtitle
 * @property {Object} style
 * @property {Object} animation
 * @property {Object} settings
 * 
 * @typedef {Object} RenderInstruction
 * @property {Object[]} displayLines - The lines to render, containing text/words and layout info
 * @property {Object[]} highlightedWords - Optional specific word highlights
 * @property {number} offsetX - Global offset X
 * @property {number} offsetY - Global offset Y
 * @property {number} opacity - Global opacity
 * @property {number} visibleCharacters - For typewriter effects
 */

/**
 * Base Strategy Interface
 */
export class DisplayStrategy {
    /**
     * MUST be stateless. MUST be pure.
     * @param {RenderContext} context 
     * @returns {RenderInstruction}
     */
    static render(context) {
        throw new Error('Not implemented');
    }
}

/**
 * Registry for all Display Strategies
 */
export const DisplayStrategyRegistry = {
    _strategies: new Map(),

    register(name, strategyClass) {
        this._strategies.set(name, strategyClass);
    },

    get(name) {
        return this._strategies.get(name) || this._strategies.get('Static');
    }
};
