# MF-400A VISUAL TUNING REPORT

## Goal
Ensure each visual effect meets professional and cinematic aesthetic standards.

## Tuning Adjustments

### 1. Zoom Effect
- **Fixed Jitter:** Replaced linear return-to-base logic with an exponential curve (`(base - current) * (1 - Math.exp(...))`), completely eliminating the mechanical "breathing" artifact.
- **Double Triggers:** Transitioned to `kick.justTriggered` to prevent stuttering.

### 2. Glow Effect
- **Enhanced Mapping:** Now reacts to `snare` and `downbeat` in addition to `kick`.
- **Smooth Release:** Idle state now smoothly decays to 0% opacity instead of snapping, creating a professional bloom feel.

### 3. Camera Effect
- **Sickness Prevention:** Clamped maximum rotation limits to `[-2.0, 2.0]` degrees.
- **Cinematic Feel:** Clamped position momentum, creating a heavier, more deliberate pan and shake.

### 4. Particle Effect
- **Musical Density:** Bound active spawn rates to `sustain`, meaning longer notes create thicker particle fields.
- **Capped Burst:** Limited downbeat bursts to 100 particles to ensure consistent visual density and FPS.

### 5. Blur Effect
- **Aggressive Decay:** Tripled the decay rate (`dt * 15.0`) to ensure blur functions as a sharp, percussive impact rather than a lingering haze, preserving video readability.

### 6. Spectrum Effect
- **Authenticity:** Switched to an offline 64-band decimation of true FFT frequencies. The visualizers now reflect real audio frequencies without runtime processing overhead.
