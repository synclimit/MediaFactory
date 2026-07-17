# TASK 00 - Platform Foundation Layer

Priority: CRITICAL

Status: MUST COMPLETE BEFORE M2

---

# Objective

Build the platform foundation required for:

* Multi User
* Workspace
* Activity Logs
* Shared Templates
* Shared Presets
* Shared Projects
* Future Supabase Migration

This task must be completed before implementing any new M2 features.

---

# Requirement 01

Service Layer

Create:

src/services/

---

Required Services

ProjectService

QueueService

ActivityService

TemplateService

PresetService

SettingsService

UserService

WorkspaceService

---

Rule

UI components must never directly access storage.

All persistence must go through services.

---

# Requirement 02

Repository Layer

Create:

src/repositories/

---

Required Repositories

ProjectRepository

QueueRepository

ActivityRepository

TemplateRepository

PresetRepository

SettingsRepository

UserRepository

WorkspaceRepository

---

Rule

Services talk to repositories.

UI never talks to repositories directly.

---

# Requirement 03

Storage Provider Layer

Create:

src/storage/

---

Required Providers

LocalStorageProvider

StorageProvider Interface

---

Future Providers

SupabaseProvider

SQLiteProvider

PostgreSQLProvider

---

Rule

Repositories must use providers.

Repositories must never directly use localStorage.

---

# Requirement 04

Workspace Entity

Create standard Workspace entity.

Required fields:

{
id,
name,
ownerId,
createdAt,
updatedAt
}

---

# Requirement 05

User Entity

Required fields:

{
id,
email,
name,
role,
createdAt,
updatedAt
}

---

Roles

Owner

Editor

Viewer

---

# Requirement 06

Project Entity

Required fields:

{
id,
workspaceId,
name,
description,
status,
createdBy,
createdAt,
updatedAt
}

---

# Requirement 07

Activity Log Entity

Required fields:

{
id,
workspaceId,
userId,
projectId,
action,
details,
createdAt
}

---

Examples

Created Project

Started Render

Completed Render

Loaded Preset

Deleted Queue Item

---

# Requirement 08

Queue Job Entity

Required fields:

{
id,
workspaceId,
projectId,
createdBy,
mode,
status,
payload,
createdAt,
updatedAt
}

---

# Requirement 09

Entity Metadata

Every persisted entity must contain:

id

createdAt

updatedAt

No exceptions.

---

# Requirement 10

Current Workspace System

Temporary Implementation

Single Workspace

Default Name:

MediaFactory Workspace

---

Future

Multiple workspaces supported.

---

# Requirement 11

Current User System

Temporary Implementation

Single User

Default User:

Local User

Role:

Owner

---

Future

Supabase Auth.

---

# Requirement 12

Activity Logging

Create centralized logging service.

Examples:

Create Project

Create Queue Item

Delete Queue Item

Save Template

Load Template

Start Render

Complete Render

---

Activity logs must be stored.

---

# Requirement 13

Developer Debug Panel

Create hidden Developer Mode.

Display:

Workspace

User

Projects

Queue Jobs

Activity Logs

Templates

Presets

---

Hidden in production.

---

# Requirement 14

Migration Safety

Current storage:

LocalStorage

Future storage:

Supabase

---

Changing storage provider must NOT require UI changes.

---

# Acceptance Test 01

Create Project

Verify ProjectService saves correctly.

PASS / FAIL

---

# Acceptance Test 02

Create Queue Item

Verify QueueService saves correctly.

PASS / FAIL

---

# Acceptance Test 03

Create Activity Log

Verify ActivityService saves correctly.

PASS / FAIL

---

# Acceptance Test 04

Switch Storage Provider

Verify UI still works.

PASS / FAIL

---

# Acceptance Test 05

Developer Mode

Verify entities visible.

PASS / FAIL

---

# Completion Criteria

Task 00 is complete only when:

Service Layer implemented

Repository Layer implemented

Storage Provider implemented

Entities implemented

Activity Log implemented

Developer Mode implemented

Acceptance tests passed

Only then may M2 development begin.
