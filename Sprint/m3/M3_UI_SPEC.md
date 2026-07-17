# M3_UI_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### UI / UX Implementation Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. UI Philosophy

Mode 3 bukan halaman konfigurasi.

Mode 3 bukan Form Builder.

Mode 3 adalah Studio.

User harus dapat melihat hasil komposisi sebelum melakukan render.

Seluruh proses harus bersifat visual.

---

# 2. Layout

Layout menggunakan Studio Layout.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Toolbar                                                                                    │
├──────────────┬───────────────────────────────────────────────┬─────────────────────────────┤
│ Assets Panel │               Live Composer                   │     Properties Inspector    │
│              │                                               │                             │
│              │                                               │                             │
│              │                                               │                             │
├──────────────┴───────────────────────────────────────────────┴─────────────────────────────┤
│ Timeline                                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Statistics                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Pipeline Drawer tetap berada di sisi kanan aplikasi.
```

---

# 3. Toolbar

Toolbar selalu tampil.

Tidak berubah ketika berpindah mode.

Urutan:

```
Composer

Thumbnail

Save Template

Template ▼

Apply

Preview Fit
```

---

## Composer

Masuk ke Composer Mode.

---

## Thumbnail

Masuk ke Thumbnail Editor.

---

## Save Template

Menyimpan:

* Layout
* Posisi
* Font
* Overlay
* Effect
* Visualizer
* Style

Tidak menyimpan:

* Thumbnail
* Playlist
* Metadata
* Audio
* Background

---

## Template

Dropdown.

Dummy pada Sprint UI.

Implementasi Backend membaca Template Repository.

---

## Apply

Mengaktifkan Template.

---

## Preview Fit

Mengatur skala Preview.

---

# 4. Assets Panel

Panel kiri.

---

## Background

Pilihan:

Image

Video

Hanya satu yang boleh aktif.

Jika Video aktif

↓

Loop Mode aktif.

Jika Image aktif

↓

Loop Mode disable.

---

## Playlist Audio

Memiliki tiga mode.

### File

Import satu atau banyak file audio.

Support Drag & Drop.

---

### Folder

Import Folder.

Konfigurasi:

Playlist Size

Shuffle

Generate Playlist

Current Playlist dibentuk secara random.

---

### YouTube

Workflow:

Paste URL

↓

Fetch

↓

Preview Metadata

↓

Add To Playlist

---

## Library

Menampilkan seluruh lagu hasil import.

---

## Current Playlist

Menampilkan playlist yang akan dirender.

Setiap item menampilkan:

* Track Number
* Title
* Duration
* Source

Support:

* Remove
* Reorder
* Shuffle

---

## Visualizer

Pilihan:

None

Circle

Bars

Wave

Spectrum

Audio Ring

---

## Effects

Pilihan:

Snow

Rain

Dust

Glow

Fog

Smoke

Fireflies

Light Beam

Club Lights

Particles

---

## Overlay

Pilihan:

Watermark

Subscribe

Playlist Overlay

Current Playing

Track Counter

Track Change Notification

Overlay yang memiliki beberapa style menggunakan Dropdown.

---

## Text Objects

Tersedia tombol:

* Add Playlist Title
* Add Current Playing
* Add Custom Text
* Track List Layout

---

## Track List Layout

Pilihan:

Mode 1

Single Column

Mode 2

Dual Balanced

Mode 3

Dual Wide

Track List selalu membaca Current Playlist.

---

# 5. Live Composer

Canvas Preview.

Aspect Ratio:

16 : 9

---

Canvas menampilkan:

Background

Visualizer

Effects

Watermark

Subscribe

Playlist Overlay

Track Counter

Current Playing

Track List

Custom Text

---

Semua object dapat:

* Select
* Drag
* Move
* Resize (future)
* Rotate (future)

---

# 6. Object Selection

Single Click

↓

Selected

↓

Outline

↓

Inspector berubah

↓

Selection tetap aktif

Selection hanya hilang jika:

* klik area kosong
* klik object lain
* ESC

---

# 7. Track List Object

Track List bukan Text biasa.

Track List adalah Object khusus.

Jenis:

track_list_left

track_list_right

track_list_group

---

Mode:

Single

↓

Satu object.

Dual

↓

Dua object.

Kolom kiri dan kanan dapat dipindahkan secara independen.

---

# 8. Properties Inspector

Inspector berubah sesuai Selected Object.

---

## Header

Selected Object

Nama Object

---

## Transform

Position X

Position Y

Width

Height

Rotation

---

## Appearance

Opacity

Gradient

Shadow

Glow

Border

Radius

---

## Text

Font

Font Size

Weight

Alignment

Color

Stroke

Letter Spacing

Line Height

---

## Playback

Animation Speed

Fade In

Fade Out

Loop

Auto Play

---

## Layer

Layer Order

Bring Forward

Send Backward

---

## Visibility

Visible

Hidden

---

## Lock

Lock Position

---

# 9. Timeline

Timeline hanya visualisasi.

Track:

Background

Playlist

Overlay

Effects

Visualizer

---

Header Timeline:

Play

Pause

Stop

Restart

Loop Mode

---

Loop Mode:

Normal

Seamless

Ping Pong

Loop hanya aktif jika Background menggunakan Video.

---

# 10. Preview Status

Preview menampilkan:

Current Time

/

Total Duration

Contoh:

00:25 / 01:12:30

---

# 11. Thumbnail Editor

Mode kedua.

Menggunakan Canvas sendiri.

---

Toolbar tetap sama.

---

Canvas menampilkan:

Background

Title

Subtitle

Track List

Logo

Overlay

---

Fitur:

Import Thumbnail

Save Thumbnail

Save Template

Choose Template

Apply

---

Track List tetap membaca Current Playlist.

---

# 12. Statistics

Menampilkan:

Playlist Duration

Estimated Render Time

Estimated Output Size

Storage Usage

---

# 13. Queue

Button:

Add Configuration To Queue

Mengirim konfigurasi ke Pipeline.

Belum melakukan render.

---

# 14. Toast Notification

Success:

* Thumbnail berhasil disimpan
* Template berhasil disimpan
* Konfigurasi berhasil ditambahkan ke Queue

Warning:

* Thumbnail belum disimpan
* Playlist kosong
* Background belum dipilih

Error:

* Import gagal
* Template gagal dimuat
* Queue gagal ditambahkan

---

# 15. UI State

Composer Mode

Thumbnail Mode

Object Selected

Preview Playing

Preview Pause

Preview Stop

Current Playlist

Library

Template

Background Type

Loop Mode

---

# 16. Interaction Rules

Semua object menggunakan pola yang sama.

Click

↓

Selected

↓

Outline

↓

Inspector Update

↓

Edit

↓

Canvas Update

↓

Selection tetap aktif

---

# 17. Accessibility

Minimal:

* Keyboard Navigation
* ESC untuk Deselect
* TAB Navigation
* Tooltip untuk seluruh Toolbar
* Focus State pada seluruh Button

---

# 18. Acceptance Criteria

UI dianggap selesai apabila:

* Studio Layout sesuai desain final.
* Toolbar konsisten pada Composer dan Thumbnail.
* Assets Panel lengkap.
* Live Composer berfungsi.
* Properties Inspector sinkron.
* Timeline tersedia.
* Track List Layout bekerja.
* Thumbnail Editor bekerja.
* Queue Button tersedia.
* Seluruh interaction konsisten.
* Tidak ada perubahan terhadap requirement yang telah di-freeze.

---

# 19. UI Freeze

Mulai dokumen ini disetujui:

* Tidak boleh mengubah layout.
* Tidak boleh mengubah workflow.
* Tidak boleh mengubah UX.
* Tidak boleh menambah komponen baru.

Seluruh perubahan berikutnya hanya berupa implementasi backend atau perbaikan bug.

Dokumen ini menjadi acuan implementasi React untuk Mode 3 Playlist Video Studio.
