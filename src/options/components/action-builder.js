import { ACTION_TYPES } from '../../shared/constants.js';

/**
 * Action builder component.
 * Renders a form for configuring an action based on its type.
 * Calls onChange(action) whenever values change.
 */
export class ActionBuilder {
  constructor(container, { action = {}, onChange }) {
    this.container = container;
    this.action = { type: ACTION_TYPES.URL, url: '', urlTarget: 'new_tab', ...action };
    this.onChange = onChange;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-form-group">
        <label class="ksm-form-label">Action type</label>
        <select class="ksm-form-select" id="ab-type">
          <option value="url">Open URL</option>
          <option value="scroll">Scroll page</option>
          <option value="click">Click element</option>
          <option value="fill">Fill input</option>
          <option value="navigate">Navigate (back/forward/reload)</option>
          <option value="text_expand">Text expansion</option>
          <option value="clipboard">Clipboard action</option>
          <option value="script">Run JavaScript</option>
          <option value="macro">Run macro</option>
        </select>
      </div>
      <div id="ab-fields"></div>
    `;

    this._typeSelect = this.container.querySelector('#ab-type');
    this._fields = this.container.querySelector('#ab-fields');

    this._typeSelect.value = this.action.type;
    this._typeSelect.addEventListener('change', () => {
      this.action = { ...this.action, type: this._typeSelect.value };
      this._renderFields();
      this._emit();
    });

    this._renderFields();
  }

  _renderFields() {
    const type = this._typeSelect.value;
    const a = this.action;

    switch (type) {
      case ACTION_TYPES.URL:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">URL</label>
            <input class="ksm-form-input" id="ab-url" type="url" placeholder="https://…" value="${esc(a.url || '')}"/>
          </div>
          <div class="ksm-form-group">
            <label class="ksm-form-label">Open in</label>
            <select class="ksm-form-select" id="ab-url-target">
              <option value="new_tab" ${a.urlTarget === 'new_tab' ? 'selected' : ''}>New tab</option>
              <option value="current" ${a.urlTarget === 'current' ? 'selected' : ''}>Current tab</option>
              <option value="new_window" ${a.urlTarget === 'new_window' ? 'selected' : ''}>New window</option>
            </select>
          </div>
        `;
        this._bind('ab-url', 'input', v => { this.action.url = v; });
        this._bind('ab-url-target', 'change', v => { this.action.urlTarget = v; });
        break;

      case ACTION_TYPES.SCROLL:
        this._fields.innerHTML = `
          <div class="ksm-form-row">
            <div class="ksm-form-group">
              <label class="ksm-form-label">Direction</label>
              <select class="ksm-form-select" id="ab-scroll-dir">
                <option value="down" ${a.scrollDirection === 'down' ? 'selected' : ''}>Down</option>
                <option value="up" ${a.scrollDirection === 'up' ? 'selected' : ''}>Up</option>
                <option value="top" ${a.scrollDirection === 'top' ? 'selected' : ''}>To top</option>
                <option value="bottom" ${a.scrollDirection === 'bottom' ? 'selected' : ''}>To bottom</option>
              </select>
            </div>
            <div class="ksm-form-group">
              <label class="ksm-form-label">Amount (px)</label>
              <input class="ksm-form-input" id="ab-scroll-amount" type="number" value="${a.scrollAmount || 300}" min="50" max="3000"/>
            </div>
          </div>
        `;
        this._bind('ab-scroll-dir', 'change', v => { this.action.scrollDirection = v; });
        this._bind('ab-scroll-amount', 'input', v => { this.action.scrollAmount = parseInt(v) || 300; });
        break;

      case ACTION_TYPES.CLICK:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">CSS selector</label>
            <input class="ksm-form-input" id="ab-click-sel" type="text" placeholder="#submit-btn, .nav-link" value="${esc(a.clickSelector || '')}"/>
            <div class="ksm-form-hint">The element to click. Use browser DevTools to find the selector.</div>
          </div>
        `;
        this._bind('ab-click-sel', 'input', v => { this.action.clickSelector = v; });
        break;

      case ACTION_TYPES.FILL:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Input selector</label>
            <input class="ksm-form-input" id="ab-fill-sel" type="text" placeholder="#search-input" value="${esc(a.fillSelector || '')}"/>
          </div>
          <div class="ksm-form-group">
            <label class="ksm-form-label">Value to fill</label>
            <input class="ksm-form-input" id="ab-fill-val" type="text" placeholder="Value to type into the field" value="${esc(a.fillValue || '')}"/>
          </div>
        `;
        this._bind('ab-fill-sel', 'input', v => { this.action.fillSelector = v; });
        this._bind('ab-fill-val', 'input', v => { this.action.fillValue = v; });
        break;

      case ACTION_TYPES.NAVIGATE:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Direction</label>
            <select class="ksm-form-select" id="ab-nav-dir">
              <option value="back" ${a.navigateDirection === 'back' ? 'selected' : ''}>Go back</option>
              <option value="forward" ${a.navigateDirection === 'forward' ? 'selected' : ''}>Go forward</option>
              <option value="reload" ${a.navigateDirection === 'reload' ? 'selected' : ''}>Reload page</option>
            </select>
          </div>
        `;
        this._bind('ab-nav-dir', 'change', v => { this.action.navigateDirection = v; });
        break;

      case ACTION_TYPES.TEXT_EXPAND:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Expansion text</label>
            <textarea class="ksm-form-textarea" id="ab-expand-text" placeholder="Text to insert when the abbreviation is typed…" style="min-height:80px;">${esc(a.textExpansion || '')}</textarea>
          </div>
        `;
        this._bind('ab-expand-text', 'input', v => { this.action.textExpansion = v; });
        break;

      case ACTION_TYPES.CLIPBOARD:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Clipboard action</label>
            <select class="ksm-form-select" id="ab-clip-action">
              <option value="copy" ${a.clipboardAction === 'copy' ? 'selected' : ''}>Copy text</option>
              <option value="paste" ${a.clipboardAction === 'paste' ? 'selected' : ''}>Paste at cursor</option>
            </select>
          </div>
          <div class="ksm-form-group" id="ab-clip-sel-wrap">
            <label class="ksm-form-label">Source selector (optional)</label>
            <input class="ksm-form-input" id="ab-clip-sel" type="text" placeholder="CSS selector — leave blank for selection" value="${esc(a.clipboardSelector || '')}"/>
          </div>
          <div class="ksm-form-group" id="ab-clip-transform-wrap">
            <label class="ksm-form-label">Transform (optional JS expression)</label>
            <input class="ksm-form-input" id="ab-clip-transform" type="text" placeholder="text.toUpperCase()" value="${esc(a.clipboardTransform || '')}"/>
          </div>
        `;
        this._bind('ab-clip-action', 'change', v => { this.action.clipboardAction = v; });
        this._bind('ab-clip-sel', 'input', v => { this.action.clipboardSelector = v; });
        this._bind('ab-clip-transform', 'input', v => { this.action.clipboardTransform = v; });
        break;

      case ACTION_TYPES.SCRIPT:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">JavaScript</label>
            <textarea class="ksm-form-textarea" id="ab-script" placeholder="// ksm helper API available:\n// ksm.click(selector)\n// ksm.fill(selector, value)\n// ksm.navigate(url)\n// ksm.copy(text)\n// ksm.scroll(px)">${esc(a.script || '')}</textarea>
            <div class="ksm-form-hint">Runs in the page context. Use the <code>ksm</code> helper for safe DOM access.</div>
          </div>
        `;
        this._bind('ab-script', 'input', v => { this.action.script = v; });
        break;

      case ACTION_TYPES.MACRO:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Macro</label>
            <select class="ksm-form-select" id="ab-macro-id">
              <option value="">Loading macros…</option>
            </select>
            <div class="ksm-form-hint">Create macros in the Macros tab first.</div>
          </div>
        `;
        this._loadMacros();
        break;

      default:
        this._fields.innerHTML = '';
    }
  }

  _bind(id, event, setter) {
    const el = this._fields.querySelector(`#${id}`);
    if (!el) return;
    el.addEventListener(event, () => { setter(el.value); this._emit(); });
  }

  _emit() {
    if (this.onChange) this.onChange({ ...this.action });
  }

  async _loadMacros() {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_MACROS' });
      const macros = res?.macros || [];
      const sel = this._fields.querySelector('#ab-macro-id');
      if (!sel) return;
      sel.innerHTML = macros.length === 0
        ? '<option value="">No macros yet — create one in the Macros tab</option>'
        : macros.map(m => `<option value="${m.id}" ${this.action.macroId === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('');
      sel.addEventListener('change', () => { this.action.macroId = sel.value; this._emit(); });
    } catch {}
  }

  getValue() { return { ...this.action }; }
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
