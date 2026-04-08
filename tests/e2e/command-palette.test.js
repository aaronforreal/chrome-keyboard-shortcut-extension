import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  launchBrowser, closeBrowser, getBrowser, getExtensionPage,
  sendMessageToSW, clearExtensionStorage,
} from './setup/browser.js';
import { resetShortcutCounter } from './setup/helpers.js';

let optionsPage, testPage;

// The command palette key defaults to 'ctrl+shift+p' per DEFAULT_SETTINGS
const PALETTE_KEY = 'ctrl+shift+p';

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

describe('Command palette', () => {
  test('Ctrl+Shift+P opens the command palette overlay', async () => {
    await testPage.keyboard.down('Control');
    await testPage.keyboard.down('Shift');
    await testPage.keyboard.press('P');
    await testPage.keyboard.up('Shift');
    await testPage.keyboard.up('Control');

    // Wait for the command palette element to appear in the DOM
    const palette = await testPage.waitForSelector('#ksm-command-palette', { timeout: 3000 });
    expect(palette).not.toBeNull();

    const isVisible = await testPage.$eval('#ksm-command-palette', el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    });
    expect(isVisible).toBe(true);
  });

  test('Escape closes the command palette', async () => {
    // Open palette
    await testPage.keyboard.down('Control');
    await testPage.keyboard.down('Shift');
    await testPage.keyboard.press('P');
    await testPage.keyboard.up('Shift');
    await testPage.keyboard.up('Control');

    await testPage.waitForSelector('#ksm-command-palette', { timeout: 3000 });

    // Close palette
    await testPage.keyboard.press('Escape');

    // Wait for it to be hidden or removed
    await testPage.waitForFunction(() => {
      const el = document.getElementById('ksm-command-palette');
      if (!el) return true;
      const style = window.getComputedStyle(el);
      return style.display === 'none' || style.visibility === 'hidden' || el.offsetParent === null;
    }, { timeout: 3000 });
  });

  test('can search for registered shortcuts in the palette', async () => {
    // Register a shortcut first
    await sendMessageToSW(optionsPage, {
      type: 'CREATE_SHORTCUT',
      payload: {
        shortcut: {
          id: 'sc_palette_test_001',
          name: 'Open Dashboard',
          enabled: true,
          trigger: { type: 'combo', keys: ['ctrl', 'shift', 'd'], leaderKey: null, leaderTimeout: 1500, abbreviation: null },
          scope: { type: 'global', urlPattern: null, urlPatternType: 'glob' },
          action: { type: 'url', url: 'https://example.com/dashboard', urlTarget: 'current_tab',
                    scrollAmount: 300, scrollDirection: 'down', clickSelector: null, fillSelector: null,
                    fillValue: null, script: null, macroId: null, clipboardAction: null,
                    clipboardSelector: null, clipboardTransform: null, navigateDirection: 'back', textExpansion: null },
          conditions: [],
          tags: [],
        },
      },
    });

    await testPage.reload({ waitUntil: 'networkidle0' });
    await testPage.waitForFunction(() => window.__KSM_INITIALIZED__ === true, { timeout: 8000 });

    // Open palette
    await testPage.keyboard.down('Control');
    await testPage.keyboard.down('Shift');
    await testPage.keyboard.press('P');
    await testPage.keyboard.up('Shift');
    await testPage.keyboard.up('Control');

    await testPage.waitForSelector('#ksm-command-palette', { timeout: 3000 });

    // Type search query
    await testPage.keyboard.type('Dashboard');

    // Verify a result appears containing "Dashboard"
    const resultText = await testPage.waitForFunction(() => {
      const el = document.getElementById('ksm-command-palette');
      return el && el.textContent.includes('Dashboard') ? el.textContent : null;
    }, { timeout: 3000 });

    expect(resultText).toBeTruthy();
  });
});
