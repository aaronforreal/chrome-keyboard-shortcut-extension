import { MESSAGE_TYPES } from '../../shared/constants.js';

export class ImportExport {
  constructor(container) {
    this.container = container;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="ksm-card">
        <div class="ksm-card-title">Export shortcuts</div>
        <p class="ksm-text-sm ksm-text-muted" style="margin-bottom:16px;">Download all your shortcuts and macros as a JSON file. Use this to back up your configuration or share it with others.</p>
        <button class="ksm-btn ksm-btn-primary" id="ie-export-btn">⬇ Export to JSON</button>
        <div id="ie-export-status" style="margin-top:12px;font-size:12px;color:var(--ksm-green);display:none;">✓ Export successful!</div>
      </div>

      <div class="ksm-card" style="margin-top:20px;">
        <div class="ksm-card-title">Import shortcuts</div>
        <p class="ksm-text-sm ksm-text-muted" style="margin-bottom:16px;">Import shortcuts from a previously exported JSON file.</p>

        <div class="ksm-form-group">
          <label class="ksm-form-label">Import mode</label>
          <select class="ksm-form-select" id="ie-mode" style="width:300px;">
            <option value="add">Add new (keep existing shortcuts)</option>
            <option value="merge">Merge by ID (update existing, add new)</option>
            <option value="replace">Replace all (delete existing first)</option>
          </select>
        </div>

        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
          <div>
            <label class="ksm-form-label" style="display:block;margin-bottom:6px;">Select JSON file</label>
            <input type="file" accept=".json" id="ie-file-input" style="font-size:13px;"/>
          </div>
          <button class="ksm-btn ksm-btn-primary" id="ie-import-btn" disabled>⬆ Import</button>
        </div>

        <div id="ie-import-preview" style="display:none;margin-top:16px;"></div>
        <div id="ie-import-status" style="margin-top:12px;font-size:13px;display:none;"></div>
      </div>
    `;

    this.container.querySelector('#ie-export-btn').addEventListener('click', () => this._export());

    const fileInput = this.container.querySelector('#ie-file-input');
    const importBtn = this.container.querySelector('#ie-import-btn');

    fileInput.addEventListener('change', () => {
      importBtn.disabled = !fileInput.files?.length;
      if (fileInput.files?.length) this._previewFile(fileInput.files[0]);
    });

    importBtn.addEventListener('click', () => this._import(fileInput.files[0]));
  }

  async _export() {
    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.EXPORT_SHORTCUTS });
    if (!res?.success) {
      alert('Export failed.');
      return;
    }

    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ksm-shortcuts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const status = this.container.querySelector('#ie-export-status');
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
  }

  async _previewFile(file) {
    const preview = this.container.querySelector('#ie-import-preview');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const count = data.shortcuts?.length || 0;
      const macroCount = data.macros?.length || 0;
      preview.style.display = 'block';
      preview.innerHTML = `
        <div style="background:var(--ksm-blue-light);border:1px solid var(--ksm-blue-border);border-radius:6px;padding:12px;font-size:12px;">
          <strong>Preview:</strong> ${count} shortcut${count !== 1 ? 's' : ''}${macroCount > 0 ? `, ${macroCount} macro${macroCount !== 1 ? 's' : ''}` : ''}
          ${data.exportedAt ? ` — exported ${new Date(data.exportedAt).toLocaleDateString()}` : ''}
        </div>
      `;
    } catch {
      preview.style.display = 'block';
      preview.innerHTML = `<div style="color:var(--ksm-red);font-size:12px;">⚠ Invalid JSON file</div>`;
    }
  }

  async _import(file) {
    if (!file) return;
    const mode = this.container.querySelector('#ie-mode').value;
    const status = this.container.querySelector('#ie-import-status');

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (mode === 'replace') {
        if (!confirm('This will DELETE all existing shortcuts and replace them. Are you sure?')) return;
        // Delete all first
        const existing = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS });
        for (const s of existing?.shortcuts || []) {
          await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_SHORTCUT, payload: { id: s.id } });
        }
      }

      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.IMPORT_SHORTCUTS,
        payload: { ...data, merge: mode === 'merge' },
      });

      if (res?.success) {
        status.style.color = 'var(--ksm-green)';
        status.textContent = `✓ Imported ${res.added} shortcut${res.added !== 1 ? 's' : ''}${res.updated ? `, updated ${res.updated}` : ''}.`;
      } else {
        status.style.color = 'var(--ksm-red)';
        status.textContent = `⚠ Import failed: ${res?.errors?.join(', ') || 'Unknown error'}`;
      }
      status.style.display = 'block';
    } catch (err) {
      status.style.display = 'block';
      status.style.color = 'var(--ksm-red)';
      status.textContent = `⚠ Error: ${err.message}`;
    }
  }
}
