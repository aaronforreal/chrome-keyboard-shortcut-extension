import { MESSAGE_TYPES } from '../../shared/constants.js';

export class AnalyticsView {
  constructor(container) {
    this.container = container;
    this.render();
  }

  async load() {
    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ANALYTICS });
    const shortcuts = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS });
    this._renderData(res?.summary, res?.raw, shortcuts?.shortcuts || []);
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-stat-grid" id="av-stats"></div>
      <div class="ksm-card">
        <div class="ksm-card-title">Most used shortcuts</div>
        <div class="ksm-bar-chart" id="av-chart"></div>
      </div>
      <div class="ksm-card" style="margin-top:16px;">
        <div class="ksm-card-title">All shortcut activity</div>
        <div id="av-table"></div>
      </div>
    `;

    this.load();
  }

  _renderData(summary, raw, shortcuts) {
    const statsEl = this.container.querySelector('#av-stats');
    const chartEl = this.container.querySelector('#av-chart');
    const tableEl = this.container.querySelector('#av-table');

    if (!summary) {
      statsEl.innerHTML = '<p class="ksm-text-muted ksm-text-sm">No data yet. Use some shortcuts first!</p>';
      return;
    }

    // Stats cards
    const timeSavedLabel = summary.totalTimeSavedMinutes >= 60
      ? `${Math.round(summary.totalTimeSavedMinutes / 60)}h ${summary.totalTimeSavedMinutes % 60}m`
      : `${summary.totalTimeSavedMinutes}m`;

    statsEl.innerHTML = `
      <div class="ksm-stat-card">
        <div class="ksm-stat-value">${summary.totalExecutions.toLocaleString()}</div>
        <div class="ksm-stat-label">Total executions</div>
      </div>
      <div class="ksm-stat-card">
        <div class="ksm-stat-value">${timeSavedLabel}</div>
        <div class="ksm-stat-label">Estimated time saved</div>
      </div>
      <div class="ksm-stat-card">
        <div class="ksm-stat-value">${summary.recordCount}</div>
        <div class="ksm-stat-label">Active shortcuts</div>
      </div>
      <div class="ksm-stat-card">
        <div class="ksm-stat-value" style="color:${summary.totalErrors > 0 ? 'var(--ksm-red)' : 'var(--ksm-green)'};">${summary.totalErrors}</div>
        <div class="ksm-stat-label">Errors</div>
      </div>
    `;

    // Bar chart
    const shortcutMap = {};
    shortcuts.forEach(s => { shortcutMap[s.id] = s; });

    const topItems = summary.topShortcuts || [];
    if (topItems.length === 0) {
      chartEl.innerHTML = '<p class="ksm-text-sm ksm-text-muted">No usage data yet.</p>';
    } else {
      const maxCount = topItems[0]?.count || 1;
      chartEl.innerHTML = topItems.map(item => {
        const s = shortcutMap[item.shortcutId];
        const name = s?.name || item.shortcutId;
        const pct = Math.round((item.count / maxCount) * 100);
        return `
          <div class="ksm-bar-row">
            <span class="ksm-bar-label" title="${esc(name)}">${esc(name)}</span>
            <div class="ksm-bar-track">
              <div class="ksm-bar-fill" style="width:${pct}%;"></div>
            </div>
            <span class="ksm-bar-count">${item.count}</span>
          </div>
        `;
      }).join('');
    }

    // Activity table
    if (!raw || Object.keys(raw).length === 0) {
      tableEl.innerHTML = '<p class="ksm-text-sm ksm-text-muted">No detailed activity recorded yet.</p>';
      return;
    }

    const rows = Object.values(raw).map(record => {
      const s = shortcutMap[record.shortcutId];
      const lastExec = record.executions.at(-1);
      const errorRate = record.executions.length > 0
        ? Math.round((record.errorCount / record.executions.length) * 100)
        : 0;
      return `
        <tr>
          <td>${esc(s?.name || record.shortcutId)}</td>
          <td>${record.executions.length}</td>
          <td>${lastExec ? timeAgo(lastExec.timestamp) : '—'}</td>
          <td>
            ${record.errorCount > 0
              ? `<span class="ksm-badge ksm-badge-red">${record.errorCount} error${record.errorCount !== 1 ? 's' : ''} (${errorRate}%)</span>`
              : '<span class="ksm-badge ksm-badge-green">No errors</span>'
            }
          </td>
        </tr>
      `;
    }).join('');

    tableEl.innerHTML = `
      <table class="ksm-table">
        <thead><tr><th>Shortcut</th><th>Uses</th><th>Last used</th><th>Errors</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
