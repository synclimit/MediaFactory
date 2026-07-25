# FX PRESET SPECIFICATION (DESIGN FREEZE)

## 1. FX Preset Workflow

Berikut adalah alur penggunaan fitur FX Preset dari sudut pandang pengguna (*User Journey*):

1. **Buka Panel**: Pengguna membuka panel/jendela khusus FX Preset di dalam antarmuka Media Factory.
2. **Lihat Daftar**: Pengguna melihat daftar preset yang tersedia (dikelompokkan berdasarkan genre atau gaya) beserta thumbnail representatif untuk masing-masing preset.
3. **Pilih Preset**: Pengguna mengklik salah satu preset yang diinginkan.
4. **Tentukan Apply Scope**: Pengguna melihat dan mengonfigurasi *Apply Scope* melalui kotak centang (*checkboxes*) untuk menentukan kategori layer mana saja yang akan dipengaruhi (misal: Background, Visualizer, Particle, Effects, Subtitle).
5. **Aplikasi Preset**: Sistem langsung menerapkan perubahan nilai parameter secara instan ke *engine*, **hanya** pada kategori yang dicentang pada *Apply Scope*.
6. **Status Aktif**: Status indikator FX Preset di UI berubah menjadi **[Nama Preset]** (contoh: "Active: Lofi Chill").
7. **Modifikasi Manual (Custom)**: Jika pengguna kemudian mengubah salah satu parameter (yang sebelumnya diatur oleh preset) secara manual melalui panel Inspector biasa, indikator status otomatis berubah menjadi **Custom**.
8. **Penggantian Fleksibel**: Pengguna dapat memilih preset lain dari daftar kapan saja, yang akan menimpa parameter saat ini sesuai aturan *Apply Scope* yang aktif.

---

## 2. Apply Preset Rules

Aturan mutlak (*strict rules*) yang harus dipatuhi sistem saat menerapkan preset:

* **Scope Isolation**: Preset **hanya** diizinkan mengubah parameter yang termasuk dalam *Apply Scope* yang dicentang oleh pengguna.
* **No Side Effects**: Seluruh parameter dan layer yang berada di luar *Apply Scope* **tidak boleh berubah** sedikit pun.
* **Branding Protection**: Preset mutlak **tidak boleh** menyentuh, mengubah, atau menghapus elemen Branding (Logo pengguna, Watermark, dsb).
* **Asset Preservation**: Preset **tidak boleh** menghapus konfigurasi dasar pengguna (seperti file video/gambar *background* asli yang diunggah pengguna, *playlist* audio, atau data lirik). Preset hanya mengubah *styling* dan parameter *effects*.

---

## 3. Custom State Rules

Definisi kondisi transisi status indikator Preset:

* **Status: [Nama Preset]**
  - Hanya terjadi sesaat setelah pengguna menekan dan menerapkan sebuah preset baru dari daftar.
  - Berarti seluruh parameter visual di layar saat ini 100% identik dengan cetak biru (*blueprint*) dari preset tersebut.

* **Status: Custom**
  - Otomatis terjadi jika pengguna mengubah **satu atau lebih parameter** secara manual melalui Inspector (contoh: mengganti warna *Visualizer*, menambah *Particle Count*, mengubah font *Subtitle*) setelah preset diterapkan.
  - Terjadi jika pengguna mengubah konfigurasi *Apply Scope* (menambah/menghapus centang) setelah preset aktif.
  - *Catatan*: Jika pengguna mengembalikan nilai parameter secara manual ke nilai aslinya, sistem tetap berada di status **Custom**. Untuk kembali ke status Preset, pengguna harus menekan ulang tombol preset di daftar.

---

## 4. Conflict Rules

Aturan penanganan untuk parameter yang memiliki kepemilikan ganda (*Multi-Owner*), seperti teridentifikasi pada audit sebelumnya:

* **Beat Zoom Rule**
  - Mengingat Beat Zoom dikendalikan oleh Background, Visualizer, dan Global FX, preset yang mengaktifkan efek Zoom **harus mendeklarasikan** target spesifiknya.
  - Jika preset mengaktifkan *Global Zoom Pulse*, sistem harus menonaktifkan *Beat Zoom* lokal pada Background dan Visualizer (jika termasuk dalam *Apply Scope*) agar efek perbesaran gambar tidak bertumpuk / diamplifikasi secara berlebihan.
  
* **Blur Rule**
  - Jika sebuah preset menggunakan *Blur*, preset harus menetapkan apakah blur tersebut adalah Blur statis (*Background Layer*) atau Blur reaktif (*Post-Process DOM*). Sistem tidak boleh mengeksekusi kedua jenis blur tersebut secara tumpang tindih untuk tujuan yang sama.

---

## 5. Non-Goals

Berikut adalah batasan ruang lingkup. Hal-hal di bawah ini **BUKAN** merupakan bagian dari pengembangan fitur FX Preset dan **TIDAK AKAN** diimplementasikan pada pengerjaan ini:

* **TIDAK** membuat sistem *AI Preset* atau *Smart Generator*.
* **TIDAK** menerapkan *Auto Detect Genre* dari analisis audio.
* **TIDAK** membuat *Marketplace Preset* atau fitur berbagi preset antar pengguna.
* **TIDAK** mengimplementasikan integrasi *Cloud Sync* untuk preset.
* **TIDAK** membuat fitur *Import/Export Preset* via sistem file eksternal.
* **TIDAK** mengubah fundamental *workflow* utama Media Factory (seperti proses ekspor video, pipeline audio).
* **TIDAK** melakukan *redesign* antarmuka (*UI*) Inspector dan Panel yang sudah ada saat ini.
