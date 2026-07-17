# M3_FILE_STRUCTURE_SPEC.md

# Media Factory

## Mode 3 – Playlist Video Studio

### File Structure & Workspace Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini mendefinisikan struktur folder, penamaan file, workspace, cache, temporary files, dan output Mode 3.

Tujuan utamanya adalah:

* konsisten
* mudah dipindahkan
* mudah di-backup
* mudah diproses Pipeline
* mudah dibaca AutoUploader

---

# 2. Workspace Philosophy

Satu Project Mode 3 memiliki satu Workspace.

Semua file project berada di dalam Workspace tersebut.

Tidak boleh menyimpan file project secara acak.

---

# 3. Workspace Structure

```text
Workspace/

└── Project_Name/

    ├── assets/
    │
    ├── background/
    │
    ├── audio/
    │
    ├── thumbnails/
    │
    ├── preview/
    │
    ├── temp/
    │
    ├── cache/
    │
    ├── output/
    │
    ├── logs/
    │
    ├── config/
    │
    └── project.json
```

---

# 4. Folder Assets

Berisi asset asli.

```text
assets/

image01.jpg

image02.png

video01.mp4
```

Asset tidak boleh diubah.

---

# 5. Folder Background

Berisi background aktif.

```text
background/

background.jpg

atau

background.mp4
```

Hanya satu background aktif.

---

# 6. Folder Audio

Berisi seluruh audio playlist.

```text
audio/

001.mp3

002.mp3

003.mp3

...
```

File mengikuti urutan playlist.

---

# 7. Folder Thumbnails

```text
thumbnails/

thumbnail.jpg

thumbnail.psd (future)

thumbnail_template.json
```

---

# 8. Folder Preview

Berisi preview.

```text
preview/

preview.jpg

preview.mp4

preview_cache.json
```

Preview tidak digunakan oleh Render Worker.

---

# 9. Folder Temp

Folder sementara.

```text
temp/

frames/

audio/

concat/

effects/

visualizer/
```

Seluruh isi folder ini boleh dihapus setelah render selesai.

---

# 10. Folder Cache

Berisi cache.

```text
cache/

playlist.cache

metadata.cache

waveform.cache

thumbnail.cache
```

Cache dapat dibangun ulang.

---

# 11. Folder Output

Output akhir.

```text
output/

video.mp4

thumbnail.jpg

metadata.json
```

Pipeline hanya membaca folder ini.

---

# 12. Folder Logs

```text
logs/

render.log

worker.log

activity.log

error.log
```

---

# 13. Folder Config

```text
config/

composer.json

thumbnail.json

playlist.json

template.json

configuration.json
```

---

# 14. project.json

Project utama.

Contoh:

```json
{
  "projectId":"",
  "projectName":"",
  "module":"M3",
  "workspace":"",
  "createdAt":""
}
```

---

# 15. Naming Convention

Semua file menggunakan:

snake_case

atau

lowercase.

Tidak menggunakan spasi.

Contoh:

```text
rain_playlist

deep_sleep

forest_ambience
```

---

# 16. Output Naming

Video

```text
video.mp4
```

Thumbnail

```text
thumbnail.jpg
```

Metadata

```text
metadata.json
```

Tidak berubah.

AutoUploader bergantung pada nama ini.

---

# 17. Temporary File Naming

```text
temp_video_001.mp4

temp_audio_001.wav

temp_overlay.png

temp_visualizer.mov
```

---

# 18. Cache Rules

Cache digunakan untuk:

* waveform
* playlist
* metadata
* preview

Cache bukan source utama.

---

# 19. Cleanup Rules

Setelah render berhasil.

Worker wajib menghapus:

* temp/
* cache render sementara

Tidak menghapus:

* assets/
* output/
* config/
* logs/

---

# 20. Import Rules

Import File

↓

Salin ke:

audio/

Import Background

↓

Salin ke:

background/

Import Thumbnail

↓

Salin ke:

thumbnails/

---

# 21. Export Rules

Export hanya mengambil isi:

```text
output/
```

Tidak membawa cache.

Tidak membawa temp.

---

# 22. Backup Rules

Backup Project cukup menyalin:

```text
assets/

background/

audio/

config/

thumbnails/

project.json
```

Folder temp tidak perlu dibackup.

---

# 23. Workspace Recovery

Jika project dibuka kembali.

Sistem membaca:

```text
project.json

↓

configuration.json

↓

playlist.json

↓

composer.json

↓

thumbnail.json
```

Kemudian membangun ulang state frontend.

---

# 24. Maximum Recommended Size

Workspace:

Tidak dibatasi.

Namun:

temp/

maksimal dibersihkan otomatis setiap render selesai.

---

# 25. Security Rules

Tidak boleh:

* Path Traversal
* Relative Path keluar Workspace
* Menulis file di luar Workspace
* Overwrite tanpa izin

Semua path harus divalidasi.

---

# 26. Compatibility

Struktur folder harus kompatibel dengan:

* Pipeline
* AutoUploader
* Workspace Browser (Future)
* Backup System

---

# 27. Future Backlog

Belum termasuk:

* Cloud Workspace
* Multi Workspace
* Workspace Versioning
* Incremental Backup
* Asset Deduplication
* Shared Asset Library

---

# 28. Acceptance Criteria

File Structure dianggap selesai apabila:

* Semua project menggunakan struktur yang sama.
* Output selalu berada di folder output.
* Temp dibersihkan otomatis.
* Cache dapat dibangun ulang.
* Project dapat dipindahkan ke komputer lain tanpa kehilangan data.
* AutoUploader dapat langsung membaca folder output.

---

# 29. Workspace Freeze

Mulai implementasi:

* Struktur folder tidak boleh berubah.
* Nama folder output tidak boleh berubah.
* Nama video.mp4, thumbnail.jpg, metadata.json tidak boleh berubah.
* Pipeline dan AutoUploader menggunakan struktur ini sebagai standar resmi.

Dokumen ini menjadi acuan resmi File Structure & Workspace Mode 3 Playlist Video Studio.
