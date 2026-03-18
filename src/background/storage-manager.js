import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../shared/constants.js';

// In-memory cache for sync storage (shortcuts, macros, settings)
let _cache = {
  shortcuts: null,
  macros: null,
  settings: null,
};

function invalidateCache(key) {
  if (key in _cache) _cache[key] = null;
}

// Listen for external storage changes and invalidate cache
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (const key of Object.keys(changes)) {
      invalidateCache(key);
    }
  }
});

async function syncGet(key, defaultValue) {
  if (_cache[key] !== null && _cache[key] !== undefined) return _cache[key];
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

// ─── Shortcuts ─────────────────────────────────────────────────────────────

export async function getShortcuts() {
  return syncGet(STORAGE_KEYS.SHORTCUTS, {});
}

export async function getShortcutsArray() {
  const map = await getShortcuts();
  return Object.values(map);
}

export async function getShortcutsForUrl(url) {
  const shortcuts = await getShortcutsArray();
  return shortcuts.filter(s => s.enabled && matchesScope(s, url));
}

export async function saveShortcut(def) {
  const map = await getShortcuts();
  def.updatedAt = Date.now();
  map[def.id] = def;
  await syncSet(STORAGE_KEYS.SHORTCUTS, map);
  return def;
}

export async function deleteShortcut(id) {
  const map = await getShortcuts();
  delete map[id];
  await syncSet(STORAGE_KEYS.SHORTCUTS, map);
}

export async function bulkSaveShortcuts(shortcuts) {
  const map = {};
  for (const s of shortcuts) {
    map[s.id] = { ...s, updatedAt: Date.now() };
  }
  _cache[STORAGE_KEYS.SHORTCUTS] = map;
  await chrome.storage.sync.set({ [STORAGE_KEYS.SHORTCUTS]: map });
}

// ─── Macros ──────────────────────────────────────────────────────────────

export async function getMacros() {
  return syncGet(STORAGE_KEYS.MACROS, {});
}

export async function getMacrosArray() {
  const map = await getMacros();
  return Object.values(map);
}

export async function saveMacro(def) {
  const map = await getMacros();
  def.updatedAt = Date.now();
  map[def.id] = def;
  await syncSet(STORAGE_KEYS.MACROS, map);
  return def;
}

export async function deleteMacro(id) {
  const map = await getMacros();
  delete map[id];
  await syncSet(STORAGE_KEYS.MACROS, map);
}

// ─── Settings ────────────────────────────────────────────────────────────

export async function getSettings() {
  const stored = await syncGet(STORAGE_KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(partial) {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  await syncSet(STORAGE_KEYS.SETTINGS, merged);
  return merged;
}

// ─── Analytics ───────────────────────────────────────────────────────────

export async function getAnalytics() {
  return localGet(STORAGE_KEYS.ANALYTICS, {});
}

export async function appendAnalyticsEvent(shortcutId, event) {
  const analytics = await getAnalytics();
  if (!analytics[shortcutId]) {
    analytics[shortcutId] = {
      shortcutId,
      executions: [],
      totalTimeSavedMs: 0,
      errorCount: 0,
      lastError: null,
    };
  }
  const record = analytics[shortcutId];
  record.executions.push(event);
  // Keep only last 200 events per shortcut
  if (record.executions.length > 200) {
    record.executions = record.executions.slice(-200);
  }
  if (event.success) {
    record.totalTimeSavedMs += estimateTimeSaved(event.actionType);
  } else {
    record.errorCount++;
    record.lastError = event.errorMessage || 'Unknown error';
  }
  await localSet(STORAGE_KEYS.ANALYTICS, analytics);
}

function estimateTimeSaved(actionType) {
  // Rough estimates in ms
  const estimates = {
    url: 5000,       // ~5s to type URL and navigate
    scroll: 500,
    click: 1000,
    fill: 3000,
    script: 2000,
    macro: 8000,
    text_expand: 3000,
    clipboard: 1500,
    navigate: 500,
  };
  return estimates[actionType] || 1000;
}

// ─── Undo Stack ───────────────────────────────────────────────────────────

const MAX_UNDO_STACK = 50;

export async function getUndoStack() {
  return localGet(STORAGE_KEYS.UNDO_STACK, []);
}

export async function pushUndo(entry) {
  const stack = await getUndoStack();
  stack.push(entry);
  if (stack.length > MAX_UNDO_STACK) stack.shift();
  await localSet(STORAGE_KEYS.UNDO_STACK, stack);
}

export async function popUndo() {
  const stack = await getUndoStack();
  if (stack.length === 0) return null;
  const entry = stack.pop();
  await localSet(STORAGE_KEYS.UNDO_STACK, stack);
  return entry;
}

// ─── URL Scope Matching ───────────────────────────────────────────────────

export function matchesScope(shortcut, url) {
  if (!shortcut.scope) return false;
  const { type, urlPattern, urlPatternType } = shortcut.scope;
  if (type === 'global') return true;
  if (!urlPattern || !url) return false;

  try {
    if (urlPatternType === 'regex') {
      return new RegExp(urlPattern).test(url);
    } else {
      // Glob matching: convert glob to regex
      const regex = globToRegex(urlPattern);
      return regex.test(url);
    }
  } catch {
    return false;
  }
}

function globToRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}
