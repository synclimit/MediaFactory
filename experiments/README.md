# MediaFactory Experiments Workspace

This directory contains empirical performance and compatibility spikes for evaluating candidate backend rendering engines for **MediaFactory V3 (MF-3000)**.

---

## Directory Structure

```
experiments/
├── README.md                              # Experiments documentation
├── baseline/
│   ├── baseline_metadata.json             # Ground-truth project configuration
│   └── baseline_frame.png                 # Baseline ground-truth frame capture (t = 5.000s)
├── compare/
│   ├── pixel_compare.js                   # Pixel comparison utility (Baseline vs Candidate)
│   ├── diff_generator.js                  # Visual red-highlight diff generator
│   └── report.json                        # Automated comparison report artifact
└── canvaskit/
    ├── init.js                            # CanvasKit WASM initialization & primitive rasterizer
    ├── runtime_report.json                # Runtime execution benchmark report
    └── hello.png                          # Minimal primitive render output
```

---

## Experiment Suite Overview

- **MF-2999.1 — Baseline Capture**: Captures baseline frame $t = 5.000\text{s}$ at $1920 \times 1080$ @ 60 FPS under fixed production parameters.
- **MF-2999.2 — Pixel Comparison Framework**: Evaluates candidate PNG outputs pixel-by-pixel against `baseline_frame.png`.
- **MF-2999.3 — CanvasKit Compatibility Spike**: Validates Google Skia WASM runtime initialization, surface creation, and primitive rendering performance.

---

## Running Spikes

### 1. CanvasKit Compatibility Spike
```powershell
node experiments/canvaskit/init.js
```

### 2. Pixel Comparison Test
```powershell
node experiments/compare/pixel_compare.js
```
