// QWERTY key position map (column, row) — 0-indexed, left to right
const KEY_POSITIONS = {
  '`': [0,0], '1': [1,0], '2': [2,0], '3': [3,0], '4': [4,0], '5': [5,0],
  '6': [6,0], '7': [7,0], '8': [8,0], '9': [9,0], '0': [10,0], '-': [11,0], '=': [12,0],
  'q': [0.5,1], 'w': [1.5,1], 'e': [2.5,1], 'r': [3.5,1], 't': [4.5,1],
  'y': [5.5,1], 'u': [6.5,1], 'i': [7.5,1], 'o': [8.5,1], 'p': [9.5,1],
  'a': [0.75,2], 's': [1.75,2], 'd': [2.75,2], 'f': [3.75,2], 'g': [4.75,2],
  'h': [5.75,2], 'j': [6.75,2], 'k': [7.75,2], 'l': [8.75,2],
  'z': [1,3], 'x': [2,3], 'c': [3,3], 'v': [4,3], 'b': [5,3],
  'n': [6,3], 'm': [7,3],
  // Modifiers (approximate positions)
  'ctrl': [-1, 3.5], 'shift': [-1, 3], 'alt': [1.5, 3.5], 'meta': [0.5, 3.5], 'cmd': [0.5, 3.5],
  'space': [5, 4],
  'enter': [13, 2], 'backspace': [13, 0], 'tab': [-1, 1], 'esc': [-1, 0],
};

// Home row keys (most comfortable)
const HOME_ROW = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l']);

/**
 * Rate the ergonomic quality of a key combo.
 * Returns a score from 0 (worst) to 100 (best).
 */
export function scoreErgonomics(combo) {
  const keys = combo.split('+');
  if (keys.length === 0) return 50;

  let totalDistance = 0;
  let count = 0;

  for (let i = 0; i < keys.length - 1; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const posA = KEY_POSITIONS[keys[i].toLowerCase()];
      const posB = KEY_POSITIONS[keys[j].toLowerCase()];
      if (posA && posB) {
        const dist = Math.sqrt(Math.pow(posA[0] - posB[0], 2) + Math.pow(posA[1] - posB[1], 2));
        totalDistance += dist;
        count++;
      }
    }
  }

  const mainKey = keys[keys.length - 1].toLowerCase();
  const isHomeRow = HOME_ROW.has(mainKey);
  const avgDist = count > 0 ? totalDistance / count : 5;

  // Base score: lower distance = higher score
  let score = Math.max(0, 100 - avgDist * 15);

  // Bonus for home row main key
  if (isHomeRow) score = Math.min(100, score + 10);

  // Penalty for 3+ modifier keys
  const modCount = keys.filter(k => ['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(k)).length;
  if (modCount >= 3) score = Math.max(0, score - 20);

  return Math.round(score);
}

/**
 * Get ergonomic suggestions for a given combo.
 * Returns array of { combo, score, reason } ordered by score descending.
 */
export function suggestAlternatives(combo) {
  const parts = combo.split('+');
  const mods = parts.filter(k => ['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(k));
  const mainKey = parts[parts.length - 1];
  const suggestions = [];

  // Suggest single-modifier + home row
  for (const mod of ['ctrl', 'alt']) {
    for (const key of ['f', 'd', 's', 'k', 'j', 'l']) {
      const candidate = `${mod}+${key}`;
      if (candidate !== combo) {
        suggestions.push({
          combo: candidate,
          score: scoreErgonomics(candidate),
          reason: `Home row key with single modifier`,
        });
      }
    }
  }

  // Suggest ctrl+shift + home row
  for (const key of ['f', 'd', 's', 'k', 'j']) {
    const candidate = `ctrl+shift+${key}`;
    if (candidate !== combo) {
      suggestions.push({
        combo: candidate,
        score: scoreErgonomics(candidate),
        reason: `Common two-modifier pattern`,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Check if a combo has obvious ergonomic issues.
 */
export function hasErgonomicIssues(combo) {
  const score = scoreErgonomics(combo);
  const parts = combo.split('+');
  const modCount = parts.filter(k => ['ctrl', 'alt', 'shift', 'meta', 'cmd'].includes(k)).length;

  return {
    hasIssues: score < 40 || modCount >= 3,
    score,
    message: score < 40
      ? 'This key combination may be uncomfortable to use repeatedly.'
      : modCount >= 3
        ? 'Three or more modifier keys can be hard to press simultaneously.'
        : null,
  };
}
