import { describe, test, expect } from '@jest/globals';
import {
  buildComboString,
  parseComboString,
  combosEqual,
  suggestErgonomicAlternatives,
} from '../../src/shared/key-utils.js';

describe('buildComboString', () => {
  test('single key', () => {
    expect(buildComboString(['g'])).toBe('g');
  });

  test('ctrl+g', () => {
    expect(buildComboString(['ctrl', 'g'])).toBe('ctrl+g');
  });

  test('sorts modifiers into canonical order (ctrl before shift)', () => {
    expect(buildComboString(['shift', 'ctrl', 'g'])).toBe('ctrl+shift+g');
  });

  test('sorts all modifiers: ctrl+alt+shift+g', () => {
    expect(buildComboString(['shift', 'alt', 'ctrl', 'g'])).toBe('ctrl+alt+shift+g');
  });

  test('empty array returns empty string', () => {
    expect(buildComboString([])).toBe('');
  });

  test('null/undefined returns empty string', () => {
    expect(buildComboString(null)).toBe('');
    expect(buildComboString(undefined)).toBe('');
  });

  test('multiple non-modifier keys preserved after modifiers', () => {
    expect(buildComboString(['ctrl', 'f', '5'])).toBe('ctrl+f+5');
  });
});

describe('parseComboString', () => {
  test('parses ctrl+shift+g into array', () => {
    expect(parseComboString('ctrl+shift+g')).toEqual(['ctrl', 'shift', 'g']);
  });

  test('parses single key', () => {
    expect(parseComboString('g')).toEqual(['g']);
  });

  test('null/empty returns empty array', () => {
    expect(parseComboString(null)).toEqual([]);
    expect(parseComboString('')).toEqual([]);
  });
});

describe('combosEqual', () => {
  test('identical combos are equal', () => {
    expect(combosEqual('ctrl+g', 'ctrl+g')).toBe(true);
  });

  test('case-insensitive comparison', () => {
    expect(combosEqual('Ctrl+G', 'ctrl+g')).toBe(true);
  });

  test('different combos are not equal', () => {
    expect(combosEqual('ctrl+g', 'ctrl+h')).toBe(false);
  });

  test('null inputs return falsy', () => {
    expect(combosEqual(null, 'ctrl+g')).toBeFalsy();
    expect(combosEqual('ctrl+g', null)).toBeFalsy();
    expect(combosEqual(null, null)).toBeFalsy();
  });
});

describe('suggestErgonomicAlternatives', () => {
  test('returns an array', () => {
    expect(Array.isArray(suggestErgonomicAlternatives('ctrl+shift+alt+g'))).toBe(true);
  });

  test('returns at most 3 suggestions', () => {
    const suggestions = suggestErgonomicAlternatives('ctrl+shift+alt+g');
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  test('suggests ctrl+homerow for non-homerow single-modifier ctrl combo', () => {
    const suggestions = suggestErgonomicAlternatives('ctrl+p');
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach(s => expect(s).toMatch(/^ctrl\+[a-z]$/));
  });
});
