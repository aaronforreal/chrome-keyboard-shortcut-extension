import { detectPlatform } from './platform.js';

// Canonical modifier order for normalized combos
const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'meta'];

// Key aliases: browser event key → normalized name
const KEY_ALIASES = {
  ' ': 'space',
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
  'Escape': 'esc',
  'Enter': 'enter',
  'Backspace': 'backspace',
  'Delete': 'delete',
  'Tab': 'tab',
  'CapsLock': 'capslock',
  'Control': null,   // modifier-only, ignore as main key
  'Alt': null,
  'Shift': null,
  'Meta': null,
  'OS': null,
  'F1': 'f1', 'F2': 'f2', 'F3': 'f3', 'F4': 'f4',
  'F5': 'f5', 'F6': 'f6', 'F7': 'f7', 'F8': 'f8',
  'F9': 'f9', 'F10': 'f10', 'F11': 'f11', 'F12': 'f12',
  'Insert': 'insert', 'Home': 'home', 'End': 'end',
  'PageUp': 'pageup', 'PageDown': 'pagedown',
};

/**
 * Normalize a KeyboardEvent into a canonical combo string.
 * e.g. "ctrl+shift+g", "cmd+k", "space", "f5"
 * Returns null if the event is a modifier-only keypress.
 */
export function normalizeCombo(event) {
  const platform = detectPlatform();
  const mods = [];

  if (event.ctrlKey) mods.push('ctrl');
  if (event.altKey) mods.push('alt');
  if (event.shiftKey) mods.push('shift');
  if (event.metaKey) mods.push('meta');

  // On Mac, meta = cmd. We normalize meta → cmd on Mac for storage consistency.
  // But keep ctrl as-is to distinguish Ctrl from Cmd on Mac.
  const normalizedMods = mods.map(m => {
    if (m === 'meta' && platform === 'mac') return 'cmd';
    return m;
  });

  // Sort in canonical order (ctrl, alt, shift, meta/cmd)
  const orderedMods = MODIFIER_ORDER
    .map(m => (m === 'meta' && platform === 'mac') ? 'cmd' : m)
    .filter(m => normalizedMods.includes(m));

  const rawKey = event.key;
  if (!rawKey) return null;
  if (rawKey in KEY_ALIASES) {
    if (KEY_ALIASES[rawKey] === null) return null; // modifier-only
    const key = KEY_ALIASES[rawKey];
    if (orderedMods.length === 0) return key;
    return [...orderedMods, key].join('+');
  }

  const key = rawKey.toLowerCase();
  if (orderedMods.length === 0) return key;
  return [...orderedMods, key].join('+');
}

/**
 * Build a normalized combo string from an array of key names.
 * Used to reconstruct combos from stored arrays like ["ctrl","shift","g"].
 */
export function buildComboString(keys) {
  if (!keys || keys.length === 0) return '';
  const mods = keys.filter(k => MODIFIER_ORDER.includes(k) || k === 'cmd');
  const mainKeys = keys.filter(k => !MODIFIER_ORDER.includes(k) && k !== 'cmd');
  const orderedMods = [...MODIFIER_ORDER, 'cmd'].filter(m => mods.includes(m));
  return [...orderedMods, ...mainKeys].join('+');
}

/**
 * Parse a combo string back into an array of key names.
 */
export function parseComboString(combo) {
  if (!combo) return [];
  return combo.split('+');
}

/**
 * Check if two combo strings are equal (case-insensitive).
 */
export function combosEqual(a, b) {
  return a && b && a.toLowerCase() === b.toLowerCase();
}

/**
 * Check whether a key event targets an editable element.
 * Key interception should usually be skipped for these.
 */
export function isEditableTarget(event) {
  const tag = event.target?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (event.target?.isContentEditable) return true;
  return false;
}

/**
 * Suggest ergonomically-friendly combo alternatives.
 * Returns an array of suggested combos.
 */
export function suggestErgonomicAlternatives(combo) {
  // Simple heuristics: avoid pinky-heavy combos, suggest home row alternatives
  const suggestions = [];
  const parts = parseComboString(combo);
  const mainKey = parts[parts.length - 1];
  const mods = parts.slice(0, -1);

  // If using three or more modifiers, suggest reducing
  if (mods.length >= 3) {
    suggestions.push(mods.slice(0, 2).concat([mainKey]).join('+'));
  }

  // Suggest Ctrl+letter alternatives using home row (a,s,d,f,j,k,l)
  const homeRow = ['a', 's', 'd', 'f', 'j', 'k', 'l'];
  if (mods.length === 1 && mods[0] === 'ctrl' && !homeRow.includes(mainKey)) {
    homeRow.slice(0, 3).forEach(k => {
      suggestions.push(`ctrl+${k}`);
    });
  }

  return suggestions.slice(0, 3);
}
