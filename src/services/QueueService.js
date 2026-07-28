/**
 * QueueService
 *
 * Foundation-level queue service. Safe integration point.
 * Does NOT replace or interfere with M1's existing queue state.
 *
 * This is the architectural registration layer for future migration.
 * M1 queue logic in App.jsx remains untouched.
 *
 * UI → QueueService → QueueRepository → StorageProvider
 */

import { createQueueJob, QUEUE_JOB_STATUS } from '../entities/index.js';
import { PlannerFactory } from './pipeline/fastrender/factories/PlannerFactory.js';
import { ProjectContext } from './pipeline/fastrender/contracts/Contexts.js';

export class QueueService {
  /**
   * @param {import('../repositories/QueueRepository.js').QueueRepository} repo
   * @param {import('./ActivityService.js').ActivityService} activityService
   */
  constructor(repo, activityService) {
    this.repo = repo;
    this.activityService = activityService;
  }

  /** @returns {Promise<Array>} All queue jobs */
  async getAll() {
    return this.repo.getAll();
  }

  /**
   * Get queue jobs for a workspace.
   * @param {string} workspaceId
   * @returns {Promise<Array>}
   */
  async getByWorkspace(workspaceId) {
    return this.repo.getByWorkspace(workspaceId);
  }

  /**
   * Register a queue job in the foundation layer.
   * NOTE: This is separate from M1's in-memory queue state.
   * @param {{workspaceId: string, projectId?: string, createdBy: string, mode: string, payload: Object}} params
   * @returns {Promise<Object>}
   */
  async register({ workspaceId, projectId = null, createdBy, mode, payload = {} }) {
    let job = createQueueJob({ workspaceId, projectId, createdBy, mode, payload });

    if (mode === 'FAST') {
      console.log('Queue Received Project -> Planner Started');
      job.plannerStartedAt = new Date().toISOString();
      
      // Check if this is an M3 configuration payload
      if (payload.m3Payload || payload.playlist || payload.background) {
        console.log('Queue Service: M3 Fast Render Job Accepted');
        job.plannerFinishedAt = new Date().toISOString();
        job.plannerStatus = 'COMPLETED';
        job.status = QUEUE_JOB_STATUS.READY_FOR_SCHEDULER;
        job.renderPlanSummary = `M3 Fast Render: ${payload.playlist?.length || 0} tracks`;
      } else {
        job.plannerStatus = 'PLANNING';
        job.status = QUEUE_JOB_STATUS.PLANNING;
        
        try {
          const kernel = PlannerFactory.createPlanner();
          const projectCtx = new ProjectContext(payload);
          const result = await kernel.execute(projectCtx);
          
          job.plannerFinishedAt = new Date().toISOString();
          
          if (result.validation && !result.validation.isValid) {
            throw new Error(result.validation.errors.join('; '));
          }

          if (result.plan.globalStrategy === 'NORMAL_ONLY') {
            // Automatic Fallback
            console.log('Planner Fallback: NORMAL_RENDER_ONLY');
            job.plannerStatus = 'FALLBACK';
            job.status = QUEUE_JOB_STATUS.PENDING;
            job.mode = 'NORMAL';
            job.plannerWarnings.push('Automatic fallback to normal render triggered.');
          } else {
            console.log('Planner Finished -> RenderPlan Generated -> Waiting Scheduler');
            job.plannerStatus = 'COMPLETED';
            job.status = QUEUE_JOB_STATUS.READY_FOR_SCHEDULER;
            job.renderPlanVersion = result.plan.version;
            job.renderPlanSummary = `Segments: ${result.plan.segments.length}, Strategy: ${result.plan.globalStrategy}`;
            job.payload.renderPlan = result.plan;
            if (result.validation && result.validation.warnings) {
              job.plannerWarnings = result.validation.warnings;
            }
          }
        } catch (err) {
          console.error('Planner Error:', err);
          job.plannerFinishedAt = new Date().toISOString();
          job.plannerStatus = 'FAILED';
          job.status = QUEUE_JOB_STATUS.PLANNER_FAILED;
          job.plannerErrors.push(err.message || 'Unknown Planner Error');
        }
      }
    }

    const saved = await this.repo.insert(job);

    if (this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId: createdBy,
        projectId,
        action: 'Create Queue Item',
        details: { mode: job.mode, jobId: saved.id },
      });
    }
    return saved;
  }

  /**
   * Update a job's status.
   * @param {string} id
   * @param {string} status
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    return this.repo.update(id, { status });
  }

  /**
   * Delete a queue job.
   * @param {string} id
   * @param {string} workspaceId
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async delete(id, workspaceId, userId) {
    const result = await this.repo.delete(id);
    if (result && this.activityService) {
      await this.activityService.log({
        workspaceId,
        userId,
        action: 'Delete Queue Item',
        details: { jobId: id },
      });
    }
    return result;
  }

  /**
   * Get pending jobs ready for processing.
   * @returns {Promise<Array>}
   */
  async getPending() {
    return this.repo.getPendingJobs();
  }
}
