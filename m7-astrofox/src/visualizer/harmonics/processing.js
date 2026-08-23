/**
 * Pure FFT display-data processing helpers from harmonics-audio/fft-visualizer
 * License: MIT
 */

export function aggregateBins(source, targetBands) {
  if (targetBands >= source.length) return source;

  const result = new Uint8Array(targetBands);
  const ratio = source.length / targetBands;

  for (let i = 0; i < targetBands; i++) {
    const startBin = Math.floor(i * ratio);
    const endBin = Math.floor((i + 1) * ratio);
    let maxVal = 0;
    for (let j = startBin; j < endBin; j++) {
      if (source[j] > maxVal) maxVal = source[j];
    }
    result[i] = maxVal;
  }
  return result;
}

export function aggregatePeaks(source, targetBands) {
  if (targetBands >= source.length) return source;

  const result = new Float32Array(targetBands);
  const ratio = source.length / targetBands;

  for (let i = 0; i < targetBands; i++) {
    const startBin = Math.floor(i * ratio);
    const endBin = Math.floor((i + 1) * ratio);
    let maxVal = 0;
    for (let j = startBin; j < endBin; j++) {
      if (source[j] > maxVal) maxVal = source[j];
    }
    result[i] = maxVal;
  }
  return result;
}

export function peakToUint8(peaks, numBins) {
  const result = new Uint8Array(numBins);
  for (let i = 0; i < numBins; i++) {
    result[i] = Math.min(255, Math.floor(peaks[i] * 255));
  }
  return result;
}

export function applyNoiseFloor(data, threshold) {
  if (threshold <= 0) return;

  for (let i = 0; i < data.length; i++) {
    data[i] = data[i] > threshold ? data[i] - threshold : 0;
  }
  const scale = 255 / (255 - threshold);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.min(255, Math.floor(data[i] * scale));
  }
}

export function applySmoothing(data, state, factor) {
  if (factor <= 0) return;

  for (let i = 0; i < data.length; i++) {
    state[i] = factor * state[i] + (1 - factor) * data[i];
    data[i] = Math.floor(state[i]);
  }
}

export function updatePeaks(peaks, data, decay) {
  for (let i = 0; i < data.length; i++) {
    const value = data[i] / 255;
    if (value > peaks[i]) {
      peaks[i] = value;
    } else {
      peaks[i] *= decay;
    }
  }
}
