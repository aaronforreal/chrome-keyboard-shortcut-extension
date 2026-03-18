import { MESSAGE_TYPES } from '../../shared/constants.js';

export function renderStatusBar(container, { settings, tab, onToggle, onOpenOptions }) {
  container.innerHTML = `
    <div class="ksm-popup-header">
      <div class="ksm-popup-header-left">
        <div class="ksm-logo">⌨</div>
        <span class="ksm-app-name">Shortcuts</span>
      </div>
      <div class="ksm-header-actions">
        <label class="ksm-toggle" title="${settings.enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}">
          <input type="checkbox" id="ksm-enabled-toggle" ${settings.enabled ? 'checked' : ''}/>
          <span class="ksm-toggle-track"></span>
          <span class="ksm-toggle-thumb"></span>
        </label>
        <button class="ksm-icon-btn" id="ksm-open-options" title="Open settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  container.querySelector('#ksm-enabled-toggle').addEventListener('change', async (e) => {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TOGGLE_EXTENSION,
      payload: { enabled: e.target.checked },
    });
    onToggle(e.target.checked);
  });

  container.querySelector('#ksm-open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    if (onOpenOptions) onOpenOptions();
  });
}
