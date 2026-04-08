let _idCounter = 0;

/**
 * Build a minimal valid ShortcutDefinition fixture.
 * Includes all required fields that validateShortcut() checks.
 * Override any field via the overrides object.
 */
export function makeShortcut(overrides = {}) {
  _idCounter++;
  return {
    id: `sc_test_${String(_idCounter).padStart(5, '0')}`,
    name: 'Test Shortcut',
    enabled: true,
    trigger: {
      type: 'combo',
      keys: ['ctrl', 'shift', 'y'],
      leaderKey: null,
      leaderTimeout: 1500,
      abbreviation: null,
    },
    scope: {
      type: 'global',
      urlPattern: null,
      urlPatternType: 'glob',
    },
    action: {
      type: 'url',
      url: 'https://example.com',
      urlTarget: 'new_tab',
      scrollAmount: 300,
      scrollDirection: 'down',
      clickSelector: null,
      fillSelector: null,
      fillValue: null,
      script: null,
      macroId: null,
      clipboardAction: null,
      clipboardSelector: null,
      clipboardTransform: null,
      navigateDirection: 'back',
      textExpansion: null,
    },
    conditions: [],
    tags: [],
    ...overrides,
  };
}

/**
 * Reset the counter (call in beforeEach if you need deterministic IDs).
 */
export function resetShortcutCounter() {
  _idCounter = 0;
}

/**
 * Dispatch a keydown event on the page's document.
 * modifiers: array of 'ctrl' | 'shift' | 'alt' | 'meta'
 */
export async function pressKey(page, key, modifiers = []) {
  await page.evaluate((k, mods) => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: k,
      ctrlKey: mods.includes('ctrl'),
      shiftKey: mods.includes('shift'),
      altKey: mods.includes('alt'),
      metaKey: mods.includes('meta'),
    }));
  }, key, modifiers);
}

/**
 * Poll until fn() returns a truthy value or timeout is reached.
 */
export async function waitFor(fn, { timeout = 5000, interval = 100 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result) return result;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`waitFor timed out after ${timeout}ms`);
}
