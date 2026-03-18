import { formatComboDisplay } from '../shared/platform.js';

let _overlay = null;
let _visible = false;
let _shortcuts = [];

export function initHintOverlay(shortcuts, settings) {
  _shortcuts = shortcuts;
  if (!_overlay) createOverlay();
}

export function updateShortcuts(shortcuts) {
  _shortcuts = shortcuts;
  if (_visible) renderHints();
}

export function toggleHintOverlay() {
  if (_visible) hide();
  else show();
}

export function show() {
  if (!_overlay) createOverlay();
  renderHints();
  _overlay.classList.add('ksm-hint-visible');
  _visible = true;
}

export function hide() {
  if (_overlay) _overlay.classList.remove('ksm-hint-visible');
  _visible = false;
}

function createOverlay() {
  _overlay = document.createElement('div');
  _overlay.id = 'ksm-hint-overlay';
  _overlay.className = 'ksm-hint-overlay';
  document.body.appendChild(_overlay);

  // Dismiss on Escape or click outside
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _visible) { hide(); e.preventDefault(); }
  }, true);
  _overlay.addEventListener('click', hide);
}

function renderHints() {
  if (!_overlay) return;
  _overlay.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'ksm-hint-panel';

  const header = document.createElement('div');
  header.className = 'ksm-hint-header';
  header.innerHTML = `
    <span>⌨ Keyboard Shortcuts</span>
    <span class="ksm-hint-close">✕</span>
  `;
  header.querySelector('.ksm-hint-close').addEventListener('click', hide);
  panel.appendChild(header);

  // Group by scope
  const global = _shortcuts.filter(s => s.scope?.type === 'global');
  const local = _shortcuts.filter(s => s.scope?.type !== 'global');

  if (local.length > 0) {
    panel.appendChild(renderGroup('On this page', local));
  }
  if (global.length > 0) {
    panel.appendChild(renderGroup('Global', global));
  }

  if (_shortcuts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'ksm-hint-empty';
    empty.textContent = 'No shortcuts configured yet.';
    panel.appendChild(empty);
  }

  _overlay.appendChild(panel);
}

function renderGroup(title, shortcuts) {
  const group = document.createElement('div');
  group.className = 'ksm-hint-group';

  const heading = document.createElement('div');
  heading.className = 'ksm-hint-group-title';
  heading.textContent = title;
  group.appendChild(heading);

  for (const s of shortcuts) {
    const row = document.createElement('div');
    row.className = 'ksm-hint-row';

    const keys = document.createElement('span');
    keys.className = 'ksm-hint-keys';
    const comboStr = s.trigger?.keys?.join('+') || '';
    keys.textContent = formatComboDisplay(comboStr, 'auto');

    const label = document.createElement('span');
    label.className = 'ksm-hint-label';
    label.textContent = s.name || s.description || 'Unnamed shortcut';

    row.appendChild(keys);
    row.appendChild(label);
    group.appendChild(row);
  }

  return group;
}
