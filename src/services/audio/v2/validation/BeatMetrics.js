export const BeatMetrics = {
    // Beat Accuracy: Overall accuracy percentage of beats detected vs actual beats.
    BEAT_ACCURACY: 'BEAT_ACCURACY',
    
    // Beat Precision: The percentage of detected beats that were actually beats (True Positives / (True Positives + False Positives)).
    BEAT_PRECISION: 'BEAT_PRECISION',
    
    // Beat Recall: The percentage of actual beats that were detected (True Positives / (True Positives + False Negatives)).
    BEAT_RECALL: 'BEAT_RECALL',
    
    // Beat F1 Score: Harmonic mean of precision and recall.
    BEAT_F1_SCORE: 'BEAT_F1_SCORE',
    
    // Downbeat Accuracy: Percentage of correctly identified downbeats (the 1 of each bar).
    DOWNBEAT_ACCURACY: 'DOWNBEAT_ACCURACY',
    
    // Kick Accuracy: Percentage of correctly classified kick drums.
    KICK_ACCURACY: 'KICK_ACCURACY',
    
    // Snare Accuracy: Percentage of correctly classified snare drums.
    SNARE_ACCURACY: 'SNARE_ACCURACY',
    
    // Timing Error: The average temporal deviation (in seconds/ms) between detected beats and ground truth beats.
    TIMING_ERROR: 'TIMING_ERROR',
    
    // Average Latency: The mean time delay across all detected events.
    AVERAGE_LATENCY: 'AVERAGE_LATENCY',
    
    // Maximum Latency: The single largest time delay recorded across all events.
    MAXIMUM_LATENCY: 'MAXIMUM_LATENCY',
    
    // False Positive Count: Number of events incorrectly flagged as a beat/onset.
    FALSE_POSITIVE_COUNT: 'FALSE_POSITIVE_COUNT',
    
    // False Negative Count: Number of actual beats/onsets missed by the algorithm.
    FALSE_NEGATIVE_COUNT: 'FALSE_NEGATIVE_COUNT'
};
