# SPRINT 1.2 — FX PRESET PARAMETER MATRIX

## 1. Parameter Inventory & 2. FX Preset Eligibility

Berikut adalah daftar seluruh parameter yang secara realistis dapat dikendalikan oleh FX Preset, beserta kelayakannya (*Eligibility*) untuk diotomatisasi oleh sistem Preset.

### Background Layer

| Parameter | Status | Alasan Teknis |
| :--- | :--- | :--- |
| **Blur** | Recommended | Aman dikendalikan global (`blurAmount`) untuk menciptakan fokus pada elemen depan. |
| **Darken** | Recommended | Sangat berguna (`overlayDarkness`) untuk meningkatkan keterbacaan teks/lirik. |
| **Zoom (Static)** | Optional | Aman, tetapi mungkin memotong elemen penting dari foto/video latar pengguna. |
| **Beat Zoom (Pulse)** | Not Recommended | Multi-owner. Rentan bentrok dengan efek Zoom di Visualizer atau Global Camera Pulse. |
| **Motion (Sway/Pan)** | Recommended | Parameter gerak kiri/kanan (`bgDanceSwayLREnable`) stabil dan memberikan kesan dinamis tanpa merusak komposisi. |
| **Rotation** | Optional | Cocok untuk genre ekstrem, tetapi rotasi layar berpotensi membuat pusing / disorientasi. |
| **Offset X / Y** | Not Recommended | Berisiko besar merusak framing gambar/video asli dari pengguna (keluar batas layar). |

### Visualizer Layer

| Parameter | Status | Alasan Teknis |
| :--- | :--- | :--- |
| **Type (Plugin ID)**| Recommended | Inti dari visual preset (misal beralih dari Bars ke Circle). Sangat stabil (Single-owner). |
| **Color / Gradient** | Recommended | Cara paling efektif untuk mengubah *mood* warna secara global tanpa merusak susunan. |
| **Size / Thickness** | Recommended | Bisa di-override dengan aman (contoh: ketebalan garis spektrum). |
| **Opacity** | Optional | Pengguna biasanya ingin spektrum tetap terlihat jelas, menurunkannya bisa mengurangi impak. |
| **Beat Zoom** | Not Recommended | Berkonflik dengan Background Beat Zoom (Multi-owner). |

### Particle Layer

| Parameter | Status | Alasan Teknis |
| :--- | :--- | :--- |
| **Preset (Style)** | Recommended | Sangat memengaruhi atmosfer (contoh: *Dust* untuk Lofi, *Explosion* untuk Rock). |
| **Density (Count)** | Recommended | Mudah dimanipulasi untuk mengatur seberapa "ramai" layar. |
| **Speed (Gravity/Wind)**| Recommended | Parameter krusial untuk tempo (lambat untuk santai, cepat untuk agresif). |
| **Color** | Recommended | Mudah disinkronkan dengan tema warna Visualizer. |
| **Opacity** | Recommended | Sangat aman untuk diatur agar tidak menutupi subjek utama. |

### Global Effects (Post-Process & Reactive)

| Parameter | Status | Alasan Teknis |
| :--- | :--- | :--- |
| **Brightness** | Recommended | Efek global via CSS Filter (`RealtimeEffectRenderer`), sangat aman dan terpusat. |
| **Contrast** | Recommended | Menambah ketajaman gambar secara keseluruhan, aman dieksekusi. |
| **Saturation** | Recommended | Mampu menciptakan nuansa B&W (hitam putih) atau super *vibrant*. |
| **Camera Shake** | Optional | Sangat genre-spesifik. Terlalu keras bisa merusak kenyamanan menonton. |
| **Zoom Pulse** | Optional | Alternatif teraman jika ingin Beat Zoom (karena berbasis DOM global), asalkan *native* beat zoom dimatikan. |
| **Retro / VHS** | Optional | Cocok untuk Lofi/Vintage, tidak disarankan menyala untuk semua genre. |

### Subtitle / Lyrics Layer

| Parameter | Status | Alasan Teknis |
| :--- | :--- | :--- |
| **Theme / Font** | Recommended | Mengubah font (misal dari Serif ke Sans-Serif) sangat kuat dalam mendefinisikan genre. |
| **Font Color** | Recommended | Penyesuaian warna lirik dengan palet preset sangat aman. |
| **Shadow / Glow** | Recommended | Menjamin lirik tetap terbaca di atas partikel atau efek terang. |
| **Animation** | Optional | Beberapa animasi teks mungkin terlalu agresif (patah-patah) untuk lagu lambat. |

---

## 3. Genre Compatibility Matrix

Matriks kesesuaian penerapan parameter terhadap beberapa kategori Genre.
*(Legenda: ✓ Sangat Cocok / Direkomendasikan | △ Opsional / Tergantung Selera | ✗ Tidak Cocok / Dihindari)*

| Parameter | Lofi / Chill | DJ / Club | EDM / Bass | Dangdut / Pop | Rock / Metal |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Background Blur** | ✓ | △ | △ | ✓ | ✗ |
| **Darken Overlay** | ✓ | ✓ | ✓ | △ | ✓ |
| **Motion (Sway)** | ✓ | ✓ | ✓ | ✓ | △ |
| **Beat Zoom (Global)**| ✗ | ✓ | ✓ | △ | ✓ |
| **Particle (Dust/Snow)**| ✓ | △ | ✗ | ✓ | ✗ |
| **Particle (Energy)** | ✗ | ✓ | ✓ | △ | ✓ |
| **Camera Shake** | ✗ | △ | ✓ | ✗ | ✓ |
| **High Saturation** | ✗ | ✓ | ✓ | ✓ | ✗ |
| **Retro / VHS FX** | ✓ | ✗ | ✗ | ✗ | △ |
| **Glow / Neon Text** | △ | ✓ | ✓ | ✓ | ✗ |

---

## 4. FX Preset Scope Recommendation (Apply Scope)

Ketika preset diterapkan, pengguna mungkin ingin mengontrol layer mana saja yang akan dioverride oleh Preset. Berikut adalah rekomendasi untuk fitur **Apply Scope** (centang kategori):

| Kategori | Scope Status | Alasan Teknis |
| :--- | :---: | :--- |
| **Background** | ✓ | Parameter seperti blur, darken, dan sway sangat mendefinisikan genre dan aman ditimpa. |
| **Visualizer** | ✓ | Komponen utama *music video*, mengubah bentuk dan warna spektrum adalah inti dari FX Preset. |
| **Particle** | ✓ | Partikel membangun atmosfer (Lofi = debu lambat, EDM = energi cepat). Sangat direkomendasikan masuk scope. |
| **Effects (Global)** | ✓ | Pengaturan warna (Kontras, Saturasi) dan Shake (Kamera) merupakan penyatuan visual tahap akhir. |
| **Subtitle / Lyrics**| △ | Opsional. Pengguna sering kali sudah memiliki *styling* lirik manual yang tidak ingin dirusak oleh Preset. Sebaiknya ada opsi untuk *exclude*. |
| **Branding (Logo)** | ✗ | Tidak boleh disentuh oleh Preset. Logo, nama artist, dan posisi *watermark* adalah ranah privasi/merek pengguna yang tidak terkait genre. |
