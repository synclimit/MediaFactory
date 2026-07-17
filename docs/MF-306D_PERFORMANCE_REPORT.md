# MF-306D Performance Report

## Zero Allocation Check
The `SpectrumEffect` reads from the pre-existing FFT array generated earlier in the cycle. The mapping interpolates raw bins into a pre-allocated 64-band `Float32Array`. Inside `VisualRuntime`, this array is iterated numerically and copied tightly into the double buffer.

There is ZERO object spread `...` usage and ZERO calls to `new` keywords inside `update()`. Latency overhead is strictly limited to an `O(N)` linear interpolation array traverse (where N=FFT bins).
