import { MESSAGE_TYPES } from '../../shared/constants.js';
import { normalizeCombo } from '../../shared/key-utils.js';
import { createShortcutDefaults } from '../../shared/validators.js';

export function renderQuickAdd(container, { tab, onSaved }) {
  container.innerHTML = `
    <div class="ksm-quick-add" id="ksm-quick-add">
      <div class="ksm-quick-add-title">+ New Shortcut</div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">Name</label>
        <input class="ksm-form-input" id="qa-name" type="text" placeholder="e.g. Open Gmail" autocomplete="off"/>
      </div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">Key combination</label>
        <div class="ksm-key-recorder" id="qa-key-recorder" tabindex="0">Click to record…</div>
      </div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">URL to open</label>
        <input class="ksm-form-input" id="qa-url" type="url" placeholder="https://…"/>
      </div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">Scope</label>
        <select class="ksm-form-select" id="qa-scope">
          <option value="global">Global (everywhere)</option>
          <option value="site">This site only</option>
        </select>
      </div>

      <div id="qa-conflict" style="display:none;font-size:11px;padding:6px 10px;border-radius:4px;margin-bottom:8px;"></div>

      <div style="display:flex;gap:8px;">
        <button class="ksm-btn ksm-btn-secondary" id="qa-cancel" style="flex:none;padding:7px 14px;">Cancel</button>
        <button class="ksm-btn ksm-btn-primary" id="qa-save">Save shortcut</button>
      </div>
    </div>
  `;

  let recordedCombo = null;
  const recorder = container.querySelector('#qa-key-recorder');
  const conflictEl = container.querySelector('#qa-conflict');

  // Key recording
  recorder.addEventListener('click', () => startRecording(recorder));
  recorder.addEventListener('keydown', (e) => {
    if (!recorder.classList.contains('recording')) return;
    e.preventDefault();
    e.stopPropagation();
    const combo = normalizeCombo(e);
    if (!combo) return;
    recordedCombo = combo;
    recorder.textContent = combo;
    recorder.classList.remove('recording');
    checkConflict(combo);
  });

  container.querySelector('#qa-cancel').addEventListener('click', () => {
    container.querySelector('#ksm-quick-add').classList.remove('open');
  });

  container.querySelector('#qa-save').addEventListener('click', () => saveShortcut({ tab, onSaved, container, recordedCombo }));
}

function startRecording(recorder) {
  recorder.classList.add('recording');
  recorder.textContent = 'Press keys…';
  recorder.focus();
}

async function checkConflict(combo) {
  // Simple client-side check against known browser shortcuts
  const { BROWSER_RESERVED_SHORTCUTS, BROWSER_COMMON_SHORTCUTS } = await import('../../shared/constants.js');
  const el = document.getElementById('qa-conflict');
  if (!el) return;

  if (BROWSER_RESERVED_SHORTCUTS.has(combo)) {
    el.style.display = 'block';
    el.style.background = '#FEF2F2';
    el.style.color = '#EF4444';
    el.textContent = `⚠ "${combo}" is reserved by the browser.`;
  } else if (BROWSER_COMMON_SHORTCUTS.has(combo)) {
    el.style.display = 'block';
    el.style.background = '#FFFBEB';
    el.style.color = '#D97706';
    el.textContent = `⚠ "${combo}" is a common browser shortcut and will be overridden.`;
  } else {
    el.style.display = 'none';
  }
}

async function saveShortcut({ tab, onSaved, container, recordedCombo }) {
  const name = container.querySelector('#qa-name').value.trim();
  const url = container.querySelector('#qa-url').value.trim();
  const scopeType = container.querySelector('#qa-scope').value;

  if (!name) { alert('Please enter a name.'); return; }
  if (!recordedCombo) { alert('Please record a key combination.'); return; }
  if (!url) { alert('Please enter a URL.'); return; }

  const hostname = tab?.url ? new URL(tab.url).hostname : null;
  const def = createShortcutDefaults({
    name,
    trigger: { type: 'combo', keys: recordedCombo.split('+'), leaderKey: null, leaderTimeout: 1500, abbreviation: null },
    scope: {
      type: scopeType,
      urlPattern: scopeType === 'site' && hostname ? `*://${hostname}/*` : null,
      urlPatternType: 'glob',
    },
    action: { type: 'url', url, urlTarget: 'new_tab' },
  });

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.CREATE_SHORTCUT,
    payload: { shortcut: def },
  });

  if (response?.success) {
    container.querySelector('#ksm-quick-add').classList.remove('open');
    if (onSaved) onSaved(response.shortcut);
  } else {
    alert(`Error: ${response?.errors?.join(', ') || 'Failed to save'}`);
  }
}

export function openQuickAdd(container) {
  const el = container.querySelector('#ksm-quick-add');
  if (el) el.classList.add('open');
}
