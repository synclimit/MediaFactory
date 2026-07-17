import { AnimationCurves } from './AudioDrivenRuntime.js';
import { VisualMappingProfiles } from './VisualMappingProfile.js';

export class VisualMappingEngine {
    constructor() {
        this.profileName = 'Default';
        this.rules = VisualMappingProfiles[this.profileName];
        
        // Structural target defaults
        this.baseTargets = {
            Zoom: 0, 
            Scale: 1, 
            Glow: 0, 
            Opacity: 1, 
            Rotation: 0, 
            Blur: 0, 
            Shake: 0, 
            PositionX: 0, 
            PositionY: 0, 
            CameraZoom: 1, 
            CameraRotation: 0, 
            ParticleRate: 0, 
            SpectrumScale: 1, 
            SubtitleHighlight: 0, 
            PlaylistHighlight: 0, 
            TrackBrightness: 1
        };
    }
    
    setProfile(profileName) {
        if (!VisualMappingProfiles[profileName]) {
            throw new Error(`Invalid Visual Mapping Profile: ${profileName}`);
        }
        this.profileName = profileName;
        this.rules = VisualMappingProfiles[this.profileName];
    }
    
    _getSourceValue(state, sourceKey) {
        if (!state) return 0;
        const key = sourceKey.toLowerCase();
        
        // 1. Check dot-notation (e.g., kick.velocity)
        if (key.includes('.')) {
            const parts = key.split('.');
            const obj = state[parts[0]];
            if (obj && typeof obj === 'object') {
                return obj[parts[1]] !== undefined ? obj[parts[1]] : 0;
            }
            return 0;
        }
        
        // 2. Direct property on global state (e.g., energy, pulse, progress)
        if (state[key] !== undefined && typeof state[key] === 'number') {
            return state[key];
        }
        
        // 3. Fallback for Envelope objects (Beat, Kick, Snare, HiHat, Downbeat) defaulting to 'intensity'
        if (state[key] && typeof state[key] === 'object' && 'intensity' in state[key]) {
            return state[key].intensity;
        }

        // 4. Special cases mapped to beat channel explicitly if naked (Velocity, Intensity)
        if (key === 'velocity' && state.beat) return state.beat.velocity || 0;
        if (key === 'intensity' && state.beat) return state.beat.intensity || 0;
        
        return 0;
    }

    evaluate(state) {
        if (!state) return Object.freeze({ ...this.baseTargets });
        
        // Copy bases to mutate additively across rules
        const output = { ...this.baseTargets };
        
        for (const rule of this.rules) {
            if (!rule.enabled) continue;
            
            let rawValue = this._getSourceValue(state, rule.source);
            
            if (rule.curve && AnimationCurves[rule.curve]) {
                const p = Math.max(0, Math.min(1, rawValue)); // Norm for curve safety
                rawValue = AnimationCurves[rule.curve](p);
            }
            
            if (rule.invert) {
                rawValue = 1.0 - rawValue;
            }
            
            let finalValue = (rawValue * rule.multiplier) + rule.offset;
            
            // Additive combination for multiple rules targeting the same property
            output[rule.target] = (output[rule.target] || 0) + finalValue;
            
            // Re-clamp output to rule min/max constraints post-addition
            output[rule.target] = Math.max(rule.min, Math.min(rule.max, output[rule.target]));
        }
        
        return Object.freeze(output);
    }
}
