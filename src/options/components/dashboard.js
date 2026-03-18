import { MESSAGE_TYPES } from '../../shared/constants.js';
import { formatComboDisplay } from '../../shared/platform.js';

/**
 * Shortcut dashboard component — renders the full searchable/filterable table.
 */
export class Dashboard {
  constructor(container, { onEdit, onDelete }) {
    this.container = container;
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.shortcuts = [];
    this.filtered = [];
    this.sortKey = 'name';
    this.sortDir = 1;
    this.query = '';
    this.render();
  }

  async load() {
    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS });
    this.shortcuts = res?.shortcuts || [];
    this._filter();
    this._renderRows();
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-search-bar">
        <div class="ksm-search-input-wrap">
          <svg class="ksm-search-icon" width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input class="ksm-search-input" id="dash-search" type="text" placeholder="Search shortcuts…"/>
        </div>
        <select class="ksm-form-select" id="dash-filter-type" style="width:140px;">
          <option value="">All types</option>
          <option value="url">URL</option>
          <option value="scroll">Scroll</option>
          <option value="click">Click</option>
          <option value="fill">Fill</option>
          <option value="script">Script</option>
          <option value="macro">Macro</option>
          <option value="text_expand">Text expand</option>
          <option value="clipboard">Clipboard</option>
          <option value="navigate">Navigate</option>
        </select>
        <select class="ksm-form-select" id="dash-filter-scope" style="width:130px;">
          <option value="">All scopes</option>
          <option value="global">Global</option>
          <option value="site">Site</option>
          <option value="page">Page</option>
        </select>
      </div>

      <div class="ksm-table-wrap">
        <table class="ksm-table">
          <thead>
            <tr>
              <th data-key="name">Name ↕</th>
              <th>Keys</th>
              <th data-key="scope.type">Scope</th>
              <th data-key="action.type">Type</th>
              <th data-key="usageCount">Uses</th>
              <th>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="dash-tbody">
            <tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--ksm-text-muted);">Loading…</td></tr>
          </tbody>
        </table>
      </div>
      <div id="dash-empty" class="ksm-empty" style="display:none;">
        <div class="ksm-empty-title">No shortcuts yet</div>
        <div class="ksm-empty-sub">Click "New Shortcut" to create your first one.</div>
      </div>
    `;

    // Search
    this.container.querySelector('#dash-search').addEventListener('input', (e) => {
      this.query = e.target.value;
      this._filter();
      this._renderRows();
    });

    this.container.querySelector('#dash-filter-type').addEventListener('change', () => {
      this._filter();
      this._renderRows();
    });

    this.container.querySelector('#dash-filter-scope').addEventListener('change', () => {
      this._filter();
      this._renderRows();
    });

    // Sort headers
    this.container.querySelectorAll('th[data-key]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (this.sortKey === key) this.sortDir *= -1;
        else { this.sortKey = key; this.sortDir = 1; }
        this._filter();
        this._renderRows();
      });
    });
  }

  _filter() {
    const q = this.query.toLowerCase();
    const typeFilter = this.container.querySelector('#dash-filter-type')?.value || '';
    const scopeFilter = this.container.querySelector('#dash-filter-scope')?.value || '';

    let list = this.shortcuts.filter(s => {
      if (q && !s.name?.toLowerCase().includes(q) &&
          !s.description?.toLowerCase().includes(q) &&
          !s.trigger?.keys?.join('+').toLowerCase().includes(q)) return false;
      if (typeFilter && s.action?.type !== typeFilter) return false;
      if (scopeFilter && s.scope?.type !== scopeFilter) return false;
      return true;
    });

    // Sort
    list.sort((a, b) => {
      const av = getNestedValue(a, this.sortKey) ?? '';
      const bv = getNestedValue(b, this.sortKey) ?? '';
      return (av < bv ? -1 : av > bv ? 1 : 0) * this.sortDir;
    });

    this.filtered = list;
  }

  _renderRows() {
    const tbody = this.container.querySelector('#dash-tbody');
    const emptyEl = this.container.querySelector('#dash-empty');

    if (this.filtered.length === 0) {
      tbody.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    tbody.innerHTML = this.filtered.map(s => {
      const keys = s.trigger?.keys?.join('+') || '';
      const display = keys ? formatComboDisplay(keys, 'auto') : '—';
      const isLeader = s.trigger?.type === 'leader_sequence';
      const displayKeys = isLeader ? `${s.trigger.leaderKey || 'space'} › ${display}` : display;
      const typeColors = {
        url: 'blue', scroll: '', click: 'yellow', fill: 'yellow',
        script: 'red', macro: 'green', text_expand: 'blue',
        clipboard: '', navigate: '',
      };
      const colorClass = typeColors[s.action?.type] ? `ksm-badge-${typeColors[s.action.type]}` : '';

      return `
        <tr data-id="${s.id}">
          <td>
            <div style="font-weight:500;">${escHtml(s.name || 'Unnamed')}</div>
            ${s.description ? `<div class="ksm-text-sm ksm-text-muted">${escHtml(s.description)}</div>` : ''}
          </td>
          <td><kbd class="ksm-kbd">${escHtml(displayKeys)}</kbd></td>
          <td><span class="ksm-badge">${escHtml(s.scope?.type || '—')}</span></td>
          <td><span class="ksm-badge ${colorClass}">${escHtml(s.action?.type || '—')}</span></td>
          <td class="ksm-text-muted">${s.usageCount || 0}</td>
          <td>
            <label class="ksm-toggle" title="${s.enabled ? 'Enabled' : 'Disabled'}">
              <input type="checkbox" class="dash-enable-toggle" data-id="${s.id}" ${s.enabled ? 'checked' : ''}/>
              <span class="ksm-toggle-track"></span>
              <span class="ksm-toggle-thumb"></span>
            </label>
          </td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="ksm-btn-icon dash-edit-btn" data-id="${s.id}" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="ksm-btn-icon dash-delete-btn" data-id="${s.id}" title="Delete" style="color: var(--ksm-red);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Event delegation
    tbody.querySelectorAll('.dash-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = this.shortcuts.find(x => x.id === btn.dataset.id);
        if (s && this.onEdit) this.onEdit(s);
      });
    });

    tbody.querySelectorAll('.dash-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this shortcut?')) return;
        await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_SHORTCUT, payload: { id: btn.dataset.id } });
        this.shortcuts = this.shortcuts.filter(x => x.id !== btn.dataset.id);
        this._filter();
        this._renderRows();
        if (this.onDelete) this.onDelete(btn.dataset.id);
      });
    });

    tbody.querySelectorAll('.dash-enable-toggle').forEach(toggle => {
      toggle.addEventListener('change', async () => {
        const s = this.shortcuts.find(x => x.id === toggle.dataset.id);
        if (!s) return;
        s.enabled = toggle.checked;
        await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.UPDATE_SHORTCUT, payload: { shortcut: s } });
      });
    });
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
