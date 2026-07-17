/**
 * Official MediaFactory Architectural Layers
 * Defines the immutable boundaries and responsibilities of the system.
 */

export const Layers = Object.freeze({
    ARCHITECTURE_GOVERNANCE: {
        id: 'ARCHITECTURE_GOVERNANCE',
        name: 'Architecture Governance',
        description: 'Permanent architectural constraints and validation rules.',
        allowedDependencies: [], // Does not depend on engine systems
        forbiddenDependencies: ['*'] 
    },
    CORE_INFRASTRUCTURE: {
        id: 'CORE_INFRASTRUCTURE',
        name: 'Core Infrastructure',
        description: 'Permanent base of every subsystem (Asset Graph, DI, Event Bus, Scheduler, etc).',
        allowedDependencies: ['ARCHITECTURE_GOVERNANCE'],
        forbiddenDependencies: ['ENGINE_CORE', 'COMPILER', 'RUNTIME', 'RENDERER', 'EDITOR', 'EFFECTS']
    },
    ENGINE_CORE: {
        id: 'ENGINE_CORE',
        name: 'Engine Core',
        description: 'Configuration, Feature Flags, Service Locator, Module Loader.',
        allowedDependencies: ['CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['COMPILER', 'RUNTIME', 'RENDERER', 'EDITOR', 'EFFECTS']
    },
    COMPILER: {
        id: 'COMPILER',
        name: 'Compiler',
        description: 'Compiles descriptors, graphs, and resources into runtime structures.',
        allowedDependencies: ['ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['RUNTIME', 'RENDERER', 'EDITOR'] // Compiler must not depend on Runtime, it generates for Runtime
    },
    RUNTIME: {
        id: 'RUNTIME',
        name: 'Runtime',
        description: 'Execution logic that consumes compiled artifacts only.',
        allowedDependencies: ['ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['COMPILER', 'EDITOR', 'RENDERER'] // Runtime doesn't render, just computes state
    },
    PRESENTATION: {
        id: 'PRESENTATION',
        name: 'Presentation',
        description: 'Bridges Runtime state to Renderers (Composition).',
        allowedDependencies: ['RUNTIME', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['EDITOR', 'COMPILER']
    },
    RENDERER: {
        id: 'RENDERER',
        name: 'Renderer',
        description: 'Renders VisualFrames produced by Presentation.',
        allowedDependencies: ['PRESENTATION', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['COMPILER', 'EDITOR', 'EFFECTS', 'RUNTIME'] // Renderer consumes only VisualFrame from Presentation
    },
    VISUAL_EFFECTS: {
        id: 'VISUAL_EFFECTS',
        name: 'Visual Effects',
        description: 'Implementations of specific effects producing immutable states.',
        allowedDependencies: ['RUNTIME', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['RENDERER', 'EDITOR', 'COMPILER']
    },
    ANIMATION: {
        id: 'ANIMATION',
        name: 'Animation',
        description: 'Keyframe tracks, curves, clips, and mixers.',
        allowedDependencies: ['RUNTIME', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['RENDERER', 'EDITOR']
    },
    AUDIO: {
        id: 'AUDIO',
        name: 'Audio',
        description: 'Audio playback and reactive analysis.',
        allowedDependencies: ['ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['VISUAL_EFFECTS', 'RENDERER', 'EDITOR']
    },
    EDITOR: {
        id: 'EDITOR',
        name: 'Editor',
        description: 'React-based UI for interacting with MediaFactory.',
        allowedDependencies: ['COMPILER', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['RENDERER_INTERNALS', 'RUNTIME_INTERNALS'] // Communicates through descriptors/EventBus
    },
    EXPORT: {
        id: 'EXPORT',
        name: 'Export',
        description: 'Offline rendering, video export, batch rendering.',
        allowedDependencies: ['RENDERER', 'PRESENTATION', 'RUNTIME', 'COMPILER', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['EDITOR']
    },
    AI: {
        id: 'AI',
        name: 'AI Integration',
        description: 'AI preset/effect/graph generation.',
        allowedDependencies: ['COMPILER', 'ENGINE_CORE', 'CORE_INFRASTRUCTURE'],
        forbiddenDependencies: ['RUNTIME', 'RENDERER']
    },
    DIAGNOSTICS: {
        id: 'DIAGNOSTICS',
        name: 'Diagnostics & Testing',
        description: 'Permanent testing infrastructure, snapshot and regression testing.',
        allowedDependencies: ['*'], // Can inspect anything for diagnostics
        forbiddenDependencies: []
    }
});
