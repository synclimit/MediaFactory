export const SubtitleEffectPresets = [
    {
        id: 'soft_beat',
        name: 'Soft Beat',
        description: 'A gentle, subtle pulse suitable for relaxed rhythms.',
        category: 'Basic',
        effects: {
            scale: {
                enabled: true,
                maxScale: 1.05,
                attack: 0.05,
                decay: 5
            }
        }
    },
    {
        id: 'hard_beat',
        name: 'Hard Beat',
        description: 'A punchy, aggressive pulse for energetic tracks.',
        category: 'Intense',
        effects: {
            scale: {
                enabled: true,
                maxScale: 1.25,
                attack: 0.01,
                decay: 15
            }
        }
    },
    {
        id: 'edm',
        name: 'EDM',
        description: 'Fast reacting high-energy pulses designed for electronic dance music.',
        category: 'Intense',
        effects: {
            scale: {
                enabled: true,
                maxScale: 1.15,
                attack: 0.01,
                decay: 20
            }
        }
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Slow, dramatic pulses that ease in and out smoothly.',
        category: 'Atmospheric',
        effects: {
            scale: {
                enabled: true,
                maxScale: 1.10,
                attack: 0.1,
                decay: 2
            }
        }
    },
    {
        id: 'lofi',
        name: 'LoFi',
        description: 'Very chill, sluggish pulsing effect that feels laid back.',
        category: 'Atmospheric',
        effects: {
            scale: {
                enabled: true,
                maxScale: 1.08,
                attack: 0.08,
                decay: 3
            }
        }
    }
];

export const getSubtitleEffectPreset = (id) => {
    return SubtitleEffectPresets.find(p => p.id === id) || SubtitleEffectPresets[0];
};
