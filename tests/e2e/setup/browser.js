import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.resolve(__dirname, '../../../dist');

let _browser = null;
let _extensionId = null;

export async function launchBrowser() {
  _browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: [
      `--disable-extensions-except=${DIST_PATH}`,
      `--load-extension=${DIST_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  return _browser;
}

export function getBrowser() {
  if (!_browser) throw new Error('Browser not launched. Call launchBrowser() first.');
  return _browser;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
    _extensionId = null;
  }
}

/**
 * Discover the loaded extension's ID by waiting for the service worker target.
 * SW target URL format: chrome-extension://<extensionId>/background/service-worker.js
 */
export async function getExtensionId() {
  if (_extensionId) return _extensionId;

  const swTarget = await _browser.waitForTarget(
    t => t.type() === 'service_worker' && t.url().includes('service-worker.js'),
    { timeout: 10000 }
  );
  _extensionId = swTarget.url().split('/')[2];
  return _extensionId;
}

/**
 * Open a new page at chrome-extension://<id>/<pagePath>.
 * pagePath examples: 'options/options.html', 'popup/popup.html'
 */
export async function getExtensionPage(pagePath) {
  const id = await getExtensionId();
  const page = await _browser.newPage();
  await page.goto(`chrome-extension://${id}/${pagePath}`, { waitUntil: 'networkidle0' });
  return page;
}

/**
 * Send a chrome.runtime message from within an extension page context.
 * The page must be an extension page (options.html / popup.html) so that
 * chrome.runtime is available.
 */
export async function sendMessageToSW(page, message) {
  return page.evaluate((msg) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }, message);
}

/**
 * Clear all extension storage. Run in beforeEach to isolate tests.
 */
export async function clearExtensionStorage(page) {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(resolve);
      });
    });
  });
}
