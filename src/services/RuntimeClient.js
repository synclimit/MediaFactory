export const emitRuntimeEvent = async (event, payload = {}) => {
    try {
        console.log(`[Runtime Client] Emit: ${event}`, payload);
        await fetch('/api/v1/system/runtime/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, payload })
        });
    } catch (e) {
        console.error("Runtime Event Failed:", e);
    }
};
