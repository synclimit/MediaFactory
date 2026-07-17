/**
 * Permanent Dependency Rules
 * Enforces specific relationship constraints between layers and modules.
 */

export const DependencyRules = Object.freeze([
    {
        id: 'RULE_RUNTIME_ISOLATION',
        description: 'Runtime cannot import Editor',
        validate: (sourceLayer, targetLayer) => {
            if (sourceLayer === 'RUNTIME' && targetLayer === 'EDITOR') return false;
            return true;
        }
    },
    {
        id: 'RULE_RENDERER_ISOLATION',
        description: 'Renderer cannot import Runtime internals',
        validate: (sourceLayer, targetLayer) => {
            if (sourceLayer === 'RENDERER' && targetLayer === 'RUNTIME') return false;
            return true;
        }
    },
    {
        id: 'RULE_EFFECT_COMMUNICATION',
        description: 'Effects cannot communicate directly',
        validate: (sourceModule, targetModule) => {
            if (sourceModule.startsWith('effects/') && targetModule.startsWith('effects/') && sourceModule !== targetModule) {
                return false;
            }
            return true;
        }
    },
    {
        id: 'RULE_EDITOR_COMMUNICATION',
        description: 'Editor communicates only through descriptors',
        validate: (sourceLayer, targetModule) => {
            if (sourceLayer === 'EDITOR') {
                if (targetModule.includes('effects/') || targetModule.includes('runtime/')) {
                    if (!targetModule.includes('descriptors/')) {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    {
        id: 'RULE_RUNTIME_EXECUTION',
        description: 'Runtime executes compiled artifacts only',
        validate: (sourceLayer, targetModule) => {
            if (sourceLayer === 'RUNTIME') {
                if (targetModule.includes('descriptors/') && !targetModule.includes('compiled')) {
                    return false;
                }
            }
            return true;
        }
    },
    {
        id: 'RULE_COMPILER_ISOLATION',
        description: 'Compiler never executes per-frame logic',
        validate: (sourceLayer, targetModule) => {
            if (sourceLayer === 'COMPILER' && targetModule.includes('per-frame')) {
                return false;
            }
            return true;
        }
    }
]);
