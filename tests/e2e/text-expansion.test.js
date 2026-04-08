import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  launchBrowser, closeBrowser, getBrowser, getExtensionPage,
  sendMessageToSW, clearExtensionStorage,
} from './setup/browser.js';
import { resetShortcutCounter } from './setup/helpers.js';

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
  // Use a data: URL with a text input — no network required
  await testPage.setContent(`
    <html><body><input id="test-input" type="text" /></body></html>
  `);
  await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 10000 });
});

describe('Text expansion', () => {
  test('replaces abbreviation with expanded text in an input field', async () => {
    await sendMessageToSW(optionsPage, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: {
          id: 'sc_text_exp_001',
          name: 'Address Expansion',
          enabled: true,
          trigger: {
            type: 'text_expansion',
            keys: [],
            leaderKey: null,
            leaderTimeout: 1500,
            abbreviation: ';addr',
          },
          scope: { type: 'global', urlPattern: null, urlPatternType: 'glob' },
          action: {
            type: 'text_expand',
            url: null,
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
            textExpansion: '123 Main Street',
          },
          conditions: [],
          tags: [],
        },
      },
    });

    // Focus and type the abbreviation
    await testPage.focus('#test-input');
    await testPage.keyboard.type(';addr');

    // Wait for the text-expander to replace the abbreviation
    await testPage.waitForFunction(
      () => document.getElementById('test-input').value === '123 Main Street',
      { timeout: 3000 }
    );

    const value = await testPage.$eval('#test-input', el => el.value);
    expect(value).toBe('123 Main Street');
  });

  test('does not expand an unregistered abbreviation', async () => {
    await testPage.focus('#test-input');
    await testPage.keyboard.type(';notregistered');

    await new Promise(r => setTimeout(r, 500));
    const value = await testPage.$eval('#test-input', el => el.value);
    expect(value).toBe(';notregistered');
  });
});
