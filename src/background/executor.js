import { MESSAGE_TYPES, ACTION_TYPES } from '../shared/constants.js';
import { recordExecution, recordError } from './analytics-tracker.js';
import { saveShortcut, getShortcuts } from './storage-manager.js';

/**
 * Execute a matched shortcut action.
 * @param {ShortcutDefinition} shortcut
 * @param {object} context - { tabId, url, frameId? }
 */
export async function executeShortcut(shortcut, context) {
  const start = Date.now();
  const { action } = shortcut;

  try {
    await dispatchAction(action, context);

    // Update usage count
    await incrementUsageCount(shortcut);

    // Record analytics
    await recordExecution(shortcut, {
      url: context.url,
      durationMs: Date.now() - start,
    });

    return { success: true };
  } catch (err) {
    await recordError(shortcut.id, action.type, err.message, { url: context.url });

    // Notify content script of failure
    try {
      await chrome.tabs.sendMessage(context.tabId, {
        type: MESSAGE_TYPES.LOG_ERROR,
        payload: {
          message: `Shortcut "${shortcut.name}" failed: ${err.message}`,
          shortcutId: shortcut.id,
        },
      });
    } catch {}

    return { success: false, error: err.message };
  }
}

async function dispatchAction(action, context) {
  switch (action.type) {
    case ACTION_TYPES.URL:
      return executeUrlAction(action, context);
    case ACTION_TYPES.NAVIGATE:
      return executeNavigateAction(action, context);
    case ACTION_TYPES.SCROLL:
    case ACTION_TYPES.CLICK:
    case ACTION_TYPES.FILL:
      return executeDomAction(action, context);
    case ACTION_TYPES.SCRIPT:
      return executeScriptAction(action, context);
    case ACTION_TYPES.MACRO:
      // macro-runner handles this via START_MACRO message
      return executeMacroAction(action, context);
    case ACTION_TYPES.TEXT_EXPAND:
    case ACTION_TYPES.CLIPBOARD:
      return executeDomAction(action, context);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function executeUrlAction(action, context) {
  const url = action.url;
  if (!url) throw new Error('No URL specified');

  switch (action.urlTarget) {
    case 'current':
      await chrome.tabs.update(context.tabId, { url });
      break;
    case 'new_window':
      await chrome.windows.create({ url });
      break;
    case 'new_tab':
    default:
      await chrome.tabs.create({ url, openerTabId: context.tabId });
      break;
  }
}

async function executeNavigateAction(action, context) {
  switch (action.navigateDirection) {
    case 'back':
      await chrome.tabs.goBack(context.tabId);
      break;
    case 'forward':
      await chrome.tabs.goForward(context.tabId);
      break;
    case 'reload':
      await chrome.tabs.reload(context.tabId);
      break;
    default:
      throw new Error(`Unknown navigate direction: ${action.navigateDirection}`);
  }
}

async function executeDomAction(action, context) {
  // Send to content script for DOM execution
  const response = await chrome.tabs.sendMessage(context.tabId, {
    type: MESSAGE_TYPES.EXECUTE_ACTION,
    payload: { action },
  });
  if (!response?.success) {
    throw new Error(response.error || 'DOM action failed');
  }
}

async function executeScriptAction(action, context) {
  if (!action.script) throw new Error('No script specified');

  await chrome.scripting.executeScript({
    target: { tabId: context.tabId },
    func: runUserScript,
    args: [action.script],
  });
}

// This function is serialized and injected into the page
function runUserScript(scriptCode) {
  // Provide a safe ksm helper API
  const ksm = {
    click: (selector) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`Element not found: ${selector}`);
      el.click();
    },
    fill: (selector, value) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`Element not found: ${selector}`);
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    navigate: (url) => { window.location.href = url; },
    copy: (text) => navigator.clipboard.writeText(text),
    scroll: (amount) => window.scrollBy(0, amount),
  };

  try {
    const fn = new Function('ksm', scriptCode);
    fn(ksm);
  } catch (err) {
    console.error('[KSM] Script error:', err);
  }
}

async function executeMacroAction(action, context) {
  // Import macro-runner dynamically to avoid circular deps
  const { startMacro } = await import('./macro-runner.js');
  await startMacro(action.macroId, context);
}

async function incrementUsageCount(shortcut) {
  try {
    const shortcuts = await getShortcuts();
    const s = shortcuts[shortcut.id];
    if (s) {
      s.usageCount = (s.usageCount || 0) + 1;
      s.lastUsedAt = Date.now();
      await saveShortcut(s);
    }
  } catch {}
}
