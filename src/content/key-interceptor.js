import { normalizeCombo, isEditableTarget, buildComboString } from '../shared/key-utils.js';
import { MESSAGE_TYPES } from '../shared/constants.js';

// Local in-memory shortcut index, pushed from service worker
let _shortcuts = [];
let _settings = {};
let _captureDisabled = false;

// Leader key state machine
let _leaderPending = false;
let _leaderTimer = null;

// Build a fast lookup map: combo → [shortcut, ...]
let _comboIndex = {};

export function initKeyInterceptor(shortcuts, settings) {
  _shortcuts = shortcuts;
  _settings = settings;
  _rebuildIndex();
}

export function updateShortcuts(shortcuts, settings) {
  _shortcuts = shortcuts;
  _settings = settings;
  _rebuildIndex();
}

export function disableCapture() { _captureDisabled = true; }
export function enableCapture() { _captureDisabled = false; }

// Fire-and-forget refresh: ask the SW (now awake due to keydown) for shortcuts
let _refreshPending = false;
function _triggerRefresh() {
  if (_refreshPending) return;
  _refreshPending = true;
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SHORTCUTS })
    .then(response => {
      if (response?.success && response.shortcuts?.length) {
        updateShortcuts(response.shortcuts, response.settings || {});
        console.log('[KSM] Shortcuts recovered after SW wake-up');
      }
    })
    .catch(() => {})
    .finally(() => { _refreshPending = false; });
}

function _rebuildIndex() {
  _comboIndex = {};
  for (const s of _shortcuts) {
    if (!s.enabled) continue;
    const key = _shortcutKey(s);
    if (!key) continue;
    if (!_comboIndex[key]) _comboIndex[key] = [];
    _comboIndex[key].push(s);
  }
}

function _shortcutKey(shortcut) {
  const { trigger } = shortcut;
  if (!trigger) return null;
  if (trigger.type === 'combo') return buildComboString(trigger.keys);
  if (trigger.type === 'leader_sequence') {
    const leader = trigger.leaderKey || _settings.leaderKey || 'space';
    return `${leader}>${buildComboString(trigger.keys)}`;
  }
  return null;
}

function _hasLeaderChildren(leaderCombo) {
  const prefix = `${leaderCombo}>`;
  return Object.keys(_comboIndex).some(k => k.startsWith(prefix));
}

function _findMatch(combo) {
  const url = window.location.href;
  const candidates = _comboIndex[combo] || [];
  if (candidates.length === 0) return null;
  // Prefer site/page-specific over global
  const siteSpecific = candidates.filter(s => s.scope.type !== 'global');
  if (siteSpecific.length > 0) return siteSpecific[0];
  const global = candidates.filter(s => s.scope.type === 'global');
  return global.length > 0 ? global[0] : null;
}

// ─── Event handlers ──────────────────────────────────────────────────────

document.addEventListener('keydown', handleKeyDown, true);

function handleKeyDown(event) {
  if (_captureDisabled) return;
  if (_settings.enabled === false) return;

  // Skip modifier-only events
  if (['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(event.key)) return;

  // Self-heal: if index is empty (SW was asleep during init), kick off a refresh
  if (Object.keys(_comboIndex).length === 0) _triggerRefresh();

  const combo = normalizeCombo(event);
  if (!combo) return;

  // Check command palette shortcut first
  const paletteKey = _settings.commandPaletteKey || 'ctrl+shift+p';
  if (combo === paletteKey) {
    event.preventDefault();
    event.stopPropagation();
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SHOW_COMMAND_PALETTE });
    return;
  }

  // Check hint overlay shortcut
  const hintsKey = _settings.hintsActivationKey || 'alt+h';
  if (combo === hintsKey) {
    event.preventDefault();
    event.stopPropagation();
    const { toggleHintOverlay } = window.__KSM__ || {};
    if (toggleHintOverlay) toggleHintOverlay();
    return;
  }

  // If leader key is pending, this key completes the sequence
  if (_leaderPending) {
    clearTimeout(_leaderTimer);
    _leaderPending = false;

    const leaderCombo = _settings.leaderKey || 'space';
    const sequenceKey = `${leaderCombo}>${combo}`;
    const match = _findMatch(sequenceKey);

    if (match) {
      event.preventDefault();
      event.stopPropagation();
      fireShortcut(match);
    }
    return;
  }

  // Check if this combo is a leader key trigger
  if (_settings.leaderKeyEnabled && combo === (_settings.leaderKey || 'space')) {
    if (_hasLeaderChildren(combo)) {
      event.preventDefault();
      _leaderPending = true;
      const timeout = _settings.leaderTimeout || 1500;
      _leaderTimer = setTimeout(() => {
        _leaderPending = false;
      }, timeout);
      return;
    }
  }

  // Skip regular shortcuts in editable fields unless shortcut opts in
  if (isEditableTarget(event)) {
    // Still allow combos with modifiers (ctrl+something) in inputs
    const hasMod = event.ctrlKey || event.metaKey || event.altKey;
    if (!hasMod) return;
  }

  // Try direct combo match
  const match = _findMatch(combo);
  if (match) {
    event.preventDefault();
    event.stopPropagation();
    fireShortcut(match);
  }
}

function fireShortcut(shortcut) {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SHORTCUT_FIRED,
    payload: {
      shortcutId: shortcut.id,
      context: { url: window.location.href },
    },
  }).catch(err => console.warn('[KSM] Could not fire shortcut:', err));
}
