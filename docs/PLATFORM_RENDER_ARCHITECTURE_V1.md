# MediaFactory Platform Render Architecture V1

## Architecture Model

MediaFactory uses:

Shared Cloud Database

*

Local Rendering

---

# Design Goal

All rendering workloads remain on each user's computer.

The cloud is used only for:

* Authentication
* Projects
* Activity Logs
* Templates
* Presets
* Queue History
* Settings

The cloud is NOT used for:

* Video Rendering
* Audio Rendering
* Thumbnail Rendering

---

# Rendering Flow

User

↓

Create Configuration

↓

Add To Queue

↓

Local Queue

↓

Local Render

↓

Save Output

↓

Upload Activity

↓

Cloud Database

---

# Why Local Rendering

Benefits:

* No cloud GPU costs
* Faster rendering
* Uses local CPU/GPU
* No large file uploads
* Better privacy
* Works offline

---

# Shared Cloud Data

## Users

Stores:

* User Account
* User Role
* Workspace Membership

---

## Projects

Stores:

* Project Information
* Ownership
* Status

---

## Templates

Stores:

* Thumbnail Templates
* Audio Presets
* Naming Presets

---

## Activity Logs

Stores:

* User Actions
* Render Events
* Configuration Changes

---

## Queue History

Stores:

* Queue Records
* Render Results
* Render Status

---

# Local Only Data

## Render Cache

Stored locally.

Not uploaded.

---

## Source Media

Video files

Audio files

Images

Remain on local machine.

---

## Output Files

Rendered outputs remain local.

Not uploaded automatically.

---

# Activity Log Examples

08:12

Budi created M2 configuration

---

08:15

Budi started render

---

08:22

Render completed

12 outputs generated

---

08:35

Andi loaded template

Full Bass Preset

---

# Future Dashboard

Workspace Dashboard

Displays:

* Active Users
* Current Renders
* Recent Activity
* Completed Jobs
* Shared Templates

Without requiring cloud rendering.

---

# Sync Strategy

When internet is available:

Local Client

↓

Sync Activity

↓

Supabase

When internet is unavailable:

Local Client

↓

Store Pending Sync

↓

Auto Sync Later

---

# Multi User Rules

Users may:

* View Activity Logs
* Share Templates
* Share Presets
* Share Projects

Users may NOT:

* Control another user's render process
* Stop another user's render process
* Access another user's local files

unless explicitly shared.

---

# Recommended Stack

Frontend

React

---

Backend

NodeJS

---

Database

Supabase PostgreSQL

---

Authentication

Supabase Auth

---

Realtime

Supabase Realtime

---

# Design Principle

Render Local

Sync Cloud

Collaborate Everywhere
