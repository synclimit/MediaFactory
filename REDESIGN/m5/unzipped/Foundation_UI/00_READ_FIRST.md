# MediaFactory M5 - Foundation UI v1

Status: FOUNDATION LOCKED

Dokumen ini adalah fondasi implementasi M5.

Prinsip:
- M5 adalah Short Video Factory, bukan editor timeline.
- Workflow dipisah menjadi Collect dan Create.
- Generate Queue TIDAK melakukan render.
- Generate Queue hanya mengirim Job ke Pipeline/Render Queue global MediaFactory.
