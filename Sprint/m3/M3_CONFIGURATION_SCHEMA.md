# M3_CONFIGURATION_SCHEMA.md

# Media Factory

## Mode 3 – Playlist Video Studio

### Configuration Schema Specification

Version : 1.0
Status : Requirement Freeze

---

# 1. Tujuan

Dokumen ini mendefinisikan struktur **Configuration Object** yang digunakan sebagai sumber data utama selama siklus hidup Mode 3.

Configuration adalah **Single Source of Truth** yang menghubungkan:

* Frontend
* Backend
* Queue
* Pipeline
* Render Worker
* Metadata Engine
* Thumbnail Engine

Seluruh engine membaca object yang sama.

---

# 2. Configuration Lifecycle

```text
User Configuration

↓

Configuration Builder

↓

Configuration Object

↓

Queue Payload

↓

Pipeline

↓

Render Worker

↓

Output
```

Configuration hanya dibangun satu kali ketika user menekan **Add Configuration to Queue**.

---

# 3. Root Schema

```json
{
  "project": {},
  "background": {},
  "playlist": {},
  "composer": {},
  "thumbnail": {},
  "effects": {},
  "visualizer": {},
  "metadata": {},
  "render": {},
  "output": {}
}
```

---

# 4. Project Object

```json
{
  "projectId": "",
  "projectName": "",
  "workspace": "",
  "module": "M3",
  "createdAt": "",
  "updatedAt": ""
}
```

---

# 5. Background Object

```json
{
  "type": "image",
  "path": "",
  "width": 1920,
  "height": 1080,
  "loopMode": "normal",
  "fitMode": "cover"
}
```

type

* image
* video

loopMode

* normal
* seamless
* pingpong

---

# 6. Playlist Object

```json
{
  "sourceMode": "folder",
  "shuffle": true,
  "antiDuplicate": true,
  "tracks": [],
  "duration": 0,
  "totalTracks": 0
}
```

tracks berisi seluruh lagu Current Playlist.

---

# 7. Playlist Track Schema

```json
{
  "id": "",
  "index": 1,
  "title": "",
  "artist": "",
  "duration": 0,
  "path": "",
  "youtubeUrl": "",
  "thumbnail": ""
}
```

---

# 8. Composer Object

```json
{
  "canvasWidth": 1920,
  "canvasHeight": 1080,
  "safeArea": true,
  "objects": []
}
```

Composer hanya menyimpan object visual.

---

# 9. Composer Object Schema

```json
{
  "id": "",
  "type": "",
  "name": "",
  "layer": 1,
  "visible": true,
  "locked": false,
  "transform": {},
  "style": {},
  "animation": {}
}
```

---

# 10. Transform Schema

```json
{
  "x": 0,
  "y": 0,
  "width": 300,
  "height": 120,
  "rotation": 0,
  "scale": 1
}
```

---

# 11. Style Schema

```json
{
  "opacity": 1,
  "font": "",
  "fontSize": 32,
  "fontColor": "#FFFFFF",
  "shadow": true,
  "stroke": false,
  "gradient": false,
  "border": false
}
```

---

# 12. Animation Schema

Saat ini disiapkan untuk pengembangan berikutnya.

```json
{
  "enabled": false,
  "type": "",
  "duration": 0
}
```

Belum digunakan pada MVP.

---

# 13. Visualizer Object

```json
{
  "enabled": true,
  "type": "spectrum",
  "position": {},
  "style": {},
  "audioSource": "playlist"
}
```

type

* spectrum
* circle
* bars
* wave

---

# 14. Effects Object

```json
{
  "enabled": true,
  "items": [
    {
      "type": "snow",
      "opacity": 0.5
    }
  ]
}
```

Setiap effect berdiri sendiri.

---

# 15. Thumbnail Object

```json
{
  "saved": true,
  "template": "default",
  "objects": []
}
```

Thumbnail menggunakan object schema yang sama dengan Composer.

---

# 16. Metadata Object

```json
{
  "title": "",
  "description": "",
  "tags": [],
  "timestamps": [],
  "duration": 0
}
```

Metadata akan diteruskan ke AutoUploader.

---

# 17. Render Object

```json
{
  "profile": "balanced",
  "threads": "auto",
  "priority": "normal"
}
```

Render Profile mengacu ke dokumen Render Profile.

---

# 18. Output Object

```json
{
  "folder": "",
  "video": "video.mp4",
  "thumbnail": "thumbnail.jpg",
  "metadata": "metadata.json"
}
```

---

# 19. Validation Rules

Configuration dinyatakan valid apabila:

* Project tersedia.
* Background tersedia.
* Playlist minimal 1 lagu.
* Composer memiliki minimal satu object.
* Thumbnail sudah disimpan.
* Output folder valid.

Jika salah satu gagal, Queue tidak boleh dibuat.

---

# 20. Serialization Rules

Configuration harus dapat:

* Disimpan sebagai JSON.
* Dikirim melalui API.
* Disimpan ke Database.
* Dimasukkan ke Queue.
* Dibaca kembali tanpa kehilangan informasi.

Tidak boleh ada field yang bergantung pada state React.

---

# 21. Versioning

Configuration wajib memiliki versi.

```json
{
  "schemaVersion": "1.0.0"
}
```

Hal ini memungkinkan migrasi schema di masa depan.

---

# 22. Immutability Rules

Setelah Configuration dikirim ke Queue:

* Frontend tidak boleh mengubah object tersebut.
* Queue menggunakan snapshot Configuration.
* Perubahan setelah Queue dibuat hanya berlaku untuk Queue berikutnya.

---

# 23. Acceptance Criteria

Configuration Schema dianggap selesai apabila:

* Semua engine membaca schema yang sama.
* Frontend dan Backend menggunakan struktur identik.
* Queue tidak membutuhkan konversi tambahan.
* Render Worker dapat langsung memproses Configuration.
* Metadata dapat dibuat langsung dari Configuration.
* Tidak ada data duplikat.

---

# 24. Future Backlog

Belum termasuk:

* AI Prompt Configuration
* Subtitle Configuration
* Motion Template Configuration
* GPU Configuration
* Multi Scene Configuration
* Plugin Configuration

---

# 25. Configuration Freeze

Mulai implementasi:

* Root Schema tidak boleh berubah.
* Nama field tidak boleh berubah.
* Struktur object tidak boleh berubah.
* Configuration menjadi Single Source of Truth untuk seluruh Mode 3.

Dokumen ini menjadi acuan resmi Configuration Schema Mode 3 Playlist Video Studio.
