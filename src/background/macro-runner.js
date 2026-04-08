import { MESSAGE_TYPES } from '../shared/constants.js';
import { getMacros, pushUndo } from './storage-manager.js';
import { recordError } from './analytics-tracker.js';

// Active macro sessions: macroSessionId → MacroSession
const _sessions = new Map();

/**
 * Start executing a macro.
 */
export async function startMacro(macroId, context) {
  const macros = await getMacros();
  const macro = macros[macroId];
  if (!macro) throw new Error(`Macro not found: ${macroId}`);

  const sessionId = `ms_${Date.now()}`;
  const session = {
    sessionId,
    macroId,
    macro,
    context,
    currentStep: 0,
    results: [],
    startedAt: Date.now(),
  };
  _sessions.set(sessionId, session);

  // Persist session in case service worker sleeps
  await persistSession(session);

  // Execute first step
  await executeNextStep(sessionId);
  return sessionId;
}

/**
 * Called when a macro step completes (via MACRO_STEP_DONE message).
 */
export async function onStepComplete(sessionId, result) {
  const session = _sessions.get(sessionId);
  if (!session) {
    // Try to rehydrate from storage
    const rehydrated = await rehydrateSession(sessionId);
    if (!rehydrated) {
      await notifyMacroLost(sessionId);
      return;
    }
    _sessions.set(sessionId, rehydrated);
  }

  const s = _sessions.get(sessionId);
  s.results.push(result);

  if (!result.success && s.macro.onError === 'stop') {
    await cleanupSession(sessionId, false);
    return;
  }

  if (!result.success && s.macro.onError === 'revert') {
    await revertMacro(sessionId);
    return;
  }

  s.currentStep++;

  if (s.currentStep >= s.macro.steps.length) {
    await cleanupSession(sessionId, true);
    return;
  }

  await persistSession(s);

  // Schedule next step with delay using alarms
  const nextStep = s.macro.steps[s.currentStep];
  const delay = nextStep.delay || 0;

  if (delay > 0) {
    // Always use chrome.alarms — setTimeout is unreliable because the service worker
    // can be terminated at any time while idle. chrome.alarms survive SW restarts.
    // Minimum: 1 second (1/60 minute), which Chrome 110+ supports.
    chrome.alarms.create(`macro_${sessionId}`, { delayInMinutes: Math.max(delay / 60000, 1 / 60) });
  } else {
    await executeNextStep(sessionId);
  }
}

/**
 * Called by alarm to resume a macro after a delay.
 */
export async function onAlarm(alarmName) {
  if (!alarmName.startsWith('macro_')) return;
  const sessionId = alarmName.replace('macro_', '');

  if (!_sessions.has(sessionId)) {
    const rehydrated = await rehydrateSession(sessionId);
    if (!rehydrated) {
      await notifyMacroLost(sessionId);
      return;
    }
    _sessions.set(sessionId, rehydrated);
  }

  await executeNextStep(sessionId);
}

async function executeNextStep(sessionId) {
  const session = _sessions.get(sessionId);
  if (!session) return;

  const step = session.macro.steps[session.currentStep];
  if (!step) {
    await cleanupSession(sessionId, true);
    return;
  }

  try {
    await chrome.tabs.sendMessage(session.context.tabId, {
      type: MESSAGE_TYPES.EXECUTE_MACRO_STEP,
      payload: { step, sessionId },
    });
  } catch (err) {
    await recordError(session.macroId, 'macro', err.message, { url: session.context.url });
    await cleanupSession(sessionId, false);
  }
}

async function revertMacro(sessionId) {
  const session = _sessions.get(sessionId);
  if (!session) return;

  // Send undo for each undoable step that completed
  for (const result of session.results.filter(r => r.undoable)) {
    try {
      await chrome.tabs.sendMessage(session.context.tabId, {
        type: MESSAGE_TYPES.UNDO_REQUESTED,
        payload: { undoEntry: result.undoEntry },
      });
    } catch {}
  }

  await cleanupSession(sessionId, false);
}

async function cleanupSession(sessionId, success) {
  _sessions.delete(sessionId);
  // Remove persisted session
  try {
    const key = `macro_session_${sessionId}`;
    await chrome.storage.local.remove(key);
  } catch {}
}

async function persistSession(session) {
  const key = `macro_session_${session.sessionId}`;
  await chrome.storage.local.set({ [key]: session });
}

async function rehydrateSession(sessionId) {
  const key = `macro_session_${sessionId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

async function notifyMacroLost(sessionId) {
  await recordError(sessionId, 'macro', 'Macro session lost after service worker restart', {});
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: MESSAGE_TYPES.LOG_ERROR,
        payload: { message: 'Macro session lost — the browser may have restarted. Please re-run the macro.' },
      });
    }
  } catch {}
}
