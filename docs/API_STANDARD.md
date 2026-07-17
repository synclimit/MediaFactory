# REST API Standard

All panels and backend modules MUST expose identical REST API interfaces utilizing distinct global namespaces. All endpoints must be versioned.

## Base Versioning
All endpoints must be prefixed with `/api/v1/`. Never break existing endpoints in future versions.

## Namespaces
- `/api/v1/system`: System-wide settings, health, and hardware.
- `/api/v1/workspace`: Workspace lifecycle and routing.
- `/api/v1/project`: Composition / Editor state management.
- `/api/v1/assets`: Global Asset Manager endpoints.
- `/api/v1/presets`: Global Preset Manager endpoints.
- `/api/v1/plugins`: Universal Plugin configuration.
- `/api/v1/jobs`: Job execution and Queue lifecycle.
- `/api/v1/m3`: Panel-specific logic (Render, Visualizer, etc.).

---

## Asset & Preset APIs (Global)
- `GET    /api/v1/assets/:category`
- `POST   /api/v1/assets/import`
- `DELETE /api/v1/assets/:id`
- `PATCH  /api/v1/assets/:id/rename`
- `POST   /api/v1/assets/:id/duplicate`

- `GET    /api/v1/presets/:category`
- `POST   /api/v1/presets/import`
- `DELETE /api/v1/presets/:id`
- `PATCH  /api/v1/presets/:id/rename`
- `POST   /api/v1/presets/:id/duplicate`

## Project APIs
- `GET    /api/v1/project/list`
- `POST   /api/v1/project/load`
- `POST   /api/v1/project/save`
- `POST   /api/v1/project/create`
- `POST   /api/v1/project/duplicate`

## Core M3 Panel Endpoints
Where `:panel` is `render`, `background`, `playlist`, `visualizer`, `effects`, `overlay`, `text`, `reactive`, or `branding`.

- `GET    /api/v1/m3/:panel/settings`
- `PUT    /api/v1/m3/:panel/settings`
- `POST   /api/v1/m3/:panel/validate`
- `GET    /api/v1/m3/:panel/runtime`

## System Endpoints

### Health & Diagnostics
- `GET    /api/v1/system/health`
- `GET    /api/v1/system/version`
- `GET    /api/v1/system/runtime`
- `GET    /api/v1/system/services`
- `GET    /api/v1/system/workers`

### Workspace
- `POST   /api/v1/system/workspace/active` (Called ONCE when changing workspace)
- `GET    /api/v1/system/workspace/active`

### Hardware
- `GET    /api/v1/system/hardware`
- `POST   /api/v1/system/hardware/refresh`

---

## Request & Response Format
All bodies must be `application/json`.
Responses must include standardized status envelopes if validation warnings occur.

```json
{
  "success": true,
  "data": { ... },
  "validation": {
    "status": "warning",
    "severity": "WARNING",
    "code": "M3_001",
    "message": "CRF is too high.",
    "suggestion": "Use CRF 18-24."
  }
}
```
