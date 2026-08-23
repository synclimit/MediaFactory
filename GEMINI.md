# MEDIAFACTORY SYSTEM RULES (GEMINI & ANTIGRAVITY)

## 🔒 PERMANENT DIRECTIVE: MODE 7 (ASTROFOX) ARCHITECTURE LOCK

1. **100% WYSIWYG PARITY**: Live editor and render engine MUST be visually identical.
2. **DO NOT CHANGE ASTROFOX CORE ARCHITECTURE**: Preserve Three.js, Canvas2D, and WebGL rendering pipeline.
3. **DO NOT ALTER PASS ORDERING**:
   - Layer 1: Background (`ImagePass`)
   - Layer 2: 3D Particles (`WebGLBuffer.pass` with `TexturePass` + `transparent: true`)
   - Layer 3: 2D Visualizer & Text (`CanvasBuffer.pass` with `TexturePass`)
   - Layer 4: Effects
4. **LIVE EDITOR NEVER LOCKED**: Keep live player and controls active; always release state upon render finish.
5. **AUDIO INTEGRATION**: Audio tracks must be stored locally on disk and compiled with `-c:a aac -b:a 192k`.
