var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/shared/constants.js
var MESSAGE_TYPES, ACTION_TYPES, TRIGGER_TYPES, SCOPE_TYPES, CONFLICT_TIERS, STORAGE_KEYS, DEFAULT_SETTINGS, BROWSER_RESERVED_SHORTCUTS, BROWSER_COMMON_SHORTCUTS;
var init_constants = __esm({
  "src/shared/constants.js"() {
    MESSAGE_TYPES = {
      // Content → Service Worker
      KEY_PRESSED: "KEY_PRESSED",
      SHORTCUT_FIRED: "SHORTCUT_FIRED",
      MACRO_STEP_DONE: "MACRO_STEP_DONE",
      TEXT_EXPANDED: "TEXT_EXPANDED",
      REQUEST_SHORTCUTS: "REQUEST_SHORTCUTS",
      LOG_ANALYTICS: "LOG_ANALYTICS",
      LOG_ERROR: "LOG_ERROR",
      UNDO_REQUESTED: "UNDO_REQUESTED",
      // Service Worker → Content
      EXECUTE_ACTION: "EXECUTE_ACTION",
      EXECUTE_MACRO_STEP: "EXECUTE_MACRO_STEP",
      SHORTCUTS_UPDATED: "SHORTCUTS_UPDATED",
      SHOW_HINT_OVERLAY: "SHOW_HINT_OVERLAY",
      HIDE_HINT_OVERLAY: "HIDE_HINT_OVERLAY",
      SHOW_COMMAND_PALETTE: "SHOW_COMMAND_PALETTE",
      SHOW_ONBOARDING_TIP: "SHOW_ONBOARDING_TIP",
      // Popup/Options → Service Worker
      GET_ALL_SHORTCUTS: "GET_ALL_SHORTCUTS",
      CREATE_SHORTCUT: "CREATE_SHORTCUT",
      UPDATE_SHORTCUT: "UPDATE_SHORTCUT",
      DELETE_SHORTCUT: "DELETE_SHORTCUT",
      GET_ANALYTICS: "GET_ANALYTICS",
      IMPORT_SHORTCUTS: "IMPORT_SHORTCUTS",
      EXPORT_SHORTCUTS: "EXPORT_SHORTCUTS",
      GET_CONFLICTS: "GET_CONFLICTS",
      CHECK_SINGLE_CONFLICT: "CHECK_SINGLE_CONFLICT",
      UPDATE_SETTINGS: "UPDATE_SETTINGS",
      GET_SETTINGS: "GET_SETTINGS",
      GET_MACROS: "GET_MACROS",
      CREATE_MACRO: "CREATE_MACRO",
      UPDATE_MACRO: "UPDATE_MACRO",
      DELETE_MACRO: "DELETE_MACRO",
      TOGGLE_EXTENSION: "TOGGLE_EXTENSION",
      DISABLE_KEY_CAPTURE: "DISABLE_KEY_CAPTURE",
      ENABLE_KEY_CAPTURE: "ENABLE_KEY_CAPTURE",
      START_MACRO: "START_MACRO"
    };
    ACTION_TYPES = {
      URL: "url",
      SCROLL: "scroll",
      CLICK: "click",
      FILL: "fill",
      SCRIPT: "script",
      MACRO: "macro",
      TEXT_EXPAND: "text_expand",
      CLIPBOARD: "clipboard",
      NAVIGATE: "navigate"
    };
    TRIGGER_TYPES = {
      COMBO: "combo",
      LEADER_SEQUENCE: "leader_sequence",
      TEXT_EXPANSION: "text_expansion"
    };
    SCOPE_TYPES = {
      GLOBAL: "global",
      SITE: "site",
      PAGE: "page"
    };
    CONFLICT_TIERS = {
      NONE: "none",
      BROWSER_RESERVED: "browser_reserved",
      BROWSER_COMMON: "browser_common",
      EXTENSION: "extension"
    };
    STORAGE_KEYS = {
      SHORTCUTS: "shortcuts",
      MACROS: "macros",
      SETTINGS: "settings",
      ANALYTICS: "analytics",
      UNDO_STACK: "undo_stack"
    };
    DEFAULT_SETTINGS = {
      enabled: true,
      leaderKeyEnabled: false,
      leaderKey: "space",
      leaderTimeout: 1500,
      showHints: true,
      hintsActivationKey: "alt+h",
      commandPaletteKey: "ctrl+shift+p",
      theme: "light",
      onboardingPhase: 0,
      onboardingCompletedAt: null,
      analyticsEnabled: true,
      platform: "auto",
      exportFormat: "json"
    };
    BROWSER_RESERVED_SHORTCUTS = /* @__PURE__ */ new Set([
      "ctrl+t",
      "ctrl+w",
      "ctrl+n",
      "ctrl+shift+n",
      "ctrl+tab",
      "ctrl+shift+tab",
      "f5",
      "ctrl+r",
      "ctrl+shift+r",
      "ctrl+l",
      "ctrl+shift+j",
      "ctrl+shift+i",
      "ctrl+h",
      "ctrl+shift+delete",
      "alt+f4",
      "f1",
      "f3",
      "f6",
      "f10",
      "f11",
      "f12",
      // Mac equivalents
      "cmd+t",
      "cmd+w",
      "cmd+n",
      "cmd+shift+n",
      "cmd+tab",
      "cmd+r",
      "cmd+shift+r",
      "cmd+l",
      "cmd+shift+j",
      "cmd+shift+i",
      "cmd+h",
      "cmd+q",
      "cmd+m"
    ]);
    BROWSER_COMMON_SHORTCUTS = /* @__PURE__ */ new Set([
      "ctrl+f",
      "ctrl+g",
      "ctrl+d",
      "ctrl+b",
      "ctrl+u",
      "ctrl+s",
      "ctrl+p",
      "ctrl+a",
      "ctrl+z",
      "ctrl+y",
      "ctrl+c",
      "ctrl+v",
      "ctrl+x",
      "ctrl+shift+b",
      "cmd+f",
      "cmd+g",
      "cmd+d",
      "cmd+b",
      "cmd+u",
      "cmd+s",
      "cmd+p",
      "cmd+a",
      "cmd+z",
      "cmd+y",
      "cmd+c",
      "cmd+v",
      "cmd+x"
    ]);
  }
});

// src/background/storage-manager.js
var storage_manager_exports = {};
__export(storage_manager_exports, {
  appendAnalyticsEvent: () => appendAnalyticsEvent,
  bulkSaveShortcuts: () => bulkSaveShortcuts,
  deleteMacro: () => deleteMacro,
  deleteShortcut: () => deleteShortcut,
  getAnalytics: () => getAnalytics,
  getMacros: () => getMacros,
  getMacrosArray: () => getMacrosArray,
  getSettings: () => getSettings,
  getShortcuts: () => getShortcuts,
  getShortcutsArray: () => getShortcutsArray,
  getShortcutsForUrl: () => getShortcutsForUrl,
  getUndoStack: () => getUndoStack,
  matchesScope: () => matchesScope,
  popUndo: () => popUndo,
  pushUndo: () => pushUndo,
  saveMacro: () => saveMacro,
  saveSettings: () => saveSettings,
  saveShortcut: () => saveShortcut
});
function invalidateCache(key) {
  if (key in _cache)
    _cache[key] = null;
}
async function syncGet(key, defaultValue) {
  if (_cache[key] !== null && _cache[key] !== void 0)
    return _cache[key];
  const result = await chrome.storage.sync.get({ [key]: defaultValue });
  _cache[key] = result[key];
  return _cache[key];
}
async function syncSet(key, value) {
  _cache[key] = value;
  await chrome.storage.sync.set({ [key]: value });
}
async function localGet(key, defaultValue) {
  const result = await chrome.storage.local.get({ [key]: defaultValue });
  return result[key];
}
async function localSet(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
async function getShortcuts() {
  return syncGet(STORAGE_KEYS.SHORTCUTS, {});
}
async function getShortcutsArray() {
  const map = await getShortcuts();
  return Object.values(map);
}
async function getShortcutsForUrl(url) {
  const shortcuts = await getShortcutsArray();
  return shortcuts.filter((s) => s.enabled && matchesScope(s, url));
}
async function saveShortcut(def) {
  const map = await getShortcuts();
  def.updatedAt = Date.now();
  map[def.id] = def;
  await syncSet(STORAGE_KEYS.SHORTCUTS, map);
  return def;
}
async function deleteShortcut(id) {
  const map = await getShortcuts();
  delete map[id];
  await syncSet(STORAGE_KEYS.SHORTCUTS, map);
}
async function bulkSaveShortcuts(shortcuts) {
  const map = {};
  for (const s of shortcuts) {
    map[s.id] = { ...s, updatedAt: Date.now() };
  }
  _cache[STORAGE_KEYS.SHORTCUTS] = map;
  await chrome.storage.sync.set({ [STORAGE_KEYS.SHORTCUTS]: map });
}
async function getMacros() {
  return syncGet(STORAGE_KEYS.MACROS, {});
}
async function getMacrosArray() {
  const map = await getMacros();
  return Object.values(map);
}
async function saveMacro(def) {
  const map = await getMacros();
  def.updatedAt = Date.now();
  map[def.id] = def;
  await syncSet(STORAGE_KEYS.MACROS, map);
  return def;
}
async function deleteMacro(id) {
  const map = await getMacros();
  delete map[id];
  await syncSet(STORAGE_KEYS.MACROS, map);
}
async function getSettings() {
  const stored = await syncGet(STORAGE_KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}
async function saveSettings(partial) {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  await syncSet(STORAGE_KEYS.SETTINGS, merged);
  return merged;
}
async function getAnalytics() {
  return localGet(STORAGE_KEYS.ANALYTICS, {});
}
async function appendAnalyticsEvent(shortcutId, event) {
  const analytics = await getAnalytics();
  if (!analytics[shortcutId]) {
    analytics[shortcutId] = {
      shortcutId,
      executions: [],
      totalTimeSavedMs: 0,
      errorCount: 0,
      lastError: null
    };
  }
  const record = analytics[shortcutId];
  record.executions.push(event);
  if (record.executions.length > 200) {
    record.executions = record.executions.slice(-200);
  }
  if (event.success) {
    record.totalTimeSavedMs += estimateTimeSaved(event.actionType);
  } else {
    record.errorCount++;
    record.lastError = event.errorMessage || "Unknown error";
  }
  await localSet(STORAGE_KEYS.ANALYTICS, analytics);
}
function estimateTimeSaved(actionType) {
  const estimates = {
    url: 5e3,
    // ~5s to type URL and navigate
    scroll: 500,
    click: 1e3,
    fill: 3e3,
    script: 2e3,
    macro: 8e3,
    text_expand: 3e3,
    clipboard: 1500,
    navigate: 500
  };
  return estimates[actionType] || 1e3;
}
async function getUndoStack() {
  return localGet(STORAGE_KEYS.UNDO_STACK, []);
}
async function pushUndo(entry) {
  const stack = await getUndoStack();
  stack.push(entry);
  if (stack.length > MAX_UNDO_STACK)
    stack.shift();
  await localSet(STORAGE_KEYS.UNDO_STACK, stack);
}
async function popUndo() {
  const stack = await getUndoStack();
  if (stack.length === 0)
    return null;
  const entry = stack.pop();
  await localSet(STORAGE_KEYS.UNDO_STACK, stack);
  return entry;
}
function matchesScope(shortcut, url) {
  if (!shortcut.scope)
    return false;
  const { type, urlPattern, urlPatternType } = shortcut.scope;
  if (type === "global")
    return true;
  if (!urlPattern || !url)
    return false;
  try {
    if (urlPatternType === "regex") {
      return new RegExp(urlPattern).test(url);
    } else {
      const regex = globToRegex(urlPattern);
      return regex.test(url);
    }
  } catch {
    return false;
  }
}
function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}
var _cache, MAX_UNDO_STACK;
var init_storage_manager = __esm({
  "src/background/storage-manager.js"() {
    init_constants();
    _cache = {
      shortcuts: null,
      macros: null,
      settings: null
    };
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") {
        for (const key of Object.keys(changes)) {
          invalidateCache(key);
        }
      }
    });
    MAX_UNDO_STACK = 50;
  }
});

// src/background/analytics-tracker.js
async function recordExecution(shortcut, context = {}) {
  const event = {
    timestamp: Date.now(),
    url: context.url || "",
    durationMs: context.durationMs || 0,
    actionType: shortcut.action?.type || "unknown",
    success: true,
    errorMessage: null
  };
  await appendAnalyticsEvent(shortcut.id, event);
  return event;
}
async function recordError(shortcutId, actionType, errorMessage, context = {}) {
  const event = {
    timestamp: Date.now(),
    url: context.url || "",
    durationMs: 0,
    actionType: actionType || "unknown",
    success: false,
    errorMessage
  };
  await appendAnalyticsEvent(shortcutId, event);
  return event;
}
async function getAnalyticsSummary() {
  const analytics = await getAnalytics();
  const records = Object.values(analytics);
  const totalExecutions = records.reduce((sum, r) => sum + r.executions.length, 0);
  const totalTimeSavedMs = records.reduce((sum, r) => sum + (r.totalTimeSavedMs || 0), 0);
  const totalErrors = records.reduce((sum, r) => sum + (r.errorCount || 0), 0);
  const topShortcuts = records.map((r) => ({ shortcutId: r.shortcutId, count: r.executions.length })).sort((a, b) => b.count - a.count).slice(0, 10);
  return {
    totalExecutions,
    totalTimeSavedMs,
    totalTimeSavedMinutes: Math.round(totalTimeSavedMs / 6e4),
    totalErrors,
    topShortcuts,
    recordCount: records.length
  };
}
var init_analytics_tracker = __esm({
  "src/background/analytics-tracker.js"() {
    init_storage_manager();
  }
});

// src/background/macro-runner.js
var macro_runner_exports = {};
__export(macro_runner_exports, {
  onAlarm: () => onAlarm,
  onStepComplete: () => onStepComplete,
  startMacro: () => startMacro
});
async function startMacro(macroId, context) {
  const macros = await getMacros();
  const macro = macros[macroId];
  if (!macro)
    throw new Error(`Macro not found: ${macroId}`);
  const sessionId = `ms_${Date.now()}`;
  const session = {
    sessionId,
    macroId,
    macro,
    context,
    currentStep: 0,
    results: [],
    startedAt: Date.now()
  };
  _sessions.set(sessionId, session);
  await persistSession(session);
  await executeNextStep(sessionId);
  return sessionId;
}
async function onStepComplete(sessionId, result) {
  const session = _sessions.get(sessionId);
  if (!session) {
    const rehydrated = await rehydrateSession(sessionId);
    if (!rehydrated) {
      await notifyMacroLost(sessionId);
      return;
    }
    _sessions.set(sessionId, rehydrated);
  }
  const s = _sessions.get(sessionId);
  s.results.push(result);
  if (!result.success && s.macro.onError === "stop") {
    await cleanupSession(sessionId, false);
    return;
  }
  if (!result.success && s.macro.onError === "revert") {
    await revertMacro(sessionId);
    return;
  }
  s.currentStep++;
  if (s.currentStep >= s.macro.steps.length) {
    await cleanupSession(sessionId, true);
    return;
  }
  await persistSession(s);
  const nextStep = s.macro.steps[s.currentStep];
  const delay = nextStep.delay || 0;
  if (delay > 0) {
    chrome.alarms.create(`macro_${sessionId}`, { delayInMinutes: Math.max(delay / 6e4, 1 / 60) });
  } else {
    await executeNextStep(sessionId);
  }
}
async function onAlarm(alarmName) {
  if (!alarmName.startsWith("macro_"))
    return;
  const sessionId = alarmName.replace("macro_", "");
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
  if (!session)
    return;
  const step = session.macro.steps[session.currentStep];
  if (!step) {
    await cleanupSession(sessionId, true);
    return;
  }
  try {
    await chrome.tabs.sendMessage(session.context.tabId, {
      type: MESSAGE_TYPES.EXECUTE_MACRO_STEP,
      payload: { step, sessionId }
    });
  } catch (err) {
    await recordError(session.macroId, "macro", err.message, { url: session.context.url });
    await cleanupSession(sessionId, false);
  }
}
async function revertMacro(sessionId) {
  const session = _sessions.get(sessionId);
  if (!session)
    return;
  for (const result of session.results.filter((r) => r.undoable)) {
    try {
      await chrome.tabs.sendMessage(session.context.tabId, {
        type: MESSAGE_TYPES.UNDO_REQUESTED,
        payload: { undoEntry: result.undoEntry }
      });
    } catch {
    }
  }
  await cleanupSession(sessionId, false);
}
async function cleanupSession(sessionId, success) {
  _sessions.delete(sessionId);
  try {
    const key = `macro_session_${sessionId}`;
    await chrome.storage.local.remove(key);
  } catch {
  }
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
  await recordError(sessionId, "macro", "Macro session lost after service worker restart", {});
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, {
        type: MESSAGE_TYPES.LOG_ERROR,
        payload: { message: "Macro session lost \u2014 the browser may have restarted. Please re-run the macro." }
      });
    }
  } catch {
  }
}
var _sessions;
var init_macro_runner = __esm({
  "src/background/macro-runner.js"() {
    init_constants();
    init_storage_manager();
    init_analytics_tracker();
    _sessions = /* @__PURE__ */ new Map();
  }
});

// src/background/service-worker.js
init_constants();
init_storage_manager();

// src/background/shortcut-registry.js
init_storage_manager();

// src/shared/key-utils.js
var MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"];
function buildComboString(keys) {
  if (!keys || keys.length === 0)
    return "";
  const mods = keys.filter((k) => MODIFIER_ORDER.includes(k) || k === "cmd");
  const mainKeys = keys.filter((k) => !MODIFIER_ORDER.includes(k) && k !== "cmd");
  const orderedMods = [...MODIFIER_ORDER, "cmd"].filter((m) => mods.includes(m));
  return [...orderedMods, ...mainKeys].join("+");
}

// src/background/shortcut-registry.js
init_constants();
var _index = null;
async function rebuildIndex() {
  const shortcuts = await getShortcutsArray();
  _index = {};
  for (const s of shortcuts) {
    if (!s.enabled)
      continue;
    const key = triggerKey(s);
    if (!key)
      continue;
    if (!_index[key])
      _index[key] = [];
    _index[key].push(s);
  }
  return _index;
}
function triggerKey(shortcut) {
  const { trigger } = shortcut;
  if (!trigger)
    return null;
  if (trigger.type === TRIGGER_TYPES.COMBO) {
    return buildComboString(trigger.keys);
  }
  if (trigger.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
    const leader = trigger.leaderKey || "space";
    const seq = buildComboString(trigger.keys);
    return `${leader}>${seq}`;
  }
  return null;
}
function invalidateIndex() {
  _index = null;
}

// src/background/executor.js
init_constants();
init_analytics_tracker();
init_storage_manager();
async function executeShortcut(shortcut, context) {
  const start = Date.now();
  const { action } = shortcut;
  try {
    await dispatchAction(action, context);
    await incrementUsageCount(shortcut);
    await recordExecution(shortcut, {
      url: context.url,
      durationMs: Date.now() - start
    });
    return { success: true };
  } catch (err) {
    await recordError(shortcut.id, action.type, err.message, { url: context.url });
    try {
      await chrome.tabs.sendMessage(context.tabId, {
        type: MESSAGE_TYPES.LOG_ERROR,
        payload: {
          message: `Shortcut "${shortcut.name}" failed: ${err.message}`,
          shortcutId: shortcut.id
        }
      });
    } catch {
    }
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
  if (!url)
    throw new Error("No URL specified");
  switch (action.urlTarget) {
    case "current":
      await chrome.tabs.update(context.tabId, { url });
      break;
    case "new_window":
      await chrome.windows.create({ url });
      break;
    case "new_tab":
    default:
      await chrome.tabs.create({ url, openerTabId: context.tabId });
      break;
  }
}
async function executeNavigateAction(action, context) {
  switch (action.navigateDirection) {
    case "back":
      await chrome.tabs.goBack(context.tabId);
      break;
    case "forward":
      await chrome.tabs.goForward(context.tabId);
      break;
    case "reload":
      await chrome.tabs.reload(context.tabId);
      break;
    default:
      throw new Error(`Unknown navigate direction: ${action.navigateDirection}`);
  }
}
async function executeDomAction(action, context) {
  const response = await chrome.tabs.sendMessage(context.tabId, {
    type: MESSAGE_TYPES.EXECUTE_ACTION,
    payload: { action }
  });
  if (!response?.success) {
    throw new Error(response.error || "DOM action failed");
  }
}
async function executeScriptAction(action, context) {
  if (!action.script)
    throw new Error("No script specified");
  await chrome.scripting.executeScript({
    target: { tabId: context.tabId },
    func: runUserScript,
    args: [action.script]
  });
}
function runUserScript(scriptCode) {
  const ksm = {
    click: (selector) => {
      const el = document.querySelector(selector);
      if (!el)
        throw new Error(`Element not found: ${selector}`);
      el.click();
    },
    fill: (selector, value) => {
      const el = document.querySelector(selector);
      if (!el)
        throw new Error(`Element not found: ${selector}`);
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    navigate: (url) => {
      window.location.href = url;
    },
    copy: (text) => navigator.clipboard.writeText(text),
    scroll: (amount) => window.scrollBy(0, amount)
  };
  try {
    const fn = new Function("ksm", scriptCode);
    fn(ksm);
  } catch (err) {
    console.error("[KSM] Script error:", err);
  }
}
async function executeMacroAction(action, context) {
  const { startMacro: startMacro2 } = await Promise.resolve().then(() => (init_macro_runner(), macro_runner_exports));
  await startMacro2(action.macroId, context);
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
  } catch {
  }
}

// src/background/conflict-detector.js
init_constants();
init_storage_manager();
init_storage_manager();
async function checkConflict(combo, scope, excludeId = null) {
  if (BROWSER_RESERVED_SHORTCUTS.has(combo.toLowerCase())) {
    return {
      tier: CONFLICT_TIERS.BROWSER_RESERVED,
      conflictingShortcut: null,
      message: `"${combo}" is reserved by the browser and cannot be overridden.`,
      canOverride: false
    };
  }
  if (BROWSER_COMMON_SHORTCUTS.has(combo.toLowerCase())) {
    return {
      tier: CONFLICT_TIERS.BROWSER_COMMON,
      conflictingShortcut: null,
      message: `"${combo}" is a common browser shortcut. It will be overridden when this extension is active.`,
      canOverride: true
    };
  }
  const existing = await getShortcutsArray();
  for (const s of existing) {
    if (excludeId && s.id === excludeId)
      continue;
    if (!s.enabled)
      continue;
    const existingCombo = buildExistingCombo(s);
    if (!existingCombo || existingCombo.toLowerCase() !== combo.toLowerCase())
      continue;
    if (scopesOverlap(s.scope, scope)) {
      return {
        tier: CONFLICT_TIERS.EXTENSION,
        conflictingShortcut: s,
        message: `"${combo}" is already used by "${s.name}".`,
        canOverride: false
      };
    }
  }
  return {
    tier: CONFLICT_TIERS.NONE,
    conflictingShortcut: null,
    message: null,
    canOverride: true
  };
}
async function checkAllConflicts() {
  const shortcuts = await getShortcutsArray();
  const conflicts = [];
  for (let i = 0; i < shortcuts.length; i++) {
    for (let j = i + 1; j < shortcuts.length; j++) {
      const a = shortcuts[i];
      const b = shortcuts[j];
      const comboA = buildExistingCombo(a);
      const comboB = buildExistingCombo(b);
      if (!comboA || !comboB)
        continue;
      if (comboA.toLowerCase() !== comboB.toLowerCase())
        continue;
      if (scopesOverlap(a.scope, b.scope)) {
        conflicts.push({ shortcutA: a, shortcutB: b, combo: comboA });
      }
    }
  }
  return conflicts;
}
function buildExistingCombo(shortcut) {
  const { trigger } = shortcut;
  if (!trigger || !trigger.keys || trigger.keys.length === 0)
    return null;
  const combo = buildComboString(trigger.keys);
  if (!combo)
    return null;
  if (trigger.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
    if (!trigger.leaderKey)
      return null;
    return `${trigger.leaderKey}>${combo}`;
  }
  return combo;
}
function scopesOverlap(scopeA, scopeB) {
  if (scopeA.type === SCOPE_TYPES.GLOBAL || scopeB.type === SCOPE_TYPES.GLOBAL)
    return true;
  const patA = scopeA.urlPattern;
  const patB = scopeB.urlPattern;
  if (!patA || !patB)
    return false;
  if (patA === "*" || patA === "<all_urls>" || patB === "*" || patB === "<all_urls>")
    return true;
  if (patA === patB)
    return true;
  const typeA = scopeA.urlPatternType || "glob";
  const typeB = scopeB.urlPatternType || "glob";
  if (typeA !== typeB)
    return true;
  if (typeA === "glob") {
    const hostA = extractGlobHostname(patA);
    const hostB = extractGlobHostname(patB);
    if (hostA && hostB && hostA === hostB)
      return true;
  }
  return false;
}
function extractGlobHostname(pattern) {
  try {
    const withScheme = pattern.replace(/^\*:\/\//, "https://").replace(/\*\./g, "sub.");
    const url = new URL(withScheme.split("*")[0] + "placeholder");
    return url.hostname.replace(/^sub\./, "");
  } catch {
    return null;
  }
}

// src/background/service-worker.js
init_analytics_tracker();
init_macro_runner();

// src/shared/validators.js
init_constants();
function validateShortcut(def) {
  const errors = [];
  if (!def || typeof def !== "object") {
    return { valid: false, errors: ["Shortcut must be an object"] };
  }
  if (!def.id || typeof def.id !== "string")
    errors.push("Missing or invalid id");
  if (!def.name || typeof def.name !== "string" || def.name.trim() === "") {
    errors.push("Name is required");
  }
  if (!def.trigger || typeof def.trigger !== "object") {
    errors.push("Trigger is required");
  } else {
    const validTriggerTypes = Object.values(TRIGGER_TYPES);
    if (!validTriggerTypes.includes(def.trigger.type)) {
      errors.push(`Invalid trigger type: ${def.trigger.type}`);
    }
    if (def.trigger.type === TRIGGER_TYPES.COMBO || def.trigger.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
      if (!Array.isArray(def.trigger.keys) || def.trigger.keys.length === 0) {
        errors.push("Trigger keys array is required for combo/leader triggers");
      }
    }
    if (def.trigger.type === TRIGGER_TYPES.TEXT_EXPANSION) {
      if (!def.trigger.abbreviation || typeof def.trigger.abbreviation !== "string") {
        errors.push("Abbreviation is required for text_expansion triggers");
      }
    }
  }
  if (!def.scope || typeof def.scope !== "object") {
    errors.push("Scope is required");
  } else {
    const validScopes = Object.values(SCOPE_TYPES);
    if (!validScopes.includes(def.scope.type)) {
      errors.push(`Invalid scope type: ${def.scope.type}`);
    }
    if ((def.scope.type === SCOPE_TYPES.SITE || def.scope.type === SCOPE_TYPES.PAGE) && !def.scope.urlPattern) {
      errors.push("URL pattern is required for site/page scope");
    }
  }
  if (!def.action || typeof def.action !== "object") {
    errors.push("Action is required");
  } else {
    const validActions = Object.values(ACTION_TYPES);
    if (!validActions.includes(def.action.type)) {
      errors.push(`Invalid action type: ${def.action.type}`);
    }
    if (def.action.type === ACTION_TYPES.URL && !def.action.url) {
      errors.push("URL is required for url action");
    }
    if (def.action.type === ACTION_TYPES.SCRIPT && !def.action.script) {
      errors.push("Script content is required for script action");
    }
    if (def.action.type === ACTION_TYPES.MACRO && !def.action.macroId) {
      errors.push("macroId is required for macro action");
    }
    if (def.action.type === ACTION_TYPES.TEXT_EXPAND && !def.action.textExpansion) {
      errors.push("textExpansion is required for text_expand action");
    }
  }
  return { valid: errors.length === 0, errors };
}
function validateImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Import payload must be an object"] };
  }
  if (!Array.isArray(payload.shortcuts)) {
    return { valid: false, errors: ["Import payload must have a shortcuts array"] };
  }
  const errors = [];
  payload.shortcuts.forEach((s, i) => {
    const result = validateShortcut(s);
    if (!result.valid) {
      errors.push(`Shortcut ${i}: ${result.errors.join(", ")}`);
    }
  });
  return { valid: errors.length === 0, errors };
}
function generateId(prefix = "sc") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function createShortcutDefaults(overrides = {}) {
  return {
    id: generateId("sc"),
    name: "",
    description: "",
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.COMBO,
      keys: [],
      leaderKey: null,
      leaderTimeout: 1500,
      abbreviation: null
    },
    scope: {
      type: SCOPE_TYPES.GLOBAL,
      urlPattern: null,
      urlPatternType: "glob"
    },
    action: {
      type: ACTION_TYPES.URL,
      url: null,
      urlTarget: "new_tab",
      scrollAmount: 300,
      scrollDirection: "down",
      clickSelector: null,
      fillSelector: null,
      fillValue: null,
      script: null,
      macroId: null,
      textExpansion: null,
      clipboardAction: null,
      clipboardSelector: null,
      clipboardTransform: null,
      navigateDirection: "back"
    },
    conditions: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
    lastUsedAt: null,
    tags: [],
    isBuiltIn: false,
    phase: 1,
    ...overrides
  };
}

// src/background/service-worker.js
self.addEventListener("activate", async (event) => {
  event.waitUntil(initialize());
});
chrome.runtime.onInstalled.addListener(() => {
  broadcastShortcutsUpdated();
});
async function initialize() {
  await rebuildIndex();
  console.log("[KSM] Service worker initialized");
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEYS.SHORTCUTS]) {
    invalidateIndex();
    rebuildIndex().then(() => {
      broadcastShortcutsUpdated();
    });
  }
});
chrome.alarms.onAlarm.addListener((alarm) => {
  onAlarm(alarm.name);
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    console.error("[KSM] Message handler error:", err);
    sendResponse({ success: false, error: err.message });
  });
  return true;
});
async function handleMessage(message, sender) {
  const { type, payload } = message;
  const tabId = sender.tab?.id;
  const url = sender.tab?.url || payload?.url || "";
  switch (type) {
    case MESSAGE_TYPES.SHORTCUT_FIRED: {
      const { shortcutId, context } = payload;
      const shortcuts = await getShortcuts();
      const shortcut = shortcuts[shortcutId];
      if (!shortcut)
        return { success: false, error: "Shortcut not found" };
      const settings = await getSettings();
      if (!settings.enabled)
        return { success: false, matched: false };
      return executeShortcut(shortcut, { tabId, url, ...context });
    }
    case MESSAGE_TYPES.REQUEST_SHORTCUTS: {
      const shortcuts = await getShortcutsArray();
      const settings = await getSettings();
      const filtered = shortcuts.filter((s) => s.enabled && matchesScope(s, url));
      return { success: true, shortcuts: filtered, settings };
    }
    case MESSAGE_TYPES.LOG_ANALYTICS: {
      return { success: true };
    }
    case MESSAGE_TYPES.LOG_ERROR: {
      console.error("[KSM] Content error:", payload?.message);
      return { success: true };
    }
    case MESSAGE_TYPES.UNDO_REQUESTED: {
      return { success: true };
    }
    case MESSAGE_TYPES.MACRO_STEP_DONE: {
      const { onStepComplete: onStepComplete2 } = await Promise.resolve().then(() => (init_macro_runner(), macro_runner_exports));
      await onStepComplete2(payload.sessionId, payload.result);
      return { success: true };
    }
    case MESSAGE_TYPES.GET_ALL_SHORTCUTS: {
      const shortcuts = await getShortcutsArray();
      return { success: true, shortcuts };
    }
    case MESSAGE_TYPES.CREATE_SHORTCUT: {
      const def = createShortcutDefaults(payload.shortcut);
      const validation = validateShortcut(def);
      if (!validation.valid)
        return { success: false, errors: validation.errors };
      await saveShortcut(def);
      return { success: true, shortcut: def };
    }
    case MESSAGE_TYPES.UPDATE_SHORTCUT: {
      const { shortcut } = payload;
      if (!shortcut?.id)
        return { success: false, error: "Missing id" };
      const validation = validateShortcut(shortcut);
      if (!validation.valid)
        return { success: false, errors: validation.errors };
      await saveShortcut(shortcut);
      return { success: true, shortcut };
    }
    case MESSAGE_TYPES.DELETE_SHORTCUT: {
      await deleteShortcut(payload.id);
      return { success: true };
    }
    case MESSAGE_TYPES.GET_ANALYTICS: {
      const summary = await getAnalyticsSummary();
      const { getAnalytics: getAnalytics2 } = await Promise.resolve().then(() => (init_storage_manager(), storage_manager_exports));
      const raw = await getAnalytics2();
      return { success: true, summary, raw };
    }
    case MESSAGE_TYPES.IMPORT_SHORTCUTS: {
      const validation = validateImportPayload(payload);
      if (!validation.valid)
        return { success: false, errors: validation.errors };
      const existing = await getShortcuts();
      const imported = payload.shortcuts;
      let added = 0, updated = 0;
      for (const s of imported) {
        if (payload.merge && existing[s.id]) {
          existing[s.id] = { ...s, updatedAt: Date.now() };
          updated++;
        } else if (!existing[s.id]) {
          const newId = generateId("sc");
          existing[newId] = { ...s, id: newId, createdAt: Date.now(), updatedAt: Date.now() };
          added++;
        }
      }
      await bulkSaveShortcuts(Object.values(existing));
      return { success: true, added, updated };
    }
    case MESSAGE_TYPES.EXPORT_SHORTCUTS: {
      const shortcuts = await getShortcutsArray();
      const macros = Object.values(await getMacros());
      return { success: true, data: { shortcuts, macros, exportedAt: Date.now(), version: "1.0" } };
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
      const macro = { ...payload.macro, id: generateId("mc"), createdAt: Date.now() };
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
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { type }).catch(() => {
        });
      }
      return { success: true };
    }
    case MESSAGE_TYPES.START_MACRO: {
      const { startMacro: startMacro2 } = await Promise.resolve().then(() => (init_macro_runner(), macro_runner_exports));
      await startMacro2(payload.macroId, { tabId, url });
      return { success: true };
    }
    default:
      return { success: false, error: `Unknown message type: ${type}` };
  }
}
async function broadcastShortcutsUpdated() {
  const shortcuts = await getShortcutsArray();
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url)
      continue;
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("about:") || tab.url.startsWith("edge://"))
      continue;
    const tabShortcuts = shortcuts.filter((s) => s.enabled && matchesScope(s, tab.url || ""));
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: MESSAGE_TYPES.SHORTCUTS_UPDATED,
        payload: { shortcuts: tabShortcuts, settings }
      });
    } catch (err) {
      const absent = err?.message?.includes("Receiving end does not exist") || err?.message?.includes("Could not establish connection");
      if (!absent)
        continue;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            window.__KSM_INITIALIZED__ = false;
          }
        });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/content-main.js"] });
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["styles/overlay.css"] });
      } catch {
      }
    }
  }
}
