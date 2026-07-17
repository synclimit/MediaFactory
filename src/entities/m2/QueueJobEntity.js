/**
 * M2 Queue Job Entity
 *
 * Represents a snapshot of a Render Plan added to the queue.
 * Stores a full snapshot so that changes to the original Render Plan
 * or Source do not affect the pending job.
 */

import { generateId } from '../index.js';
import { m2WorkspaceContext } from '../../services/m2/WorkspaceContext.js';

// ─── Queue Job Status ─────────────────────────────────────────────────────────

export const QUEUE_STATUS = Object.freeze({
  PENDING:   'PENDING',
  READY:     'READY',
  CANCELLED: 'CANCELLED',
  RENDERING: 'RENDERING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
});

// ─── Queue Job Factory ────────────────────────────────────────────────────────

/**
 * Create a QueueJob snapshot from a RenderPlan.
 *
 * @param {Object} renderPlan
 * @returns {Object} QueueJob
 */
export function createQueueJobFromPlan(renderPlan, masteringSettings = null) {
  const now = new Date().toISOString();
  return {
    queueId:      generateId('q2'),
    workspaceId:  m2WorkspaceContext.getWorkspaceId(),
    renderPlanId: renderPlan.renderId,
    renderName:   renderPlan.renderName,
    duration:     renderPlan.totalDurationFormatted || '—',
    trackCount:   renderPlan.trackCount || 0,
    audioProfile: renderPlan.audioProfile || 'Neutral',
    tracks:       JSON.parse(JSON.stringify(renderPlan.trackList || [])),
    masteringSettings: masteringSettings ? JSON.parse(JSON.stringify(masteringSettings)) : null,
    status:       QUEUE_STATUS.PENDING,
    progress:     0,
    batchId:      null,
    retryCount:   0,
    failureReason: null,
    outputPath:   null,
    completedAt:  null,
    outputSizeMb: null,
    createdAt:    now,
    updatedAt:    now,
  };
}

// ─── Queue Job Hash ───────────────────────────────────────────────────────────

/**
 * Generate a stable hex hash for a queue job array (for dev mode display).
 * @param {Array<Object>} queueJobs
 * @returns {string}
 */
export function computeQueueHash(queueJobs) {
  if (!queueJobs || queueJobs.length === 0) return 'empty';
  const key = queueJobs.map(q => `${q.queueId}:${q.status}`).join('|');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, '0');
}
