# MediaFactory

# PARTICLE_SHAPE_SPEC.md

Version : 1.0
Status : OFFICIAL
Module : Particle Engine
Specification : Shape Library

---

# Overview

Particle Shape defines the visual appearance of a particle.

Shape ONLY defines the particle's geometry.

Shape DOES NOT define:

- Movement
- Physics
- Trail
- Audio Reaction
- Spawn Logic

Those are handled by separate engines.

A Shape must be reusable with every Flow, Trail and Particle Preset.

---

# Global Requirements

Every Shape MUST support:

- Fill Color
- Stroke Color
- Stroke Width
- Opacity
- Scale
- Random Scale
- Rotation
- Random Rotation
- Tint Color
- Blend Mode
- Texture Override (Future)
- SVG Support (Future)

Every Shape must work with:

- Fast Render
- Audio Reactive Render

Default Pivot

Center

Coordinate System

Normalized

Default Size

8 px

Resizable

YES

Tintable

YES

Cacheable

YES

GPU Friendly

YES

---

# SHAPE_001

ID

shape_circle

Name

Circle

Category

Basic Geometry

Description

Standard circular particle.

Render Type

Primitive

Supported Properties

- Fill
- Stroke
- Opacity
- Rotation
- Scale

Default

Fill

Solid

Stroke

Optional

Rotation

Random

Scale

1.0

Notes

Default particle used by most presets.

---

# SHAPE_002

ID

shape_square

Name

Square

Category

Basic Geometry

Description

Basic square particle.

Render Type

Primitive

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Fill

Solid

Rotation

Random

Notes

Suitable for digital and pixel effects.

---

# SHAPE_003

ID

shape_triangle

Name

Triangle

Category

Basic Geometry

Description

Three-sided geometric particle.

Render Type

Primitive

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Rotation

Random

Notes

Frequently used for energetic presets.

---

# SHAPE_004

ID

shape_diamond

Name

Diamond

Category

Basic Geometry

Description

Rotated square.

Render Type

Primitive

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Rotation

45°

Notes

Good for elegant particle systems.

---

# SHAPE_005

ID

shape_hexagon

Name

Hexagon

Category

Basic Geometry

Description

Six-sided polygon.

Render Type

Primitive

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Rotation

0°

Notes

Frequently used in futuristic themes.

---

# SHAPE_006

ID

shape_star

Name

Star

Category

Symbol

Description

Five-point star.

Render Type

Vector

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Points

5

Notes

Supports animated rotation.

---

# SHAPE_007

ID

shape_heart

Name

Heart

Category

Symbol

Description

Heart symbol.

Render Type

Vector

Supported Properties

- Fill
- Stroke
- Scale
- Rotation

Default

Rotation

0°

Notes

Supports outline mode.

---

# SHAPE_008

ID

shape_music_note

Name

Music Note

Category

Symbol

Description

Musical note.

Render Type

Vector

Supported Properties

- Fill
- Stroke
- Scale
- Rotation

Default

Rotation

Random

Notes

Recommended for music-related presets.

---

# SHAPE_009

ID

shape_lightning

Name

Lightning

Category

Symbol

Description

Lightning bolt.

Render Type

Vector

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Rotation

Random

Notes

Supports glow effects.

---

# SHAPE_010

ID

shape_flame

Name

Flame

Category

Nature

Description

Stylized flame.

Render Type

Vector

Supported Properties

- Fill
- Stroke
- Scale

Default

Rotation

Random

Notes

Supports animated gradients in future.

---

# SHAPE_011

ID

shape_snowflake

Name

Snowflake

Category

Nature

Description

Snow crystal.

Render Type

Vector

Supported Properties

- Fill
- Scale
- Rotation

Default

Rotation

Random

Notes

Should maintain symmetry.

---

# SHAPE_012

ID

shape_leaf

Name

Leaf

Category

Nature

Description

Leaf particle.

Render Type

Vector

Supported Properties

- Fill
- Rotation
- Scale

Default

Rotation

Random

Notes

Suitable for wind animations.

---

# SHAPE_013

ID

shape_feather

Name

Feather

Category

Nature

Description

Feather particle.

Render Type

Vector

Supported Properties

- Fill
- Rotation
- Scale

Default

Rotation

Random

Notes

Optimized for floating motion.

---

# SHAPE_014

ID

shape_bubble

Name

Bubble

Category

Nature

Description

Transparent bubble.

Render Type

Vector

Supported Properties

- Fill
- Opacity
- Scale

Default

Opacity

70%

Notes

Supports additive blending.

---

# SHAPE_015

ID

shape_droplet

Name

Droplet

Category

Nature

Description

Water droplet.

Render Type

Vector

Supported Properties

- Fill
- Rotation
- Scale

Default

Rotation

Random

Notes

Used for rain presets.

---

# SHAPE_016

ID

shape_crystal

Name

Crystal

Category

Fantasy

Description

Crystal shard.

Render Type

Vector

Supported Properties

- Fill
- Stroke
- Rotation
- Scale

Default

Rotation

Random

Notes

Supports future refraction shaders.

---

# SHAPE_017

ID

shape_pixel

Name

Pixel

Category

Digital

Description

Single square pixel.

Render Type

Primitive

Supported Properties

- Fill
- Scale

Default

Scale

1.0

Notes

Must render sharply without anti-aliasing.

---

# SHAPE_018

ID

shape_ring

Name

Ring

Category

Basic Geometry

Description

Hollow circle.

Render Type

Vector

Supported Properties

- Stroke
- Scale
- Rotation

Default

Stroke

Enabled

Fill

Disabled

Notes

Useful for pulse effects.

---

# SHAPE_019

ID

shape_plus

Name

Plus

Category

Symbol

Description

Plus icon.

Render Type

Vector

Supported Properties

- Fill
- Rotation
- Scale

Default

Rotation

0°

Notes

Supports UI style animations.

---

# SHAPE_020

ID

shape_spark

Name

Spark

Category

Energy

Description

Small energy spark.

Render Type

Vector

Supported Properties

- Fill
- Rotation
- Scale

Default

Rotation

Random

Notes

Should support very small rendering sizes.

---

# Future Rules

- Shape IDs are permanent.
- Never reuse deleted IDs.
- New Shapes must start from SHAPE_021.
- Existing Shapes must remain backward compatible.
- Every new Shape must follow this specification format.

---

END OF DOCUMENT