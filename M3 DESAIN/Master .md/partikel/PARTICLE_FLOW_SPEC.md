# MediaFactory

# PARTICLE_FLOW_SPEC.md

Version : 1.0
Status : OFFICIAL
Module : Particle Engine
Specification : Flow Library

---

# Overview

Particle Flow defines how particles move.

Flow ONLY controls particle behavior.

Flow DOES NOT define:

- Shape
- Color
- Trail
- Blend Mode
- Audio Analysis
- Spawned Shape

Those are handled by their own engines.

A Flow must work with every Shape, Trail and Particle Preset.

---

# Global Requirements

Every Flow MUST support:

- Fast Render
- Audio Reactive Render
- Random Seed
- Pause / Resume
- Loop
- Reverse (Future)
- Speed Multiplier
- Direction Override (Future)

Default Coordinate System

Screen Space

Origin

Center

Default Unit

Pixels

GPU Friendly

YES

Reusable

YES

Deterministic

YES

---

# FLOW_001

ID

flow_static

Name

Static

Category

Basic

Description

Particles remain fixed after spawning.

Spawn

Any

Movement

None

Physics

Disabled

Lifetime

Infinite

Variation

Random Position

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Used for stars and background particles.

---

# FLOW_002

ID

flow_drift

Name

Drift

Category

Basic

Description

Slow constant movement.

Spawn

Any

Movement

Single Direction

Physics

Disabled

Lifetime

Infinite

Variation

Random Speed

Random Direction

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Suitable for ambient scenes.

---

# FLOW_003

ID

flow_float

Name

Float

Category

Basic

Description

Particles gently float upward.

Spawn

Bottom Area

Movement

Up

Physics

Light Gravity

Lifetime

Auto Remove

Variation

Random Speed

Random Rotation

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Ideal for dreamy environments.

---

# FLOW_004

ID

flow_rain

Name

Rain

Category

Weather

Description

Fast falling particles.

Spawn

Top Edge

Movement

Down

Physics

Gravity Enabled

Lifetime

Auto Remove

Variation

Random Speed

Random Spawn X

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Recommended for rain effects.

---

# FLOW_005

ID

flow_snow

Name

Snow

Category

Weather

Description

Slow falling particles with horizontal drift.

Spawn

Top Edge

Movement

Down + Drift

Physics

Light Gravity

Lifetime

Auto Remove

Variation

Random Speed

Random Drift

Random Rotation

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Soft natural snowfall.

---

# FLOW_006

ID

flow_wind_left

Name

Wind Left

Category

Wind

Description

Particles move toward the left.

Spawn

Right Edge

Movement

Left

Physics

Optional Wind

Lifetime

Auto Remove

Variation

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Horizontal environmental movement.

---

# FLOW_007

ID

flow_wind_right

Name

Wind Right

Category

Wind

Description

Particles move toward the right.

Spawn

Left Edge

Movement

Right

Physics

Optional Wind

Lifetime

Auto Remove

Variation

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Mirror version of Wind Left.

---

# FLOW_008

ID

flow_swirl

Name

Swirl

Category

Circular

Description

Particles rotate around a moving center.

Spawn

Center Area

Movement

Circular

Physics

Disabled

Lifetime

Infinite

Variation

Random Radius

Random Rotation Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Smooth circular motion.

---

# FLOW_009

ID

flow_spiral

Name

Spiral

Category

Circular

Description

Particles move outward in spiral paths.

Spawn

Center

Movement

Spiral

Physics

Disabled

Lifetime

Auto Remove

Variation

Random Radius

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Common for magical effects.

---

# FLOW_010

ID

flow_orbit

Name

Orbit

Category

Circular

Description

Particles orbit around a fixed point.

Spawn

Center

Movement

Orbit

Physics

Disabled

Lifetime

Infinite

Variation

Random Orbit Radius

Random Orbit Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Useful for reactive visualizers.

---

# FLOW_011

ID

flow_explosion

Name

Explosion

Category

Energy

Description

Particles burst outward from a point.

Spawn

Center

Movement

Radial Outward

Physics

Optional Drag

Lifetime

Auto Remove

Variation

Random Angle

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Ideal for beat hits.

---

# FLOW_012

ID

flow_implosion

Name

Implosion

Category

Energy

Description

Particles move inward toward a point.

Spawn

Outer Area

Movement

Toward Center

Physics

Disabled

Lifetime

Auto Remove

Variation

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Reverse explosion effect.

---

# FLOW_013

ID

flow_pulse

Name

Pulse

Category

Energy

Description

Particles repeatedly expand and contract.

Spawn

Center

Movement

Pulse Radius

Physics

Disabled

Lifetime

Infinite

Variation

Random Pulse Offset

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Excellent for bass reactions.

---

# FLOW_014

ID

flow_wave

Name

Wave

Category

Energy

Description

Particles travel in sinusoidal motion.

Spawn

Left Edge

Movement

Wave

Physics

Disabled

Lifetime

Auto Remove

Variation

Random Frequency

Random Amplitude

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Smooth rhythmic animation.

---

# FLOW_015

ID

flow_fountain

Name

Fountain

Category

Energy

Description

Particles launch upward then fall.

Spawn

Bottom Center

Movement

Projectile

Physics

Gravity Enabled

Lifetime

Auto Remove

Variation

Random Angle

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Water and spark fountain effects.

---

# FLOW_016

ID

flow_smoke

Name

Smoke

Category

Ambient

Description

Particles slowly rise while spreading.

Spawn

Bottom Area

Movement

Up + Drift

Physics

Light Drag

Lifetime

Auto Remove

Variation

Random Scale

Random Opacity

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Soft atmospheric movement.

---

# FLOW_017

ID

flow_fire

Name

Fire

Category

Ambient

Description

Fast upward turbulent motion.

Spawn

Bottom Area

Movement

Up

Physics

Turbulence

Lifetime

Auto Remove

Variation

Random Scale

Random Speed

Random Direction

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Recommended for flame particles.

---

# FLOW_018

ID

flow_bubble_rise

Name

Bubble Rise

Category

Water

Description

Bubbles rise through liquid.

Spawn

Bottom Area

Movement

Up + Drift

Physics

Buoyancy

Lifetime

Auto Remove

Variation

Random Size

Random Drift

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Water environment presets.

---

# FLOW_019

ID

flow_spark

Name

Spark

Category

Energy

Description

Very fast particles with short lifetime.

Spawn

Any

Movement

Fast Linear

Physics

Optional Drag

Lifetime

Very Short

Variation

Random Direction

Random Speed

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Perfect for beat accents.

---

# FLOW_020

ID

flow_dust

Name

Dust

Category

Ambient

Description

Tiny floating particles with subtle movement.

Spawn

Anywhere

Movement

Slow Drift

Physics

Light Drag

Lifetime

Long

Variation

Random Position

Random Speed

Random Opacity

Compatible

✅ Fast Render

✅ Audio Reactive

Notes

Useful for cinematic atmosphere.

---

# Future Rules

- Flow IDs are permanent.
- Never reuse deleted IDs.
- New Flows must start from FLOW_021.
- Every Flow must remain backward compatible.
- Every new Flow must follow this specification format.
- Flow controls behavior only and must never contain Shape, Trail, Color or Audio Analysis logic.

---

END OF DOCUMENT