# M3 Architecture (Event-Driven Enterprise Model)

## 1. Enterprise Golden Rule
React is NEVER allowed to:
- Read JSON files
- Access filesystem
- Scan folders
- Import assets
- Detect hardware
- Execute FFmpeg
- Generate thumbnails
- Build FFmpeg filters
- Validate business rules

## 2. Universal Abstraction (The Enterprise Pattern)
- **Dependency Injection**: Services must NEVER be instantiated manually (e.g. `new WorkspaceService()`). They are instantiated and resolved exclusively via `ServiceRegistry`.
- **Filesystem Abstraction**: NO service may use Node's `fs` module. Every read, write, stat, or copy must route through `StorageService` (preparing for future NAS/Cloud).
- **Configuration Abstraction**: NO service may `JSON.parse()` config files. All reads/writes route through `ConfigurationService` which utilizes an in-memory cache to prevent disk spam.
- **Lock Manager**: Changing configurations while a project is rendering is strictly prevented by `LockManager` (Workspace, Project, Asset, Render locks).
- **Transactions**: Critical ops (Import, Project Save) must use the Transaction Pipeline: `Begin -> Execute -> Commit -> Rollback (on failure)`.

## 3. Background Workers
Heavy tasks execute independently to prevent REST API blocking.
- `Asset Worker`
- `Thumbnail Worker`
- `Metadata Worker`
- `Render Worker`
- `Hardware Scan Worker`
- `Plugin Worker`

## 4. Event-Driven Namespace Bus
`RuntimeService` categorizes events with wildcard subscriptions (`Render.*`, `Assets.*`).
Domains: `System.*`, `Workspace.*`, `Project.*`, `Assets.*`, `Presets.*`, `Plugins.*`, `Jobs.*`, `Queue.*`, `Render.*`, `Validation.*`, `FFmpeg.*`.

## 5. Universal Asset Database (UUID & SHA256)
`AssetService` assigns a permanent UUID and calculates a SHA256 hash. Absolute paths are never stored in projects.

## 6. The Filter Node Architecture
Panels **MUST NEVER** generate raw FFmpeg strings.
Each panel generates a `FilterNode`. The `FilterGraphBuilder` traverses the graph and safely generates the `-filter_complex`.

## 7. The Import Pipeline
Mandatory transactional workflow:
1. User -> File Picker -> Validation
2. SHA256 Hash -> UUID Generation
3. Copy Asset via `StorageService`
4. Metadata Extraction (`Metadata Worker`)
5. Thumbnail Generation (`Thumbnail Worker`)
6. Database Update (`ConfigurationService`)
7. Cache Refresh -> Runtime Event -> UI Refresh

## 8. Plugin Domain
Every plugin registers via `PluginContract`:
- Plugin Metadata, Inspector Controls, Asset Types, Preset Types, Validation Rules, Filter Nodes, Runtime Events. Plugins are completely sandboxed.
