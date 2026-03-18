// src/shared/constants.js
var MESSAGE_TYPES = {
  // Content → Service Worker
  KEY_PRESSED: "KEY_PRESSED",
  SHORTCUT_FIRED: "SHORTCUT_FIRED",
  MACRO_STEP_DONE: "MACRO_STEP_DONE",
  TEXT_EXPANDED: "TEXT_EXPANDED",
  REQUEST_SHORTCUTS: "REQUEST_SHORTCUTS",
  LOG_ANALYTICS: "LOG_ANALYTICS",
  LOG_ERROR: "LOG_ERROR",
  UNDO_REQUESTED: "UNDO_REQUESTED",
  // Service Worker → Content
  EXECUTE_ACTION: "EXECUTE_ACTION",
  EXECUTE_MACRO_STEP: "EXECUTE_MACRO_STEP",
  SHORTCUTS_UPDATED: "SHORTCUTS_UPDATED",
  SHOW_HINT_OVERLAY: "SHOW_HINT_OVERLAY",
  HIDE_HINT_OVERLAY: "HIDE_HINT_OVERLAY",
  SHOW_COMMAND_PALETTE: "SHOW_COMMAND_PALETTE",
  SHOW_ONBOARDING_TIP: "SHOW_ONBOARDING_TIP",
  // Popup/Options → Service Worker
  GET_ALL_SHORTCUTS: "GET_ALL_SHORTCUTS",
  CREATE_SHORTCUT: "CREATE_SHORTCUT",
  UPDATE_SHORTCUT: "UPDATE_SHORTCUT",
  DELETE_SHORTCUT: "DELETE_SHORTCUT",
  GET_ANALYTICS: "GET_ANALYTICS",
  IMPORT_SHORTCUTS: "IMPORT_SHORTCUTS",
  EXPORT_SHORTCUTS: "EXPORT_SHORTCUTS",
  GET_CONFLICTS: "GET_CONFLICTS",
  CHECK_SINGLE_CONFLICT: "CHECK_SINGLE_CONFLICT",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  GET_SETTINGS: "GET_SETTINGS",
  GET_MACROS: "GET_MACROS",
  CREATE_MACRO: "CREATE_MACRO",
  UPDATE_MACRO: "UPDATE_MACRO",
  DELETE_MACRO: "DELETE_MACRO",
  TOGGLE_EXTENSION: "TOGGLE_EXTENSION",
  DISABLE_KEY_CAPTURE: "DISABLE_KEY_CAPTURE",
  ENABLE_KEY_CAPTURE: "ENABLE_KEY_CAPTURE",
  START_MACRO: "START_MACRO"
};
var ACTION_TYPES = {
  URL: "url",
  SCROLL: "scroll",
  CLICK: "click",
  FILL: "fill",
  SCRIPT: "script",
  MACRO: "macro",
  TEXT_EXPAND: "text_expand",
  CLIPBOARD: "clipboard",
  NAVIGATE: "navigate"
};
var TRIGGER_TYPES = {
  COMBO: "combo",
  LEADER_SEQUENCE: "leader_sequence",
  TEXT_EXPANSION: "text_expansion"
};
var SCOPE_TYPES = {
  GLOBAL: "global",
  SITE: "site",
  PAGE: "page"
};
var CONFLICT_TIERS = {
  NONE: "none",
  BROWSER_RESERVED: "browser_reserved",
  BROWSER_COMMON: "browser_common",
  EXTENSION: "extension"
};
var BROWSER_RESERVED_SHORTCUTS = /* @__PURE__ */ new Set([
  "ctrl+t",
  "ctrl+w",
  "ctrl+n",
  "ctrl+shift+n",
  "ctrl+tab",
  "ctrl+shift+tab",
  "f5",
  "ctrl+r",
  "ctrl+shift+r",
  "ctrl+l",
  "ctrl+shift+j",
  "ctrl+shift+i",
  "ctrl+h",
  "ctrl+shift+delete",
  "alt+f4",
  "f1",
  "f3",
  "f6",
  "f10",
  "f11",
  "f12",
  // Mac equivalents
  "cmd+t",
  "cmd+w",
  "cmd+n",
  "cmd+shift+n",
  "cmd+tab",
  "cmd+r",
  "cmd+shift+r",
  "cmd+l",
  "cmd+shift+j",
  "cmd+shift+i",
  "cmd+h",
  "cmd+q",
  "cmd+m"
]);
var BROWSER_COMMON_SHORTCUTS = /* @__PURE__ */ new Set([
  "ctrl+f",
  "ctrl+g",
  "ctrl+d",
  "ctrl+b",
  "ctrl+u",
  "ctrl+s",
  "ctrl+p",
  "ctrl+a",
  "ctrl+z",
  "ctrl+y",
  "ctrl+c",
  "ctrl+v",
  "ctrl+x",
  "ctrl+shift+b",
  "cmd+f",
  "cmd+g",
  "cmd+d",
  "cmd+b",
  "cmd+u",
  "cmd+s",
  "cmd+p",
  "cmd+a",
  "cmd+z",
  "cmd+y",
  "cmd+c",
  "cmd+v",
  "cmd+x"
]);

// src/shared/platform.js
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac"))
    return "mac";
  if (ua.includes("win"))
    return "windows";
  if (ua.includes("linux"))
    return "linux";
  return "windows";
}
function getModifierLabel(key, platform) {
  if (!platform || platform === "auto")
    platform = detectPlatform();
  const labels = {
    mac: { ctrl: "\u2303", alt: "\u2325", shift: "\u21E7", meta: "\u2318", cmd: "\u2318" },
    windows: { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Win", cmd: "Ctrl" },
    linux: { ctrl: "Ctrl", alt: "Alt", shift: "Shift", meta: "Super", cmd: "Ctrl" }
  };
  const map = labels[platform] || labels.windows;
  return map[key.toLowerCase()] || key;
}
function formatComboDisplay(combo, platform) {
  if (!platform || platform === "auto")
    platform = detectPlatform();
  return combo.split("+").map((part) => {
    const label = getModifierLabel(part, platform);
    if (label !== part)
      return label;
    if (part.length === 1)
      return part.toUpperCase();
    const specialKeys = {
      space: "Space",
      enter: "\u21B5",
      escape: "Esc",
      esc: "Esc",
      backspace: "\u232B",
      delete: "Del",
      tab: "\u21E5",
      up: "\u2191",
      down: "\u2193",
      left: "\u2190",
      right: "\u2192",
      f1: "F1",
      f2: "F2",
      f3: "F3",
      f4: "F4",
      f5: "F5",
      f6: "F6",
      f7: "F7",
      f8: "F8",
      f9: "F9",
      f10: "F10",
      f11: "F11",
      f12: "F12"
    };
    return specialKeys[part.toLowerCase()] || part.charAt(0).toUpperCase() + part.slice(1);
  }).join(platform === "mac" ? "" : "+");
}

// src/options/components/dashboard.js
var Dashboard = class {
  constructor(container, { onEdit, onDelete }) {
    this.container = container;
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.shortcuts = [];
    this.filtered = [];
    this.sortKey = "name";
    this.sortDir = 1;
    this.query = "";
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
          <input class="ksm-search-input" id="dash-search" type="text" placeholder="Search shortcuts\u2026"/>
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
              <th data-key="name">Name \u2195</th>
              <th>Keys</th>
              <th data-key="scope.type">Scope</th>
              <th data-key="action.type">Type</th>
              <th data-key="usageCount">Uses</th>
              <th>Enabled</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="dash-tbody">
            <tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--ksm-text-muted);">Loading\u2026</td></tr>
          </tbody>
        </table>
      </div>
      <div id="dash-empty" class="ksm-empty" style="display:none;">
        <div class="ksm-empty-title">No shortcuts yet</div>
        <div class="ksm-empty-sub">Click "New Shortcut" to create your first one.</div>
      </div>
    `;
    this.container.querySelector("#dash-search").addEventListener("input", (e) => {
      this.query = e.target.value;
      this._filter();
      this._renderRows();
    });
    this.container.querySelector("#dash-filter-type").addEventListener("change", () => {
      this._filter();
      this._renderRows();
    });
    this.container.querySelector("#dash-filter-scope").addEventListener("change", () => {
      this._filter();
      this._renderRows();
    });
    this.container.querySelectorAll("th[data-key]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (this.sortKey === key)
          this.sortDir *= -1;
        else {
          this.sortKey = key;
          this.sortDir = 1;
        }
        this._filter();
        this._renderRows();
      });
    });
  }
  _filter() {
    const q = this.query.toLowerCase();
    const typeFilter = this.container.querySelector("#dash-filter-type")?.value || "";
    const scopeFilter = this.container.querySelector("#dash-filter-scope")?.value || "";
    let list = this.shortcuts.filter((s) => {
      if (q && !s.name?.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q) && !s.trigger?.keys?.join("+").toLowerCase().includes(q))
        return false;
      if (typeFilter && s.action?.type !== typeFilter)
        return false;
      if (scopeFilter && s.scope?.type !== scopeFilter)
        return false;
      return true;
    });
    list.sort((a, b) => {
      const av = getNestedValue(a, this.sortKey) ?? "";
      const bv = getNestedValue(b, this.sortKey) ?? "";
      return (av < bv ? -1 : av > bv ? 1 : 0) * this.sortDir;
    });
    this.filtered = list;
  }
  _renderRows() {
    const tbody = this.container.querySelector("#dash-tbody");
    const emptyEl = this.container.querySelector("#dash-empty");
    if (this.filtered.length === 0) {
      tbody.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";
    tbody.innerHTML = this.filtered.map((s) => {
      const keys = s.trigger?.keys?.join("+") || "";
      const display = keys ? formatComboDisplay(keys, "auto") : "\u2014";
      const isLeader = s.trigger?.type === "leader_sequence";
      const displayKeys = isLeader ? `${s.trigger.leaderKey || "space"} \u203A ${display}` : display;
      const typeColors = {
        url: "blue",
        scroll: "",
        click: "yellow",
        fill: "yellow",
        script: "red",
        macro: "green",
        text_expand: "blue",
        clipboard: "",
        navigate: ""
      };
      const colorClass = typeColors[s.action?.type] ? `ksm-badge-${typeColors[s.action.type]}` : "";
      return `
        <tr data-id="${s.id}">
          <td>
            <div style="font-weight:500;">${escHtml(s.name || "Unnamed")}</div>
            ${s.description ? `<div class="ksm-text-sm ksm-text-muted">${escHtml(s.description)}</div>` : ""}
          </td>
          <td><kbd class="ksm-kbd">${escHtml(displayKeys)}</kbd></td>
          <td><span class="ksm-badge">${escHtml(s.scope?.type || "\u2014")}</span></td>
          <td><span class="ksm-badge ${colorClass}">${escHtml(s.action?.type || "\u2014")}</span></td>
          <td class="ksm-text-muted">${s.usageCount || 0}</td>
          <td>
            <label class="ksm-toggle" title="${s.enabled ? "Enabled" : "Disabled"}">
              <input type="checkbox" class="dash-enable-toggle" data-id="${s.id}" ${s.enabled ? "checked" : ""}/>
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
    }).join("");
    tbody.querySelectorAll(".dash-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = this.shortcuts.find((x) => x.id === btn.dataset.id);
        if (s && this.onEdit)
          this.onEdit(s);
      });
    });
    tbody.querySelectorAll(".dash-delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this shortcut?"))
          return;
        await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_SHORTCUT, payload: { id: btn.dataset.id } });
        this.shortcuts = this.shortcuts.filter((x) => x.id !== btn.dataset.id);
        this._filter();
        this._renderRows();
        if (this.onDelete)
          this.onDelete(btn.dataset.id);
      });
    });
    tbody.querySelectorAll(".dash-enable-toggle").forEach((toggle) => {
      toggle.addEventListener("change", async () => {
        const s = this.shortcuts.find((x) => x.id === toggle.dataset.id);
        if (!s)
          return;
        s.enabled = toggle.checked;
        await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.UPDATE_SHORTCUT, payload: { shortcut: s } });
      });
    });
  }
};
function getNestedValue(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}
function escHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/shared/validators.js
function generateId(prefix = "sc") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function createShortcutDefaults(overrides = {}) {
  return {
    id: generateId("sc"),
    name: "",
    description: "",
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.COMBO,
      keys: [],
      leaderKey: null,
      leaderTimeout: 1500,
      abbreviation: null
    },
    scope: {
      type: SCOPE_TYPES.GLOBAL,
      urlPattern: null,
      urlPatternType: "glob"
    },
    action: {
      type: ACTION_TYPES.URL,
      url: null,
      urlTarget: "new_tab",
      scrollAmount: 300,
      scrollDirection: "down",
      clickSelector: null,
      fillSelector: null,
      fillValue: null,
      script: null,
      macroId: null,
      textExpansion: null,
      clipboardAction: null,
      clipboardSelector: null,
      clipboardTransform: null,
      navigateDirection: "back"
    },
    conditions: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
    lastUsedAt: null,
    tags: [],
    isBuiltIn: false,
    phase: 1,
    ...overrides
  };
}

// src/shared/key-utils.js
var MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"];
var KEY_ALIASES = {
  " ": "space",
  "ArrowUp": "up",
  "ArrowDown": "down",
  "ArrowLeft": "left",
  "ArrowRight": "right",
  "Escape": "esc",
  "Enter": "enter",
  "Backspace": "backspace",
  "Delete": "delete",
  "Tab": "tab",
  "CapsLock": "capslock",
  "Control": null,
  // modifier-only, ignore as main key
  "Alt": null,
  "Shift": null,
  "Meta": null,
  "OS": null,
  "F1": "f1",
  "F2": "f2",
  "F3": "f3",
  "F4": "f4",
  "F5": "f5",
  "F6": "f6",
  "F7": "f7",
  "F8": "f8",
  "F9": "f9",
  "F10": "f10",
  "F11": "f11",
  "F12": "f12",
  "Insert": "insert",
  "Home": "home",
  "End": "end",
  "PageUp": "pageup",
  "PageDown": "pagedown"
};
function normalizeCombo(event) {
  const platform = detectPlatform();
  const mods = [];
  if (event.ctrlKey)
    mods.push("ctrl");
  if (event.altKey)
    mods.push("alt");
  if (event.shiftKey)
    mods.push("shift");
  if (event.metaKey)
    mods.push("meta");
  const normalizedMods = mods.map((m) => {
    if (m === "meta" && platform === "mac")
      return "cmd";
    return m;
  });
  const orderedMods = MODIFIER_ORDER.map((m) => m === "meta" && platform === "mac" ? "cmd" : m).filter((m) => normalizedMods.includes(m));
  const rawKey = event.key;
  if (rawKey in KEY_ALIASES) {
    if (KEY_ALIASES[rawKey] === null)
      return null;
    const key2 = KEY_ALIASES[rawKey];
    if (orderedMods.length === 0)
      return key2;
    return [...orderedMods, key2].join("+");
  }
  const key = rawKey.toLowerCase();
  if (orderedMods.length === 0)
    return key;
  return [...orderedMods, key].join("+");
}

// src/options/components/key-recorder.js
var KeyRecorder = class {
  constructor(container, { value = "", scope = null, excludeId = null, onChange }) {
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
      <div class="ksm-key-recorder-box ${this.value ? "has-value" : ""}" tabindex="0">
        ${this.value ? `<strong>${this.value}</strong>` : "Click to record key combination\u2026"}
      </div>
      <div id="ksm-kr-conflict" style="display:none;" class="ksm-conflict"></div>
      <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;" id="ksm-kr-suggestions"></div>
    `;
    this._box = this.container.querySelector(".ksm-key-recorder-box");
    this._conflictEl = this.container.querySelector("#ksm-kr-conflict");
    this._suggestEl = this.container.querySelector("#ksm-kr-suggestions");
    this._box.addEventListener("click", () => this.startRecording());
    this._box.addEventListener("keydown", (e) => this._onKeyDown(e));
    this._box.addEventListener("blur", () => this.stopRecording());
  }
  startRecording() {
    this.recording = true;
    this._box.classList.add("recording");
    this._box.classList.remove("has-value");
    this._box.innerHTML = "<em>Listening\u2026 press your key combination</em>";
    this._box.focus();
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DISABLE_KEY_CAPTURE }).catch(() => {
    });
  }
  stopRecording() {
    if (!this.recording)
      return;
    this.recording = false;
    this._box.classList.remove("recording");
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.ENABLE_KEY_CAPTURE }).catch(() => {
    });
  }
  _onKeyDown(e) {
    if (!this.recording)
      return;
    e.preventDefault();
    e.stopPropagation();
    if (["Control", "Alt", "Shift", "Meta", "OS"].includes(e.key))
      return;
    const combo = normalizeCombo(e);
    if (!combo)
      return;
    this.value = combo;
    this._box.classList.remove("recording");
    this._box.classList.add("has-value");
    this._box.innerHTML = `<strong>${combo}</strong>`;
    this.recording = false;
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.ENABLE_KEY_CAPTURE }).catch(() => {
    });
    this._checkConflict(combo);
  }
  async _checkConflict(combo) {
    this._conflictEl.style.display = "none";
    this._suggestEl.innerHTML = "";
    let result;
    if (BROWSER_RESERVED_SHORTCUTS.has(combo.toLowerCase())) {
      result = { tier: CONFLICT_TIERS.BROWSER_RESERVED, message: `"${combo}" is reserved by the browser and cannot be overridden.`, canOverride: false };
    } else if (BROWSER_COMMON_SHORTCUTS.has(combo.toLowerCase())) {
      result = { tier: CONFLICT_TIERS.BROWSER_COMMON, message: `"${combo}" is a common browser shortcut and will be overridden by this extension.`, canOverride: true };
    } else {
      try {
        const res = await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.CHECK_SINGLE_CONFLICT,
          payload: { combo, scope: this.scope, excludeId: this.excludeId }
        });
        result = res?.result || { tier: CONFLICT_TIERS.NONE, canOverride: true };
      } catch {
        result = { tier: CONFLICT_TIERS.NONE, canOverride: true };
      }
    }
    this._renderConflict(result);
    if (this.onChange)
      this.onChange(combo, result);
  }
  _renderConflict(result) {
    const el = this._conflictEl;
    if (result.tier === CONFLICT_TIERS.NONE) {
      el.className = "ksm-conflict ksm-conflict-ok";
      el.innerHTML = "\u2713 No conflicts detected";
      el.style.display = "flex";
      return;
    }
    if (result.tier === CONFLICT_TIERS.BROWSER_RESERVED) {
      el.className = "ksm-conflict ksm-conflict-error";
      el.innerHTML = `\u26D4 ${result.message}`;
      el.style.display = "flex";
      return;
    }
    if (result.tier === CONFLICT_TIERS.BROWSER_COMMON) {
      el.className = "ksm-conflict ksm-conflict-warn";
      el.innerHTML = `\u26A0 ${result.message}`;
      el.style.display = "flex";
      return;
    }
    if (result.tier === CONFLICT_TIERS.EXTENSION) {
      el.className = "ksm-conflict ksm-conflict-error";
      el.innerHTML = `\u26D4 ${result.message}`;
      el.style.display = "flex";
      return;
    }
  }
  getValue() {
    return this.value;
  }
  setValue(combo) {
    this.value = combo;
    this._box.classList.remove("recording");
    this._box.classList.toggle("has-value", !!combo);
    this._box.innerHTML = combo ? `<strong>${combo}</strong>` : "Click to record key combination\u2026";
  }
};

// src/options/components/action-builder.js
var ActionBuilder = class {
  constructor(container, { action = {}, onChange }) {
    this.container = container;
    this.action = { type: ACTION_TYPES.URL, url: "", urlTarget: "new_tab", ...action };
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
    this._typeSelect = this.container.querySelector("#ab-type");
    this._fields = this.container.querySelector("#ab-fields");
    this._typeSelect.value = this.action.type;
    this._typeSelect.addEventListener("change", () => {
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
            <input class="ksm-form-input" id="ab-url" type="url" placeholder="https://\u2026" value="${esc(a.url || "")}"/>
          </div>
          <div class="ksm-form-group">
            <label class="ksm-form-label">Open in</label>
            <select class="ksm-form-select" id="ab-url-target">
              <option value="new_tab" ${a.urlTarget === "new_tab" ? "selected" : ""}>New tab</option>
              <option value="current" ${a.urlTarget === "current" ? "selected" : ""}>Current tab</option>
              <option value="new_window" ${a.urlTarget === "new_window" ? "selected" : ""}>New window</option>
            </select>
          </div>
        `;
        this._bind("ab-url", "input", (v) => {
          this.action.url = v;
        });
        this._bind("ab-url-target", "change", (v) => {
          this.action.urlTarget = v;
        });
        break;
      case ACTION_TYPES.SCROLL:
        this._fields.innerHTML = `
          <div class="ksm-form-row">
            <div class="ksm-form-group">
              <label class="ksm-form-label">Direction</label>
              <select class="ksm-form-select" id="ab-scroll-dir">
                <option value="down" ${a.scrollDirection === "down" ? "selected" : ""}>Down</option>
                <option value="up" ${a.scrollDirection === "up" ? "selected" : ""}>Up</option>
                <option value="top" ${a.scrollDirection === "top" ? "selected" : ""}>To top</option>
                <option value="bottom" ${a.scrollDirection === "bottom" ? "selected" : ""}>To bottom</option>
              </select>
            </div>
            <div class="ksm-form-group">
              <label class="ksm-form-label">Amount (px)</label>
              <input class="ksm-form-input" id="ab-scroll-amount" type="number" value="${a.scrollAmount || 300}" min="50" max="3000"/>
            </div>
          </div>
        `;
        this._bind("ab-scroll-dir", "change", (v) => {
          this.action.scrollDirection = v;
        });
        this._bind("ab-scroll-amount", "input", (v) => {
          this.action.scrollAmount = parseInt(v) || 300;
        });
        break;
      case ACTION_TYPES.CLICK:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">CSS selector</label>
            <input class="ksm-form-input" id="ab-click-sel" type="text" placeholder="#submit-btn, .nav-link" value="${esc(a.clickSelector || "")}"/>
            <div class="ksm-form-hint">The element to click. Use browser DevTools to find the selector.</div>
          </div>
        `;
        this._bind("ab-click-sel", "input", (v) => {
          this.action.clickSelector = v;
        });
        break;
      case ACTION_TYPES.FILL:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Input selector</label>
            <input class="ksm-form-input" id="ab-fill-sel" type="text" placeholder="#search-input" value="${esc(a.fillSelector || "")}"/>
          </div>
          <div class="ksm-form-group">
            <label class="ksm-form-label">Value to fill</label>
            <input class="ksm-form-input" id="ab-fill-val" type="text" placeholder="Value to type into the field" value="${esc(a.fillValue || "")}"/>
          </div>
        `;
        this._bind("ab-fill-sel", "input", (v) => {
          this.action.fillSelector = v;
        });
        this._bind("ab-fill-val", "input", (v) => {
          this.action.fillValue = v;
        });
        break;
      case ACTION_TYPES.NAVIGATE:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Direction</label>
            <select class="ksm-form-select" id="ab-nav-dir">
              <option value="back" ${a.navigateDirection === "back" ? "selected" : ""}>Go back</option>
              <option value="forward" ${a.navigateDirection === "forward" ? "selected" : ""}>Go forward</option>
              <option value="reload" ${a.navigateDirection === "reload" ? "selected" : ""}>Reload page</option>
            </select>
          </div>
        `;
        this._bind("ab-nav-dir", "change", (v) => {
          this.action.navigateDirection = v;
        });
        break;
      case ACTION_TYPES.TEXT_EXPAND:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Expansion text</label>
            <textarea class="ksm-form-textarea" id="ab-expand-text" placeholder="Text to insert when the abbreviation is typed\u2026" style="min-height:80px;">${esc(a.textExpansion || "")}</textarea>
          </div>
        `;
        this._bind("ab-expand-text", "input", (v) => {
          this.action.textExpansion = v;
        });
        break;
      case ACTION_TYPES.CLIPBOARD:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Clipboard action</label>
            <select class="ksm-form-select" id="ab-clip-action">
              <option value="copy" ${a.clipboardAction === "copy" ? "selected" : ""}>Copy text</option>
              <option value="paste" ${a.clipboardAction === "paste" ? "selected" : ""}>Paste at cursor</option>
            </select>
          </div>
          <div class="ksm-form-group" id="ab-clip-sel-wrap">
            <label class="ksm-form-label">Source selector (optional)</label>
            <input class="ksm-form-input" id="ab-clip-sel" type="text" placeholder="CSS selector \u2014 leave blank for selection" value="${esc(a.clipboardSelector || "")}"/>
          </div>
          <div class="ksm-form-group" id="ab-clip-transform-wrap">
            <label class="ksm-form-label">Transform (optional JS expression)</label>
            <input class="ksm-form-input" id="ab-clip-transform" type="text" placeholder="text.toUpperCase()" value="${esc(a.clipboardTransform || "")}"/>
          </div>
        `;
        this._bind("ab-clip-action", "change", (v) => {
          this.action.clipboardAction = v;
        });
        this._bind("ab-clip-sel", "input", (v) => {
          this.action.clipboardSelector = v;
        });
        this._bind("ab-clip-transform", "input", (v) => {
          this.action.clipboardTransform = v;
        });
        break;
      case ACTION_TYPES.SCRIPT:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">JavaScript</label>
            <textarea class="ksm-form-textarea" id="ab-script" placeholder="// ksm helper API available:
// ksm.click(selector)
// ksm.fill(selector, value)
// ksm.navigate(url)
// ksm.copy(text)
// ksm.scroll(px)">${esc(a.script || "")}</textarea>
            <div class="ksm-form-hint">Runs in the page context. Use the <code>ksm</code> helper for safe DOM access.</div>
          </div>
        `;
        this._bind("ab-script", "input", (v) => {
          this.action.script = v;
        });
        break;
      case ACTION_TYPES.MACRO:
        this._fields.innerHTML = `
          <div class="ksm-form-group">
            <label class="ksm-form-label">Macro</label>
            <select class="ksm-form-select" id="ab-macro-id">
              <option value="">Loading macros\u2026</option>
            </select>
            <div class="ksm-form-hint">Create macros in the Macros tab first.</div>
          </div>
        `;
        this._loadMacros();
        break;
      default:
        this._fields.innerHTML = "";
    }
  }
  _bind(id, event, setter) {
    const el = this._fields.querySelector(`#${id}`);
    if (!el)
      return;
    el.addEventListener(event, () => {
      setter(el.value);
      this._emit();
    });
  }
  _emit() {
    if (this.onChange)
      this.onChange({ ...this.action });
  }
  async _loadMacros() {
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_MACROS" });
      const macros = res?.macros || [];
      const sel = this._fields.querySelector("#ab-macro-id");
      if (!sel)
        return;
      sel.innerHTML = macros.length === 0 ? '<option value="">No macros yet \u2014 create one in the Macros tab</option>' : macros.map((m) => `<option value="${m.id}" ${this.action.macroId === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("");
      sel.addEventListener("change", () => {
        this.action.macroId = sel.value;
        this._emit();
      });
    } catch {
    }
  }
  getValue() {
    return { ...this.action };
  }
};
function esc(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// src/options/components/shortcut-editor.js
var STEPS = ["Trigger", "Scope", "Action", "Conditions", "Review"];
var ShortcutEditor = class {
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
          <span>${this.isEdit ? "Edit shortcut" : "New shortcut"}</span>
          <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="se-cancel">Cancel</button>
        </div>

        <div class="ksm-steps" id="se-steps"></div>
        <div id="se-step-content"></div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button class="ksm-btn ksm-btn-secondary" id="se-prev" style="visibility:hidden;">\u2190 Back</button>
          <button class="ksm-btn ksm-btn-primary" id="se-next">Next \u2192</button>
        </div>
      </div>
    `;
    this.container.querySelector("#se-cancel").addEventListener("click", () => {
      if (this.onCancel)
        this.onCancel();
    });
    this._prevBtn = this.container.querySelector("#se-prev");
    this._nextBtn = this.container.querySelector("#se-next");
    this._prevBtn.addEventListener("click", () => this._goStep(this.step - 1));
    this._nextBtn.addEventListener("click", () => this._goStep(this.step + 1));
    this._renderStepIndicator();
    this._renderStep();
  }
  _renderStepIndicator() {
    const el = this.container.querySelector("#se-steps");
    el.innerHTML = STEPS.map((label, i) => `
      ${i > 0 ? '<div class="ksm-step-connector"></div>' : ""}
      <div class="ksm-step ${i === this.step ? "active" : i < this.step ? "completed" : ""}">
        <div class="ksm-step-dot">${i < this.step ? "\u2713" : i + 1}</div>
        <div class="ksm-step-label">${label}</div>
      </div>
    `).join("");
  }
  _renderStep() {
    const content = this.container.querySelector("#se-step-content");
    content.innerHTML = "";
    this._prevBtn.style.visibility = this.step > 0 ? "visible" : "hidden";
    this._nextBtn.textContent = this.step === STEPS.length - 1 ? this.isEdit ? "\u{1F4BE} Save changes" : "\u2713 Create shortcut" : "Next \u2192";
    switch (this.step) {
      case 0:
        this._renderTriggerStep(content);
        break;
      case 1:
        this._renderScopeStep(content);
        break;
      case 2:
        this._renderActionStep(content);
        break;
      case 3:
        this._renderConditionsStep(content);
        break;
      case 4:
        this._renderReviewStep(content);
        break;
    }
  }
  _renderTriggerStep(el) {
    const t = this.def.trigger;
    el.innerHTML = `
      <div class="ksm-form-group">
        <label class="ksm-form-label">Shortcut name</label>
        <input class="ksm-form-input" id="se-name" type="text" placeholder="e.g. Open Gmail" value="${esc2(this.def.name)}"/>
      </div>
      <div class="ksm-form-group">
        <label class="ksm-form-label">Description (optional)</label>
        <input class="ksm-form-input" id="se-desc" type="text" placeholder="What this shortcut does" value="${esc2(this.def.description || "")}"/>
      </div>
      <div class="ksm-form-group">
        <label class="ksm-form-label">Trigger type</label>
        <select class="ksm-form-select" id="se-trigger-type">
          <option value="combo" ${t.type === "combo" ? "selected" : ""}>Key combination (e.g. Ctrl+Shift+G)</option>
          <option value="leader_sequence" ${t.type === "leader_sequence" ? "selected" : ""}>Leader sequence (e.g. Space \u2192 G)</option>
          <option value="text_expansion" ${t.type === "text_expansion" ? "selected" : ""}>Text abbreviation (type to expand)</option>
        </select>
      </div>
      <div id="se-trigger-fields"></div>
    `;
    el.querySelector("#se-name").addEventListener("input", (e) => {
      this.def.name = e.target.value;
    });
    el.querySelector("#se-desc").addEventListener("input", (e) => {
      this.def.description = e.target.value;
    });
    el.querySelector("#se-trigger-type").addEventListener("change", (e) => {
      this.def.trigger.type = e.target.value;
      this._renderTriggerFields(el.querySelector("#se-trigger-fields"));
    });
    this._renderTriggerFields(el.querySelector("#se-trigger-fields"));
  }
  _renderTriggerFields(el) {
    const t = this.def.trigger;
    el.innerHTML = "";
    if (t.type === TRIGGER_TYPES.TEXT_EXPANSION) {
      el.innerHTML = `
        <div class="ksm-form-group">
          <label class="ksm-form-label">Abbreviation</label>
          <input class="ksm-form-input" id="se-abbr" type="text" placeholder="@@home, :smile:, /sig" value="${esc2(t.abbreviation || "")}"/>
          <div class="ksm-form-hint">Type this text in any input to trigger the expansion.</div>
        </div>
      `;
      el.querySelector("#se-abbr").addEventListener("input", (e) => {
        this.def.trigger.abbreviation = e.target.value;
      });
      return;
    }
    const recorderWrap = document.createElement("div");
    recorderWrap.className = "ksm-form-group";
    recorderWrap.innerHTML = `<label class="ksm-form-label">Key combination</label><div id="se-key-recorder-target"></div>`;
    el.appendChild(recorderWrap);
    const recorderTarget = recorderWrap.querySelector("#se-key-recorder-target");
    const currentCombo = this.def.trigger.keys?.join("+") || "";
    this._keyRecorder = new KeyRecorder(recorderTarget, {
      value: currentCombo,
      scope: this.def.scope,
      excludeId: this.isEdit ? this.def.id : null,
      onChange: (combo) => {
        this.def.trigger.keys = combo.split("+");
      }
    });
    if (t.type === TRIGGER_TYPES.LEADER_SEQUENCE) {
      const leaderWrap = document.createElement("div");
      leaderWrap.className = "ksm-form-group";
      leaderWrap.innerHTML = `
        <label class="ksm-form-label">Leader key</label>
        <input class="ksm-form-input" id="se-leader" type="text" placeholder="space" value="${esc2(t.leaderKey || "space")}"/>
        <div class="ksm-form-hint">Press the leader key first, then your combo within ${t.leaderTimeout || 1500}ms.</div>
      `;
      el.appendChild(leaderWrap);
      leaderWrap.querySelector("#se-leader").addEventListener("input", (e) => {
        this.def.trigger.leaderKey = e.target.value;
      });
    }
  }
  _renderScopeStep(el) {
    const s = this.def.scope;
    el.innerHTML = `
      <div class="ksm-form-group">
        <label class="ksm-form-label">Where does this shortcut work?</label>
        <select class="ksm-form-select" id="se-scope-type">
          <option value="global" ${s.type === "global" ? "selected" : ""}>Global \u2014 works on every website</option>
          <option value="site" ${s.type === "site" ? "selected" : ""}>Site-specific \u2014 only on matching URLs</option>
          <option value="page" ${s.type === "page" ? "selected" : ""}>Page-specific \u2014 only on this exact page</option>
        </select>
      </div>
      <div id="se-scope-pattern" ${s.type === "global" ? 'style="display:none;"' : ""}>
        <div class="ksm-form-group">
          <label class="ksm-form-label">URL pattern</label>
          <input class="ksm-form-input" id="se-url-pattern" type="text" placeholder="*://mail.google.com/*" value="${esc2(s.urlPattern || "")}"/>
          <div class="ksm-form-hint">Use <code>*</code> as a wildcard. Example: <code>*://github.com/*</code></div>
        </div>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Pattern type</label>
          <select class="ksm-form-select" id="se-pattern-type">
            <option value="glob" ${s.urlPatternType !== "regex" ? "selected" : ""}>Glob (simple wildcards)</option>
            <option value="regex" ${s.urlPatternType === "regex" ? "selected" : ""}>Regular expression</option>
          </select>
        </div>
      </div>
    `;
    el.querySelector("#se-scope-type").addEventListener("change", (e) => {
      this.def.scope.type = e.target.value;
      el.querySelector("#se-scope-pattern").style.display = e.target.value === "global" ? "none" : "block";
    });
    el.querySelector("#se-url-pattern").addEventListener("input", (e) => {
      this.def.scope.urlPattern = e.target.value;
    });
    el.querySelector("#se-pattern-type").addEventListener("change", (e) => {
      this.def.scope.urlPatternType = e.target.value;
    });
  }
  _renderActionStep(el) {
    const wrap = document.createElement("div");
    el.appendChild(wrap);
    this._actionBuilder = new ActionBuilder(wrap, {
      action: this.def.action,
      onChange: (action) => {
        this.def.action = action;
      }
    });
  }
  _renderConditionsStep(el) {
    el.innerHTML = `
      <p class="ksm-text-muted ksm-text-sm" style="margin-bottom:12px;">Conditions are optional. When set, ALL conditions must be true for the shortcut to fire.</p>
      <div id="se-conditions-list"></div>
      <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="se-add-condition" style="margin-top:8px;">+ Add condition</button>
    `;
    const listEl = el.querySelector("#se-conditions-list");
    const renderConditions = () => {
      listEl.innerHTML = this.def.conditions.map((c, i) => `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <select class="ksm-form-select" style="width:180px;" data-cond-type="${i}">
            <option value="url_contains" ${c.type === "url_contains" ? "selected" : ""}>URL contains</option>
            <option value="url_matches" ${c.type === "url_matches" ? "selected" : ""}>URL matches (regex)</option>
            <option value="element_exists" ${c.type === "element_exists" ? "selected" : ""}>Element exists</option>
            <option value="element_not_exists" ${c.type === "element_not_exists" ? "selected" : ""}>Element not exists</option>
          </select>
          <input class="ksm-form-input" placeholder="Value" value="${esc2(c.value || "")}" data-cond-val="${i}" style="flex:1;"/>
          <button class="ksm-btn-icon" data-cond-del="${i}" style="color:var(--ksm-red);">\u2715</button>
        </div>
      `).join("");
      listEl.querySelectorAll("[data-cond-type]").forEach((sel) => {
        sel.addEventListener("change", (e) => {
          this.def.conditions[+sel.dataset.condType].type = e.target.value;
        });
      });
      listEl.querySelectorAll("[data-cond-val]").forEach((inp) => {
        inp.addEventListener("input", (e) => {
          this.def.conditions[+inp.dataset.condVal].value = e.target.value;
        });
      });
      listEl.querySelectorAll("[data-cond-del]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.def.conditions.splice(+btn.dataset.condDel, 1);
          renderConditions();
        });
      });
    };
    el.querySelector("#se-add-condition").addEventListener("click", () => {
      this.def.conditions.push({ type: "url_contains", value: "", operator: "is" });
      renderConditions();
    });
    renderConditions();
  }
  _renderReviewStep(el) {
    const t = this.def.trigger;
    const s = this.def.scope;
    const a = this.def.action;
    const combo = t.keys?.join("+") || t.abbreviation || "\u2014";
    el.innerHTML = `
      <div class="ksm-card" style="margin-bottom:0;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);width:120px;">Name</td><td style="font-weight:500;">${esc2(this.def.name || "\u2014")}</td></tr>
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Trigger</td><td><kbd class="ksm-kbd">${esc2(combo)}</kbd> (${esc2(t.type)})</td></tr>
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Scope</td><td>${esc2(s.type)}${s.urlPattern ? ` \u2014 ${esc2(s.urlPattern)}` : ""}</td></tr>
          <tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Action</td><td>${esc2(a.type)}${a.url ? ` \u2192 ${esc2(a.url)}` : ""}</td></tr>
          ${this.def.conditions.length > 0 ? `<tr><td style="padding:8px 0;color:var(--ksm-text-muted);">Conditions</td><td>${this.def.conditions.length} condition(s)</td></tr>` : ""}
        </table>
      </div>
      <div id="se-review-error" style="display:none;" class="ksm-conflict ksm-conflict-error ksm-mt-4"></div>
    `;
  }
  async _goStep(next) {
    if (!this._validateCurrentStep())
      return;
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
        alert("Please enter a name for this shortcut.");
        return false;
      }
      const t = this.def.trigger;
      if (t.type !== TRIGGER_TYPES.TEXT_EXPANSION && (!t.keys || t.keys.length === 0)) {
        alert("Please record a key combination.");
        return false;
      }
      if (t.type === TRIGGER_TYPES.TEXT_EXPANSION && !t.abbreviation?.trim()) {
        alert("Please enter an abbreviation.");
        return false;
      }
    }
    if (this.step === 1) {
      const s = this.def.scope;
      if (s.type !== SCOPE_TYPES.GLOBAL && !s.urlPattern?.trim()) {
        alert("Please enter a URL pattern for the scope.");
        return false;
      }
    }
    return true;
  }
  async _save() {
    const msgType = this.isEdit ? MESSAGE_TYPES.UPDATE_SHORTCUT : MESSAGE_TYPES.CREATE_SHORTCUT;
    const response = await chrome.runtime.sendMessage({
      type: msgType,
      payload: { shortcut: this.def }
    });
    if (response?.success) {
      if (this.onSaved)
        this.onSaved(response.shortcut || this.def);
    } else {
      const errEl = this.container.querySelector("#se-review-error");
      if (errEl) {
        errEl.style.display = "flex";
        errEl.textContent = `Error: ${response?.errors?.join(", ") || "Failed to save"}`;
      }
    }
  }
};
function esc2(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// src/options/components/macro-builder.js
var STEP_TYPES = [
  { value: "navigate", label: "Navigate to URL" },
  { value: "click", label: "Click element" },
  { value: "fill", label: "Fill input" },
  { value: "wait", label: "Wait (delay)" },
  { value: "script", label: "Run script" },
  { value: "copy", label: "Copy to clipboard" },
  { value: "keyboard", label: "Press key" }
];
var MacroBuilder = class {
  constructor(container, { macro = null, onSaved, onCancel }) {
    this.container = container;
    this.macro = macro || {
      id: generateId("mc"),
      name: "",
      steps: [],
      onError: "stop"
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
          <span>${this.isEdit ? "Edit macro" : "New macro"}</span>
          <button class="ksm-btn ksm-btn-secondary ksm-btn-sm" id="mb-cancel">Cancel</button>
        </div>

        <div class="ksm-form-group">
          <label class="ksm-form-label">Macro name</label>
          <input class="ksm-form-input" id="mb-name" type="text" placeholder="e.g. Submit form" value="${esc3(this.macro.name)}"/>
        </div>

        <div class="ksm-form-group">
          <label class="ksm-form-label">On error</label>
          <select class="ksm-form-select" id="mb-on-error" style="width:200px;">
            <option value="stop" ${this.macro.onError === "stop" ? "selected" : ""}>Stop</option>
            <option value="continue" ${this.macro.onError === "continue" ? "selected" : ""}>Continue</option>
            <option value="revert" ${this.macro.onError === "revert" ? "selected" : ""}>Revert (undo done steps)</option>
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
    this.container.querySelector("#mb-cancel").addEventListener("click", () => this.onCancel?.());
    this.container.querySelector("#mb-cancel2").addEventListener("click", () => this.onCancel?.());
    this.container.querySelector("#mb-name").addEventListener("input", (e) => {
      this.macro.name = e.target.value;
    });
    this.container.querySelector("#mb-on-error").addEventListener("change", (e) => {
      this.macro.onError = e.target.value;
    });
    this.container.querySelector("#mb-add-step").addEventListener("click", () => this._addStep());
    this.container.querySelector("#mb-save").addEventListener("click", () => this._save());
    this._renderSteps();
  }
  _addStep() {
    this.macro.steps.push({
      id: generateId("st"),
      type: "navigate",
      delay: 0,
      selector: null,
      value: null,
      script: null,
      url: null,
      undoable: true
    });
    this._renderSteps();
  }
  _renderSteps() {
    const list = this.container.querySelector("#mb-steps-list");
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
              ${STEP_TYPES.map((t) => `<option value="${t.value}" ${step.type === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
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
          ${i > 0 ? `<button class="ksm-btn-icon" data-step-up="${i}" title="Move up">\u2191</button>` : ""}
          ${i < this.macro.steps.length - 1 ? `<button class="ksm-btn-icon" data-step-down="${i}" title="Move down">\u2193</button>` : ""}
          <button class="ksm-btn-icon" data-step-del="${i}" style="color:var(--ksm-red);" title="Remove">\u2715</button>
        </div>
      </div>
    `).join("");
    list.querySelectorAll("[data-step-type]").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const i = +sel.dataset.stepType;
        this.macro.steps[i].type = e.target.value;
        this._renderSteps();
      });
    });
    list.querySelectorAll("[data-step-delay]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        this.macro.steps[+inp.dataset.stepDelay].delay = parseInt(e.target.value) || 0;
      });
    });
    list.querySelectorAll("[data-step-url]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        this.macro.steps[+inp.dataset.stepUrl].url = e.target.value;
      });
    });
    list.querySelectorAll("[data-step-sel]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        this.macro.steps[+inp.dataset.stepSel].selector = e.target.value;
      });
    });
    list.querySelectorAll("[data-step-val]").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        this.macro.steps[+inp.dataset.stepVal].value = e.target.value;
      });
    });
    list.querySelectorAll("[data-step-script]").forEach((ta) => {
      ta.addEventListener("input", (e) => {
        this.macro.steps[+ta.dataset.stepScript].script = e.target.value;
      });
    });
    list.querySelectorAll("[data-step-up]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = +btn.dataset.stepUp;
        [this.macro.steps[i - 1], this.macro.steps[i]] = [this.macro.steps[i], this.macro.steps[i - 1]];
        this._renderSteps();
      });
    });
    list.querySelectorAll("[data-step-down]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = +btn.dataset.stepDown;
        [this.macro.steps[i], this.macro.steps[i + 1]] = [this.macro.steps[i + 1], this.macro.steps[i]];
        this._renderSteps();
      });
    });
    list.querySelectorAll("[data-step-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.macro.steps.splice(+btn.dataset.stepDel, 1);
        this._renderSteps();
      });
    });
  }
  _renderStepFields(step, i) {
    switch (step.type) {
      case "navigate":
        return `<input class="ksm-form-input" data-step-url="${i}" type="url" placeholder="https://\u2026" value="${esc3(step.url || "")}"/>`;
      case "click":
        return `<input class="ksm-form-input" data-step-sel="${i}" type="text" placeholder="CSS selector" value="${esc3(step.selector || "")}"/>`;
      case "fill":
        return `
          <div style="display:flex;gap:8px;">
            <input class="ksm-form-input" data-step-sel="${i}" type="text" placeholder="CSS selector" value="${esc3(step.selector || "")}" style="flex:1;"/>
            <input class="ksm-form-input" data-step-val="${i}" type="text" placeholder="Value" value="${esc3(step.value || "")}" style="flex:1;"/>
          </div>`;
      case "wait":
        return `<div class="ksm-text-sm ksm-text-muted">Waits for the delay above before executing the next step.</div>`;
      case "script":
        return `<textarea class="ksm-form-textarea" data-step-script="${i}" style="min-height:60px;" placeholder="// JavaScript to run">${esc3(step.script || "")}</textarea>`;
      case "copy":
        return `<input class="ksm-form-input" data-step-sel="${i}" type="text" placeholder="CSS selector (or leave blank for page selection)" value="${esc3(step.selector || "")}"/>`;
      case "keyboard":
        return `<input class="ksm-form-input" data-step-val="${i}" type="text" placeholder="Key combo, e.g. ctrl+a" value="${esc3(step.value || "")}"/>`;
      default:
        return "";
    }
  }
  async _save() {
    if (!this.macro.name.trim()) {
      alert("Please enter a macro name.");
      return;
    }
    if (this.macro.steps.length === 0) {
      alert("Please add at least one step.");
      return;
    }
    const msgType = this.isEdit ? MESSAGE_TYPES.UPDATE_MACRO : MESSAGE_TYPES.CREATE_MACRO;
    const res = await chrome.runtime.sendMessage({ type: msgType, payload: { macro: this.macro } });
    if (res?.success) {
      this.onSaved?.(res.macro || this.macro);
    } else {
      alert("Failed to save macro.");
    }
  }
};
function esc3(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// src/options/components/analytics-view.js
var AnalyticsView = class {
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
    const statsEl = this.container.querySelector("#av-stats");
    const chartEl = this.container.querySelector("#av-chart");
    const tableEl = this.container.querySelector("#av-table");
    if (!summary) {
      statsEl.innerHTML = '<p class="ksm-text-muted ksm-text-sm">No data yet. Use some shortcuts first!</p>';
      return;
    }
    const timeSavedLabel = summary.totalTimeSavedMinutes >= 60 ? `${Math.round(summary.totalTimeSavedMinutes / 60)}h ${summary.totalTimeSavedMinutes % 60}m` : `${summary.totalTimeSavedMinutes}m`;
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
        <div class="ksm-stat-value" style="color:${summary.totalErrors > 0 ? "var(--ksm-red)" : "var(--ksm-green)"};">${summary.totalErrors}</div>
        <div class="ksm-stat-label">Errors</div>
      </div>
    `;
    const shortcutMap = {};
    shortcuts.forEach((s) => {
      shortcutMap[s.id] = s;
    });
    const topItems = summary.topShortcuts || [];
    if (topItems.length === 0) {
      chartEl.innerHTML = '<p class="ksm-text-sm ksm-text-muted">No usage data yet.</p>';
    } else {
      const maxCount = topItems[0]?.count || 1;
      chartEl.innerHTML = topItems.map((item) => {
        const s = shortcutMap[item.shortcutId];
        const name = s?.name || item.shortcutId;
        const pct = Math.round(item.count / maxCount * 100);
        return `
          <div class="ksm-bar-row">
            <span class="ksm-bar-label" title="${esc4(name)}">${esc4(name)}</span>
            <div class="ksm-bar-track">
              <div class="ksm-bar-fill" style="width:${pct}%;"></div>
            </div>
            <span class="ksm-bar-count">${item.count}</span>
          </div>
        `;
      }).join("");
    }
    if (!raw || Object.keys(raw).length === 0) {
      tableEl.innerHTML = '<p class="ksm-text-sm ksm-text-muted">No detailed activity recorded yet.</p>';
      return;
    }
    const rows = Object.values(raw).map((record) => {
      const s = shortcutMap[record.shortcutId];
      const lastExec = record.executions.at(-1);
      const errorRate = record.executions.length > 0 ? Math.round(record.errorCount / record.executions.length * 100) : 0;
      return `
        <tr>
          <td>${esc4(s?.name || record.shortcutId)}</td>
          <td>${record.executions.length}</td>
          <td>${lastExec ? timeAgo(lastExec.timestamp) : "\u2014"}</td>
          <td>
            ${record.errorCount > 0 ? `<span class="ksm-badge ksm-badge-red">${record.errorCount} error${record.errorCount !== 1 ? "s" : ""} (${errorRate}%)</span>` : '<span class="ksm-badge ksm-badge-green">No errors</span>'}
          </td>
        </tr>
      `;
    }).join("");
    tableEl.innerHTML = `
      <table class="ksm-table">
        <thead><tr><th>Shortcut</th><th>Uses</th><th>Last used</th><th>Errors</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
};
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 6e4);
  if (mins < 1)
    return "Just now";
  if (mins < 60)
    return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function esc4(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/options/components/import-export.js
var ImportExport = class {
  constructor(container) {
    this.container = container;
    this.render();
  }
  render() {
    this.container.innerHTML = `
      <div class="ksm-card">
        <div class="ksm-card-title">Export shortcuts</div>
        <p class="ksm-text-sm ksm-text-muted" style="margin-bottom:16px;">Download all your shortcuts and macros as a JSON file. Use this to back up your configuration or share it with others.</p>
        <button class="ksm-btn ksm-btn-primary" id="ie-export-btn">\u2B07 Export to JSON</button>
        <div id="ie-export-status" style="margin-top:12px;font-size:12px;color:var(--ksm-green);display:none;">\u2713 Export successful!</div>
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
          <button class="ksm-btn ksm-btn-primary" id="ie-import-btn" disabled>\u2B06 Import</button>
        </div>

        <div id="ie-import-preview" style="display:none;margin-top:16px;"></div>
        <div id="ie-import-status" style="margin-top:12px;font-size:13px;display:none;"></div>
      </div>
    `;
    this.container.querySelector("#ie-export-btn").addEventListener("click", () => this._export());
    const fileInput = this.container.querySelector("#ie-file-input");
    const importBtn = this.container.querySelector("#ie-import-btn");
    fileInput.addEventListener("change", () => {
      importBtn.disabled = !fileInput.files?.length;
      if (fileInput.files?.length)
        this._previewFile(fileInput.files[0]);
    });
    importBtn.addEventListener("click", () => this._import(fileInput.files[0]));
  }
  async _export() {
    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.EXPORT_SHORTCUTS });
    if (!res?.success) {
      alert("Export failed.");
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ksm-shortcuts-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    const status = this.container.querySelector("#ie-export-status");
    status.style.display = "block";
    setTimeout(() => {
      status.style.display = "none";
    }, 3e3);
  }
  async _previewFile(file) {
    const preview = this.container.querySelector("#ie-import-preview");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const count = data.shortcuts?.length || 0;
      const macroCount = data.macros?.length || 0;
      preview.style.display = "block";
      preview.innerHTML = `
        <div style="background:var(--ksm-blue-light);border:1px solid var(--ksm-blue-border);border-radius:6px;padding:12px;font-size:12px;">
          <strong>Preview:</strong> ${count} shortcut${count !== 1 ? "s" : ""}${macroCount > 0 ? `, ${macroCount} macro${macroCount !== 1 ? "s" : ""}` : ""}
          ${data.exportedAt ? ` \u2014 exported ${new Date(data.exportedAt).toLocaleDateString()}` : ""}
        </div>
      `;
    } catch {
      preview.style.display = "block";
      preview.innerHTML = `<div style="color:var(--ksm-red);font-size:12px;">\u26A0 Invalid JSON file</div>`;
    }
  }
  async _import(file) {
    if (!file)
      return;
    const mode = this.container.querySelector("#ie-mode").value;
    const status = this.container.querySelector("#ie-import-status");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (mode === "replace") {
        if (!confirm("This will DELETE all existing shortcuts and replace them. Are you sure?"))
          return;
        const existing = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS });
        for (const s of existing?.shortcuts || []) {
          await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_SHORTCUT, payload: { id: s.id } });
        }
      }
      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.IMPORT_SHORTCUTS,
        payload: { ...data, merge: mode === "merge" }
      });
      if (res?.success) {
        status.style.color = "var(--ksm-green)";
        status.textContent = `\u2713 Imported ${res.added} shortcut${res.added !== 1 ? "s" : ""}${res.updated ? `, updated ${res.updated}` : ""}.`;
      } else {
        status.style.color = "var(--ksm-red)";
        status.textContent = `\u26A0 Import failed: ${res?.errors?.join(", ") || "Unknown error"}`;
      }
      status.style.display = "block";
    } catch (err) {
      status.style.display = "block";
      status.style.color = "var(--ksm-red)";
      status.textContent = `\u26A0 Error: ${err.message}`;
    }
  }
};

// src/options/options.js
var _settings = {};
var _dashboard = null;
var _analytics = null;
var _activeTab = "dashboard";
document.querySelectorAll(".ksm-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const name = tab.dataset.tab;
    switchTab(name);
  });
});
function switchTab(name) {
  _activeTab = name;
  document.querySelectorAll(".ksm-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".ksm-tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${name}`));
  if (name === "analytics" && _analytics) {
    _analytics.load();
  }
  if (name === "dashboard" && _dashboard) {
    _dashboard.load();
  }
  if (name === "macros") {
    loadMacrosList();
  }
}
async function init() {
  const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
  _settings = res?.settings || {};
  const toggle = document.getElementById("ksm-global-enabled");
  toggle.checked = _settings.enabled !== false;
  toggle.addEventListener("change", async () => {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.UPDATE_SETTINGS,
      payload: { settings: { enabled: toggle.checked } }
    });
  });
  _dashboard = new Dashboard(document.getElementById("dashboard-container"), {
    onEdit: (shortcut) => {
      openShortcutEditor(shortcut);
      switchTab("new-shortcut");
    },
    onDelete: () => {
    }
  });
  _dashboard.load();
  document.getElementById("opt-new-shortcut-btn").addEventListener("click", () => {
    openShortcutEditor(null);
    switchTab("new-shortcut");
  });
  _analytics = new AnalyticsView(document.getElementById("analytics-container"));
  renderSettings();
  new ImportExport(document.getElementById("import-export-container"));
  document.getElementById("opt-new-macro-btn").addEventListener("click", () => openMacroEditor(null));
  loadMacrosList();
}
function openShortcutEditor(shortcut) {
  const container = document.getElementById("shortcut-editor-container");
  new ShortcutEditor(container, {
    shortcut,
    onSaved: () => {
      _dashboard.load();
      switchTab("dashboard");
    },
    onCancel: () => switchTab("dashboard")
  });
}
async function loadMacrosList() {
  const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_MACROS });
  const macros = res?.macros || [];
  const container = document.getElementById("macros-list-container");
  const editorContainer = document.getElementById("macro-editor-container");
  editorContainer.style.display = "none";
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
          ${macros.map((m) => `
            <tr data-macro-id="${m.id}">
              <td style="font-weight:500;">${esc5(m.name)}</td>
              <td>${m.steps?.length || 0} step(s)</td>
              <td><span class="ksm-badge">${esc5(m.onError || "stop")}</span></td>
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
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
  container.querySelectorAll(".macro-edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = macros.find((x) => x.id === btn.dataset.id);
      if (m)
        openMacroEditor(m);
    });
  });
  container.querySelectorAll(".macro-delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this macro?"))
        return;
      await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_MACRO, payload: { id: btn.dataset.id } });
      loadMacrosList();
    });
  });
}
function openMacroEditor(macro) {
  const editorContainer = document.getElementById("macro-editor-container");
  editorContainer.style.display = "block";
  editorContainer.scrollIntoView({ behavior: "smooth" });
  new MacroBuilder(editorContainer, {
    macro,
    onSaved: () => {
      editorContainer.style.display = "none";
      loadMacrosList();
    },
    onCancel: () => {
      editorContainer.style.display = "none";
    }
  });
}
function renderSettings() {
  const container = document.getElementById("settings-container");
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
          <input type="checkbox" id="s-leader-enabled" ${s.leaderKeyEnabled ? "checked" : ""}/>
          <span class="ksm-toggle-track"></span>
          <span class="ksm-toggle-thumb"></span>
        </label>
      </div>

      <div class="ksm-form-row" id="s-leader-fields" ${!s.leaderKeyEnabled ? 'style="display:none;"' : ""}>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Leader key</label>
          <input class="ksm-form-input" id="s-leader-key" type="text" value="${esc5(s.leaderKey || "space")}" placeholder="space"/>
        </div>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Timeout (ms)</label>
          <input class="ksm-form-input" id="s-leader-timeout" type="number" value="${s.leaderTimeout || 1500}" min="500" max="5000"/>
        </div>
      </div>

      <div class="ksm-form-row" style="margin-top:8px;">
        <div class="ksm-form-group">
          <label class="ksm-form-label">Command palette shortcut</label>
          <input class="ksm-form-input" id="s-palette-key" type="text" value="${esc5(s.commandPaletteKey || "ctrl+shift+p")}"/>
        </div>
        <div class="ksm-form-group">
          <label class="ksm-form-label">Show hints shortcut</label>
          <input class="ksm-form-input" id="s-hints-key" type="text" value="${esc5(s.hintsActivationKey || "alt+h")}"/>
        </div>
      </div>
    </div>

    <div class="ksm-card" style="margin-top:16px;">
      <div class="ksm-card-title">Platform & display</div>

      <div class="ksm-form-row">
        <div class="ksm-form-group">
          <label class="ksm-form-label">Platform</label>
          <select class="ksm-form-select" id="s-platform">
            <option value="auto" ${s.platform === "auto" ? "selected" : ""}>Auto-detect</option>
            <option value="mac" ${s.platform === "mac" ? "selected" : ""}>macOS</option>
            <option value="windows" ${s.platform === "windows" ? "selected" : ""}>Windows</option>
            <option value="linux" ${s.platform === "linux" ? "selected" : ""}>Linux</option>
          </select>
        </div>
      </div>

      <div class="ksm-form-group ksm-flex-between" style="margin-top:8px;">
        <div>
          <div style="font-weight:500;font-size:13px;">Shortcut hints overlay</div>
          <div class="ksm-form-hint">Show inline labels on the current page (toggle with the hint shortcut)</div>
        </div>
        <label class="ksm-toggle">
          <input type="checkbox" id="s-show-hints" ${s.showHints !== false ? "checked" : ""}/>
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
          <input type="checkbox" id="s-analytics" ${s.analyticsEnabled !== false ? "checked" : ""}/>
          <span class="ksm-toggle-track"></span>
          <span class="ksm-toggle-thumb"></span>
        </label>
      </div>
    </div>

    <div style="margin-top:20px;">
      <button class="ksm-btn ksm-btn-primary" id="s-save">Save settings</button>
      <span id="s-save-status" style="margin-left:12px;font-size:12px;color:var(--ksm-green);display:none;">\u2713 Saved!</span>
    </div>
  `;
  const leaderToggle = container.querySelector("#s-leader-enabled");
  const leaderFields = container.querySelector("#s-leader-fields");
  leaderToggle.addEventListener("change", () => {
    leaderFields.style.display = leaderToggle.checked ? "grid" : "none";
  });
  container.querySelector("#s-save").addEventListener("click", async () => {
    const updated = {
      leaderKeyEnabled: leaderToggle.checked,
      leaderKey: container.querySelector("#s-leader-key").value.trim() || "space",
      leaderTimeout: parseInt(container.querySelector("#s-leader-timeout").value) || 1500,
      commandPaletteKey: container.querySelector("#s-palette-key").value.trim() || "ctrl+shift+p",
      hintsActivationKey: container.querySelector("#s-hints-key").value.trim() || "alt+h",
      platform: container.querySelector("#s-platform").value,
      showHints: container.querySelector("#s-show-hints").checked,
      analyticsEnabled: container.querySelector("#s-analytics").checked
    };
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.UPDATE_SETTINGS, payload: { settings: updated } });
    _settings = { ..._settings, ...updated };
    const status = container.querySelector("#s-save-status");
    status.style.display = "inline";
    setTimeout(() => {
      status.style.display = "none";
    }, 2500);
  });
}
function esc5(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
init();
