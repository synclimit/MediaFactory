export const SubtitleAnimationPresets = [
    {
        id: 'fast_fade',
        name: 'Fast Fade',
        description: 'A very snappy and quick fade in.',
        animations: {
            fade_in: {
                enabled: true,
                durationMs: 150,
                startScale: 0.98,
                easing: 'linear'
            }
        }
    },
    {
        id: 'smooth_fade',
        name: 'Smooth Fade',
        description: 'A balanced and pleasant fade in.',
        animations: {
            fade_in: {
                enabled: true,
                durationMs: 300,
                startScale: 0.95,
                easing: 'easeOutQuad'
            }
        }
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'A slow and dramatic entry for cinematic text.',
        animations: {
            fade_in: {
                enabled: true,
                durationMs: 800,
                startScale: 0.90,
                easing: 'easeInOutQuad'
            }
        }
    },
    {
        id: 'dj_intro',
        name: 'DJ Intro',
        description: 'An aggressive punch-in for high energy sections.',
        animations: {
            fade_in: {
                enabled: true,
                durationMs: 100,
                startScale: 1.10, // starts larger and snaps to 1.0
                easing: 'easeOutQuad'
            }
        }
    },
    {
        id: 'soft_intro',
        name: 'Soft Intro',
        description: 'A gentle and slow floating entrance.',
        animations: {
            fade_in: {
                enabled: true,
                durationMs: 500,
                startScale: 1.0,
                easing: 'linear'
            }
        }
    }
];

export const getSubtitleAnimationPreset = (id) => {
    return SubtitleAnimationPresets.find(p => p.id === id) || SubtitleAnimationPresets.find(p => p.id === 'smooth_fade');
};
