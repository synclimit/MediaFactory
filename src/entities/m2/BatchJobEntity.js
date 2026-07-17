import { generateId } from '../index.js';

export const BATCH_STATUS = Object.freeze({
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
});

/**
 * Creates a new Batch Job State
 * 
 * @param {number} targetQuantity 
 * @returns {Object}
 */
export function createBatchState(targetQuantity = 0) {
  const now = new Date().toISOString();
  return {
    batchId: generateId('batch'),
    targetQuantity: parseInt(targetQuantity, 10) || 0,
    generatedCount: 0,
    completedCount: 0,
    failedCount: 0,
    status: BATCH_STATUS.IDLE,
    currentCursor: 0, // Track iteration position
    pendingQueueIds: [], // Track jobs currently in active queue
    failedQueueIds: [], // Track jobs that permanently failed
    retryMap: {}, // Track { queueId: retryCount } to enforce MAX_RETRY = 1
    createdAt: now,
    updatedAt: now
  };
}
