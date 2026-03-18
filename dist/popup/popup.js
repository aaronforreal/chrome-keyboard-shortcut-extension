var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/shared/constants.js
var constants_exports = {};
__export(constants_exports, {
  ACTION_TYPES: () => ACTION_TYPES,
  BROWSER_COMMON_SHORTCUTS: () => BROWSER_COMMON_SHORTCUTS,
  BROWSER_RESERVED_SHORTCUTS: () => BROWSER_RESERVED_SHORTCUTS,
  CONDITION_TYPES: () => CONDITION_TYPES,
  CONFLICT_TIERS: () => CONFLICT_TIERS,
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  MESSAGE_TYPES: () => MESSAGE_TYPES,
  SCOPE_TYPES: () => SCOPE_TYPES,
  STORAGE_KEYS: () => STORAGE_KEYS,
  TRIGGER_TYPES: () => TRIGGER_TYPES
});
var MESSAGE_TYPES, ACTION_TYPES, TRIGGER_TYPES, SCOPE_TYPES, CONDITION_TYPES, CONFLICT_TIERS, STORAGE_KEYS, DEFAULT_SETTINGS, BROWSER_RESERVED_SHORTCUTS, BROWSER_COMMON_SHORTCUTS;
var init_constants = __esm({
  "src/shared/constants.js"() {
    MESSAGE_TYPES = {
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
    ACTION_TYPES = {
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
    TRIGGER_TYPES = {
      COMBO: "combo",
      LEADER_SEQUENCE: "leader_sequence",
      TEXT_EXPANSION: "text_expansion"
    };
    SCOPE_TYPES = {
      GLOBAL: "global",
      SITE: "site",
      PAGE: "page"
    };
    CONDITION_TYPES = {
      URL_CONTAINS: "url_contains",
      URL_MATCHES: "url_matches",
      ELEMENT_EXISTS: "element_exists",
      ELEMENT_NOT_EXISTS: "element_not_exists"
    };
    CONFLICT_TIERS = {
      NONE: "none",
      BROWSER_RESERVED: "browser_reserved",
      BROWSER_COMMON: "browser_common",
      EXTENSION: "extension"
    };
    STORAGE_KEYS = {
      SHORTCUTS: "shortcuts",
      MACROS: "macros",
      SETTINGS: "settings",
      ANALYTICS: "analytics",
      UNDO_STACK: "undo_stack"
    };
    DEFAULT_SETTINGS = {
      enabled: true,
      leaderKeyEnabled: false,
      leaderKey: "space",
      leaderTimeout: 1500,
      showHints: true,
      hintsActivationKey: "alt+h",
      commandPaletteKey: "ctrl+shift+p",
      theme: "light",
      onboardingPhase: 0,
      onboardingCompletedAt: null,
      analyticsEnabled: true,
      platform: "auto",
      exportFormat: "json"
    };
    BROWSER_RESERVED_SHORTCUTS = /* @__PURE__ */ new Set([
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
    BROWSER_COMMON_SHORTCUTS = /* @__PURE__ */ new Set([
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
  }
});

// src/popup/popup.js
init_constants();

// src/popup/components/status-bar.js
init_constants();
function renderStatusBar(container, { settings, tab, onToggle, onOpenOptions }) {
  container.innerHTML = `
    <div class="ksm-popup-header">
      <div class="ksm-popup-header-left">
        <div class="ksm-logo">\u2328</div>
        <span class="ksm-app-name">Shortcuts</span>
      </div>
      <div class="ksm-header-actions">
        <label class="ksm-toggle" title="${settings.enabled ? "Enabled \u2014 click to disable" : "Disabled \u2014 click to enable"}">
          <input type="checkbox" id="ksm-enabled-toggle" ${settings.enabled ? "checked" : ""}/>
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
  container.querySelector("#ksm-enabled-toggle").addEventListener("change", async (e) => {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TOGGLE_EXTENSION,
      payload: { enabled: e.target.checked }
    });
    onToggle(e.target.checked);
  });
  container.querySelector("#ksm-open-options").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    if (onOpenOptions)
      onOpenOptions();
  });
}

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

// src/popup/components/shortcut-list.js
function renderShortcutList(container, { shortcuts, tab }) {
  const url = tab?.url || "";
  const hostname = getHostname(url);
  const siteShortcuts = shortcuts.filter((s) => s.scope?.type !== "global");
  const globalShortcuts = shortcuts.filter((s) => s.scope?.type === "global");
  if (shortcuts.length === 0) {
    container.innerHTML = `
      <div class="ksm-empty-state">
        <p>No shortcuts for this page yet.</p>
      </div>
    `;
    return;
  }
  let html = "";
  html += `
    <div class="ksm-site-info">
      <div class="ksm-site-host">\u{1F310} ${escapeHtml(hostname)}</div>
      <div class="ksm-site-count">${shortcuts.length} shortcut${shortcuts.length !== 1 ? "s" : ""} active</div>
    </div>
  `;
  if (siteShortcuts.length > 0) {
    html += '<div class="ksm-section-title">On this site</div>';
    html += siteShortcuts.map((s) => renderRow(s)).join("");
  }
  if (globalShortcuts.length > 0) {
    html += '<div class="ksm-section-title">Global</div>';
    html += globalShortcuts.map((s) => renderRow(s)).join("");
  }
  container.innerHTML = html;
}
function renderRow(s) {
  const keys = s.trigger?.keys?.join("+") || "";
  const display = keys ? formatComboDisplay(keys, "auto") : "\u2014";
  const typeLabel = s.action?.type || "action";
  const isLeader = s.trigger?.type === "leader_sequence";
  const leaderKey = s.trigger?.leaderKey || "space";
  const displayKeys = isLeader ? `${leaderKey} \u203A ${display}` : display;
  return `
    <div class="ksm-shortcut-item" data-id="${s.id}">
      <span class="ksm-shortcut-keys">${escapeHtml(displayKeys)}</span>
      <span class="ksm-shortcut-name">${escapeHtml(s.name || "Unnamed")}</span>
      <span class="ksm-shortcut-type">${escapeHtml(typeLabel)}</span>
    </div>
  `;
}
function getHostname(url) {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}
function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// src/popup/components/quick-add.js
init_constants();

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

// src/shared/validators.js
init_constants();
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

// src/popup/components/quick-add.js
function renderQuickAdd(container, { tab, onSaved }) {
  container.innerHTML = `
    <div class="ksm-quick-add" id="ksm-quick-add">
      <div class="ksm-quick-add-title">+ New Shortcut</div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">Name</label>
        <input class="ksm-form-input" id="qa-name" type="text" placeholder="e.g. Open Gmail" autocomplete="off"/>
      </div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">Key combination</label>
        <div class="ksm-key-recorder" id="qa-key-recorder" tabindex="0">Click to record\u2026</div>
      </div>

      <div class="ksm-form-group">
        <label class="ksm-form-label">URL to open</label>
        <input class="ksm-form-input" id="qa-url" type="url" placeholder="https://\u2026"/>
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
  const recorder = container.querySelector("#qa-key-recorder");
  const conflictEl = container.querySelector("#qa-conflict");
  recorder.addEventListener("click", () => startRecording(recorder));
  recorder.addEventListener("keydown", (e) => {
    if (!recorder.classList.contains("recording"))
      return;
    e.preventDefault();
    e.stopPropagation();
    const combo = normalizeCombo(e);
    if (!combo)
      return;
    recordedCombo = combo;
    recorder.textContent = combo;
    recorder.classList.remove("recording");
    checkConflict(combo);
  });
  container.querySelector("#qa-cancel").addEventListener("click", () => {
    container.querySelector("#ksm-quick-add").classList.remove("open");
  });
  container.querySelector("#qa-save").addEventListener("click", () => saveShortcut({ tab, onSaved, container, recordedCombo }));
}
function startRecording(recorder) {
  recorder.classList.add("recording");
  recorder.textContent = "Press keys\u2026";
  recorder.focus();
}
async function checkConflict(combo) {
  const { BROWSER_RESERVED_SHORTCUTS: BROWSER_RESERVED_SHORTCUTS2, BROWSER_COMMON_SHORTCUTS: BROWSER_COMMON_SHORTCUTS2 } = await Promise.resolve().then(() => (init_constants(), constants_exports));
  const el = document.getElementById("qa-conflict");
  if (!el)
    return;
  if (BROWSER_RESERVED_SHORTCUTS2.has(combo)) {
    el.style.display = "block";
    el.style.background = "#FEF2F2";
    el.style.color = "#EF4444";
    el.textContent = `\u26A0 "${combo}" is reserved by the browser.`;
  } else if (BROWSER_COMMON_SHORTCUTS2.has(combo)) {
    el.style.display = "block";
    el.style.background = "#FFFBEB";
    el.style.color = "#D97706";
    el.textContent = `\u26A0 "${combo}" is a common browser shortcut and will be overridden.`;
  } else {
    el.style.display = "none";
  }
}
async function saveShortcut({ tab, onSaved, container, recordedCombo }) {
  const name = container.querySelector("#qa-name").value.trim();
  const url = container.querySelector("#qa-url").value.trim();
  const scopeType = container.querySelector("#qa-scope").value;
  if (!name) {
    alert("Please enter a name.");
    return;
  }
  if (!recordedCombo) {
    alert("Please record a key combination.");
    return;
  }
  if (!url) {
    alert("Please enter a URL.");
    return;
  }
  const hostname = tab?.url ? new URL(tab.url).hostname : null;
  const def = createShortcutDefaults({
    name,
    trigger: { type: "combo", keys: recordedCombo.split("+"), leaderKey: null, leaderTimeout: 1500, abbreviation: null },
    scope: {
      type: scopeType,
      urlPattern: scopeType === "site" && hostname ? `*://${hostname}/*` : null,
      urlPatternType: "glob"
    },
    action: { type: "url", url, urlTarget: "new_tab" }
  });
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.CREATE_SHORTCUT,
    payload: { shortcut: def }
  });
  if (response?.success) {
    container.querySelector("#ksm-quick-add").classList.remove("open");
    if (onSaved)
      onSaved(response.shortcut);
  } else {
    alert(`Error: ${response?.errors?.join(", ") || "Failed to save"}`);
  }
}
function openQuickAdd(container) {
  const el = container.querySelector("#ksm-quick-add");
  if (el)
    el.classList.add("open");
}

// src/popup/popup.js
var _shortcuts = [];
var _settings = {};
var _tab = null;
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  _tab = tab;
  const settingsRes = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SETTINGS });
  _settings = settingsRes?.settings || {};
  const shortcutsRes = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_ALL_SHORTCUTS });
  const allShortcuts = shortcutsRes?.shortcuts || [];
  const url = tab?.url || "";
  _shortcuts = allShortcuts.filter((s) => {
    if (!s.enabled)
      return false;
    if (s.scope?.type === "global")
      return true;
    if (!s.scope?.urlPattern)
      return false;
    return matchesUrl(s.scope, url);
  });
  render();
}
function render() {
  renderStatusBar(document.getElementById("ksm-status-bar"), {
    settings: _settings,
    tab: _tab,
    onToggle: (enabled) => {
      _settings = { ..._settings, enabled };
      render();
    },
    onOpenOptions: () => window.close()
  });
  renderShortcutList(document.getElementById("ksm-shortcut-list"), {
    shortcuts: _shortcuts,
    tab: _tab
  });
  renderQuickAdd(document.getElementById("ksm-quick-add-area"), {
    tab: _tab,
    onSaved: (shortcut) => {
      _shortcuts = [..._shortcuts, shortcut];
      renderShortcutList(document.getElementById("ksm-shortcut-list"), {
        shortcuts: _shortcuts,
        tab: _tab
      });
    }
  });
  document.getElementById("ksm-add-btn").addEventListener("click", () => {
    openQuickAdd(document.getElementById("ksm-quick-add-area"));
  });
  document.getElementById("ksm-dashboard-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
}
function matchesUrl(scope, url) {
  if (!scope.urlPattern || !url)
    return false;
  try {
    if (scope.urlPatternType === "regex") {
      return new RegExp(scope.urlPattern).test(url);
    }
    const regex = globToRegex(scope.urlPattern);
    return regex.test(url);
  } catch {
    return false;
  }
}
function globToRegex(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}
init();
