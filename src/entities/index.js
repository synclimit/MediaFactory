/**
 * Entity Schemas
 *
 * Defines factory functions for all platform entities.
 *
 * Rules:
 * - Every entity MUST include: id, createdAt, updatedAt, syncStatus
 * - syncStatus values: 'local' | 'pending' | 'synced' | 'failed'
 *   - 'local'   = Created locally, not yet pushed to server
 *   - 'pending' = Queued for sync, in-flight
 *   - 'synced'  = Confirmed synced with remote (Supabase future)
 *   - 'failed'  = Sync attempt failed, needs retry
 *
 * These factories are the single source of truth for entity shape.
 */

// ─── ID Generator ────────────────────────────────────────────────────────────

let _counter = 0;

/**
 * Generate a unique ID prefixed with an entity type hint.
 * @param {string} prefix - Short prefix e.g. 'usr', 'ws', 'prj'
 * @returns {string}
 */
export function generateId(prefix = 'ent') {
  _counter++;
  return `${prefix}_${Date.now()}_${_counter}`;
}

// ─── Base Metadata ───────────────────────────────────────────────────────────

/**
 * Generate base metadata fields required by all entities.
 * @param {string} prefix - ID prefix
 * @returns {Object}
 */
function baseMeta(prefix) {
  const now = new Date().toISOString();
  return {
    id: generateId(prefix),
    createdAt: now,
    updatedAt: now,
    syncStatus: 'local', // 'local' | 'pending' | 'synced' | 'failed'
  };
}

// ─── syncStatus Constants ─────────────────────────────────────────────────────

export const SYNC_STATUS = Object.freeze({
  LOCAL: 'local',
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
});

// ─── User Entity ──────────────────────────────────────────────────────────────

/**
 * @typedef {Object} UserEntity
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'Owner'|'Editor'|'Viewer'} role
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

export const USER_ROLES = Object.freeze({
  OWNER: 'Owner',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
});

/**
 * Create a User entity.
 * @param {Partial<UserEntity>} overrides
 * @returns {UserEntity}
 */
export function createUser(overrides = {}) {
  return {
    ...baseMeta('usr'),
    name: 'Local User',
    email: 'local@mediafactory.app',
    role: USER_ROLES.OWNER,
    ...overrides,
  };
}

// ─── Workspace Entity ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} WorkspaceEntity
 * @property {string} id
 * @property {string} name
 * @property {string} ownerId
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

/**
 * Create a Workspace entity.
 * @param {Partial<WorkspaceEntity>} overrides
 * @returns {WorkspaceEntity}
 */
export function createWorkspace(overrides = {}) {
  return {
    ...baseMeta('ws'),
    name: 'MediaFactory Workspace',
    ownerId: '',
    ...overrides,
  };
}

// ─── Project Entity ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} ProjectEntity
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} name
 * @property {string} description
 * @property {'active'|'archived'|'draft'} status
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

export const PROJECT_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
});

/**
 * Create a Project entity.
 * @param {Partial<ProjectEntity>} overrides
 * @returns {ProjectEntity}
 */
export function createProject(overrides = {}) {
  return {
    ...baseMeta('prj'),
    workspaceId: '',
    name: 'Untitled Project',
    description: '',
    status: PROJECT_STATUS.ACTIVE,
    createdBy: '',
    ...overrides,
  };
}

// ─── Activity Log Entity ──────────────────────────────────────────────────────

/**
 * @typedef {Object} ActivityLogEntity
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} userId
 * @property {string|null} projectId
 * @property {string} action
 * @property {Object|null} details
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

/**
 * Create an Activity Log entity.
 * @param {Partial<ActivityLogEntity>} overrides
 * @returns {ActivityLogEntity}
 */
export function createActivityLog(overrides = {}) {
  return {
    ...baseMeta('act'),
    workspaceId: '',
    userId: '',
    projectId: null,
    action: '',
    details: null,
    ...overrides,
  };
}

// ─── Queue Job Entity ─────────────────────────────────────────────────────────

/**
 * @typedef {Object} QueueJobEntity
 * @property {string} id
 * @property {string} workspaceId
 * @property {string|null} projectId
 * @property {string} createdBy
 * @property {'Mode 1'|'Mode 2'|'Mode 3'} mode
 * @property {'Pending'|'Running'|'Completed'|'Failed'|'Retrying'} status
 * @property {Object} payload
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 * @property {string|null} plannerStatus
 * @property {string|null} plannerStartedAt
 * @property {string|null} plannerFinishedAt
 * @property {string|null} renderPlanVersion
 * @property {string|null} renderPlanSummary
 * @property {Array<string>} plannerWarnings
 * @property {Array<string>} plannerErrors
 */

export const QUEUE_JOB_STATUS = Object.freeze({
  PENDING: 'Pending',
  PLANNING: 'Planning',
  READY_FOR_SCHEDULER: 'ReadyForScheduler',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  PLANNER_FAILED: 'PlannerFailed',
  RETRYING: 'Retrying',
});

/**
 * Create a Queue Job entity.
 * @param {Partial<QueueJobEntity>} overrides
 * @returns {QueueJobEntity}
 */
export function createQueueJob(overrides = {}) {
  return {
    ...baseMeta('q'),
    workspaceId: '',
    projectId: null,
    createdBy: '',
    mode: 'Mode 1',
    status: QUEUE_JOB_STATUS.PENDING,
    payload: {},
    plannerStatus: null,
    plannerStartedAt: null,
    plannerFinishedAt: null,
    renderPlanVersion: null,
    renderPlanSummary: null,
    plannerWarnings: [],
    plannerErrors: [],
    ...overrides,
  };
}

// ─── Template Entity ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} TemplateEntity
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} name
 * @property {'thumbnail'|'audio'|'naming'} type
 * @property {Object} config
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

export const TEMPLATE_TYPES = Object.freeze({
  THUMBNAIL: 'thumbnail',
  AUDIO: 'audio',
  NAMING: 'naming',
});

/**
 * Create a Template entity.
 * @param {Partial<TemplateEntity>} overrides
 * @returns {TemplateEntity}
 */
export function createTemplate(overrides = {}) {
  return {
    ...baseMeta('tpl'),
    workspaceId: '',
    name: 'Untitled Template',
    type: TEMPLATE_TYPES.THUMBNAIL,
    config: {},
    createdBy: '',
    ...overrides,
  };
}

// ─── Preset Entity ────────────────────────────────────────────────────────────

/**
 * @typedef {Object} PresetEntity
 * @property {string} id
 * @property {string} workspaceId
 * @property {string} name
 * @property {'audio'|'video'|'render'} type
 * @property {Object} config
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

export const PRESET_TYPES = Object.freeze({
  AUDIO: 'audio',
  VIDEO: 'video',
  RENDER: 'render',
});

/**
 * Create a Preset entity.
 * @param {Partial<PresetEntity>} overrides
 * @returns {PresetEntity}
 */
export function createPreset(overrides = {}) {
  return {
    ...baseMeta('pst'),
    workspaceId: '',
    name: 'Untitled Preset',
    type: PRESET_TYPES.RENDER,
    config: {},
    createdBy: '',
    ...overrides,
  };
}

// ─── Settings Entity ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} SettingsEntity
 * @property {string} id
 * @property {string} key
 * @property {*} value
 * @property {'app'|'workspace'|'user'} scope
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {'local'|'pending'|'synced'|'failed'} syncStatus
 */

export const SETTINGS_SCOPE = Object.freeze({
  APP: 'app',
  WORKSPACE: 'workspace',
  USER: 'user',
});

/**
 * Create a Settings entity.
 * @param {Partial<SettingsEntity>} overrides
 * @returns {SettingsEntity}
 */
export function createSetting(overrides = {}) {
  return {
    ...baseMeta('cfg'),
    key: '',
    value: null,
    scope: SETTINGS_SCOPE.APP,
    ...overrides,
  };
}
