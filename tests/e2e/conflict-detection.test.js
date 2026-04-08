import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  launchBrowser, closeBrowser, getExtensionPage,
  sendMessageToSW, clearExtensionStorage,
} from './setup/browser.js';
import { makeShortcut, resetShortcutCounter } from './setup/helpers.js';

let page;

beforeAll(async () => {
  await launchBrowser();
  page = await getExtensionPage('options/options.html');
});

afterAll(async () => {
  await page.close();
  await closeBrowser();
});

beforeEach(async () => {
  resetShortcutCounter();
  await clearExtensionStorage(page);
});

describe('CHECK_SINGLE_CONFLICT', () => {
  test('blocks a browser-reserved combo (ctrl+t)', async () => {
    const res = await sendMessageToSW(page, {
      type: 'CHECK_SINGLE_CONFLICT',
      payload: { combo: 'ctrl+t', scope: { type: 'global' }, excludeId: null },
    });

    expect(res.success).toBe(true);
    expect(res.result.tier).toBe('browser_reserved');
    expect(res.result.canOverride).toBe(false);
  });

  test('warns on a common browser shortcut (ctrl+f)', async () => {
    const res = await sendMessageToSW(page, {
      type: 'CHECK_SINGLE_CONFLICT',
      payload: { combo: 'ctrl+f', scope: { type: 'global' }, excludeId: null },
    });

    expect(res.success).toBe(true);
    expect(res.result.tier).toBe('browser_common');
    expect(res.result.canOverride).toBe(true);
  });

  test('detects a duplicate custom shortcut (extension tier)', async () => {
    const createRes = await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'First' }) },
    });

    // Try to register a second shortcut with the same combo (ctrl+shift+y)
    const conflictRes = await sendMessageToSW(page, {
      type: 'CHECK_SINGLE_CONFLICT',
      payload: { combo: 'ctrl+shift+y', scope: { type: 'global' }, excludeId: null },
    });

    expect(conflictRes.success).toBe(true);
    expect(conflictRes.result.tier).toBe('extension');
    expect(conflictRes.result.conflictingShortcut.id).toBe(createRes.shortcut.id);
    expect(conflictRes.result.canOverride).toBe(false);
  });

  test('excludeId allows editing your own shortcut without a false conflict', async () => {
    const createRes = await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'Self' }) },
    });
    const id = createRes.shortcut.id;

    const conflictRes = await sendMessageToSW(page, {
      type: 'CHECK_SINGLE_CONFLICT',
      payload: { combo: 'ctrl+shift+y', scope: { type: 'global' }, excludeId: id },
    });

    expect(conflictRes.success).toBe(true);
    expect(conflictRes.result.tier).toBe('none');
  });

  test('returns none for a safe unused combo', async () => {
    const res = await sendMessageToSW(page, {
      type: 'CHECK_SINGLE_CONFLICT',
      payload: { combo: 'ctrl+shift+q', scope: { type: 'global' }, excludeId: null },
    });

    expect(res.success).toBe(true);
    expect(res.result.tier).toBe('none');
  });
});
