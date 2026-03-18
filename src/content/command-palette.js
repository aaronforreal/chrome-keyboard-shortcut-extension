import { MESSAGE_TYPES } from '../shared/constants.js';
import { formatComboDisplay } from '../shared/platform.js';
import { disableCapture, enableCapture } from './key-interceptor.js';

let _palette = null;
let _shortcuts = [];
let _visible = false;
let _selectedIndex = 0;
let _filtered = [];

export function initCommandPalette(shortcuts) {
  _shortcuts = shortcuts;
}

export function updateShortcuts(shortcuts) {
  _shortcuts = shortcuts;
}

export function show() {
  if (!_palette) createPalette();
  disableCapture();
  _palette.classList.add('ksm-palette-visible');
  _visible = true;
  _selectedIndex = 0;
  renderResults('');
  const input = _palette.querySelector('.ksm-palette-input');
  if (input) { input.value = ''; input.focus(); }
}

export function hide() {
  if (_palette) _palette.classList.remove('ksm-palette-visible');
  _visible = false;
  enableCapture();
}

function createPalette() {
  _palette = document.createElement('div');
  _palette.id = 'ksm-command-palette';
  _palette.className = 'ksm-palette-container';
  _palette.innerHTML = `
    <div class="ksm-palette-backdrop"></div>
    <div class="ksm-palette-modal">
      <div class="ksm-palette-search-wrap">
        <svg class="ksm-palette-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input class="ksm-palette-input" type="text" placeholder="Search shortcuts…" autocomplete="off" spellcheck="false"/>
        <kbd class="ksm-palette-esc">Esc</kbd>
      </div>
      <div class="ksm-palette-results"></div>
      <div class="ksm-palette-footer">
        <span><kbd>↑↓</kbd> navigate</span>
        <span><kbd>Enter</kbd> run</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>
  `;

  document.body.appendChild(_palette);

  const input = _palette.querySelector('.ksm-palette-input');
  const backdrop = _palette.querySelector('.ksm-palette-backdrop');

  input.addEventListener('input', e => {
    _selectedIndex = 0;
    renderResults(e.target.value);
  });

  input.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        _selectedIndex = Math.min(_selectedIndex + 1, _filtered.length - 1);
        updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        _selectedIndex = Math.max(_selectedIndex - 1, 0);
        updateSelection();
        break;
      case 'Enter':
        e.preventDefault();
        if (_filtered[_selectedIndex]) executeFiltered(_filtered[_selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        hide();
        break;
    }
  });

  backdrop.addEventListener('click', hide);
}

function renderResults(query) {
  const q = query.toLowerCase().trim();
  _filtered = q
    ? _shortcuts.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.trigger?.keys?.join('+').toLowerCase().includes(q)
      )
    : _shortcuts.slice();

  const container = _palette.querySelector('.ksm-palette-results');
  if (!container) return;

  if (_filtered.length === 0) {
    container.innerHTML = '<div class="ksm-palette-empty">No shortcuts found</div>';
    return;
  }

  container.innerHTML = '';
  _filtered.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = `ksm-palette-item${i === _selectedIndex ? ' ksm-palette-selected' : ''}`;
    item.dataset.index = i;

    const comboStr = s.trigger?.keys?.join('+') || '';
    const display = comboStr ? formatComboDisplay(comboStr, 'auto') : '';

    item.innerHTML = `
      <div class="ksm-palette-item-left">
        <span class="ksm-palette-name">${escapeHtml(s.name || 'Unnamed')}</span>
        ${s.description ? `<span class="ksm-palette-desc">${escapeHtml(s.description)}</span>` : ''}
      </div>
      ${display ? `<kbd class="ksm-palette-combo">${escapeHtml(display)}</kbd>` : ''}
    `;

    item.addEventListener('mouseenter', () => {
      _selectedIndex = i;
      updateSelection();
    });
    item.addEventListener('click', () => executeFiltered(s));
    container.appendChild(item);
  });
}

function updateSelection() {
  const items = _palette?.querySelectorAll('.ksm-palette-item');
  if (!items) return;
  items.forEach((el, i) => {
    el.classList.toggle('ksm-palette-selected', i === _selectedIndex);
  });
  const selected = items[_selectedIndex];
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

function executeFiltered(shortcut) {
  hide();
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.SHORTCUT_FIRED,
    payload: {
      shortcutId: shortcut.id,
      context: { url: window.location.href },
    },
  }).catch(() => {});
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
