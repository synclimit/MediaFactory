# MediaFactory Platform Database Schema V1

## Purpose

Database schema for:

* Multi User
* Workspace
* Projects
* Activity Logs
* Queue System
* Templates
* Presets

Compatible with:

* LocalStorage
* SQLite
* Supabase
* PostgreSQL

---

# TABLE

users

```sql
id UUID PRIMARY KEY

email TEXT

name TEXT

role TEXT

avatar_url TEXT

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# TABLE

workspaces

```sql
id UUID PRIMARY KEY

name TEXT

owner_id UUID

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# TABLE

workspace_members

```sql
id UUID PRIMARY KEY

workspace_id UUID

user_id UUID

role TEXT

created_at TIMESTAMP
```

---

Roles

```text
Owner

Editor

Viewer
```

---

# TABLE

projects

```sql
id UUID PRIMARY KEY

workspace_id UUID

name TEXT

description TEXT

status TEXT

created_by UUID

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

Status

```text
Draft

Active

Archived
```

---

# TABLE

activity_logs

```sql
id UUID PRIMARY KEY

workspace_id UUID

user_id UUID

project_id UUID

action TEXT

details JSONB

created_at TIMESTAMP
```

---

Examples

```text
Created M2 Configuration

Started Render

Completed Render

Loaded Preset

Deleted Queue Item
```

---

# TABLE

queue_jobs

```sql
id UUID PRIMARY KEY

workspace_id UUID

project_id UUID

created_by UUID

mode TEXT

job_name TEXT

status TEXT

payload JSONB

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

Status

```text
Pending

Queued

Rendering

Completed

Failed

Cancelled
```

---

# TABLE

render_history

```sql
id UUID PRIMARY KEY

workspace_id UUID

project_id UUID

queue_job_id UUID

rendered_by UUID

status TEXT

duration_seconds INTEGER

output_count INTEGER

created_at TIMESTAMP
```

---

# TABLE

templates

```sql
id UUID PRIMARY KEY

workspace_id UUID

name TEXT

template_type TEXT

payload JSONB

created_by UUID

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

Template Types

```text
Thumbnail

Naming

Workflow
```

---

# TABLE

presets

```sql
id UUID PRIMARY KEY

workspace_id UUID

name TEXT

preset_type TEXT

payload JSONB

created_by UUID

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

Preset Types

```text
Audio

Video

Render
```

---

# TABLE

settings

```sql
id UUID PRIMARY KEY

workspace_id UUID

key TEXT

value JSONB

updated_at TIMESTAMP
```

---

# TABLE

sync_queue

```sql
id UUID PRIMARY KEY

entity_type TEXT

entity_id UUID

action TEXT

payload JSONB

status TEXT

created_at TIMESTAMP
```

---

Purpose

Offline Sync System

---

Status

```text
Pending

Synced

Failed
```

---

# Local Only Tables

Not synced to cloud.

---

local_render_cache

```sql
id UUID PRIMARY KEY

project_id UUID

cache_path TEXT

created_at TIMESTAMP
```

---

local_media_sources

```sql
id UUID PRIMARY KEY

project_id UUID

local_path TEXT

file_hash TEXT

created_at TIMESTAMP
```

---

# Design Principle

Cloud stores:

* Metadata
* Logs
* Projects
* Templates
* Presets

Local machine stores:

* Media files
* Render cache
* Output files

This minimizes cloud costs while preserving collaboration.

```
```
