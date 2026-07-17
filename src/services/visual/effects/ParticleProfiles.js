/**
 * ParticleProfiles
 * 
 * Defines artistic intent and styling parameters for Particle emissions.
 * These act as configuration limits and behavioural biases.
 */
export const ParticleProfiles = {
    Burst: {
        baseSpawnRate: 0,
        burstMultiplier: 50,
        velocity: 2.0,
        spread: 360.0,
        lifetime: 1.5,
        opacity: 1.0,
        reactive: true
    },
    Continuous: {
        baseSpawnRate: 20,
        burstMultiplier: 10,
        velocity: 1.0,
        spread: 45.0,
        lifetime: 2.0,
        opacity: 0.8,
        reactive: true
    },
    Spark: {
        baseSpawnRate: 5,
        burstMultiplier: 20,
        velocity: 3.0,
        spread: 180.0,
        lifetime: 0.5,
        opacity: 1.0,
        reactive: true
    },
    Dust: {
        baseSpawnRate: 15,
        burstMultiplier: 0,
        velocity: 0.2,
        spread: 360.0,
        lifetime: 4.0,
        opacity: 0.3,
        reactive: false
    },
    Rain: {
        baseSpawnRate: 100,
        burstMultiplier: 0,
        velocity: 5.0,
        spread: 0.0, // Falling straight
        lifetime: 1.0,
        opacity: 0.5,
        reactive: false
    },
    Snow: {
        baseSpawnRate: 30,
        burstMultiplier: 0,
        velocity: 0.5,
        spread: 30.0, // Swaying
        lifetime: 5.0,
        opacity: 0.7,
        reactive: false
    },
    Reactive: {
        baseSpawnRate: 0,
        burstMultiplier: 100, // Highly reactive to triggers
        velocity: 1.5,
        spread: 120.0,
        lifetime: 1.2,
        opacity: 1.0,
        reactive: true
    },
    Classical: {
        baseSpawnRate: 40,
        burstMultiplier: 5,
        velocity: 0.3,
        spread: 360.0,
        lifetime: 4.0,
        opacity: 0.4,
        reactive: true
    },
    Jazz: {
        baseSpawnRate: 20,
        burstMultiplier: 15,
        velocity: 0.8,
        spread: 180.0,
        lifetime: 2.5,
        opacity: 0.6,
        reactive: true
    },
    Metal: {
        baseSpawnRate: 50,
        burstMultiplier: 150,
        velocity: 4.0,
        spread: 360.0,
        lifetime: 0.8,
        opacity: 1.0,
        reactive: true
    },
    Acoustic: {
        baseSpawnRate: 15,
        burstMultiplier: 8,
        velocity: 0.5,
        spread: 90.0,
        lifetime: 3.0,
        opacity: 0.5,
        reactive: true
    },
    Podcast: {
        baseSpawnRate: 0,
        burstMultiplier: 0,
        velocity: 0.1,
        spread: 0.0,
        lifetime: 0.1,
        opacity: 0.0,
        reactive: false // No particles
    }
};

export function getParticleProfile(name) {
    return ParticleProfiles[name] || ParticleProfiles.Burst;
}
