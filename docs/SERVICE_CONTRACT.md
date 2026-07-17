# Service Contracts

This document defines the strict, public APIs for all backend services.

## 1. Foundation Services

### ServiceRegistry
**Responsibility**: Dependency Injection container.
- `register(serviceName, instance)`
- `resolve(serviceName)`

### StorageService
**Responsibility**: The ONLY service allowed to interact with the OS file system.
- `exists()`, `mkdir()`, `copy()`, `move()`, `rename()`, `delete()`, `read()`, `write()`, `hash()`, `stat()`, `watch()`

### ConfigurationService
**Responsibility**: Handles JSON parsing, validation, caching, migrations, schema upgrades.
- `load(path)`, `save(path, data)`, `validate(schema)`, `cache()`, `backup()`, `migrate()`

### RecoveryService
**Responsibility**: Crash recovery and state restoration.
- `recoverQueue()`, `recoverJobs()`, `recoverRuntime()`, `recoverTemp()`, `recoverWorkspace()`

## 2. Core Domain Services

### WorkspaceService
- `getCurrentWorkspace()`, `setCurrentWorkspace(name)`, `initializeWorkspace(name)`, `createWorkspace(name)`, `deleteWorkspace(name)`, `duplicateWorkspace(source, target)`, `renameWorkspace(oldName, newName)`

### RuntimeService (Event Bus)
- `on(wildcardNamespace, callback)`
- `emit(namespace, payload)`

### HardwareService
- `scan()`, `refresh()`, `getCache()`

### ValidationService
- `validate(context, config)`: Returns `{ status, severity: "INFO"|"WARNING"|"ERROR"|"CRITICAL", code, message, suggestion }`

### PluginService
- `registerPlugin(pluginData)`
- `getRegisteredAssets()`, `getRegisteredNodes()`, `getValidationRules()`

### JobService
**Responsibility**: Absolute authority over queue and render jobs.
- `createJob()`, `startJob()`, `pauseJob()`, `resumeJob()`, `retryJob()`, `cancelJob()`, `removeJob()`, `updateProgress()`, `updateStatus()`, `saveHistory()`, `restorePendingJobs()`

## 3. Project, Asset, and Preset Services

### ProjectService
- `create(name)`, `save(name)`, `saveAs(newName)`, `load(name)`, `duplicate(source, target)`, `delete(name)`

### AssetService
- `scan(category)`, `watch(category)`, `import(file, category)`, `delete(assetId)`, `duplicate(assetId)`, `rename(assetId, newName)`, `move(assetId, targetCategory)`, `export(assetId, path)`, `refresh(category)`, `generateThumbnail(assetId)`, `extractMetadata(assetId)`

### PresetService
- `loadPreset(presetId)`, `savePreset(presetData)`, `duplicatePreset(presetId)`, `deletePreset(presetId)`, `exportPreset(presetId)`, `importPreset(file)`

## 4. FFmpeg Services

### FFmpegService
- `execute(jobId, args)`, `pause(jobId)`, `resume(jobId)`, `cancel(jobId)`, `estimate(jobId)`, `verifyOutput(path)`

### FFmpeg Sub-Modules
- `ArgumentBuilder`
- `FilterGraphBuilder`: The ONLY module that outputs `-filter_complex` from `FilterNodes`.
- `ProcessManager`
- `ProgressParser`
- `EncoderDetector`
- `MetadataExtractor`
