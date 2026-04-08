import { MESSAGE_TYPES } from '../shared/constants.js';
import { Dashboard } from './components/dashboard.js';
import { ShortcutEditor } from './components/shortcut-editor.js';
import { MacroBuilder } from './components/macro-builder.js';
import { AnalyticsView } from './components/analytics-view.js';
import { ImportExport } from './components/import-export.js';

let _settings = {};
let _dashboard = null;
let _analytics = null;
let _activeTab = 'dashboard';

// ─── Tab navigation ──────────────────────────────────────────────────────

document.querySelectorAll('.ksm-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    switchTab(name);
  });
});

function switchTab(name) {
  _activeTab = name;
  document.querySelectorAll('.ksm-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.ksm-tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));

  if (name === 'analytics' && _analytics) {
    _analytics.load();
  }
  if (name === 'dashboard' && _dashboard) {
    _dashboard.load();
  }
  if (name === 'macros') {
    loadMacrosList();
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────

async function init() {
  const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
  _settings = res?.settings || {};

  // Global enabled toggle
  const toggle = document.getElementById('ksm-global-enabled');
  toggle.checked = _settings.enabled !== false;
  toggle.addEventListener('change', async () => {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      payload: { settings: { enabled: toggle.checked } },
    });
  });

  // Dashboard
  _dashboard = new Dashboard(document.getElementById('dashboard-container'), {
    onEdit: (shortcut) => {
      openShortcutEditor(shortcut);
      switchTab('new-shortcut');
    },
    onDelete: () => {},
  });
  _dashboard.load();

  // "New shortcut" button on dashboard
  document.getElementById('opt-new-shortcut-btn').addEventListener('click', () => {
    openShortcutEditor(null);
    switchTab('new-shortcut');
  });

  // Analytics
  _analytics = new AnalyticsView(document.getElementById('analytics-container'));

  // Settings
  renderSettings();

  // Import/Export
  new ImportExport(document.getElementById('import-export-container'));

  // Macro new button
  document.getElementById('opt-new-macro-btn').addEventListener('click', () => openMacroEditor(null));

  // Load macros list initially
  loadMacrosList();
}

// ─── Shortcut editor ─────────────────────────────────────────────────────

function openShortcutEditor(shortcut) {
  const container = document.getElementById('shortcut-editor-container');
  new ShortcutEditor(container, {
    shortcut,
    onSaved: () => {
      switchTab('dashboard'); // switchTab already calls _dashboard.load()
    },
    onCancel: () => switchTab('dashboard'),
  });
}

// ─── Macro list + editor ─────────────────────────────────────────────────

async function loadMacrosList() {
  const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_MACROS });
  const macros = res?.macros || [];
  const container = document.getElementById('macros-list-container');
  const editorContainer = document.getElementById('macro-editor-container');
  editorContainer.style.display = 'none';

  if (macros.length === 0) {
    container.innerHTML = `
      <div class="ksm-empty">
        <div class="ksm-empty-title">No macros yet</div>
        <div class="ksm-empty-sub">Create a macro to automate multi-step actions.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="ksm-card">
      <table class="ksm-table">
        <thead><tr><th>Name</th><th>Steps</th><th>On error</th><th></th></tr></thead>
        <tbody>
          ${macros.map(m => `
            <tr data-macro-id="${m.id}">
              <td style="font-weight:500;">${esc(m.name)}</td>
              <td>${m.steps?.length || 0} step(s)</td>
              <td><span class="ksm-badge">${esc(m.onError || 'stop')}</span></td>
              <td>
                <div style="display:flex;gap:4px;">
                  <button class="ksm-btn-icon macro-edit-btn" data-id="${m.id}" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="ksm-btn-icon macro-delete-btn" data-id="${m.id}" style="color:var(--ksm-red);" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.macro-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = macros.find(x => x.id === btn.dataset.id);
      if (m) openMacroEditor(m);
    });
  });

  container.querySelectorAll('.macro-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this macro?')) return;
      await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_MACRO, payload: { id: btn.dataset.id } });
      loadMacrosList();
    });
  });
}

function openMacroEditor(macro) {
  const editorContainer = document.getElementById('macro-editor-container');
  editorContainer.style.display = 'block';
  editorContainer.scrollIntoView({ behavior: 'smooth' });

  new MacroBuilder(editorContainer, {
    macro,
    onSaved: () => {
      editorContainer.style.display = 'none';
      loadMacrosList();
    },
    onCancel: () => {
      editorContainer.style.display = 'none';
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────

function renderSettings() {
  const container = document.getElementById('settings-container');
  const s = _settings;

  container.innerHTML = `
    <div class="ksm-card">
      <div class="ksm-card-title">Keyboard</div>

      <div class="ksm-form-group ksm-flex-between">
        <div>
          <div style="font-weight:500;font-size:13px;">Leader key system</div>
          <div class="ksm-form-hint">Enables Vim-style two-stroke shortcuts</div>
        </div>
        <label class="ksm-toggle">
          <input type="checkbox" id="s-leader-enabled" ${s.leaderKeyEnabled ? 'checked' : ''}/>
          <span class="ksm-toggle-track"></span>
          <span class="ksm-toggle-thumb"></span>
        </label>
      </div>

      <div class="ksm-form-row" id="s-leader-fields" ${!s.leaderKeyEnabled ? 'style="display:none;"' : ''}>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Leader key</label>
          <input class="ksm-form-input" id="s-leader-key" type="text" value="${esc(s.leaderKey || 'space')}" placeholder="space"/>
        </div>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Timeout (ms)</label>
          <input class="ksm-form-input" id="s-leader-timeout" type="number" value="${s.leaderTimeout || 1500}" min="500" max="5000"/>
        </div>
      </div>

      <div class="ksm-form-row" style="margin-top:8px;">
        <div class="ksm-form-group">
          <label class="ksm-form-label">Command palette shortcut</label>
          <input class="ksm-form-input" id="s-palette-key" type="text" value="${esc(s.commandPaletteKey || 'ctrl+shift+p')}"/>
        </div>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Show hints shortcut</label>
          <input class="ksm-form-input" id="s-hints-key" type="text" value="${esc(s.hintsActivationKey || 'alt+h')}"/>
        </div>
      </div>
    </div>

    <div class="ksm-card" style="margin-top:16px;">
      <div class="ksm-card-title">Platform & display</div>

      <div class="ksm-form-row">
        <div class="ksm-form-group">
          <label class="ksm-form-label">Platform</label>
          <select class="ksm-form-select" id="s-platform">
            <option value="auto" ${s.platform === 'auto' ? 'selected' : ''}>Auto-detect</option>
            <option value="mac" ${s.platform === 'mac' ? 'selected' : ''}>macOS</option>
            <option value="windows" ${s.platform === 'windows' ? 'selected' : ''}>Windows</option>
            <option value="linux" ${s.platform === 'linux' ? 'selected' : ''}>Linux</option>
          </select>
        </div>
      </div>

      <div class="ksm-form-group ksm-flex-between" style="margin-top:8px;">
        <div>
          <div style="font-weight:500;font-size:13px;">Shortcut hints overlay</div>
          <div class="ksm-form-hint">Show inline labels on the current page (toggle with the hint shortcut)</div>
        </div>
        <label class="ksm-toggle">
          <input type="checkbox" id="s-show-hints" ${s.showHints !== false ? 'checked' : ''}/>
          <span class="ksm-toggle-track"></span>
          <span class="ksm-toggle-thumb"></span>
        </label>
      </div>

      <div class="ksm-form-group ksm-flex-between" style="margin-top:8px;">
        <div>
          <div style="font-weight:500;font-size:13px;">Usage analytics</div>
          <div class="ksm-form-hint">Track which shortcuts you use and how often</div>
        </div>
        <label class="ksm-toggle">
          <input type="checkbox" id="s-analytics" ${s.analyticsEnabled !== false ? 'checked' : ''}/>
          <span class="ksm-toggle-track"></span>
          <span class="ksm-toggle-thumb"></span>
        </label>
      </div>
    </div>

    <div style="margin-top:20px;">
      <button class="ksm-btn ksm-btn-primary" id="s-save">Save settings</button>
      <span id="s-save-status" style="margin-left:12px;font-size:12px;color:var(--ksm-green);display:none;">✓ Saved!</span>
    </div>
  `;

  const leaderToggle = container.querySelector('#s-leader-enabled');
  const leaderFields = container.querySelector('#s-leader-fields');
  leaderToggle.addEventListener('change', () => {
    leaderFields.style.display = leaderToggle.checked ? 'grid' : 'none';
  });

  container.querySelector('#s-save').addEventListener('click', async () => {
    const updated = {
      leaderKeyEnabled: leaderToggle.checked,
      leaderKey: container.querySelector('#s-leader-key').value.trim() || 'space',
      leaderTimeout: parseInt(container.querySelector('#s-leader-timeout').value) || 1500,
      commandPaletteKey: container.querySelector('#s-palette-key').value.trim() || 'ctrl+shift+p',
      hintsActivationKey: container.querySelector('#s-hints-key').value.trim() || 'alt+h',
      platform: container.querySelector('#s-platform').value,
      showHints: container.querySelector('#s-show-hints').checked,
      analyticsEnabled: container.querySelector('#s-analytics').checked,
    };

    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.UPDATE_SETTINGS, payload: { settings: updated } });
    _settings = { ..._settings, ...updated };

    const status = container.querySelector('#s-save-status');
    status.style.display = 'inline';
    setTimeout(() => { status.style.display = 'none'; }, 2500);
  });
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

init();
