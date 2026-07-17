export class FFTProcessor {
    constructor() {
        this.config = {
            fftSize: 2048,
            hopSize: 512,
            sampleRate: 44100,
            windowFunction: 'hann'
        };
        this.windowCache = null;
    }

    initialize(config = {}) {
        this.config = { ...this.config, ...config };
        this.config.fftSize = Math.pow(2, Math.round(Math.log2(this.config.fftSize)));
        this._buildWindow();
    }

    _buildWindow() {
        const N = this.config.fftSize;
        this.windowCache = new Float32Array(N);
        const windowType = this.config.windowFunction || 'hann';
        
        for (let i = 0; i < N; i++) {
            if (windowType === 'hann') {
                this.windowCache[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
            } else if (windowType === 'hamming') {
                this.windowCache[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
            } else if (windowType === 'blackman') {
                this.windowCache[i] = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
            } else {
                this.windowCache[i] = 1.0;
            }
        }
    }

    _performFFT(real, imag, n) {
        let j = 0;
        for (let i = 0; i < n - 1; i++) {
            if (i < j) {
                let tr = real[j];
                let ti = imag[j];
                real[j] = real[i];
                imag[j] = imag[i];
                real[i] = tr;
                imag[i] = ti;
            }
            let k = n >> 1;
            while (k <= j) {
                j -= k;
                k >>= 1;
            }
            j += k;
        }

        for (let l = 2; l <= n; l <<= 1) {
            let halfL = l >> 1;
            let u1 = 1.0;
            let u2 = 0.0;
            let theta = -2.0 * Math.PI / l;
            let w1 = Math.cos(theta);
            let w2 = Math.sin(theta);

            for (let i = 0; i < halfL; i++) {
                for (let j = i; j < n; j += l) {
                    let j2 = j + halfL;
                    let t1 = u1 * real[j2] - u2 * imag[j2];
                    let t2 = u1 * imag[j2] + u2 * real[j2];
                    real[j2] = real[j] - t1;
                    imag[j2] = imag[j] - t2;
                    real[j] += t1;
                    imag[j] += t2;
                }
                let nextU1 = u1 * w1 - u2 * w2;
                let nextU2 = u1 * w2 + u2 * w1;
                u1 = nextU1;
                u2 = nextU2;
            }
        }
    }

    process(input) {
        const pcm = input.pcm || input;
        
        if (!pcm || pcm.length === 0) {
            return { frames: [] };
        }

        const { fftSize, hopSize, sampleRate } = this.config;
        const totalSamples = pcm.length;
        const frames = [];

        const real = new Float32Array(fftSize);
        const imag = new Float32Array(fftSize);

        const binCount = fftSize / 2;
        const frequencyResolution = sampleRate / fftSize;

        for (let i = 0; i + fftSize <= totalSamples; i += hopSize) {
            // Apply window function
            for (let k = 0; k < fftSize; k++) {
                real[k] = pcm[i + k] * this.windowCache[k];
                imag[k] = 0.0;
            }

            this._performFFT(real, imag, fftSize);

            const fftBins = new Float32Array(binCount);
            const norm = 2.0 / fftSize;
            
            for (let k = 0; k < binCount; k++) {
                fftBins[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]) * norm;
            }

            const timestamp = i / sampleRate;

            frames.push({
                timestamp,
                fftBins,
                binCount,
                sampleRate,
                windowSize: fftSize,
                frequencyResolution
            });
        }

        return { frames };
    }

    reset() {
        // Stateless processor; no runtime memory to clear.
    }
}
