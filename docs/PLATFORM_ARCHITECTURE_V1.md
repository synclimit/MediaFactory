MediaFactory Platform Architecture V1
Vision

MediaFactory is a collaborative content production platform.

Initial modules:

M1 Video Factory
M2 Audio Remix Factory
M3 Thumbnail Factory

Future modules:

M4 Cover Factory
AutoUploader
Analytics
Asset Library
Core Principles
Cloud Ready

All data must be cloud compatible.

No direct UI → localStorage access.

Multi User Ready

Every entity must support ownership.

Workspace Based

Users work inside Workspaces.

Example:

Workspace

DotaSoul Studio

Members:

Owner
Editor
Viewer
User System

Entity:

{
  "id":"",
  "name":"",
  "email":"",
  "role":""
}

Roles:

Owner

Editor

Viewer
Workspace System

Entity:

{
  "id":"",
  "name":"",
  "ownerId":"",
  "createdAt":""
}
Project System

Every render belongs to a project.

Example:

DJ Remix Project

LoFi Project

Rain Project

Entity:

{
  "id":"",
  "workspaceId":"",
  "name":"",
  "description":""
}
Activity Log System

Every important action creates activity.

Examples:

Budi created M2 configuration

Andi started render

Budi deleted queue item

Andi updated preset

Entity:

{
  "id":"",
  "workspaceId":"",
  "userId":"",
  "action":"",
  "timestamp":""
}
Queue System

Current:

Queue Item

Future:

{
  "id":"",
  "workspaceId":"",
  "projectId":"",
  "createdBy":"",
  "mode":"",
  "status":""
}
Template System

Shared across workspace.

Examples:

Thumbnail Templates

Audio Presets

Naming Templates

Users can:

Create

Edit

Share

Delete
Render History

Entity:

{
  "id":"",
  "workspaceId":"",
  "projectId":"",
  "renderedBy":"",
  "renderTime":"",
  "status":""
}
Storage Architecture

UI

↓

Services

↓

Repository Layer

↓

Storage Provider

↓

Database

Service Layer

Examples:

ProjectService

QueueService

PresetService

TemplateService

ActivityService

RenderService

UI never talks directly to database.

Repository Layer

Examples:

ProjectRepository

QueueRepository

PresetRepository

TemplateRepository
Database Provider

Phase 1

LocalStorageProvider

Phase 2

SupabaseProvider

Phase 3

PostgreSQL

No UI changes required.

Supabase Recommendation

Recommended Stack:

Frontend

React

Backend

NodeJS

Database

Supabase PostgreSQL

Features:

Authentication

Realtime

Storage

Activity Logs

Role Permissions

Shared Projects
Future Dashboard

Workspace Dashboard

Displays:

Active Users

Queue Status

Running Renders

Completed Jobs

Recent Activity
Design Goal

MediaFactory should evolve into:

Collaborative Content Production Platform

not merely:

Single User Rendering Tool