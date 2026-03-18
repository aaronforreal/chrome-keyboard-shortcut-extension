import { MESSAGE_TYPES } from '../shared/constants.js';
import { initKeyInterceptor, updateShortcuts, disableCapture, enableCapture } from './key-interceptor.js';
import { executeAction, executeMacroStep } from './action-executor.js';
import { applyUndo } from './undo-manager.js';
import { initTextExpander, updateExpansions } from './text-expander.js';
import { initHintOverlay, updateShortcuts as updateHints, show as showHints, hide as hideHints, toggleHintOverlay } from './hint-overlay.js';
import { initCommandPalette, updateShortcuts as updatePalette, show as showPalette } from './command-palette.js';
import { initOnboarding, advancePhase } from './onboarding-coach.js';

// Expose global API for hint overlay toggle (used by key-interceptor)
window.__KSM__ = { toggleHintOverlay };

console.log('[KSM] Content script loaded');

// ─── Initialize ───────────────────────────────────────────────────────────

async function requestShortcutsWithRetry() {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SHORTCUTS });
      if (response?.success) return response;
    } catch (err) {
      if (attempt === 2) console.warn('[KSM] Could not load shortcuts after retry:', err);
      else await new Promise(r => setTimeout(r, 300));
    }
  }
  return null;
}

async function init() {
  let shortcuts = [];
  let settings = {};

  const response = await requestShortcutsWithRetry();
  if (response) {
    shortcuts = response.shortcuts || [];
    settings = response.settings || {};
  } else {
    // SW unreachable — read directly from chrome.storage.sync as fallback
    try {
      const data = await chrome.storage.sync.get({ shortcuts: {}, settings: {} });
      shortcuts = Object.values(data.shortcuts || {}).filter(s => s.enabled);
      settings = data.settings || {};
      console.warn('[KSM] SW unreachable — loaded shortcuts directly from storage');
    } catch (e) {
      console.warn('[KSM] Could not load shortcuts from storage:', e);
    }
  }

  initKeyInterceptor(shortcuts, settings);
  initTextExpander(shortcuts);
  initHintOverlay(shortcuts, settings);
  initCommandPalette(shortcuts);
  initOnboarding(settings.onboardingPhase || 0);
}

init();

// ─── Message listener ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch(err => {
    sendResponse({ success: false, error: err.message });
  });
  return true;
});

async function handleMessage(message) {
  const { type, payload } = message;

  switch (type) {
    case MESSAGE_TYPES.SHORTCUTS_UPDATED: {
      const { shortcuts, settings } = payload;
      updateShortcuts(shortcuts, settings);
      updateExpansions(shortcuts);
      updateHints(shortcuts);
      updatePalette(shortcuts);
      return { success: true };
    }

    case MESSAGE_TYPES.EXECUTE_ACTION: {
      const result = await executeAction(payload.action);
      return result;
    }

    case MESSAGE_TYPES.EXECUTE_MACRO_STEP: {
      const { step, sessionId } = payload;
      const result = await executeMacroStep(step);
      // Report back to service worker
      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.MACRO_STEP_DONE,
        payload: { sessionId, result },
      });
      return { success: true };
    }

    case MESSAGE_TYPES.SHOW_HINT_OVERLAY:
      showHints();
      return { success: true };

    case MESSAGE_TYPES.HIDE_HINT_OVERLAY:
      hideHints();
      return { success: true };

    case MESSAGE_TYPES.SHOW_COMMAND_PALETTE:
      showPalette();
      return { success: true };

    case MESSAGE_TYPES.UNDO_REQUESTED:
      applyUndo();
      return { success: true };

    case MESSAGE_TYPES.LOG_ERROR: {
      const { message: msg } = payload;
      showErrorToast(msg);
      return { success: true };
    }

    case MESSAGE_TYPES.DISABLE_KEY_CAPTURE:
      disableCapture();
      return { success: true };

    case MESSAGE_TYPES.ENABLE_KEY_CAPTURE:
      enableCapture();
      return { success: true };

    case MESSAGE_TYPES.SHOW_ONBOARDING_TIP: {
      advancePhase(payload.phase);
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown message: ${type}` };
  }
}

function showErrorToast(message) {
  const existing = document.getElementById('ksm-error-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ksm-error-toast';
  toast.className = 'ksm-toast ksm-toast-error';
  toast.innerHTML = `<span>⚠</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
