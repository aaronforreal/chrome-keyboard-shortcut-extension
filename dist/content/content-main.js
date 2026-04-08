var __KSM_CONTENT__ = (() => {
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
    if (!rawKey)
      return null;
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
  function buildComboString(keys) {
    if (!keys || keys.length === 0)
      return "";
    const mods = keys.filter((k) => MODIFIER_ORDER.includes(k) || k === "cmd");
    const mainKeys = keys.filter((k) => !MODIFIER_ORDER.includes(k) && k !== "cmd");
    const orderedMods = [...MODIFIER_ORDER, "cmd"].filter((m) => mods.includes(m));
    return [...orderedMods, ...mainKeys].join("+");
  }
  function isEditableTarget(event) {
    const tag = event.target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select")
      return true;
    if (event.target?.isContentEditable)
      return true;
    return false;
  }

  // src/content/key-interceptor.js
  var _shortcuts = [];
  var _settings = {};
  var _captureDisabled = false;
  var _leaderPending = false;
  var _leaderTimer = null;
  var _comboIndex = {};
  var _HANDLER_KEY = "__KSM_KEYDOWN_HANDLER__";
  function initKeyInterceptor(shortcuts, settings) {
    const stale = window[_HANDLER_KEY];
    if (stale) {
      document.removeEventListener("keydown", stale, true);
    }
    _shortcuts = shortcuts;
    _settings = settings;
    _rebuildIndex();
    document.addEventListener("keydown", handleKeyDown, true);
    window[_HANDLER_KEY] = handleKeyDown;
  }
  function updateShortcuts(shortcuts, settings) {
    _shortcuts = shortcuts;
    _settings = settings;
    _rebuildIndex();
  }
  function disableCapture() {
    _captureDisabled = true;
  }
  function enableCapture() {
    _captureDisabled = false;
  }
  var _refreshPending = false;
  function _triggerRefresh() {
    if (_refreshPending)
      return;
    if (!_isContextValid())
      return;
    _refreshPending = true;
    try {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SHORTCUTS }).then((response) => {
        if (response?.success && response.shortcuts?.length) {
          updateShortcuts(response.shortcuts, response.settings || {});
          console.log("[KSM] Shortcuts recovered after SW wake-up");
        }
      }).catch(() => {
      }).finally(() => {
        _refreshPending = false;
      });
    } catch {
      _refreshPending = false;
    }
  }
  function _rebuildIndex() {
    _comboIndex = {};
    for (const s of _shortcuts) {
      if (!s.enabled)
        continue;
      const key = _shortcutKey(s);
      if (!key)
        continue;
      if (!_comboIndex[key])
        _comboIndex[key] = [];
      _comboIndex[key].push(s);
    }
  }
  function _shortcutKey(shortcut) {
    const { trigger } = shortcut;
    if (!trigger)
      return null;
    if (trigger.type === "combo")
      return buildComboString(trigger.keys);
    if (trigger.type === "leader_sequence") {
      const leader = trigger.leaderKey || _settings.leaderKey || "space";
      return `${leader}>${buildComboString(trigger.keys)}`;
    }
    return null;
  }
  function _hasLeaderChildren(leaderCombo) {
    const prefix = `${leaderCombo}>`;
    return Object.keys(_comboIndex).some((k) => k.startsWith(prefix));
  }
  function _findMatch(combo) {
    const url = window.location.href;
    const candidates = _comboIndex[combo] || [];
    if (candidates.length === 0)
      return null;
    const siteSpecific = candidates.filter((s) => s.scope.type !== "global");
    if (siteSpecific.length > 0)
      return siteSpecific[0];
    const global = candidates.filter((s) => s.scope.type === "global");
    return global.length > 0 ? global[0] : null;
  }
  function _isContextValid() {
    try {
      return !!chrome.runtime?.id;
    } catch {
      return false;
    }
  }
  function handleKeyDown(event) {
    if (!_isContextValid()) {
      document.removeEventListener("keydown", handleKeyDown, true);
      return;
    }
    try {
      _handleKeyDownSafe(event);
    } catch (err) {
      document.removeEventListener("keydown", handleKeyDown, true);
    }
  }
  function _handleKeyDownSafe(event) {
    if (_captureDisabled)
      return;
    if (_settings.enabled === false)
      return;
    if (["Control", "Alt", "Shift", "Meta", "OS"].includes(event.key))
      return;
    if (Object.keys(_comboIndex).length === 0)
      _triggerRefresh();
    const combo = normalizeCombo(event);
    if (!combo)
      return;
    const paletteKey = _settings.commandPaletteKey || "ctrl+shift+p";
    if (combo === paletteKey) {
      event.preventDefault();
      event.stopPropagation();
      const { showPalette } = window.__KSM__ || {};
      if (showPalette)
        showPalette();
      return;
    }
    const hintsKey = _settings.hintsActivationKey || "alt+h";
    if (combo === hintsKey) {
      event.preventDefault();
      event.stopPropagation();
      const { toggleHintOverlay: toggleHintOverlay2 } = window.__KSM__ || {};
      if (toggleHintOverlay2)
        toggleHintOverlay2();
      return;
    }
    if (_leaderPending) {
      clearTimeout(_leaderTimer);
      _leaderPending = false;
      const leaderCombo = _settings.leaderKey || "space";
      const sequenceKey = `${leaderCombo}>${combo}`;
      const match2 = _findMatch(sequenceKey);
      if (match2) {
        event.preventDefault();
        event.stopPropagation();
        fireShortcut(match2);
      }
      return;
    }
    if (_settings.leaderKeyEnabled && combo === (_settings.leaderKey || "space")) {
      if (_hasLeaderChildren(combo)) {
        event.preventDefault();
        _leaderPending = true;
        const timeout = _settings.leaderTimeout || 1500;
        _leaderTimer = setTimeout(() => {
          _leaderPending = false;
        }, timeout);
        return;
      }
    }
    if (isEditableTarget(event)) {
      const hasMod = event.ctrlKey || event.metaKey || event.altKey;
      if (!hasMod)
        return;
    }
    const match = _findMatch(combo);
    if (match) {
      event.preventDefault();
      event.stopPropagation();
      fireShortcut(match);
    }
  }
  function fireShortcut(shortcut) {
    if (!_isContextValid())
      return;
    try {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SHORTCUT_FIRED,
        payload: {
          shortcutId: shortcut.id,
          context: { url: window.location.href }
        }
      }).catch((err) => console.warn("[KSM] Could not fire shortcut:", err));
    } catch {
    }
  }

  // src/content/undo-manager.js
  var _stack = [];
  var MAX_STACK = 50;
  function pushUndo(entry) {
    _stack.push({ ...entry, timestamp: Date.now() });
    if (_stack.length > MAX_STACK)
      _stack.shift();
  }
  function applyUndo() {
    const entry = _stack.pop();
    if (!entry)
      return false;
    try {
      switch (entry.type) {
        case "fill": {
          const el = document.querySelector(entry.selector);
          if (el) {
            el.value = entry.previousValue;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          }
          break;
        }
        case "scroll": {
          window.scrollTo({ top: entry.previousScrollY, behavior: "smooth" });
          break;
        }
        case "text_expand": {
          document.execCommand("undo");
          break;
        }
        default:
          break;
      }
      showUndoNotification(entry.type);
      return true;
    } catch (err) {
      console.warn("[KSM] Undo failed:", err);
      return false;
    }
  }
  function showUndoNotification(type) {
    const existing = document.getElementById("ksm-undo-toast");
    if (existing)
      existing.remove();
    const toast = document.createElement("div");
    toast.id = "ksm-undo-toast";
    toast.className = "ksm-toast";
    toast.textContent = `\u21A9 Undone: ${type}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2e3);
  }

  // src/content/action-executor.js
  var CLIPBOARD_TRANSFORMS = {
    uppercase: (t) => t.toUpperCase(),
    lowercase: (t) => t.toLowerCase(),
    trim: (t) => t.trim(),
    title_case: (t) => t.replace(/\b\w/g, (c) => c.toUpperCase()),
    camel_case: (t) => t.trim().replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (c) => c.toLowerCase()),
    snake_case: (t) => t.trim().replace(/\s+/g, "_").toLowerCase(),
    reverse: (t) => t.split("").reverse().join(""),
    encode_uri: (t) => encodeURIComponent(t),
    decode_uri: (t) => {
      try {
        return decodeURIComponent(t);
      } catch {
        return t;
      }
    },
    strip_html: (t) => t.replace(/<[^>]*>/g, "")
  };
  async function executeAction(action) {
    try {
      switch (action.type) {
        case ACTION_TYPES.SCROLL:
          return executeScroll(action);
        case ACTION_TYPES.CLICK:
          return executeClick(action);
        case ACTION_TYPES.FILL:
          return executeFill(action);
        case ACTION_TYPES.TEXT_EXPAND:
          return executeTextExpand(action);
        case ACTION_TYPES.CLIPBOARD:
          return executeClipboard(action);
        case ACTION_TYPES.NAVIGATE:
          return executeNavigate(action);
        default:
          return { success: false, error: `Cannot execute action type "${action.type}" in content script` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  function executeScroll(action) {
    const previousScrollY = window.scrollY;
    switch (action.scrollDirection) {
      case "up":
        window.scrollBy({ top: -(action.scrollAmount || 300), behavior: "smooth" });
        break;
      case "down":
        window.scrollBy({ top: action.scrollAmount || 300, behavior: "smooth" });
        break;
      case "top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "bottom":
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        break;
      default:
        window.scrollBy({ top: action.scrollAmount || 300, behavior: "smooth" });
    }
    pushUndo({ type: "scroll", previousScrollY });
    return { success: true, undoable: true, undoEntry: { type: "scroll", previousScrollY } };
  }
  function executeClick(action) {
    const selector = action.clickSelector;
    if (!selector)
      return { success: false, error: "No selector specified" };
    const el = document.querySelector(selector);
    if (!el)
      return { success: false, error: `Element not found: ${selector}` };
    el.click();
    return { success: true, undoable: false };
  }
  function executeFill(action) {
    const selector = action.fillSelector;
    if (!selector)
      return { success: false, error: "No selector specified" };
    const el = document.querySelector(selector);
    if (!el)
      return { success: false, error: `Element not found: ${selector}` };
    const previousValue = el.value;
    el.value = action.fillValue || "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.focus();
    pushUndo({ type: "fill", selector, previousValue });
    return {
      success: true,
      undoable: true,
      undoEntry: { type: "fill", selector, previousValue }
    };
  }
  function executeTextExpand(action) {
    const text = action.textExpansion;
    if (!text)
      return { success: false, error: "No expansion text specified" };
    const success = document.execCommand("insertText", false, text);
    if (success) {
      pushUndo({ type: "text_expand" });
      return { success: true, undoable: true };
    }
    return { success: false, error: "Could not insert text" };
  }
  async function executeClipboard(action) {
    switch (action.clipboardAction) {
      case "copy": {
        const selector = action.clipboardSelector;
        let text = "";
        if (selector) {
          const el = document.querySelector(selector);
          text = el ? el.value || el.textContent || "" : "";
        } else {
          text = window.getSelection()?.toString() || "";
        }
        if (action.clipboardTransform) {
          const fn = CLIPBOARD_TRANSFORMS[action.clipboardTransform];
          if (fn) {
            text = fn(text);
          } else {
            console.warn(`[KSM] Unknown clipboard transform: "${action.clipboardTransform}". Skipping.`);
          }
        }
        await navigator.clipboard.writeText(text);
        showToast(`Copied: ${text.slice(0, 40)}${text.length > 40 ? "\u2026" : ""}`);
        return { success: true, undoable: false };
      }
      case "paste": {
        try {
          const text = await navigator.clipboard.readText();
          const active = document.activeElement;
          if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
            const start = active.selectionStart;
            const end = active.selectionEnd;
            const prev = active.value;
            active.value = prev.slice(0, start) + text + prev.slice(end);
            active.selectionStart = active.selectionEnd = start + text.length;
            active.dispatchEvent(new Event("input", { bubbles: true }));
          }
        } catch (err) {
          return { success: false, error: "Clipboard read requires user permission" };
        }
        return { success: true, undoable: false };
      }
      default:
        return { success: false, error: `Unknown clipboard action: ${action.clipboardAction}` };
    }
  }
  function executeNavigate(action) {
    switch (action.navigateDirection) {
      case "back":
        history.back();
        break;
      case "forward":
        history.forward();
        break;
      case "reload":
        location.reload();
        break;
      default:
        return { success: false, error: `Unknown navigate direction: ${action.navigateDirection}` };
    }
    return { success: true, undoable: false };
  }
  function showToast(message) {
    const existing = document.getElementById("ksm-action-toast");
    if (existing)
      existing.remove();
    const toast = document.createElement("div");
    toast.id = "ksm-action-toast";
    toast.className = "ksm-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
  async function executeMacroStep(step) {
    if (step.type === "navigate") {
      if (!step.url)
        return { success: false, error: "No URL specified for navigate step" };
      window.location.href = step.url;
      return { success: true, undoable: false };
    }
    if (step.type === "wait") {
      return { success: true, undoable: false };
    }
    if (step.type === "keyboard") {
      return { success: false, error: "Keyboard macro steps are not supported \u2014 synthetic key events are untrusted and ignored by most handlers" };
    }
    if (step.type === "script") {
      if (!step.script)
        return { success: false, error: "No script specified for script step" };
      try {
        const fn = new Function(step.script);
        await fn();
        return { success: true, undoable: false };
      } catch (err) {
        return { success: false, error: `Script error: ${err.message}` };
      }
    }
    const pseudoAction = {
      type: step.type === "copy" ? ACTION_TYPES.CLIPBOARD : step.type,
      scrollAmount: step.value,
      scrollDirection: step.scrollDirection,
      clickSelector: step.selector,
      fillSelector: step.selector,
      fillValue: step.value,
      textExpansion: step.value,
      clipboardAction: step.type === "copy" ? "copy" : null,
      clipboardSelector: step.selector
    };
    const result = await executeAction(pseudoAction);
    return { ...result, undoEntry: result.undoEntry || null };
  }

  // src/content/text-expander.js
  var BUFFER_SIZE = 50;
  var _buffer = "";
  var _expansions = [];
  function initTextExpander(shortcuts) {
    updateExpansions(shortcuts);
    document.addEventListener("input", onInput, true);
  }
  function updateExpansions(shortcuts) {
    _expansions = shortcuts.filter((s) => s.enabled && s.trigger?.type === "text_expansion" && s.trigger?.abbreviation).map((s) => ({
      abbreviation: s.trigger.abbreviation,
      expansion: s.action?.textExpansion || "",
      id: s.id
    }));
  }
  function onInput(event) {
    const target = event.target;
    const isEditable = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
    if (!isEditable)
      return;
    const char = event.data || "";
    _buffer = (_buffer + char).slice(-BUFFER_SIZE);
    for (const exp of _expansions) {
      if (_buffer.endsWith(exp.abbreviation)) {
        const abbr = exp.abbreviation;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          const pos = target.selectionStart;
          const val = target.value;
          const start = pos - abbr.length;
          if (start < 0)
            continue;
          target.value = val.slice(0, start) + exp.expansion + val.slice(pos);
          target.selectionStart = target.selectionEnd = start + exp.expansion.length;
          target.dispatchEvent(new Event("input", { bubbles: true }));
        } else if (target.isContentEditable) {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0)
            continue;
          const range = sel.getRangeAt(0);
          range.setStart(range.startContainer, range.startOffset - abbr.length);
          range.deleteContents();
          range.insertNode(document.createTextNode(exp.expansion));
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        _buffer = "";
        break;
      }
    }
  }

  // src/content/hint-overlay.js
  var _overlay = null;
  var _visible = false;
  var _shortcuts2 = [];
  function initHintOverlay(shortcuts, settings) {
    _shortcuts2 = shortcuts;
    if (!_overlay)
      createOverlay();
  }
  function updateShortcuts2(shortcuts) {
    _shortcuts2 = shortcuts;
    if (_visible)
      renderHints();
  }
  function toggleHintOverlay() {
    if (_visible)
      hide();
    else
      show();
  }
  function show() {
    if (!_overlay)
      createOverlay();
    renderHints();
    _overlay.classList.add("ksm-hint-visible");
    _visible = true;
  }
  function hide() {
    if (_overlay)
      _overlay.classList.remove("ksm-hint-visible");
    _visible = false;
  }
  function createOverlay() {
    _overlay = document.createElement("div");
    _overlay.id = "ksm-hint-overlay";
    _overlay.className = "ksm-hint-overlay";
    document.body.appendChild(_overlay);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _visible) {
        hide();
        e.preventDefault();
      }
    }, true);
    _overlay.addEventListener("click", hide);
  }
  function renderHints() {
    if (!_overlay)
      return;
    _overlay.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "ksm-hint-panel";
    const header = document.createElement("div");
    header.className = "ksm-hint-header";
    header.innerHTML = `
    <span>\u2328 Keyboard Shortcuts</span>
    <span class="ksm-hint-close">\u2715</span>
  `;
    header.querySelector(".ksm-hint-close").addEventListener("click", hide);
    panel.appendChild(header);
    const global = _shortcuts2.filter((s) => s.scope?.type === "global");
    const local = _shortcuts2.filter((s) => s.scope?.type !== "global");
    if (local.length > 0) {
      panel.appendChild(renderGroup("On this page", local));
    }
    if (global.length > 0) {
      panel.appendChild(renderGroup("Global", global));
    }
    if (_shortcuts2.length === 0) {
      const empty = document.createElement("p");
      empty.className = "ksm-hint-empty";
      empty.textContent = "No shortcuts configured yet.";
      panel.appendChild(empty);
    }
    _overlay.appendChild(panel);
  }
  function renderGroup(title, shortcuts) {
    const group = document.createElement("div");
    group.className = "ksm-hint-group";
    const heading = document.createElement("div");
    heading.className = "ksm-hint-group-title";
    heading.textContent = title;
    group.appendChild(heading);
    for (const s of shortcuts) {
      const row = document.createElement("div");
      row.className = "ksm-hint-row";
      const keys = document.createElement("span");
      keys.className = "ksm-hint-keys";
      const comboStr = s.trigger?.keys?.join("+") || "";
      keys.textContent = formatComboDisplay(comboStr, "auto");
      const label = document.createElement("span");
      label.className = "ksm-hint-label";
      label.textContent = s.name || s.description || "Unnamed shortcut";
      row.appendChild(keys);
      row.appendChild(label);
      group.appendChild(row);
    }
    return group;
  }

  // src/content/command-palette.js
  var _palette = null;
  var _shortcuts3 = [];
  var _visible2 = false;
  var _selectedIndex = 0;
  var _filtered = [];
  function initCommandPalette(shortcuts) {
    _shortcuts3 = shortcuts;
  }
  function updateShortcuts3(shortcuts) {
    _shortcuts3 = shortcuts;
  }
  function show2() {
    if (!_palette)
      createPalette();
    disableCapture();
    _palette.classList.add("ksm-palette-visible");
    _visible2 = true;
    _selectedIndex = 0;
    renderResults("");
    const input = _palette.querySelector(".ksm-palette-input");
    if (input) {
      input.value = "";
      input.focus();
    }
  }
  function hide2() {
    if (_palette)
      _palette.classList.remove("ksm-palette-visible");
    _visible2 = false;
    enableCapture();
  }
  function createPalette() {
    _palette = document.createElement("div");
    _palette.id = "ksm-command-palette";
    _palette.className = "ksm-palette-container";
    _palette.innerHTML = `
    <div class="ksm-palette-backdrop"></div>
    <div class="ksm-palette-modal">
      <div class="ksm-palette-search-wrap">
        <svg class="ksm-palette-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input class="ksm-palette-input" type="text" placeholder="Search shortcuts\u2026" autocomplete="off" spellcheck="false"/>
        <kbd class="ksm-palette-esc">Esc</kbd>
      </div>
      <div class="ksm-palette-results"></div>
      <div class="ksm-palette-footer">
        <span><kbd>\u2191\u2193</kbd> navigate</span>
        <span><kbd>Enter</kbd> run</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>
  `;
    document.body.appendChild(_palette);
    const input = _palette.querySelector(".ksm-palette-input");
    const backdrop = _palette.querySelector(".ksm-palette-backdrop");
    input.addEventListener("input", (e) => {
      _selectedIndex = 0;
      renderResults(e.target.value);
    });
    input.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          _selectedIndex = Math.min(_selectedIndex + 1, _filtered.length - 1);
          updateSelection();
          break;
        case "ArrowUp":
          e.preventDefault();
          _selectedIndex = Math.max(_selectedIndex - 1, 0);
          updateSelection();
          break;
        case "Enter":
          e.preventDefault();
          if (_filtered[_selectedIndex])
            executeFiltered(_filtered[_selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          hide2();
          break;
      }
    });
    backdrop.addEventListener("click", hide2);
  }
  function renderResults(query) {
    const q = query.toLowerCase().trim();
    _filtered = q ? _shortcuts3.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.trigger?.keys?.join("+").toLowerCase().includes(q)
    ) : _shortcuts3.slice();
    const container = _palette.querySelector(".ksm-palette-results");
    if (!container)
      return;
    if (_filtered.length === 0) {
      container.innerHTML = '<div class="ksm-palette-empty">No shortcuts found</div>';
      return;
    }
    container.innerHTML = "";
    _filtered.forEach((s, i) => {
      const item = document.createElement("div");
      item.className = `ksm-palette-item${i === _selectedIndex ? " ksm-palette-selected" : ""}`;
      item.dataset.index = i;
      const comboStr = s.trigger?.keys?.join("+") || "";
      const display = comboStr ? formatComboDisplay(comboStr, "auto") : "";
      item.innerHTML = `
      <div class="ksm-palette-item-left">
        <span class="ksm-palette-name">${escapeHtml(s.name || "Unnamed")}</span>
        ${s.description ? `<span class="ksm-palette-desc">${escapeHtml(s.description)}</span>` : ""}
      </div>
      ${display ? `<kbd class="ksm-palette-combo">${escapeHtml(display)}</kbd>` : ""}
    `;
      item.addEventListener("mouseenter", () => {
        _selectedIndex = i;
        updateSelection();
      });
      item.addEventListener("click", () => executeFiltered(s));
      container.appendChild(item);
    });
  }
  function updateSelection() {
    const items = _palette?.querySelectorAll(".ksm-palette-item");
    if (!items)
      return;
    items.forEach((el, i) => {
      el.classList.toggle("ksm-palette-selected", i === _selectedIndex);
    });
    const selected = items[_selectedIndex];
    if (selected)
      selected.scrollIntoView({ block: "nearest" });
  }
  function executeFiltered(shortcut) {
    hide2();
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SHORTCUT_FIRED,
      payload: {
        shortcutId: shortcut.id,
        context: { url: window.location.href }
      }
    }).catch(() => {
    });
  }
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // src/content/onboarding-coach.js
  var _phase = 0;
  var _shown = /* @__PURE__ */ new Set();
  var TIPS = [
    {
      phase: 1,
      id: "tip_command_palette",
      message: "Press <kbd>Ctrl+Shift+P</kbd> to open the command palette and search all shortcuts.",
      delay: 3e3
    },
    {
      phase: 1,
      id: "tip_hint_overlay",
      message: "Press <kbd>Alt+H</kbd> to see all shortcuts available on this page.",
      delay: 1e4
    },
    {
      phase: 2,
      id: "tip_shortcut_create",
      message: "Click the extension icon to quickly add a shortcut for this site.",
      delay: 5e3
    }
  ];
  function initOnboarding(phase) {
    _phase = phase;
    if (phase === 0)
      return;
    const stored = sessionStorage.getItem("ksm_shown_tips");
    if (stored) {
      try {
        _shown = new Set(JSON.parse(stored));
      } catch {
      }
    }
    scheduleTips();
  }
  function advancePhase(newPhase) {
    _phase = newPhase;
    scheduleTips();
  }
  function scheduleTips() {
    const pending = TIPS.filter((t) => t.phase <= _phase && !_shown.has(t.id));
    for (const tip of pending) {
      setTimeout(() => showTip(tip), tip.delay);
    }
  }
  function showTip(tip) {
    if (_shown.has(tip.id))
      return;
    _shown.add(tip.id);
    sessionStorage.setItem("ksm_shown_tips", JSON.stringify([..._shown]));
    const el = document.createElement("div");
    el.className = "ksm-onboarding-tip";
    el.innerHTML = `
    <div class="ksm-tip-content">
      <span class="ksm-tip-icon">\u{1F4A1}</span>
      <span>${tip.message}</span>
    </div>
    <button class="ksm-tip-close" aria-label="Dismiss">\u2715</button>
  `;
    document.body.appendChild(el);
    el.querySelector(".ksm-tip-close").addEventListener("click", () => el.remove());
    setTimeout(() => {
      if (el.parentNode)
        el.remove();
    }, 8e3);
  }

  // src/content/content-main.js
  (function bootstrap() {
    if (window.__KSM_INITIALIZED__)
      return;
    window.__KSM_INITIALIZED__ = true;
    function _matchesScope(shortcut, url) {
      if (!shortcut.scope)
        return false;
      const { type, urlPattern, urlPatternType } = shortcut.scope;
      if (type === "global")
        return true;
      if (!urlPattern || !url)
        return false;
      try {
        if (urlPatternType === "regex")
          return new RegExp(urlPattern).test(url);
        const escaped = urlPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
        return new RegExp(`^${escaped}$`, "i").test(url);
      } catch {
        return false;
      }
    }
    window.__KSM__ = { toggleHintOverlay, showPalette: show2 };
    console.log("[KSM] Content script loaded");
    async function requestShortcutsWithRetry() {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SHORTCUTS });
          if (response?.success)
            return response;
        } catch (err) {
          if (attempt === 2)
            console.warn("[KSM] Could not load shortcuts after retry:", err);
          else
            await new Promise((r) => setTimeout(r, 300));
        }
      }
      return null;
    }
    async function init() {
      let shortcuts = [];
      let settings = {};
      const response = await requestShortcutsWithRetry();
      if (response) {
        shortcuts = response.shortcuts || [];
        settings = response.settings || {};
      } else {
        try {
          const data = await chrome.storage.sync.get({ shortcuts: {}, settings: {} });
          const currentUrl = window.location.href;
          shortcuts = Object.values(data.shortcuts || {}).filter((s) => s.enabled && _matchesScope(s, currentUrl));
          settings = data.settings || {};
          console.warn("[KSM] SW unreachable \u2014 loaded shortcuts directly from storage");
        } catch (e) {
          console.warn("[KSM] Could not load shortcuts from storage:", e);
        }
      }
      initKeyInterceptor(shortcuts, settings);
      initTextExpander(shortcuts);
      initHintOverlay(shortcuts, settings);
      initCommandPalette(shortcuts);
      initOnboarding(settings.onboardingPhase || 0);
    }
    init();
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleMessage(message).then(sendResponse).catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    });
    async function handleMessage(message) {
      const { type, payload } = message;
      switch (type) {
        case MESSAGE_TYPES.SHORTCUTS_UPDATED: {
          const { shortcuts, settings } = payload;
          updateShortcuts(shortcuts, settings);
          updateExpansions(shortcuts);
          updateShortcuts2(shortcuts);
          updateShortcuts3(shortcuts);
          return { success: true };
        }
        case MESSAGE_TYPES.EXECUTE_ACTION: {
          const result = await executeAction(payload.action);
          return result;
        }
        case MESSAGE_TYPES.EXECUTE_MACRO_STEP: {
          const { step, sessionId } = payload;
          const result = await executeMacroStep(step);
          try {
            await chrome.runtime.sendMessage({
              type: MESSAGE_TYPES.MACRO_STEP_DONE,
              payload: { sessionId, result }
            });
          } catch {
          }
          return { success: true };
        }
        case MESSAGE_TYPES.SHOW_HINT_OVERLAY:
          show();
          return { success: true };
        case MESSAGE_TYPES.HIDE_HINT_OVERLAY:
          hide();
          return { success: true };
        case MESSAGE_TYPES.SHOW_COMMAND_PALETTE:
          show2();
          return { success: true };
        case MESSAGE_TYPES.UNDO_REQUESTED:
          applyUndo();
          return { success: true };
        case MESSAGE_TYPES.LOG_ERROR: {
          const { message: msg } = payload;
          showErrorToast(msg);
          return { success: true };
        }
        case MESSAGE_TYPES.DISABLE_KEY_CAPTURE:
          disableCapture();
          return { success: true };
        case MESSAGE_TYPES.ENABLE_KEY_CAPTURE:
          enableCapture();
          return { success: true };
        case MESSAGE_TYPES.SHOW_ONBOARDING_TIP: {
          advancePhase(payload.phase);
          return { success: true };
        }
        default:
          return { success: false, error: `Unknown message: ${type}` };
      }
    }
    function showErrorToast(message) {
      const existing = document.getElementById("ksm-error-toast");
      if (existing)
        existing.remove();
      const toast = document.createElement("div");
      toast.id = "ksm-error-toast";
      toast.className = "ksm-toast ksm-toast-error";
      const icon = document.createElement("span");
      icon.textContent = "\u26A0";
      toast.appendChild(icon);
      toast.appendChild(document.createTextNode(" " + message));
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4e3);
    }
  })();
})();
