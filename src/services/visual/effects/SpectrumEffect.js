import { getSpectrumProfile } from './SpectrumProfiles.js';

/**
 * SpectrumEffect
 * 
 * Generates geometry parameters (bands, heights, peak, colorWeight) driven by the 
 * cached FFT spectrum from BeatEngine and modulated by AudioDrivenRuntime.
 * It NEVER performs FFT itself. Zero allocations inside update().
 */
export class SpectrumEffect {
    constructor(styleName = 'Classic') {
        this.style = getSpectrumProfile(styleName);

        this.bands = 64;
        this.peak = 0.0;
        this.colorWeight = 0.0;

        // Pre-allocated typed arrays to prevent GC
        this._heights = new Float32Array(this.bands);
        this._smoothedHeights = new Float32Array(this.bands);

        // Pre-allocated output structure
        this._output = {
            bands: this.bands,
            heights: this._smoothedHeights, // Reference, zero allocation
            peak: 0.0,
            colorWeight: 0.0
        };
    }

    setStyle(styleName) {
        this.style = getSpectrumProfile(styleName);
    }

    update(dt, audioDrivenState) {
        // Read CACHED array directly from AudioDrivenRuntime. No FFT is performed here.
        const rawSpectrum = audioDrivenState ? audioDrivenState.spectrum : null; 
        
        let localPeak = 0.0;

        // Copy offline decimated spectrum (already 64 bands)
        if (rawSpectrum && rawSpectrum.length === this.bands) {
            for (let i = 0; i < this.bands; i++) {
                this._heights[i] = rawSpectrum[i] || 0;
            }
        } else {
            // Decay to 0 if missing
            for (let i = 0; i < this.bands; i++) {
                this._heights[i] *= 0.8;
            }
        }

        // Apply Smoothing (EMA) and calculate peak
        const smooth = this.style.smoothingTimeConstant;
        const multiplier = this.style.heightMultiplier;

        for (let i = 0; i < this.bands; i++) {
            this._smoothedHeights[i] = (this._smoothedHeights[i] * smooth) + (this._heights[i] * multiplier * (1.0 - smooth));
            if (this._smoothedHeights[i] > localPeak) {
                localPeak = this._smoothedHeights[i];
            }
        }
        
        this.peak = localPeak;

        // Reactivity based on AudioDrivenRuntime
        if (audioDrivenState && audioDrivenState.musicalFeel) {
            const feel = audioDrivenState.musicalFeel;
            if (this.style.reactive) {
                this.colorWeight = Math.min(1.0, feel.energy + this.style.colorWeightBias + (audioDrivenState.impulse * 0.2));
            } else {
                this.colorWeight = Math.max(0.0, Math.min(1.0, feel.sustain + this.style.colorWeightBias));
            }
        }

        return this._getOutput();
    }

    _getOutput() {
        this._output.bands = this.bands;
        this._output.peak = this.peak;
        this._output.colorWeight = this.colorWeight;
        return this._output;
    }
}
