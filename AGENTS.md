# MEDIAFACTORY AGENT INSTRUCTIONS & ARCHITECTURE RULES

## 🔒 PERMANENT DIRECTIVE: MODE 7 (ASTROFOX) ARCHITECTURE LOCK

> **CRITICAL MANDATE (DO NOT MODIFY CORE ARCHITECTURE):**
> 1. **100% WYSIWYG PARITY**: The native rendering engine and live editor MUST remain identical in visual output, timing, and reactivity. What you see in the live preview is EXACTLY what is rendered to video.
> 2. **DO NOT REWRITE OR REPLACE ASTROFOX CORE**: Keep the original Three.js, Canvas2D, and WebGL rendering pipeline intact. Do not replace Astrofox core with non-native mock renderers.
> 3. **DO NOT TOUCH FIXED PASS ORDER**:
>    - **Layer 1 (Bottom)**: Background Image/Video (`ImagePass`)
>    - **Layer 2 (Middle)**: 3D Particles & Geometry (`webglBuffer.pass` with `TexturePass` + `transparent: true`)
>    - **Layer 3 (Foreground)**: 2D Visualizer Spectrum, Waves, Text, Lyrics (`canvasBuffer.pass` with `TexturePass` + `transparent: true`)
>    - **Layer 4 (Top)**: Post-processing Effects (Bloom, Glow, etc.)
> 4. **LIVE EDITOR NON-BLOCKING**: Live editor and Player controls MUST remain active and interactive. Rendering must run cleanly in the background, updating progress to Queue Manager, and immediately release engine locks (`active: false`, `renderer.start()`) upon completion.
> 5. **AUDIO COMPILATION**: All audio tracks must be verified as physical disk paths (`D:\MediaFactory\Output\Temp\...`) and encoded universally via `-c:a aac -b:a 192k`.
> 6. **OUTPUT DIRECTORY ENSURANCE**: Destination directories (e.g., `D:\output2\M7_Astrofox\`) must always be recursively created before launching FFmpeg.

---

## 🛠️ REPOSITORY STANDARDS

- Always run `npm run build-dev` in `d:\MediaFactory\m7-astrofox` whenever modifying M7 engine code.
- Always run `npm run build` in `d:\MediaFactory` to update the production bundle.
- Always verify changes against live editor and native output.
