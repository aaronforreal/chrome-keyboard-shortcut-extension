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

describe('Shortcut firing', () => {
  test('URL shortcut opens a new tab when the combo is pressed', async () => {
    const browser = getBrowser();

    await sendMessageToSW(optionsPage, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: makeShortcut({
          name: 'Open Example Org',
          trigger: { type: 'combo', keys: ['ctrl', 'shift', 'y'], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
          action: { ...makeShortcut().action, url: 'https://example.org', urlTarget: 'new_tab' },
        }),
      },
    });

    // Reload so content script picks up the new shortcuts
    await testPage.reload({ waitUntil: 'networkidle0' });
    await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });

    const newTabPromise = new Promise(resolve => {
      browser.once('targetcreated', target => {
        if (target.type() === 'page') resolve(target);
      });
    });

    await testPage.keyboard.down('Control');
    await testPage.keyboard.down('Shift');
    await testPage.keyboard.press('Y');
    await testPage.keyboard.up('Shift');
    await testPage.keyboard.up('Control');

    const newTarget = await Promise.race([
      newTabPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('No new tab opened within 4s')), 4000)),
    ]);

    const newPage = await newTarget.page();
    await newPage.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => {});
    expect(newPage.url()).toContain('example.org');
    await newPage.close();
  });

  test('shortcut does NOT fire when the extension is disabled', async () => {
    const browser = getBrowser();

    await sendMessageToSW(optionsPage, {
      type: 'TOGGLE_EXTENSION',
      payload: { enabled: false },
    });
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

    // Re-enable for cleanup
    await sendMessageToSW(optionsPage, {
      type: 'TOGGLE_EXTENSION',
      payload: { enabled: true },
    });
  });
});
