export const RealtimeMode = Object.freeze({
    NONE: 'NONE',
    OPTIONAL: 'OPTIONAL',
    REQUIRED: 'REQUIRED'
});

export const RenderType = Object.freeze({
    PRERENDER: 'PRERENDER',
    TIMELINE: 'TIMELINE',
    COMPOSE: 'COMPOSE',
    REALTIME: 'REALTIME',
    POSTPROCESS: 'POSTPROCESS',
    AI: 'AI'
});

export const CacheMode = Object.freeze({
    NONE: 'NONE',
    OPTIONAL: 'OPTIONAL',
    REQUIRED: 'REQUIRED'
});

export const EncodeCost = Object.freeze({
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    EXTREME: 'EXTREME'
});

export const PreferredStrategy = Object.freeze({
    CACHE_FIRST: 'CACHE_FIRST',
    REUSE_MASTER: 'REUSE_MASTER',
    PRERENDER: 'PRERENDER',
    CONCAT: 'CONCAT',
    STREAM_COPY: 'STREAM_COPY',
    MINIMAL_ENCODE: 'MINIMAL_ENCODE',
    FULL_ENCODE: 'FULL_ENCODE'
});
