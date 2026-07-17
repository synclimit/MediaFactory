/**
 * Platform Foundation Bootstrap
 *
 * This is the composition root of the MediaFactory platform layer.
 * It wires providers → repositories → services and ensures the
 * default workspace and user exist on first launch.
 *
 * Usage:
 *   import { foundation, bootstrapPlatform } from './foundation/index.js';
 *   await bootstrapPlatform();
 *   const workspace = await foundation.workspaceService.getDefault();
 *
 * Rules:
 * - Only bootstrap.js imports concrete implementations.
 * - Everything else uses the abstraction (services).
 * - M1 existing logic is NOT modified.
 * - Queue state is NOT migrated.
 */

// ─── Storage Provider ─────────────────────────────────────────────────────────
import { localStorageProvider } from '../storage/LocalStorageProvider.js';

// ─── Repositories ─────────────────────────────────────────────────────────────
import { WorkspaceRepository } from '../repositories/WorkspaceRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { ProjectRepository } from '../repositories/ProjectRepository.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { QueueRepository } from '../repositories/QueueRepository.js';
import { TemplateRepository } from '../repositories/TemplateRepository.js';
import { PresetRepository } from '../repositories/PresetRepository.js';
import { SettingsRepository } from '../repositories/SettingsRepository.js';

// ─── Services ─────────────────────────────────────────────────────────────────
import { WorkspaceService } from '../services/WorkspaceService.js';
import { UserService } from '../services/UserService.js';
import { ActivityService } from '../services/ActivityService.js';
import { ProjectService } from '../services/ProjectService.js';
import { QueueService } from '../services/QueueService.js';
import { TemplateService } from '../services/TemplateService.js';
import { PresetService } from '../services/PresetService.js';
import { SettingsService } from '../services/SettingsService.js';

// ─── M2 Services ────────────────────────────────────────────────────────────
import { SourceRepository } from '../repositories/m2/SourceRepository.js';
import { SourceService } from '../services/m2/SourceService.js';
import { MetadataCleanerService } from '../services/m2/MetadataCleanerService.js';

// ─── Wire: Repositories ───────────────────────────────────────────────────────
const workspaceRepo  = new WorkspaceRepository(localStorageProvider);
const userRepo       = new UserRepository(localStorageProvider);
const projectRepo    = new ProjectRepository(localStorageProvider);
const activityRepo   = new ActivityRepository(localStorageProvider);
const queueRepo      = new QueueRepository(localStorageProvider);
const templateRepo   = new TemplateRepository(localStorageProvider);
const presetRepo     = new PresetRepository(localStorageProvider);
const settingsRepo   = new SettingsRepository(localStorageProvider);
// M2
const sourceRepo     = new SourceRepository(localStorageProvider);

// ─── Wire: Services ───────────────────────────────────────────────────────────
// ActivityService first — other services depend on it
const activityService  = new ActivityService(activityRepo);
const workspaceService = new WorkspaceService(workspaceRepo);
const userService      = new UserService(userRepo);
const projectService   = new ProjectService(projectRepo, activityService);
const queueService     = new QueueService(queueRepo, activityService);
const templateService  = new TemplateService(templateRepo, activityService);
const presetService    = new PresetService(presetRepo, activityService);
const settingsService  = new SettingsService(settingsRepo);
// M2
const sourceService           = new SourceService(sourceRepo, activityService);
const metadataCleanerService  = new MetadataCleanerService(sourceRepo, activityService);

/**
 * The foundation object — single access point for all services.
 * Import this to use the platform services anywhere in the app.
 */
export const foundation = Object.freeze({
  workspaceService,
  userService,
  activityService,
  projectService,
  queueService,
  templateService,
  presetService,
  settingsService,
  // M2
  sourceService,
  metadataCleanerService,
  // Expose provider for the DevPanel to inspect storage
  _provider: localStorageProvider,
});

// ─── Bootstrap State ──────────────────────────────────────────────────────────
let _bootstrapped = false;
let _bootstrapData = null;

/**
 * Bootstrap the platform foundation.
 * Ensures the default workspace and user exist.
 * Safe to call multiple times — idempotent.
 *
 * @returns {Promise<{workspace: Object, user: Object}>}
 */
export async function bootstrapPlatform() {
  if (_bootstrapped) return _bootstrapData;

  try {
    // 1. Ensure default user exists
    const user = await userService.ensureLocalUser();

    // 2. Ensure default workspace exists (tied to user)
    const workspace = await workspaceService.ensureDefault(user.id);

    // 3. Log bootstrap activity (only if this is a fresh run)
    const logs = await activityService.getAll();
    if (logs.length === 0) {
      await activityService.log({
        workspaceId: workspace.id,
        userId: user.id,
        action: 'Platform Initialized',
        details: {
          version: 'v4.1-workstation',
          provider: 'LocalStorageProvider',
          note: 'Phase 1 bootstrap complete.',
        },
      });
    }

    _bootstrapped = true;
    _bootstrapData = { workspace, user };

    console.log('[MediaFactory] Platform foundation initialized.', { workspace, user });
    return _bootstrapData;
  } catch (err) {
    console.error('[MediaFactory] Bootstrap failed:', err);
    throw err;
  }
}

/**
 * Get the current bootstrap data synchronously (after bootstrapPlatform() has run).
 * Returns null if not yet bootstrapped.
 * @returns {{workspace: Object, user: Object}|null}
 */
export function getBootstrapData() {
  return _bootstrapData;
}
