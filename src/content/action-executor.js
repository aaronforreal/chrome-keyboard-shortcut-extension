import { ACTION_TYPES } from '../shared/constants.js';
import { pushUndo } from './undo-manager.js';

const CLIPBOARD_TRANSFORMS = {
  uppercase: t => t.toUpperCase(),
  lowercase: t => t.toLowerCase(),
  trim: t => t.trim(),
  title_case: t => t.replace(/\b\w/g, c => c.toUpperCase()),
  camel_case: t => t.trim().replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toLowerCase()),
  snake_case: t => t.trim().replace(/\s+/g, '_').toLowerCase(),
  reverse: t => t.split('').reverse().join(''),
  encode_uri: t => encodeURIComponent(t),
  decode_uri: t => { try { return decodeURIComponent(t); } catch { return t; } },
  strip_html: t => t.replace(/<[^>]*>/g, ''),
};

/**
 * Execute a DOM-level action in the content script context.
 * Returns { success, error?, undoable, undoEntry? }
 */
export async function executeAction(action) {
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
    case 'up':
      window.scrollBy({ top: -(action.scrollAmount || 300), behavior: 'smooth' });
      break;
    case 'down':
      window.scrollBy({ top: action.scrollAmount || 300, behavior: 'smooth' });
      break;
    case 'top':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'bottom':
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      break;
    default:
      window.scrollBy({ top: action.scrollAmount || 300, behavior: 'smooth' });
  }

  pushUndo({ type: 'scroll', previousScrollY });
  return { success: true, undoable: true, undoEntry: { type: 'scroll', previousScrollY } };
}

function executeClick(action) {
  const selector = action.clickSelector;
  if (!selector) return { success: false, error: 'No selector specified' };

  const el = document.querySelector(selector);
  if (!el) return { success: false, error: `Element not found: ${selector}` };

  el.click();
  return { success: true, undoable: false };
}

function executeFill(action) {
  const selector = action.fillSelector;
  if (!selector) return { success: false, error: 'No selector specified' };

  const el = document.querySelector(selector);
  if (!el) return { success: false, error: `Element not found: ${selector}` };

  const previousValue = el.value;
  el.value = action.fillValue || '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.focus();

  pushUndo({ type: 'fill', selector, previousValue });
  return {
    success: true,
    undoable: true,
    undoEntry: { type: 'fill', selector, previousValue },
  };
}

function executeTextExpand(action) {
  const text = action.textExpansion;
  if (!text) return { success: false, error: 'No expansion text specified' };

  // Insert at cursor using execCommand for undo-friendliness
  const success = document.execCommand('insertText', false, text);
  if (success) {
    pushUndo({ type: 'text_expand' });
    return { success: true, undoable: true };
  }

  return { success: false, error: 'Could not insert text' };
}

async function executeClipboard(action) {
  switch (action.clipboardAction) {
    case 'copy': {
      const selector = action.clipboardSelector;
      let text = '';
      if (selector) {
        const el = document.querySelector(selector);
        text = el ? (el.value || el.textContent || '') : '';
      } else {
        text = window.getSelection()?.toString() || '';
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
      showToast(`Copied: ${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`);
      return { success: true, undoable: false };
    }
    case 'paste': {
      try {
        const text = await navigator.clipboard.readText();
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          const start = active.selectionStart;
          const end = active.selectionEnd;
          const prev = active.value;
          active.value = prev.slice(0, start) + text + prev.slice(end);
          active.selectionStart = active.selectionEnd = start + text.length;
          active.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch (err) {
        return { success: false, error: 'Clipboard read requires user permission' };
      }
      return { success: true, undoable: false };
    }
    default:
      return { success: false, error: `Unknown clipboard action: ${action.clipboardAction}` };
  }
}

function executeNavigate(action) {
  switch (action.navigateDirection) {
    case 'back':
      history.back();
      break;
    case 'forward':
      history.forward();
      break;
    case 'reload':
      location.reload();
      break;
    default:
      return { success: false, error: `Unknown navigate direction: ${action.navigateDirection}` };
  }
  return { success: true, undoable: false };
}

function showToast(message) {
  const existing = document.getElementById('ksm-action-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'ksm-action-toast';
  toast.className = 'ksm-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

/**
 * Execute a single macro step in the content script.
 */
export async function executeMacroStep(step) {
  // navigate steps use window.location, not the history-only NAVIGATE action type
  if (step.type === 'navigate') {
    if (!step.url) return { success: false, error: 'No URL specified for navigate step' };
    window.location.href = step.url;
    return { success: true, undoable: false };
  }

  // wait steps have no DOM action; the delay is handled entirely by macro-runner
  if (step.type === 'wait') {
    return { success: true, undoable: false };
  }

  // keyboard steps cannot be reliably dispatched via synthetic events (isTrusted = false)
  if (step.type === 'keyboard') {
    return { success: false, error: 'Keyboard macro steps are not supported — synthetic key events are untrusted and ignored by most handlers' };
  }

  // script steps run inline in the content script context
  if (step.type === 'script') {
    if (!step.script) return { success: false, error: 'No script specified for script step' };
    try {
      const fn = new Function(step.script);
      await fn();
      return { success: true, undoable: false };
    } catch (err) {
      return { success: false, error: `Script error: ${err.message}` };
    }
  }

  const pseudoAction = {
    type: step.type === 'copy' ? ACTION_TYPES.CLIPBOARD : step.type,
    scrollAmount: step.value,
    scrollDirection: step.scrollDirection,
    clickSelector: step.selector,
    fillSelector: step.selector,
    fillValue: step.value,
    textExpansion: step.value,
    clipboardAction: step.type === 'copy' ? 'copy' : null,
    clipboardSelector: step.selector,
  };

  const result = await executeAction(pseudoAction);
  return { ...result, undoEntry: result.undoEntry || null };
}
