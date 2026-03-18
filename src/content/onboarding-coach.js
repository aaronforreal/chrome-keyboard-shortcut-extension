// Progressive onboarding tooltips
let _phase = 0;
let _shown = new Set();

const TIPS = [
  {
    phase: 1,
    id: 'tip_command_palette',
    message: 'Press <kbd>Ctrl+Shift+P</kbd> to open the command palette and search all shortcuts.',
    delay: 3000,
  },
  {
    phase: 1,
    id: 'tip_hint_overlay',
    message: 'Press <kbd>Alt+H</kbd> to see all shortcuts available on this page.',
    delay: 10000,
  },
  {
    phase: 2,
    id: 'tip_shortcut_create',
    message: 'Click the extension icon to quickly add a shortcut for this site.',
    delay: 5000,
  },
];

export function initOnboarding(phase) {
  _phase = phase;
  if (phase === 0) return; // Not started yet

  const stored = sessionStorage.getItem('ksm_shown_tips');
  if (stored) {
    try { _shown = new Set(JSON.parse(stored)); } catch {}
  }

  scheduleTips();
}

export function advancePhase(newPhase) {
  _phase = newPhase;
  scheduleTips();
}

function scheduleTips() {
  const pending = TIPS.filter(t => t.phase <= _phase && !_shown.has(t.id));
  for (const tip of pending) {
    setTimeout(() => showTip(tip), tip.delay);
  }
}

function showTip(tip) {
  if (_shown.has(tip.id)) return;
  _shown.add(tip.id);
  sessionStorage.setItem('ksm_shown_tips', JSON.stringify([..._shown]));

  const el = document.createElement('div');
  el.className = 'ksm-onboarding-tip';
  el.innerHTML = `
    <div class="ksm-tip-content">
      <span class="ksm-tip-icon">💡</span>
      <span>${tip.message}</span>
    </div>
    <button class="ksm-tip-close" aria-label="Dismiss">✕</button>
  `;
  document.body.appendChild(el);

  el.querySelector('.ksm-tip-close').addEventListener('click', () => el.remove());
  setTimeout(() => { if (el.parentNode) el.remove(); }, 8000);
}
