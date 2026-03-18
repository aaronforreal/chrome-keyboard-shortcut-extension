import { appendAnalyticsEvent, getAnalytics } from './storage-manager.js';

/**
 * Record a successful shortcut execution.
 */
export async function recordExecution(shortcut, context = {}) {
  const event = {
    timestamp: Date.now(),
    url: context.url || '',
    durationMs: context.durationMs || 0,
    actionType: shortcut.action?.type || 'unknown',
    success: true,
    errorMessage: null,
  };

  await appendAnalyticsEvent(shortcut.id, event);

  // Also update usageCount inline in the shortcut record
  // (This is a lightweight write; the full shortcut save is done elsewhere)
  return event;
}

/**
 * Record a shortcut execution failure.
 */
export async function recordError(shortcutId, actionType, errorMessage, context = {}) {
  const event = {
    timestamp: Date.now(),
    url: context.url || '',
    durationMs: 0,
    actionType: actionType || 'unknown',
    success: false,
    errorMessage,
  };

  await appendAnalyticsEvent(shortcutId, event);
  return event;
}

/**
 * Get a summary of analytics for the dashboard.
 */
export async function getAnalyticsSummary() {
  const analytics = await getAnalytics();
  const records = Object.values(analytics);

  const totalExecutions = records.reduce((sum, r) => sum + r.executions.length, 0);
  const totalTimeSavedMs = records.reduce((sum, r) => sum + (r.totalTimeSavedMs || 0), 0);
  const totalErrors = records.reduce((sum, r) => sum + (r.errorCount || 0), 0);

  // Top shortcuts by usage
  const topShortcuts = records
    .map(r => ({ shortcutId: r.shortcutId, count: r.executions.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalExecutions,
    totalTimeSavedMs,
    totalTimeSavedMinutes: Math.round(totalTimeSavedMs / 60000),
    totalErrors,
    topShortcuts,
    recordCount: records.length,
  };
}

/**
 * Get analytics for a specific time range.
 */
export async function getAnalyticsForRange(shortcutId, fromTimestamp, toTimestamp) {
  const analytics = await getAnalytics();
  const record = analytics[shortcutId];
  if (!record) return null;

  const filtered = record.executions.filter(e =>
    e.timestamp >= fromTimestamp && e.timestamp <= toTimestamp
  );

  return { ...record, executions: filtered };
}
