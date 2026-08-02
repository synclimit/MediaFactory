/**
 * FFTCacheStrategy.js
 * Strategy interface placeholder for FFT Visualizers in Fast Workspace (MF-1403).
 */

import { ProceduralAdapter } from '../ProceduralAdapter.js';
import { AdaptationResult } from '../AdaptationResult.js';

export function generateDeterministicFFT(normalizedLoopTime = 0, barCount = 256) {
    const data = new Uint8Array(barCount);
    const tAngle = normalizedLoopTime * Math.PI * 2;

    for (let i = 0; i < barCount; i++) {
        const freqNorm = i / barCount;
        const barPhase = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
        const barSeed = barPhase - Math.floor(barPhase);
        
        const oct1 = Math.sin(tAngle * 3 + barSeed * 6.28);
        const oct2 = Math.cos(tAngle * 7 + freqNorm * 18.84 + barSeed * 3.14);
        const oct3 = Math.sin(tAngle * 13 + freqNorm * 31.42 + barSeed * 1.57);
        const oct4 = Math.cos(tAngle * 23 + freqNorm * 47.12);
        
        const spike = Math.pow(Math.max(0, Math.sin(tAngle * 19 + i * 3.14)), 8);
        const fastJitter = Math.sin(tAngle * 41 + i * 7.89) * 25;
        const envelope = Math.exp(-freqNorm * 2.2);
        
        const rawVal = (0.35 * oct1 + 0.3 * oct2 + 0.2 * oct3 + 0.15 * oct4 + 0.4 * spike) * envelope;
        const baseHeight = 35 + Math.abs(rawVal) * 190 + fastJitter;
        data[i] = Math.min(255, Math.max(15, Math.floor(baseHeight)));
    }
    return data;
}

export class FFTCacheStrategy extends ProceduralAdapter {
    constructor() {
        super('FFTCache');
    }

    supports(context) {
        return !!(context && context.object);
    }

    adapt(context) {
        const normTime = context?.normalizedLoopTime ?? 0;
        const barCount = context?.object?.barCount || 256;
        const fftData = generateDeterministicFFT(normTime, barCount);

        return new AdaptationResult({
            adaptedObject: {
                ...context.object,
                _fastModeAdapted: true,
                _adaptedStrategy: this.name,
                fftCacheActive: true,
                _fftData: fftData,
                _normalizedLoopTime: normTime
            },
            originalObject: context.object,
            strategyUsed: this.name,
            isAdapted: true,
            validationHints: {
                loopContinuity: 'Good',
                continuityOk: true,
                borderSafe: true,
                recommendedCheck: 'SpectrumCacheBoundary'
            }
        });
    }
}
