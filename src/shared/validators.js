import { TRIGGER_TYPES, SCOPE_TYPES, ACTION_TYPES } from './constants.js';

/**
 * Validate a ShortcutDefinition object.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateShortcut(def) {
  const errors = [];

  if (!def || typeof def !== 'object') {
    return { valid: false, errors: ['Shortcut must be an object'] };
  }

  // Required fields
  if (!def.id || typeof def.id !== 'string') errors.push('Missing or invalid id');
  if (!def.name || typeof def.name !== 'string' || def.name.trim() === '') {
    errors.push('Name is required');
  }

  // Trigger validation
  if (!def.trigger || typeof def.trigger !== 'object') {
    errors.push('Trigger is required');
  } else {
    const validTriggerTypes = Object.values(TRIGGER_TYPES);
    if (!validTriggerTypes.includes(def.trigger.type)) {
      errors.push(`Invalid trigger type: ${def.trigger.type}`);
    }
    if (def.trigger.type === TRIGGER_TYPES.COMBO || def.trigger.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
      if (!Array.isArray(def.trigger.keys) || def.trigger.keys.length === 0) {
        errors.push('Trigger keys array is required for combo/leader triggers');
      }
    }
    if (def.trigger.type === TRIGGER_TYPES.TEXT_EXPANSION) {
      if (!def.trigger.abbreviation || typeof def.trigger.abbreviation !== 'string') {
        errors.push('Abbreviation is required for text_expansion triggers');
      }
    }
  }

  // Scope validation
  if (!def.scope || typeof def.scope !== 'object') {
    errors.push('Scope is required');
  } else {
    const validScopes = Object.values(SCOPE_TYPES);
    if (!validScopes.includes(def.scope.type)) {
      errors.push(`Invalid scope type: ${def.scope.type}`);
    }
    if ((def.scope.type === SCOPE_TYPES.SITE || def.scope.type === SCOPE_TYPES.PAGE) && !def.scope.urlPattern) {
      errors.push('URL pattern is required for site/page scope');
    }
  }

  // Action validation
  if (!def.action || typeof def.action !== 'object') {
    errors.push('Action is required');
  } else {
    const validActions = Object.values(ACTION_TYPES);
    if (!validActions.includes(def.action.type)) {
      errors.push(`Invalid action type: ${def.action.type}`);
    }
    if (def.action.type === ACTION_TYPES.URL && !def.action.url) {
      errors.push('URL is required for url action');
    }
    if (def.action.type === ACTION_TYPES.SCRIPT && !def.action.script) {
      errors.push('Script content is required for script action');
    }
    if (def.action.type === ACTION_TYPES.MACRO && !def.action.macroId) {
      errors.push('macroId is required for macro action');
    }
    if (def.action.type === ACTION_TYPES.TEXT_EXPAND && !def.action.textExpansion) {
      errors.push('textExpansion is required for text_expand action');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a MacroDefinition object.
 */
export function validateMacro(def) {
  const errors = [];

  if (!def || typeof def !== 'object') {
    return { valid: false, errors: ['Macro must be an object'] };
  }

  if (!def.id || typeof def.id !== 'string') errors.push('Missing or invalid id');
  if (!def.name || typeof def.name !== 'string' || def.name.trim() === '') {
    errors.push('Name is required');
  }
  if (!Array.isArray(def.steps) || def.steps.length === 0) {
    errors.push('Macro must have at least one step');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an import payload (array of shortcuts).
 */
export function validateImportPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Import payload must be an object'] };
  }
  if (!Array.isArray(payload.shortcuts)) {
    return { valid: false, errors: ['Import payload must have a shortcuts array'] };
  }
  const errors = [];
  payload.shortcuts.forEach((s, i) => {
    const result = validateShortcut(s);
    if (!result.valid) {
      errors.push(`Shortcut ${i}: ${result.errors.join(', ')}`);
    }
  });
  return { valid: errors.length === 0, errors };
}

/**
 * Generate a unique ID for shortcuts/macros.
 */
export function generateId(prefix = 'sc') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create a new ShortcutDefinition with defaults filled in.
 */
export function createShortcutDefaults(overrides = {}) {
  return {
    id: generateId('sc'),
    name: '',
    description: '',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.COMBO,
      keys: [],
      leaderKey: null,
      leaderTimeout: 1500,
      abbreviation: null,
    },
    scope: {
      type: SCOPE_TYPES.GLOBAL,
      urlPattern: null,
      urlPatternType: 'glob',
    },
    action: {
      type: ACTION_TYPES.URL,
      url: null,
      urlTarget: 'new_tab',
      scrollAmount: 300,
      scrollDirection: 'down',
      clickSelector: null,
      fillSelector: null,
      fillValue: null,
      script: null,
      macroId: null,
      textExpansion: null,
      clipboardAction: null,
      clipboardSelector: null,
      clipboardTransform: null,
      navigateDirection: 'back',
    },
    conditions: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
    lastUsedAt: null,
    tags: [],
    isBuiltIn: false,
    phase: 1,
    ...overrides,
  };
}
