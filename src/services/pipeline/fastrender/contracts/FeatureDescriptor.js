import { RealtimeMode, RenderType, CacheMode, EncodeCost, PreferredStrategy } from './Enums.js';

export class FeatureDescriptor {
    constructor({
        id,
        name,
        category = 'general',
        schemaVersion = '2.0.0',
        featureVersion = '1.0.0',
        author = 'MediaFactory',
        plugin = false,
        capability = {},
        dependencies = [],
        lifecycle = {},
        cost = {},
        plannerHint = {}
    }) {
        if (!id) throw new Error("FeatureDescriptor requires a unique 'id'.");

        this.id = id;
        this.name = name || id;
        this.category = category;
        this.schemaVersion = schemaVersion;
        this.featureVersion = featureVersion;
        this.author = author;
        this.plugin = plugin;

        this.capability = Object.freeze({
            realtimeMode: capability.realtimeMode || RealtimeMode.NONE,
            renderType: capability.renderType || RenderType.TIMELINE,
            cacheMode: capability.cacheMode || CacheMode.OPTIONAL,
            encodeCost: capability.encodeCost || EncodeCost.LOW,
            requiresAudioAnalysis: Boolean(capability.requiresAudioAnalysis),
            requiresBeatEngine: Boolean(capability.requiresBeatEngine),
            requiresFullEncode: Boolean(capability.requiresFullEncode),
            canPrerender: Boolean(capability.canPrerender)
        });

        this.dependencies = Object.freeze([...(dependencies || [])]);

        this.lifecycle = Object.freeze({
            prepare: lifecycle.prepare || null,
            prerender: lifecycle.prerender || null,
            compose: lifecycle.compose || null,
            cleanup: lifecycle.cleanup || null
        });

        this.cost = Object.freeze({
            cpuCost: cost.cpuCost || 10,
            gpuCost: cost.gpuCost || 10,
            ramCost: cost.ramCost || 10,
            diskIoCost: cost.diskIoCost || 10
        });

        this.plannerHint = Object.freeze({
            preferredStrategy: plannerHint.preferredStrategy || PreferredStrategy.TIMELINE,
            priority: plannerHint.priority || 100
        });

        Object.freeze(this);
    }
}
