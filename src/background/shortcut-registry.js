import { getShortcuts, getShortcutsArray, matchesScope } from './storage-manager.js';
import { buildComboString } from '../shared/key-utils.js';
import { TRIGGER_TYPES } from '../shared/constants.js';

// In-memory index for fast lookup: combo → [shortcut, ...]
let _index = null;

/**
 * Build the in-memory lookup index from storage.
 * Called on startup and whenever shortcuts change.
 */
export async function rebuildIndex() {
  const shortcuts = await getShortcutsArray();
  _index = {};
  for (const s of shortcuts) {
    if (!s.enabled) continue;
    const key = triggerKey(s);
    if (!key) continue;
    if (!_index[key]) _index[key] = [];
    _index[key].push(s);
  }
  return _index;
}

function triggerKey(shortcut) {
  const { trigger } = shortcut;
  if (!trigger) return null;
  if (trigger.type === TRIGGER_TYPES.COMBO) {
    return buildComboString(trigger.keys);
  }
  if (trigger.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
    const leader = trigger.leaderKey || 'space';
    const seq = buildComboString(trigger.keys);
    return `${leader}>${seq}`;
  }
  // text_expansion handled separately by content script
  return null;
}

/**
 * Find a matching shortcut for a given normalized combo and URL.
 * Returns the best match or null.
 */
export async function findMatch(combo, url) {
  if (!_index) await rebuildIndex();
  const candidates = _index[combo] || [];
  if (candidates.length === 0) return null;

  // Prefer site/page-specific over global
  const siteSpecific = candidates.filter(s => s.scope.type !== 'global' && matchesScope(s, url));
  if (siteSpecific.length > 0) return siteSpecific[0];

  const global = candidates.filter(s => s.scope.type === 'global');
  return global.length > 0 ? global[0] : null;
}

/**
 * Find a match using a leader sequence: "space>g" style key.
 */
export async function findLeaderMatch(leaderKey, combo, url) {
  const key = `${leaderKey}>${combo}`;
  if (!_index) await rebuildIndex();
  const candidates = _index[key] || [];
  if (candidates.length === 0) return null;

  const siteSpecific = candidates.filter(s => s.scope.type !== 'global' && matchesScope(s, url));
  if (siteSpecific.length > 0) return siteSpecific[0];
  const global = candidates.filter(s => s.scope.type === 'global');
  return global.length > 0 ? global[0] : null;
}

/**
 * Get all shortcuts, optionally filtered by URL.
 */
export async function getAllShortcuts(url) {
  const shortcuts = await getShortcutsArray();
  if (!url) return shortcuts;
  return shortcuts.filter(s => matchesScope(s, url));
}

/**
 * Get all text expansion shortcuts (active globally).
 */
export async function getTextExpansions(url) {
  const shortcuts = await getShortcutsArray();
  return shortcuts.filter(s =>
    s.enabled &&
    s.trigger.type === TRIGGER_TYPES.TEXT_EXPANSION &&
    matchesScope(s, url)
  );
}

/**
 * Check if a given leader key has any registered children.
 */
export async function hasLeaderChildren(leaderKey) {
  if (!_index) await rebuildIndex();
  const prefix = `${leaderKey}>`;
  return Object.keys(_index).some(k => k.startsWith(prefix));
}

/**
 * Evaluate conditions for a shortcut. Returns true if all conditions pass.
 */
export function evaluateConditions(shortcut, context) {
  if (!shortcut.conditions || shortcut.conditions.length === 0) return true;
  return shortcut.conditions.every(cond => evaluateCondition(cond, context));
}

function evaluateCondition(cond, context) {
  const { type, value, operator } = cond;
  const url = context.url || '';

  switch (type) {
    case 'url_contains':
      return operator === 'not' ? !url.includes(value) : url.includes(value);
    case 'url_matches':
      try {
        const passes = new RegExp(value).test(url);
        return operator === 'not' ? !passes : passes;
      } catch {
        return false;
      }
    case 'element_exists':
    case 'element_not_exists':
      // These are evaluated in the content script context, always pass here
      return true;
    default:
      return true;
  }
}

// Invalidate index when shortcuts change
export function invalidateIndex() {
  _index = null;
}
