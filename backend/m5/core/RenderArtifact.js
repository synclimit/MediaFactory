const crypto = require('crypto');

class RenderArtifact {
    /**
     * Encapsulates the entire job footprint into one immutable object.
     */
    constructor(recipe, optimizationPlan, renderGraph, filterGraph, command, manifest, outputSettings, history, statistics, diagnostics) {
        this.id = crypto.randomUUID();
        this.recipe = recipe;
        this.optimizationPlan = optimizationPlan;
        this.renderGraph = renderGraph;
        this.filterGraph = filterGraph;
        this.command = command;
        this.manifest = manifest;
        this.outputSettings = outputSettings;
        this.history = history;
        this.statistics = statistics;
        this.diagnostics = diagnostics;
        
        // Generate a final checksum for the entire artifact
        this.checksum = this._generateChecksum();
        
        Object.freeze(this);
    }

    _generateChecksum() {
        const payload = JSON.stringify({
            recipeId: this.recipe?.recipeId,
            graphId: this.renderGraph?.id,
            command: this.command,
            manifestHash: this.manifest?.hash
        });
        return crypto.createHash('sha256').update(payload).digest('hex');
    }
}

module.exports = RenderArtifact;
