import { MESSAGE_TYPES, STORAGE_KEYS } from '../shared/constants.js';
import {
  getShortcuts, getShortcutsArray, saveShortcut, deleteShortcut,
  bulkSaveShortcuts, getMacros, saveMacro, deleteMacro,
  getSettings, saveSettings, matchesScope,
} from './storage-manager.js';
import { rebuildIndex, findMatch, findLeaderMatch, invalidateIndex } from './shortcut-registry.js';
import { executeShortcut } from './executor.js';
import { checkConflict, checkAllConflicts } from './conflict-detector.js';
import { getAnalyticsSummary, getAnalyticsForRange } from './analytics-tracker.js';
import { onAlarm } from './macro-runner.js';
import { validateShortcut, validateImportPayload, generateId, createShortcutDefaults } from '../shared/validators.js';

// ─── Initialization ──────────────────────────────────────────────────────

self.addEventListener('activate', async (event) => {
  event.waitUntil(initialize());
});

// Inject content scripts into any tabs that were already open when the
// extension was first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  broadcastShortcutsUpdated();
});

async function initialize() {
  await rebuildIndex();
  console.log('[KSM] Service worker initialized');
}

// Rebuild index when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[STORAGE_KEYS.SHORTCUTS]) {
    invalidateIndex();
    rebuildIndex().then(() => {
      broadcastShortcutsUpdated();
    });
  }
});

// ─── Alarm Handler (for macros) ──────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  onAlarm(alarm.name);
});

// ─── Message Router ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => {
      console.error('[KSM] Message handler error:', err);
      sendResponse({ success: false, error: err.message });
    });
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  const { type, payload } = message;
  const tabId = sender.tab?.id;
  const url = sender.tab?.url || payload?.url || '';

  switch (type) {
    // ── Content → Background ──────────────────────────────────────────

    case MESSAGE_TYPES.SHORTCUT_FIRED: {
      const { shortcutId, context } = payload;
      const shortcuts = await getShortcuts();
      const shortcut = shortcuts[shortcutId];
      if (!shortcut) return { success: false, error: 'Shortcut not found' };
      const settings = await getSettings();
      if (!settings.enabled) return { success: false, matched: false };
      return executeShortcut(shortcut, { tabId, url, ...context });
    }

    case MESSAGE_TYPES.REQUEST_SHORTCUTS: {
      const shortcuts = await getShortcutsArray();
      const settings = await getSettings();
      const filtered = shortcuts.filter(s => s.enabled && matchesScope(s, url));
      return { success: true, shortcuts: filtered, settings };
    }

    case MESSAGE_TYPES.LOG_ANALYTICS: {
      // Analytics already handled in executor, this is a pass-through
      return { success: true };
    }

    case MESSAGE_TYPES.LOG_ERROR: {
      console.error('[KSM] Content error:', payload?.message);
      return { success: true };
    }

    case MESSAGE_TYPES.UNDO_REQUESTED: {
      // Undo is handled within content script for DOM actions
      return { success: true };
    }

    case MESSAGE_TYPES.MACRO_STEP_DONE: {
      const { onStepComplete } = await import('./macro-runner.js');
      await onStepComplete(payload.sessionId, payload.result);
      return { success: true };
    }

    // ── Popup/Options → Background ───────────────────────────────────

    case MESSAGE_TYPES.GET_ALL_SHORTCUTS: {
      const shortcuts = await getShortcutsArray();
      return { success: true, shortcuts };
    }

    case MESSAGE_TYPES.CREATE_SHORTCUT: {
      const def = createShortcutDefaults(payload.shortcut);
      const validation = validateShortcut(def);
      if (!validation.valid) return { success: false, errors: validation.errors };
      await saveShortcut(def);
      return { success: true, shortcut: def };
    }

    case MESSAGE_TYPES.UPDATE_SHORTCUT: {
      const { shortcut } = payload;
      if (!shortcut?.id) return { success: false, error: 'Missing id' };
      const validation = validateShortcut(shortcut);
      if (!validation.valid) return { success: false, errors: validation.errors };
      await saveShortcut(shortcut);
      return { success: true, shortcut };
    }

    case MESSAGE_TYPES.DELETE_SHORTCUT: {
      await deleteShortcut(payload.id);
      return { success: true };
    }

    case MESSAGE_TYPES.GET_ANALYTICS: {
      const summary = await getAnalyticsSummary();
      const { getAnalytics } = await import('./storage-manager.js');
      const raw = await getAnalytics();
      return { success: true, summary, raw };
    }

    case MESSAGE_TYPES.IMPORT_SHORTCUTS: {
      const validation = validateImportPayload(payload);
      if (!validation.valid) return { success: false, errors: validation.errors };

      const existing = await getShortcuts();
      const imported = payload.shortcuts;
      let added = 0, updated = 0;

      for (const s of imported) {
        if (payload.merge && existing[s.id]) {
          // merge mode: update existing shortcut in place
          existing[s.id] = { ...s, updatedAt: Date.now() };
          updated++;
        } else if (!existing[s.id]) {
          // add/replace mode: only add if ID is not already present
          // (replace mode pre-deleted all shortcuts, so existing is empty)
          const newId = generateId('sc');
          existing[newId] = { ...s, id: newId, createdAt: Date.now(), updatedAt: Date.now() };
          added++;
        }
        // else: add mode with existing ID → skip to prevent duplicates
      }

      await bulkSaveShortcuts(Object.values(existing));
      return { success: true, added, updated };
    }

    case MESSAGE_TYPES.EXPORT_SHORTCUTS: {
      const shortcuts = await getShortcutsArray();
      const macros = Object.values(await getMacros());
      return { success: true, data: { shortcuts, macros, exportedAt: Date.now(), version: '1.0' } };
    }

    case MESSAGE_TYPES.GET_CONFLICTS: {
      const conflicts = await checkAllConflicts();
      return { success: true, conflicts };
    }

    case MESSAGE_TYPES.GET_SETTINGS: {
      const settings = await getSettings();
      return { success: true, settings };
    }

    case MESSAGE_TYPES.UPDATE_SETTINGS: {
      const settings = await saveSettings(payload.settings);
      await broadcastShortcutsUpdated();
      return { success: true, settings };
    }

    case MESSAGE_TYPES.TOGGLE_EXTENSION: {
      await saveSettings({ enabled: payload.enabled });
      return { success: true };
    }

    case MESSAGE_TYPES.GET_MACROS: {
      const macros = Object.values(await getMacros());
      return { success: true, macros };
    }

    case MESSAGE_TYPES.CREATE_MACRO: {
      const macro = { ...payload.macro, id: generateId('mc'), createdAt: Date.now() };
      await saveMacro(macro);
      return { success: true, macro };
    }

    case MESSAGE_TYPES.UPDATE_MACRO: {
      await saveMacro(payload.macro);
      return { success: true };
    }

    case MESSAGE_TYPES.DELETE_MACRO: {
      await deleteMacro(payload.id);
      return { success: true };
    }

    case MESSAGE_TYPES.CHECK_SINGLE_CONFLICT: {
      const { combo, scope, excludeId } = payload;
      const result = await checkConflict(combo, scope, excludeId);
      return { success: true, result };
    }

    case MESSAGE_TYPES.DISABLE_KEY_CAPTURE:
    case MESSAGE_TYPES.ENABLE_KEY_CAPTURE: {
      // Sent by the key recorder in the options page; forward to the active tab's content script.
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { type }).catch(() => {});
      }
      return { success: true };
    }

    case MESSAGE_TYPES.START_MACRO: {
      const { startMacro } = await import('./macro-runner.js');
      await startMacro(payload.macroId, { tabId, url });
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}

// ─── Broadcast helpers ───────────────────────────────────────────────────

async function broadcastShortcutsUpdated() {
  const shortcuts = await getShortcutsArray();
  const settings = await getSettings();

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    // Skip pages where content scripts cannot run
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') || tab.url.startsWith('edge://')) continue;

    const tabShortcuts = shortcuts.filter(s => s.enabled && matchesScope(s, tab.url || ''));
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: MESSAGE_TYPES.SHORTCUTS_UPDATED,
        payload: { shortcuts: tabShortcuts, settings },
      });
    } catch (err) {
      // Only inject when Chrome confirms the content script is absent.
      // Other errors (e.g. script still initialising) must not trigger
      // a second injection, which would cause a double-init error.
      const absent = err?.message?.includes('Receiving end does not exist') ||
                     err?.message?.includes('Could not establish connection');
      if (!absent) continue;
      try {
        // Clear the stale init flag so the fresh injection reinitialises fully
        // (the old content script left __KSM_INITIALIZED__ = true on the window,
        // which would cause bootstrap() to return early without re-registering
        // listeners or removing the dead keydown handler).
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => { window.__KSM_INITIALIZED__ = false; },
        });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content-main.js'] });
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles/overlay.css'] });
      } catch {}
    }
  }
}
