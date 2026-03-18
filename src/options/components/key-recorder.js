import { normalizeCombo } from '../../shared/key-utils.js';
import { MESSAGE_TYPES, BROWSER_RESERVED_SHORTCUTS, BROWSER_COMMON_SHORTCUTS } from '../../shared/constants.js';
import { CONFLICT_TIERS } from '../../shared/constants.js';

/**
 * Key recorder component.
 * Renders a capture zone and emits onChange(combo, conflictResult).
 */
export class KeyRecorder {
  constructor(container, { value = '', scope = null, excludeId = null, onChange }) {
    this.container = container;
    this.value = value;
    this.scope = scope;
    this.excludeId = excludeId;
    this.onChange = onChange;
    this.recording = false;
    this._handler = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-key-recorder-box ${this.value ? 'has-value' : ''}" tabindex="0">
        ${this.value ? `<strong>${this.value}</strong>` : 'Click to record key combination…'}
      </div>
      <div id="ksm-kr-conflict" style="display:none;" class="ksm-conflict"></div>
      <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;" id="ksm-kr-suggestions"></div>
    `;

    this._box = this.container.querySelector('.ksm-key-recorder-box');
    this._conflictEl = this.container.querySelector('#ksm-kr-conflict');
    this._suggestEl = this.container.querySelector('#ksm-kr-suggestions');

    this._box.addEventListener('click', () => this.startRecording());
    this._box.addEventListener('keydown', (e) => this._onKeyDown(e));
    this._box.addEventListener('blur', () => this.stopRecording());
  }

  startRecording() {
    this.recording = true;
    this._box.classList.add('recording');
    this._box.classList.remove('has-value');
    this._box.innerHTML = '<em>Listening… press your key combination</em>';
    this._box.focus();

    // Disable extension key capture on this tab
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DISABLE_KEY_CAPTURE }).catch(() => {});
  }

  stopRecording() {
    if (!this.recording) return;
    this.recording = false;
    this._box.classList.remove('recording');
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.ENABLE_KEY_CAPTURE }).catch(() => {});
  }

  _onKeyDown(e) {
    if (!this.recording) return;
    e.preventDefault();
    e.stopPropagation();

    // Skip modifier-only
    if (['Control', 'Alt', 'Shift', 'Meta', 'OS'].includes(e.key)) return;

    const combo = normalizeCombo(e);
    if (!combo) return;

    this.value = combo;
    this._box.classList.remove('recording');
    this._box.classList.add('has-value');
    this._box.innerHTML = `<strong>${combo}</strong>`;
    this.recording = false;
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.ENABLE_KEY_CAPTURE }).catch(() => {});

    this._checkConflict(combo);
  }

  async _checkConflict(combo) {
    this._conflictEl.style.display = 'none';
    this._suggestEl.innerHTML = '';

    let result;

    if (BROWSER_RESERVED_SHORTCUTS.has(combo.toLowerCase())) {
      result = { tier: CONFLICT_TIERS.BROWSER_RESERVED, message: `"${combo}" is reserved by the browser and cannot be overridden.`, canOverride: false };
    } else if (BROWSER_COMMON_SHORTCUTS.has(combo.toLowerCase())) {
      result = { tier: CONFLICT_TIERS.BROWSER_COMMON, message: `"${combo}" is a common browser shortcut and will be overridden by this extension.`, canOverride: true };
    } else {
      // Check against custom shortcuts
      try {
        const res = await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.CHECK_SINGLE_CONFLICT,
          payload: { combo, scope: this.scope, excludeId: this.excludeId },
        });
        result = res?.result || { tier: CONFLICT_TIERS.NONE, canOverride: true };
      } catch {
        result = { tier: CONFLICT_TIERS.NONE, canOverride: true };
      }
    }

    this._renderConflict(result);
    if (this.onChange) this.onChange(combo, result);
  }

  _renderConflict(result) {
    const el = this._conflictEl;
    if (result.tier === CONFLICT_TIERS.NONE) {
      el.className = 'ksm-conflict ksm-conflict-ok';
      el.innerHTML = '✓ No conflicts detected';
      el.style.display = 'flex';
      return;
    }
    if (result.tier === CONFLICT_TIERS.BROWSER_RESERVED) {
      el.className = 'ksm-conflict ksm-conflict-error';
      el.innerHTML = `⛔ ${result.message}`;
      el.style.display = 'flex';
      return;
    }
    if (result.tier === CONFLICT_TIERS.BROWSER_COMMON) {
      el.className = 'ksm-conflict ksm-conflict-warn';
      el.innerHTML = `⚠ ${result.message}`;
      el.style.display = 'flex';
      return;
    }
    if (result.tier === CONFLICT_TIERS.EXTENSION) {
      el.className = 'ksm-conflict ksm-conflict-error';
      el.innerHTML = `⛔ ${result.message}`;
      el.style.display = 'flex';
      return;
    }
  }

  getValue() { return this.value; }
  setValue(combo) {
    this.value = combo;
    this._box.classList.remove('recording');
    this._box.classList.toggle('has-value', !!combo);
    this._box.innerHTML = combo ? `<strong>${combo}</strong>` : 'Click to record key combination…';
  }
}
