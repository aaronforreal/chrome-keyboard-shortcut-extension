import { MESSAGE_TYPES, TRIGGER_TYPES, SCOPE_TYPES } from '../../shared/constants.js';
import { createShortcutDefaults } from '../../shared/validators.js';
import { KeyRecorder } from './key-recorder.js';
import { ActionBuilder } from './action-builder.js';

const STEPS = ['Trigger', 'Scope', 'Action', 'Conditions', 'Review'];

/**
 * Multi-step shortcut creation/edit wizard.
 */
export class ShortcutEditor {
  constructor(container, { shortcut = null, onSaved, onCancel }) {
    this.container = container;
    this.isEdit = !!shortcut;
    this.def = shortcut ? { ...shortcut } : createShortcutDefaults();
    this.onSaved = onSaved;
    this.onCancel = onCancel;
    this.step = 0;
    this._keyRecorder = null;
    this._actionBuilder = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-card">
        <div class="ksm-card-title">
          <span>${this.isEdit ? 'Edit shortcut' : 'New shortcut'}</span>
          <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="se-cancel">Cancel</button>
        </div>

        <div class="ksm-steps" id="se-steps"></div>
        <div id="se-step-content"></div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button class="ksm-btn ksm-btn-secondary" id="se-prev" style="visibility:hidden;">← Back</button>
          <button class="ksm-btn ksm-btn-primary" id="se-next">Next →</button>
        </div>
      </div>
    `;

    this.container.querySelector('#se-cancel').addEventListener('click', () => {
      if (this.onCancel) this.onCancel();
    });

    this._prevBtn = this.container.querySelector('#se-prev');
    this._nextBtn = this.container.querySelector('#se-next');

    this._prevBtn.addEventListener('click', () => this._goStep(this.step - 1));
    this._nextBtn.addEventListener('click', () => this._goStep(this.step + 1));

    this._renderStepIndicator();
    this._renderStep();
  }

  _renderStepIndicator() {
    const el = this.container.querySelector('#se-steps');
    el.innerHTML = STEPS.map((label, i) => `
      ${i > 0 ? '<div class="ksm-step-connector"></div>' : ''}
      <div class="ksm-step ${i === this.step ? 'active' : i < this.step ? 'completed' : ''}">
        <div class="ksm-step-dot">${i < this.step ? '✓' : i + 1}</div>
        <div class="ksm-step-label">${label}</div>
      </div>
    `).join('');
  }

  _renderStep() {
    const content = this.container.querySelector('#se-step-content');
    content.innerHTML = '';

    this._prevBtn.style.visibility = this.step > 0 ? 'visible' : 'hidden';
    this._nextBtn.textContent = this.step === STEPS.length - 1 ? (this.isEdit ? '💾 Save changes' : '✓ Create shortcut') : 'Next →';

    switch (this.step) {
      case 0: this._renderTriggerStep(content); break;
      case 1: this._renderScopeStep(content); break;
      case 2: this._renderActionStep(content); break;
      case 3: this._renderConditionsStep(content); break;
      case 4: this._renderReviewStep(content); break;
    }
  }

  _renderTriggerStep(el) {
    const t = this.def.trigger;
    el.innerHTML = `
      <div class="ksm-form-group">
        <label class="ksm-form-label">Shortcut name</label>
        <input class="ksm-form-input" id="se-name" type="text" placeholder="e.g. Open Gmail" value="${esc(this.def.name)}"/>
      </div>
      <div class="ksm-form-group">
        <label class="ksm-form-label">Description (optional)</label>
        <input class="ksm-form-input" id="se-desc" type="text" placeholder="What this shortcut does" value="${esc(this.def.description || '')}"/>
      </div>
      <div class="ksm-form-group">
        <label class="ksm-form-label">Trigger type</label>
        <select class="ksm-form-select" id="se-trigger-type">
          <option value="combo" ${t.type === 'combo' ? 'selected' : ''}>Key combination (e.g. Ctrl+Shift+G)</option>
          <option value="leader_sequence" ${t.type === 'leader_sequence' ? 'selected' : ''}>Leader sequence (e.g. Space → G)</option>
          <option value="text_expansion" ${t.type === 'text_expansion' ? 'selected' : ''}>Text abbreviation (type to expand)</option>
        </select>
      </div>
      <div id="se-trigger-fields"></div>
    `;

    el.querySelector('#se-name').addEventListener('input', e => { this.def.name = e.target.value; });
    el.querySelector('#se-desc').addEventListener('input', e => { this.def.description = e.target.value; });
    el.querySelector('#se-trigger-type').addEventListener('change', e => {
      this.def.trigger.type = e.target.value;
      this._renderTriggerFields(el.querySelector('#se-trigger-fields'));
    });

    this._renderTriggerFields(el.querySelector('#se-trigger-fields'));
  }

  _renderTriggerFields(el) {
    const t = this.def.trigger;
    el.innerHTML = '';

    if (t.type === TRIGGER_TYPES.TEXT_EXPANSION) {
      el.innerHTML = `
        <div class="ksm-form-group">
          <label class="ksm-form-label">Abbreviation</label>
          <input class="ksm-form-input" id="se-abbr" type="text" placeholder="@@home, :smile:, /sig" value="${esc(t.abbreviation || '')}"/>
          <div class="ksm-form-hint">Type this text in any input to trigger the expansion.</div>
        </div>
      `;
      el.querySelector('#se-abbr').addEventListener('input', e => { this.def.trigger.abbreviation = e.target.value; });
      return;
    }

    // Combo or leader sequence
    const recorderWrap = document.createElement('div');
    recorderWrap.className = 'ksm-form-group';
    recorderWrap.innerHTML = `<label class="ksm-form-label">Key combination</label><div id="se-key-recorder-target"></div>`;
    el.appendChild(recorderWrap);

    const recorderTarget = recorderWrap.querySelector('#se-key-recorder-target');
    const currentCombo = this.def.trigger.keys?.join('+') || '';

    this._keyRecorder = new KeyRecorder(recorderTarget, {
      value: currentCombo,
      scope: this.def.scope,
      excludeId: this.isEdit ? this.def.id : null,
      onChange: (combo) => {
        this.def.trigger.keys = combo.split('+');
      },
    });

    if (t.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
      const leaderWrap = document.createElement('div');
      leaderWrap.className = 'ksm-form-group';
      leaderWrap.innerHTML = `
        <label class="ksm-form-label">Leader key</label>
        <input class="ksm-form-input" id="se-leader" type="text" placeholder="space" value="${esc(t.leaderKey || 'space')}"/>
        <div class="ksm-form-hint">Press the leader key first, then your combo within ${t.leaderTimeout || 1500}ms.</div>
      `;
      el.appendChild(leaderWrap);
      leaderWrap.querySelector('#se-leader').addEventListener('input', e => { this.def.trigger.leaderKey = e.target.value; });
    }
  }

  _renderScopeStep(el) {
    const s = this.def.scope;
    el.innerHTML = `
      <div class="ksm-form-group">
        <label class="ksm-form-label">Where does this shortcut work?</label>
        <select class="ksm-form-select" id="se-scope-type">
          <option value="global" ${s.type === 'global' ? 'selected' : ''}>Global — works on every website</option>
          <option value="site" ${s.type === 'site' ? 'selected' : ''}>Site-specific — only on matching URLs</option>
          <option value="page" ${s.type === 'page' ? 'selected' : ''}>Page-specific — only on this exact page</option>
        </select>
      </div>
      <div id="se-scope-pattern" ${s.type === 'global' ? 'style="display:none;"' : ''}>
        <div class="ksm-form-group">
          <label class="ksm-form-label">URL pattern</label>
          <input class="ksm-form-input" id="se-url-pattern" type="text" placeholder="*://mail.google.com/*" value="${esc(s.urlPattern || '')}"/>
          <div class="ksm-form-hint">Use <code>*</code> as a wildcard. Example: <code>*://github.com/*</code></div>
        </div>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Pattern type</label>
          <select class="ksm-form-select" id="se-pattern-type">
            <option value="glob" ${s.urlPatternType !== 'regex' ? 'selected' : ''}>Glob (simple wildcards)</option>
            <option value="regex" ${s.urlPatternType === 'regex' ? 'selected' : ''}>Regular expression</option>
          </select>
        </div>
      </div>
    `;

    el.querySelector('#se-scope-type').addEventListener('change', e => {
      this.def.scope.type = e.target.value;
      el.querySelector('#se-scope-pattern').style.display = e.target.value === 'global' ? 'none' : 'block';
    });

    el.querySelector('#se-url-pattern').addEventListener('input', e => { this.def.scope.urlPattern = e.target.value; });
    el.querySelector('#se-pattern-type').addEventListener('change', e => { this.def.scope.urlPatternType = e.target.value; });
  }

  _renderActionStep(el) {
    const wrap = document.createElement('div');
    el.appendChild(wrap);
    this._actionBuilder = new ActionBuilder(wrap, {
      action: this.def.action,
      onChange: (action) => { this.def.action = action; },
    });
  }

  _renderConditionsStep(el) {
    el.innerHTML = `
      <p class="ksm-text-muted ksm-text-sm" style="margin-bottom:12px;">Conditions are optional. When set, ALL conditions must be true for the shortcut to fire.</p>
      <div id="se-conditions-list"></div>
      <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="se-add-condition" style="margin-top:8px;">+ Add condition</button>
    `;

    const listEl = el.querySelector('#se-conditions-list');
    const renderConditions = () => {
      listEl.innerHTML = this.def.conditions.map((c, i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <select class="ksm-form-select" style="width:180px;" data-cond-type="${i}">
            <option value="url_contains" ${c.type === 'url_contains' ? 'selected' : ''}>URL contains</option>
            <option value="url_matches" ${c.type === 'url_matches' ? 'selected' : ''}>URL matches (regex)</option>
            <option value="element_exists" ${c.type === 'element_exists' ? 'selected' : ''}>Element exists</option>
            <option value="element_not_exists" ${c.type === 'element_not_exists' ? 'selected' : ''}>Element not exists</option>
          </select>
          <input class="ksm-form-input" placeholder="Value" value="${esc(c.value || '')}" data-cond-val="${i}" style="flex:1;"/>
          <button class="ksm-btn-icon" data-cond-del="${i}" style="color:var(--ksm-red);">✕</button>
        </div>
      `).join('');

      listEl.querySelectorAll('[data-cond-type]').forEach(sel => {
        sel.addEventListener('change', e => { this.def.conditions[+sel.dataset.condType].type = e.target.value; });
      });
      listEl.querySelectorAll('[data-cond-val]').forEach(inp => {
        inp.addEventListener('input', e => { this.def.conditions[+inp.dataset.condVal].value = e.target.value; });
      });
      listEl.querySelectorAll('[data-cond-del]').forEach(btn => {
        btn.addEventListener('click', () => { this.def.conditions.splice(+btn.dataset.condDel, 1); renderConditions(); });
      });
    };

    el.querySelector('#se-add-condition').addEventListener('click', () => {
      this.def.conditions.push({ type: 'url_contains', value: '', operator: 'is' });
      renderConditions();
    });

    renderConditions();
  }

  _renderReviewStep(el) {
    const t = this.def.trigger;
    const s = this.def.scope;
    const a = this.def.action;
    const combo = t.keys?.join('+') || t.abbreviation || '—';

    el.innerHTML = `
      <div class="ksm-card" style="margin-bottom:0;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);width:120px;">Name</td><td style="font-weight:500;">${esc(this.def.name || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Trigger</td><td><kbd class="ksm-kbd">${esc(combo)}</kbd> (${esc(t.type)})</td></tr>
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Scope</td><td>${esc(s.type)}${s.urlPattern ? ` — ${esc(s.urlPattern)}` : ''}</td></tr>
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Action</td><td>${esc(a.type)}${a.url ? ` → ${esc(a.url)}` : ''}</td></tr>
          ${this.def.conditions.length > 0 ? `<tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Conditions</td><td>${this.def.conditions.length} condition(s)</td></tr>` : ''}
        </table>
      </div>
      <div id="se-review-error" style="display:none;" class="ksm-conflict ksm-conflict-error ksm-mt-4"></div>
    `;
  }

  async _goStep(next) {
    if (!this._validateCurrentStep()) return;

    if (next >= STEPS.length) {
      await this._save();
      return;
    }

    this.step = Math.max(0, Math.min(STEPS.length - 1, next));
    this._renderStepIndicator();
    this._renderStep();
  }

  _validateCurrentStep() {
    if (this.step === 0) {
      if (!this.def.name?.trim()) {
        alert('Please enter a name for this shortcut.');
        return false;
      }
      const t = this.def.trigger;
      if (t.type !== TRIGGER_TYPES.TEXT_EXPANSION && (!t.keys || t.keys.length === 0)) {
        alert('Please record a key combination.');
        return false;
      }
      if (t.type === TRIGGER_TYPES.TEXT_EXPANSION && !t.abbreviation?.trim()) {
        alert('Please enter an abbreviation.');
        return false;
      }
    }
    if (this.step === 1) {
      const s = this.def.scope;
      if (s.type !== SCOPE_TYPES.GLOBAL && !s.urlPattern?.trim()) {
        alert('Please enter a URL pattern for the scope.');
        return false;
      }
    }
    return true;
  }

  async _save() {
    const msgType = this.isEdit ? MESSAGE_TYPES.UPDATE_SHORTCUT : MESSAGE_TYPES.CREATE_SHORTCUT;
    const response = await chrome.runtime.sendMessage({
      type: msgType,
      payload: { shortcut: this.def },
    });

    if (response?.success) {
      if (this.onSaved) this.onSaved(response.shortcut || this.def);
    } else {
      const errEl = this.container.querySelector('#se-review-error');
      if (errEl) {
        errEl.style.display = 'flex';
        errEl.textContent = `Error: ${response?.errors?.join(', ') || 'Failed to save'}`;
      }
    }
  }
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
