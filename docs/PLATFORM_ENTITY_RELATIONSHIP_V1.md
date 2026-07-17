# MediaFactory Platform Entity Relationship V1

## Purpose

This document defines how all major entities in MediaFactory relate to one another.

It serves as the master reference for:

* Database Design
* API Design
* Activity Logging
* Queue System
* AutoUploader Integration
* Future Modules

---

# Platform Hierarchy

Workspace

↓

Projects

↓

Modules

↓

Queue Jobs

↓

Render Outputs

---

# Top Level Architecture

Workspace
│
├── Users
├── Projects
├── Templates
├── Presets
├── Settings
├── Activity Logs
└── Queue Jobs

---

# Workspace

A workspace is the highest organizational unit.

Example:

DotaSoul Studio

---

Workspace

Contains:

* Users
* Projects
* Templates
* Presets
* Settings
* Activity Logs

---

Entity

```json
{
  "id":"",
  "name":"",
  "ownerId":""
}
```

---

# Users

Belong to Workspace.

One User may belong to multiple Workspaces.

---

User
│
├── Activity Logs
├── Queue Jobs
├── Render History
└── Templates

````

Entity

```json
{
  "id":"",
  "name":"",
  "email":"",
  "role":""
}
````

---

# Projects

Projects organize production work.

Example:

DJ Remix Project

Rain Channel

LoFi Channel

---

Project
│
├── M1 Jobs
├── M2 Jobs
├── M3 Jobs
├── Queue Jobs
├── Activity Logs
└── Render History

````

---

Entity

```json
{
  "id":"",
  "workspaceId":"",
  "name":"",
  "status":""
}
````

---

# Modules

Current Modules

```text
M1

M2

M3
```

Future

```text
M4

M5

AutoUploader

Analytics
```

---

# Queue Jobs

Every render request creates Queue Jobs.

---

Workspace
│
└── Project
│
└── Queue Job

````

---

Queue Job

Contains:

- Configuration
- Status
- User
- Render Data

---

Entity

```json
{
  "id":"",
  "projectId":"",
  "createdBy":"",
  "mode":"",
  "status":""
}
````

---

# Render History

Generated after successful render.

---

Project
│
└── Render History

````

---

Stores:

- Render Time
- Outputs
- Status
- User

---

Entity

```json
{
  "id":"",
  "projectId":"",
  "queueJobId":"",
  "renderedBy":""
}
````

---

# Activity Logs

Central audit system.

---

Workspace
│
├── User
│
└── Activity Log

````

---

Examples

Created Project

Created Template

Started Render

Completed Render

Deleted Queue Item

---

Entity

```json
{
  "id":"",
  "workspaceId":"",
  "userId":"",
  "action":""
}
````

---

# Templates

Reusable configurations.

---

Workspace
│
└── Templates

````

---

Types

Thumbnail

Audio

Naming

Workflow

---

Entity

```json
{
  "id":"",
  "workspaceId":"",
  "type":"",
  "payload":{}
}
````

---

# Presets

Processing settings.

---

Workspace
│
└── Presets

````

---

Types

Audio

Video

Render

---

Entity

```json
{
  "id":"",
  "workspaceId":"",
  "type":"",
  "payload":{}
}
````

---

# Settings

Workspace-wide preferences.

---

Examples

Output Folder

Default Bitrate

Theme

Language

---

Entity

```json
{
  "id":"",
  "workspaceId":"",
  "key":"",
  "value":""
}
```

---

# AutoUploader Relationship

Future

---

Workspace
│
└── Project
│
└── Render Outputs
│
└── AutoUploader

```

---

AutoUploader reads:

metadata.json

status.ready

render outputs

---

AutoUploader writes:

upload logs

upload status

upload history

---

# Future Analytics

Workspace
│
└── Analytics
```

---

Analytics reads:

Render History

Activity Logs

Upload Logs

Queue Statistics

---

# Ownership Rules

Everything belongs to:

Workspace

↓

Project

↓

User

---

This guarantees:

* Collaboration
* Permissions
* Audit Trails
* Multi User Support

---

# Design Principle

MediaFactory is not a collection of isolated tools.

MediaFactory is a unified content production platform where:

Users

Projects

Templates

Queue Jobs

Render Outputs

Activity Logs

and AutoUploader

all operate within the same Workspace ecosystem.
