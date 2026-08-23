# MODE 7 ASTROFOX PERMANENT ARCHITECTURE RULES

## CORE PRINCIPLES
- Live Editor and Render Engine must be 100% WYSIWYG identical.
- Do NOT rewrite or alter the fundamental Astrofox rendering architecture.
- Do NOT change the Composer 3-pass layer ordering:
  1. ImagePass (Background)
  2. WebGLBuffer (3D Particles with TexturePass alpha transparency)
  3. CanvasBuffer (Visualizer Spectrums & Text with TexturePass)
  4. Post-processing Effects
- Audio must be preserved on physical disk before FFmpeg encoding with `-c:a aac -b:a 192k`.
- Live editor player controls must remain active and responsive after render completes.
