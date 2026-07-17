# MF-306A Performance Report

## Zero Allocation Check
The `CameraEffect` constructor pre-allocates an internal `_output` object. When requested, it mutates properties natively on that instance and yields the reference to the `VisualRuntime` without invoking object spread (`{...this._output}`).

## Profiling Summary
- **Audio Analysis**: None. Uses existing cached `MusicalFeel`.
- **Envelope Math**: High-speed mathematical transitions (Pow, Max, Min). No array manipulations or closures.
- **Merge**: Output values are added directly into the pre-allocated double buffers cleanly.
- **Latency**: Negligible sub-millisecond impact to the `update()` tick.
