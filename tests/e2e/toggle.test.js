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
  // Re-enable extension at the start of each test
  await sendMessageToSW(optionsPage, { type: 'TOGGLE_EXTENSION', payload: { enabled: true } });
  if (testPage && !testPage.isClosed()) await testPage.close();
  const browser = getBrowser();
  testPage = await browser.newPage();
  await testPage.goto('https://example.com', { waitUntil: 'networkidle0' });
  await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });
});

describe('TOGGLE_EXTENSION', () => {
  test('shortcuts fire when enabled', async () => {
    const browser = getBrowser();

    await sendMessageToSW(optionsPage, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: makeShortcut({
          trigger: { type: 'combo', keys: ['ctrl', 'shift', 'y'], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
          action: { ...makeShortcut().action, url: 'https://example.org', urlTarget: 'new_tab' },
        }),
      },
    });

    await testPage.reload({ waitUntil: 'networkidle0' });
    await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });

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
  });

  test('shortcuts do NOT fire when disabled', async () => {
    const browser = getBrowser();

    await sendMessageToSW(optionsPage, { type: 'TOGGLE_EXTENSION', payload: { enabled: false } });
    await sendMessageToSW(optionsPage, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: makeShortcut({
          trigger: { type: 'combo', keys: ['ctrl', 'shift', 'y'], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
          action: { ...makeShortcut().action, url: 'https://example.org', urlTarget: 'new_tab' },
        }),
      },
    });

    await testPage.reload({ waitUntil: 'networkidle0' });
    await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });

    let newTabOpened = false;
    const listener = () => { newTabOpened = true; };
    browser.on('targetcreated', listener);

    await testPage.keyboard.down('Control');
    await testPage.keyboard.down('Shift');
    await testPage.keyboard.press('Y');
    await testPage.keyboard.up('Shift');
    await testPage.keyboard.up('Control');

    await new Promise(r => setTimeout(r, 1500));
    browser.off('targetcreated', listener);
    expect(newTabOpened).toBe(false);
  });

  test('GET_SETTINGS reflects the enabled state after toggle', async () => {
    await sendMessageToSW(optionsPage, { type: 'TOGGLE_EXTENSION', payload: { enabled: false } });
    const res = await sendMessageToSW(optionsPage, { type: 'GET_SETTINGS' });
    expect(res.settings.enabled).toBe(false);

    await sendMessageToSW(optionsPage, { type: 'TOGGLE_EXTENSION', payload: { enabled: true } });
    const res2 = await sendMessageToSW(optionsPage, { type: 'GET_SETTINGS' });
    expect(res2.settings.enabled).toBe(true);
  });
});
