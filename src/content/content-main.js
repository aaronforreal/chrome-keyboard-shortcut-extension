import { MESSAGE_TYPES } from '../shared/constants.js';
import { initKeyInterceptor, updateShortcuts, disableCapture, enableCapture } from './key-interceptor.js';
import { executeAction, executeMacroStep } from './action-executor.js';
import { applyUndo } from './undo-manager.js';
import { initTextExpander, updateExpansions } from './text-expander.js';
import { initHintOverlay, updateShortcuts as updateHints, show as showHints, hide as hideHints, toggleHintOverlay } from './hint-overlay.js';
import { initCommandPalette, updateShortcuts as updatePalette, show as showPalette } from './command-palette.js';
import { initOnboarding, advancePhase } from './onboarding-coach.js';

// Wrap everything after imports so we can `return` cleanly on double-injection.
// Chrome can inject this script twice (once via manifest declaration and once
// via chrome.scripting.executeScript), so we need a silent no-op guard.
(function bootstrap() {
  if (window.__KSM_INITIALIZED__) return; // already running — silently ignore
  window.__KSM_INITIALIZED__ = true;

  // ─── Inline scope matcher ──────────────────────────────────────────────
  // Mirrors storage-manager.matchesScope without pulling in chrome.storage.
  function _matchesScope(shortcut, url) {
    if (!shortcut.scope) return false;
    const { type, urlPattern, urlPatternType } = shortcut.scope;
    if (type === 'global') return true;
    if (!urlPattern || !url) return false;
    try {
      if (urlPatternType === 'regex') return new RegExp(urlPattern).test(url);
      const escaped = urlPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(`^${escaped}$`, 'i').test(url);
    } catch { return false; }
  }

  // Expose global API for key-interceptor (direct calls avoid async round-trips)
  window.__KSM__ = { toggleHintOverlay, showPalette };

  console.log('[KSM] Content script loaded');

  // ─── Initialize ───────────────────────────────────────────────────────

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
        const currentUrl = window.location.href;
        shortcuts = Object.values(data.shortcuts || {}).filter(s => s.enabled && _matchesScope(s, currentUrl));
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

  // ─── Message listener ─────────────────────────────────────────────────

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
        try {
          await chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.MACRO_STEP_DONE,
            payload: { sessionId, result },
          });
        } catch {
          // Context invalidated between steps — caller will time out.
        }
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
    const icon = document.createElement('span');
    icon.textContent = '⚠';
    toast.appendChild(icon);
    toast.appendChild(document.createTextNode(' ' + message));
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

})(); // end bootstrap
