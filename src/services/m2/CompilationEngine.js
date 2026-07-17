/**
 * M2 Compilation Engine V1
 *
 * Compiles a single audio mix from a given pool of sources.
 * Adheres strictly to the target duration without exceeding it by
 * skipping oversized tracks and scanning the remaining randomized pool.
 */

import { sumTotalDuration, formatDuration } from '../../entities/m2/SourceEntity.js';

export class CompilationEngine {
  /**
   * Build a single mix from a pool of sources, optimizing to get as close as
   * possible to targetDurationSec without exceeding it.
   *
   * @param {Array} sources - The pool of available sources.
   * @param {number} targetDurationSec - The maximum duration for the mix in seconds.
   * @returns {Object} The compiled mix, preview, and any warnings.
   */
  buildMix(sources, targetDurationSec) {
    if (sources && sources.some(s => s.isUnlinked)) {
      throw new Error('UNLINKED_SOURCE_DETECTED');
    }

    if (!sources || sources.length === 0) {
      return null;
    }

    // 1. Shuffle source order randomly
    // Copy the array to avoid mutating the original
    const shuffled = [...sources].sort(() => Math.random() - 0.5);

    const selectedTracks = [];
    const warnings = [];
    let currentDurationSec = 0;

    // 2. Scan remaining shuffled tracks
    for (const src of shuffled) {
      const trackDurationSec = sumTotalDuration([src]);

      if (!trackDurationSec || trackDurationSec <= 0) {
        warnings.push(`Skipped track "${src.title || src.id}": Unknown duration.`);
        continue;
      }

      const newMixDuration = currentDurationSec + trackDurationSec;

      if (newMixDuration > targetDurationSec) {
        continue;
      }
      
      // Track fits, add it to the compilation
      selectedTracks.push(src);
      currentDurationSec += trackDurationSec;
      
      // If we perfectly hit or exceed the target, we can stop scanning
      if (currentDurationSec >= targetDurationSec) {
        break;
      }
    }

    if (currentDurationSec > targetDurationSec) {
      return null;
    }

    if (selectedTracks.length === 0) {
      return null;
    }

    const mixResult = {
      selectedTracks,
      trackCount: selectedTracks.length,
      totalDurationSec: currentDurationSec,
      totalDurationFormatted: formatDuration(currentDurationSec),
      warnings,
      // Output Preview displaying: Track Order, Track Count, Total Duration
      preview: {
        trackOrder: selectedTracks.map((t, idx) => ({
          order: idx + 1,
          id: t.id,
          title: t.cleanTitle || t.title, // Enforce cleanTitle
          cleanTitle: t.cleanTitle,
          videoTitle: t.rawVideoTitle || t.rawTitle || t.title,
          duration: formatDuration(sumTotalDuration([t])),
          uri: t.youtubeUrl || t.localPath || t.title,
        })),
        trackCount: selectedTracks.length,
        totalDuration: formatDuration(currentDurationSec),
      },
    };

    return mixResult;
  }

  /**
   * Build multiple mixes from a pool of sources.
   *
   * @param {Array} sources - The pool of available sources.
   * @param {number} targetDurationSec - The maximum duration for each mix.
   * @param {number} outputCount - Number of mixes to generate (default 3).
   * @returns {Array<Object>} Array of compiled mixes.
   */
  buildMixes(sources, targetDurationSec, outputCount = 3) {
    if (sources && sources.some(s => s.isUnlinked)) {
      throw new Error('UNLINKED_SOURCE_DETECTED');
    }
    if (!sources || sources.length === 0) return [];

    const count = Math.max(1, Math.min(10, outputCount || 3));
    const maxAttempts = 1000;
    const candidates = [];

    // Generate a large pool of candidate combinations
    for (let i = 0; i < maxAttempts; i++) {
      const mix = this.buildMix(sources, targetDurationSec);
      if (mix && mix.trackCount > 0) {
        candidates.push(mix);
      }
    }

    // Sort by duration descending to get combinations closest to target duration
    candidates.sort((a, b) => b.totalDurationSec - a.totalDurationSec);

    const outputs = [];
    const usedCombinations = new Set();

    for (const mix of candidates) {
      if (outputs.length >= count) break;

      const trackIds = mix.selectedTracks.map(t => t.id);
      const signature = trackIds.join('|');

      if (usedCombinations.has(signature)) {
        console.log('DUPLICATE_SKIPPED', signature);
        continue;
      }

      usedCombinations.add(signature);

      const combinationTitles = mix.selectedTracks.map(t => t.title).join('+');
      
      mix.renderName = `Output ${outputs.length + 1}`;

      console.log('COMBINATION', combinationTitles);
      console.log('TOTAL_DURATION', mix.totalDurationSec);
      console.log('TARGET_DURATION', targetDurationSec);
      console.log('SIGNATURE', signature);

      outputs.push(mix);
    }

    console.log('FINAL_OUTPUT_COUNT', outputs.length);

    return outputs;
  }
}
