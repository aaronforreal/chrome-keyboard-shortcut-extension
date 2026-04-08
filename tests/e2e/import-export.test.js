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

describe('EXPORT_SHORTCUTS', () => {
  test('returns all shortcuts in the correct export format', async () => {
    await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'Export Test' }) },
    });

    const res = await sendMessageToSW(page, { type: 'EXPORT_SHORTCUTS' });

    expect(res.success).toBe(true);
    expect(res.data.version).toBe('1.0');
    expect(Array.isArray(res.data.shortcuts)).toBe(true);
    expect(res.data.shortcuts[0].name).toBe('Export Test');
    expect(typeof res.data.exportedAt).toBe('number');
  });

  test('returns empty shortcuts array when nothing is stored', async () => {
    const res = await sendMessageToSW(page, { type: 'EXPORT_SHORTCUTS' });
    expect(res.success).toBe(true);
    expect(res.data.shortcuts).toHaveLength(0);
  });
});

describe('IMPORT_SHORTCUTS — add mode', () => {
  test('adds new shortcuts without overwriting existing ones', async () => {
    const existingRes = await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'Existing' }) },
    });

    const importRes = await sendMessageToSW(page, {
      type: 'IMPORT_SHORTCUTS',
      payload: {
        shortcuts: [makeShortcut({ id: 'sc_import_new_001', name: 'Imported' })],
        merge: false,
      },
    });

    expect(importRes.success).toBe(true);

    const getAllRes = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });
    const names = getAllRes.shortcuts.map(s => s.name);
    expect(names).toContain('Existing');
    expect(names).toContain('Imported');
  });

  test('skips duplicate IDs — does not create double entries on re-import', async () => {
    const sc = makeShortcut({ id: 'sc_dup_test_001', name: 'Original' });
    await sendMessageToSW(page, {
      type: 'IMPORT_SHORTCUTS',
      payload: { shortcuts: [sc], merge: false },
    });
    // Re-import the same shortcut
    await sendMessageToSW(page, {
      type: 'IMPORT_SHORTCUTS',
      payload: { shortcuts: [sc], merge: false },
    });

    const getAllRes = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });
    const matching = getAllRes.shortcuts.filter(s => s.id === 'sc_dup_test_001');
    expect(matching).toHaveLength(1);
  });
});

describe('IMPORT_SHORTCUTS — merge mode', () => {
  test('updates an existing shortcut by ID when merge=true', async () => {
    const createRes = await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'Before Merge' }) },
    });
    const id = createRes.shortcut.id;

    const importRes = await sendMessageToSW(page, {
      type: 'IMPORT_SHORTCUTS',
      payload: {
        shortcuts: [{ ...createRes.shortcut, name: 'After Merge' }],
        merge: true,
      },
    });

    expect(importRes.success).toBe(true);

    const getAllRes = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });
    const updated = getAllRes.shortcuts.find(s => s.id === id);
    expect(updated.name).toBe('After Merge');
  });
});

describe('IMPORT_SHORTCUTS — validation', () => {
  test('rejects a malformed payload where shortcuts is not an array', async () => {
    const res = await sendMessageToSW(page, {
      type: 'IMPORT_SHORTCUTS',
      payload: { shortcuts: 'not-an-array', merge: false },
    });

    expect(res.success).toBe(false);
  });
});
