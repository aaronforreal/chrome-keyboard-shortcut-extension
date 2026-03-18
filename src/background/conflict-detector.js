import {
  BROWSER_RESERVED_SHORTCUTS,
  BROWSER_COMMON_SHORTCUTS,
  CONFLICT_TIERS,
  SCOPE_TYPES,
} from '../shared/constants.js';
import { getShortcutsArray } from './storage-manager.js';
import { matchesScope } from './storage-manager.js';
import { buildComboString } from '../shared/key-utils.js';

/**
 * Check for conflicts with a given combo + scope.
 * @param {string} combo - Normalized combo string e.g. "ctrl+shift+g"
 * @param {object} scope - Scope object { type, urlPattern, urlPatternType }
 * @param {string|null} excludeId - Shortcut ID to exclude (for edit mode)
 * @returns {Promise<ConflictResult>}
 */
export async function checkConflict(combo, scope, excludeId = null) {
  // Tier A: Browser-reserved (hard blocked)
  if (BROWSER_RESERVED_SHORTCUTS.has(combo.toLowerCase())) {
    return {
      tier: CONFLICT_TIERS.BROWSER_RESERVED,
      conflictingShortcut: null,
      message: `"${combo}" is reserved by the browser and cannot be overridden.`,
      canOverride: false,
    };
  }

  // Tier B: Common browser shortcuts (warn)
  if (BROWSER_COMMON_SHORTCUTS.has(combo.toLowerCase())) {
    return {
      tier: CONFLICT_TIERS.BROWSER_COMMON,
      conflictingShortcut: null,
      message: `"${combo}" is a common browser shortcut. It will be overridden when this extension is active.`,
      canOverride: true,
    };
  }

  // Tier C: Check against existing custom shortcuts
  const existing = await getShortcutsArray();
  for (const s of existing) {
    if (excludeId && s.id === excludeId) continue;
    if (!s.enabled) continue;

    const existingCombo = buildExistingCombo(s);
    if (!existingCombo || existingCombo.toLowerCase() !== combo.toLowerCase()) continue;

    // Check scope overlap
    if (scopesOverlap(s.scope, scope)) {
      return {
        tier: CONFLICT_TIERS.EXTENSION,
        conflictingShortcut: s,
        message: `"${combo}" is already used by "${s.name}".`,
        canOverride: false,
      };
    }
  }

  return {
    tier: CONFLICT_TIERS.NONE,
    conflictingShortcut: null,
    message: null,
    canOverride: true,
  };
}

/**
 * Check all shortcuts for any conflicts (used when loading or importing).
 */
export async function checkAllConflicts() {
  const shortcuts = await getShortcutsArray();
  const conflicts = [];

  for (let i = 0; i < shortcuts.length; i++) {
    for (let j = i + 1; j < shortcuts.length; j++) {
      const a = shortcuts[i];
      const b = shortcuts[j];
      const comboA = buildExistingCombo(a);
      const comboB = buildExistingCombo(b);
      if (!comboA || !comboB) continue;
      if (comboA.toLowerCase() !== comboB.toLowerCase()) continue;
      if (scopesOverlap(a.scope, b.scope)) {
        conflicts.push({ shortcutA: a, shortcutB: b, combo: comboA });
      }
    }
  }

  return conflicts;
}

function buildExistingCombo(shortcut) {
  const { trigger } = shortcut;
  if (!trigger || !trigger.keys || trigger.keys.length === 0) return null;
  return buildComboString(trigger.keys) || null;
}

function scopesOverlap(scopeA, scopeB) {
  // Two scopes overlap if either is global
  if (scopeA.type === SCOPE_TYPES.GLOBAL || scopeB.type === SCOPE_TYPES.GLOBAL) return true;

  const patA = scopeA.urlPattern;
  const patB = scopeB.urlPattern;

  if (!patA || !patB) return false;

  // Wildcard patterns match everything
  if (patA === '*' || patA === '<all_urls>' || patB === '*' || patB === '<all_urls>') return true;

  // Exact match
  if (patA === patB) return true;

  // If pattern types differ, conservatively assume overlap
  const typeA = scopeA.urlPatternType || 'glob';
  const typeB = scopeB.urlPatternType || 'glob';
  if (typeA !== typeB) return true;

  // Both glob: compare hostnames — same host means they could match the same URLs
  if (typeA === 'glob') {
    const hostA = extractGlobHostname(patA);
    const hostB = extractGlobHostname(patB);
    if (hostA && hostB && hostA === hostB) return true;
  }

  return false;
}

function extractGlobHostname(pattern) {
  // Extract hostname from patterns like "*://example.com/*" or "https://example.com/foo"
  try {
    const withScheme = pattern.replace(/^\*:\/\//, 'https://').replace(/\*\./g, 'sub.');
    const url = new URL(withScheme.split('*')[0] + 'placeholder');
    return url.hostname.replace(/^sub\./, '');
  } catch {
    return null;
  }
}
