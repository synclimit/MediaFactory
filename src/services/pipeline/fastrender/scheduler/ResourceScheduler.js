export class ResourceScheduler {
    generateReference(layerId, segmentId) {
        return `res_ref_${layerId}_${segmentId}`;
    }
}
