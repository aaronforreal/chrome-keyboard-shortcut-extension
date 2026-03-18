import { MESSAGE_TYPES } from '../../shared/constants.js';
import { generateId } from '../../shared/validators.js';

const STEP_TYPES = [
  { value: 'navigate', label: 'Navigate to URL' },
  { value: 'click', label: 'Click element' },
  { value: 'fill', label: 'Fill input' },
  { value: 'wait', label: 'Wait (delay)' },
  { value: 'script', label: 'Run script' },
  { value: 'copy', label: 'Copy to clipboard' },
  { value: 'keyboard', label: 'Press key' },
];

export class MacroBuilder {
  constructor(container, { macro = null, onSaved, onCancel }) {
    this.container = container;
    this.macro = macro || {
      id: generateId('mc'),
      name: '',
      steps: [],
      onError: 'stop',
    };
    this.isEdit = !!macro;
    this.onSaved = onSaved;
    this.onCancel = onCancel;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-card">
        <div class="ksm-card-title">
          <span>${this.isEdit ? 'Edit macro' : 'New macro'}</span>
          <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="mb-cancel">Cancel</button>
        </div>

        <div class="ksm-form-group">
          <label class="ksm-form-label">Macro name</label>
          <input class="ksm-form-input" id="mb-name" type="text" placeholder="e.g. Submit form" value="${esc(this.macro.name)}"/>
        </div>

        <div class="ksm-form-group">
          <label class="ksm-form-label">On error</label>
          <select class="ksm-form-select" id="mb-on-error" style="width:200px;">
            <option value="stop" ${this.macro.onError === 'stop' ? 'selected' : ''}>Stop</option>
            <option value="continue" ${this.macro.onError === 'continue' ? 'selected' : ''}>Continue</option>
            <option value="revert" ${this.macro.onError === 'revert' ? 'selected' : ''}>Revert (undo done steps)</option>
          </select>
        </div>

        <div style="margin-top:20px;">
          <div class="ksm-flex-between ksm-mb-2">
            <strong style="font-size:13px;">Steps</strong>
            <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="mb-add-step">+ Add step</button>
          </div>
          <div id="mb-steps-list"></div>
        </div>

        <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end;">
          <button class="ksm-btn ksm-btn-secondary" id="mb-cancel2">Cancel</button>
          <button class="ksm-btn ksm-btn-primary" id="mb-save">Save macro</button>
        </div>
      </div>
    `;

    this.container.querySelector('#mb-cancel').addEventListener('click', () => this.onCancel?.());
    this.container.querySelector('#mb-cancel2').addEventListener('click', () => this.onCancel?.());
    this.container.querySelector('#mb-name').addEventListener('input', e => { this.macro.name = e.target.value; });
    this.container.querySelector('#mb-on-error').addEventListener('change', e => { this.macro.onError = e.target.value; });
    this.container.querySelector('#mb-add-step').addEventListener('click', () => this._addStep());
    this.container.querySelector('#mb-save').addEventListener('click', () => this._save());

    this._renderSteps();
  }

  _addStep() {
    this.macro.steps.push({
      id: generateId('st'),
      type: 'navigate',
      delay: 0,
      selector: null,
      value: null,
      script: null,
      url: null,
      undoable: true,
    });
    this._renderSteps();
  }

  _renderSteps() {
    const list = this.container.querySelector('#mb-steps-list');
    if (this.macro.steps.length === 0) {
      list.innerHTML = `<div class="ksm-empty" style="padding:24px;"><div class="ksm-empty-sub">No steps yet. Click "Add step" to begin.</div></div>`;
      return;
    }

    list.innerHTML = this.macro.steps.map((step, i) => `
      <div class="ksm-macro-step" data-step="${i}">
        <div class="ksm-macro-step-num">${i + 1}</div>
        <div class="ksm-macro-step-body">
          <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
            <select class="ksm-form-select" data-step-type="${i}" style="flex:1;min-width:160px;">
              ${STEP_TYPES.map(t => `<option value="${t.value}" ${step.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:11px;color:var(--ksm-text-muted);">Delay:</span>
              <input type="number" class="ksm-form-input" data-step-delay="${i}" value="${step.delay || 0}" min="0" max="30000" style="width:80px;" placeholder="ms"/>
              <span style="font-size:11px;color:var(--ksm-text-muted);">ms</span>
            </div>
          </div>
          ${this._renderStepFields(step, i)}
        </div>
        <div class="ksm-macro-step-actions">
          ${i > 0 ? `<button class="ksm-btn-icon" data-step-up="${i}" title="Move up">↑</button>` : ''}
          ${i < this.macro.steps.length - 1 ? `<button class="ksm-btn-icon" data-step-down="${i}" title="Move down">↓</button>` : ''}
          <button class="ksm-btn-icon" data-step-del="${i}" style="color:var(--ksm-red);" title="Remove">✕</button>
        </div>
      </div>
    `).join('');

    // Bind step type changes
    list.querySelectorAll('[data-step-type]').forEach(sel => {
      sel.addEventListener('change', e => {
        const i = +sel.dataset.stepType;
        this.macro.steps[i].type = e.target.value;
        this._renderSteps();
      });
    });

    // Bind delay
    list.querySelectorAll('[data-step-delay]').forEach(inp => {
      inp.addEventListener('input', e => {
        this.macro.steps[+inp.dataset.stepDelay].delay = parseInt(e.target.value) || 0;
      });
    });

    // Bind step fields
    list.querySelectorAll('[data-step-url]').forEach(inp => {
      inp.addEventListener('input', e => { this.macro.steps[+inp.dataset.stepUrl].url = e.target.value; });
    });
    list.querySelectorAll('[data-step-sel]').forEach(inp => {
      inp.addEventListener('input', e => { this.macro.steps[+inp.dataset.stepSel].selector = e.target.value; });
    });
    list.querySelectorAll('[data-step-val]').forEach(inp => {
      inp.addEventListener('input', e => { this.macro.steps[+inp.dataset.stepVal].value = e.target.value; });
    });
    list.querySelectorAll('[data-step-script]').forEach(ta => {
      ta.addEventListener('input', e => { this.macro.steps[+ta.dataset.stepScript].script = e.target.value; });
    });

    // Move up/down/delete
    list.querySelectorAll('[data-step-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.stepUp;
        [this.macro.steps[i-1], this.macro.steps[i]] = [this.macro.steps[i], this.macro.steps[i-1]];
        this._renderSteps();
      });
    });
    list.querySelectorAll('[data-step-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.stepDown;
        [this.macro.steps[i], this.macro.steps[i+1]] = [this.macro.steps[i+1], this.macro.steps[i]];
        this._renderSteps();
      });
    });
    list.querySelectorAll('[data-step-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.macro.steps.splice(+btn.dataset.stepDel, 1);
        this._renderSteps();
      });
    });
  }

  _renderStepFields(step, i) {
    switch (step.type) {
      case 'navigate':
        return `<input class="ksm-form-input" data-step-url="${i}" type="url" placeholder="https://…" value="${esc(step.url || '')}"/>`;
      case 'click':
        return `<input class="ksm-form-input" data-step-sel="${i}" type="text" placeholder="CSS selector" value="${esc(step.selector || '')}"/>`;
      case 'fill':
        return `
          <div style="display:flex;gap:8px;">
            <input class="ksm-form-input" data-step-sel="${i}" type="text" placeholder="CSS selector" value="${esc(step.selector || '')}" style="flex:1;"/>
            <input class="ksm-form-input" data-step-val="${i}" type="text" placeholder="Value" value="${esc(step.value || '')}" style="flex:1;"/>
          </div>`;
      case 'wait':
        return `<div class="ksm-text-sm ksm-text-muted">Waits for the delay above before executing the next step.</div>`;
      case 'script':
        return `<textarea class="ksm-form-textarea" data-step-script="${i}" style="min-height:60px;" placeholder="// JavaScript to run">${esc(step.script || '')}</textarea>`;
      case 'copy':
        return `<input class="ksm-form-input" data-step-sel="${i}" type="text" placeholder="CSS selector (or leave blank for page selection)" value="${esc(step.selector || '')}"/>`;
      case 'keyboard':
        return `<input class="ksm-form-input" data-step-val="${i}" type="text" placeholder="Key combo, e.g. ctrl+a" value="${esc(step.value || '')}"/>`;
      default:
        return '';
    }
  }

  async _save() {
    if (!this.macro.name.trim()) { alert('Please enter a macro name.'); return; }
    if (this.macro.steps.length === 0) { alert('Please add at least one step.'); return; }

    const msgType = this.isEdit ? MESSAGE_TYPES.UPDATE_MACRO : MESSAGE_TYPES.CREATE_MACRO;
    const res = await chrome.runtime.sendMessage({ type: msgType, payload: { macro: this.macro } });

    if (res?.success) {
      this.onSaved?.(res.macro || this.macro);
    } else {
      alert('Failed to save macro.');
    }
  }
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
