# VISUALIZER LIBRARY MASTER BLUEPRINT
## MediaFactory — Official Visualization System Specification
### Version 1.0 | July 2026

---

> **Mission:** Build the largest, highest-quality browser-based audio visualizer library in existence. Target: 200+ unique visualizers that rival BSP Lab, MilkDrop, Resolume, and TouchDesigner.

---

# PHASE 1 — CATEGORY ARCHITECTURE

## 25 Visualizer Categories

| # | Category | Icon | Description | Target Count |
|---|----------|------|-------------|--------------|
| 1 | **Bars** | ▮ | Vertical/horizontal frequency bars in all arrangements | 18 |
| 2 | **Waves** | 〰 | Oscilloscope lines, sine waves, bezier curves | 12 |
| 3 | **Circle** | ◉ | Circular/radial bar arrangements | 10 |
| 4 | **Ring** | ◎ | Concentric rings, orbits, halos | 10 |
| 5 | **Spiral** | ꩜ | Archimedean, logarithmic, fibonacci spirals | 8 |
| 6 | **Mandala** | ✦ | Symmetric geometric kaleidoscope patterns | 8 |
| 7 | **Particle** | ✧ | Point clouds, explosions, streams, fireflies | 14 |
| 8 | **Galaxy** | ✶ | Star systems, nebulae, cosmic simulations | 8 |
| 9 | **Tunnel** | ⊙ | Depth corridors, wormholes, vortex effects | 8 |
| 10 | **Ribbon** | ≋ | Flowing strips, aurora borealis, silk | 8 |
| 11 | **DNA** | ⧬ | Double helix, biological structures | 5 |
| 12 | **Geometry** | △ | Polygons, fractals, sacred geometry, tessellations | 12 |
| 13 | **Neon** | ✺ | Glowing outlines, synthwave, retrowave | 10 |
| 14 | **Speaker** | ◉ | Physical speaker cones, woofers, membranes | 5 |
| 15 | **Matrix** | ▦ | Grids, digital rain, data streams | 6 |
| 16 | **Terrain** | ⛰ | Landscapes, mountains, cityscapes, horizons | 8 |
| 17 | **Abstract** | ◈ | Generative art, noise fields, organic forms | 10 |
| 18 | **Minimal** | ○ | Clean, elegant, single-element designs | 8 |
| 19 | **Cinematic** | ▣ | Movie-quality, epic, dramatic compositions | 6 |
| 20 | **3D** | ⬡ | WebGL/Three.js volumetric renders | 10 |
| 21 | **Fluid** | ≈ | Liquid, smoke, fire, plasma simulations | 8 |
| 22 | **Text** | A | Reactive typography, lyric animations | 5 |
| 23 | **Retro** | ▧ | VHS, CRT scanlines, pixel art, 8-bit | 8 |
| 24 | **Nature** | ❀ | Trees, flowers, water, rain, lightning | 6 |
| 25 | **Experimental** | ✱ | Avant-garde, glitch, unconventional | 8 |

**Total Target: 213 visualizers**

---

# PHASE 2 — COMPLETE VISUALIZER CATALOG

## Legend

- **Audio Source:** `Bass` `Mids` `Highs` `Full` `Waveform` `BPM` `Energy` `Onset`
- **Renderer:** `Canvas2D` `WebGL` `Three.js`
- **Difficulty:** `Easy` `Medium` `Hard` `Expert`
- **Performance:** `Low` `Medium` `High` `Ultra`

---

## Category 1: BARS (18 Visualizers)

### B01 — Classic Vertical
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Standard vertical frequency bars rising from bottom, evenly spaced |
| **Visual Style** | Clean, solid color bars with optional glow |
| **Audio Source** | Full spectrum FFT (64-256 bands) |
| **Animation** | Bars rise/fall smoothly with frequency amplitude. Slight gravity decay on fall |
| **Math Concept** | Direct FFT magnitude mapping to bar height. Smoothing via exponential moving average |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Foundation visualizer. Must feel buttery smooth with 2-frame decay |

### B02 — Staggered Center
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars extend from vertical center, growing both up and down symmetrically |
| **Visual Style** | Centered, balanced, dual-direction |
| **Audio Source** | Full spectrum |
| **Animation** | Bars expand outward from center axis. Mirror effect creates symmetry |
| **Math Concept** | y = centerY ± (amplitude * height/2). Symmetric rendering |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Popular in Trap Nation style videos |

### B03 — Mirror Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Left half mirrors right half. Spectrum duplicated and flipped horizontally |
| **Visual Style** | Symmetric butterfly pattern |
| **Audio Source** | Full spectrum |
| **Animation** | Left side renders normally, right side is x-axis mirror. Creates Rorschach-like symmetry |
| **Math Concept** | x_mirror = canvasWidth - x. Same amplitude data for both sides |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | One of the most recognizable visualizer styles |

### B04 — Split Dual
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Two separate bar groups on left and right. Bass on left, treble on right |
| **Visual Style** | Separated frequency bands, editorial layout |
| **Audio Source** | Bass (left), Highs (right) |
| **Animation** | Each group reacts to its own frequency range independently |
| **Math Concept** | FFT split at midpoint. Left group = bands[0..N/2], Right = bands[N/2..N] |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Great for showing frequency separation clearly |

### B05 — Rounded Pill Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars with fully rounded ends (pill/capsule shape) |
| **Visual Style** | Soft, modern, Apple Music aesthetic |
| **Audio Source** | Full spectrum |
| **Animation** | Same as B01 but with roundRect rendering. Slightly wider bars |
| **Math Concept** | roundRect with radius = barWidth/2 |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Feels more premium than square bars |

### B06 — Horizontal Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars extending horizontally from left edge |
| **Visual Style** | Rotated 90° from classic. Stacked vertically |
| **Audio Source** | Full spectrum |
| **Animation** | Bars grow from left to right based on amplitude |
| **Math Concept** | Same as B01 but x/y axes swapped |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Good for side-panel or widescreen layouts |

### B07 — Dot Matrix Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Each bar is made of stacked dots/circles instead of solid rectangles |
| **Visual Style** | LED display / dot matrix display aesthetic |
| **Audio Source** | Full spectrum |
| **Animation** | Dots light up from bottom to top based on amplitude. Unlit dots shown as dim |
| **Math Concept** | barHeight / dotSize = number of lit dots. Each dot: arc(x, y, dotRadius) |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Classic hardware equalizer look. Optional peak-hold dot |

### B08 — Waterfall / Spectrogram
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Time flows downward. Each frame's spectrum becomes a horizontal line that scrolls down |
| **Visual Style** | Scientific spectrogram. Color-mapped frequency intensity |
| **Audio Source** | Full spectrum |
| **Animation** | New spectrum data appears at top, old data scrolls down. Creates a waterfall of color |
| **Math Concept** | ImageData pixel manipulation. HSL color mapping from amplitude. Vertical scrolling via putImageData offset |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Very unique look. Great for analysis-style aesthetics |

### B09 — 3D Perspective Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars rendered with fake 3D perspective — appears to recede into distance |
| **Visual Style** | Isometric / vanishing point illusion |
| **Audio Source** | Full spectrum |
| **Animation** | Bars closer to viewer appear larger, rear bars smaller. Slight rotation |
| **Math Concept** | Perspective transform: scale = 1 / (1 + z * perspectiveFactor). Isometric projection |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Creates depth without WebGL. Looks very premium |

### B10 — Neon Outline Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Only the outline of bars is drawn, with neon glow effect |
| **Visual Style** | Synthwave / cyberpunk hollow bars with bloom |
| **Audio Source** | Full spectrum |
| **Animation** | Stroking bar outlines with shadowBlur glow. Color shifts on beat |
| **Math Concept** | strokeRect instead of fillRect. shadowBlur = glowIntensity * bassLevel |
| **Difficulty** | Easy |
| **Performance** | Medium (glow is GPU-heavy) |
| **Renderer** | Canvas2D |
| **Notes** | Extremely popular in synthwave/retrowave scenes |

### B11 — Gradient Fill Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Each bar filled with a vertical gradient (e.g., cyan at bottom → magenta at top) |
| **Visual Style** | Colorful, vibrant, modern |
| **Audio Source** | Full spectrum |
| **Animation** | Gradient shifts hue based on overall energy level |
| **Math Concept** | createLinearGradient per bar. Hue rotation: hue = baseHue + (energy * 60) |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Simple but looks far better than solid color |

### B12 — Frequency Terrain Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars rendered as a filled polygon area chart (like mountain terrain) |
| **Visual Style** | Mountain silhouette, smooth peaks |
| **Audio Source** | Full spectrum |
| **Animation** | Smooth interpolation between bar peaks creates flowing mountain shapes |
| **Math Concept** | Bezier curve interpolation between amplitude points. ctx.bezierCurveTo() |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Fill area beneath curve for solid mountain look |

### B13 — Stacked Multi-Band
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Multiple rows of bars, each representing a different frequency band (sub-bass, bass, mids, highs) |
| **Visual Style** | Layered, analytical, color-coded by band |
| **Audio Source** | Sub-bass, Bass, Mids, Highs (separate) |
| **Animation** | Each row reacts only to its frequency band. Different colors per band |
| **Math Concept** | FFT split into 4 bands. Each rendered at different y-offset |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Educational and visually rich |

### B14 — Peak Hold Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Standard bars with a thin line that marks the peak and slowly falls back down |
| **Visual Style** | Classic hardware VU meter look |
| **Audio Source** | Full spectrum |
| **Animation** | Peak line rises instantly, falls slowly with gravity. Bar fills solid below peak |
| **Math Concept** | peakValue = max(currentPeak - gravity * dt, currentAmplitude). Separate peak array |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Essential visualizer. The floating peak line is iconic |

### B15 — Zigzag Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars arranged in a zigzag/chevron pattern rather than straight line |
| **Visual Style** | Dynamic, angular, aggressive |
| **Audio Source** | Full spectrum |
| **Animation** | Bars follow a V or W shaped baseline. Creates angular energy |
| **Math Concept** | baselineY = centerY + sin(i / count * PI) * amplitude. Triangular wave for baseline |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Feels more aggressive than straight bars |

### B16 — Reflected Floor Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Standard bars with a faded reflection below, like standing on a glossy floor |
| **Visual Style** | Premium, polished, Apple keynote aesthetic |
| **Audio Source** | Full spectrum |
| **Animation** | Main bars render normally. Below them, a flipped copy with decreasing opacity |
| **Math Concept** | Render bars. ctx.scale(1, -1) + globalAlpha gradient for reflection |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Adds instant premium feel to any bar style |

### B17 — Histogram Cascade
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Multiple bar rows cascade from front to back, each showing spectrum at a different time offset |
| **Visual Style** | 3D cascading rows, like a spectrogram but rendered as bar rows |
| **Audio Source** | Full spectrum (buffered over time) |
| **Animation** | Newest spectrum at front, older spectrums recede. Creates depth through time |
| **Math Concept** | Ring buffer of last N spectrums. Each rendered with decreasing scale and opacity |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Very impressive when done right. Time-based depth |

### B18 — Fragmented Glitch Bars
| Field | Value |
|-------|-------|
| **Category** | Bars |
| **Description** | Bars that randomly fragment, shift, and glitch on strong beats |
| **Visual Style** | Glitch art, digital corruption, cyberpunk |
| **Audio Source** | Bass + Onset detection |
| **Animation** | On beat: random horizontal displacement, color channel split, scanline artifacts |
| **Math Concept** | Random offset = random() * glitchIntensity * bassLevel. RGB channel separation |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Very trendy. Adds character to simple bar layouts |

---

## Category 2: WAVES (12 Visualizers)

### W01 — Classic Oscilloscope
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Raw waveform displayed as a continuous line, like a classic oscilloscope |
| **Visual Style** | Scientific, green-on-black CRT monitor |
| **Audio Source** | Waveform (time domain) |
| **Animation** | Line traces waveform left to right. Continuous flow |
| **Math Concept** | Direct time-domain data mapping. ctx.lineTo(x, centerY + waveform[i] * scale) |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Foundation waveform visualizer |

### W02 — Smooth Bezier Wave
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Waveform rendered with smooth bezier curves instead of straight line segments |
| **Visual Style** | Organic, fluid, Apple Music style |
| **Audio Source** | Waveform |
| **Animation** | Smooth curves flow and undulate. Feels alive and breathing |
| **Math Concept** | Catmull-Rom or cubic bezier interpolation between sample points |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Much more visually pleasing than jagged oscilloscope |

### W03 — Aurora Waves
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Multiple overlapping semi-transparent waves with aurora-like color shifting |
| **Visual Style** | Aurora borealis, ethereal, dreamy |
| **Audio Source** | Full spectrum (different bands drive different wave layers) |
| **Animation** | 3-5 layered waves, each at different frequencies. Colors shift slowly. Opacity varies |
| **Math Concept** | Multiple sine waves with different frequencies/phases. HSL color cycling. globalAlpha layering |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful ambient visualizer. Great for chill music |

### W04 — Frequency Mountain Range
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | FFT data rendered as a filled mountain range silhouette |
| **Visual Style** | Landscape, horizon, natural |
| **Audio Source** | Full spectrum |
| **Animation** | Mountains rise and fall with frequency. Gradient sky behind |
| **Math Concept** | Bezier-interpolated FFT → filled path. Gradient background |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Great for background behind album art |

### W05 — Double Helix Wave
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Two intertwined sine waves creating a DNA-like double helix pattern |
| **Visual Style** | Scientific, biological, rhythmic |
| **Audio Source** | Waveform + Bass |
| **Animation** | Two waves oscillate with phase offset. Connection lines between them pulse with bass |
| **Math Concept** | wave1 = sin(x + time), wave2 = sin(x + time + PI). Connecting lines at crossover points |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Crosses between Waves and DNA categories |

### W06 — Lissajous Curve
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | X-Y oscilloscope mode. Left channel drives X, right channel drives Y |
| **Visual Style** | Mathematical, hypnotic, scientific |
| **Audio Source** | Stereo waveform |
| **Animation** | Traces Lissajous figures that morph with the music. Trail fading |
| **Math Concept** | x = waveformL[i], y = waveformR[i]. Point plotting with trail decay |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Classic analog oscilloscope technique. Mesmerizing patterns |

### W07 — Waveform Ribbon
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Waveform rendered as a thick, flowing ribbon with depth shading |
| **Visual Style** | 3D ribbon, silk-like, premium |
| **Audio Source** | Waveform |
| **Animation** | Ribbon flows and twists. Thickness varies with amplitude |
| **Math Concept** | Upper edge = wave + thickness, lower edge = wave - thickness. Fill between. Gradient shading for depth |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | More substantial than a thin line |

### W08 — Circular Waveform
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Waveform data mapped around a circle instead of left-to-right |
| **Visual Style** | Orbital, contained, artistic |
| **Audio Source** | Waveform |
| **Animation** | Waveform distorts the radius of a circle. Creates organic blob shapes |
| **Math Concept** | For each angle: radius = baseRadius + waveform[i] * scale. Polar coordinates |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Bridges wave and circle categories |

### W09 — Seismograph
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Waveform scrolls from right to left like a seismograph/ECG machine |
| **Visual Style** | Medical, scientific, monitoring |
| **Audio Source** | Waveform |
| **Animation** | New data appears on right, old data scrolls left. Grid lines in background |
| **Math Concept** | Ring buffer for waveform history. Shift-and-draw technique |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Great for real-time monitoring feel |

### W10 — Layered Depth Waves
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Multiple wave layers at different depths, creating parallax illusion |
| **Visual Style** | Parallax, deep, atmospheric |
| **Audio Source** | Sub-bass (back), Bass (mid), Mids+Highs (front) |
| **Animation** | Back waves move slower, front waves move faster. Depth via opacity and speed |
| **Math Concept** | 3-4 wave layers. Each: amplitude * depthScale, speed * depthScale. Front opaque, back transparent |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Creates beautiful sense of depth |

### W11 — Neon Pulse Line
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Single bright neon line that pulses thickness and glow intensity with beat |
| **Visual Style** | Cyberpunk, Tron, synthwave |
| **Audio Source** | Waveform + BPM |
| **Animation** | Line glows brighter on beats. Thickness pulses. Color cycles |
| **Math Concept** | lineWidth = baseWidth + bassLevel * pulseAmount. shadowBlur = bassLevel * maxGlow |
| **Difficulty** | Easy |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Simple but extremely effective |

### W12 — Polar Rose Wave
| Field | Value |
|-------|-------|
| **Category** | Waves |
| **Description** | Waveform mapped to a polar rose (rhodonea) curve equation |
| **Visual Style** | Mathematical, floral, intricate |
| **Audio Source** | Waveform + Full spectrum |
| **Animation** | Rose petals grow/shrink with frequency. Rotation speed tied to BPM |
| **Math Concept** | r = cos(k * theta) + waveform[i]. k value determines petal count |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful mathematical art |

---

## Category 3: CIRCLE (10 Visualizers)

### C01 — Radial Bars
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Frequency bars arranged radially around a circle, pointing outward |
| **Visual Style** | Sunburst, radial equalizer |
| **Audio Source** | Full spectrum |
| **Animation** | Bars extend outward from circle based on amplitude. Rotation optional |
| **Math Concept** | For each bar i: angle = i * (2PI/N), x = cos(angle)*r, y = sin(angle)*r. Line from (x1,y1) to (x2,y2) |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Most popular circular visualizer style |

### C02 — Radial Inward
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Bars point inward toward center instead of outward |
| **Visual Style** | Implosion, collapsing star |
| **Audio Source** | Full spectrum |
| **Animation** | Bars grow from outer ring toward center. Creates implosion effect |
| **Math Concept** | Reverse direction of C01: bars grow from outerRadius toward center |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Inverse of C01. Surprisingly different visual feel |

### C03 — Dual Radial (In + Out)
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Bars extend both inward and outward from a central ring |
| **Visual Style** | Explosive, starburst, powerful |
| **Audio Source** | Full spectrum |
| **Animation** | Simultaneous in+out growth creates star/explosion shape |
| **Math Concept** | Combine C01 and C02. Each bar renders in both directions from ring |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Very popular style. Looks great with album art in center |

### C04 — Circular Waveform Distortion
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | A circle whose radius is distorted by waveform data, creating organic blob |
| **Visual Style** | Organic, blob, living creature |
| **Audio Source** | Waveform |
| **Animation** | Circle morphs into organic shapes. Smooth bezier interpolation |
| **Math Concept** | radius = baseR + waveform[angle] * intensity. Smooth interpolation between points |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Feels alive. Great reaction to vocals |

### C05 — Concentric Circles
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Multiple concentric circles, each representing a different frequency band |
| **Visual Style** | Target, ripple, radar |
| **Audio Source** | Sub-bass (outer) → Highs (inner) |
| **Animation** | Each ring pulses with its frequency band. Radius oscillates |
| **Math Concept** | N circles, each radius = baseRadius[i] + amplitude[band] * scale |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Clean and informative |

### C06 — Rotating Radial with Trail
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | C01 but slowly rotating. Previous frames leave fading trails |
| **Visual Style** | Spinning, hypnotic, mesmerizing |
| **Audio Source** | Full spectrum + BPM |
| **Animation** | Entire radial rotates. Instead of clearing canvas fully, use semi-transparent overlay for trails |
| **Math Concept** | rotation += rotationSpeed * dt. Clear with fillRect(rgba(0,0,0,0.05)) for trail |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Trail effect is visually stunning |

### C07 — Mirrored Radial Halves
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Top half and bottom half of radial are mirrors of each other |
| **Visual Style** | Symmetric, balanced, medallion |
| **Audio Source** | Full spectrum (mirrored) |
| **Animation** | Only top semicircle data is used; bottom is perfect mirror |
| **Math Concept** | Render 0→PI, then mirror for PI→2PI |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Creates more structured, designed look |

### C08 — Dot Ring
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Instead of bars, dots/circles are placed around a ring, size varies with amplitude |
| **Visual Style** | Bubbly, playful, modern |
| **Audio Source** | Full spectrum |
| **Animation** | Dot size = baseSize + amplitude * scale. Dots breathe and pulse |
| **Math Concept** | arc() at each angular position. radius proportional to FFT value |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | More playful alternative to radial bars |

### C09 — Pulsing Orb
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Large filled circle that pulses size and color with overall energy |
| **Visual Style** | Simple, powerful, hypnotic |
| **Audio Source** | Bass + Energy |
| **Animation** | Circle breathes. Radius = base + bass * scale. Glow intensity with energy |
| **Math Concept** | Smoothed bass mapping to radius. Radial gradient for glow |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Minimalist but impactful. Great behind album art |

### C10 — Spectrum Donut
| Field | Value |
|-------|-------|
| **Category** | Circle |
| **Description** | Thick ring (donut) where segments are colored by frequency amplitude |
| **Visual Style** | Donut chart, colorful, segmented |
| **Audio Source** | Full spectrum |
| **Animation** | Each angular segment's color intensity maps to its frequency |
| **Math Concept** | arc() segments. Color = hsl(hue, 100%, amplitude%). Creates color wheel effect |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Unique approach to circular visualization |

---

## Category 4: RING (10 Visualizers)

### R01 — Neon Ring
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Glowing neon circle outline that pulses with bass |
| **Visual Style** | Synthwave, neon, Tron |
| **Audio Source** | Bass |
| **Animation** | Ring radius pulses with bass. Glow intensity varies. Color shifts |
| **Math Concept** | strokeStyle with shadowBlur. radius = base + bass * pulse |
| **Difficulty** | Easy |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Simple but iconic |

### R02 — Double Ring
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Two concentric rings, inner rotates clockwise, outer counter-clockwise |
| **Visual Style** | Mechanical, gyroscope, orbital |
| **Audio Source** | Bass (inner), Highs (outer) |
| **Animation** | Rings rotate at different speeds. Rotation speed tied to energy |
| **Math Concept** | Two arcs with dashed stroke. Rotation angles update independently |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Dashed or segmented rings look more mechanical |

### R03 — Orbit Dots
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Dots orbiting around a central point like electrons around an atom |
| **Visual Style** | Atomic, scientific, kinetic |
| **Audio Source** | Bass (orbit speed), Highs (dot size) |
| **Animation** | Multiple dots orbit at different radii and speeds. Pulse with frequency |
| **Math Concept** | x = cos(angle + time * speed) * radius. Multiple orbits with different parameters |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Multiple orbital planes for 3D-like feel |

### R04 — Segmented Ring
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Ring broken into segments with gaps. Segments light up with frequency |
| **Visual Style** | Loading indicator, futuristic UI, HUD |
| **Audio Source** | Full spectrum |
| **Animation** | Each segment maps to a frequency band. Brightness/color varies |
| **Math Concept** | arc(startAngle, endAngle) per segment with gaps. Amplitude controls opacity |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Very futuristic / sci-fi aesthetic |

### R05 — Ripple Rings
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | On each beat, a ring expands outward from center and fades away |
| **Visual Style** | Water ripple, sonar, expanding shockwave |
| **Audio Source** | Onset detection / BPM |
| **Animation** | New ring spawned on beat → expands → fades to 0 opacity → dies |
| **Math Concept** | Ring pool: each ring has {radius, opacity, birthTime}. radius += speed*dt, opacity -= decay*dt |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | One of the most satisfying beat-reactive effects |

### R06 — Energy Halo
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Ring made of radial gradient energy. Thicker and brighter at high energy |
| **Visual Style** | Aura, energy field, spiritual |
| **Audio Source** | Energy + Bass |
| **Animation** | Ring thickness and glow intensity increase with energy. Color shifts warm→cool |
| **Math Concept** | Radial gradient ring. Inner and outer radii vary with energy |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Great subtle effect behind album art |

### R07 — Frequency Rings Stack
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Multiple rings stacked at different radii, each pulsing with different frequency band |
| **Visual Style** | Layered, rainbow, scientific |
| **Audio Source** | Sub-bass, Bass, Low-mids, Mids, High-mids, Highs |
| **Animation** | Each ring independently pulses. Different colors per ring |
| **Math Concept** | 6 rings, each with own radius, color, and frequency band |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Colorful and informative |

### R08 — Rotating Gear Ring
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Ring with gear-like teeth that rotate and whose tooth height reacts to audio |
| **Visual Style** | Mechanical, steampunk, industrial |
| **Audio Source** | Full spectrum |
| **Animation** | Gear teeth height = amplitude. Ring rotates. Teeth interlock visually |
| **Math Concept** | Alternating arc segments with varying outer radius based on FFT |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Very unique mechanical aesthetic |

### R09 — Plasma Ring
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Ring filled with animated plasma/energy texture |
| **Visual Style** | Energy, plasma, magical |
| **Audio Source** | Bass + Energy |
| **Animation** | Plasma noise animates around ring circumference. Intensity with energy |
| **Math Concept** | Simplex noise sampled along ring path. Color = hsl(noise * 360 + time) |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | WebGL |
| **Notes** | Requires noise function. Very premium look |

### R10 — Particle Ring
| Field | Value |
|-------|-------|
| **Category** | Ring |
| **Description** | Ring made of hundreds of tiny particles orbiting, density varies with energy |
| **Visual Style** | Cosmic, dusty, ethereal |
| **Audio Source** | Full spectrum |
| **Animation** | Particles orbit with slight random drift. On beat: particles scatter outward |
| **Math Concept** | Particle pool along ring path. Random velocity perturbation on onset |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Beautiful organic feel |

---

## Category 5: SPIRAL (8 Visualizers)

### S01 — Archimedean Spectrum
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | FFT data plotted along an Archimedean spiral |
| **Visual Style** | Mathematical, hypnotic, coiled |
| **Audio Source** | Full spectrum |
| **Animation** | Spiral arm thickness/color varies with frequency. Slow rotation |
| **Math Concept** | r = a + b*theta. Point color/size = amplitude at that frequency index |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Unique way to display spectrum data |

### S02 — Fibonacci Spiral
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | Golden ratio spiral with frequency data affecting curve thickness |
| **Visual Style** | Natural, sacred geometry, elegant |
| **Audio Source** | Full spectrum |
| **Animation** | Spiral grows outward. Thickness pulses with bass. Golden ratio proportions |
| **Math Concept** | r = a * e^(b*theta) where b = ln(phi) / (PI/2). Fibonacci proportions |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Mathematically beautiful |

### S03 — DNA Helix Spiral
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | Two intertwined spirals forming a 3D DNA helix viewed from the side |
| **Visual Style** | Biological, scientific, depth |
| **Audio Source** | Waveform + Bass |
| **Animation** | Helix rotates around vertical axis. Connection lines pulse with bass |
| **Math Concept** | Two sine waves with phase offset + depth shading based on z position |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Fake 3D through depth shading |

### S04 — Vortex Spiral
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | Particles flowing inward along spiral paths toward center, creating vortex |
| **Visual Style** | Black hole, drain, hypnotic |
| **Audio Source** | Energy + Bass |
| **Animation** | Particles spawn at outer edge, spiral inward, disappear at center. Speed with energy |
| **Math Concept** | Polar coordinates: r decreases over time, theta increases. Particle lifespan |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D |
| **Notes** | Very mesmerizing. Like water going down a drain |

### S05 — Spiral Galaxy Arms
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | Multiple spiral arms emanating from center, like a galaxy. Stars along arms |
| **Visual Style** | Cosmic, galactic, grand |
| **Audio Source** | Full spectrum (different arms = different bands) |
| **Animation** | Arms rotate slowly. Star brightness varies with frequency. Nebula colors |
| **Math Concept** | Multiple logarithmic spirals offset by 2PI/armCount. Points scattered along arms |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Spectacular when fully rendered |

### S06 — Tornado Spiral
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | Vertical spiral like a tornado/twister, width varies with frequency |
| **Visual Style** | Storm, power, dynamic |
| **Audio Source** | Full spectrum |
| **Animation** | Spiral constricts and expands. Rotation speed with BPM. Width with bass |
| **Math Concept** | Vertical spiral: x = cos(t)*radius(y), z = sin(t)*radius(y). Projected to 2D |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Dramatic visual. Great for intense music |

### S07 — Spiral Waveform
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | Waveform data wrapped around a spiral instead of displayed linearly |
| **Visual Style** | Vinyl record, artistic, retro |
| **Audio Source** | Waveform |
| **Animation** | Waveform modulates spiral radius as it wraps around. Like grooves on vinyl |
| **Math Concept** | r = a + b*theta + waveform[i]*scale. Theta maps to waveform index |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Conceptually connects to vinyl/record player |

### S08 — Spring Coil
| Field | Value |
|-------|-------|
| **Category** | Spiral |
| **Description** | 3D spring/coil that compresses and stretches with bass |
| **Visual Style** | Mechanical, bouncy, physics |
| **Audio Source** | Bass + Mids |
| **Animation** | Coil compresses on bass hits, stretches back. Wobble animation |
| **Math Concept** | Helix with variable pitch: pitch = basePitch + bass * compressionFactor |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Fun physics-based animation |

---

## Category 6: MANDALA (8 Visualizers)

### M01 — Simple Mandala
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Radial symmetry pattern with 8-fold reflection. Bars reflected in all octants |
| **Visual Style** | Sacred geometry, spiritual, meditative |
| **Audio Source** | Full spectrum |
| **Animation** | Pattern breathes with audio. Slow rotation. Symmetric transformations |
| **Math Concept** | 8-fold symmetry: render once, reflect/rotate 8 times using ctx.transform |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful and calming |

### M02 — Kaleidoscope
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Full kaleidoscope effect: triangular segments mirrored to create infinite pattern |
| **Visual Style** | Psychedelic, infinite, colorful |
| **Audio Source** | Full spectrum + Waveform |
| **Animation** | Core pattern is audio-reactive. Kaleidoscope reflections multiply the complexity |
| **Math Concept** | Render to triangular wedge, then reflect N times. ctx.clip() + ctx.scale(-1,1) |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Very impressive. One of the most visually complex |

### M03 — Geometric Mandala
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Nested geometric shapes (circles, triangles, hexagons) rotating at different speeds |
| **Visual Style** | Sacred geometry, mathematical, intricate |
| **Audio Source** | Bass (outer shapes), Highs (inner shapes) |
| **Animation** | Each geometric layer rotates independently. Size pulses with frequency |
| **Math Concept** | Nested regular polygons. Rotation: angle += speed * (1 + bassLevel) |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Layer count = visual complexity |

### M04 — Flower of Life
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Sacred geometry Flower of Life pattern where circles pulse with frequency |
| **Visual Style** | Spiritual, sacred, ancient |
| **Audio Source** | Full spectrum (different circles = different bands) |
| **Animation** | Circles pulse size and opacity. Central circle = bass. Outer = highs |
| **Math Concept** | 7+ overlapping circles in hex pattern. radius = base + amplitude * scale |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Recognizable sacred geometry symbol |

### M05 — Rose Window
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Gothic cathedral rose window design with audio-reactive stained glass segments |
| **Visual Style** | Gothic, architectural, ornate |
| **Audio Source** | Full spectrum |
| **Animation** | Glass segments glow with frequency intensity. Colors shift like light through glass |
| **Math Concept** | Concentric ring segments with radial divisions. Color intensity = amplitude |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Very unique aesthetic. Great for classical music |

### M06 — Breathing Mandala
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Mandala that slowly inhales/exhales. Expands on beats, contracts between |
| **Visual Style** | Organic, meditative, alive |
| **Audio Source** | Energy + Bass |
| **Animation** | Global scale oscillates like breathing. Beat detection causes expansion spikes |
| **Math Concept** | globalScale = 1 + sin(time * breathRate) * 0.1 + bassLevel * 0.3 |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Combine with any mandala pattern |

### M07 — Spirograph Mandala
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Spirograph (hypotrochoid/epitrochoid) curves driven by audio parameters |
| **Visual Style** | Mathematical, toy, nostalgic |
| **Audio Source** | Full spectrum |
| **Animation** | Curve parameters change with audio. Trail rendering. Color cycling |
| **Math Concept** | x = (R-r)*cos(t) + d*cos((R-r)/r*t). Parameters R,r,d driven by audio |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Mesmerizing mathematical art |

### M08 — Fractal Mandala
| Field | Value |
|-------|-------|
| **Category** | Mandala |
| **Description** | Recursive fractal pattern with audio-reactive recursion depth |
| **Visual Style** | Infinite, complex, mathematical |
| **Audio Source** | Energy (controls recursion depth) |
| **Animation** | Higher energy = deeper recursion = more detail. Bass pulses scale |
| **Math Concept** | Recursive tree/snowflake. maxDepth = floor(3 + energy * 4) |
| **Difficulty** | Expert |
| **Performance** | High |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Must limit recursion for performance. Very impressive |

---

## Category 7: PARTICLE (14 Visualizers)

### P01 — Particle Fountain
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Particles shoot upward from center like a fountain, height varies with bass |
| **Visual Style** | Water fountain, celebration, firework |
| **Audio Source** | Bass (height), Mids (spread), Highs (sparkle) |
| **Animation** | Particles launch upward with velocity, arc downward with gravity. Spawn rate with BPM |
| **Math Concept** | Physics: vy -= gravity*dt, y += vy*dt. Initial velocity proportional to bass |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Classic particle effect. Satisfying physics |

### P02 — Particle Explosion
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | On each beat: burst of particles from center in all directions |
| **Visual Style** | Firework, impact, energetic |
| **Audio Source** | Onset + Bass |
| **Animation** | Burst spawns 50-200 particles. Radial velocity. Fade over 1-2 seconds |
| **Math Concept** | On onset: for each particle: angle = random(0, 2PI), speed = random(min,max) * bassLevel |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Must recycle particles from pool for performance |

### P03 — Floating Fireflies
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Gentle floating dots that drift like fireflies. Brightness pulses with audio |
| **Visual Style** | Ambient, magical, forest |
| **Audio Source** | Mids + Highs |
| **Animation** | Brownian motion drift. Individual brightness oscillation. Gentle flicker |
| **Math Concept** | Position += random(-drift, drift). Brightness = sin(time * freq + phase) |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful ambient background effect |

### P04 — Starfield Warp
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Stars rushing toward camera (Star Wars hyperspace). Speed tied to bass |
| **Visual Style** | Space, warp speed, sci-fi |
| **Audio Source** | Bass (speed), Energy (star density) |
| **Animation** | Stars start at center, move outward with perspective scaling. Speed bursts on beats |
| **Math Concept** | 3D projection: screenX = (x/z)*fov, screenY = (y/z)*fov. z decreases over time |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Classic effect. Very satisfying at high speeds |

### P05 — Rain
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Raindrops falling downward. Intensity and speed tied to audio energy |
| **Visual Style** | Weather, melancholic, atmospheric |
| **Audio Source** | Energy (intensity), Bass (splash) |
| **Animation** | Lines fall vertically. On impact: tiny splash particles. Intensity varies |
| **Math Concept** | y += fallSpeed. Line length proportional to speed. Splash = mini particle burst at bottom |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Great for moody/sad music |

### P06 — Snow
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Snowflakes drifting down with gentle sideways motion. Speed with tempo |
| **Visual Style** | Winter, gentle, seasonal |
| **Audio Source** | Mids (drift), BPM (fall speed) |
| **Animation** | Gentle descent with sine-wave horizontal drift. Size varies. Some rotate |
| **Math Concept** | x += sin(time * driftFreq + phase) * driftAmount. y += fallSpeed |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Seasonal/holiday visualizer. Can use unicode snowflake chars |

### P07 — Particle Vortex
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Particles caught in a spiral vortex, orbiting and being pulled toward center |
| **Visual Style** | Tornado, whirlpool, cosmic |
| **Audio Source** | Bass (pull strength), BPM (rotation speed) |
| **Animation** | Particles orbit with decreasing radius. Trail rendering. Color based on velocity |
| **Math Concept** | Angular velocity increases as radius decreases (conservation of angular momentum) |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Very hypnotic |

### P08 — Gravity Wells
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Multiple gravity points attract particles. Gravity strength tied to frequency bands |
| **Visual Style** | Physics simulation, orbital mechanics |
| **Audio Source** | Multiple bands (each well = one band) |
| **Animation** | Particles orbit around wells. Wells pulse with their frequency |
| **Math Concept** | F = G * m / r^2 toward each well. Multiple body simulation |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D |
| **Notes** | Emergent patterns from simple physics |

### P09 — Confetti Burst
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Rectangular confetti pieces burst upward on beat, flutter down with physics |
| **Visual Style** | Celebration, party, joyful |
| **Audio Source** | Onset + Energy |
| **Animation** | Burst upward on beat. Flutter with rotation while falling. Air resistance |
| **Math Concept** | Rotation += rotSpeed. Air drag: vy *= 0.99. Random tumble axis |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Great for happy/party music. Colorful rectangles |

### P10 — Ember / Spark Trail
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Hot embers/sparks rise upward like from a campfire. Intensity with bass |
| **Visual Style** | Warm, fire, campfire |
| **Audio Source** | Bass + Energy |
| **Animation** | Particles rise, drift sideways, shrink, fade from orange→red→dark. More particles on beats |
| **Math Concept** | Rise: vy = -speed. Drift: vx += wind. Size decreases. Color cools (orange→red→0) |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Warm atmospheric effect |

### P11 — Particle Wave
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Grid of particles displaced vertically by a traveling sine wave |
| **Visual Style** | Wave, fabric, cloth simulation |
| **Audio Source** | Waveform + Bass |
| **Animation** | Sine wave travels through particle grid. Amplitude from audio. Connections between neighbors |
| **Math Concept** | y[i] = sin(x[i] * freq - time * speed) * amplitude. Draw lines between adjacent particles |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful cloth-like effect |

### P12 — Particle Text
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Text formed by particles. On beat, particles scatter, then reform |
| **Visual Style** | Typography, kinetic, dramatic |
| **Audio Source** | Onset (scatter), Energy (reform speed) |
| **Animation** | Particles at text pixel positions. On beat: scatter outward. Between beats: return to positions |
| **Math Concept** | Sample text onto canvas, find pixel positions. Particle targets. Lerp back to target |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D |
| **Notes** | Can display song title or custom text |

### P13 — Smoke Plume
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Smoke-like particles rising from bottom, spreading and fading |
| **Visual Style** | Smoky, hazy, atmospheric |
| **Audio Source** | Bass (density), Mids (turbulence) |
| **Animation** | Large soft circles rise, expand, fade. Brownian drift. Blend mode multiply |
| **Math Concept** | Size grows over lifetime. Opacity decreases. Noise-based drift |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Use globalCompositeOperation for blending |

### P14 — Constellation
| Field | Value |
|-------|-------|
| **Category** | Particle |
| **Description** | Dots connected by lines when close to each other. Density and movement with audio |
| **Visual Style** | Network, connected, scientific |
| **Audio Source** | Energy (movement speed), Bass (connection distance) |
| **Animation** | Dots drift randomly. Lines drawn between nearby dots. Line opacity = proximity |
| **Math Concept** | For each pair: dist = sqrt(dx²+dy²). If dist < threshold: draw line with alpha = 1 - dist/threshold |
| **Difficulty** | Medium |
| **Performance** | High (O(n²) pairs) |
| **Renderer** | Canvas2D |
| **Notes** | Cap particle count at ~100 for performance |

---

## Category 8: GALAXY (8 Visualizers)

### G01 — Star Cluster
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Dense cluster of stars with varying brightness. Twinkle with highs |
| **Visual Style** | Deep space, cosmic, serene |
| **Audio Source** | Highs (twinkle), Bass (global brightness) |
| **Animation** | Stars twinkle (random brightness oscillation). Global brightness pulses with bass |
| **Math Concept** | brightness = baseBright * (0.5 + 0.5 * sin(time * freq + randomPhase)) * bassLevel |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Ambient background. Thousands of tiny dots |

### G02 — Nebula
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Colorful gas cloud effect using layered transparent circles |
| **Visual Style** | Hubble photos, cosmic, colorful |
| **Audio Source** | Full spectrum (different colors = different bands) |
| **Animation** | Soft large circles slowly drift and pulse. Colors shift. Opacity varies with amplitude |
| **Math Concept** | Multiple large blurred circles with globalAlpha. Blend mode 'lighter' or 'screen' |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful ambient effect. Composite blending is key |

### G03 — Solar System
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Planets orbiting a central star. Orbit speed tied to BPM |
| **Visual Style** | Astronomical, educational, kinetic |
| **Audio Source** | BPM (orbit speed), Bass (sun size), Bands (planet sizes) |
| **Animation** | Planets orbit at different radii and speeds. Sun pulses with bass |
| **Math Concept** | Circular orbits: x = cos(angle*speed)*radius. Planet size = amplitude |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | 5-8 orbiting bodies |

### G04 — Black Hole Accretion
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Particle accretion disk around a black hole. Gravitational lensing effect |
| **Visual Style** | Interstellar, dramatic, dark |
| **Audio Source** | Bass (gravity), Energy (particle emission) |
| **Animation** | Particles spiral into center void. Accretion disk glows. Time dilation at edge |
| **Math Concept** | Particles lose energy (radius decreases) over time. Color shifts blue→red near event horizon |
| **Difficulty** | Expert |
| **Performance** | High |
| **Renderer** | WebGL |
| **Notes** | Premium visualizer. Very impressive |

### G05 — Comet Trail
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Bright dot streaks across screen with a glowing tail. Path follows audio contour |
| **Visual Style** | Comet, shooting star, dramatic |
| **Audio Source** | Waveform (path), Bass (tail brightness) |
| **Animation** | Lead particle moves along waveform-shaped path. Trail of fading dots behind |
| **Math Concept** | Trail: store last N positions. Draw with decreasing size/opacity from head to tail |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Simple but visually striking |

### G06 — Aurora Borealis
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Northern lights effect — curtains of colored light swaying with audio |
| **Visual Style** | Arctic, ethereal, natural wonder |
| **Audio Source** | Full spectrum (drives curtain shape), Energy (brightness) |
| **Animation** | Vertical curtains of light undulate. Colors shift green→purple→pink. Height varies |
| **Math Concept** | Multiple vertical sine waves with noise perturbation. Gradient fills. Additive blending |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | One of the most beautiful natural phenomena to simulate |

### G07 — Meteor Shower
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Meteors streak across dark sky on beats. Trails burn and fade |
| **Visual Style** | Night sky, dramatic, transient |
| **Audio Source** | Onset (trigger), Bass (meteor size) |
| **Animation** | On onset: spawn meteor at random position/angle. Streak across with glowing trail. Fade |
| **Math Concept** | Line rendering with gradient trail. Speed proportional to bass. Random angle |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Sporadic, event-driven visualizer |

### G08 — Cosmic Dust
| Field | Value |
|-------|-------|
| **Category** | Galaxy |
| **Description** | Vast field of tiny particles drifting through space with parallax depth |
| **Visual Style** | Deep space, vast, atmospheric |
| **Audio Source** | Energy (drift speed), Highs (shimmer) |
| **Animation** | Multiple particle layers at different depths. Parallax scrolling. Gentle shimmer |
| **Math Concept** | 3 depth layers. Speed[layer] = baseSpeed * depthFactor. Size inversely proportional to depth |
| **Difficulty** | Easy |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Great subtle background |

---

## Category 9: TUNNEL (8 Visualizers)

### T01 — Square Tunnel
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Concentric squares that shrink toward center, creating tunnel illusion |
| **Visual Style** | Geometric, hypnotic, retro |
| **Audio Source** | Bass (speed), Full spectrum (square sizes) |
| **Animation** | Squares spawn at edges, shrink to center, disappear. Speed with BPM |
| **Math Concept** | Squares with decreasing size. Each frame: size *= shrinkFactor. Perspective via size |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Simple but mesmerizing |

### T02 — Circle Tunnel
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Concentric circles creating a cylindrical tunnel effect |
| **Visual Style** | Cylindrical, smooth, flowing |
| **Audio Source** | Bass (speed), Full spectrum (ring brightness) |
| **Animation** | Circles spawn at large radius, shrink to center. Creates forward motion illusion |
| **Math Concept** | Same as T01 but with circles. Stroke width thins with depth |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Classic VJ effect |

### T03 — Hexagon Tunnel
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Hexagonal tunnel with sci-fi aesthetic |
| **Visual Style** | Sci-fi, futuristic, honeycomb |
| **Audio Source** | Full spectrum + BPM |
| **Animation** | Hex shapes approach camera. Rotation. Color bands |
| **Math Concept** | Regular hexagon with radius decreasing per depth step |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Unique shape creates different feel than circles/squares |

### T04 — Wormhole
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Distorted tunnel with organic warping. Edges undulate with audio |
| **Visual Style** | Sci-fi, psychedelic, warped space |
| **Audio Source** | Full spectrum (edge distortion), Bass (speed) |
| **Animation** | Tunnel rings are not perfect circles but noise-distorted. Creates organic wormhole |
| **Math Concept** | Ring radius modulated by noise: r = baseR + noise(angle, time) * amplitude |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D or WebGL |
| **Notes** | Very premium. Needs noise function |

### T05 — Grid Tunnel
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Wireframe grid receding into distance (Tron-style infinite floor) |
| **Visual Style** | Retro, synthwave, Tron, vaporwave |
| **Audio Source** | Bass (grid pulse), BPM (scroll speed) |
| **Animation** | Grid lines scroll toward camera. Grid pulses vertically on bass. Neon colors |
| **Math Concept** | Perspective projection of grid. y-offset scrolls. Vertical displacement with bass |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | ICONIC synthwave aesthetic. Must-have |

### T06 — Neon Corridor
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | First-person view down a neon-lit corridor. Light strips on walls pulse |
| **Visual Style** | Cyberpunk, nightclub, corridor |
| **Audio Source** | Full spectrum (individual light strips) |
| **Animation** | Light strips on walls flash sequentially with frequency. Forward motion |
| **Math Concept** | Trapezoid perspective. Light strips as colored rectangles shrinking to vanishing point |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Very immersive. Creates strong sense of space |

### T07 — Particle Tunnel
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Thousands of particles forming a hollow cylinder, camera moving through it |
| **Visual Style** | Cosmic, dense, immersive |
| **Audio Source** | Bass (speed), Highs (particle brightness) |
| **Animation** | Particles on cylinder surface rush toward camera. New particles spawn at far end |
| **Math Concept** | Cylindrical coordinates: x = cos(theta)*R, y = sin(theta)*R, z. Perspective projection |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | WebGL or Canvas2D |
| **Notes** | Very impressive. Need 1000+ particles |

### T08 — Fractal Tunnel
| Field | Value |
|-------|-------|
| **Category** | Tunnel |
| **Description** | Recursive pattern creating infinite tunnel zoom (Mandelbrot/Julia set zoom) |
| **Visual Style** | Mathematical, infinite, psychedelic |
| **Audio Source** | Energy (zoom speed), Bass (color intensity) |
| **Animation** | Continuous zoom into fractal. Color cycling. Audio controls zoom speed |
| **Math Concept** | Mandelbrot set zoom: z = z² + c with continuously decreasing view window |
| **Difficulty** | Expert |
| **Performance** | Ultra |
| **Renderer** | WebGL (shader) |
| **Notes** | Requires GPU. Most computationally intensive visualizer |

---

## Category 10: RIBBON (8 Visualizers)

### RB01 — Flowing Ribbon
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Thick flowing ribbon that undulates through space |
| **Visual Style** | Silk, elegant, flowing |
| **Audio Source** | Waveform + Bass |
| **Animation** | Ribbon follows sine wave path. Width pulses with bass. Gradient color |
| **Math Concept** | Upper/lower edges defined by wave ± thickness. Fill between curves |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Elegant and mesmerizing |

### RB02 — Multi-Ribbon
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Multiple parallel ribbons, each reacting to different frequency band |
| **Visual Style** | Layered, colorful, woven |
| **Audio Source** | Multiple bands (one per ribbon) |
| **Animation** | Ribbons weave over/under each other. Each pulses with its own frequency |
| **Math Concept** | Multiple wave paths with phase offsets. Depth ordering changes at crossover points |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Visual complexity from simple elements |

### RB03 — Möbius Strip
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | 3D Möbius strip that rotates and twists with audio |
| **Visual Style** | Mathematical, surreal, mind-bending |
| **Audio Source** | Bass (rotation speed), Mids (twist amount) |
| **Animation** | Continuous rotation reveals the single-sided surface. Twist varies with mids |
| **Math Concept** | Parametric Möbius strip equations projected to 2D |
| **Difficulty** | Expert |
| **Performance** | Medium |
| **Renderer** | Three.js |
| **Notes** | True 3D required for proper rendering |

### RB04 — Light Trail
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Bright point moves in curves, leaving a glowing persistent trail |
| **Visual Style** | Light painting, long exposure, neon |
| **Audio Source** | Waveform (path), Bass (brightness) |
| **Animation** | Lead point follows audio-driven path. Trail persists with slow fade |
| **Math Concept** | No clear between frames. Semi-transparent black overlay for trail decay |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Simple but creates beautiful patterns over time |

### RB05 — Frequency Curtain
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Vertical strips hanging like a curtain, each swaying based on its frequency |
| **Visual Style** | Theatre curtain, elegant, dramatic |
| **Audio Source** | Full spectrum (each strip = one band) |
| **Animation** | Strips sway sideways with amplitude. Gentle wave motion through curtain |
| **Math Concept** | Each strip: xOffset = sin(time + i * spacing) * amplitude[i]. Bezier for smooth curves |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Looks like fabric in wind |

### RB06 — Infinity Loop
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Figure-8 / infinity symbol traced by a flowing ribbon |
| **Visual Style** | Symbolic, continuous, elegant |
| **Audio Source** | Bass (size), Mids (ribbon width) |
| **Animation** | Ribbon continuously traces infinity shape. Trail rendering. Size pulses |
| **Math Concept** | Lemniscate of Bernoulli: r² = a²cos(2θ). Parametric: x = cos(t)/(1+sin²(t)) |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Elegant mathematical curve |

### RB07 — Helix Ribbon
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Ribbon twisted into a helix, rotating on its axis |
| **Visual Style** | 3D, DNA-like, barber pole |
| **Audio Source** | Bass (rotation speed), Full spectrum (color) |
| **Animation** | Helix rotates. Ribbon faces camera periodically. Depth shading |
| **Math Concept** | Helix parametric equations. Front/back face detection for depth illusion |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Fake 3D through shading |

### RB08 — Calligraphy Stroke
| Field | Value |
|-------|-------|
| **Category** | Ribbon |
| **Description** | Brush stroke that paints across the canvas. Thickness and opacity from audio |
| **Visual Style** | Artistic, calligraphy, painted |
| **Audio Source** | Waveform (path), Bass (pressure/thickness) |
| **Animation** | Stroke follows waveform-driven path. Thickness varies (like pressure-sensitive pen) |
| **Math Concept** | Variable-width stroke: perpendicular offset = amplitude at each point |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Very artistic. Great for ambient/classical |

---

## Category 11: DNA (5 Visualizers)

### D01 — Classic Double Helix
| Field | Value |
|-------|-------|
| **Category** | DNA |
| **Description** | Standard DNA double helix with base pair connections |
| **Visual Style** | Scientific, biological, educational |
| **Audio Source** | Full spectrum |
| **Animation** | Helix rotates. Connection lines pulse with frequency. Color-coded base pairs |
| **Math Concept** | Two phase-offset sine waves. Connections at regular intervals. Depth via size/opacity |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Classic scientific visualization |

### D02 — DNA Unwinding
| Field | Value |
|-------|-------|
| **Category** | DNA |
| **Description** | DNA strand that unwinds/separates on heavy bass hits |
| **Visual Style** | Dynamic, biological, dramatic |
| **Audio Source** | Bass (unwinding), Mids (wobble) |
| **Animation** | Normal helix. On bass: strands separate. Between beats: re-form |
| **Math Concept** | Phase difference increases with bass: phase = baseDiff + bassLevel * separationFactor |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Adds drama to basic DNA |

### D03 — Protein Fold
| Field | Value |
|-------|-------|
| **Category** | DNA |
| **Description** | Abstract protein-like structure that folds and unfolds with audio |
| **Visual Style** | Organic, abstract, scientific |
| **Audio Source** | Energy (fold complexity), Bass (movement) |
| **Animation** | Chain of connected segments. Joint angles change with audio. Folds into compact shapes |
| **Math Concept** | Forward kinematics chain: each segment angle = baseAngle + amplitude * scale |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Unique bio-inspired animation |

### D04 — Chromosome
| Field | Value |
|-------|-------|
| **Category** | DNA |
| **Description** | X-shaped chromosome that pulses and glows |
| **Visual Style** | Biological, microscopic, glowing |
| **Audio Source** | Bass + Energy |
| **Animation** | X-shape breathes/pulses. Glow intensity with energy. Subtle rotation |
| **Math Concept** | Two crossed bezier curves. Scale and glow driven by audio |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Simple but recognizable shape |

### D05 — Neural Network
| Field | Value |
|-------|-------|
| **Category** | DNA |
| **Description** | Network of neurons with synaptic connections that fire with audio events |
| **Visual Style** | Neuroscience, network, organic connections |
| **Audio Source** | Onset (fire), Full spectrum (connection strength) |
| **Animation** | Nodes connected by lines. On onset: random connections flash brightly (synapse firing) |
| **Math Concept** | Graph structure. Random activation propagation. Flash = temporary bright glow |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | Canvas2D |
| **Notes** | Fascinating emergent behavior |

---

## Category 12: GEOMETRY (12 Visualizers)

### GE01 — Rotating Cube
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Wireframe cube rotating in 3D space |
| **Visual Style** | Mathematical, clean, dimensional |
| **Audio Source** | Bass (rotation speed), Mids (scale) |
| **Animation** | Continuous X/Y/Z rotation. Scale pulses with mids |
| **Math Concept** | 3D rotation matrices: Rx, Ry, Rz. Perspective projection |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Classic 3D wireframe demo |

### GE02 — Morphing Polygon
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Polygon that smoothly morphs between triangle → square → pentagon → hex → circle |
| **Visual Style** | Fluid, transformative, mathematical |
| **Audio Source** | Energy (morph progress), Bass (size) |
| **Animation** | Vertex count interpolates between shapes. Smooth transitions |
| **Math Concept** | Vertex interpolation: lerp between polygon vertex sets. Regular polygon formulas |
| **Difficulty** | Hard |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Mesmerizing shape-shifting |

### GE03 — Sacred Geometry Grid
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Metatron's Cube / Sri Yantra / Seed of Life overlay with pulsing elements |
| **Visual Style** | Spiritual, mathematical, ancient |
| **Audio Source** | Full spectrum |
| **Animation** | Individual geometric elements pulse and glow with different frequency bands |
| **Math Concept** | Pre-defined sacred geometry vertex positions. Line drawing with glow |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Niche but very popular in certain communities |

### GE04 — Tessellation
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Repeating geometric tile pattern that pulses colors with frequency |
| **Visual Style** | Islamic art, mosaic, pattern |
| **Audio Source** | Full spectrum (tile colors) |
| **Animation** | Individual tiles change color/brightness based on their mapped frequency |
| **Math Concept** | Regular tiling (hex, triangle, or square grid). Color mapping from FFT |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful pattern art |

### GE05 — Platonic Solids
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Tetrahedron / Octahedron / Icosahedron wireframe rotating with audio |
| **Visual Style** | Mathematical, clean, 3D |
| **Audio Source** | Bass (rotation), Mids (scale), Energy (which solid) |
| **Animation** | Morphs between different platonic solids based on energy level |
| **Math Concept** | Predefined vertex sets for each solid. 3D rotation + perspective projection |
| **Difficulty** | Hard |
| **Performance** | Medium |
| **Renderer** | Canvas2D or Three.js |
| **Notes** | Advanced geometry. Impressive |

### GE06 — Sierpinski Triangle
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Fractal Sierpinski triangle with recursion depth tied to energy |
| **Visual Style** | Fractal, mathematical, infinite |
| **Audio Source** | Energy (depth), Bass (scale) |
| **Animation** | Higher energy = deeper recursion = more triangles. Slow rotation. Color cycling |
| **Math Concept** | Recursive subdivision: each triangle → 3 smaller triangles. Depth = 2-7 |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Classic fractal. Must limit depth for performance |

### GE07 — Hexagonal Grid
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Honeycomb hex grid where each cell lights up based on frequency |
| **Visual Style** | Futuristic, cellular, sci-fi |
| **Audio Source** | Full spectrum (mapped to grid cells) |
| **Animation** | Cells glow from center outward in rings. Color and intensity from FFT |
| **Math Concept** | Hex grid layout. Distance from center maps to frequency band |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Great sci-fi / HUD aesthetic |

### GE08 — Pulsing Triangles
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Nested concentric triangles that pulse in and out |
| **Visual Style** | Geometric, rhythmic, hypnotic |
| **Audio Source** | Bass (pulse), Full spectrum (individual triangle sizes) |
| **Animation** | Triangles breathe in/out. Each reacts to different band. Rotation |
| **Math Concept** | Regular triangle with scale factor. Scale = 1 + amplitude * 0.3 |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Simple and effective |

### GE09 — Voronoi Cells
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Dynamic Voronoi diagram with cell colors driven by audio |
| **Visual Style** | Organic, cellular, scientific |
| **Audio Source** | Full spectrum (cell colors) |
| **Animation** | Cell seed points drift slowly. Voronoi recalculates. Colors pulse |
| **Math Concept** | Voronoi diagram: for each pixel, find nearest seed. Color by seed's mapped frequency |
| **Difficulty** | Expert |
| **Performance** | Ultra |
| **Renderer** | WebGL (shader) |
| **Notes** | GPU-only for real-time. Very premium look |

### GE10 — Rotating Star
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Multi-pointed star that rotates and whose point lengths react to audio |
| **Visual Style** | Starburst, energetic, bold |
| **Audio Source** | Full spectrum (each point = one band) |
| **Animation** | Star rotates. Point lengths vary with frequency amplitude |
| **Math Concept** | Alternating inner/outer radius points. outerR[i] = base + amplitude[i] * scale |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Fun and dynamic |

### GE11 — Penrose Triangle
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Impossible Penrose triangle that appears to rotate in 3D |
| **Visual Style** | Optical illusion, impossible geometry |
| **Audio Source** | Bass (rotation), Mids (color shift) |
| **Animation** | Apparent 3D rotation of impossible object. Color transitions |
| **Math Concept** | Pre-computed vertex animation frames for impossible object illusion |
| **Difficulty** | Hard |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Mind-bending optical illusion |

### GE12 — Koch Snowflake
| Field | Value |
|-------|-------|
| **Category** | Geometry |
| **Description** | Koch snowflake fractal with audio-reactive iteration depth |
| **Visual Style** | Fractal, crystalline, snowflake |
| **Audio Source** | Energy (depth), Bass (scale) |
| **Animation** | Fractal depth increases with energy. Rotation. Size pulses |
| **Math Concept** | Each edge → 4 edges (Koch iteration). Depth 1-6 based on energy |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful mathematical snowflake |

---

## Category 13: NEON (10 Visualizers)

### N01 — Neon Bars
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Standard bars with heavy neon glow and bloom effect |
| **Visual Style** | Cyberpunk, nightclub, synthwave |
| **Audio Source** | Full spectrum |
| **Animation** | Bars with exaggerated shadowBlur. Color shifts. Glow intensity with bass |
| **Math Concept** | shadowBlur = 20 + bassLevel * 40. shadowColor matches strokeStyle |
| **Difficulty** | Easy |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Transform any visualizer into neon with glow |

### N02 — Neon Sign
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Text rendered as a neon sign. Letters flicker and buzz with audio |
| **Visual Style** | Bar sign, vintage neon, nostalgic |
| **Audio Source** | Energy (brightness), Onset (flicker) |
| **Animation** | Neon text glows. Random letter flickers. Buzz on beats |
| **Math Concept** | Font rendering with shadowBlur. Random opacity flicker: alpha = 0.3 + random() * 0.7 |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Can display song title, artist name, or custom text |

### N03 — Neon Grid
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Glowing grid lines (synthwave aesthetic) with vertical displacement from audio |
| **Visual Style** | Synthwave, retrowave, 80s |
| **Audio Source** | Full spectrum + Bass |
| **Animation** | Horizontal grid scrolls forward. Vertical lines pulse. Grid warps with bass |
| **Math Concept** | Perspective grid + vertical displacement: y += sin(x) * amplitude |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | THE synthwave look. Essential |

### N04 — Neon Heartbeat
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | ECG/heartbeat line with neon glow. Peaks on beats |
| **Visual Style** | Medical, neon, dramatic |
| **Audio Source** | BPM (heartbeat timing), Bass (peak height) |
| **Animation** | Flat line punctuated by sharp peaks on beats. Neon trail. Heart rate display |
| **Math Concept** | Scrolling line with programmatic spikes at BPM intervals |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Very dramatic. Great for EDM |

### N05 — Neon Circles
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Multiple neon circles of different sizes floating and pulsing |
| **Visual Style** | Bokeh, city lights, dreamy |
| **Audio Source** | Full spectrum (each circle = one band) |
| **Animation** | Circles drift slowly. Size and glow pulse with frequency. Additive blending |
| **Math Concept** | N circles with random positions. Radius = base + amplitude * scale. Glow |
| **Difficulty** | Easy |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Beautiful and simple |

### N06 — Neon Polygon Outline
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Single rotating polygon outline (triangle, hex, etc.) with heavy neon glow |
| **Visual Style** | Geometric neon, clean, bold |
| **Audio Source** | Bass (size pulse), Mids (rotation speed) |
| **Animation** | Polygon rotates. Size pulses on beat. Glow intensity varies |
| **Math Concept** | Regular polygon stroke with shadowBlur. Configurable vertex count |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Configurable: 3 (triangle) to 12 (dodecagon) |

### N07 — Laser Beams
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Laser beams shooting from edges in sync with beat. Scan across screen |
| **Visual Style** | Concert, laser show, dramatic |
| **Audio Source** | Onset (trigger), Full spectrum (beam angles) |
| **Animation** | On beat: beams shoot from edges at angles defined by spectrum. Persist briefly, fade |
| **Math Concept** | Line from edge point at angle. angle = (amplitude / 255) * PI. Fade over 500ms |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Concert/club laser simulation |

### N08 — Neon Wave Stack
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Multiple horizontal neon lines stacked vertically, each a different frequency wave |
| **Visual Style** | Synthwave horizon, layered |
| **Audio Source** | Multiple bands |
| **Animation** | Each line undulates based on its frequency band. Different neon colors |
| **Math Concept** | Multiple sine waves with different frequencies, vertically offset |
| **Difficulty** | Easy |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Simple but effective layered look |

### N09 — Electric Arc
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Electrical arcs/lightning between two points. Intensity with bass |
| **Visual Style** | Tesla coil, electricity, powerful |
| **Audio Source** | Bass (intensity), Energy (arc count) |
| **Animation** | Jagged random lines between two points. Regenerate every frame. More arcs on beats |
| **Math Concept** | Midpoint displacement algorithm for lightning. Recursive subdivision with random offset |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Very dramatic effect |

### N10 — Neon Infinity
| Field | Value |
|-------|-------|
| **Category** | Neon |
| **Description** | Neon infinity symbol that pulses and glows |
| **Visual Style** | Symbolic, eternal, neon sign |
| **Audio Source** | Bass (glow), BPM (pulse) |
| **Animation** | Infinity traced continuously. Glow pulses on beat. Color shifts |
| **Math Concept** | Lemniscate parametric equation with neon rendering |
| **Difficulty** | Easy |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Elegant neon symbol |

---

## Category 14: SPEAKER (5 Visualizers)

### SP01 — Speaker Cone
| Field | Value |
|-------|-------|
| **Category** | Speaker |
| **Description** | Realistic speaker cone that pushes in/out with bass |
| **Visual Style** | Physical, hardware, realistic |
| **Audio Source** | Bass (cone displacement) |
| **Animation** | Concentric circles simulate speaker cone. Center moves forward/back with bass |
| **Math Concept** | Concentric circles with varying radius based on bass displacement |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Physical/realistic aesthetic |

### SP02 — Woofer Vibration
| Field | Value |
|-------|-------|
| **Category** | Speaker |
| **Description** | Close-up of speaker membrane vibrating with actual waveform |
| **Visual Style** | Ultra-realistic, macro, physical |
| **Audio Source** | Waveform (membrane shape) |
| **Animation** | Speaker surface deforms with waveform data. Ripples from center |
| **Math Concept** | Circular grid displaced by waveform. 2D wave equation simulation |
| **Difficulty** | Hard |
| **Performance** | High |
| **Renderer** | WebGL |
| **Notes** | Very impressive physically accurate simulation |

### SP03 — Vintage Radio
| Field | Value |
|-------|-------|
| **Category** | Speaker |
| **Description** | Retro radio/amp with VU meters and frequency display |
| **Visual Style** | Vintage, nostalgic, hardware |
| **Audio Source** | Full spectrum + Energy |
| **Animation** | VU needle moves with energy. Small spectrum display. Tube glow |
| **Math Concept** | Needle angle = energy * maxAngle. Mini spectrum bars. Decorative elements |
| **Difficulty** | Medium |
| **Performance** | Low |
| **Renderer** | Canvas2D |
| **Notes** | Skeuomorphic design. Great nostalgic feel |

### SP04 — Sound Pressure
| Field | Value |
|-------|-------|
| **Category** | Speaker |
| **Description** | Visualization of sound pressure waves emanating from a point source |
| **Visual Style** | Physics, ripple, propagation |
| **Audio Source** | Waveform + Bass |
| **Animation** | Concentric pressure waves expand outward from center. Wavelength and amplitude from audio |
| **Math Concept** | Expanding circles with radius = speed * age. Opacity = 1 / (1 + age). Wavelength from FFT |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Educational and beautiful |

### SP05 — Turntable
| Field | Value |
|-------|-------|
| **Category** | Speaker |
| **Description** | Vinyl record spinning on turntable. Speed tied to BPM. Needle bounces |
| **Visual Style** | DJ, vinyl, nostalgic |
| **Audio Source** | BPM (rotation speed), Waveform (needle bounce) |
| **Animation** | Record spins. Grooves shimmer. Tonearm needle vibrates with waveform |
| **Math Concept** | Rotating concentric circles for grooves. Tonearm as rotated line. Speed = BPM / 33.33 |
| **Difficulty** | Medium |
| **Performance** | Medium |
| **Renderer** | Canvas2D |
| **Notes** | Great for DJ/hip-hop aesthetic |

---

## Categories 15-25 (Condensed for Space)

### Category 15: MATRIX (6)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| MX01 | Digital Rain | Matrix-style falling characters. Speed with BPM | Canvas2D | Medium |
| MX02 | Binary Stream | Falling 0s and 1s. Density with energy | Canvas2D | Easy |
| MX03 | Data Grid | Grid of numbers updating in real-time with FFT values | Canvas2D | Easy |
| MX04 | Scan Lines | Horizontal scan lines sweeping vertically, brightness from spectrum | Canvas2D | Easy |
| MX05 | Circuit Board | Circuit trace patterns that light up with frequency | Canvas2D | Hard |
| MX06 | Terminal | Command-line style scrolling text showing audio analysis in real-time | Canvas2D | Medium |

### Category 16: TERRAIN (8)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| TR01 | Mountain Range | FFT as mountain silhouette with sky gradient | Canvas2D | Medium |
| TR02 | Cityscape | City skyline with building heights from FFT. Window lights | Canvas2D | Medium |
| TR03 | Ocean Waves | Ocean surface rendered with sine waves and foam. Wind with energy | Canvas2D | Hard |
| TR04 | Wireframe Terrain | 3D wireframe mesh scrolling toward camera. Height from FFT | Canvas2D/WebGL | Hard |
| TR05 | Desert Dunes | Sand dune silhouettes that shift with bass | Canvas2D | Medium |
| TR06 | Crystal Cave | Stalactites and stalagmites with crystal glow from spectrum | Canvas2D | Hard |
| TR07 | Volcanic | Volcano with lava erupting on bass hits | Canvas2D | Hard |
| TR08 | Underwater | Underwater scene with bubbles rising on beats | Canvas2D | Medium |

### Category 17: ABSTRACT (10)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| AB01 | Perlin Flow Field | Particles following Perlin noise flow field | Canvas2D | Hard |
| AB02 | Ink Drop | Ink spreading in water simulation | Canvas2D | Hard |
| AB03 | Color Blobs | Large colored blobs merging and separating (metaballs) | WebGL | Expert |
| AB04 | Noise Texture | Animated noise texture with audio-driven parameters | WebGL | Hard |
| AB05 | Reaction Diffusion | Gray-Scott reaction diffusion model | WebGL | Expert |
| AB06 | Cellular Automata | Game of Life variant with audio-seeded cells | Canvas2D | Medium |
| AB07 | Strange Attractor | Lorenz/Rössler attractor traced over time | Canvas2D | Hard |
| AB08 | Paint Splatter | Paint splatters appearing on beat | Canvas2D | Medium |
| AB09 | Generative Tree | L-system tree that grows with audio | Canvas2D | Hard |
| AB10 | Liquid Chrome | Reflective liquid metal surface distorted by audio | WebGL | Expert |

### Category 18: MINIMAL (8)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| MN01 | Single Line | One horizontal line that warps with waveform | Canvas2D | Easy |
| MN02 | Breathing Circle | Single circle that breathes with bass | Canvas2D | Easy |
| MN03 | Dot Pulse | Single dot that pulses size/glow with beat | Canvas2D | Easy |
| MN04 | Progress Ring | Thin ring that fills like a progress indicator with song position | Canvas2D | Easy |
| MN05 | Corner Bars | Small bar groups only in corners of frame | Canvas2D | Easy |
| MN06 | Edge Glow | Edges of frame glow with frequency colors | Canvas2D | Easy |
| MN07 | Center Cross | Plus sign in center that scales with audio | Canvas2D | Easy |
| MN08 | Micro Dots | Tiny row of dots at bottom of screen, each a frequency band | Canvas2D | Easy |

### Category 19: CINEMATIC (6)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| CN01 | Cinematic Bars | Letterbox bars with spectrum inside them | Canvas2D | Easy |
| CN02 | Film Grain | Animated film grain overlay with intensity from energy | Canvas2D | Easy |
| CN03 | Lens Flare | Anamorphic lens flare that moves and pulses with bass | Canvas2D | Hard |
| CN04 | Depth of Field | Bokeh circles that shift focus with audio | Canvas2D | Medium |
| CN05 | Light Leak | Film light leak overlays that pulse with energy | Canvas2D | Medium |
| CN06 | Vignette Pulse | Vignette that intensifies on bass hits | Canvas2D | Easy |

### Category 20: 3D (10)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| 3D01 | Sphere Morph | Sphere that deforms based on FFT | Three.js | Hard |
| 3D02 | 3D Bar City | 3D bars arranged on a plane like a city | Three.js | Medium |
| 3D03 | Torus Knot | Audio-reactive torus knot geometry | Three.js | Medium |
| 3D04 | Cloth Simulation | Fabric waving in audio-driven wind | Three.js | Expert |
| 3D05 | Globe Equalizer | Earth globe with bars extending from surface | Three.js | Hard |
| 3D06 | Particle Cloud 3D | 3D point cloud with audio displacement | Three.js | Medium |
| 3D07 | Crystal Shard | Crystal/gem that rotates and refracts light | Three.js | Expert |
| 3D08 | Infinite Room | Room with reflective walls showing spectrum | Three.js | Expert |
| 3D09 | Audio Terrain 3D | 3D terrain mesh with real-time audio displacement | Three.js | Hard |
| 3D10 | Orbit Camera | Camera orbiting any 3D scene in sync with BPM | Three.js | Medium |

### Category 21: FLUID (8)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| FL01 | Plasma | Classic plasma effect with audio-driven parameters | WebGL | Medium |
| FL02 | Smoke | Fluid simulation smoke rising with bass | WebGL | Hard |
| FL03 | Fire | Realistic fire simulation, height from bass | WebGL | Hard |
| FL04 | Water Ripple | Water surface with ripples spawning on beats | Canvas2D/WebGL | Hard |
| FL05 | Lava Lamp | Lava lamp blobs floating and merging | Canvas2D | Hard |
| FL06 | Liquid Metal | Chrome/mercury liquid effect | WebGL | Expert |
| FL07 | Cloud Formation | Volumetric clouds forming and dissolving | WebGL | Expert |
| FL08 | Energy Plasma Ball | Plasma ball with tendrils reaching for edges | Canvas2D | Medium |

### Category 22: TEXT (5)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| TX01 | Bouncing Lyrics | Text that bounces on beats | Canvas2D | Easy |
| TX02 | Wave Text | Text characters displaced in sine wave | Canvas2D | Medium |
| TX03 | Exploding Letters | Letters scatter on beat, reform between | Canvas2D | Hard |
| TX04 | Typewriter | Characters appear one by one in rhythm | Canvas2D | Easy |
| TX05 | ASCII Art Spectrum | Spectrum displayed using ASCII characters | Canvas2D | Medium |

### Category 23: RETRO (8)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| RT01 | VHS Glitch | VHS tape glitch effect with tracking errors | Canvas2D | Medium |
| RT02 | CRT Scanlines | CRT monitor effect with phosphor glow | Canvas2D | Easy |
| RT03 | Pixel Art | Spectrum as chunky pixel art | Canvas2D | Easy |
| RT04 | 8-bit Bars | NES-style bars with limited palette | Canvas2D | Easy |
| RT05 | Oscilloscope Green | Classic green phosphor oscilloscope CRT | Canvas2D | Easy |
| RT06 | Tape Deck | Cassette tape with spinning reels | Canvas2D | Medium |
| RT07 | Windows 95 | Retro Windows UI with spectrum in "window" | Canvas2D | Medium |
| RT08 | Game Boy | Game Boy LCD screen with spectrum | Canvas2D | Medium |

### Category 24: NATURE (6)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| NT01 | Tree Growth | Fractal tree that grows leaves on beats | Canvas2D | Hard |
| NT02 | Blooming Flower | Flower petals open/close with energy | Canvas2D | Medium |
| NT03 | Lightning Storm | Lightning bolts on bass hits with rumble | Canvas2D | Medium |
| NT04 | Rainfall | Rain falling with thunder on beats | Canvas2D | Medium |
| NT05 | Northern Lights | Curtains of colored light swaying | Canvas2D | Hard |
| NT06 | Firefly Field | Fireflies pulsing in darkness | Canvas2D | Easy |

### Category 25: EXPERIMENTAL (8)
| ID | Name | Description | Renderer | Difficulty |
|----|------|-------------|----------|------------|
| EX01 | Glitch Art | Heavy RGB split, pixel sorting, datamosh | Canvas2D | Hard |
| EX02 | Audio Scope | Multi-panel scientific analysis view (FFT + waveform + phase) | Canvas2D | Medium |
| EX03 | Recursion Zoom | Recursive screen-in-screen zoom effect | Canvas2D | Expert |
| EX04 | Chromatic Aberration | Image/pattern with audio-driven chromatic aberration | Canvas2D | Medium |
| EX05 | Motion Blur | Everything rendered with directional motion blur | Canvas2D | Medium |
| EX06 | Negative Space | White canvas, black shapes reveal spectrum | Canvas2D | Easy |
| EX07 | Double Exposure | Two layered visualizers blended together | Canvas2D | Medium |
| EX08 | Random Composition | Randomly generated composition that evolves with song | Canvas2D | Expert |

---

# PHASE 3 — DEDUPLICATION AUDIT

## Potential Duplicates Identified & Resolved

| Pair | Resolution |
|------|-----------|
| B12 (Frequency Terrain) vs W04 (Mountain Range) vs TR01 | B12 is filled polygon bars, W04 is bezier wave, TR01 is silhouette with gradient sky. **All kept** — different rendering approaches |
| C04 (Circular Waveform Distortion) vs W08 (Circular Waveform) | **Merged** — W08 removed, C04 covers this concept |
| S03 (DNA Helix Spiral) vs D01 (Classic Double Helix) | S03 is spiral-viewed, D01 is side-view. **Both kept** — different perspectives |
| P03 (Fireflies) vs NT06 (Firefly Field) | **Merged** — NT06 removed, P03 covers this |
| N03 (Neon Grid) vs T05 (Grid Tunnel) | N03 is flat grid, T05 is perspective tunnel. **Both kept** — fundamentally different |
| G06 (Aurora Borealis) vs NT05 (Northern Lights) | **Merged** — NT05 removed, G06 covers this |
| W03 (Aurora Waves) vs RB05 (Frequency Curtain) | W03 is horizontal wave layers, RB05 is vertical strips. **Both kept** |
| R05 (Ripple Rings) vs SP04 (Sound Pressure) | R05 is beat-triggered, SP04 is continuous. **Both kept** — different triggers |

**After deduplication: 210 unique visualizers**

---

# PHASE 4 — IMPLEMENTATION ORDER

## Tier 1: EASY (Implement First — Immediate Library)
*58 visualizers — Estimated: 2-3 weeks*

| # | ID | Name | Category |
|---|-----|------|----------|
| 1 | B01 | Classic Vertical | Bars |
| 2 | B02 | Staggered Center | Bars |
| 3 | B03 | Mirror Bars | Bars |
| 4 | B04 | Split Dual | Bars |
| 5 | B05 | Rounded Pill Bars | Bars |
| 6 | B06 | Horizontal Bars | Bars |
| 7 | B10 | Neon Outline Bars | Bars |
| 8 | B11 | Gradient Fill Bars | Bars |
| 9 | B14 | Peak Hold Bars | Bars |
| 10 | W01 | Classic Oscilloscope | Waves |
| 11 | W09 | Seismograph | Waves |
| 12 | W11 | Neon Pulse Line | Waves |
| 13 | C01 | Radial Bars | Circle |
| 14 | C02 | Radial Inward | Circle |
| 15 | C03 | Dual Radial | Circle |
| 16 | C05 | Concentric Circles | Circle |
| 17 | C07 | Mirrored Radial Halves | Circle |
| 18 | C08 | Dot Ring | Circle |
| 19 | C09 | Pulsing Orb | Circle |
| 20 | R01 | Neon Ring | Ring |
| 21 | R02 | Double Ring | Ring |
| 22 | R06 | Energy Halo | Ring |
| 23 | R07 | Frequency Rings Stack | Ring |
| 24 | D04 | Chromosome | DNA |
| 25 | GE08 | Pulsing Triangles | Geometry |
| 26 | GE10 | Rotating Star | Geometry |
| 27 | N01 | Neon Bars | Neon |
| 28 | N05 | Neon Circles | Neon |
| 29 | N06 | Neon Polygon Outline | Neon |
| 30 | N08 | Neon Wave Stack | Neon |
| 31 | N10 | Neon Infinity | Neon |
| 32 | MX02 | Binary Stream | Matrix |
| 33 | MX03 | Data Grid | Matrix |
| 34 | MX04 | Scan Lines | Matrix |
| 35 | MN01 | Single Line | Minimal |
| 36 | MN02 | Breathing Circle | Minimal |
| 37 | MN03 | Dot Pulse | Minimal |
| 38 | MN04 | Progress Ring | Minimal |
| 39 | MN05 | Corner Bars | Minimal |
| 40 | MN06 | Edge Glow | Minimal |
| 41 | MN07 | Center Cross | Minimal |
| 42 | MN08 | Micro Dots | Minimal |
| 43 | CN01 | Cinematic Bars | Cinematic |
| 44 | CN02 | Film Grain | Cinematic |
| 45 | CN06 | Vignette Pulse | Cinematic |
| 46 | RT02 | CRT Scanlines | Retro |
| 47 | RT03 | Pixel Art | Retro |
| 48 | RT04 | 8-bit Bars | Retro |
| 49 | RT05 | Oscilloscope Green | Retro |
| 50 | TX01 | Bouncing Lyrics | Text |
| 51 | TX04 | Typewriter | Text |
| 52 | EX06 | Negative Space | Experimental |
| 53 | P03 | Floating Fireflies | Particle |
| 54 | P06 | Snow | Particle |
| 55 | G01 | Star Cluster | Galaxy |
| 56 | T01 | Square Tunnel | Tunnel |
| 57 | T02 | Circle Tunnel | Tunnel |
| 58 | RB04 | Light Trail | Ribbon |

## Tier 2: MEDIUM (Build Next — Core Library)
*78 visualizers — Estimated: 3-4 weeks*

| # | ID | Name | Category |
|---|-----|------|----------|
| 1 | B07 | Dot Matrix Bars | Bars |
| 2 | B08 | Waterfall Spectrogram | Bars |
| 3 | B09 | 3D Perspective Bars | Bars |
| 4 | B12 | Frequency Terrain | Bars |
| 5 | B13 | Stacked Multi-Band | Bars |
| 6 | B15 | Zigzag Bars | Bars |
| 7 | B16 | Reflected Floor Bars | Bars |
| 8 | B18 | Fragmented Glitch | Bars |
| 9 | W02 | Smooth Bezier Wave | Waves |
| 10 | W03 | Aurora Waves | Waves |
| 11 | W04 | Frequency Mountain Range | Waves |
| 12 | W05 | Double Helix Wave | Waves |
| 13 | W06 | Lissajous Curve | Waves |
| 14 | W07 | Waveform Ribbon | Waves |
| 15 | W10 | Layered Depth Waves | Waves |
| 16 | C04 | Circular Waveform Distortion | Circle |
| 17 | C06 | Rotating Radial with Trail | Circle |
| 18 | C10 | Spectrum Donut | Circle |
| 19 | R03 | Orbit Dots | Ring |
| 20 | R04 | Segmented Ring | Ring |
| 21 | R05 | Ripple Rings | Ring |
| 22 | R08 | Rotating Gear Ring | Ring |
| 23 | S01 | Archimedean Spectrum | Spiral |
| 24 | S03 | DNA Helix Spiral | Spiral |
| 25 | S07 | Spiral Waveform | Spiral |
| 26 | S08 | Spring Coil | Spiral |
| 27 | M01 | Simple Mandala | Mandala |
| 28 | M03 | Geometric Mandala | Mandala |
| 29 | M04 | Flower of Life | Mandala |
| 30 | M06 | Breathing Mandala | Mandala |
| 31 | P01 | Particle Fountain | Particle |
| 32 | P02 | Particle Explosion | Particle |
| 33 | P04 | Starfield Warp | Particle |
| 34 | P05 | Rain | Particle |
| 35 | P09 | Confetti Burst | Particle |
| 36 | P10 | Ember Trail | Particle |
| 37 | P11 | Particle Wave | Particle |
| 38 | P13 | Smoke Plume | Particle |
| 39 | P14 | Constellation | Particle |
| 40 | G02 | Nebula | Galaxy |
| 41 | G03 | Solar System | Galaxy |
| 42 | G05 | Comet Trail | Galaxy |
| 43 | G07 | Meteor Shower | Galaxy |
| 44 | G08 | Cosmic Dust | Galaxy |
| 45 | T03 | Hexagon Tunnel | Tunnel |
| 46 | T05 | Grid Tunnel | Tunnel |
| 47 | T06 | Neon Corridor | Tunnel |
| 48 | RB01 | Flowing Ribbon | Ribbon |
| 49 | RB05 | Frequency Curtain | Ribbon |
| 50 | RB06 | Infinity Loop | Ribbon |
| 51 | D01 | Classic Double Helix | DNA |
| 52 | GE01 | Rotating Cube | Geometry |
| 53 | GE03 | Sacred Geometry Grid | Geometry |
| 54 | GE04 | Tessellation | Geometry |
| 55 | GE06 | Sierpinski Triangle | Geometry |
| 56 | GE07 | Hexagonal Grid | Geometry |
| 57 | GE12 | Koch Snowflake | Geometry |
| 58 | N02 | Neon Sign | Neon |
| 59 | N03 | Neon Grid | Neon |
| 60 | N04 | Neon Heartbeat | Neon |
| 61 | N07 | Laser Beams | Neon |
| 62 | N09 | Electric Arc | Neon |
| 63 | SP01 | Speaker Cone | Speaker |
| 64 | SP03 | Vintage Radio | Speaker |
| 65 | SP04 | Sound Pressure | Speaker |
| 66 | SP05 | Turntable | Speaker |
| 67 | MX01 | Digital Rain | Matrix |
| 68 | MX06 | Terminal | Matrix |
| 69 | TR01 | Mountain Range | Terrain |
| 70 | TR02 | Cityscape | Terrain |
| 71 | TR05 | Desert Dunes | Terrain |
| 72 | TR08 | Underwater | Terrain |
| 73 | AB06 | Cellular Automata | Abstract |
| 74 | AB08 | Paint Splatter | Abstract |
| 75 | CN04 | Depth of Field | Cinematic |
| 76 | CN05 | Light Leak | Cinematic |
| 77 | RT01 | VHS Glitch | Retro |
| 78 | 3D02 | 3D Bar City | 3D |

## Tier 3: HARD (Advanced Library)
*52 visualizers — Estimated: 4-5 weeks*

Includes: B17, W12, R09, R10, S02, S04, S05, S06, M02, M05, M07, P07, P08, P12, G04, G06, T04, T07, RB02, RB07, RB08, D02, D03, D05, GE02, GE05, GE11, MX05, TR03, TR04, TR06, TR07, AB01, AB02, AB04, AB07, AB09, CN03, FL01, FL04, FL05, FL08, TX02, TX03, TX05, RT06, RT07, RT08, NT01, NT02, NT03, EX01, EX04, EX05, EX07, 3D01, 3D03, 3D05, 3D09

## Tier 4: EXPERT (Premium Showcase)
*22 visualizers — Estimated: 4-6 weeks*

Includes: T08, M08, RB03, GE09, AB03, AB05, AB10, SP02, FL02, FL03, FL06, FL07, 3D04, 3D07, 3D08, EX02, EX03, EX08, G04, 3D06, 3D10, 3D04

---

# PHASE 5 — BEHAVIORAL SPECIFICATIONS

## Audio Reaction Matrix (How Each Audio Source Affects Visuals)

| Audio Source | What Moves | What Pulses | What Rotates | What Explodes | What Fades | What Grows | What Shrinks |
|-------------|-----------|------------|-------------|--------------|-----------|-----------|-------------|
| **Bass (20-250 Hz)** | Camera shake, global position offset | Size/scale of primary element, glow intensity | Rotation speed increase | Particle bursts outward, shatter effects | — | Bar height, ring radius, orb size | Gap/spacing between elements |
| **Mids (250-4000 Hz)** | Secondary element drift, ribbon flow | Color saturation, line thickness | Secondary rotation axes | — | Trail length | Mid-frequency bar heights, wave amplitude | — |
| **Highs (4000-20000 Hz)** | Sparkle/shimmer positions, fine detail | Twinkle/sparkle brightness, particle opacity | Fine rotation details | Mini sparks | Fast-decaying micro elements | Crystal/star point extensions | — |
| **Energy (RMS)** | Overall movement speed | Global brightness, contrast | Overall rotation speed | Spawn rate of all effects | Quiet = more fade, dark | All elements proportionally | Inverse: elements retreat when quiet |
| **BPM** | Scroll/travel speed syncs to beat | Rhythmic pulse timing | Rotation syncs to beat | Beat-triggered explosions | Between-beat decay | Beat-synchronized growth | Between-beat retraction |
| **Onset** | Sudden position jumps | Sharp spike then decay | Sudden rotation burst | Trigger point for bursts | Post-onset rapid fade | Instant growth spike | — |
| **Waveform** | Direct shape displacement | — | — | — | — | — | — |

---

# PHASE 6 — RENDERER RECOMMENDATIONS

## Technology Decision Matrix

| Renderer | Best For | Performance | Complexity | Browser Support |
|----------|---------|-------------|-----------|----------------|
| **Canvas2D** | Lines, shapes, text, basic particles, 2D effects | Good for < 5000 draw calls | Low-Medium | 100% |
| **WebGL** | Shaders, fluid sim, noise, heavy particle systems, pixel manipulation | Excellent (GPU) | High | 98% |
| **Three.js** | True 3D objects, camera orbits, lighting, reflections, meshes | Excellent (GPU) | High | 98% |

## Renderer Distribution

```
Canvas2D:  158 visualizers (75%)  ← Primary renderer
WebGL:      28 visualizers (13%)  ← For GPU-heavy effects  
Three.js:   24 visualizers (12%)  ← For true 3D only
```

### Why Canvas2D Dominates
1. **Zero dependencies** — No external libraries needed
2. **Instant startup** — No WebGL context creation overhead
3. **Simpler debugging** — Standard JS debugging tools work
4. **Lower memory** — No GPU buffer management
5. **Perfect for 2D** — 75% of visualizers are fundamentally 2D effects
6. **Good enough performance** — Modern browsers optimize Canvas2D heavily

### When to Use WebGL
- Fluid simulations (smoke, fire, water)
- Noise-based effects (plasma, terrain generation)
- Pixel-level manipulation (reaction diffusion, Voronoi)
- Heavy particle systems (> 10,000 particles)
- Shader effects (chromatic aberration, blur)

### When to Use Three.js
- True 3D geometry (sphere, torus, cube with lighting)
- Camera orbits and perspective
- Material/shader combinations
- Reflections and refractions
- Complex 3D scenes

---

# PHASE 7 — SHARED RENDERING ENGINE ARCHITECTURE

## Engine Design Philosophy

Instead of 210 monolithic renderers, we build **8 composable engines** that each power multiple visualizers through configuration.

```
┌─────────────────────────────────────────────┐
│           VISUALIZER REGISTRY               │
│   Maps visualizer ID → engine + config      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │  Bars   │  │  Wave   │  │ Circle  │    │
│  │ Engine  │  │ Engine  │  │ Engine  │    │
│  │ (18 vis)│  │ (12 vis)│  │ (20 vis)│    │
│  └─────────┘  └─────────┘  └─────────┘    │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │Particle │  │ Tunnel  │  │Geometry │    │
│  │ Engine  │  │ Engine  │  │ Engine  │    │
│  │ (14 vis)│  │ (8 vis) │  │ (12 vis)│    │
│  └─────────┘  └─────────┘  └─────────┘    │
│                                             │
│  ┌─────────┐  ┌─────────┐                  │
│  │  Text   │  │ Shader  │                  │
│  │ Engine  │  │ Engine  │                  │
│  │ (5 vis) │  │ (28 vis)│                  │
│  └─────────┘  └─────────┘                  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │      SHARED UTILITIES LAYER          │   │
│  │  • AudioDataProvider                 │   │
│  │  • ColorEngine                       │   │
│  │  • ParticlePool                      │   │
│  │  • NoiseGenerator                    │   │
│  │  • TrailRenderer                     │   │
│  │  • GlowRenderer                     │   │
│  │  • PerspectiveProjection             │   │
│  │  • MathUtils                         │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Engine Specifications

### Engine 1: BarsEngine
**Powers:** B01-B18, N01, MN05, MN08, RT04, CN01 (≈22 visualizers)

```javascript
// Configuration interface
{
  direction: 'vertical' | 'horizontal',      // B01 vs B06
  alignment: 'bottom' | 'center' | 'top',    // B01 vs B02
  mirror: boolean,                            // B03
  split: 'none' | 'frequency' | 'spatial',   // B04
  shape: 'rect' | 'rounded' | 'dot',         // B05, B07
  fill: 'solid' | 'gradient' | 'outline',    // B11, B10
  peakHold: boolean,                          // B14
  reflection: boolean,                        // B16
  perspective: null | { vanishX, vanishY },   // B09
  arrangement: 'linear' | 'zigzag',          // B15
  glow: { enabled, intensity, color },        // N01
  glitch: { enabled, intensity },             // B18
  timeHistory: number | null,                 // B08, B17
  barCount: 32 | 64 | 128 | 256,
  barWidth: number,
  spacing: number,
  smoothing: number,                          // Decay speed
  colorMode: 'solid' | 'gradient' | 'rainbow' | 'temperature'
}
```

### Engine 2: WaveEngine
**Powers:** W01-W12, MN01, N04, N08 (≈15 visualizers)

```javascript
{
  dataSource: 'waveform' | 'fft',
  renderStyle: 'line' | 'bezier' | 'ribbon' | 'filled',
  coordinateSystem: 'cartesian' | 'polar' | 'rose',
  layerCount: 1-5,                            // W03, W10
  mirror: boolean,                            // Vertical mirror
  scroll: boolean,                            // W09 seismograph
  trail: boolean,                             // Light trail mode
  glow: { enabled, intensity },
  lineWidth: number,
  smoothing: 'none' | 'catmull-rom' | 'bezier',
  colorMode: 'solid' | 'gradient' | 'aurora' | 'rainbow',
  phaseOffset: number                         // For multi-layer
}
```

### Engine 3: CircleEngine (Circle + Ring + Spiral)
**Powers:** C01-C10, R01-R10, S01-S08, M01-M08 (≈36 visualizers)

```javascript
{
  type: 'radial-bars' | 'ring' | 'spiral' | 'mandala' | 'blob',
  barDirection: 'outward' | 'inward' | 'both',
  rotation: { speed, syncBPM },
  symmetry: 1 | 2 | 4 | 6 | 8 | 12,         // Mandala symmetry
  spiralType: 'archimedean' | 'fibonacci' | 'logarithmic',
  ringCount: number,                          // Concentric rings
  trailMode: boolean,
  particleMode: boolean,                      // R10
  glow: { enabled, intensity },
  radius: number,
  innerRadius: number,                        // Donut/ring
  dotMode: boolean,                           // C08
  pulseMode: 'none' | 'breathe' | 'beat',   // C09, M06
  rippleSpawn: boolean                        // R05
}
```

### Engine 4: ParticleEngine
**Powers:** P01-P14, G01-G08, NT03, NT04 (≈24 visualizers)

```javascript
{
  maxParticles: 100-10000,
  spawnMode: 'continuous' | 'burst' | 'beat',
  spawnPosition: 'center' | 'bottom' | 'edges' | 'random' | 'ring',
  physics: {
    gravity: { x, y },
    drag: number,
    bounce: boolean
  },
  movement: 'linear' | 'orbital' | 'brownian' | 'vortex' | 'warp',
  shape: 'circle' | 'rect' | 'line' | 'star' | 'snowflake' | 'char',
  sizeRange: [min, max],
  sizeReactive: 'amplitude' | 'lifetime' | 'velocity',
  colorMode: 'solid' | 'temperature' | 'velocity' | 'lifetime' | 'rainbow',
  trail: { enabled, length },
  connections: { enabled, maxDistance },       // P14 constellation
  lifetime: number,                           // seconds
  fadeMode: 'opacity' | 'shrink' | 'color'
}
```

### Engine 5: TunnelEngine
**Powers:** T01-T08 (8 visualizers)

```javascript
{
  shape: 'circle' | 'square' | 'hex' | 'organic',
  direction: 'inward' | 'outward',
  ringCount: number,
  speed: number,
  speedReactive: 'bass' | 'bpm' | 'energy',
  distortion: 'none' | 'noise' | 'waveform',
  gridMode: boolean,                          // T05
  corridorMode: boolean,                      // T06
  particleMode: boolean,                      // T07
  glow: { enabled, intensity },
  perspective: { fov, depth }
}
```

### Engine 6: GeometryEngine
**Powers:** GE01-GE12, N06, GE shapes used across categories (≈15 visualizers)

```javascript
{
  shape: 'polygon' | 'star' | 'fractal' | 'grid' | 'platonic',
  vertexCount: 3-12,                          // For polygon
  fractalType: 'sierpinski' | 'koch' | 'tree',
  fractalDepth: 1-7,
  gridType: 'hex' | 'square' | 'triangle',
  rotation: { x, y, z, speed },
  projection: '2d' | 'perspective',
  fill: 'none' | 'solid' | 'gradient',
  glow: { enabled, intensity },
  morph: { enabled, targetShape },            // GE02
  nested: { enabled, count },                 // GE08
  cellularData: boolean                       // GE04, GE07
}
```

### Engine 7: TextEngine
**Powers:** TX01-TX05, N02, P12 (≈7 visualizers)

```javascript
{
  text: string,
  font: string,
  renderMode: 'draw' | 'particle' | 'wave',
  animation: 'bounce' | 'wave' | 'explode' | 'typewriter' | 'scroll',
  glow: { enabled, intensity },
  fontSize: number,
  characterSpacing: number,
  beatReactive: boolean,
  particleMode: boolean                       // P12
}
```

### Engine 8: ShaderEngine (WebGL)
**Powers:** FL01-FL08, AB03-AB05, AB10, GE09, SP02, T08, 3D01-3D10 (≈30 visualizers)

```javascript
{
  shaderType: 'plasma' | 'fire' | 'smoke' | 'water' | 'noise' | 'metaball' | 'fractal',
  uniforms: {
    uTime: number,
    uBass: number,
    uMids: number,
    uHighs: number,
    uEnergy: number,
    uSpectrum: Float32Array,
    uResolution: [width, height]
  },
  use3D: boolean,                             // Three.js mode
  geometry: 'plane' | 'sphere' | 'torus' | 'custom',
  camera: { fov, position, orbit },
  postProcessing: ['bloom', 'chromatic', 'film-grain']
}
```

## Shared Utilities

### AudioDataProvider
```
Provides: getSpectrum(), getWaveform(), getBass(), getMids(), getHighs(),
           getEnergy(), getBPM(), isOnset(), getSmoothed(band, smoothing)
Used by: ALL engines
```

### ColorEngine
```
Provides: rainbow(index), temperature(value), gradient(stops),
           hslCycle(time, speed), neonPalette(name), randomPalette()
Used by: ALL engines
```

### ParticlePool
```
Provides: allocate(count), free(particle), forEach(callback),
           applyForces(gravity, drag), update(dt)
Used by: ParticleEngine, CircleEngine (R10), TunnelEngine (T07)
```

### GlowRenderer
```
Provides: setGlow(ctx, intensity, color), clearGlow(ctx),
           drawGlowLine(ctx, points), drawGlowCircle(ctx, x, y, r)
Used by: ALL engines (any glow-enabled visualizer)
```

### TrailRenderer
```
Provides: enable(opacity), disable(), clearWithTrail(ctx, opacity)
Used by: CircleEngine (C06), RibbonEngine, ParticleEngine
```

### PerspectiveProjection
```
Provides: project3D(x, y, z, fov), rotateX/Y/Z(point, angle),
           isometricProject(x, y, z)
Used by: GeometryEngine, TunnelEngine, BarsEngine (B09)
```

---

# SUMMARY

| Metric | Value |
|--------|-------|
| **Total Unique Visualizers** | 210 |
| **Categories** | 25 |
| **Shared Engines** | 8 |
| **Shared Utilities** | 6 |
| **Canvas2D Visualizers** | 158 (75%) |
| **WebGL Visualizers** | 28 (13%) |
| **Three.js Visualizers** | 24 (12%) |
| **Easy (Tier 1)** | 58 |
| **Medium (Tier 2)** | 78 |
| **Hard (Tier 3)** | 52 |
| **Expert (Tier 4)** | 22 |
| **Estimated Total Dev Time** | 13-18 weeks |

---

> **This document is the official specification for MediaFactory's visualization system.**  
> Implementation should begin with Phase 4 Tier 1 (Easy) visualizers to build the shared engine foundations, then progressively tackle Tiers 2-4.
> 
> Each engine should be built as a standalone module that accepts a configuration object and an AudioDataProvider, making every visualizer a thin configuration layer on top of a powerful shared renderer.
