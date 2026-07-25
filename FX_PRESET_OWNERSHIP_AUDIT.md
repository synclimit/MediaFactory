# SPRINT 1.1 — FX OWNERSHIP AUDIT

## 1. Parameter Ownership & Mapping

Berikut adalah dokumentasi mengenai siapa pemilik (*owner*) dari setiap parameter yang berpotensi digunakan oleh FX Preset, beserta jalur aliran datanya (State → Inspector → Renderer → Preview). Semua data didasarkan murni dari kondisi *codebase* saat ini tanpa asumsi.

### 1.1. Background Layer

- **Blur**
  - **Owner**: Background
  - **State**: `m3BgPool[0].props.blurAmount`
  - **Inspector**: `BackgroundPanel` / `M3ObjectInspector` (Background tab)
  - **Renderer**: Background Renderer (M3PreviewCanvas)
  - **Preview**: Canvas rendering

- **Darken**
  - **Owner**: Background
  - **State**: `m3BgPool[0].props.overlayDarkness`
  - **Inspector**: `BackgroundPanel` / `M3ObjectInspector`
  - **Renderer**: Background Renderer
  - **Preview**: Canvas rendering

- **Zoom (Static)**
  - **Owner**: Background
  - **State**: `m3BgPool[0].props.bgZoom`
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: Background Renderer
  - **Preview**: Canvas rendering

- **Offset X & Offset Y**
  - **Owner**: Background
  - **State**: `m3BgPool[0].props.x` / `m3BgPool[0].props.y`
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: Background Renderer
  - **Preview**: Canvas rendering

- **Rotation (Beat-driven)**
  - **Owner**: Background Motion (`bgDance`)
  - **State**: `m3BgPool[0].props.bgDanceRotateVal`
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: Background Renderer
  - **Preview**: Canvas rendering

- **Motion (Shake/Sway)**
  - **Owner**: Background Motion
  - **State**: `m3BgPool[0].props.bgDanceSwayLREnable`, `bgDanceShakeEnable`, dll.
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: Background Renderer
  - **Preview**: Canvas rendering

### 1.2. Visualizer Layer

- **Visualizer Type**
  - **Owner**: Visualizer
  - **State**: `m3Objects` (`type: 'visualizer'`, `visualizerId`)
  - **Inspector**: `VisualizerPanel`
  - **Renderer**: `VisualizerRenderer`
  - **Preview**: Canvas rendering

- **Color / Gradient**
  - **Owner**: Visualizer
  - **State**: `m3Objects` (`color`, `colorLeft`, `colorRight`, `colorMode`)
  - **Inspector**: `M3ObjectInspector` (Visualizer Section)
  - **Renderer**: `VisualizerRenderer`
  - **Preview**: Canvas rendering

- **Pulse & Size / Thickness**
  - **Owner**: Visualizer
  - **State**: `m3Objects` (`barCount`, properti spesifik plugin visualizer)
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: `VisualizerRenderer`
  - **Preview**: Canvas rendering

- **Opacity**
  - **Owner**: Visualizer
  - **State**: `m3Objects` (`opacity`)
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: `VisualizerRenderer`
  - **Preview**: Canvas rendering

### 1.3. Global Effects (Post-Process & Reactive)

- **Brightness & Contrast**
  - **Owner**: Global Effects (`RealtimeEffectRenderer`)
  - **State**: `m3Objects` (Objek dengan tipe efek reaktif tertentu, misal `presetId: 'brightness'`)
  - **Inspector**: `EffectsPanel`
  - **Renderer**: `RealtimeEffectRenderer` memodifikasi state perantara via fungsi post process CSS filter di container utama.
  - **Preview**: DOM CSS Filter (`filter: brightness(...) contrast(...)`)

- **Camera Shake & Zoom Pulse**
  - **Owner**: Global Effects
  - **State**: `m3Objects` (`presetId: 'camera-shake'`, `'zoom-pulse'`)
  - **Inspector**: `EffectsPanel`
  - **Renderer**: `RealtimeEffectRenderer`
  - **Preview**: DOM Canvas Scaling / Transforms

### 1.4. Particle Layer

- **Preset, Density, Speed, Opacity, Color**
  - **Owner**: Particle Engine
  - **State**: `m3Objects` (`type: 'particles'`) -> properti internal seperti `count`, `gravity`, `wind`
  - **Inspector**: `EffectsPanel` (Particle section)
  - **Renderer**: `ParticleEngineCore` (dirender melalui perulangan `RealtimeEffectRenderer`)
  - **Preview**: Overlay Canvas rendering

### 1.5. Lyrics / Subtitle & Overlay Layer

- **Font, Size, Color, Shadow, Animation**
  - **Owner**: Subtitle Engine
  - **State**: `m3Objects` (tipe: `subtitle`)
  - **Inspector**: `M3ObjectInspector` (Subtitle section)
  - **Renderer**: `SubtitleAnimationEngine`
  - **Preview**: Canvas rendering

- **Transform (X, Y, Scale) & Overlay Opacity**
  - **Owner**: Base Component / Overlay
  - **State**: `m3Objects` (`transform.x`, `transform.scale`, `opacity`)
  - **Inspector**: `M3ObjectInspector`
  - **Renderer**: Objek rendering dinamis
  - **Preview**: Canvas rendering

---

## 2. Multi-Owner Analysis (Duplicate Check)

Terdapat beberapa kapabilitas yang diklaim dan dieksekusi oleh lebih dari satu sistem (Multi-Owner) secara terpisah:

1. **Beat Zoom / Pulse (3-way Multi-Owner)**
   - **Background** memiliki eksekusi Zoom melalui `bgDanceZoomEnable`.
   - **Visualizer** memiliki eksekusi Zoom melalui properti `beatZoom`.
   - **Global Effects** memiliki efek global "Zoom Pulse" dari `EffectsPanel`.
   - *Status*: Ketiganya menyimpan state terpisah dan tidak saling berbagi sumber parameter pusat.

2. **Blur (2-way Multi-Owner)**
   - **Background** memiliki efek blur statis `blurAmount` (`m3BgPool`).
   - **Global Effects** memiliki reaktif blur melalui eksekusi post-process DOM.
   - *Status*: Bekerja di lapisan yang berbeda (satu di kanvas dasar, satu di lapisan CSS).

---

## 3. Global Capability Validation (Existing vs Reusable vs Missing)

Berdasarkan investigasi ulang, ini adalah status sebenarnya dari komponen yang sebelumnya diindikasikan "Missing":

- **Color Grading (Brightness, Contrast, Saturation)**
  - **Status: Existing / Reusable (Partially)**
  - *Alasan*: Ternyata `RealtimeEffectRenderer.jsx` **sudah memiliki** fungsionalitas yang mengumpulkan `brightness`, `contrast`, dan `saturation` lalu mengaplikasikannya via global DOM CSS `filter`. Fitur dasar sudah tersedia untuk digunakan FX Preset tanpa buat baru. Tetapi, dukungan LUT atau grading level sinematik masih *Missing*.

- **Stage Light Engine**
  - **Status: Missing**
  - *Alasan*: Tidak ada engine di seluruh *codebase* yang merender elemen cahaya prosedural/geometris (seperti *god rays*, atau lampu panggung).

- **Border Glow / Neon Frame**
  - **Status: Missing**
  - *Alasan*: Glow hanya tersedia secara internal pada plugin Visualizer jenis Neon dan Retro, belum ada layar glow bingkai global yang mandiri.

- **Film FX (Grain, Dirt, VHS)**
  - **Status: Existing / Reusable (Partially)**
  - *Alasan*: `RealtimeEffectRenderer` ternyata sudah memiliki logika efek `retro`/`vhs` global yang merender *scanlines*. Namun elemen granularitas murni (grain/dirt procedurally generated) masih belum lengkap.

---

## 4. FX Preset Impact Matrix

Tabel ini merangkum kapabilitas mana yang aman untuk dieksploitasi langsung pada implementasi FX Preset di Sprint selanjutnya:

| FX Parameter | Owner | Reusable | Multi Owner | Technical Risk |
| :--- | :--- | :---: | :---: | :--- |
| **Brightness / Contrast** | Effects (`RealtimeEffectRenderer`) | Yes | No | **Low** - Menggunakan CSS Filter, performa sangat baik. |
| **Background Motion** | Background (`m3BgPool`) | Yes | No | **Medium** - Logika motion terikat erat ke properti `m3BgPool` bukan objek generik. |
| **Beat Zoom** | Background, Visualizer, Effects | No | **Yes (3 Owners)** | **High** - State saling berkonflik. FX Preset yang mencoba mengatur Zoom harus mematikan yang lain atau akan terjadi bentrokan UI. |
| **Blur** | Background, Effects | Yes | **Yes (2 Owners)** | **Medium** - Overlap rendering (Canvas vs DOM). |
| **Visualizer Styles** | Visualizer (`m3Objects`) | Yes | No | **Low** - Arsitektur plugin registry sudah matang. |
| **Typography & Subtitle** | Subtitle (`m3Objects`) | Yes | No | **Low** - Parameter transform mudah dimanipulasi. |
| **Camera Shake** | Effects (`m3Objects`) | Yes | No | **Low** - Sudah tersentralisasi di `FXStack` / `RealtimeEffectRenderer`. |

---

## 5. Technical Risks Summary

* **State Fragmentation**: Parameter FX Preset harus disebar ke `m3BgPool` (untuk Background) dan `m3Objects` (untuk Visualizer, Text, dan Effects). FX Preset Controller kelak harus memiliki kapabilitas agregasi untuk menyimpan dan menyebarkan parameter ini ke dua tempat (state) yang berbeda tersebut secara serentak, untuk menghindari *out-of-sync*.
* **Beat Zoom Conflict**: Merupakan risiko paling menonjol. Menerapkan preset Zoom yang global membutuhkan intervensi untuk menonaktifkan fitur zoom *native* pada komponen Background dan Visualizer agar efek tidak bertumpuk / berlebihan (amplifikasi ganda).
