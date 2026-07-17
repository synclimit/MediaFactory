# Database Schema

Tables:
- download_jobs
- library_sources
- library_items
- render_jobs
- render_steps
- formulas
- app_settings
- extension_queue

Notes:
- library_items memiliki field used_flag,last_used_at,source_library.
- Job status: queued,processing,done,failed,cancelled.
