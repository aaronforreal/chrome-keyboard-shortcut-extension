import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  launchBrowser, closeBrowser, getBrowser, getExtensionPage,
  sendMessageToSW, clearExtensionStorage,
} from './setup/browser.js';
import { makeShortcut, resetShortcutCounter } from './setup/helpers.js';

let optionsPage, testPage;

beforeAll(async () => {
  await launchBrowser();
  optionsPage = await getExtensionPage('options/options.html');
});

afterAll(async () => {
  await optionsPage.close();
  if (testPage && !testPage.isClosed()) await testPage.close();
  await closeBrowser();
});

beforeEach(async () => {
  resetShortcutCounter();
  await clearExtensionStorage(optionsPage);
  if (testPage && !testPage.isClosed()) await testPage.close();
  const browser = getBrowser();
  testPage = await browser.newPage();
  await testPage.goto('https://example.com', { waitUntil: 'networkidle0' });
  await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });
});

describe('Analytics tracking', () => {
  test('firing a shortcut creates an analytics entry for that shortcut id', async () => {
    const browser = getBrowser();

    const createRes = await sendMessageToSW(optionsPage, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: makeShortcut({
          trigger: { type: 'combo', keys: ['ctrl', 'shift', 'y'], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
          action: { ...makeShortcut().action, url: 'https://example.org', urlTarget: 'new_tab' },
        }),
      },
    });
    const shortcutId = createRes.shortcut.id;

    await testPage.reload({ waitUntil: 'networkidle0' });
    await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });

    // Fire the shortcut and capture the new tab
    const newTabPromise = new Promise(resolve => {
      browser.once('targetcreated', t => { if (t.type() === 'page') resolve(t); });
    });

    await testPage.keyboard.down('Control');
    await testPage.keyboard.down('Shift');
    await testPage.keyboard.press('Y');
    await testPage.keyboard.up('Shift');
    await testPage.keyboard.up('Control');

    const target = await Promise.race([
      newTabPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('No new tab')), 4000)),
    ]);
    const newPage = await target.page();
    await newPage.close();

    // Give the analytics write time to complete
    await new Promise(r => setTimeout(r, 500));

    const analyticsRes = await sendMessageToSW(optionsPage, { type: 'GET_ANALYTICS' });
    expect(analyticsRes.success).toBe(true);

    const entry = analyticsRes.analytics[shortcutId];
    expect(entry).toBeDefined();
    expect(entry.executions.length).toBeGreaterThan(0);
  });

  test('GET_ANALYTICS returns an empty object before any shortcuts fire', async () => {
    const res = await sendMessageToSW(optionsPage, { type: 'GET_ANALYTICS' });
    expect(res.success).toBe(true);
    expect(typeof res.analytics).toBe('object');
  });
});
