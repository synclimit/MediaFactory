const fs = require('fs');
const path = require('path');

const starterDir = path.resolve(__dirname, 'assets/visualizers/starter');
if (!fs.existsSync(starterDir)) {
    fs.mkdirSync(starterDir, { recursive: true });
}

const presets = [
    {
        id: "classic-bars",
        name: "Classic Bars",
        description: "Standard vertical audio spectrum.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: false, rounded: false, center: false, thickness: 4, spacing: 2 },
        appearance: { color: "#ffffff", gradient: "None", glow: 50, opacity: 100 },
        audio: { fftGain: 100, smoothing: 80, bassFocus: 100, midFocus: 50, trebleFocus: 30 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "rounded-bars",
        name: "Rounded Bars",
        description: "Vertical audio spectrum with rounded corners.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: false, rounded: true, center: false, thickness: 8, spacing: 4 },
        appearance: { color: "#4facfe", gradient: "Linear", glow: 40, opacity: 100 },
        audio: { fftGain: 110, smoothing: 85, bassFocus: 100, midFocus: 60, trebleFocus: 40 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "thin-spectrum",
        name: "Thin Spectrum",
        description: "Minimalist thin vertical bars.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: false, rounded: false, center: false, thickness: 1, spacing: 1 },
        appearance: { color: "#00f2fe", gradient: "None", glow: 20, opacity: 80 },
        audio: { fftGain: 120, smoothing: 70, bassFocus: 100, midFocus: 80, trebleFocus: 60 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "wide-spectrum",
        name: "Wide Spectrum",
        description: "Thick contiguous blocks.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: false, rounded: false, center: false, thickness: 20, spacing: 0 },
        appearance: { color: "#f093fb", gradient: "Linear", glow: 10, opacity: 100 },
        audio: { fftGain: 90, smoothing: 90, bassFocus: 100, midFocus: 40, trebleFocus: 20 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "mirror-spectrum",
        name: "Mirror Spectrum",
        description: "Reflected vertical bars.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: true, rounded: false, center: false, thickness: 4, spacing: 2 },
        appearance: { color: "#ff0844", gradient: "Linear", glow: 60, opacity: 100 },
        audio: { fftGain: 100, smoothing: 80, bassFocus: 100, midFocus: 50, trebleFocus: 30 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "center-spectrum",
        name: "Center Spectrum",
        description: "Bars extending outwards from the center.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: true, rounded: true, center: true, thickness: 6, spacing: 2 },
        appearance: { color: "#43e97b", gradient: "Radial", glow: 80, opacity: 100 },
        audio: { fftGain: 110, smoothing: 85, bassFocus: 100, midFocus: 50, trebleFocus: 30 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "circular-spectrum",
        name: "Circular Spectrum",
        description: "Audio spectrum arranged in a circle.",
        renderer: "spectrum",
        geometry: { shape: "circle", mirror: false, rounded: true, center: false, radius: 100, thickness: 4, spacing: 2 },
        appearance: { color: "#fa709a", gradient: "Angular", glow: 70, opacity: 100 },
        audio: { fftGain: 100, smoothing: 85, bassFocus: 100, midFocus: 60, trebleFocus: 40 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "double-ring-spectrum",
        name: "Double Ring Spectrum",
        description: "Two concentric circular spectrums.",
        renderer: "spectrum",
        geometry: { shape: "double-ring", mirror: true, rounded: true, center: false, radius: 120, thickness: 3, spacing: 2 },
        appearance: { color: "#a18cd1", gradient: "Angular", glow: 90, opacity: 100 },
        audio: { fftGain: 120, smoothing: 80, bassFocus: 100, midFocus: 70, trebleFocus: 50 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "wave-spectrum",
        name: "Wave Spectrum",
        description: "Continuous smooth wave line.",
        renderer: "spectrum",
        geometry: { shape: "line", mirror: false, rounded: true, center: false, thickness: 3, spacing: 0 },
        appearance: { color: "#84fab0", gradient: "None", glow: 50, opacity: 100 },
        audio: { fftGain: 100, smoothing: 95, bassFocus: 100, midFocus: 50, trebleFocus: 30 },
        transform: { scale: 100, rotation: 0 }
    },
    {
        id: "neon-spectrum",
        name: "Neon Spectrum",
        description: "High intensity glowing bars.",
        renderer: "spectrum",
        geometry: { shape: "bar", mirror: true, rounded: true, center: false, thickness: 5, spacing: 3 },
        appearance: { color: "#ff00ff", gradient: "None", glow: 100, opacity: 100 },
        audio: { fftGain: 130, smoothing: 75, bassFocus: 100, midFocus: 80, trebleFocus: 60 },
        transform: { scale: 100, rotation: 0 }
    }
];

presets.forEach(p => {
    const fullPreset = {
        schemaVersion: "1.0.0",
        engineVersion: "1.0.0",
        presetVersion: 1,
        id: p.id,
        name: p.name,
        version: 1,
        author: "MediaFactory",
        description: p.description,
        category: "Spectrum",
        tags: ["starter", "built-in"],
        renderer: p.renderer,
        geometry: p.geometry,
        appearance: p.appearance,
        audio: p.audio,
        transform: p.transform,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const filePath = path.join(starterDir, `${p.name}.visualizer`);
    fs.writeFileSync(filePath, JSON.stringify(fullPreset, null, 2));
    console.log(`Created ${p.name}.visualizer`);
});
