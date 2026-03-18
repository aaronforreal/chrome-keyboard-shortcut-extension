// Detect the current OS/platform
export function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'windows';
}

// Map a key combo string across platforms
// On Mac, Ctrl shortcuts are mapped to Cmd for display
export function mapComboForPlatform(combo, platform) {
  if (!platform || platform === 'auto') platform = detectPlatform();
  if (platform !== 'mac') return combo;
  // On Mac, display ctrl as cmd for common shortcuts
  return combo.replace(/^ctrl\+/, 'cmd+').replace(/\+ctrl\+/, '+cmd+');
}

// Get the modifier key name for the platform
export function getModifierLabel(key, platform) {
  if (!platform || platform === 'auto') platform = detectPlatform();
  const labels = {
    mac: { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘', cmd: '⌘' },
    windows: { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Win', cmd: 'Ctrl' },
    linux: { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Super', cmd: 'Ctrl' },
  };
  const map = labels[platform] || labels.windows;
  return map[key.toLowerCase()] || key;
}

// Format a combo for human-readable display
export function formatComboDisplay(combo, platform) {
  if (!platform || platform === 'auto') platform = detectPlatform();
  return combo.split('+').map(part => {
    const label = getModifierLabel(part, platform);
    if (label !== part) return label;
    // Capitalize single letters, format special keys
    if (part.length === 1) return part.toUpperCase();
    const specialKeys = {
      space: 'Space', enter: '↵', escape: 'Esc', esc: 'Esc',
      backspace: '⌫', delete: 'Del', tab: '⇥',
      up: '↑', down: '↓', left: '←', right: '→',
      f1: 'F1', f2: 'F2', f3: 'F3', f4: 'F4', f5: 'F5',
      f6: 'F6', f7: 'F7', f8: 'F8', f9: 'F9', f10: 'F10',
      f11: 'F11', f12: 'F12',
    };
    return specialKeys[part.toLowerCase()] || part.charAt(0).toUpperCase() + part.slice(1);
  }).join(platform === 'mac' ? '' : '+');
}
