# MediaFactory

# PARTICLE_TRAIL_SPEC.md

Version : 1.0
Status : OFFICIAL
Module : Particle Engine
Specification : Trail Library

---

# Overview

Particle Trail defines how motion trails are rendered behind particles.

Trail ONLY controls visual persistence.

Trail DOES NOT define:

- Shape
- Movement
- Physics
- Spawn Logic
- Audio Analysis

Trail must work with every Shape and every Flow.

---

# Global Requirements

Every Trail MUST support:

- Fast Render
- Audio Reactive Render
- GPU Rendering
- Opacity
- Length
- Width
- Fade
- Blend Mode
- Color Tint
- Cache

Default Length

20 px

Default Opacity

100%

Default Width

100%

Reusable

YES

GPU Friendly

YES

---

# TRAIL_001

ID

trail_none

Name

None

Category

Basic

Description

No trail is rendered.

Length

0

Fade

Disabled

Blend

Normal

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Default option.

---

# TRAIL_002

ID

trail_fade

Name

Fade

Category

Basic

Description

Simple fading trail.

Length

Short

Fade

Linear

Blend

Normal

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Low performance cost.

---

# TRAIL_003

ID

trail_glow

Name

Glow

Category

Light

Description

Soft glowing trail.

Length

Medium

Fade

Smooth

Blend

Additive

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Ideal for music visualizers.

---

# TRAIL_004

ID

trail_light

Name

Light Streak

Category

Light

Description

Bright light streak.

Length

Long

Fade

Smooth

Blend

Screen

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Suitable for fast particles.

---

# TRAIL_005

ID

trail_smoke

Name

Smoke

Category

Atmosphere

Description

Soft smoke behind moving particles.

Length

Medium

Fade

Smooth

Blend

Alpha

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Pairs well with Fire Flow.

---

# TRAIL_006

ID

trail_fire

Name

Fire

Category

Atmosphere

Description

Flame-like trailing effect.

Length

Medium

Fade

Smooth

Blend

Additive

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Supports animated gradient in future.

---

# TRAIL_007

ID

trail_energy

Name

Energy

Category

Energy

Description

Electric energy trail.

Length

Short

Fade

Sharp

Blend

Additive

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Good for EDM presets.

---

# TRAIL_008

ID

trail_rainbow

Name

Rainbow

Category

Stylized

Description

Multi-color gradient trail.

Length

Medium

Fade

Smooth

Blend

Screen

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Gradient controlled by Color Engine.

---

# TRAIL_009

ID

trail_dotted

Name

Dotted

Category

Stylized

Description

Broken dotted trail.

Length

Medium

Fade

Step

Blend

Normal

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Useful for retro effects.

---

# TRAIL_010

ID

trail_pixel

Name

Pixel

Category

Digital

Description

Pixel-art style trail.

Length

Short

Fade

Step

Blend

Normal

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Designed for pixel visual themes.

---

# Future Rules

- Trail IDs are permanent.
- Never reuse deleted IDs.
- New Trails must start from TRAIL_011.
- Every Trail must remain backward compatible.
- Every Trail must follow this specification format.
- Trail controls visual persistence only and must never contain Shape, Flow or Audio Analysis logic.

---

END OF DOCUMENT