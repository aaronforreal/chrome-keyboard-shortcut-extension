// In-page undo stack for DOM actions
const _stack = [];
const MAX_STACK = 50;

/**
 * Push an undo entry. The entry describes how to reverse an action.
 * @param {object} entry - { type, selector, previousValue, previousScrollY, ... }
 */
export function pushUndo(entry) {
  _stack.push({ ...entry, timestamp: Date.now() });
  if (_stack.length > MAX_STACK) _stack.shift();
}

/**
 * Pop and apply the last undo entry.
 * Returns true if an undo was performed, false if nothing to undo.
 */
export function applyUndo() {
  const entry = _stack.pop();
  if (!entry) return false;

  try {
    switch (entry.type) {
      case 'fill': {
        const el = document.querySelector(entry.selector);
        if (el) {
          el.value = entry.previousValue;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        break;
      }
      case 'scroll': {
        window.scrollTo({ top: entry.previousScrollY, behavior: 'smooth' });
        break;
      }
      case 'text_expand': {
        // Undo text expansion: replace expanded text back with abbreviation
        // This is best-effort and works for simple cases
        document.execCommand('undo');
        break;
      }
      default:
        break;
    }
    showUndoNotification(entry.type);
    return true;
  } catch (err) {
    console.warn('[KSM] Undo failed:', err);
    return false;
  }
}

function showUndoNotification(type) {
  const existing = document.getElementById('ksm-undo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ksm-undo-toast';
  toast.className = 'ksm-toast';
  toast.textContent = `↩ Undone: ${type}`;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2000);
}
