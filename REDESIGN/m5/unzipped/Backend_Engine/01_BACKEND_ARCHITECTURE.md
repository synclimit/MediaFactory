# Backend Architecture

Modules:
- Collect Service
- Download Service
- Library Service
- Formula Engine
- Queue Builder
- Pipeline Dispatcher
- Render Scheduler
- FFmpeg Engine
- Metadata Service
- Settings Service

Generate Queue hanya membuat Job dan mengirim ke Pipeline.
Render dilakukan oleh Pipeline Scheduler.
