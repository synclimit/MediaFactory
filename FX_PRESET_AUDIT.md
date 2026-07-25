# SPRINT 1 — FX PRESET FOUNDATION
## Capability Audit & Architecture Validation

### 1. Existing Capability
Berikut adalah daftar modul dan kemampuan (engine) yang saat ini sudah dimiliki oleh Media Factory:

- **Background Engine**
  - **Fitur**: Pemutaran Gambar/Video latar belakang dengan opsi hardware decoding.
  - **Parameter**: Scaling Mode (Fit/Fill/Stretch), Blur (Gaussian), Darken Overlay, Offset (X, Y), Zoom.
  - **Motion Dynamics**: Reaksi audio (Beat Zoom, X/Y Panning, Z-Rotation, Chaos/Shake) berdasarkan deteksi frekuensi (Bass, Snare, Full).

- **Visualizer Engine**
  - **Fitur**: Render spektrum audio dalam berbagai bentuk. Didukung oleh arsitektur plugin/registry.
  - **Parameter**: Bar Count, Frequency Order, Beat Pulse Zoom, Styling warna (Solid, Gradients, Neon).
  - **Kategori (25+)**: Bars, Circle, Ring, Wave, Particle, 3D, Abstract, dll.

- **Particle Engine**
  - **Fitur**: Sistem render partikel untuk latar belakang atau overlay.
  - **Parameter**: Beberapa preset sudah tersedia (Gravity Well, Audio Fountain, Constellation Nodes, Orbital Dust, dll).

- **Lyrics / Subtitle Engine**
  - **Fitur**: Render teks/lirik sinkron dengan audio.
  - **Parameter**: Transform (X, Y, Scale, Rotation, Opacity), Layout (Width, Margin), Typography (Font, Size, Line Height, Theme, Color).

- **Effects / Reactive Engine**
  - **Fitur**: Efek kamera dan visual reaktif terhadap ketukan (beat).
  - **Parameter**: Amplitude, Threshold, Attack, Release, Smoothness, Operation, Source (Bass, Kick, Energy).
  - **Contoh Efek**: Camera Shake, Zoom Pulse.

- **Beat Engine (V2)**
  - **Fitur**: Pipeline audio DSP tingkat lanjut (Percussion Classifier, Tempo Stabilizer, Downbeat Detector, Beat Tracker, Caching).
  - Digunakan sebagai Single Source of Truth untuk memicu efek audio-reaktif pada layer lain.

### 2. Reusable Components
Daftar komponen yang dapat langsung dipakai (Reuse First) untuk pengembangan FX Preset:

- **UI Inspector Primitives**: `SettingGroup`, `SliderRow`, `SelectRow`, `ToggleRow`, `ColorPickerRow`, `ButtonGroup` (sudah tersedia di `M3ObjectInspector.jsx`).
- **Beat Engine / Motion Dispatcher**: `BeatEngineV2` dan dispatcher yang telah siap digunakan untuk mensinkronisasi FX dengan musik.
- **ParticleEngineCore**: Engine yang dapat menangani logika partikel secara efisien.
- **Visualizer Registry**: Sistem plugin registry (`categoryRegistry`, `visualizerRegistry`) untuk manajemen visualizer yang dinamis.
- **RealtimeEffectRenderer**: Pipeline perenderan efek (kamera/zoom) saat ini.

### 3. Missing Components
Daftar kemampuan yang benar-benar belum tersedia di dalam codebase, namun kemungkinan besar dibutuhkan untuk paket FX Preset yang komprehensif:

- **Color Grading / Global Filter Engine**
  - *Alasan*: Belum ada engine post-processing warna global (LUT, Brightness, Contrast, Saturation, Hue Shift) yang diaplikasikan di atas seluruh komposisi (layer akhir).
- **Stage Light Engine**
  - *Alasan*: Belum ada engine atau komponen khusus untuk render pencahayaan panggung (misal spotlight, god rays, atau laser) yang bisa bereaksi mandiri terhadap beat.
- **Global Border Glow / Neon Frame**
  - *Alasan*: Tidak ada efek frame reaktif global. Saat ini neon/glow hanya ada di tingkat internal plugin visualizer tertentu (kategori Neon).
- **Film FX (Grain, Dirt, Light Leaks)**
  - *Alasan*: Belum ada efek global (post-processing overlay) untuk retro/film/VHS, melainkan hanya ada plugin visualizer mandiri (`RTR01_VHSGlitch.js`).

### 4. Mapping (Engine → Inspector → Preview)
Jalur sinkronisasi data dari UI hingga ke render:

- **Background (termasuk Motion)**
  - **Engine**: Data disimpan dalam state `m3BgPool` (array background objek).
  - **Inspector**: Diatur melalui `BackgroundPanel.jsx` dan tab Background di `M3ObjectInspector.jsx` yang memanipulasi `m3BgPool[0].props`.
  - **Preview**: Render sinkron dengan canvas/preview via evaluasi properti latar (contoh: `bgDanceZoomEnable`, `blurAmount`).

- **Visualizer / Subtitle / Overlay**
  - **Engine**: Objek direpresentasikan dalam array `m3Objects` (tipe: `visualizer`, `subtitle`, `image`, dll).
  - **Inspector**: State diperbarui secara real-time melalui form input di `M3ObjectInspector.jsx`.
  - **Preview**: Props didistribusikan ke masing-masing komponen render (misal: `VisualizerRenderer.jsx`, `SubtitleAnimationEngine.js`) yang membaca state objek terkini dari `RenderFrameStore`.

- **Reactive Effects**
  - **Engine**: Representasi dalam `m3Objects` (tipe: `reactive` / `effect`).
  - **Inspector**: Diatur melalui `EffectsPanel.jsx`.
  - **Preview**: `RealtimeEffectRenderer.jsx` membaca parameter efek dari state dan merender secara live.

### 5. Risk
Risiko nyata yang ditemukan pada arsitektur saat ini terkait pengembangan FX Preset:

- **Potensi Duplicate State**: Ada fitur identik yang dikontrol di level layer yang berbeda, seperti `Beat Zoom`. `Beat Zoom` di Background dikelola lewat properti `bgDanceZoomEnable` / `bgDanceZoomVal`, sedangkan di Visualizer ada properti independen `beatZoom`. Jika FX Preset ingin mengatur zoom secara "global", sistem akan harus mengatur parameter pada setiap layer secara manual yang rentan asinkron.
- **Parameter Belum Reusable Secara Terpusat**: Logika gerak reaktif latar belakang (Shake, Panning, Rotate) tertanam kuat pada komponen `M3ObjectInspector.jsx` khusus untuk `m3BgPool`. Parameter ini perlu dipisahkan menjadi modul logika/Motion Engine murni jika ingin digunakan untuk menggerakkan objek selain background (misalnya overlay teks atau gambar).
- **Inspector Sinkronisasi Kompleks**: Fungsi `getEffectiveTargetId()` pada Inspector memiliki logika penentuan "fokus" yang cukup panjang dan rentan patah jika tipe objek baru ditambahkan tanpa perlakuan khusus, berpotensi membuat parameter di UI tidak bereaksi saat target tidak dikenali dengan baik.
