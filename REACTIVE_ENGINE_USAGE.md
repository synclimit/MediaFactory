# Dependency Audit: ReactiveEngine & AudioDrivenRuntime

## 1. ReactiveEngine.js (Legacy)

| File | Purpose | Active / Legacy | Migration Required |
|------|---------|-----------------|--------------------|
| `src/services/subtitle/SubtitleReactiveAdapter.js` | Modulates subtitles based on audio channels | Legacy | Yes |
| `src/services/qa/validators/VisualRuntimeValidator.js` | Validates visual output against old ReactiveEngine channels | Legacy | Yes |
| `src/services/pipeline/registry/adapters/ReactiveEngineAdapter.js` | Pipeline adapter for legacy engine | Legacy | Yes |
| `src/services/pipeline/models/RenderFrame.js` | Stores legacy reactive state in the frame model | Legacy | Yes |
| `src/services/audio/ReactiveObjectProcessor.js` | Processes object properties via ReactiveEngine | Legacy | Yes |
| `src/components/m3/M3PreviewCanvas.jsx` | QA UI referencing legacy engine | Legacy | Yes |
| `src/components/m3/ReactiveValidationQA.jsx` | QA UI metrics for legacy engine | Legacy | Yes |

## 2. AudioDrivenRuntime.js (Active/V2)

| File | Purpose | Active / Legacy | Migration Required |
|------|---------|-----------------|--------------------|
| `src/services/pipeline/RenderPipeline.js` | Main pipeline orchestrator | Active | No |
| `src/services/visual/effects/*.js` | Consumes `audioDrivenState` for effects | Active | No |
| `src/services/qa/validators/ReactiveRuntimeValidator.js` | Validates new V2 runtime | Active | No |
| `src/services/qa/features/*Feature.js` | QA assertions for V2 features | Active | No |
| `src/services/audio/v2/VisualMappingEngine.js` | Maps audio to visual parameters | Active | No |

## 3. beatEngine (Mixed Usage)

| File | Purpose | Active / Legacy | Migration Required |
|------|---------|-----------------|--------------------|
| `src/services/pipeline/registry/adapters/*.js` | Legacy pipeline adapters | Legacy | Yes |
| `src/services/qa/validators/*.js` | Used to check `isPlaying` and state | Active (QA) | No |
| `src/services/qa/features/*.js` | Used to check `isPlaying` in tests | Active (QA) | No |
| `src/services/audio/v2/AudioDrivenRuntime.js` | Subscribes to BeatEngine events | Active | No |

## 4. audioDrivenState (Active/V2)

| File | Purpose | Active / Legacy | Migration Required |
|------|---------|-----------------|--------------------|
| `src/services/visual/VisualRuntime.js` | Distributes state to all visual effects | Active | No |
| `src/services/visual/effects/*.js` | Consumes state (kick, snare, downbeat, etc.) | Active | No |
| `src/services/qa/validators/ReactiveRuntimeValidator.js` | Validates state structure and timing | Active | No |

---
*Note: `ReactiveEngine.js` must remain in the codebase strictly for backwards compatibility until all dependent modules are fully migrated to `AudioDrivenRuntime.js`. Do not expand its features.*
