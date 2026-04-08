import { MESSAGE_TYPES } from '../shared/constants.js';
import { normalizeCombo, buildComboString } from '../shared/key-utils.js';
import { executeAction } from '../content/action-executor.js';

let _shortcuts = [];
let _settings = {};

// ─── Boot ─────────────────────────────────────────────────────────────────

async function init() {
  try {
    const [shortcutsRes, settingsRes] = await Promise.all([
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS }),
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS }),
    ]);
    _shortcuts = (shortcutsRes?.shortcuts || []).filter(s => s.enabled);
    _settings = settingsRes?.settings || {};
  } catch {
    // Service worker not ready yet — retry once after a short delay
    await new Promise(r => setTimeout(r, 400));
    try {
      const [shortcutsRes, settingsRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS }),
        chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS }),
      ]);
      _shortcuts = (shortcutsRes?.shortcuts || []).filter(s => s.enabled);
      _settings = settingsRes?.settings || {};
    } catch {}
  }

  render(_shortcuts);
  setupKeyListener();
  setupSearch();
  setupMessageListener();

  document.getElementById('ksm-nt-options').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// ─── Render shortcut cards ─────────────────────────────────────────────────

function render(shortcuts) {
  const grid = document.getElementById('ksm-nt-grid');

  if (shortcuts.length === 0) {
    grid.innerHTML = `
      <div class="ksm-nt-empty">
        <div class="ksm-nt-empty-icon">⌨</div>
        <p>No shortcuts yet</p>
        <small>Click "Manage shortcuts" below to add your first shortcut.</small>
      </div>`;
    return;
  }

  grid.innerHTML = '';
  for (const s of shortcuts) {
    const keys = comboDisplay(s);
    const desc = s.description || s.action?.url || '';
    const card = document.createElement('div');
    card.className = 'ksm-nt-card';
    card.dataset.id = s.id;

    const keysEl = document.createElement('div');
    keysEl.className = 'ksm-nt-card-keys';
    keysEl.textContent = keys;

    const infoEl = document.createElement('div');
    infoEl.className = 'ksm-nt-card-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'ksm-nt-card-name';
    nameEl.textContent = s.name;

    infoEl.appendChild(nameEl);
    if (desc) {
      const descEl = document.createElement('div');
      descEl.className = 'ksm-nt-card-desc';
      descEl.textContent = desc;
      infoEl.appendChild(descEl);
    }

    const typeEl = document.createElement('div');
    typeEl.className = 'ksm-nt-card-type';
    typeEl.textContent = s.action?.type || '';

    card.appendChild(keysEl);
    card.appendChild(infoEl);
    card.appendChild(typeEl);

    card.addEventListener('click', () => fireShortcut(s));
    grid.appendChild(card);
  }
}

function comboDisplay(shortcut) {
  const t = shortcut.trigger;
  if (!t) return '—';
  if (t.type === 'text_expansion') return t.abbreviation || '—';
  if (!t.keys || t.keys.length === 0) return '—';
  // Display with capital modifiers: alt+m → Alt+M
  return buildComboString(t.keys)
    .split('+')
    .map(k => k.charAt(0).toUpperCase() + k.slice(1))
    .join('+');
}

// ─── Search ────────────────────────────────────────────────────────────────

function setupSearch() {
  const input = document.getElementById('ksm-nt-search');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const filtered = q
      ? _shortcuts.filter(s =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          comboDisplay(s).toLowerCase().includes(q) ||
          (s.action?.url || '').toLowerCase().includes(q)
        )
      : _shortcuts;
    render(filtered);
  });
}

// ─── Keyboard listener ─────────────────────────────────────────────────────

function setupKeyListener() {
  document.addEventListener('keydown', (e) => {
    // Don't intercept when typing in the search box
    if (e.target === document.getElementById('ksm-nt-search')) return;

    // Skip modifier-only
    if (['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key)) return;

    if (!e.key) return;
    if (_settings.enabled === false) return;

    const combo = normalizeCombo(e);
    if (!combo) return;

    // Check command palette shortcut
    const paletteKey = _settings.commandPaletteKey || 'ctrl+shift+p';
    if (combo === paletteKey) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('ksm-nt-search').focus();
      return;
    }

    const match = findMatch(combo);
    if (match) {
      e.preventDefault();
      e.stopPropagation();
      fireShortcut(match);
    }
  }, true);
}

function findMatch(combo) {
  const enabled = _shortcuts.filter(s => s.enabled);
  // Prefer site/page-specific over global (on newtab there's no real URL, so global wins)
  const global = enabled.filter(s => {
    if (!s.trigger || s.trigger.type !== 'combo') return false;
    return buildComboString(s.trigger.keys) === combo;
  });
  return global[0] || null;
}

function fireShortcut(shortcut) {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SHORTCUT_FIRED,
    payload: {
      shortcutId: shortcut.id,
      context: { url: '' },
    },
  }).catch(() => {});
  showToast(`Running: ${shortcut.name}`);
}

// ─── Message listener (for EXECUTE_ACTION sent back by service worker) ──────

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MESSAGE_TYPES.EXECUTE_ACTION) {
      executeAction(message.payload.action)
        .then(sendResponse)
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
    if (message.type === MESSAGE_TYPES.SHORTCUTS_UPDATED) {
      const { shortcuts, settings } = message.payload;
      _shortcuts = (shortcuts || []).filter(s => s.enabled);
      _settings = settings || _settings;
      render(_shortcuts);
      return true;
    }
  });
}

// ─── Toast ─────────────────────────────────────────────────────────────────

function showToast(text) {
  const existing = document.querySelector('.ksm-nt-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'ksm-nt-toast';
  toast.textContent = text;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade');
    setTimeout(() => toast.remove(), 300);
  }, 1800);
}

// ─── Start ─────────────────────────────────────────────────────────────────

init();
