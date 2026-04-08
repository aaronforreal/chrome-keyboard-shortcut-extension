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

describe('CREATE_SHORTCUT', () => {
  test('stores a valid shortcut and returns it with a generated id', async () => {
    const shortcut = makeShortcut({ name: 'Go to GitHub' });
    const res = await sendMessageToSW(page, { type: 'CREATE_SHORTCUT', payload: { shortcut } });

    expect(res.success).toBe(true);
    expect(res.shortcut.name).toBe('Go to GitHub');
    expect(res.shortcut.id).toMatch(/^sc_/);
  });

  test('rejects a shortcut with an empty name', async () => {
    const shortcut = makeShortcut({ name: '' });
    const res = await sendMessageToSW(page, { type: 'CREATE_SHORTCUT', payload: { shortcut } });

    expect(res.success).toBe(false);
    expect(res.errors).toContain('Name is required');
  });

  test('rejects a shortcut with missing trigger keys', async () => {
    const shortcut = makeShortcut({
      trigger: { type: 'combo', keys: [], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
    });
    const res = await sendMessageToSW(page, { type: 'CREATE_SHORTCUT', payload: { shortcut } });

    expect(res.success).toBe(false);
  });
});

describe('GET_ALL_SHORTCUTS', () => {
  test('returns an empty array when no shortcuts exist', async () => {
    const res = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });

    expect(res.success).toBe(true);
    expect(Array.isArray(res.shortcuts)).toBe(true);
    expect(res.shortcuts).toHaveLength(0);
  });

  test('returns all previously created shortcuts', async () => {
    await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'Alpha' }) },
    });
    await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: makeShortcut({
          name: 'Beta',
          trigger: { type: 'combo', keys: ['ctrl', 'shift', 'z'], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
        }),
      },
    });

    const res = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });

    expect(res.success).toBe(true);
    const names = res.shortcuts.map(s => s.name);
    expect(names).toContain('Alpha');
    expect(names).toContain('Beta');
  });
});

describe('UPDATE_SHORTCUT', () => {
  test('changes the shortcut name and persists it', async () => {
    const createRes = await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut({ name: 'Original Name' }) },
    });
    const id = createRes.shortcut.id;

    const updateRes = await sendMessageToSW(page, {
      type: 'UPDATE_SHORTCUT',
      payload: { shortcut: { ...createRes.shortcut, name: 'Updated Name' } },
    });
    expect(updateRes.success).toBe(true);

    const getAllRes = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });
    const updated = getAllRes.shortcuts.find(s => s.id === id);
    expect(updated.name).toBe('Updated Name');
  });
});

describe('DELETE_SHORTCUT', () => {
  test('removes the shortcut from storage', async () => {
    const createRes = await sendMessageToSW(page, {
      type: 'CREATE_SHORTCUT',
      payload: { shortcut: makeShortcut() },
    });
    const id = createRes.shortcut.id;

    const deleteRes = await sendMessageToSW(page, {
      type: 'DELETE_SHORTCUT',
      payload: { id },
    });
    expect(deleteRes.success).toBe(true);

    const getAllRes = await sendMessageToSW(page, { type: 'GET_ALL_SHORTCUTS' });
    expect(getAllRes.shortcuts.find(s => s.id === id)).toBeUndefined();
  });

  test('returns success false for a non-existent id', async () => {
    const res = await sendMessageToSW(page, {
      type: 'DELETE_SHORTCUT',
      payload: { id: 'sc_does_not_exist' },
    });
    expect(res.success).toBe(false);
  });
});
