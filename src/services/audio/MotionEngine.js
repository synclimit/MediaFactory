/**
 * MediaFactory Enterprise Motion Engine
 * Permanent Runtime for all M1-M5 Modules
 *
 * Converts Beat Engine output into natural, physics-based motion.
 * This is the single source of truth for every animated property in MediaFactory.
 *
 * Pipeline:
 *   BeatEngine.update() → MotionEngine.update() → Renderers read getMotion()
 */

// ─── Motion Profiles ────────────────────────────────────────────────────────
// Each profile defines the physics characteristics of the motion.
// Users select a profile; renderers never hardcode physics constants.
export const MOTION_PROFILES = {
    reference: {
        spring: 300,        // Very tight spring for fast reaction
        friction: 0.70,     // Heavy damping to prevent oscillation
        randomness: 0,      // Pure 1D motion, no noise
        impulseMultiplier: 1.0,
        maxAmplitude: 2.0,
        returnSpeed: 10     // Not used for direct velocity impulses
    },
    // zoom_pulse: designed for Zoom Pulse effect
    // Peak fast, decay naturally over ~300ms
    // spring pulls value back to 0, friction controls oscillation
    zoom_pulse: {
        spring: 12,         // Moderate spring — returns to rest in ~300ms
        friction: 0.85,     // Moderate damping — one clean pulse, no ringing
        randomness: 0,
        impulseMultiplier: 1.0,
        maxAmplitude: 1.0,
        returnSpeed: 8,
    },
    soft: {
        name: 'Soft',
        spring: 3,
        damping: 0.90,
        mass: 1.0,
        friction: 0.95,
        impulseMultiplier: 0.3,
        randomness: 0.2,
        maxAmplitude: 0.3,
        returnSpeed: 1.5,
    },
    smooth: {
        name: 'Smooth',
        spring: 5,
        damping: 0.85,
        mass: 1.0,
        friction: 0.92,
        impulseMultiplier: 0.5,
        randomness: 0.3,
        maxAmplitude: 0.5,
        returnSpeed: 2.5,
    },
    organic: {
        name: 'Organic',
        spring: 4,
        damping: 0.82,
        mass: 1.5,
        friction: 0.88,
        impulseMultiplier: 0.6,
        randomness: 0.8,
        maxAmplitude: 0.6,
        returnSpeed: 2.0,
    },
    floating: {
        name: 'Floating',
        spring: 1.5,
        damping: 0.96,
        mass: 0.8,
        friction: 0.98,
        impulseMultiplier: 0.2,
        randomness: 0.4,
        maxAmplitude: 0.2,
        returnSpeed: 0.8,
    },
    elastic: {
        name: 'Elastic',
        spring: 12,
        damping: 0.55,
        mass: 1.0,
        friction: 0.85,
        impulseMultiplier: 0.9,
        randomness: 0.3,
        maxAmplitude: 0.8,
        returnSpeed: 6.0,
    },
    heavy: {
        name: 'Heavy',
        spring: 2,
        damping: 0.70,
        mass: 4.0,
        friction: 0.82,
        impulseMultiplier: 1.2,
        randomness: 0.5,
        maxAmplitude: 1.0,
        returnSpeed: 1.2,
    },
    edm: {
        name: 'EDM',
        spring: 18,
        damping: 0.65,
        mass: 0.5,
        friction: 0.80,
        impulseMultiplier: 1.5,
        randomness: 0.9,
        maxAmplitude: 1.2,
        returnSpeed: 10.0,
    },
    cinematic: {
        name: 'Cinematic',
        spring: 2.5,
        damping: 0.92,
        mass: 2.5,
        friction: 0.96,
        impulseMultiplier: 0.4,
        randomness: 0.1,
        maxAmplitude: 0.4,
        returnSpeed: 1.0,
    },
    handheld: {
        name: 'Handheld',
        spring: 6,
        damping: 0.75,
        mass: 1.2,
        friction: 0.86,
        impulseMultiplier: 0.8,
        randomness: 0.85,
        maxAmplitude: 0.7,
        returnSpeed: 4.0,
    },
    earthquake: {
        name: 'Earthquake',
        spring: 25,
        damping: 0.40,
        mass: 2.0,
        friction: 0.60,
        impulseMultiplier: 2.5,
        randomness: 1.0,
        maxAmplitude: 2.0,
        returnSpeed: 15.0,
    },
};

// ─── Motion Channel ───────────────────────────────────────────────────────────
// Each channel has its own independent spring/damping state.
function createChannel() {
    return {
        // Spring state
        x: 0, y: 0,          // Current position
        vx: 0, vy: 0,        // Velocity
        targetX: 0, targetY: 0, // Spring target

        // Scalar state (for zoom, scale, opacity, etc.)
        value: 0,
        velocity: 0,
        target: 0,

        // Impulse tracking
        impulse: 0,
        lastImpulseTime: 0,

        // Noise oscillation (for handheld / organic drift)
        noiseOffset: Math.random() * 1000,
        noiseTargetX: 0, noiseTargetY: 0,
        noiseTimer: 0,
    };
}

// ─── MotionEngine Class ───────────────────────────────────────────────────────
class MotionEngine {
    constructor() {
        // Channel registry — keyed by name
        // Built-in channels: 'camera', 'zoom', 'rotation', 'pulse'
        // Custom channels can be registered by effects/plugins
        this.channels = new Map();

        // Active effect configs — { channelId: { profileKey, impulseSource, maxOffset, maxScale, ... } }
        this.configs = new Map();

        // Subscribers
        this.subscribers = new Set();

        // Snapshot of the last-known beat state
        this._lastBeatState = null;

        // Extension point stubs (future: keyframe blending, camera paths, etc.)
        this.extensions = {
            keyframeBlending: null,
            cameraPath: null,
            noiseCurve: null,
            bezierMotion: null,
            animationClips: null,
            timeline: null,
        };
    }

    // ── Channel API ────────────────────────────────────────────────────────────
    registerChannel(id, config = {}) {
        if (!this.channels.has(id)) {
            this.channels.set(id, createChannel());
        }
        this.configs.set(id, {
            profileKey: 'soft',
            impulseSource: 'bass', // 'bass' | 'mid' | 'treble' | 'peak' | 'kick'
            maxOffset: 50,
            maxScale: 0.05,
            ...config,
        });
        return this;
    }

    setChannelConfig(id, config) {
        const existing = this.configs.get(id) || {};
        this.configs.set(id, { ...existing, ...config });
    }

    getMotion(id) {
        return this.channels.get(id) || null;
    }

    applyImpulse(id, strength) {
        const channel = this.channels.get(id);
        if (!channel) return;
        const config = this.configs.get(id) || {};
        
        if (config.profileKey === 'zoom_pulse' || config.profileKey === 'reference') {
            // For zoom channels: set target to strength directly.
            // The spring physics will drive value toward target then back to 0.
            // This produces one clean pulse per beat with natural decay.
            channel.target = Math.max(channel.target, strength);
        } else {
            // For camera shake channels: inject velocity for organic motion
            channel.velocity += strength * 50.0;
        }
        
        // Track peak impulse for debug display
        channel.impulse = Math.max(channel.impulse, strength);
    }

    getState() {
        const transforms = {};
        for (const [id, ch] of this.channels) {
            transforms[id] = { ...ch };
        }
        return { transforms };
    }

    // ── Pub/Sub ────────────────────────────────────────────────────────────────
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    // ── Core Update ───────────────────────────────────────────────────────────
    /**
     * Called exactly once per frame.
     * MotionEngine no longer reads BeatEngine directly.
     * @param {number} playFactor - Master play state (0 = paused, 1 = playing)
     * @param {number} dt — delta time in seconds
     */
    update(playFactor, dt) {
        const clampedDt = Math.min(dt, 0.1);

        for (const [id, channel] of this.channels) {
            const config = this.configs.get(id) || {};
            const profile = MOTION_PROFILES[config.profileKey] || MOTION_PROFILES.smooth;

            this._updateChannel(channel, profile, config, clampedDt, playFactor);
        }

        // Notify subscribers
        for (const cb of this.subscribers) {
            try { cb(this); } catch (e) { console.error('MotionEngine subscriber error:', e); }
        }
    }

    _updateChannel(channel, profile, config, dt, playFactor) {
        // ── Impulse Decay ──────────────────────────────────────────────────────
        channel.impulse -= channel.impulse * Math.min(dt * profile.returnSpeed, 1);
        if (channel.impulse < 0.001) channel.impulse = 0;
        
        const clampedImpulse = Math.min(channel.impulse * profile.impulseMultiplier, profile.maxAmplitude);

        // ── Noise / Random Target ──────────────────────────────────────────────
        channel.noiseTimer -= dt;
        if (channel.noiseTimer <= 0) {
            const r = profile.randomness * clampedImpulse;
            channel.noiseTargetX = (Math.random() * 2 - 1) * r;
            channel.noiseTargetY = (Math.random() * 2 - 1) * r;
            channel.noiseTimer = 0.05 + Math.random() * 0.08;
        }

        const targetFactor = clampedImpulse;
        channel.targetX = channel.noiseTargetX * targetFactor;
        channel.targetY = channel.noiseTargetY * targetFactor;

        // ── Spring Physics (XY) ────────────────────────────────────────────────
        const springForceX = (channel.targetX - channel.x) * profile.spring;
        const springForceY = (channel.targetY - channel.y) * profile.spring;
        channel.vx = (channel.vx + springForceX * dt) * profile.friction;
        channel.vy = (channel.vy + springForceY * dt) * profile.friction;
        channel.x += channel.vx * dt;
        channel.y += channel.vy * dt;

        // ── Scalar Spring (zoom/pulse/scale) ───────────────────────────────────
        if (config.profileKey === 'zoom_pulse') {
            // Pure spring: target set by applyImpulse(), spring pulls value toward
            // target then back to 0. No impulse legacy path needed.
            // target decays toward 0 naturally via spring force.
            const scalarForce = (channel.target - channel.value) * profile.spring;
            channel.velocity = (channel.velocity + scalarForce * dt) * profile.friction;
            channel.value += channel.velocity * dt;
            channel.value = Math.max(0, channel.value);
            // Decay target back toward 0 (otherwise zoom stays up forever)
            channel.target *= Math.pow(0.001, dt); // very fast target decay
        } else {
            // Legacy: use clampedImpulse as target for non-reference profiles
            channel.target = config.profileKey !== 'reference' ? clampedImpulse : channel.target;
            const scalarForce = (channel.target - channel.value) * profile.spring;
            channel.velocity = (channel.velocity + scalarForce * dt) * profile.friction;
            channel.value += channel.velocity * dt;
            channel.value = Math.max(0, channel.value);
        }

        // ── Playback Contract: decay to neutral when paused ────────────────────
        if (playFactor < 0.01) {
            channel.x *= 0.85;
            channel.y *= 0.85;
            channel.vx *= 0.85;
            channel.vy *= 0.85;
            channel.value *= 0.85;
            channel.velocity *= 0.85;
            channel.impulse *= 0.85;
            channel.target *= 0.85;
        }
    }
}

export const motionEngine = new MotionEngine();

// Pre-register standard channels with sensible defaults
motionEngine.registerChannel('camera', {
    profileKey: 'soft',
    impulseSource: 'bass',
    maxOffset: 30,
});
motionEngine.registerChannel('zoom', {
    profileKey: 'soft',
    impulseSource: 'bass',
    maxScale: 0.015,
});
motionEngine.registerChannel('rotation', {
    profileKey: 'organic',
    impulseSource: 'mid',
    maxOffset: 5,
});
motionEngine.registerChannel('pulse', {
    profileKey: 'edm',
    impulseSource: 'peak',
    maxScale: 0.1,
});
