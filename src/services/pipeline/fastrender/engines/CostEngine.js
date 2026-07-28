import { EncodeCost, RealtimeMode } from '../contracts/Enums.js';

export class CostEngine {
    constructor(weights = {}) {
        this.weights = {
            cpuWeight: weights.cpuWeight ?? 1.0,
            gpuWeight: weights.gpuWeight ?? 1.2,
            ramWeight: weights.ramWeight ?? 0.8,
            ioWeight: weights.ioWeight ?? 0.5,
            encodingWeight: weights.encodingWeight ?? 1.5
        };
    }

    setWeights(newWeights) {
        this.weights = { ...this.weights, ...newWeights };
    }

    calculateFeatureCost(descriptor, hardwareProfile, projectContext) {
        const hw = hardwareProfile.getProfile();
        const durationSec = (projectContext?.data?.durationMs || 10000) / 1000;
        const projectSizeFactor = Math.max(0.5, durationSec / 10);

        // Encode Cost Rating
        let rawEncodeCost = 10;
        switch (descriptor.capability.encodeCost) {
            case EncodeCost.EXTREME: rawEncodeCost = 100; break;
            case EncodeCost.HIGH: rawEncodeCost = 50; break;
            case EncodeCost.MEDIUM: rawEncodeCost = 25; break;
            case EncodeCost.LOW: default: rawEncodeCost = 10; break;
        }

        // Hardware Capacities
        const cpuMultiplier = Math.max(0.3, 8 / Math.max(1, hw.cpuCores));
        const gpuMultiplier = hw.hasHwEncoder ? 0.4 : 2.5; // High penalty on software-only GPU tasks
        const ramMultiplier = Math.max(0.5, 16384 / Math.max(1024, hw.ramMb));

        const cpuComponent = descriptor.cost.cpuCost * cpuMultiplier * this.weights.cpuWeight;
        const gpuComponent = descriptor.cost.gpuCost * gpuMultiplier * this.weights.gpuWeight;
        const ramComponent = descriptor.cost.ramCost * ramMultiplier * this.weights.ramWeight;
        const ioComponent = descriptor.cost.diskIoCost * this.weights.ioWeight;
        const encodeComponent = rawEncodeCost * (hw.hasHwEncoder ? 0.5 : 1.5) * this.weights.encodingWeight;

        const baseRuntimeCost = (cpuComponent + gpuComponent + ramComponent + ioComponent + encodeComponent) * projectSizeFactor;

        // Penalty for required realtime mode without hardware acceleration
        const realtimeMultiplier = descriptor.capability.realtimeMode === RealtimeMode.REQUIRED ? (hw.hasHwEncoder ? 1.2 : 3.0) : 1.0;

        return Math.round(baseRuntimeCost * realtimeMultiplier);
    }

    calculateTotalProjectCost(descriptors, hardwareProfile, projectContext) {
        let totalCost = 0;
        const breakdown = {};
        for (const desc of descriptors) {
            const cost = this.calculateFeatureCost(desc, hardwareProfile, projectContext);
            breakdown[desc.id] = cost;
            totalCost += cost;
        }
        return { totalCost, breakdown };
    }
}
