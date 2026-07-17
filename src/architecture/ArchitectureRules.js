import { Layers } from './LayerDefinitions.js';
import { DependencyRules } from './DependencyRules.js';
import { NamingRules } from './NamingRules.js';
import { PackageBoundaries } from './PackageBoundaries.js';

/**
 * ArchitectureRules
 * The core validation engine for architectural governance.
 */
export class ArchitectureRules {
    static validateArchitecture() {
        const diagnostics = [];
        let isValid = true;

        // 1. Layer Integrity & Duplicate Definitions
        const layerIds = new Set();
        for (const [key, layer] of Object.entries(Layers)) {
            if (layerIds.has(layer.id)) {
                diagnostics.push(`Duplicate layer definition found: ${layer.id}`);
                isValid = false;
            }
            layerIds.add(layer.id);

            if (!layer.id || !layer.name || !layer.description) {
                diagnostics.push(`Layer ${key} is missing required fields (id, name, description).`);
                isValid = false;
            }
            if (!Array.isArray(layer.allowedDependencies) || !Array.isArray(layer.forbiddenDependencies)) {
                diagnostics.push(`Layer ${key} dependency arrays are malformed.`);
                isValid = false;
            }
        }

        // 2. Circular Layer References & Dependency Consistency
        for (const [key, layer] of Object.entries(Layers)) {
            // Check if allowedDependencies exist in Layers (excluding '*')
            for (const dep of layer.allowedDependencies) {
                if (dep !== '*' && !layerIds.has(dep)) {
                    diagnostics.push(`Layer ${layer.id} allows dependency on unknown layer: ${dep}`);
                    isValid = false;
                }
                // Check if a dependency is both allowed and forbidden
                if (layer.forbiddenDependencies.includes(dep) || layer.forbiddenDependencies.includes('*')) {
                    // if it's '*', it's a conflict unless handled correctly, but we consider explicit forbidden + allowed a conflict
                    if (layer.forbiddenDependencies.includes(dep)) {
                        diagnostics.push(`Layer ${layer.id} has contradictory dependency for: ${dep}`);
                        isValid = false;
                    }
                }
                
                // Very basic circular check (A allows B, and B allows A)
                // Note: Real circular checks require graph traversal. We do a simple one-step check here.
                if (dep !== '*' && Layers[dep] && Layers[dep].allowedDependencies.includes(layer.id)) {
                     // In some cases bidirectional is bad, but structurally we prefer acyclic. 
                     // We just flag it as a warning for now or error if strict.
                     // For architecture governance, we'll flag strict circular layer deps.
                     if (layer.id !== dep) {
                         diagnostics.push(`Circular layer dependency detected between ${layer.id} and ${dep}`);
                         isValid = false;
                     }
                }
            }
        }

        // 3. Rule Integrity (DependencyRules)
        const ruleIds = new Set();
        for (const rule of DependencyRules) {
            if (ruleIds.has(rule.id)) {
                diagnostics.push(`Duplicate rule definition found: ${rule.id}`);
                isValid = false;
            }
            ruleIds.add(rule.id);

            if (typeof rule.validate !== 'function') {
                diagnostics.push(`Rule ${rule.id} is missing a validate function.`);
                isValid = false;
            }
        }

        // 4. Package Boundaries Check
        if (!PackageBoundaries.packages || PackageBoundaries.packages.length === 0) {
            diagnostics.push('Package boundaries are empty or malformed.');
            isValid = false;
        }

        return {
            isValid,
            diagnostics
        };
    }
}
