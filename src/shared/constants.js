// Message types for all inter-context communication
export const MESSAGE_TYPES = {
  // Content → Service Worker
  KEY_PRESSED: 'KEY_PRESSED',
  SHORTCUT_FIRED: 'SHORTCUT_FIRED',
  MACRO_STEP_DONE: 'MACRO_STEP_DONE',
  TEXT_EXPANDED: 'TEXT_EXPANDED',
  REQUEST_SHORTCUTS: 'REQUEST_SHORTCUTS',
  LOG_ANALYTICS: 'LOG_ANALYTICS',
  LOG_ERROR: 'LOG_ERROR',
  UNDO_REQUESTED: 'UNDO_REQUESTED',

  // Service Worker → Content
  EXECUTE_ACTION: 'EXECUTE_ACTION',
  EXECUTE_MACRO_STEP: 'EXECUTE_MACRO_STEP',
  SHORTCUTS_UPDATED: 'SHORTCUTS_UPDATED',
  SHOW_HINT_OVERLAY: 'SHOW_HINT_OVERLAY',
  HIDE_HINT_OVERLAY: 'HIDE_HINT_OVERLAY',
  SHOW_COMMAND_PALETTE: 'SHOW_COMMAND_PALETTE',
  SHOW_ONBOARDING_TIP: 'SHOW_ONBOARDING_TIP',

  // Popup/Options → Service Worker
  GET_ALL_SHORTCUTS: 'GET_ALL_SHORTCUTS',
  CREATE_SHORTCUT: 'CREATE_SHORTCUT',
  UPDATE_SHORTCUT: 'UPDATE_SHORTCUT',
  DELETE_SHORTCUT: 'DELETE_SHORTCUT',
  GET_ANALYTICS: 'GET_ANALYTICS',
  IMPORT_SHORTCUTS: 'IMPORT_SHORTCUTS',
  EXPORT_SHORTCUTS: 'EXPORT_SHORTCUTS',
  GET_CONFLICTS: 'GET_CONFLICTS',
  CHECK_SINGLE_CONFLICT: 'CHECK_SINGLE_CONFLICT',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_SETTINGS: 'GET_SETTINGS',
  GET_MACROS: 'GET_MACROS',
  CREATE_MACRO: 'CREATE_MACRO',
  UPDATE_MACRO: 'UPDATE_MACRO',
  DELETE_MACRO: 'DELETE_MACRO',
  TOGGLE_EXTENSION: 'TOGGLE_EXTENSION',
  DISABLE_KEY_CAPTURE: 'DISABLE_KEY_CAPTURE',
  ENABLE_KEY_CAPTURE: 'ENABLE_KEY_CAPTURE',
  START_MACRO: 'START_MACRO',
};

// Action types for shortcut actions
export const ACTION_TYPES = {
  URL: 'url',
  SCROLL: 'scroll',
  CLICK: 'click',
  FILL: 'fill',
  SCRIPT: 'script',
  MACRO: 'macro',
  TEXT_EXPAND: 'text_expand',
  CLIPBOARD: 'clipboard',
  NAVIGATE: 'navigate',
};

// Trigger types
export const TRIGGER_TYPES = {
  COMBO: 'combo',
  LEADER_SEQUENCE: 'leader_sequence',
  TEXT_EXPANSION: 'text_expansion',
};

// Scope types
export const SCOPE_TYPES = {
  GLOBAL: 'global',
  SITE: 'site',
  PAGE: 'page',
};

// Condition types
export const CONDITION_TYPES = {
  URL_CONTAINS: 'url_contains',
  URL_MATCHES: 'url_matches',
  ELEMENT_EXISTS: 'element_exists',
  ELEMENT_NOT_EXISTS: 'element_not_exists',
};

// Conflict tiers
export const CONFLICT_TIERS = {
  NONE: 'none',
  BROWSER_RESERVED: 'browser_reserved',
  BROWSER_COMMON: 'browser_common',
  EXTENSION: 'extension',
};

// Storage keys
export const STORAGE_KEYS = {
  SHORTCUTS: 'shortcuts',
  MACROS: 'macros',
  SETTINGS: 'settings',
  ANALYTICS: 'analytics',
  UNDO_STACK: 'undo_stack',
};

// Default settings
export const DEFAULT_SETTINGS = {
  enabled: true,
  leaderKeyEnabled: false,
  leaderKey: 'space',
  leaderTimeout: 1500,
  showHints: true,
  hintsActivationKey: 'alt+h',
  commandPaletteKey: 'ctrl+shift+p',
  theme: 'light',
  onboardingPhase: 0,
  onboardingCompletedAt: null,
  analyticsEnabled: true,
  platform: 'auto',
  exportFormat: 'json',
};

// Chrome-reserved shortcuts that cannot be overridden
export const BROWSER_RESERVED_SHORTCUTS = new Set([
  'ctrl+t', 'ctrl+w', 'ctrl+n', 'ctrl+shift+n', 'ctrl+tab',
  'ctrl+shift+tab', 'f5', 'ctrl+r', 'ctrl+shift+r', 'ctrl+l',
  'ctrl+shift+j', 'ctrl+shift+i', 'ctrl+h', 'ctrl+shift+delete',
  'alt+f4', 'f1', 'f3', 'f6', 'f10', 'f11', 'f12',
  // Mac equivalents
  'cmd+t', 'cmd+w', 'cmd+n', 'cmd+shift+n', 'cmd+tab',
  'cmd+r', 'cmd+shift+r', 'cmd+l', 'cmd+shift+j', 'cmd+shift+i',
  'cmd+h', 'cmd+q', 'cmd+m',
]);

// Common browser shortcuts (warn but allow override)
export const BROWSER_COMMON_SHORTCUTS = new Set([
  'ctrl+f', 'ctrl+g', 'ctrl+d', 'ctrl+b', 'ctrl+u',
  'ctrl+s', 'ctrl+p', 'ctrl+a', 'ctrl+z', 'ctrl+y',
  'ctrl+c', 'ctrl+v', 'ctrl+x', 'ctrl+shift+b',
  'cmd+f', 'cmd+g', 'cmd+d', 'cmd+b', 'cmd+u',
  'cmd+s', 'cmd+p', 'cmd+a', 'cmd+z', 'cmd+y',
  'cmd+c', 'cmd+v', 'cmd+x',
]);
