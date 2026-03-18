# Task Breakdown: Codebase Audit Bug Fixes

**Date**: 2026-03-16
**Objective**: Fix 9 bugs identified during a codebase audit of the Keyboard Shortcut Manager Chrome extension, spanning severity levels HIGH, MEDIUM, and LOW. These bugs include missing action handlers, unreachable code, null safety issues, security vulnerabilities, and functional correctness problems.
**Scope**: Only the 9 bugs listed in the audit. No new features, no refactoring beyond what is needed for the fix. Build verification (`npm run build`) after each phase.
**Affected Areas**:
- `src/content/action-executor.js` (Bugs 1, 8)
- `src/background/service-worker.js` (Bug 2)
- `src/background/executor.js` (Bug 3)
- `src/background/conflict-detector.js` (Bugs 4, 9)
- `src/content/command-palette.js` (Bug 5)
- `src/background/macro-runner.js` (Bugs 6, 7)
- `src/shared/constants.js` (Bug 2 — potentially, if a new message type is added)

---

## Phase 1: HIGH Severity — Broken Control Flow (Bugs 1, 2)

**Deliverables**: Working NAVIGATE action in content script; single, correct GET_CONFLICTS handler in service worker.

### Task 1.1 — Add NAVIGATE case to content-script `executeAction()` switch (Bug 1)

**Description**: `ACTION_TYPES.NAVIGATE` (`'navigate'`) is defined in constants but the `executeAction()` switch in `src/content/action-executor.js` (line 10-23) has no case for it, so it falls through to the `default` error branch. Add a `case ACTION_TYPES.NAVIGATE:` that calls `history.back()`, `history.forward()`, or `location.reload()` based on `action.navigateDirection`.

Note: The *background* `executor.js` already has `executeNavigateAction()` (lines 86-100) which uses `chrome.tabs.goBack/goForward/reload`. That handler works for shortcuts dispatched from the background. However, `executeMacroStep()` in `action-executor.js` (line 168) builds a pseudoAction and calls `executeAction()`, so if a macro step has type `'navigate'` it will fail in the content script. The content-script handler should use the `history` and `location` APIs since it runs in page context.

**Dependencies**: None
**Files to modify**: `src/content/action-executor.js`
**Exact location**: Add a new case between line 19 (`case ACTION_TYPES.CLIPBOARD:`) and line 21 (`default:`).
**Completion criteria**:
- [ ] `case ACTION_TYPES.NAVIGATE:` exists in the switch and calls a new `executeNavigate(action)` function
- [ ] `executeNavigate()` handles `action.navigateDirection` values `'back'` (calls `history.back()`), `'forward'` (`history.forward()`), and `'reload'` (`location.reload()`)
- [ ] Unknown directions return `{ success: false, error: '...' }`
- [ ] Returns `{ success: true, undoable: false }` on success
- [ ] `npm run build` succeeds
- [ ] Manual test: create a shortcut with action type `navigate` and direction `back`; pressing the shortcut navigates the browser back

### Task 1.2 — Resolve duplicate GET_CONFLICTS handler (Bug 2)

**Description**: In `src/background/service-worker.js`, `MESSAGE_TYPES.GET_CONFLICTS` appears as a case twice in the same switch (lines 169-172 and lines 211-215). JavaScript switch statements execute the first matching case, so the second handler (which calls `checkConflict(combo, scope, excludeId)` for single-combo conflict checking) is dead code. The first handler calls `checkAllConflicts()` which returns all pairwise conflicts — a different semantic.

The fix is to introduce a new message type `CHECK_SINGLE_CONFLICT` for the single-combo check, and rename the second handler to use it. This preserves both behaviors.

**Dependencies**: None
**Files to modify**:
- `src/shared/constants.js` — add `CHECK_SINGLE_CONFLICT: 'CHECK_SINGLE_CONFLICT'` to `MESSAGE_TYPES`
- `src/background/service-worker.js` — change the second `case MESSAGE_TYPES.GET_CONFLICTS:` (line 211) to `case MESSAGE_TYPES.CHECK_SINGLE_CONFLICT:`

**Exact location**:
- `constants.js` line 30: add the new constant near `GET_CONFLICTS`
- `service-worker.js` line 211: replace the case label

**Completion criteria**:
- [ ] `MESSAGE_TYPES.CHECK_SINGLE_CONFLICT` exists in `constants.js`
- [ ] Only one `case MESSAGE_TYPES.GET_CONFLICTS:` remains in `service-worker.js` (the `checkAllConflicts()` one, lines 169-172)
- [ ] A new `case MESSAGE_TYPES.CHECK_SINGLE_CONFLICT:` exists that calls `checkConflict(combo, scope, excludeId)` (the logic from the old second handler, lines 212-214)
- [ ] `npm run build` succeeds
- [ ] Grep the codebase for any callers currently sending `GET_CONFLICTS` with a `combo` in the payload; update them to send `CHECK_SINGLE_CONFLICT` instead. Check `src/popup/` and `src/options/` files.
- [ ] Manual test: open the popup or options page and trigger the conflict check flow; verify both "get all conflicts" and "check single combo" work

---

## Phase 2: MEDIUM Severity — Safety and Correctness (Bugs 3, 4, 5)

**Deliverables**: Null-safe DOM action response handling; canonical combo ordering in conflict detection; constant-based message types in command palette.

### Task 2.1 — Add null guard on `executeDomAction()` response (Bug 3)

**Description**: In `src/background/executor.js` line 108, the code reads `response.success` but `chrome.tabs.sendMessage()` can return `undefined` if the content script doesn't respond (e.g., tab crashed, content script not injected). The current code `if (response && !response.success)` actually already has a truthy check on `response`. Re-read the code to confirm whether the bug report is accurate.

Looking at the code again: line 108 is `if (response && !response.success)`. This IS a null check — the `response &&` guard means it won't throw on null. However, when `response` is null/undefined, the function silently succeeds (falls through without throwing), which is arguably wrong — a null response means the action was NOT confirmed successful.

**Fix**: Change the condition to also treat a null/undefined response as a failure. Replace with: `if (!response?.success)` which throws when response is falsy OR when `response.success` is falsy.

**Dependencies**: None
**Files to modify**: `src/background/executor.js`
**Exact location**: Line 108
**Completion criteria**:
- [ ] Line 108 reads `if (!response?.success)` instead of `if (response && !response.success)`
- [ ] When `response` is `undefined`, the function now throws an error (`'DOM action failed'`) instead of silently succeeding
- [ ] `npm run build` succeeds
- [ ] Manual test: temporarily break the content script message handler to return nothing; confirm executor reports a failure rather than success

### Task 2.2 — Use `buildComboString()` in conflict detector (Bug 4)

**Description**: `buildExistingCombo()` in `src/background/conflict-detector.js` (lines 90-94) joins trigger keys with `+` using simple `trigger.keys.join('+')`. This does not enforce canonical modifier ordering (ctrl before alt before shift before meta). The shared utility `buildComboString()` in `src/shared/key-utils.js` (lines 74-80) already does this correctly. The mismatch means two shortcuts with the same keys stored in different orders (`['shift','ctrl','g']` vs `['ctrl','shift','g']`) might not be detected as conflicts.

**Dependencies**: None
**Files to modify**: `src/background/conflict-detector.js`
**Exact location**:
- Line 1-8: add import for `buildComboString` from `../shared/key-utils.js`
- Lines 90-94: replace the `buildExistingCombo` function body

**Completion criteria**:
- [ ] `import { buildComboString } from '../shared/key-utils.js';` is added at the top of the file
- [ ] `buildExistingCombo()` body becomes: `return buildComboString(shortcut.trigger?.keys);` (or equivalent using the null guard from the existing code)
- [ ] The existing null/empty check (`if (!trigger || !trigger.keys || trigger.keys.length === 0) return null`) is preserved — `buildComboString` returns `''` for empty arrays which should also be treated as null
- [ ] `npm run build` succeeds
- [ ] Manual test: create two shortcuts with identical keys but stored in different modifier order; verify conflict detector catches them

### Task 2.3 — Replace hardcoded message type string in command palette (Bug 5)

**Description**: In `src/content/command-palette.js` line 152, `executeFiltered()` sends `type: 'SHORTCUT_FIRED'` as a raw string literal. All other message sends in the codebase use `MESSAGE_TYPES.SHORTCUT_FIRED`. If the constant value ever changes, this code would break silently.

**Dependencies**: None
**Files to modify**: `src/content/command-palette.js`
**Exact location**:
- Top of file (line 1-2): add `MESSAGE_TYPES` to imports — note the file currently imports from `../shared/platform.js` and `./key-interceptor.js` but NOT from `../shared/constants.js`
- Line 152: replace `'SHORTCUT_FIRED'` with `MESSAGE_TYPES.SHORTCUT_FIRED`

**Completion criteria**:
- [ ] `import { MESSAGE_TYPES } from '../shared/constants.js';` is added at the top of the file
- [ ] Line 152 uses `type: MESSAGE_TYPES.SHORTCUT_FIRED` instead of the string literal
- [ ] `npm run build` succeeds
- [ ] Manual test: open command palette (Ctrl+Shift+P), select a shortcut, confirm it still fires correctly

---

## Phase 3: MEDIUM Severity — Macro Runner Robustness (Bugs 6, 7)

**Deliverables**: Correct sub-minute delay handling; user-visible error notification on rehydration failure.

### Task 3.1 — Use `setTimeout` for sub-minute macro delays (Bug 6)

**Description**: In `src/background/macro-runner.js` line 75, `chrome.alarms.create()` is called with `delayInMinutes: delay / 60000`. Chrome enforces a minimum alarm delay of 1 minute (30 seconds in dev mode). Any `delay` value under 60000ms (1 minute) gets silently rounded up to 1 minute, making sub-minute step delays inaccurate.

For delays under 60 seconds, use `setTimeout()` instead. While `setTimeout` won't survive a service worker sleep cycle, sub-minute delays are short enough that the worker should stay alive. For delays >= 60000ms, keep using `chrome.alarms`.

**Dependencies**: None
**Files to modify**: `src/background/macro-runner.js`
**Exact location**: Lines 74-78 (the `if (delay > 0)` block)

**Completion criteria**:
- [ ] When `delay > 0 && delay < 60000`, a `setTimeout(() => executeNextStep(sessionId), delay)` is used
- [ ] When `delay >= 60000`, `chrome.alarms.create()` is used as before
- [ ] When `delay === 0`, `executeNextStep()` is called immediately (existing behavior preserved)
- [ ] `npm run build` succeeds
- [ ] Manual test: create a macro with a 2-second delay between steps; verify the delay is approximately 2 seconds, not 60 seconds

### Task 3.2 — Notify user on macro session rehydration failure (Bug 7)

**Description**: In `src/background/macro-runner.js`, both `onStepComplete()` (lines 42-46) and `onAlarm()` (lines 88-92) silently `return` when `rehydrateSession()` returns null. The user has no idea their macro stopped. Send an error notification to the active tab so the user knows what happened.

**Dependencies**: None
**Files to modify**: `src/background/macro-runner.js`
**Exact location**:
- Lines 43-44: after `if (!rehydrated) return;`
- Lines 89-90: after `if (!rehydrated) return;`

**Completion criteria**:
- [ ] When rehydration fails in `onStepComplete()`, before returning, the code sends a `MESSAGE_TYPES.LOG_ERROR` message to the tab (using `session.context.tabId` — note: since session is null here, you need to extract `tabId` from the alarm name or store it separately; alternatively, use `chrome.tabs.query({active: true, currentWindow: true})` to find the active tab)
- [ ] When rehydration fails in `onAlarm()`, same notification behavior
- [ ] The error message is descriptive, e.g. `"Macro session lost — the browser may have restarted. Please re-run the macro."`
- [ ] Also call `recordError()` so the failure shows up in analytics
- [ ] `npm run build` succeeds
- [ ] Manual test: manually delete a `macro_session_*` key from `chrome.storage.local` while a macro with a delay is running; verify the user sees an error notification

---

## Phase 4: MEDIUM Severity — Security Fix (Bug 8)

**Deliverables**: Safe clipboard transform system replacing arbitrary code execution.

### Task 4.1 — Replace `Function()` constructor with safe transform whitelist (Bug 8)

**Description**: In `src/content/action-executor.js` lines 110-113, clipboard transforms use `Function('text', \`return ${action.clipboardTransform}\`)` which is arbitrary code execution. If a user imports shortcuts from an untrusted source, the `clipboardTransform` field could contain malicious JS that runs in the page context.

Replace with a whitelist of named transforms. The `action.clipboardTransform` field should contain a transform name string (e.g. `'uppercase'`) rather than raw JS.

**Dependencies**: None
**Files to modify**: `src/content/action-executor.js`
**Exact location**: Lines 110-113 inside `executeClipboard()`, the `if (action.clipboardTransform)` block.

**Completion criteria**:
- [ ] A `CLIPBOARD_TRANSFORMS` map is defined with at least these entries: `uppercase` (`text.toUpperCase()`), `lowercase` (`text.toLowerCase()`), `trim` (`text.trim()`), `title_case`, `camel_case`, `snake_case`, `reverse`, `encode_uri` (`encodeURIComponent`), `decode_uri` (`decodeURIComponent`), `strip_html` (remove HTML tags)
- [ ] The `Function()` constructor call is removed entirely
- [ ] The replacement code looks up `action.clipboardTransform` in the whitelist map and applies the matching function; if not found, logs a warning and skips the transform (does not throw)
- [ ] No user-supplied string is ever passed to `eval`, `Function()`, or `new Function()`
- [ ] `npm run build` succeeds
- [ ] Manual test: create a clipboard shortcut with `clipboardTransform: 'uppercase'`; copy text and verify it is uppercased. Try setting `clipboardTransform: 'alert(1)'` and verify it is ignored, not executed.

---

## Phase 5: LOW Severity — Improved Scope Overlap Detection (Bug 9)

**Deliverables**: Smarter `scopesOverlap()` function that detects partial URL pattern overlaps.

### Task 5.1 — Improve `scopesOverlap()` pattern comparison (Bug 9)

**Description**: `scopesOverlap()` in `src/background/conflict-detector.js` (lines 96-107) only detects overlap when `scopeA.urlPattern === scopeB.urlPattern` (exact string match). This misses cases like `*://example.com/*` overlapping with `*://example.com/page`.

Improve the comparison to handle:
1. If either pattern is a superset of the other (e.g., `*` matches everything)
2. Glob-style patterns: extract the hostname and check if hosts match (most common case)
3. When pattern types differ (glob vs regex), conservatively return `true` (assume overlap)

This is a best-effort improvement, not a complete URL pattern algebra. Keep it pragmatic.

**Dependencies**: None
**Files to modify**: `src/background/conflict-detector.js`
**Exact location**: Lines 96-107 (the `scopesOverlap()` function)

**Completion criteria**:
- [ ] Exact string match still works (backward compatible)
- [ ] A pattern of `*` or `<all_urls>` is treated as overlapping with everything
- [ ] Two glob patterns with the same hostname are treated as overlapping (e.g., `*://example.com/*` and `*://example.com/foo`)
- [ ] When one or both patterns are regex type and they differ, function returns `true` (conservative)
- [ ] When both scopes have no `urlPattern`, function returns `false` (no overlap — current behavior)
- [ ] `npm run build` succeeds
- [ ] Manual test: create two shortcuts with `*://example.com/*` and `*://example.com/specific` scopes using the same key combo; verify conflict is detected

---

## Risk & Dependency Notes

1. **Bug 2 (duplicate handler) — caller migration**: After introducing `CHECK_SINGLE_CONFLICT`, any code in `src/popup/` or `src/options/` that sends `GET_CONFLICTS` with a `combo` payload must be updated to use the new message type. Search for all senders before considering the task done.

2. **Bug 7 (rehydration notification) — tabId availability**: When rehydration fails, the in-memory session is gone. The `tabId` needed to send a notification is not available unless it was persisted. The `persistSession()` function stores the full session object including `context.tabId`, but `rehydrateSession()` just returned null. Consider querying the active tab as a fallback.

3. **Bug 8 (clipboard transform) — backward compatibility**: Existing user shortcuts may have `clipboardTransform` fields containing raw JS expressions (e.g., `text.toUpperCase()`). After the fix, these will silently stop working because they won't match any whitelist key. Consider logging a console warning that names the unrecognized transform so users know to update their shortcuts.

4. **Bug 6 (setTimeout vs alarms)**: `setTimeout` in an MV3 service worker is not guaranteed to fire if the worker goes to sleep. For sub-minute delays this is acceptable since the worker stays alive during active message handling, but document this trade-off in a code comment.

5. **Build verification**: After every phase, run `npm run build` and reload the `dist/` folder in Chrome to verify no regressions.

## Out of Scope

- Adding automated tests (none exist in the project currently)
- Refactoring the service-worker message router beyond fixing the duplicate case
- Adding new shortcut action types beyond fixing the missing NAVIGATE handler
- Reworking the macro persistence model (only fixing the rehydration error notification)
- Full URL pattern algebra for scope overlap (only pragmatic improvements)
- UI changes to expose the new `CHECK_SINGLE_CONFLICT` message type or clipboard transform whitelist to users
