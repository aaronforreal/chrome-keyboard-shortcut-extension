import { MESSAGE_TYPES } from '../shared/constants.js';
import { renderStatusBar } from './components/status-bar.js';
import { renderShortcutList } from './components/shortcut-list.js';
import { renderQuickAdd, openQuickAdd } from './components/quick-add.js';

let _shortcuts = [];
let _settings = {};
let _tab = null;

async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  _tab = tab;

  // Load settings
  const settingsRes = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
  _settings = settingsRes?.settings || {};

  // Load shortcuts for current URL
  const shortcutsRes = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS });
  const allShortcuts = shortcutsRes?.shortcuts || [];

  // Filter to shortcuts relevant to current tab
  const url = tab?.url || '';
  _shortcuts = allShortcuts.filter(s => {
    if (!s.enabled) return false;
    if (s.scope?.type === 'global') return true;
    if (!s.scope?.urlPattern) return false;
    return matchesUrl(s.scope, url);
  });

  // Register static button listeners once — do NOT put these inside render()
  document.getElementById('ksm-add-btn').addEventListener('click', () => {
    openQuickAdd(document.getElementById('ksm-quick-add-area'));
  });
  document.getElementById('ksm-dashboard-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  render();
}

function render() {
  // Status bar
  renderStatusBar(document.getElementById('ksm-status-bar'), {
    settings: _settings,
    tab: _tab,
    onToggle: (enabled) => {
      _settings = { ..._settings, enabled };
      render();
    },
    onOpenOptions: () => window.close(),
  });

  // Shortcut list
  renderShortcutList(document.getElementById('ksm-shortcut-list'), {
    shortcuts: _shortcuts,
    tab: _tab,
  });

  // Quick add
  renderQuickAdd(document.getElementById('ksm-quick-add-area'), {
    tab: _tab,
    onSaved: (shortcut) => {
      _shortcuts = [..._shortcuts, shortcut];
      renderShortcutList(document.getElementById('ksm-shortcut-list'), {
        shortcuts: _shortcuts,
        tab: _tab,
      });
    },
  });

}

function matchesUrl(scope, url) {
  if (!scope.urlPattern || !url) return false;
  try {
    if (scope.urlPatternType === 'regex') {
      return new RegExp(scope.urlPattern).test(url);
    }
    const regex = globToRegex(scope.urlPattern);
    return regex.test(url);
  } catch {
    return false;
  }
}

function globToRegex(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

init();
