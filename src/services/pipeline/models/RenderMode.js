/**
 * RenderMode
 * Official enum for all possible execution modes of the Render Pipeline.
 */
export const RenderMode = Object.freeze({
    REALTIME_PREVIEW: 'RealtimePreview',
    OFFLINE_PREVIEW: 'OfflinePreview',
    FINAL_RENDER: 'FinalRender',
    BENCHMARK: 'Benchmark',
    UNIT_TEST: 'UnitTest'
});
