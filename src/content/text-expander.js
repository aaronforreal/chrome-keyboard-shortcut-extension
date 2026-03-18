// Rolling buffer approach for text expansion detection
const BUFFER_SIZE = 50;
let _buffer = '';
let _expansions = []; // [{ abbreviation, action }]

export function initTextExpander(shortcuts) {
  updateExpansions(shortcuts);
  document.addEventListener('input', onInput, true);
}

export function updateExpansions(shortcuts) {
  _expansions = shortcuts
    .filter(s => s.enabled && s.trigger?.type === 'text_expansion' && s.trigger?.abbreviation)
    .map(s => ({
      abbreviation: s.trigger.abbreviation,
      expansion: s.action?.textExpansion || '',
      id: s.id,
    }));
}

function onInput(event) {
  const target = event.target;
  const isEditable = (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
  if (!isEditable) return;

  const char = event.data || '';
  _buffer = (_buffer + char).slice(-BUFFER_SIZE);

  for (const exp of _expansions) {
    if (_buffer.endsWith(exp.abbreviation)) {
      // Remove the abbreviation and insert expansion
      const abbr = exp.abbreviation;

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const pos = target.selectionStart;
        const val = target.value;
        const start = pos - abbr.length;
        if (start < 0) continue;
        target.value = val.slice(0, start) + exp.expansion + val.slice(pos);
        target.selectionStart = target.selectionEnd = start + exp.expansion.length;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (target.isContentEditable) {
        // For contenteditable, use Selection API
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) continue;
        const range = sel.getRangeAt(0);
        // Move range back by abbreviation length
        range.setStart(range.startContainer, range.startOffset - abbr.length);
        range.deleteContents();
        range.insertNode(document.createTextNode(exp.expansion));
        // Move cursor to end of inserted text
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      _buffer = '';
      break;
    }
  }
}
