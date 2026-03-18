import { formatComboDisplay } from '../../shared/platform.js';

export function renderShortcutList(container, { shortcuts, tab }) {
  const url = tab?.url || '';
  const hostname = getHostname(url);

  const siteShortcuts = shortcuts.filter(s => s.scope?.type !== 'global');
  const globalShortcuts = shortcuts.filter(s => s.scope?.type === 'global');

  if (shortcuts.length === 0) {
    container.innerHTML = `
      <div class="ksm-empty-state">
        <p>No shortcuts for this page yet.</p>
      </div>
    `;
    return;
  }

  let html = '';

  // Site info
  html += `
    <div class="ksm-site-info">
      <div class="ksm-site-host">🌐 ${escapeHtml(hostname)}</div>
      <div class="ksm-site-count">${shortcuts.length} shortcut${shortcuts.length !== 1 ? 's' : ''} active</div>
    </div>
  `;

  if (siteShortcuts.length > 0) {
    html += '<div class="ksm-section-title">On this site</div>';
    html += siteShortcuts.map(s => renderRow(s)).join('');
  }

  if (globalShortcuts.length > 0) {
    html += '<div class="ksm-section-title">Global</div>';
    html += globalShortcuts.map(s => renderRow(s)).join('');
  }

  container.innerHTML = html;
}

function renderRow(s) {
  const keys = s.trigger?.keys?.join('+') || '';
  const display = keys ? formatComboDisplay(keys, 'auto') : '—';
  const typeLabel = s.action?.type || 'action';

  // Leader sequence indicator
  const isLeader = s.trigger?.type === 'leader_sequence';
  const leaderKey = s.trigger?.leaderKey || 'space';
  const displayKeys = isLeader ? `${leaderKey} › ${display}` : display;

  return `
    <div class="ksm-shortcut-item" data-id="${s.id}">
      <span class="ksm-shortcut-keys">${escapeHtml(displayKeys)}</span>
      <span class="ksm-shortcut-name">${escapeHtml(s.name || 'Unnamed')}</span>
      <span class="ksm-shortcut-type">${escapeHtml(typeLabel)}</span>
    </div>
  `;
}

function getHostname(url) {
  try { return new URL(url).hostname || url; }
  catch { return url; }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
