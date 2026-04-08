import { describe, test, expect } from '@jest/globals';
import { validateShortcut, generateId } from '../../src/shared/validators.js';

function baseShortcut(overrides = {}) {
  return {
    id: 'sc_test_unit_001',
    name: 'Test Shortcut',
    trigger: {
      type: 'combo',
      keys: ['ctrl', 'g'],
      leaderKey: null,
      leaderTimeout: 1500,
      abbreviation: null,
    },
    scope: { type: 'global', urlPattern: null, urlPatternType: 'glob' },
    action: { type: 'url', url: 'https://example.com', urlTarget: 'new_tab' },
    enabled: true,
    conditions: [],
    tags: [],
    ...overrides,
  };
}

describe('validateShortcut', () => {
  test('accepts a valid combo shortcut', () => {
    const result = validateShortcut(baseShortcut());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects non-object input', () => {
    const result = validateShortcut(null);
    expect(result.valid).toBe(false);
  });

  test('rejects missing name', () => {
    const result = validateShortcut(baseShortcut({ name: '' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  test('rejects whitespace-only name', () => {
    const result = validateShortcut(baseShortcut({ name: '   ' }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  test('rejects combo trigger with empty keys array', () => {
    const result = validateShortcut(baseShortcut({
      trigger: { type: 'combo', keys: [], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Trigger keys array is required for combo/leader triggers');
  });

  test('rejects text_expansion trigger without abbreviation', () => {
    const result = validateShortcut(baseShortcut({
      trigger: { type: 'text_expansion', keys: [], abbreviation: null, leaderKey: null, leaderTimeout: 1500 },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Abbreviation is required for text_expansion triggers');
  });

  test('accepts text_expansion trigger with valid abbreviation', () => {
    const result = validateShortcut(baseShortcut({
      trigger: { type: 'text_expansion', keys: [], abbreviation: ';addr', leaderKey: null, leaderTimeout: 1500 },
    }));
    expect(result.valid).toBe(true);
  });

  test('rejects site scope without urlPattern', () => {
    const result = validateShortcut(baseShortcut({
      scope: { type: 'site', urlPattern: null, urlPatternType: 'glob' },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('URL pattern is required for site/page scope');
  });

  test('rejects page scope without urlPattern', () => {
    const result = validateShortcut(baseShortcut({
      scope: { type: 'page', urlPattern: null, urlPatternType: 'glob' },
    }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('URL pattern is required for site/page scope');
  });

  test('accepts site scope with valid urlPattern', () => {
    const result = validateShortcut(baseShortcut({
      scope: { type: 'site', urlPattern: '*.github.com', urlPatternType: 'glob' },
    }));
    expect(result.valid).toBe(true);
  });
});

describe('generateId', () => {
  test('produces IDs with the given prefix', () => {
    expect(generateId('sc')).toMatch(/^sc_/);
    expect(generateId('mc')).toMatch(/^mc_/);
  });

  test('produces unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId('sc')));
    expect(ids.size).toBe(20);
  });
});
