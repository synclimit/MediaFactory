# Workspace & Project Structure

This document outlines the strict filesystem hierarchy managed exclusively by `WorkspaceService` and `ProjectService`. All access to files and JSON configurations must go through `StorageService` and `ConfigurationService` respectively.

## Workspace Manifest
Every workspace root MUST contain `workspace.manifest.json` for migration and compatibility tracking:
```json
{
  "workspaceId": "uuid",
  "name": "Lofi Channel",
  "schemaVersion": 1,
  "databaseVersion": 1,
  "pluginVersion": 1,
  "migrationVersion": 1,
  "activePlugins": [],
  "compatibleMediaFactoryVersion": "v4.2.0",
  "createdAt": "2026-06-21T05:00:00Z",
  "updatedAt": "2026-06-21T05:00:00Z"
}
```

## Configuration Standard
Every JSON configuration file must contain strict metadata. No anonymous JSON files.
```json
{
  "schemaVersion": 1,
  "createdAt": "...",
  "updatedAt": "...",
  "createdBy": "MediaFactory",
  "lastModifiedBy": "System",
  "data": {}
}
```

## Hierarchy Blueprint

```text
.mediafactory/
└── Workspaces/
    └── <Workspace Name>/
        ├── workspace.manifest.json
        ├── Assets/
        ├── Presets/
        ├── Plugins/
        ├── Projects/
        ├── Database/
        │   ├── assets.json
        │   ├── projects.json
        │   ├── presets.json
        │   ├── jobs.json
        │   ├── runtime.json
        │   └── plugins.json
        ├── Config/
        ├── Logs/
        ├── Runtime/
        ├── Cache/
        ├── Backup/
        │   └── auto/
        ├── Trash/
        ├── Output/
        └── Temp/
```

## Database Role
Folder scanning during runtime is prohibited.
- `assets.json`: Central indexing for fast lookup via UUID. Prevents repetitive folder scanning.
- `projects.json`: Indexes all projects globally.
- `presets.json`: Indexes presets with rich metadata.
- `jobs.json`: Tracks historical and active queue jobs.
- `plugins.json`: Tracks registered plugin states.
- `runtime.json`: Event bus and crash log indexing.

## Project Schema Expansion
`Projects/<Project UUID>.json` stores complete editor states:
- `projectInfo`
- `assetReferences`
- `renderQueue`
- `timelineState`
- `uiState`
- `panelConfigs`
